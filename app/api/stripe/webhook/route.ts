import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }
    return _supabaseAdmin
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
        console.error('[Stripe Webhook] Missing signature')
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('[Stripe Webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                await handleCheckoutComplete(session)
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionUpdate(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionCancelled(subscription)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentSucceeded(invoice)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                await handlePaymentFailed(invoice)
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('[Stripe Webhook] Error processing event:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (!userId || !planId) {
        console.error('[Stripe Webhook] Missing metadata in checkout session')
        return
    }

    console.log(`[Stripe Webhook] Checkout complete for user ${userId}, plan ${planId}`)

    const supabase = getSupabaseAdmin()

    // Update user profile with subscription info
    const { error } = await supabase
        .from('profiles')
        .update({
            subscription_tier: planId,
            subscription_status: 'active',
            stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)

    if (error) {
        console.error('[Stripe Webhook] Failed to update profile:', error)
        throw error
    }

    // Record in subscription history
    await supabase.from('subscription_history').insert({
        user_id: userId,
        stripe_subscription_id: session.subscription as string,
        plan: planId,
        status: 'active',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
    })

    console.log(`[Stripe Webhook] User ${userId} subscribed to ${planId} plan`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const supabase = getSupabaseAdmin()

    // Find user by Stripe customer ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!profile) {
        console.error(`[Stripe Webhook] No profile found for customer ${customerId}`)
        return
    }

    const status = subscription.status === 'active' ? 'active' :
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'canceled' ? 'cancelled' : subscription.status

    // Get period dates from subscription items
    const subscriptionItem = subscription.items?.data[0]
    const periodStart = subscriptionItem?.current_period_start
    const periodEnd = subscriptionItem?.current_period_end

    await supabase
        .from('profiles')
        .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            ...(periodStart && { subscription_period_start: new Date(periodStart * 1000).toISOString() }),
            ...(periodEnd && { subscription_period_end: new Date(periodEnd * 1000).toISOString() }),
        })
        .eq('id', profile.id)

    console.log(`[Stripe Webhook] Updated subscription status for user ${profile.id}: ${status}`)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!profile) {
        console.error(`[Stripe Webhook] No profile found for customer ${customerId}`)
        return
    }

    await supabase
        .from('profiles')
        .update({
            subscription_tier: 'free',
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
        })
        .eq('id', profile.id)

    // Record cancellation in history
    await supabase.from('subscription_history').insert({
        user_id: profile.id,
        stripe_subscription_id: subscription.id,
        plan: 'cancelled',
        status: 'cancelled',
    })

    console.log(`[Stripe Webhook] Subscription cancelled for user ${profile.id}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!profile) return

    // Reset AI tokens on successful payment (new billing period)
    await supabase
        .from('profiles')
        .update({
            ai_tokens_used: 0,
            ai_tokens_reset_at: new Date().toISOString(),
            subscription_status: 'active',
        })
        .eq('id', profile.id)

    console.log(`[Stripe Webhook] Payment succeeded, reset AI tokens for user ${profile.id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    if (!profile) return

    await supabase
        .from('profiles')
        .update({
            subscription_status: 'past_due',
        })
        .eq('id', profile.id)

    console.log(`[Stripe Webhook] Payment failed for user ${profile.id}`)
}
