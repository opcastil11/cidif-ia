import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Initialize OpenAI lazily to avoid build errors when env var is not set
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

interface ProjectData {
  name: string
  description: string
  industry: string
  stage: string
  team_size: number | null
  annual_revenue: number | null
  country: string
  problem_statement: string
  value_proposition: string
  target_market: string
  business_model: string
  competitive_advantages: string
  technology_description: string
  project_objectives: string
  expected_impact: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Create Project AI] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { description, fundId, language = 'es' } = await request.json()

    if (!description) {
      console.log('[Create Project AI] Missing description')
      return NextResponse.json({ error: 'Missing project description' }, { status: 400 })
    }

    // Initialize OpenAI after auth check
    let openai: OpenAI
    try {
      openai = getOpenAI()
    } catch {
      console.error('[Create Project AI] OpenAI not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    console.log('[Create Project AI] Request from user:', user.id)

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
## Target Fund Information
This project will apply for the following fund:
- Name: ${fund.name}
- Organization: ${fund.organization}
- Country: ${fund.country}
- Type: ${fund.type}
- Amount Range: ${fund.amount_min} - ${fund.amount_max} ${fund.currency}
- Requirements: ${JSON.stringify(fund.requirements || {})}
- Eligibility: ${JSON.stringify(fund.eligibility || {})}

Consider these fund requirements when generating the project information.
`
      }
    }

    const systemPrompt = `You are an expert consultant helping entrepreneurs formulate grant applications. Your role is to help structure and expand a basic project idea into a comprehensive project profile that can be used for fund applications.

Based on the user's project description, generate a complete project profile with detailed, professional content. The content should be suitable for grant applications.

${fundContext}

You MUST respond with a valid JSON object (no markdown code blocks, just raw JSON) with the following structure:
{
  "name": "Project name (concise, professional)",
  "description": "Comprehensive project description (2-3 paragraphs)",
  "industry": "One of: technology, health, fintech, agritech, energy, education, ecommerce, logistics, manufacturing, food, environment, other",
  "stage": "One of: idea, mvp, early_revenue, growth, scale",
  "team_size": null or a number if mentioned,
  "annual_revenue": null or a number in USD if mentioned,
  "country": "Two-letter country code (CL, MX, CO, AR, PE, BR, US, ES) or OTHER",
  "problem_statement": "Clear description of the problem being solved (1-2 paragraphs)",
  "value_proposition": "Unique value proposition (1-2 paragraphs)",
  "target_market": "Description of target market and customers (1 paragraph)",
  "business_model": "How the project generates value/revenue (1 paragraph)",
  "competitive_advantages": "Key differentiators and competitive moat (1 paragraph)",
  "technology_description": "Technologies and innovations used (1 paragraph)",
  "project_objectives": "Specific, measurable project objectives (bullet points as text)",
  "expected_impact": "Expected market, social, or environmental impact (1 paragraph)"
}

Guidelines:
- Be specific and professional in all descriptions
- Use concrete examples and numbers where possible
- Content should be suitable for formal grant applications
- If information is not provided, make reasonable professional assumptions based on the industry
- All text content should be in ${language === 'es' ? 'Spanish' : 'English'}
- The response must be valid JSON only, no additional text or markdown`

    console.log('[Create Project AI] Calling OpenAI API')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a complete project profile based on this description:\n\n${description}` },
      ],
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || ''

    console.log('[Create Project AI] Response received, parsing JSON')

    // Try to parse the response as JSON
    let projectData: ProjectData
    try {
      // Clean the response if it has markdown code blocks
      let cleanedResponse = responseText.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      projectData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[Create Project AI] Failed to parse JSON response:', parseError)
      console.error('[Create Project AI] Response was:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    console.log('[Create Project AI] Project data generated successfully')

    return NextResponse.json({ projectData })
  } catch (error) {
    console.error('[Create Project AI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate project' },
      { status: 500 }
    )
  }
}
