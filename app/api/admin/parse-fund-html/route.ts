import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Admin emails that can access this endpoint
const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech']

// Initialize OpenAI lazily to avoid build errors when env var is not set
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

interface ParsedQuestion {
  key: string
  name: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
  options?: string[]
  required: boolean
  helpText?: string
}

interface ParsedFund {
  name?: string
  organization?: string
  description?: string
  sections: ParsedQuestion[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Parse Fund HTML] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
      console.log('[Parse Fund HTML] Non-admin access attempt:', user.email)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { html, language = 'es' } = await request.json()

    if (!html) {
      console.log('[Parse Fund HTML] Missing HTML content')
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 })
    }

    // Initialize OpenAI after auth check
    let openai: OpenAI
    try {
      openai = getOpenAI()
    } catch {
      console.error('[Parse Fund HTML] OpenAI not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    console.log('[Parse Fund HTML] Request from admin:', user.email)
    console.log('[Parse Fund HTML] HTML length:', html.length)

    const systemPrompt = `You are an expert at analyzing HTML content from fund application forms and extracting the questions and form fields.

Your task is to analyze the provided HTML and identify:
1. The fund name and organization (if visible in the HTML)
2. All questions, form fields, and input requirements
3. For each question/field, determine:
   - A unique key (snake_case, e.g., "project_description", "team_experience")
   - The display name/label
   - The field type: "text" (short input), "textarea" (long text), "select" (dropdown with options), "multiselect" (checkboxes or multi-select), "link" (URL input), "file" (file upload)
   - If it has predefined options (for select/multiselect), extract all options
   - Whether it appears to be required
   - Any help text or instructions associated with the field

Guidelines for determining field types:
- Single line inputs or short answers -> "text"
- Multi-line text areas, descriptions, essays -> "textarea"
- Dropdown menus with single selection -> "select"
- Checkboxes or lists where multiple can be selected -> "multiselect"
- Fields asking for URLs, links, videos -> "link"
- Fields asking for document uploads, PDFs, attachments -> "file"

You MUST respond with a valid JSON object (no markdown code blocks, just raw JSON) with this structure:
{
  "name": "Fund name if found, or null",
  "organization": "Organization name if found, or null",
  "description": "Brief description of the fund if found, or null",
  "sections": [
    {
      "key": "unique_snake_case_key",
      "name": "Display name of the question/field",
      "type": "text|textarea|select|multiselect|link|file",
      "options": ["option1", "option2"] // Only for select/multiselect types
      "required": true|false,
      "helpText": "Help text or instructions if available"
    }
  ]
}

Important:
- Generate meaningful keys that represent the content (not generic like "field_1")
- Preserve the original question text in the name field
- Extract ALL visible questions and form fields
- If you can't determine if a field is required, default to true
- All text should be in ${language === 'es' ? 'Spanish' : 'English'}
- The response must be valid JSON only, no additional text`

    console.log('[Parse Fund HTML] Calling OpenAI API')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this HTML content and extract all form fields, questions, and input requirements:\n\n${html}` },
      ],
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0]?.message?.content || ''

    console.log('[Parse Fund HTML] Response received, parsing JSON')

    // Try to parse the response as JSON
    let parsedFund: ParsedFund
    try {
      // Clean the response if it has markdown code blocks
      let cleanedResponse = responseText.trim()
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      parsedFund = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('[Parse Fund HTML] Failed to parse JSON response:', parseError)
      console.error('[Parse Fund HTML] Response was:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    console.log('[Parse Fund HTML] Successfully parsed', parsedFund.sections?.length || 0, 'sections')

    return NextResponse.json({
      success: true,
      fund: parsedFund,
      sectionsCount: parsedFund.sections?.length || 0
    })
  } catch (error) {
    console.error('[Parse Fund HTML] Error:', error)
    return NextResponse.json(
      { error: 'Failed to parse HTML content' },
      { status: 500 }
    )
  }
}
