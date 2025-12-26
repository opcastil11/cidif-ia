import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/routing'
import { Users, FolderKanban, Bot, CreditCard, ArrowRight, Crown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function BackofficePage() {
    const supabase = await createClient()
    const t = await getTranslations('backoffice')

    // Get stats
    const [usersResult, projectsResult, applicationsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('applications').select('id', { count: 'exact' }),
    ])

    const stats = [
        {
            title: t('stats.users'),
            value: usersResult.count || 0,
            icon: Users,
            href: '/backoffice/users',
            gradient: 'from-teal-500 to-cyan-500',
        },
        {
            title: t('stats.projects'),
            value: projectsResult.count || 0,
            icon: FolderKanban,
            href: '/backoffice/funds',
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: t('stats.applications'),
            value: applicationsResult.count || 0,
            icon: Bot,
            href: '/backoffice/agent',
            gradient: 'from-orange-500 to-rose-500',
        },
    ]

    const sections = [
        {
            title: t('sections.users.title'),
            description: t('sections.users.description'),
            icon: Users,
            href: '/backoffice/users',
            gradient: 'from-teal-500 to-cyan-500',
        },
        {
            title: t('sections.funds.title'),
            description: t('sections.funds.description'),
            icon: FolderKanban,
            href: '/backoffice/funds',
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: t('sections.agent.title'),
            description: t('sections.agent.description'),
            icon: Bot,
            href: '/backoffice/agent',
            gradient: 'from-emerald-500 to-teal-500',
        },
        {
            title: t('sections.billing.title'),
            description: t('sections.billing.description'),
            icon: CreditCard,
            href: '/backoffice/billing',
            gradient: 'from-orange-500 to-rose-500',
        },
        {
            title: t('sections.plans.title'),
            description: t('sections.plans.description'),
            icon: Crown,
            href: '/backoffice/plans',
            gradient: 'from-amber-500 to-yellow-500',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
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

            {/* Sections */}
            <div className="grid gap-6 md:grid-cols-2">
                {sections.map((section) => (
                    <Link key={section.title} href={section.href}>
                        <Card className="bg-card border-border hover-lift cursor-pointer group h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <section.icon className="h-7 w-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-heading text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {section.title}
                                        </h3>
                                        <p className="text-muted-foreground mt-1">
                                            {section.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
