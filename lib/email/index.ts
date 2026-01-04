import { Resend } from 'resend'

// Lazy initialization to avoid build-time errors
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'CIDIF.TECH <noreply@cidif.tech>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'contacto@cidif.tech'

export type EmailTemplate =
  | 'welcome'
  | 'booking-confirmation'
  | 'booking-reminder'
  | 'payment-success'
  | 'payment-failed'
  | 'application-submitted'
  | 'application-approved'
  | 'application-rejected'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string } | null> {
  try {
    const resend = getResend()

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || EMAIL_REPLY_TO,
      tags: options.tags,
    })

    if (error) {
      console.error('[Email] Failed to send email:', error)
      return null
    }

    console.log(`[Email] Sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}, ID: ${data?.id}`)
    return data
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return null
  }
}

export * from './templates'
