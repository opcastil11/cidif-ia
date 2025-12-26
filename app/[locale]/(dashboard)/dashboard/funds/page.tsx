import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Landmark, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

export default async function FundsPage() {
    const supabase = await createClient()
    const t = await getTranslations('funds')

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
                    {funds.map((fund) => (
                        <Card key={fund.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                        {fund.type}
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-400">
                                        {fund.country}
                                    </Badge>
                                </div>
                                <CardTitle className="text-white mt-2">{fund.name}</CardTitle>
                                <CardDescription className="text-slate-400">
                                    {fund.organization}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center text-slate-400">
                                        <DollarSign className="h-4 w-4 mr-1" />
                                        {fund.amount_min?.toLocaleString()} - {fund.amount_max?.toLocaleString()} {fund.currency}
                                    </div>
                                </div>
                                {fund.deadline && (
                                    <div className="flex items-center text-sm text-slate-400">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {t('deadline')}: {new Date(fund.deadline).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Button asChild className="flex-1 bg-purple-600 hover:bg-purple-700">
                                        <Link href={`/dashboard/funds/${fund.id}/apply`}>
                                            {t('applyNow')}
                                        </Link>
                                    </Button>
                                    {fund.url && (
                                        <Button asChild variant="outline" size="icon" className="border-slate-700">
                                            <a href={fund.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
