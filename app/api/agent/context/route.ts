import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Agent Context] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, agentContext } = await request.json()

    if (!projectId) {
      console.log('[Agent Context] Missing projectId')
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    console.log('[Agent Context] Updating context for project:', projectId)

    // Verify project ownership and get current metadata
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !project) {
      console.log('[Agent Context] Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update metadata with agent context
    const updatedMetadata = {
      ...(project.metadata || {}),
      agent_context: agentContext,
      agent_context_updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Agent Context] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update context' }, { status: 500 })
    }

    console.log('[Agent Context] Context updated successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Agent Context] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
