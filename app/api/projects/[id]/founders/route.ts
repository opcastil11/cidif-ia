import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { founderSchema } from '@/types/project'

// GET /api/projects/[id]/founders - Get all founders for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get founders
    const { data: founders, error } = await supabase
      .from('project_founders')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching founders:', error)
      return NextResponse.json({ error: 'Failed to fetch founders' }, { status: 500 })
    }

    return NextResponse.json({ founders })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/founders - Create a new founder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = founderSchema.omit({ id: true }).safeParse({
      ...body,
      project_id: projectId,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Create founder
    const { data: founder, error } = await supabase
      .from('project_founders')
      .insert(validation.data)
      .select()
      .single()

    if (error) {
      console.error('Error creating founder:', error)
      return NextResponse.json({ error: 'Failed to create founder' }, { status: 500 })
    }

    return NextResponse.json({ founder }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/founders - Update a founder (id in body)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const founderId = body.id

    if (!founderId) {
      return NextResponse.json({ error: 'Founder ID is required' }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate the update data
    const validation = founderSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Update founder
    const { id: _, project_id: __, ...updateData } = validation.data
    const { data: founder, error } = await supabase
      .from('project_founders')
      .update(updateData)
      .eq('id', founderId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating founder:', error)
      return NextResponse.json({ error: 'Failed to update founder' }, { status: 500 })
    }

    return NextResponse.json({ founder })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/founders?founderId=xxx - Delete a founder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const founderId = searchParams.get('founderId')

    if (!founderId) {
      return NextResponse.json({ error: 'Founder ID is required' }, { status: 400 })
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.error('Project error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete founder
    const { error } = await supabase
      .from('project_founders')
      .delete()
      .eq('id', founderId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting founder:', error)
      return NextResponse.json({ error: 'Failed to delete founder' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
