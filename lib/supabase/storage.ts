import { createClient } from './client'

export type BucketName = 'project-documents' | 'application-attachments' | 'avatars'

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(
  bucket: BucketName,
  folder: string,
  file: File
): Promise<UploadResult> {
  const supabase = createClient()

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('[Storage] Upload error:', error)
    return { success: false, error: error.message }
  }

  // Get public URL for avatars, signed URL for private buckets
  if (bucket === 'avatars') {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, path: data.path, url: urlData.publicUrl }
  }

  // For private buckets, generate signed URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(data.path, 3600) // 1 hour expiry

  if (signedError) {
    return { success: true, path: data.path }
  }

  return { success: true, path: data.path, url: signedData.signedUrl }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('[Storage] Delete error:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: BucketName,
  folder: string
): Promise<{ files: { name: string; size: number; createdAt: string }[]; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) {
    console.error('[Storage] List error:', error)
    return { files: [], error: error.message }
  }

  return {
    files: data.map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || '',
    })),
  }
}

/**
 * Get a signed URL for a private file
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('[Storage] Signed URL error:', error)
    return { error: error.message }
  }

  return { url: data.signedUrl }
}

/**
 * Extract text from a PDF file using pdf-parse (server-side only)
 * Returns null if pdf-parse is not available or extraction fails
 */
export async function extractTextFromPDF(file: File): Promise<string | null> {
  try {
    // This function should be called server-side only
    // For client-side, we upload and process on the server
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)

    return data.text
  } catch (error) {
    console.error('[Storage] PDF extraction error:', error)
    return null
  }
}
