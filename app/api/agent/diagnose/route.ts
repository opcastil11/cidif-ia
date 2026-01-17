import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint is public for diagnostics - it only shows if env vars exist, not their values
export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, unknown>
  }

  // Check OpenAI API Key
  const openaiKey = process.env.OPENAI_API_KEY
  diagnostics.checks = {
    ...diagnostics.checks as Record<string, unknown>,
    openai_api_key: {
      exists: !!openaiKey,
      prefix: openaiKey ? openaiKey.substring(0, 7) + '...' : null,
      length: openaiKey?.length || 0
    }
  }

  // Check Anthropic API Key
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  diagnostics.checks = {
    ...diagnostics.checks as Record<string, unknown>,
    anthropic_api_key: {
      exists: !!anthropicKey,
      prefix: anthropicKey ? anthropicKey.substring(0, 7) + '...' : null,
      length: anthropicKey?.length || 0
    }
  }

  // Check Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  diagnostics.checks = {
    ...diagnostics.checks as Record<string, unknown>,
    supabase: {
      url_exists: !!supabaseUrl,
      anon_key_exists: !!supabaseAnonKey
    }
  }

  // Check auth (optional, may fail if not authenticated)
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    diagnostics.checks = {
      ...diagnostics.checks as Record<string, unknown>,
      auth: {
        authenticated: !!user,
        user_id: user?.id || null,
        error: error?.message || null
      }
    }
  } catch (e) {
    diagnostics.checks = {
      ...diagnostics.checks as Record<string, unknown>,
      auth: {
        authenticated: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }
  }

  return NextResponse.json(diagnostics)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, fundId } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated',
        step: 'auth_check'
      }, { status: 401 })
    }

    // Check OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY not configured',
        step: 'openai_check',
        message: 'The OpenAI API key is not set in environment variables'
      }, { status: 503 })
    }

    // Check project
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, metadata')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single()

      if (projectError || !project) {
        return NextResponse.json({
          error: 'Project not found',
          step: 'project_check',
          projectId,
          dbError: projectError?.message
        }, { status: 404 })
      }

      const hasTraining = !!project.metadata?.agent_context
      if (!hasTraining) {
        return NextResponse.json({
          error: 'Project has no training',
          step: 'training_check',
          projectId,
          projectName: project.name,
          metadata: project.metadata
        }, { status: 400 })
      }
    }

    // Check fund
    if (fundId) {
      const { data: fund, error: fundError } = await supabase
        .from('funds')
        .select('id, name, requirements')
        .eq('id', fundId)
        .single()

      if (fundError || !fund) {
        return NextResponse.json({
          error: 'Fund not found',
          step: 'fund_check',
          fundId,
          dbError: fundError?.message
        }, { status: 404 })
      }

      const sections = fund.requirements?.sections || []
      return NextResponse.json({
        success: true,
        step: 'all_checks_passed',
        fund: {
          id: fund.id,
          name: fund.name,
          sectionsCount: sections.length,
          sectionKeys: sections.map((s: { key: string }) => s.key)
        }
      })
    }

    return NextResponse.json({
      success: true,
      step: 'basic_checks_passed',
      user_id: user.id
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      step: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
