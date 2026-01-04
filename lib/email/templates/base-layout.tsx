import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
  locale?: 'es' | 'en'
}

const footerText = {
  es: {
    company: 'CIDIF.TECH - Centro de Investigación e Innovación',
    rights: 'Todos los derechos reservados.',
    unsubscribe: 'Cancelar suscripción',
    privacy: 'Política de Privacidad',
  },
  en: {
    company: 'CIDIF.TECH - Research and Innovation Center',
    rights: 'All rights reserved.',
    unsubscribe: 'Unsubscribe',
    privacy: 'Privacy Policy',
  },
}

export function BaseLayout({ preview, children, locale = 'es' }: BaseLayoutProps) {
  const t = footerText[locale]
  const currentYear = new Date().getFullYear()

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://cidif-ia.vercel.app/logo.png"
              width="150"
              height="40"
              alt="CIDIF.TECH"
              style={logo}
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerCompany}>{t.company}</Text>
            <Text style={footerRights}>
              © {currentYear} {t.rights}
            </Text>
            <Text style={footerLinks}>
              <Link href="https://cidif-ia.vercel.app/privacy" style={link}>
                {t.privacy}
              </Link>
              {' | '}
              <Link href="https://cidif-ia.vercel.app/unsubscribe" style={link}>
                {t.unsubscribe}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '24px',
  borderBottom: '1px solid #e6ebf1',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const content = {
  padding: '24px 48px',
}

const footer = {
  padding: '24px',
  borderTop: '1px solid #e6ebf1',
  textAlign: 'center' as const,
}

const footerCompany = {
  color: '#8898aa',
  fontSize: '14px',
  fontWeight: '600' as const,
  margin: '0 0 8px',
}

const footerRights = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0 0 8px',
}

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  margin: '0',
}

const link = {
  color: '#556cd6',
  textDecoration: 'none',
}
