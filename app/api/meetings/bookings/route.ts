import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - List user's bookings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bookings, error } = await supabase
      .from('meeting_bookings')
      .select(`
        *,
        meeting_type:meeting_types(*),
        project:projects(id, name)
      `)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error in bookings GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
