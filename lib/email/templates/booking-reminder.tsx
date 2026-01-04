import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface BookingReminderEmailProps {
  userName: string
  meetingType: string
  dateTime: string
  duration: string
  meetingLink?: string
  hoursUntilMeeting: number
  locale?: 'es' | 'en'
}

const translations = {
  es: {
    preview: 'Recordatorio: Tu reunión es pronto',
    title: 'Recordatorio de Reunión',
    greeting: 'Hola',
    intro: (hours: number) =>
      `Te recordamos que tu reunión está programada para dentro de ${hours} horas.`,
    details: 'Detalles de la reunión:',
    type: 'Tipo de reunión',
    date: 'Fecha y hora',
    duration: 'Duración',
    joinMeeting: 'Unirse a la reunión',
    prepare: 'Preparación sugerida:',
    tip1: 'Revisa los documentos de tu proyecto antes de la reunión',
    tip2: 'Prepara tus preguntas con anticipación',
    tip3: 'Asegúrate de tener buena conexión a internet',
    reschedule: '¿No puedes asistir?',
    rescheduleLink: 'Reagendar reunión',
    questions: '¿Tienes preguntas? Contáctanos a',
    closing: 'El equipo de CIDIF.TECH',
  },
  en: {
    preview: 'Reminder: Your meeting is coming up',
    title: 'Meeting Reminder',
    greeting: 'Hello',
    intro: (hours: number) =>
      `This is a reminder that your meeting is scheduled in ${hours} hours.`,
    details: 'Meeting details:',
    type: 'Meeting type',
    date: 'Date and time',
    duration: 'Duration',
    joinMeeting: 'Join Meeting',
    prepare: 'Suggested preparation:',
    tip1: 'Review your project documents before the meeting',
    tip2: 'Prepare your questions in advance',
    tip3: 'Ensure you have a good internet connection',
    reschedule: "Can't attend?",
    rescheduleLink: 'Reschedule meeting',
    questions: 'Have questions? Contact us at',
    closing: 'The CIDIF.TECH Team',
  },
}

export function BookingReminderEmail({
  userName,
  meetingType,
  dateTime,
  duration,
  meetingLink,
  hoursUntilMeeting,
  locale = 'es',
}: BookingReminderEmailProps) {
  const t = translations[locale]

  return (
    <BaseLayout preview={t.preview} locale={locale}>
      <Heading style={heading}>{t.title}</Heading>

      <Text style={paragraph}>
        {t.greeting} {userName},
      </Text>

      <Text style={paragraph}>{t.intro(hoursUntilMeeting)}</Text>

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

      <div style={tipsBox}>
        <Text style={tipsTitle}>{t.prepare}</Text>
        <Text style={tipItem}>• {t.tip1}</Text>
        <Text style={tipItem}>• {t.tip2}</Text>
        <Text style={tipItem}>• {t.tip3}</Text>
      </div>

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

const tipsBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
  borderLeft: '4px solid #f59e0b',
}

const tipsTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#92400e',
  margin: '0 0 12px',
}

const tipItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#92400e',
  margin: '0 0 4px',
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

export default BookingReminderEmail
