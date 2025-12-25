import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    FileText,
    FolderKanban,
    TrendingUp,
    DollarSign,
    ArrowRight,
    Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
            name: 'Active Projects',
            value: projectCount.toString(),
            icon: FolderKanban,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            name: 'Applications',
            value: applicationCount.toString(),
            icon: FileText,
            color: 'from-purple-500 to-pink-500',
        },
        {
            name: 'Success Rate',
            value: `${successRate}%`,
            icon: TrendingUp,
            color: 'from-green-500 to-emerald-500',
        },
        {
            name: 'Total Awarded',
            value: `$${totalAwarded.toLocaleString()}`,
            icon: DollarSign,
            color: 'from-amber-500 to-orange-500',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Welcome back! Here&apos;s an overview of your fund applications.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                {stat.name}
                            </CardTitle>
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">Start New Application</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-400">
                            Browse available funds and start a new application with AI assistance.
                        </p>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                            <Link href="/dashboard/funds">
                                <Plus className="mr-2 h-4 w-4" />
                                Browse Funds
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-white">Create Project</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-400">
                            Set up your project profile to apply for multiple funds.
                        </p>
                        <Button asChild variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                            <Link href="/dashboard/projects/new">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Create Project
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
