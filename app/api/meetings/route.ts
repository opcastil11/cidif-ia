import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - List meeting types with pricing for user's country
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get user's country if logged in
    let userCountry = 'DEFAULT'
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single()
      if (profile?.country) {
        userCountry = profile.country
      }
    }

    // Get active meeting types
    const { data: meetingTypes, error: typesError } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('is_active', true)
      .order('duration_minutes', { ascending: true })

    if (typesError) {
      console.error('Error fetching meeting types:', typesError)
      return NextResponse.json({ error: 'Failed to fetch meeting types' }, { status: 500 })
    }

    // Get pricing for each meeting type
    const meetingTypesWithPricing = await Promise.all(
      (meetingTypes || []).map(async (type) => {
        // Try to get country-specific pricing, fall back to default
        let { data: pricing } = await supabase
          .from('meeting_pricing')
          .select('price_usd')
          .eq('meeting_type_id', type.id)
          .eq('country_code', userCountry)
          .single()

        if (!pricing) {
          const { data: defaultPricing } = await supabase
            .from('meeting_pricing')
            .select('price_usd')
            .eq('meeting_type_id', type.id)
            .eq('country_code', 'DEFAULT')
            .single()
          pricing = defaultPricing
        }

        return {
          ...type,
          price_usd: type.is_free ? 0 : (pricing?.price_usd ?? type.base_price_usd),
          user_country: userCountry
        }
      })
    )

    return NextResponse.json({ meetingTypes: meetingTypesWithPricing })
  } catch (error) {
    console.error('Error in meetings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Book a meeting
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { meeting_type_id, project_id, scheduled_at, notes } = body

    if (!meeting_type_id || !scheduled_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get meeting type
    const { data: meetingType, error: typeError } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', meeting_type_id)
      .eq('is_active', true)
      .single()

    if (typeError || !meetingType) {
      return NextResponse.json({ error: 'Meeting type not found' }, { status: 404 })
    }

    // Get user's country
    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('id', user.id)
      .single()

    const userCountry = profile?.country || 'DEFAULT'

    // Get price for user's country
    let priceUsd = meetingType.base_price_usd
    if (!meetingType.is_free) {
      let { data: pricing } = await supabase
        .from('meeting_pricing')
        .select('price_usd')
        .eq('meeting_type_id', meeting_type_id)
        .eq('country_code', userCountry)
        .single()

      if (!pricing) {
        const { data: defaultPricing } = await supabase
          .from('meeting_pricing')
          .select('price_usd')
          .eq('meeting_type_id', meeting_type_id)
          .eq('country_code', 'DEFAULT')
          .single()
        pricing = defaultPricing
      }

      if (pricing) {
        priceUsd = pricing.price_usd
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('meeting_bookings')
      .insert({
        user_id: user.id,
        meeting_type_id,
        project_id: project_id || null,
        scheduled_at,
        duration_minutes: meetingType.duration_minutes,
        status: 'pending',
        price_usd: meetingType.is_free ? 0 : priceUsd,
        country_code: userCountry,
        notes: notes || null
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    console.log('Meeting booked:', { booking_id: booking.id, user_id: user.id, type: meetingType.name })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error in meetings POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
