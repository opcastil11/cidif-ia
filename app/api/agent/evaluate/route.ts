import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { AIEvaluationResponse } from '@/types/evaluation'

// Initialize OpenAI lazily
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Evaluate Project] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fundId, language = 'es' } = await request.json()

    if (!projectId) {
      console.log('[Evaluate Project] Missing projectId')
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Initialize OpenAI
    let openai: OpenAI
    try {
      openai = getOpenAI()
    } catch {
      console.error('[Evaluate Project] OpenAI not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    console.log('[Evaluate Project] Request from user:', user.id, 'for project:', projectId)

    // Fetch project data with relations
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.log('[Evaluate Project] Project not found or access denied')
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch related data
    const [foundersRes, teamRes, budgetRes, milestonesRes] = await Promise.all([
      supabase.from('project_founders').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('project_team_members').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('project_budget_items').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('project_milestones').select('*').eq('project_id', projectId).order('target_date'),
    ])

    const founders = foundersRes.data || []
    const teamMembers = teamRes.data || []
    const budgetItems = budgetRes.data || []
    const milestones = milestonesRes.data || []

    // Calculate totals
    const totalBudget = budgetItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)

    // Get fund context if provided
    let fundContext = ''
    let fundData = null
    if (fundId) {
      const { data: fund } = await supabase
        .from('funds')
        .select('*')
        .eq('id', fundId)
        .single()

      if (fund) {
        fundData = fund
        fundContext = `
## Target Fund Information
The project is being evaluated for potential application to:
- Fund Name: ${fund.name}
- Organization: ${fund.organization}
- Country: ${fund.country}
- Type: ${fund.type}
- Amount Range: ${fund.amount_min} - ${fund.amount_max} ${fund.currency}
- Requirements: ${JSON.stringify(fund.requirements || {})}
- Eligibility: ${JSON.stringify(fund.eligibility || {})}

Please also evaluate how well this project fits this specific fund's requirements and criteria.
`
      }
    }

    // Build project context
    const projectContext = `
## Project Information

### Basic Info
- Name: ${project.name || 'Not specified'}
- Description: ${project.description || 'Not specified'}
- Industry: ${project.industry || 'Not specified'}
- Stage: ${project.stage || 'Not specified'}
- Team Size: ${project.team_size || 'Not specified'}
- Annual Revenue: ${project.annual_revenue ? `$${project.annual_revenue} USD` : 'Not specified'}
- Founded: ${project.founded_date || 'Not specified'}
- Country: ${project.country || 'Not specified'}

### Problem & Solution
- Problem Statement: ${project.problem_statement || 'Not specified'}
- Value Proposition: ${project.value_proposition || 'Not specified'}
- Technology Description: ${project.technology_description || 'Not specified'}

### Market
- Target Market: ${project.target_market || 'Not specified'}
- Market Size TAM: ${project.market_size_tam || 'Not specified'}
- Market Size SAM: ${project.market_size_sam || 'Not specified'}
- Market Size SOM: ${project.market_size_som || 'Not specified'}
- Competitors: ${project.competitors_list || 'Not specified'}
- Go-to-Market Strategy: ${project.go_to_market_strategy || 'Not specified'}

### Business Model
- Business Model: ${project.business_model || 'Not specified'}
- Competitive Advantages: ${project.competitive_advantages || 'Not specified'}
- Revenue Projections: ${project.revenue_projections || 'Not specified'}

### Team (${founders.length} founders, ${teamMembers.length} team members)
${founders.length > 0 ? `Founders:\n${founders.map(f => `  - ${f.name}: ${f.role}${f.equity_percentage ? ` (${f.equity_percentage}%)` : ''}${f.bio ? ` - ${f.bio}` : ''}`).join('\n')}` : 'No founders specified'}
${teamMembers.length > 0 ? `\nTeam Members:\n${teamMembers.filter(m => m.is_active).map(m => `  - ${m.name}: ${m.role}${m.department ? ` (${m.department})` : ''}${m.skills?.length ? ` - Skills: ${m.skills.join(', ')}` : ''}`).join('\n')}` : ''}

### Financial Information
- Monthly Burn Rate: ${project.monthly_burn_rate ? `$${project.monthly_burn_rate}` : 'Not specified'}
- Funding Received: ${project.funding_received ? `$${project.funding_received}` : 'Not specified'}
- Funding Seeking: ${project.funding_seeking ? `$${project.funding_seeking}` : 'Not specified'}
- Runway: ${project.runway_months ? `${project.runway_months} months` : 'Not specified'}
- Use of Funds: ${project.use_of_funds || 'Not specified'}
${budgetItems.length > 0 ? `\nBudget Breakdown (Total: $${totalBudget.toLocaleString()}):\n${budgetItems.map(b => `  - ${b.category}: ${b.description} - $${b.amount} ${b.currency}${b.justification ? ` (${b.justification})` : ''}`).join('\n')}` : ''}

### Traction & Metrics
- Monthly Users: ${project.monthly_users || 'Not specified'}
- Customer Count: ${project.customer_count || 'Not specified'}
- Monthly Revenue: ${project.monthly_revenue ? `$${project.monthly_revenue}` : 'Not specified'}
- Growth Rate: ${project.growth_rate_monthly ? `${project.growth_rate_monthly}%` : 'Not specified'}
- Previous Customers: ${project.previous_customers || 'Not specified'}

### Innovation & R&D
- TRL Level: ${project.trl_level || 'Not specified'}
- IP Status: ${project.ip_status || 'Not specified'}
- Product Status: ${project.product_status || 'Not specified'}
- R&D Activities: ${project.rd_activities || 'Not specified'}
- Patents/Publications: ${project.patents_publications || 'Not specified'}

### Impact
- Project Objectives: ${project.project_objectives || 'Not specified'}
- Expected Impact: ${project.expected_impact || 'Not specified'}
- SDG Alignment: ${project.sdg_alignment || 'Not specified'}
- Environmental Impact: ${project.environmental_impact || 'Not specified'}
- Social Impact: ${project.social_impact || 'Not specified'}

### Implementation
${milestones.length > 0 ? `Milestones (${milestones.length} total):\n${milestones.map(m => `  - ${m.title}: ${m.status} (${m.completion_percentage}%) - Target: ${m.target_date}${m.deliverables?.length ? ` - Deliverables: ${m.deliverables.join(', ')}` : ''}`).join('\n')}` : 'No milestones defined'}
- Key Activities: ${project.key_activities || 'Not specified'}
- Timeline: ${project.timeline_milestones || 'Not specified'}
- Risk Assessment: ${project.risk_assessment || 'Not specified'}

### Support & References
- Previous Grants: ${project.previous_grants || 'Not specified'}
- Letters of Support: ${project.letters_of_support || 'Not specified'}
`

    const isSpanish = language === 'es'

    const systemPrompt = `You are an expert grant evaluator and investment analyst specializing in evaluating startup and innovation projects for competitive funds and grants. Your task is to provide a comprehensive, objective evaluation of the project with scores and actionable feedback.

${projectContext}

${fundContext}

Based on the project information above, provide a detailed evaluation scoring each dimension from 0-100 and providing specific, constructive feedback.

**Scoring Guidelines:**
- 80-100: Excellent - Exceptionally strong, well-documented, compelling
- 60-79: Good - Solid foundation with minor gaps
- 40-59: Fair - Adequate but needs improvement in key areas
- 20-39: Poor - Significant weaknesses that need addressing
- 0-19: Critical - Missing or severely inadequate

**Evaluation Dimensions:**
1. **Problem** (0-100): Clarity, significance, and validation of the problem being solved
2. **Solution** (0-100): Innovation, feasibility, and differentiation of the proposed solution
3. **Market** (0-100): Market size, opportunity, competition analysis, and go-to-market strategy
4. **Team** (0-100): Team composition, expertise, track record, and ability to execute
5. **Financials** (0-100): Financial projections, use of funds, business model viability
6. **Innovation** (0-100): Technology novelty, IP position, R&D activities
7. **Impact** (0-100): Social, environmental, and economic impact potential
8. **Execution** (0-100): Implementation plan, milestones, risk management

${fundId ? '**Fund Fit** (0-100): How well the project aligns with the specific fund requirements and criteria' : ''}

You MUST respond with a valid JSON object (no markdown code blocks, just raw JSON) with this structure:
{
  "overall_score": number (0-100, weighted average of dimensions),

  "problem_score": number,
  "solution_score": number,
  "market_score": number,
  "team_score": number,
  "financials_score": number,
  "innovation_score": number,
  "impact_score": number,
  "execution_score": number,

  "summary": "${isSpanish ? 'Resumen ejecutivo de la evaluación en español (2-3 párrafos)' : 'Executive summary of the evaluation (2-3 paragraphs)'}",

  "strengths": ["${isSpanish ? '3-5 fortalezas principales del proyecto' : '3-5 main project strengths'}"],
  "weaknesses": ["${isSpanish ? '3-5 debilidades o áreas de mejora' : '3-5 weaknesses or areas for improvement'}"],
  "recommendations": ["${isSpanish ? '3-5 recomendaciones accionables específicas' : '3-5 specific actionable recommendations'}"],

  "problem_feedback": "${isSpanish ? 'Retroalimentación detallada sobre el problema (1 párrafo)' : 'Detailed feedback on problem (1 paragraph)'}",
  "solution_feedback": "${isSpanish ? 'Retroalimentación detallada sobre la solución (1 párrafo)' : 'Detailed feedback on solution (1 paragraph)'}",
  "market_feedback": "${isSpanish ? 'Retroalimentación detallada sobre el mercado (1 párrafo)' : 'Detailed feedback on market (1 paragraph)'}",
  "team_feedback": "${isSpanish ? 'Retroalimentación detallada sobre el equipo (1 párrafo)' : 'Detailed feedback on team (1 paragraph)'}",
  "financials_feedback": "${isSpanish ? 'Retroalimentación detallada sobre las finanzas (1 párrafo)' : 'Detailed feedback on financials (1 paragraph)'}",
  "innovation_feedback": "${isSpanish ? 'Retroalimentación detallada sobre la innovación (1 párrafo)' : 'Detailed feedback on innovation (1 paragraph)'}",
  "impact_feedback": "${isSpanish ? 'Retroalimentación detallada sobre el impacto (1 párrafo)' : 'Detailed feedback on impact (1 paragraph)'}",
  "execution_feedback": "${isSpanish ? 'Retroalimentación detallada sobre la ejecución (1 párrafo)' : 'Detailed feedback on execution (1 paragraph)'}"${fundId ? `,

  "fund_fit_score": number (0-100),
  "fund_fit_feedback": "${isSpanish ? 'Análisis de ajuste con el fondo específico' : 'Analysis of fit with the specific fund'}"` : ''}
}

Guidelines:
- Be objective and constructive in all feedback
- Provide specific examples from the project data when giving feedback
- If information is missing, note it and factor it into the score
- Recommendations should be specific and actionable
- All text should be in ${isSpanish ? 'Spanish' : 'English'}
- The response must be valid JSON only, no additional text or markdown`

    console.log('[Evaluate Project] Calling OpenAI API')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please evaluate this project and provide comprehensive feedback.' },
      ],
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0
    const evaluationTime = Date.now() - startTime

    console.log('[Evaluate Project] Response received, parsing JSON')

    // Parse the response
    let evaluationData: AIEvaluationResponse
    try {
      let cleanedResponse = responseText.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      evaluationData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[Evaluate Project] Failed to parse JSON response:', parseError)
      console.error('[Evaluate Project] Response was:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    // Save evaluation to database
    const { data: savedEvaluation, error: saveError } = await supabase
      .from('project_evaluations')
      .insert({
        project_id: projectId,
        user_id: user.id,
        overall_score: evaluationData.overall_score,
        problem_score: evaluationData.problem_score,
        solution_score: evaluationData.solution_score,
        market_score: evaluationData.market_score,
        team_score: evaluationData.team_score,
        financials_score: evaluationData.financials_score,
        innovation_score: evaluationData.innovation_score,
        impact_score: evaluationData.impact_score,
        execution_score: evaluationData.execution_score,
        summary: evaluationData.summary,
        strengths: evaluationData.strengths,
        weaknesses: evaluationData.weaknesses,
        recommendations: evaluationData.recommendations,
        problem_feedback: evaluationData.problem_feedback,
        solution_feedback: evaluationData.solution_feedback,
        market_feedback: evaluationData.market_feedback,
        team_feedback: evaluationData.team_feedback,
        financials_feedback: evaluationData.financials_feedback,
        innovation_feedback: evaluationData.innovation_feedback,
        impact_feedback: evaluationData.impact_feedback,
        execution_feedback: evaluationData.execution_feedback,
        fund_id: fundId || null,
        fund_fit_score: evaluationData.fund_fit_score || null,
        fund_fit_feedback: evaluationData.fund_fit_feedback || null,
        evaluation_model: 'gpt-4o',
        tokens_used: tokensUsed,
        evaluation_time_ms: evaluationTime,
      })
      .select()
      .single()

    if (saveError) {
      console.error('[Evaluate Project] Failed to save evaluation:', saveError)
      // Still return the evaluation even if saving failed
    }

    console.log('[Evaluate Project] Evaluation completed successfully')

    return NextResponse.json({
      evaluation: evaluationData,
      saved: savedEvaluation || null,
      project: {
        id: project.id,
        name: project.name,
      },
      fund: fundData ? {
        id: fundData.id,
        name: fundData.name,
      } : null,
      metadata: {
        tokens_used: tokensUsed,
        evaluation_time_ms: evaluationTime,
      },
    })
  } catch (error) {
    console.error('[Evaluate Project] Error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate project' },
      { status: 500 }
    )
  }
}

// GET: Fetch previous evaluations for a project
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from('project_evaluations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (evalError) {
      console.error('[Get Evaluations] Error:', evalError)
      return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
    }

    return NextResponse.json({ evaluations })
  } catch (error) {
    console.error('[Get Evaluations] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}
