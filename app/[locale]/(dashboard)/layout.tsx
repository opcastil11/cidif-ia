import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar userEmail={user.email} />
            <div className="lg:pl-72">
                <DashboardShell user={user} profile={profile}>
                    {children}
                </DashboardShell>
            </div>
            <Toaster />
        </div>
    )
}
