import { redirect } from 'next/navigation'

type Params = Promise<{ locale: string }>

// Redirect settings to profile page (which contains account settings)
export default async function SettingsPage({ params }: { params: Params }) {
    const { locale } = await params
    redirect(`/${locale}/dashboard/profile`)
}
