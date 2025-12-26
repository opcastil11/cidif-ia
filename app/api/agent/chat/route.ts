import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Agent Chat] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, projectId, fundId } = await request.json()

    if (!message || !projectId) {
      console.log('[Agent Chat] Missing required fields:', { message: !!message, projectId: !!projectId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Agent Chat] Request from user:', user.id, 'for project:', projectId)

    // Get project details including agent context
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.log('[Agent Chat] Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get fund context if fundId provided
    let fundContext = ''
    if (fundId) {
      const { data: fund } = await supabase
        .from('funds')
        .select('*')
        .eq('id', fundId)
        .single()

      if (fund) {
        fundContext = `
## Fund Information
- Name: ${fund.name}
- Organization: ${fund.organization}
- Country: ${fund.country}
- Type: ${fund.type}
- Amount Range: ${fund.amount_min} - ${fund.amount_max} ${fund.currency}
- Deadline: ${fund.deadline}
- Requirements: ${JSON.stringify(fund.requirements)}
- Eligibility: ${JSON.stringify(fund.eligibility)}
`
        // Add fund agent context if available
        if (fund.agent_context) {
          fundContext += `\n## Fund Specific Guidelines\n${fund.agent_context}\n`
        }
      }
    }

    // Build project context
    const projectContext = `
## Project Information
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Industry: ${project.industry || 'Not specified'}
- Stage: ${project.stage || 'Not specified'}
- Team Size: ${project.team_size || 'Not specified'}
- Annual Revenue: ${project.annual_revenue ? `$${project.annual_revenue}` : 'Not specified'}
- Founded: ${project.founded_date || 'Not specified'}
`

    // Get user-provided agent training context
    const agentTrainingContext = project.metadata?.agent_context || ''

    // Build system prompt
    const systemPrompt = `You are an AI assistant specialized in helping entrepreneurs and startups apply for public and private funding in LATAM, USA, and Europe. You work for CIDIF.TECH, a platform that helps with grant applications.

Your role is to:
1. Help users formulate their project proposals
2. Provide guidance on application requirements
3. Suggest improvements to their responses
4. Answer questions about the funding process
5. Help structure their project information effectively

${projectContext}

${agentTrainingContext ? `## Additional Project Context (User Provided)\n${agentTrainingContext}\n` : ''}

${fundContext}

Be helpful, professional, and provide specific, actionable advice. When suggesting improvements, be constructive and explain why your suggestions would strengthen the application. Respond in the same language the user uses (Spanish or English).`

    console.log('[Agent Chat] Calling OpenAI with context length:', systemPrompt.length)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || 'No response generated'

    console.log('[Agent Chat] Response generated successfully')

    return NextResponse.json({ response })
  } catch (error) {
    console.error('[Agent Chat] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
