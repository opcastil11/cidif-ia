import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

// Debug endpoint to check Stripe configuration
// This only returns whether keys are set, not the actual values
export async function GET() {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const secretKeyPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 8) || 'NOT_SET'
    const secretKeyLength = process.env.STRIPE_SECRET_KEY?.length || 0
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const hasStandardPriceId = !!process.env.STRIPE_STANDARD_PRICE_ID
    const hasMaxPriceId = !!process.env.STRIPE_MAX_PRICE_ID

    // Test actual Stripe connection
    let connectionTest: { success: boolean; error?: string; errorType?: string; balance?: string } = {
        success: false
    }

    if (hasSecretKey) {
        try {
            const stripe = getStripe()
            // Use balance.retrieve as a simple test - it should work with any valid API key
            const balance = await stripe.balance.retrieve()
            connectionTest = {
                success: true,
                balance: `${balance.available.length} available currencies`
            }
        } catch (err) {
            const error = err as Error & { type?: string; code?: string; statusCode?: number }
            connectionTest = {
                success: false,
                error: error.message,
                errorType: error.type || error.name
            }
        }
    }

    return NextResponse.json({
        stripe: {
            secretKeySet: hasSecretKey,
            secretKeyPrefix: secretKeyPrefix, // Shows "sk_test_" or "sk_live_" prefix only
            secretKeyLength: secretKeyLength,
            publishableKeySet: hasPublishableKey,
            standardPriceIdSet: hasStandardPriceId,
            maxPriceIdSet: hasMaxPriceId,
        },
        connectionTest,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    })
}
