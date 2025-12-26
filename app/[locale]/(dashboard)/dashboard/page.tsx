import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    FileText,
    FolderKanban,
    TrendingUp,
    DollarSign,
    ArrowRight,
    Plus,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('dashboard')

    // Fetch stats
    const [projectsResult, applicationsResult] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('applications').select('id, status, amount_awarded', { count: 'exact' }).eq('user_id', user?.id),
    ])

    const projectCount = projectsResult.count || 0
    const applicationCount = applicationsResult.count || 0
    const approvedApps = applicationsResult.data?.filter(a => a.status === 'approved') || []
    const totalAwarded = approvedApps.reduce((sum, a) => sum + (Number(a.amount_awarded) || 0), 0)
    const successRate = applicationCount > 0
        ? Math.round((approvedApps.length / applicationCount) * 100)
        : 0

    const stats = [
        {
            name: t('stats.activeProjects'),
            value: projectCount.toString(),
            icon: FolderKanban,
            gradient: 'from-teal-500 to-cyan-500',
            bgGradient: 'from-teal-500/10 to-cyan-500/10',
        },
        {
            name: t('stats.applications'),
            value: applicationCount.toString(),
            icon: FileText,
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-500/10 to-purple-500/10',
        },
        {
            name: t('stats.successRate'),
            value: `${successRate}%`,
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
        },
        {
            name: t('stats.totalAwarded'),
            value: `$${totalAwarded.toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-orange-500 to-rose-500',
            bgGradient: 'from-orange-500/10 to-rose-500/10',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('welcome')}
                    </p>
                </div>
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Link href="/dashboard/funds">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('browseFunds')}
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="bg-card border-border hover-lift cursor-default overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />
                        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.name}
                            </CardTitle>
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative">
                            <div className="text-3xl font-heading font-bold text-foreground">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="relative overflow-hidden border-primary/20 hover-lift">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                    <CardHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="font-heading text-foreground">{t('quickActions.newApplication.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                        <p className="text-muted-foreground">
                            {t('quickActions.newApplication.description')}
                        </p>
                        <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                            <Link href="/dashboard/funds">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('browseFunds')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-accent/20 hover-lift">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
                    <CardHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <FolderKanban className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="font-heading text-foreground">{t('quickActions.createProject.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                        <p className="text-muted-foreground">
                            {t('quickActions.createProject.description')}
                        </p>
                        <Button asChild variant="outline" className="border-accent/50 hover:bg-accent/10">
                            <Link href="/dashboard/projects/new">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                {t('createProject')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
