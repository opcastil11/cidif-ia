import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { OrquestaEmbedWrapper } from '@/components/orquesta/orquesta-embed';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CIDIF.TECH - Plataforma de Postulación a Fondos",
    template: "%s | CIDIF.TECH",
  },
  description: "Plataforma SaaS para ayudar a emprendedores y startups a postular a fondos públicos y privados en LATAM, USA y Europa con asistencia potenciada por IA.",
  keywords: ["financiamiento", "startups", "fondos", "LATAM", "emprendimiento", "asistente IA"],
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <OrquestaEmbedWrapper />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
