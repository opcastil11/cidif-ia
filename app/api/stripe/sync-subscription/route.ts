import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Admin endpoint to sync subscription status from Stripe to Supabase
export async function POST(request: NextRequest) {
    const { email } = await request.json()

    if (!email) {
        return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 1. Get profile from Supabase
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({
                error: 'Profile not found',
                details: profileError?.message
            }, { status: 404 })
        }

        console.log(`[Sync Subscription] Processing ${email}, current tier: ${profile.subscription_tier}`)

        // 2. Search Stripe customers by email
        const customers = await stripe.customers.list({
            email: email,
            limit: 10,
        })

        if (customers.data.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No Stripe customers found with this email',
                profile: {
                    subscription_tier: profile.subscription_tier,
                    subscription_status: profile.subscription_status,
                }
            })
        }

        // 3. Find active subscription across all customers
        let activeSubscription = null
        let activeCustomerId = null

        for (const customer of customers.data) {
            const subs = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 5,
            })

            if (subs.data.length > 0) {
                activeSubscription = subs.data[0]
                activeCustomerId = customer.id
                break
            }
        }

        if (!activeSubscription) {
            // No active subscription found - check if profile needs to be set to free
            if (profile.subscription_tier !== 'free') {
                const { error: updateError } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_tier: 'free',
                        subscription_status: 'cancelled',
                        stripe_customer_id: customers.data[0]?.id || profile.stripe_customer_id,
                    })
                    .eq('id', profile.id)

                if (updateError) {
                    throw updateError
                }

                return NextResponse.json({
                    success: true,
                    action: 'downgraded_to_free',
                    message: 'No active Stripe subscription found. Profile updated to free tier.',
                })
            }

            return NextResponse.json({
                success: true,
                action: 'no_change',
                message: 'No active Stripe subscription found and profile is already on free tier.',
            })
        }

        // 4. Determine plan from Stripe price ID
        const priceId = activeSubscription.items.data[0]?.price?.id
        let planId = 'standard' // Default to standard

        // Check against known price IDs
        if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) {
            planId = 'standard'
        } else if (priceId === process.env.STRIPE_MAX_PRICE_ID) {
            planId = 'max'
        } else {
            // Try to determine from price amount
            const priceAmount = activeSubscription.items.data[0]?.price?.unit_amount
            if (priceAmount && priceAmount >= 10000) { // $100 or more
                planId = 'max'
            }
        }

        console.log(`[Sync Subscription] Found active subscription: ${activeSubscription.id}, price: ${priceId}, determined plan: ${planId}`)

        // 5. Get period dates
        const subscriptionItem = activeSubscription.items?.data[0]
        const periodStart = subscriptionItem?.current_period_start
        const periodEnd = subscriptionItem?.current_period_end

        // 6. Update profile with subscription info
        const updateData = {
            subscription_tier: planId,
            subscription_status: 'active',
            stripe_customer_id: activeCustomerId,
            stripe_subscription_id: activeSubscription.id,
            ...(periodStart && { subscription_period_start: new Date(periodStart * 1000).toISOString() }),
            ...(periodEnd && { subscription_period_end: new Date(periodEnd * 1000).toISOString() }),
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', profile.id)

        if (updateError) {
            throw updateError
        }

        console.log(`[Sync Subscription] Updated profile for ${email}: ${JSON.stringify(updateData)}`)

        return NextResponse.json({
            success: true,
            action: 'synced',
            message: `Subscription synced! Profile updated to ${planId} plan.`,
            details: {
                previousTier: profile.subscription_tier,
                newTier: planId,
                stripeSubscriptionId: activeSubscription.id,
                stripeCustomerId: activeCustomerId,
                periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            }
        })

    } catch (error) {
        console.error('[Sync Subscription] Error:', error)
        return NextResponse.json({
            error: 'Failed to sync subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
