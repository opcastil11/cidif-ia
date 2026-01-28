import { NextResponse } from 'next/server'

// Debug endpoint to check Stripe configuration
// This only returns whether keys are set, not the actual values
export async function GET() {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const secretKeyPrefix = process.env.STRIPE_SECRET_KEY?.slice(0, 8) || 'NOT_SET'
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const hasStandardPriceId = !!process.env.STRIPE_STANDARD_PRICE_ID
    const hasMaxPriceId = !!process.env.STRIPE_MAX_PRICE_ID

    return NextResponse.json({
        stripe: {
            secretKeySet: hasSecretKey,
            secretKeyPrefix: secretKeyPrefix, // Shows "sk_test_" or "sk_live_" prefix only
            publishableKeySet: hasPublishableKey,
            standardPriceIdSet: hasStandardPriceId,
            maxPriceIdSet: hasMaxPriceId,
        },
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    })
}
