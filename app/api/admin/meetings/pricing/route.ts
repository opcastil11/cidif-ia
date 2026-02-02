import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech', 'opcastil@gmail.com']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pricing, error } = await supabase
      .from('meeting_pricing')
      .select('*')
      .order('country_code', { ascending: true })

    if (error) {
      console.error('Error fetching pricing:', error)
      return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 })
    }

    return NextResponse.json({ pricing })
  } catch (error) {
    console.error('Error in admin pricing GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { meeting_type_id, country_code, price_usd } = body

    if (!meeting_type_id || !country_code || price_usd === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upsert pricing
    const { data, error } = await supabase
      .from('meeting_pricing')
      .upsert(
        {
          meeting_type_id,
          country_code,
          price_usd,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'meeting_type_id,country_code' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating pricing:', error)
      return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 })
    }

    console.log('Pricing updated:', { meeting_type_id, country_code, price_usd })

    return NextResponse.json({ pricing: data })
  } catch (error) {
    console.error('Error in admin pricing POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
