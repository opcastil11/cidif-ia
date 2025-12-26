import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, getPriceForCountry } from '@/lib/stripe'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { planId, successUrl, cancelUrl } = body

        if (!planId || !['standard', 'max'].includes(planId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const plan = PLANS[planId as keyof typeof PLANS]

        // Get user profile for country-based pricing
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, country, email, full_name')
            .eq('id', user.id)
            .single()

        const countryCode = profile?.country || 'US'
        const adjustedPrice = getPriceForCountry(plan.price, countryCode)

        // Get or create Stripe customer
        let customerId = profile?.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: profile?.full_name || undefined,
                metadata: {
                    supabase_user_id: user.id,
                },
            })
            customerId = customer.id

            // Save customer ID to profile
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id)
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `CIDIF.TECH ${plan.name} Plan`,
                            description: plan.description,
                        },
                        unit_amount: adjustedPrice * 100, // Stripe uses cents
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user.id,
                plan_id: planId,
                country: countryCode,
            },
            success_url: successUrl || `${request.headers.get('origin')}/dashboard?subscription=success`,
            cancel_url: cancelUrl || `${request.headers.get('origin')}/dashboard?subscription=cancelled`,
            allow_promotion_codes: true,
        })

        console.log(`[Stripe Checkout] Created session ${session.id} for user ${user.id}, plan ${planId}`)

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error) {
        console.error('[Stripe Checkout Error]', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
