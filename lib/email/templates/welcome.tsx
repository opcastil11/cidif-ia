import {
  Button,
  Heading,
  Hr,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface WelcomeEmailProps {
  userName: string
  locale?: 'es' | 'en'
}

const translations = {
  es: {
    preview: 'Bienvenido a CIDIF.TECH',
    greeting: 'Hola',
    welcome: 'Bienvenido a CIDIF.TECH',
    intro: 'Gracias por registrarte en nuestra plataforma. Estamos emocionados de ayudarte a conseguir financiamiento para tus proyectos de innovación.',
    features: 'Con CIDIF.TECH podrás:',
    feature1: 'Explorar fondos disponibles en LATAM, USA y Europa',
    feature2: 'Usar nuestro asistente de IA para formular proyectos',
    feature3: 'Gestionar tus postulaciones de forma eficiente',
    feature4: 'Recibir asesoría experta en cada paso',
    cta: 'Explorar Fondos',
    questions: '¿Tienes preguntas? No dudes en contactarnos a',
    closing: 'El equipo de CIDIF.TECH',
  },
  en: {
    preview: 'Welcome to CIDIF.TECH',
    greeting: 'Hello',
    welcome: 'Welcome to CIDIF.TECH',
    intro: 'Thank you for signing up on our platform. We are excited to help you secure funding for your innovation projects.',
    features: 'With CIDIF.TECH you can:',
    feature1: 'Explore available funds in LATAM, USA, and Europe',
    feature2: 'Use our AI assistant to formulate projects',
    feature3: 'Manage your applications efficiently',
    feature4: 'Receive expert advice at every step',
    cta: 'Explore Funds',
    questions: 'Have questions? Feel free to contact us at',
    closing: 'The CIDIF.TECH Team',
  },
}

export function WelcomeEmail({ userName, locale = 'es' }: WelcomeEmailProps) {
  const t = translations[locale]

  return (
    <BaseLayout preview={t.preview} locale={locale}>
      <Heading style={heading}>{t.welcome}</Heading>

      <Text style={paragraph}>
        {t.greeting} {userName},
      </Text>

      <Text style={paragraph}>
        {t.intro}
      </Text>

      <Text style={paragraph}>
        <strong>{t.features}</strong>
      </Text>

      <Text style={listItem}>• {t.feature1}</Text>
      <Text style={listItem}>• {t.feature2}</Text>
      <Text style={listItem}>• {t.feature3}</Text>
      <Text style={listItem}>• {t.feature4}</Text>

      <Button style={button} href="https://cidif-ia.vercel.app/dashboard/funds">
        {t.cta}
      </Button>

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

const listItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#525f7f',
  margin: '0 0 8px',
  paddingLeft: '16px',
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

export default WelcomeEmail
