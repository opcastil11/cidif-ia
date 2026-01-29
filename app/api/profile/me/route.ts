import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Public endpoint to get the current user's profile data
export async function GET() {
    const supabase = await createClient()

    try {
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                authenticated: false,
                error: 'Not authenticated',
                details: authError?.message
            }, { status: 401 })
        }

        // Fetch profile with subscription data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_period_start, subscription_period_end, country')
            .eq('id', user.id)
            .single()

        if (profileError) {
            return NextResponse.json({
                authenticated: true,
                userId: user.id,
                userEmail: user.email,
                error: 'Profile fetch failed',
                details: profileError.message
            }, { status: 500 })
        }

        return NextResponse.json({
            authenticated: true,
            userId: user.id,
            userEmail: user.email,
            profile: profile,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('[Profile Me] Error:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
