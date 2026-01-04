import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    FileText,
    FolderKanban,
    TrendingUp,
    DollarSign,
    ArrowRight,
    Plus,
    Sparkles,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Activity,
    Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('dashboard')

    // Fetch stats with more details
    const [projectsResult, applicationsResult, recentApplicationsResult] = await Promise.all([
        supabase.from('projects').select('id, created_at', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('applications').select('id, status, amount_awarded, amount_requested, created_at, updated_at', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('applications')
            .select('id, status, amount_requested, created_at, fund:funds(name), project:projects(name)')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    const projectCount = projectsResult.count || 0
    const applicationCount = applicationsResult.count || 0
    const applications = applicationsResult.data || []
    const recentApplications = recentApplicationsResult.data || []

    // Application status breakdown
    const approvedApps = applications.filter(a => a.status === 'approved')
    const pendingApps = applications.filter(a => a.status === 'in_review' || a.status === 'submitted')
    const draftApps = applications.filter(a => a.status === 'draft')
    const rejectedApps = applications.filter(a => a.status === 'rejected')

    const totalAwarded = approvedApps.reduce((sum, a) => sum + (Number(a.amount_awarded) || 0), 0)
    const totalRequested = applications.reduce((sum, a) => sum + (Number(a.amount_requested) || 0), 0)
    const successRate = applicationCount > 0
        ? Math.round((approvedApps.length / applicationCount) * 100)
        : 0

    // Calculate trends (mock for now - in production, compare with previous period)
    const projectTrend = projectCount > 0 ? 'up' : 'neutral'
    const applicationTrend = pendingApps.length > 0 ? 'up' : 'neutral'

    const stats = [
        {
            name: t('stats.activeProjects'),
            value: projectCount.toString(),
            icon: FolderKanban,
            gradient: 'from-teal-500 to-cyan-500',
            bgGradient: 'from-teal-500/10 to-cyan-500/10',
            trend: projectTrend,
            trendValue: projectTrend === 'up' ? '+1' : null,
        },
        {
            name: t('stats.applications'),
            value: applicationCount.toString(),
            icon: FileText,
            gradient: 'from-indigo-500 to-purple-500',
            bgGradient: 'from-indigo-500/10 to-purple-500/10',
            trend: applicationTrend,
            trendValue: pendingApps.length > 0 ? `${pendingApps.length} ${t('stats.pending')}` : null,
        },
        {
            name: t('stats.successRate'),
            value: `${successRate}%`,
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-teal-500',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            trend: successRate >= 50 ? 'up' : successRate > 0 ? 'down' : 'neutral',
            trendValue: approvedApps.length > 0 ? `${approvedApps.length}/${applicationCount}` : null,
        },
        {
            name: t('stats.totalAwarded'),
            value: `$${totalAwarded.toLocaleString()}`,
            icon: DollarSign,
            gradient: 'from-orange-500 to-rose-500',
            bgGradient: 'from-orange-500/10 to-rose-500/10',
            trend: totalAwarded > 0 ? 'up' : 'neutral',
            trendValue: totalRequested > 0 ? `${Math.round((totalAwarded / totalRequested) * 100)}%` : null,
        },
    ]

    const statusConfig = {
        draft: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
        submitted: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        in_review: { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground">{t('title')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('welcome')}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                        v1.0.3 - Deploy Test
                    </Badge>
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
                    <Card key={stat.name} className="bg-card border-border hover-lift cursor-default overflow-hidden relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />
                        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.name}
                            </CardTitle>
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="h-5 w-5 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent className="relative space-y-1">
                            <div className="text-3xl font-heading font-bold text-foreground">{stat.value}</div>
                            {stat.trendValue && (
                                <div className="flex items-center gap-1 text-xs">
                                    {stat.trend === 'up' ? (
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    ) : stat.trend === 'down' ? (
                                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                                    ) : null}
                                    <span className={stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}>
                                        {stat.trendValue}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Application Status Breakdown */}
            {applicationCount > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="font-heading text-foreground flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    {t('breakdown.title')}
                                </CardTitle>
                                <CardDescription>{t('breakdown.subtitle')}</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/applications">
                                    {t('viewAll')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{draftApps.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('breakdown.drafts')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{pendingApps.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('breakdown.pending')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{approvedApps.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('breakdown.approved')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{rejectedApps.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('breakdown.rejected')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress bar showing overall success */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('breakdown.progressLabel')}</span>
                                <span className="font-medium">{successRate}%</span>
                            </div>
                            <Progress value={successRate} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            {recentApplications.length > 0 && (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="font-heading text-foreground flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            {t('recentActivity.title')}
                        </CardTitle>
                        <CardDescription>{t('recentActivity.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentApplications.map((app) => {
                                const status = app.status as keyof typeof statusConfig
                                const config = statusConfig[status] || statusConfig.draft
                                const StatusIcon = config.icon
                                // Handle Supabase join that returns object (not array) for single relations
                                const fundName = app.fund && typeof app.fund === 'object' && 'name' in app.fund
                                    ? (app.fund as { name: string }).name
                                    : t('recentActivity.unknownFund')
                                const projectName = app.project && typeof app.project === 'object' && 'name' in app.project
                                    ? (app.project as { name: string }).name
                                    : t('recentActivity.unknownProject')
                                return (
                                    <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                                <StatusIcon className={`h-4 w-4 ${config.color}`} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{fundName}</p>
                                                <p className="text-xs text-muted-foreground">{projectName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary" className={`${config.bg} ${config.color} border-0`}>
                                                {t(`status.${status}`)}
                                            </Badge>
                                            {app.amount_requested && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    ${Number(app.amount_requested).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-3">
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

                <Card className="relative overflow-hidden border-violet-500/20 hover-lift">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
                    <CardHeader className="relative">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="font-heading text-foreground">{t('quickActions.bookMeeting.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4">
                        <p className="text-muted-foreground">
                            {t('quickActions.bookMeeting.description')}
                        </p>
                        <Button asChild variant="outline" className="border-violet-500/50 hover:bg-violet-500/10">
                            <Link href="/dashboard/meetings">
                                <Users className="mr-2 h-4 w-4" />
                                {t('quickActions.bookMeeting.button')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
