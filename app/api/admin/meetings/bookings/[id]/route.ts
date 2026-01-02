import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, admin_notes, report_url } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes
    if (report_url !== undefined) updateData.report_url = report_url

    const { data, error } = await supabase
      .from('meeting_bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    console.log('Booking updated:', { id, ...updateData })

    return NextResponse.json({ booking: data })
  } catch (error) {
    console.error('Error in admin booking PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
