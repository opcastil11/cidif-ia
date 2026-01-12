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

interface FundSection {
  key: string
  name: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
  options?: string[]
  required: boolean
  helpText?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Agent Prefill] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, fundId, sectionKey, mode = 'single' } = await request.json()

    // Initialize OpenAI after auth check
    let openai: OpenAI
    try {
      openai = getOpenAI()
    } catch {
      console.error('[Agent Prefill] OpenAI not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    if (!projectId || !fundId) {
      console.log('[Agent Prefill] Missing required fields:', { projectId: !!projectId, fundId: !!fundId })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('[Agent Prefill] Request from user:', user.id, 'mode:', mode)

    // Get project details including agent context
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.log('[Agent Prefill] Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if project has trained context
    const agentContext = project.metadata?.agent_context
    if (!agentContext) {
      console.log('[Agent Prefill] Project has no trained context')
      return NextResponse.json({
        error: 'no_training',
        message: 'El proyecto no tiene contexto de entrenamiento. Por favor, entrena el agente primero.'
      }, { status: 400 })
    }

    // Get fund details
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select('*')
      .eq('id', fundId)
      .single()

    if (fundError || !fund) {
      console.log('[Agent Prefill] Fund not found:', fundId)
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    const sections: FundSection[] = fund.requirements?.sections || []
    if (sections.length === 0) {
      return NextResponse.json({ error: 'Fund has no sections to fill' }, { status: 400 })
    }

    // Build comprehensive context
    const projectContext = `
## Información del Proyecto
- Nombre: ${project.name}
- Descripción: ${project.description || 'No proporcionada'}
- Industria: ${project.industry || 'No especificada'}
- Etapa: ${project.stage || 'No especificada'}
- Tamaño del equipo: ${project.team_size || 'No especificado'}
- Ingresos anuales: ${project.annual_revenue ? `$${project.annual_revenue}` : 'No especificado'}
- Fecha de fundación: ${project.founded_date || 'No especificada'}

## Contexto Adicional del Proyecto (Entrenamiento del Usuario)
${agentContext}
`

    const fundContext = `
## Información del Fondo
- Nombre: ${fund.name}
- Organización: ${fund.organization}
- País: ${fund.country}
- Tipo: ${fund.type}
- Rango de montos: ${fund.amount_min} - ${fund.amount_max} ${fund.currency}
- Fecha límite: ${fund.deadline}
- Requisitos de elegibilidad: ${JSON.stringify(fund.eligibility || {})}
${fund.agent_context ? `\n## Directrices Específicas del Fondo\n${fund.agent_context}` : ''}
`

    // Determine which sections to fill
    const sectionsToFill = mode === 'all'
      ? sections
      : sections.filter(s => s.key === sectionKey)

    if (sectionsToFill.length === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 400 })
    }

    // Build the prompt for generating responses
    const sectionsDescription = sectionsToFill.map(s => {
      let desc = `- "${s.name}" (key: ${s.key}, tipo: ${s.type})`
      if (s.helpText) desc += ` - Ayuda: ${s.helpText}`
      if (s.options && s.options.length > 0) desc += ` - Opciones válidas: ${s.options.join(', ')}`
      if (s.required) desc += ' [REQUERIDO]'
      return desc
    }).join('\n')

    const systemPrompt = `Eres un experto en formulación de proyectos para fondos de financiamiento. Tu tarea es generar respuestas de alta calidad para las secciones de una solicitud de financiamiento.

${projectContext}

${fundContext}

## Instrucciones Importantes
1. Genera respuestas basadas ÚNICAMENTE en la información proporcionada del proyecto
2. Las respuestas deben ser profesionales, concisas y persuasivas
3. Para campos tipo "select" o "multiselect", usa SOLO las opciones válidas proporcionadas
4. Para campos tipo "text", genera respuestas breves (1-2 oraciones)
5. Para campos tipo "textarea", genera respuestas más detalladas (2-4 párrafos)
6. Para campos tipo "link" o "file", devuelve una cadena vacía ""
7. Responde en español
8. NO inventes información que no esté en el contexto del proyecto

## Formato de Respuesta
Devuelve un objeto JSON con las claves correspondientes a cada sección y sus valores. Ejemplo:
{
  "project_description": "Descripción del proyecto...",
  "team_experience": "El equipo tiene..."
}

IMPORTANTE: Responde SOLO con el JSON, sin explicaciones adicionales ni bloques de código.`

    const userPrompt = `Genera respuestas para las siguientes secciones de la solicitud:

${sectionsDescription}

Recuerda: Responde SOLO con el objeto JSON.`

    console.log('[Agent Prefill] Calling OpenAI for', sectionsToFill.length, 'sections')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || '{}'

    let responses: Record<string, string>
    try {
      responses = JSON.parse(responseText)
    } catch {
      console.error('[Agent Prefill] Failed to parse JSON response:', responseText)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    console.log('[Agent Prefill] Successfully generated responses for', Object.keys(responses).length, 'sections')

    return NextResponse.json({
      success: true,
      responses,
      mode,
      sectionsCount: sectionsToFill.length
    })
  } catch (error) {
    console.error('[Agent Prefill] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
