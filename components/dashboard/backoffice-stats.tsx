'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderKanban, Bot } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ConnectedUsersCard } from './connected-users'

interface BackofficeStatsProps {
    usersCount: number
    projectsCount: number
    applicationsCount: number
    currentUserId: string
    currentUserEmail: string | null
}

export function BackofficeStats({
    usersCount,
    projectsCount,
    applicationsCount,
    currentUserId,
    currentUserEmail,
}: BackofficeStatsProps) {
    const t = useTranslations('backoffice')

    const stats = [
        {
            title: t('stats.users'),
            value: usersCount,
            icon: Users,
            href: '/backoffice/users',
            gradient: 'from-teal-500 to-cyan-500',
        },
        {
            title: t('stats.projects'),
            value: projectsCount,
            icon: FolderKanban,
            href: '/backoffice/funds',
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: t('stats.applications'),
            value: applicationsCount,
            icon: Bot,
            href: '/backoffice/agent',
            gradient: 'from-orange-500 to-rose-500',
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {/* Connected Users Card - Real-time */}
            <ConnectedUsersCard userId={currentUserId} userEmail={currentUserEmail} />

            {/* Static Stats */}
            {stats.map((stat) => (
                <Card key={stat.title} className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                            <stat.icon className="h-5 w-5 text-white" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-heading font-bold text-foreground">
                            {stat.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
