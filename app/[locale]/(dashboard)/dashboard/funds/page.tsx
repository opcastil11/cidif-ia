import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Landmark, Calendar, DollarSign, ExternalLink, Clock, FileText, AlertTriangle } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

interface FundsPageProps {
    searchParams: Promise<{ project?: string }>
}

interface FundRequirements {
    sections?: Array<{ key: string; name: string; type: string }>
    pages?: Array<{ sections?: Array<{ key: string; name: string; type: string }> }>
}

function getDaysRemaining(deadline: string): number {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadlineDate.setHours(0, 0, 0, 0)
    const diffTime = deadlineDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getEstimatedFillTime(requirements: FundRequirements | null): number {
    if (!requirements) return 30

    let fieldCount = 0

    // Count fields from sections
    if (requirements.sections) {
        fieldCount += requirements.sections.length
    }

    // Count fields from pages
    if (requirements.pages) {
        for (const page of requirements.pages) {
            if (page.sections) {
                fieldCount += page.sections.length
            }
        }
    }

    // Estimate: 3 minutes per field on average, minimum 15 minutes
    return Math.max(15, fieldCount * 3)
}

function getDeadlineStatus(daysRemaining: number): { color: string; urgency: 'critical' | 'warning' | 'normal' } {
    if (daysRemaining <= 0) {
        return { color: 'text-red-400', urgency: 'critical' }
    } else if (daysRemaining <= 7) {
        return { color: 'text-orange-400', urgency: 'warning' }
    } else if (daysRemaining <= 30) {
        return { color: 'text-yellow-400', urgency: 'normal' }
    }
    return { color: 'text-slate-400', urgency: 'normal' }
}

export default async function FundsPage({ searchParams }: FundsPageProps) {
    const supabase = await createClient()
    const t = await getTranslations('funds')
    const { project: preSelectedProject } = await searchParams

    const { data: funds } = await supabase
        .from('funds')
        .select('*')
        .eq('is_active', true)
        .order('deadline', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
                <p className="text-slate-400 mt-1">{t('subtitle')}</p>
            </div>

            {funds && funds.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {funds.map((fund) => {
                        const daysRemaining = fund.deadline ? getDaysRemaining(fund.deadline) : null
                        const deadlineStatus = daysRemaining !== null ? getDeadlineStatus(daysRemaining) : null
                        const estimatedTime = getEstimatedFillTime(fund.requirements as FundRequirements | null)
                        const fieldCount = fund.requirements ?
                            ((fund.requirements as FundRequirements).sections?.length || 0) +
                            ((fund.requirements as FundRequirements).pages?.reduce((acc: number, p: { sections?: Array<unknown> }) => acc + (p.sections?.length || 0), 0) || 0)
                            : 0

                        return (
                            <Card key={fund.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-700">
                                                {t(`types.${fund.type}` as Parameters<typeof t>[0], { defaultValue: fund.type })}
                                            </Badge>
                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                {fund.country}
                                            </Badge>
                                        </div>
                                        {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
                                            <Badge variant="outline" className="border-orange-600 bg-orange-900/30 text-orange-300 whitespace-nowrap">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                {t('closingSoon')}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-white mt-3 text-lg leading-tight">{fund.name}</CardTitle>
                                    <CardDescription className="text-slate-400 text-sm">
                                        {fund.organization}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col">
                                    {/* Amount */}
                                    <div className="flex items-center text-sm">
                                        <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                                        <span className="text-white font-medium">
                                            {fund.amount_min?.toLocaleString()} - {fund.amount_max?.toLocaleString()} {fund.currency}
                                        </span>
                                    </div>

                                    {/* Deadline with days remaining */}
                                    {fund.deadline && daysRemaining !== null && (
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center text-slate-400">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {new Date(fund.deadline).toLocaleDateString()}
                                            </div>
                                            <span className={`font-medium ${deadlineStatus?.color}`}>
                                                {daysRemaining <= 0
                                                    ? t('expired')
                                                    : daysRemaining === 1
                                                        ? t('daysRemaining.one')
                                                        : t('daysRemaining.other', { count: daysRemaining })
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {/* Estimated time and fields */}
                                    <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-800">
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-2" />
                                            {estimatedTime >= 60
                                                ? t('estimatedTime.hours', { count: Math.round(estimatedTime / 60) })
                                                : t('estimatedTime.minutes', { count: estimatedTime })
                                            }
                                        </div>
                                        {fieldCount > 0 && (
                                            <div className="flex items-center">
                                                <FileText className="h-4 w-4 mr-1" />
                                                {t('fields', { count: fieldCount })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto pt-2">
                                        <Button
                                            asChild
                                            className={`flex-1 ${
                                                daysRemaining !== null && daysRemaining <= 0
                                                    ? 'bg-slate-700 hover:bg-slate-600 cursor-not-allowed'
                                                    : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                            disabled={daysRemaining !== null && daysRemaining <= 0}
                                        >
                                            <Link href={preSelectedProject ? `/dashboard/funds/${fund.id}/apply?project=${preSelectedProject}` : `/dashboard/funds/${fund.id}/apply`}>
                                                {daysRemaining !== null && daysRemaining <= 0 ? t('closed') : t('applyNow')}
                                            </Link>
                                        </Button>
                                        {fund.url && (
                                            <Button asChild variant="outline" size="icon" className="border-slate-700 hover:bg-slate-800">
                                                <a href={fund.url} target="_blank" rel="noopener noreferrer" title={t('viewDetails')}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card className="bg-slate-900 border-slate-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <Landmark className="h-8 w-8 text-slate-500" />
                        </div>
                        <CardTitle className="text-white mb-2">{t('empty.title')}</CardTitle>
                        <p className="text-slate-400 text-center max-w-sm">
                            {t('empty.description')}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
