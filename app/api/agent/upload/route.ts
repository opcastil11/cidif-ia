import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Agent Upload] Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file || !projectId) {
      console.log('[Agent Upload] Missing file or projectId')
      return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      console.log('[Agent Upload] Project not found:', projectId)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('[Agent Upload] Processing file:', file.name, 'type:', file.type)

    // Extract text based on file type
    let extractedText = ''

    if (file.type === 'application/pdf') {
      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        extractedText = data.text
        console.log('[Agent Upload] Extracted', extractedText.length, 'characters from PDF')
      } catch (pdfError) {
        console.error('[Agent Upload] PDF extraction error:', pdfError)
        return NextResponse.json({ error: 'Failed to extract text from PDF' }, { status: 400 })
      }
    } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
      // Read text file directly
      extractedText = await file.text()
      console.log('[Agent Upload] Read', extractedText.length, 'characters from text file')
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or text files.' }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'No text could be extracted from the file' }, { status: 400 })
    }

    // Limit text to prevent context overflow (max ~50k chars)
    const maxLength = 50000
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '\n\n[Text truncated due to length...]'
    }

    // Get current project metadata
    const { data: fullProject } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', projectId)
      .single()

    // Append to existing agent context or create new
    const currentContext = fullProject?.metadata?.agent_context || ''
    const fileHeader = `\n\n--- Uploaded Document: ${file.name} ---\n\n`
    const newContext = currentContext + fileHeader + extractedText

    // Update project metadata
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        metadata: {
          ...(fullProject?.metadata || {}),
          agent_context: newContext,
          agent_context_updated_at: new Date().toISOString(),
          uploaded_files: [
            ...((fullProject?.metadata?.uploaded_files as string[]) || []),
            { name: file.name, uploadedAt: new Date().toISOString(), textLength: extractedText.length }
          ]
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('[Agent Upload] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to save extracted text' }, { status: 500 })
    }

    console.log('[Agent Upload] Successfully processed and saved:', file.name)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      textLength: extractedText.length,
      message: 'File processed and added to agent context'
    })
  } catch (error) {
    console.error('[Agent Upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}
