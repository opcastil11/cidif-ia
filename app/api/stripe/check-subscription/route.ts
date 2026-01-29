import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

// Admin endpoint to check subscription status - requires email parameter
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

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

        if (profileError) {
            return NextResponse.json({
                error: 'Profile not found',
                details: profileError.message
            }, { status: 404 })
        }

        // 2. Check Stripe customer if exists
        let stripeCustomer = null
        let stripeSubscriptions: unknown[] = []

        if (profile.stripe_customer_id) {
            try {
                stripeCustomer = await stripe.customers.retrieve(profile.stripe_customer_id)

                // Get subscriptions for this customer
                const subs = await stripe.subscriptions.list({
                    customer: profile.stripe_customer_id,
                    limit: 10,
                })
                stripeSubscriptions = subs.data.map(sub => ({
                    id: sub.id,
                    status: sub.status,
                    current_period_start: new Date(sub.items.data[0]?.current_period_start * 1000).toISOString(),
                    current_period_end: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(),
                    plan: sub.items.data[0]?.price?.id,
                    created: new Date(sub.created * 1000).toISOString(),
                }))
            } catch (stripeError) {
                console.error('[Check Subscription] Stripe error:', stripeError)
            }
        }

        // 3. Also search Stripe by email (in case customer ID wasn't saved)
        const stripeCustomersByEmail: unknown[] = []
        try {
            const customers = await stripe.customers.list({
                email: email,
                limit: 10,
            })

            for (const customer of customers.data) {
                const subs = await stripe.subscriptions.list({
                    customer: customer.id,
                    limit: 10,
                })
                stripeCustomersByEmail.push({
                    customer_id: customer.id,
                    name: customer.name,
                    created: new Date(customer.created * 1000).toISOString(),
                    subscriptions: subs.data.map(sub => ({
                        id: sub.id,
                        status: sub.status,
                        current_period_start: new Date(sub.items.data[0]?.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(sub.items.data[0]?.current_period_end * 1000).toISOString(),
                        plan: sub.items.data[0]?.price?.id,
                        created: new Date(sub.created * 1000).toISOString(),
                    }))
                })
            }
        } catch (stripeError) {
            console.error('[Check Subscription] Stripe email search error:', stripeError)
        }

        // 4. Get subscription history from Supabase
        const { data: subscriptionHistory } = await supabaseAdmin
            .from('subscription_history')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            profile: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                subscription_tier: profile.subscription_tier,
                subscription_status: profile.subscription_status,
                stripe_customer_id: profile.stripe_customer_id,
                stripe_subscription_id: profile.stripe_subscription_id,
                subscription_period_start: profile.subscription_period_start,
                subscription_period_end: profile.subscription_period_end,
            },
            stripeCustomer: stripeCustomer ? {
                id: (stripeCustomer as { id: string }).id,
                email: (stripeCustomer as { email: string }).email,
                name: (stripeCustomer as { name: string }).name,
            } : null,
            stripeSubscriptions,
            stripeCustomersByEmail,
            subscriptionHistory,
            diagnosis: diagnoseIssue(profile, stripeSubscriptions, stripeCustomersByEmail),
        })

    } catch (error) {
        console.error('[Check Subscription] Error:', error)
        return NextResponse.json({
            error: 'Failed to check subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function diagnoseIssue(profile: any, stripeSubscriptions: any[], stripeCustomersByEmail: any[]): string[] {
    const issues: string[] = []

    // Check if profile has free tier but Stripe shows active subscription
    if (profile.subscription_tier === 'free') {
        // Check if there's an active subscription in Stripe by customer ID
        const activeSubById = stripeSubscriptions.find(s => s.status === 'active')
        if (activeSubById) {
            issues.push(`ISSUE: Profile shows 'free' but Stripe has active subscription ${activeSubById.id}`)
            issues.push('FIX: Webhook may not have fired. Need to update profile.subscription_tier')
        }

        // Check if there's an active subscription in Stripe by email
        for (const customer of stripeCustomersByEmail) {
            const activeSub = customer.subscriptions.find((s: { status: string }) => s.status === 'active')
            if (activeSub) {
                if (profile.stripe_customer_id !== customer.customer_id) {
                    issues.push(`ISSUE: Stripe customer ${customer.customer_id} has active subscription but profile uses different customer ID`)
                    issues.push('FIX: Need to update profile.stripe_customer_id and subscription_tier')
                }
            }
        }
    }

    // Check if stripe_customer_id is missing but subscriptions exist
    if (!profile.stripe_customer_id && stripeCustomersByEmail.length > 0) {
        issues.push(`ISSUE: Profile missing stripe_customer_id but Stripe has ${stripeCustomersByEmail.length} customer(s) with this email`)
        issues.push('FIX: Need to link profile to Stripe customer')
    }

    // Check if subscription_status is inconsistent
    if (profile.subscription_tier !== 'free' && profile.subscription_status !== 'active') {
        issues.push(`ISSUE: Profile has tier '${profile.subscription_tier}' but status is '${profile.subscription_status}'`)
    }

    if (issues.length === 0) {
        issues.push('No issues detected. Profile and Stripe appear to be in sync.')
    }

    return issues
}
