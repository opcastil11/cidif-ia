import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface BookingConfirmationEmailProps {
  userName: string
  meetingType: string
  dateTime: string
  duration: string
  meetingLink?: string
  locale?: 'es' | 'en'
}

const translations = {
  es: {
    preview: 'Tu reunión ha sido confirmada',
    title: 'Reunión Confirmada',
    greeting: 'Hola',
    intro: 'Tu reunión ha sido programada exitosamente.',
    details: 'Detalles de la reunión:',
    type: 'Tipo de reunión',
    date: 'Fecha y hora',
    duration: 'Duración',
    joinMeeting: 'Unirse a la reunión',
    addCalendar: 'Añadir a calendario',
    note: 'Recibirás un recordatorio 24 horas antes de la reunión.',
    reschedule: '¿Necesitas reagendar?',
    rescheduleLink: 'Haz clic aquí para reagendar',
    questions: '¿Tienes preguntas? Contáctanos a',
    closing: 'El equipo de CIDIF.TECH',
  },
  en: {
    preview: 'Your meeting has been confirmed',
    title: 'Meeting Confirmed',
    greeting: 'Hello',
    intro: 'Your meeting has been successfully scheduled.',
    details: 'Meeting details:',
    type: 'Meeting type',
    date: 'Date and time',
    duration: 'Duration',
    joinMeeting: 'Join Meeting',
    addCalendar: 'Add to calendar',
    note: 'You will receive a reminder 24 hours before the meeting.',
    reschedule: 'Need to reschedule?',
    rescheduleLink: 'Click here to reschedule',
    questions: 'Have questions? Contact us at',
    closing: 'The CIDIF.TECH Team',
  },
}

export function BookingConfirmationEmail({
  userName,
  meetingType,
  dateTime,
  duration,
  meetingLink,
  locale = 'es',
}: BookingConfirmationEmailProps) {
  const t = translations[locale]

  return (
    <BaseLayout preview={t.preview} locale={locale}>
      <Heading style={heading}>{t.title}</Heading>

      <Text style={paragraph}>
        {t.greeting} {userName},
      </Text>

      <Text style={paragraph}>{t.intro}</Text>

      <div style={detailsBox}>
        <Text style={detailsTitle}>{t.details}</Text>
        <Text style={detailItem}>
          <strong>{t.type}:</strong> {meetingType}
        </Text>
        <Text style={detailItem}>
          <strong>{t.date}:</strong> {dateTime}
        </Text>
        <Text style={detailItem}>
          <strong>{t.duration}:</strong> {duration}
        </Text>
      </div>

      {meetingLink && (
        <Button style={button} href={meetingLink}>
          {t.joinMeeting}
        </Button>
      )}

      <Text style={note}>{t.note}</Text>

      <Hr style={hr} />

      <Text style={paragraph}>
        {t.reschedule}{' '}
        <Link href="https://cidif-ia.vercel.app/dashboard/meetings" style={link}>
          {t.rescheduleLink}
        </Link>
      </Text>

      <Text style={paragraph}>
        {t.questions}{' '}
        <Link href="mailto:contacto@cidif.tech" style={link}>
          contacto@cidif.tech
        </Link>
      </Text>

      <Text style={signature}>{t.closing}</Text>
    </BaseLayout>
  )
}

const heading = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 24px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#525f7f',
  margin: '0 0 16px',
}

const detailsBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
}

const detailsTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
  margin: '0 0 8px',
}

const button = {
  backgroundColor: '#556cd6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0',
}

const note = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#8898aa',
  fontStyle: 'italic' as const,
  margin: '16px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
}

const link = {
  color: '#556cd6',
  textDecoration: 'none',
}

const signature = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '24px 0 0',
}

export default BookingConfirmationEmail
