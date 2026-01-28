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

interface ProfileData {
    stripe_customer_id: string | null
    country: string | null
    email: string | null
    full_name: string | null
}

export async function POST(request: NextRequest) {
    console.log('[Stripe Checkout] Starting checkout request')

    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error('[Stripe Checkout] Auth error:', authError.message)
            return NextResponse.json({ error: 'Authentication error', code: 'AuthError' }, { status: 401 })
        }

        if (!user) {
            console.log('[Stripe Checkout] No user found - unauthorized')
            return NextResponse.json({ error: 'Unauthorized', code: 'NoUser' }, { status: 401 })
        }

        console.log(`[Stripe Checkout] User authenticated: ${user.id}, email: ${user.email}`)

        let body
        try {
            body = await request.json()
        } catch (parseError) {
            console.error('[Stripe Checkout] JSON parse error:', parseError)
            return NextResponse.json({ error: 'Invalid request body', code: 'ParseError' }, { status: 400 })
        }

        const { planId, successUrl, cancelUrl, locale } = body

        console.log(`[Stripe Checkout] Request body: planId=${planId}, locale=${locale}`)

        if (!planId || !['standard', 'max'].includes(planId)) {
            console.log(`[Stripe Checkout] Invalid plan: ${planId}`)
            return NextResponse.json({ error: 'Invalid plan', code: 'InvalidPlan' }, { status: 400 })
        }

        const plan = PLANS[planId as keyof typeof PLANS]

        // Get user profile for country-based pricing
        // First try with Stripe fields, then fallback without them
        let profileData: ProfileData | null = null

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_customer_id, country, email, full_name')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error(`[Stripe Checkout] Profile error (code: ${profileError.code}): ${profileError.message}`)

            // If column doesn't exist (migration not run), try without stripe_customer_id
            if (profileError.message.includes('column') || profileError.code === '42703') {
                console.log('[Stripe Checkout] Retrying without stripe_customer_id column')
                const { data: minProfile, error: minError } = await supabase
                    .from('profiles')
                    .select('country, email, full_name')
                    .eq('id', user.id)
                    .single()

                if (minError) {
                    console.error(`[Stripe Checkout] Minimal profile error: ${minError.message}`)
                } else if (minProfile) {
                    profileData = {
                        ...minProfile,
                        stripe_customer_id: null
                    }
                }
            }
        } else {
            profileData = profile
        }

        console.log(`[Stripe Checkout] Profile data:`, profileData ? {
            hasStripeCustomerId: !!profileData.stripe_customer_id,
            country: profileData.country,
            hasEmail: !!profileData.email
        } : 'null')

        const countryCode = profileData?.country || 'US'
        const adjustedPrice = getPriceForCountry(plan.price, countryCode)

        console.log(`[Stripe Checkout] Country: ${countryCode}, Base price: $${plan.price}, Adjusted: $${adjustedPrice}`)

        // Get or create Stripe customer
        let customerId = profileData?.stripe_customer_id

        if (!customerId) {
            console.log('[Stripe Checkout] Creating new Stripe customer')
            try {
                const customer = await stripe.customers.create({
                    email: user.email,
                    name: profileData?.full_name || undefined,
                    metadata: {
                        supabase_user_id: user.id,
                    },
                })
                customerId = customer.id
                console.log(`[Stripe Checkout] Created Stripe customer: ${customerId}`)

                // Try to save customer ID to profile (may fail if column doesn't exist)
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', user.id)

                if (updateError) {
                    console.warn(`[Stripe Checkout] Could not save customer ID to profile: ${updateError.message}`)
                    // This is not a fatal error - we can still proceed with checkout
                } else {
                    console.log('[Stripe Checkout] Saved customer ID to profile')
                }
            } catch (customerError) {
                console.error('[Stripe Checkout] Error creating Stripe customer:', customerError)
                throw customerError
            }
        } else {
            console.log(`[Stripe Checkout] Using existing Stripe customer: ${customerId}`)
        }

        // Build URLs with locale support
        const baseUrl = getBaseUrl(request)
        const localePrefix = locale && locale !== 'es' ? `/${locale}` : ''
        const finalSuccessUrl = successUrl || `${baseUrl}${localePrefix}/dashboard/billing?subscription=success`
        const finalCancelUrl = cancelUrl || `${baseUrl}${localePrefix}/dashboard/billing?cancelled=true`

        console.log(`[Stripe Checkout] Base URL: ${baseUrl}`)
        console.log(`[Stripe Checkout] Success URL: ${finalSuccessUrl}`)
        console.log(`[Stripe Checkout] Cancel URL: ${finalCancelUrl}`)

        // Create checkout session
        console.log('[Stripe Checkout] Creating checkout session...')
        try {
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

            console.log(`[Stripe Checkout] Session created successfully: ${session.id}`)
            console.log(`[Stripe Checkout] Session URL: ${session.url}`)

            return NextResponse.json({ sessionId: session.id, url: session.url })
        } catch (sessionError) {
            console.error('[Stripe Checkout] Error creating checkout session:', sessionError)
            throw sessionError
        }
    } catch (error) {
        console.error('[Stripe Checkout] Unhandled error:', error)

        // Extract error details
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorName = error instanceof Error ? error.name : 'UnknownError'
        const errorStack = error instanceof Error ? error.stack : undefined

        // Check for specific Stripe errors
        const isStripeError = error && typeof error === 'object' && 'type' in error
        const stripeErrorType = isStripeError ? (error as { type: string }).type : undefined
        const stripeErrorCode = isStripeError && 'code' in error ? (error as { code: string }).code : undefined
        const stripeRawType = isStripeError && 'rawType' in error ? (error as { rawType: string }).rawType : undefined

        console.error('[Stripe Checkout] Error details:', {
            name: errorName,
            message: errorMessage,
            stripeType: stripeErrorType,
            stripeCode: stripeErrorCode,
            stripeRawType: stripeRawType,
            stack: errorStack?.split('\n').slice(0, 5).join('\n')
        })

        // Provide helpful error messages based on error type
        let userMessage = 'Failed to create checkout session'
        let errorCode = stripeErrorCode || stripeRawType || errorName

        if (errorMessage.includes('STRIPE_SECRET_KEY') || errorMessage.includes('API key')) {
            userMessage = 'Stripe configuration error. Please contact support.'
            errorCode = 'StripeConfigError'
        } else if (stripeErrorType === 'StripeAuthenticationError') {
            userMessage = 'Stripe authentication failed. Please contact support.'
            errorCode = 'StripeAuthError'
        } else if (stripeErrorType === 'StripeInvalidRequestError') {
            userMessage = 'Invalid request to payment processor.'
            errorCode = stripeErrorCode || 'StripeInvalidRequest'
        } else if (stripeErrorType === 'StripeConnectionError') {
            userMessage = 'Could not connect to payment processor. Please try again.'
            errorCode = 'StripeConnectionError'
        } else if (stripeErrorType === 'StripeRateLimitError') {
            userMessage = 'Too many requests. Please wait a moment and try again.'
            errorCode = 'StripeRateLimit'
        }

        return NextResponse.json(
            {
                error: userMessage,
                code: errorCode,
                // Include debug details in development
                ...(process.env.NODE_ENV !== 'production' && {
                    debug: {
                        message: errorMessage,
                        type: stripeErrorType,
                        rawType: stripeRawType
                    }
                })
            },
            { status: 500 }
        )
    }
}
