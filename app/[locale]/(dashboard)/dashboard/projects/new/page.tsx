'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

const INDUSTRIES = [
    'technology',
    'health',
    'fintech',
    'agritech',
    'energy',
    'education',
    'ecommerce',
    'logistics',
    'manufacturing',
    'food',
    'environment',
    'other',
]

const STAGES = [
    'idea',
    'mvp',
    'early_revenue',
    'growth',
    'scale',
]

const COUNTRIES = [
    { code: 'CL', name: 'Chile' },
    { code: 'MX', name: 'Mexico' },
    { code: 'CO', name: 'Colombia' },
    { code: 'AR', name: 'Argentina' },
    { code: 'PE', name: 'Peru' },
    { code: 'BR', name: 'Brazil' },
    { code: 'US', name: 'USA' },
    { code: 'ES', name: 'Spain' },
    { code: 'OTHER', name: 'Other' },
]

export default function NewProjectPage() {
    const router = useRouter()
    const t = useTranslations('newProject')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        industry: '',
        stage: '',
        team_size: '',
        annual_revenue: '',
        founded_date: '',
        pitch_deck_url: '',
        country: '',
        website_url: '',
        problem_statement: '',
        value_proposition: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error('Not authenticated')
            }

            const { data: newProject, error: insertError } = await supabase
                .from('projects')
                .insert({
                    user_id: user.id,
                    name: formData.name,
                    description: formData.description || null,
                    industry: formData.industry || null,
                    stage: formData.stage || null,
                    team_size: formData.team_size ? parseInt(formData.team_size) : null,
                    annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
                    founded_date: formData.founded_date || null,
                    pitch_deck_url: formData.pitch_deck_url || null,
                    country: formData.country || null,
                    website_url: formData.website_url || null,
                    problem_statement: formData.problem_statement || null,
                    value_proposition: formData.value_proposition || null,
                })
                .select('id')
                .single()

            if (insertError) throw insertError

            // Redirect to the project detail page where they can add more information
            router.push(`/dashboard/projects/${newProject.id}`)
        } catch (err) {
            console.error('Error creating project:', err)
            setError(err instanceof Error ? err.message : 'Error creating project')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Link href="/dashboard/projects">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                    <p className="text-slate-400">{t('subtitle')}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">{t('basicInfo')}</CardTitle>
                        <CardDescription className="text-slate-400">
                            {t('subtitle')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-200">{t('name')} *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('namePlaceholder')}
                                required
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-200">{t('description')}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('descriptionPlaceholder')}
                                rows={3}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="industry" className="text-slate-200">{t('industry')}</Label>
                                <select
                                    id="industry"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                >
                                    <option value="">{t('selectIndustry')}</option>
                                    {INDUSTRIES.map((ind) => (
                                        <option key={ind} value={ind}>{t(`industries.${ind}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stage" className="text-slate-200">{t('stage')}</Label>
                                <select
                                    id="stage"
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                >
                                    <option value="">{t('selectStage')}</option>
                                    {STAGES.map((stg) => (
                                        <option key={stg} value={stg}>{t(`stages.${stg}`)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-slate-200">{t('country')}</Label>
                                <select
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                >
                                    <option value="">{t('selectCountry')}</option>
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="team_size" className="text-slate-200">{t('teamSize')}</Label>
                                <Input
                                    id="team_size"
                                    type="number"
                                    min="1"
                                    value={formData.team_size}
                                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                                    placeholder="5"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="annual_revenue" className="text-slate-200">{t('annualRevenue')}</Label>
                                <Input
                                    id="annual_revenue"
                                    type="number"
                                    min="0"
                                    value={formData.annual_revenue}
                                    onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                                    placeholder="100000"
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="founded_date" className="text-slate-200">{t('foundedDate')}</Label>
                                <Input
                                    id="founded_date"
                                    type="date"
                                    value={formData.founded_date}
                                    onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pitch_deck_url" className="text-slate-200">{t('pitchDeck')}</Label>
                                <Input
                                    id="pitch_deck_url"
                                    type="url"
                                    value={formData.pitch_deck_url}
                                    onChange={(e) => setFormData({ ...formData, pitch_deck_url: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                                <p className="text-xs text-slate-500">{t('pitchDeckHelp')}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website_url" className="text-slate-200">{t('websiteUrl')}</Label>
                                <Input
                                    id="website_url"
                                    type="url"
                                    value={formData.website_url}
                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                    placeholder="https://..."
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="problem_statement" className="text-slate-200">{t('problemStatement')}</Label>
                            <Textarea
                                id="problem_statement"
                                value={formData.problem_statement}
                                onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                                placeholder={t('problemStatementPlaceholder')}
                                rows={2}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value_proposition" className="text-slate-200">{t('valueProposition')}</Label>
                            <Textarea
                                id="value_proposition"
                                value={formData.value_proposition}
                                onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                                placeholder={t('valuePropositionPlaceholder')}
                                rows={2}
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="border-slate-700 text-slate-300"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !formData.name}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {loading ? t('saving') : t('save')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
