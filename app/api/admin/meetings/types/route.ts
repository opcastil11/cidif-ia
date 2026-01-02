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

    const { data: meetingTypes, error } = await supabase
      .from('meeting_types')
      .select('*')
      .order('duration_minutes', { ascending: true })

    if (error) {
      console.error('Error fetching meeting types:', error)
      return NextResponse.json({ error: 'Failed to fetch meeting types' }, { status: 500 })
    }

    return NextResponse.json({ meetingTypes })
  } catch (error) {
    console.error('Error in admin meeting types GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
