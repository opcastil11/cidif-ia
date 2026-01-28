import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, getPriceForCountry } from '@/lib/stripe'

// Helper to get base URL from request
function getBaseUrl(request: NextRequest): string {
    const origin = request.headers.get('origin')
    if (origin) return origin

    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    if (host) return `${protocol}://${host}`

    // Fallback to production URL
    return 'https://cidif-ia.vercel.app'
}

export async function POST(request: NextRequest) {
    console.log('[Stripe Checkout] Starting checkout request')

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.log('[Stripe Checkout] No user found - unauthorized')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log(`[Stripe Checkout] User authenticated: ${user.id}`)

        const body = await request.json()
        const { planId, successUrl, cancelUrl, locale } = body

        console.log(`[Stripe Checkout] Request body: planId=${planId}, locale=${locale}`)

        if (!planId || !['standard', 'max'].includes(planId)) {
            console.log(`[Stripe Checkout] Invalid plan: ${planId}`)
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const plan = PLANS[planId as keyof typeof PLANS]

        // Get user profile for country-based pricing
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id, country, email, full_name')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.log(`[Stripe Checkout] Profile error: ${profileError.message}`)
        }

        const countryCode = profile?.country || 'US'
        const adjustedPrice = getPriceForCountry(plan.price, countryCode)

        console.log(`[Stripe Checkout] Country: ${countryCode}, Price: $${adjustedPrice}`)

        // Get or create Stripe customer
        let customerId = profile?.stripe_customer_id

        if (!customerId) {
            console.log('[Stripe Checkout] Creating new Stripe customer')
            const customer = await stripe.customers.create({
                email: user.email,
                name: profile?.full_name || undefined,
                metadata: {
                    supabase_user_id: user.id,
                },
            })
            customerId = customer.id
            console.log(`[Stripe Checkout] Created customer: ${customerId}`)

            // Save customer ID to profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id)

            if (updateError) {
                console.log(`[Stripe Checkout] Error saving customer ID: ${updateError.message}`)
            }
        } else {
            console.log(`[Stripe Checkout] Using existing customer: ${customerId}`)
        }

        // Build URLs with locale support
        const baseUrl = getBaseUrl(request)
        const localePrefix = locale && locale !== 'es' ? `/${locale}` : ''
        const finalSuccessUrl = successUrl || `${baseUrl}${localePrefix}/dashboard/billing?subscription=success`
        const finalCancelUrl = cancelUrl || `${baseUrl}${localePrefix}/dashboard/billing?subscription=cancelled`

        console.log(`[Stripe Checkout] URLs - Success: ${finalSuccessUrl}, Cancel: ${finalCancelUrl}`)

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
            success_url: finalSuccessUrl,
            cancel_url: finalCancelUrl,
            allow_promotion_codes: true,
        })

        console.log(`[Stripe Checkout] Created session ${session.id} for user ${user.id}, plan ${planId}`)

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error) {
        console.error('[Stripe Checkout Error]', error)

        // Return more detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const errorType = error instanceof Error ? error.name : 'UnknownError'

        console.error(`[Stripe Checkout] Error type: ${errorType}, Message: ${errorMessage}`)

        return NextResponse.json(
            {
                error: 'Failed to create checkout session',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                type: errorType
            },
            { status: 500 }
        )
    }
}
