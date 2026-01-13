import { Suspense } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { ClipboardCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { EvaluationClientContent } from './evaluation-client'

export default async function EvaluationsPage() {
    const t = await getTranslations('evaluation')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user's projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description, industry, stage')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    // Fetch available funds for fund-specific evaluation
    const { data: funds } = await supabase
        .from('funds')
        .select('id, name, organization, country')
        .eq('is_active', true)
        .order('name')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
                <p className="text-slate-400 mt-1">{t('subtitle')}</p>
            </div>

            {projects && projects.length > 0 ? (
                <Suspense fallback={<div className="text-slate-400">{t('loading')}</div>}>
                    <EvaluationClientContent
                        projects={projects}
                        funds={funds || []}
                    />
                </Suspense>
            ) : (
                <Card className="bg-slate-900 border-slate-800 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                            <ClipboardCheck className="h-8 w-8 text-slate-500" />
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
