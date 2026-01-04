import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface PaymentFailedEmailProps {
  userName: string
  amount: string
  currency: string
  description: string
  errorMessage?: string
  retryUrl?: string
  locale?: 'es' | 'en'
}

const translations = {
  es: {
    preview: 'Problema con tu pago',
    title: 'Pago No Procesado',
    greeting: 'Hola',
    intro: 'Lamentablemente, no pudimos procesar tu pago.',
    details: 'Detalles del intento:',
    amount: 'Monto',
    description: 'Descripcion',
    error: 'Motivo',
    retry: 'Reintentar Pago',
    commonIssues: 'Posibles causas:',
    issue1: 'Fondos insuficientes en la tarjeta',
    issue2: 'La tarjeta ha expirado',
    issue3: 'La transaccion fue rechazada por el banco',
    issue4: 'Información de pago incorrecta',
    help: 'Que puedes hacer:',
    helpStep1: 'Verifica los datos de tu tarjeta',
    helpStep2: 'Intenta con otro método de pago',
    helpStep3: 'Contacta a tu banco para más información',
    questions: 'Necesitas ayuda? Contáctanos a',
    closing: 'El equipo de CIDIF.TECH',
  },
  en: {
    preview: 'Issue with your payment',
    title: 'Payment Not Processed',
    greeting: 'Hello',
    intro: 'Unfortunately, we were unable to process your payment.',
    details: 'Attempt details:',
    amount: 'Amount',
    description: 'Description',
    error: 'Reason',
    retry: 'Retry Payment',
    commonIssues: 'Possible causes:',
    issue1: 'Insufficient funds on the card',
    issue2: 'The card has expired',
    issue3: 'The transaction was declined by the bank',
    issue4: 'Incorrect payment information',
    help: 'What you can do:',
    helpStep1: 'Verify your card details',
    helpStep2: 'Try a different payment method',
    helpStep3: 'Contact your bank for more information',
    questions: 'Need help? Contact us at',
    closing: 'The CIDIF.TECH Team',
  },
}

export function PaymentFailedEmail({
  userName,
  amount,
  currency,
  description,
  errorMessage,
  retryUrl,
  locale = 'es',
}: PaymentFailedEmailProps) {
  const t = translations[locale]

  return (
    <BaseLayout preview={t.preview} locale={locale}>
      <div style={errorBadge}>!</div>

      <Heading style={heading}>{t.title}</Heading>

      <Text style={paragraph}>
        {t.greeting} {userName},
      </Text>

      <Text style={paragraph}>{t.intro}</Text>

      <div style={detailsBox}>
        <Text style={detailsTitle}>{t.details}</Text>
        <Text style={detailItem}>
          <strong>{t.amount}:</strong> {currency} {amount}
        </Text>
        <Text style={detailItem}>
          <strong>{t.description}:</strong> {description}
        </Text>
        {errorMessage && (
          <Text style={detailItem}>
            <strong>{t.error}:</strong> {errorMessage}
          </Text>
        )}
      </div>

      {retryUrl && (
        <Button style={button} href={retryUrl}>
          {t.retry}
        </Button>
      )}

      <div style={issuesBox}>
        <Text style={issuesTitle}>{t.commonIssues}</Text>
        <Text style={issueItem}>• {t.issue1}</Text>
        <Text style={issueItem}>• {t.issue2}</Text>
        <Text style={issueItem}>• {t.issue3}</Text>
        <Text style={issueItem}>• {t.issue4}</Text>
      </div>

      <div style={helpBox}>
        <Text style={helpTitle}>{t.help}</Text>
        <Text style={helpItem}>1. {t.helpStep1}</Text>
        <Text style={helpItem}>2. {t.helpStep2}</Text>
        <Text style={helpItem}>3. {t.helpStep3}</Text>
      </div>

      <Hr style={hr} />

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

const errorBadge = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#ef4444',
  color: '#fff',
  fontSize: '32px',
  fontWeight: '600' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  textAlign: 'center' as const,
  lineHeight: '60px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#525f7f',
  margin: '0 0 16px',
}

const detailsBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
  borderLeft: '4px solid #ef4444',
}

const detailsTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#991b1b',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#991b1b',
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

const issuesBox = {
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
}

const issuesTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#92400e',
  margin: '0 0 12px',
}

const issueItem = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#92400e',
  margin: '0 0 4px',
}

const helpBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
}

const helpTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 12px',
}

const helpItem = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#525f7f',
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

export default PaymentFailedEmail
