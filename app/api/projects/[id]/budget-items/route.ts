import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { budgetItemSchema } from '@/types/project'

// GET /api/projects/[id]/budget-items - Get all budget items for a project
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

    // Get budget items
    const { data: budgetItems, error } = await supabase
      .from('project_budget_items')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching budget items:', error)
      return NextResponse.json({ error: 'Failed to fetch budget items' }, { status: 500 })
    }

    return NextResponse.json({ budgetItems })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/[id]/budget-items - Create a new budget item
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
    const validation = budgetItemSchema.omit({ id: true }).safeParse({
      ...body,
      project_id: projectId,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Create budget item
    const { data: budgetItem, error } = await supabase
      .from('project_budget_items')
      .insert(validation.data)
      .select()
      .single()

    if (error) {
      console.error('Error creating budget item:', error)
      return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 })
    }

    return NextResponse.json({ budgetItem }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/budget-items - Update a budget item (id in body)
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
    const itemId = body.id

    if (!itemId) {
      return NextResponse.json({ error: 'Budget item ID is required' }, { status: 400 })
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
    const validation = budgetItemSchema.partial().safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    // Update budget item
    const { id: _, project_id: __, ...updateData } = validation.data
    const { data: budgetItem, error } = await supabase
      .from('project_budget_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('project_id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating budget item:', error)
      return NextResponse.json({ error: 'Failed to update budget item' }, { status: 500 })
    }

    return NextResponse.json({ budgetItem })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/budget-items?itemId=xxx - Delete a budget item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Budget item ID is required' }, { status: 400 })
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

    // Delete budget item
    const { error } = await supabase
      .from('project_budget_items')
      .delete()
      .eq('id', itemId)
      .eq('project_id', projectId)

    if (error) {
      console.error('Error deleting budget item:', error)
      return NextResponse.json({ error: 'Failed to delete budget item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
