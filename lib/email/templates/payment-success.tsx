import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface PaymentSuccessEmailProps {
  userName: string
  amount: string
  currency: string
  description: string
  invoiceId: string
  invoiceUrl?: string
  locale?: 'es' | 'en'
}

const translations = {
  es: {
    preview: 'Pago recibido exitosamente',
    title: 'Pago Confirmado',
    greeting: 'Hola',
    intro: 'Hemos recibido tu pago exitosamente. Gracias por tu confianza.',
    details: 'Detalles del pago:',
    amount: 'Monto',
    description: 'Descripcion',
    invoiceId: 'Numero de factura',
    viewInvoice: 'Ver Factura',
    whatNext: 'Proximos pasos:',
    step1: 'Tu servicio ya esta activo',
    step2: 'Revisa tu panel de control para ver los detalles',
    step3: 'Recibirás un correo con más información pronto',
    questions: 'Tienes preguntas? Contáctanos a',
    closing: 'El equipo de CIDIF.TECH',
  },
  en: {
    preview: 'Payment received successfully',
    title: 'Payment Confirmed',
    greeting: 'Hello',
    intro: 'We have successfully received your payment. Thank you for your trust.',
    details: 'Payment details:',
    amount: 'Amount',
    description: 'Description',
    invoiceId: 'Invoice number',
    viewInvoice: 'View Invoice',
    whatNext: 'Next steps:',
    step1: 'Your service is now active',
    step2: 'Check your dashboard for details',
    step3: 'You will receive an email with more information soon',
    questions: 'Have questions? Contact us at',
    closing: 'The CIDIF.TECH Team',
  },
}

export function PaymentSuccessEmail({
  userName,
  amount,
  currency,
  description,
  invoiceId,
  invoiceUrl,
  locale = 'es',
}: PaymentSuccessEmailProps) {
  const t = translations[locale]

  return (
    <BaseLayout preview={t.preview} locale={locale}>
      <div style={successBadge}>✓</div>

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
        <Text style={detailItem}>
          <strong>{t.invoiceId}:</strong> {invoiceId}
        </Text>
      </div>

      {invoiceUrl && (
        <Button style={button} href={invoiceUrl}>
          {t.viewInvoice}
        </Button>
      )}

      <div style={stepsBox}>
        <Text style={stepsTitle}>{t.whatNext}</Text>
        <Text style={stepItem}>1. {t.step1}</Text>
        <Text style={stepItem}>2. {t.step2}</Text>
        <Text style={stepItem}>3. {t.step3}</Text>
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

const successBadge = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
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
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
  borderLeft: '4px solid #10b981',
}

const detailsTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#166534',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const detailItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#166534',
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

const stepsBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '16px 0',
}

const stepsTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  margin: '0 0 12px',
}

const stepItem = {
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

export default PaymentSuccessEmail
