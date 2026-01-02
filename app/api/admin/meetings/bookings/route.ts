import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bookings, error } = await supabase
      .from('meeting_bookings')
      .select(`
        *,
        user:profiles(email, full_name, company_name),
        meeting_type:meeting_types(id, name, duration_minutes),
        project:projects(id, name)
      `)
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error in admin bookings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
