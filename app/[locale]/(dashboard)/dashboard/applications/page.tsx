import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ArrowRight, Clock, CheckCircle2, XCircle, Send, Edit3 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

const STATUS_CONFIG = {
    draft: { icon: Edit3, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    submitted: { icon: Send, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    in_review: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    approved: { icon: CheckCircle2, color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    rejected: { icon: XCircle, color: 'bg-red-500/20 text-red-300 border-red-500/30' },
}

export default async function ApplicationsPage() {
    const t = await getTranslations('applications')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: applications } = await supabase
        .from('applications')
        .select(`
            *,
            project:projects(id, name, industry),
            fund:funds(id, name, organization, country, currency)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
                    <p className="text-slate-400 mt-1">{t('subtitle')}</p>
                </div>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link href="/dashboard/funds">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {t('browseFunds')}
                    </Link>
                </Button>
            </div>

            {applications && applications.length > 0 ? (
                <div className="space-y-4">
                    {applications.map((app) => {
                        const statusConfig = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
                        const StatusIcon = statusConfig.icon

                        return (
                            <Link key={app.id} href={`/dashboard/funds/${app.fund_id}/apply`}>
                                <Card className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-colors cursor-pointer">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {app.fund?.name || 'Unknown Fund'}
                                                    </h3>
                                                    <Badge className={statusConfig.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {t(`status.${app.status}`)}
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-400 text-sm mb-3">
                                                    {app.fund?.organization} • {app.fund?.country}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="text-slate-500">
                                                        {t('project')}: <span className="text-slate-300">{app.project?.name || 'N/A'}</span>
                                                    </div>
                                                    {app.amount_requested && (
                                                        <div className="text-slate-500">
                                                            {t('requested')}: <span className="text-slate-300">
                                                                ${Number(app.amount_requested).toLocaleString()} {app.fund?.currency || 'USD'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-slate-500 mb-1">{t('progress')}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-purple-500 rounded-full transition-all"
                                                            style={{ width: `${app.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm text-slate-400">{app.progress || 0}%</span>
                                                </div>
                                                {app.submitted_at && (
                                                    <div className="text-xs text-slate-500 mt-2">
                                                        {t('submittedOn')} {new Date(app.submitted_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <Card className="bg-slate-900 border-slate-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-slate-500" />
                        </div>
                        <CardTitle className="text-white mb-2">{t('empty.title')}</CardTitle>
                        <p className="text-slate-400 text-center max-w-sm mb-4">
                            {t('empty.description')}
                        </p>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                            <Link href="/dashboard/funds">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                {t('browseFunds')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
