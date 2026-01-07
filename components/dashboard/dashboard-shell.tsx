'use client'

import { useState } from 'react'
import { Header } from './header'
import { MobileSidebar } from './mobile-sidebar'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface DashboardShellProps {
    user: SupabaseUser
    profile: {
        full_name?: string
        avatar_url?: string
        email: string
    } | null
    children: React.ReactNode
}

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            <MobileSidebar
                open={sidebarOpen}
                onOpenChange={setSidebarOpen}
                userEmail={user.email}
            />
            <Header
                user={user}
                profile={profile}
                onMenuClick={() => setSidebarOpen(true)}
            />
            <main className="py-6 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </>
    )
}
