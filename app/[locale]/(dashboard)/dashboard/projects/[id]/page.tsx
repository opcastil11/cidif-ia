'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Save, Loader2, Trash2, Users, DollarSign, Calendar, ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'

const INDUSTRIES = [
    'technology', 'health', 'fintech', 'agritech', 'energy',
    'education', 'ecommerce', 'logistics', 'manufacturing', 'food', 'environment', 'other',
]

const STAGES = ['idea', 'mvp', 'early_revenue', 'growth', 'scale']

interface Project {
    id: string
    name: string
    description: string | null
    industry: string | null
    stage: string | null
    team_size: number | null
    annual_revenue: number | null
    founded_date: string | null
    pitch_deck_url: string | null
    created_at: string
    updated_at: string
}

export default function ProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const t = useTranslations('projectDetail')
    const tNew = useTranslations('newProject')
    const projectId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [project, setProject] = useState<Project | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        industry: '',
        stage: '',
        team_size: '',
        annual_revenue: '',
        founded_date: '',
        pitch_deck_url: '',
    })

    useEffect(() => {
        loadProject()
    }, [projectId])

    const loadProject = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !data) {
            setError(t('notFound'))
            setLoading(false)
            return
        }

        setProject(data)
        setFormData({
            name: data.name || '',
            description: data.description || '',
            industry: data.industry || '',
            stage: data.stage || '',
            team_size: data.team_size?.toString() || '',
            annual_revenue: data.annual_revenue?.toString() || '',
            founded_date: data.founded_date || '',
            pitch_deck_url: data.pitch_deck_url || '',
        })
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()

            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    name: formData.name,
                    description: formData.description || null,
                    industry: formData.industry || null,
                    stage: formData.stage || null,
                    team_size: formData.team_size ? parseInt(formData.team_size) : null,
                    annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
                    founded_date: formData.founded_date || null,
                    pitch_deck_url: formData.pitch_deck_url || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId)

            if (updateError) throw updateError

            setProject({
                ...project!,
                ...formData,
                team_size: formData.team_size ? parseInt(formData.team_size) : null,
                annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
            })
            setIsEditing(false)
        } catch (err) {
            console.error('Error updating project:', err)
            setError(err instanceof Error ? err.message : t('saveError'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm(t('deleteConfirm'))) return

        setDeleting(true)
        setError(null)

        try {
            const supabase = createClient()

            const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)

            if (deleteError) throw deleteError

            router.push('/dashboard/projects')
        } catch (err) {
            console.error('Error deleting project:', err)
            setError(err instanceof Error ? err.message : t('deleteError'))
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!project) {
        return (
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-red-400">{error || t('notFound')}</p>
                        <Button asChild variant="outline" className="mt-4 border-slate-700 text-slate-300">
                            <Link href="/dashboard/projects">{t('backToProjects')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Link href="/dashboard/projects">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                        <p className="text-slate-400 text-sm">
                            {t('createdOn')} {new Date(project.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="border-slate-700 text-slate-300"
                            >
                                {t('edit')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false)
                                    setFormData({
                                        name: project.name || '',
                                        description: project.description || '',
                                        industry: project.industry || '',
                                        stage: project.stage || '',
                                        team_size: project.team_size?.toString() || '',
                                        annual_revenue: project.annual_revenue?.toString() || '',
                                        founded_date: project.founded_date || '',
                                        pitch_deck_url: project.pitch_deck_url || '',
                                    })
                                }}
                                className="border-slate-700 text-slate-300"
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving || !formData.name}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                {t('save')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Project Details Card */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">{t('details')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-200">{tNew('name')} *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-slate-200">{tNew('description')}</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="industry" className="text-slate-200">{tNew('industry')}</Label>
                                    <select
                                        id="industry"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                    >
                                        <option value="">{tNew('selectIndustry')}</option>
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind} value={ind}>{tNew(`industries.${ind}`)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stage" className="text-slate-200">{tNew('stage')}</Label>
                                    <select
                                        id="stage"
                                        value={formData.stage}
                                        onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                    >
                                        <option value="">{tNew('selectStage')}</option>
                                        {STAGES.map((stg) => (
                                            <option key={stg} value={stg}>{tNew(`stages.${stg}`)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="team_size" className="text-slate-200">{tNew('teamSize')}</Label>
                                    <Input
                                        id="team_size"
                                        type="number"
                                        min="1"
                                        value={formData.team_size}
                                        onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="annual_revenue" className="text-slate-200">{tNew('annualRevenue')}</Label>
                                    <Input
                                        id="annual_revenue"
                                        type="number"
                                        min="0"
                                        value={formData.annual_revenue}
                                        onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="founded_date" className="text-slate-200">{tNew('foundedDate')}</Label>
                                    <Input
                                        id="founded_date"
                                        type="date"
                                        value={formData.founded_date}
                                        onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pitch_deck_url" className="text-slate-200">{tNew('pitchDeck')}</Label>
                                <Input
                                    id="pitch_deck_url"
                                    type="url"
                                    value={formData.pitch_deck_url}
                                    onChange={(e) => setFormData({ ...formData, pitch_deck_url: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* View Mode */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.industry && (
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                        {tNew(`industries.${project.industry}`)}
                                    </Badge>
                                )}
                                {project.stage && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                        {tNew(`stages.${project.stage}`)}
                                    </Badge>
                                )}
                            </div>

                            {project.description && (
                                <div className="space-y-1">
                                    <Label className="text-slate-400 text-sm">{tNew('description')}</Label>
                                    <p className="text-slate-200">{project.description}</p>
                                </div>
                            )}

                            <div className="grid gap-4 md:grid-cols-3">
                                {project.team_size && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <span>{project.team_size} {t('members')}</span>
                                    </div>
                                )}
                                {project.annual_revenue && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <DollarSign className="h-4 w-4 text-slate-500" />
                                        <span>${Number(project.annual_revenue).toLocaleString()}</span>
                                    </div>
                                )}
                                {project.founded_date && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <span>{new Date(project.founded_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {project.pitch_deck_url && (
                                <div className="pt-2">
                                    <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                        <a href={project.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            {t('viewPitchDeck')}
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            {!isEditing && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">{t('quickActions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                            <Link href="/dashboard/funds">
                                {t('applyToFund')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
