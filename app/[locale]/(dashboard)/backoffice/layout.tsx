import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

// Admin emails that can access backoffice
const ADMIN_EMAILS = ['oscar@forcast.cl', 'oscar@forcast.tech', 'opcastil@gmail.com']

export default async function BackofficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('backoffice')

    if (!user) {
        redirect('/login')
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email || '')) {
        redirect('/dashboard')
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-4">
                <h1 className="text-2xl font-heading font-bold text-foreground">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            {children}
        </div>
    )
}
