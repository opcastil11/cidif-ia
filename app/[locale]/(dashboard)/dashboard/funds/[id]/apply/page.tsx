'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Save, Loader2, FolderKanban, CheckCircle2, Circle, DollarSign, Calendar, Building2, HelpCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface FundSection {
    key: string
    name: string
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
    options?: string[]
    required: boolean
    helpText?: string
}

interface Fund {
    id: string
    name: string
    organization: string
    country: string
    type: string
    amount_min: number
    amount_max: number
    currency: string
    deadline: string
    description: string
    requirements: {
        sections?: FundSection[]
        agent_context?: string
    } | null
}

interface Project {
    id: string
    name: string
    industry: string
    stage: string
}

interface Application {
    id: string
    status: string
    progress: number
    notes: string
    amount_requested: number
}

interface ApplicationSection {
    id: string
    section_key: string
    section_name: string
    content: string
    is_complete: boolean
}

export default function ApplyFundPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations('applyFund')
    const fundId = params.id as string
    const preSelectedProjectId = searchParams.get('project')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fund, setFund] = useState<Fund | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [application, setApplication] = useState<Application | null>(null)
    const [sectionResponses, setSectionResponses] = useState<Record<string, string>>({})
    const [amountRequested, setAmountRequested] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [step, setStep] = useState<'select-project' | 'fill-application'>('select-project')

    useEffect(() => {
        loadData()
    }, [fundId])

    const loadData = async () => {
        const supabase = createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        // Fetch fund details with requirements
        const { data: fundData, error: fundError } = await supabase
            .from('funds')
            .select('*')
            .eq('id', fundId)
            .single()

        if (fundError || !fundData) {
            setError('Fund not found')
            setLoading(false)
            return
        }
        setFund(fundData)

        // Fetch user's projects
        const { data: projectsData } = await supabase
            .from('projects')
            .select('id, name, industry, stage')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        setProjects(projectsData || [])

        // Pre-select project if provided via query param (from Quick Apply)
        if (preSelectedProjectId && projectsData?.some(p => p.id === preSelectedProjectId)) {
            setSelectedProject(preSelectedProjectId)
        }

        // Check if there's an existing application for this fund
        const { data: existingApp } = await supabase
            .from('applications')
            .select('*')
            .eq('user_id', user.id)
            .eq('fund_id', fundId)
            .single()

        if (existingApp) {
            setApplication(existingApp)
            setSelectedProject(existingApp.project_id)
            setAmountRequested(existingApp.amount_requested?.toString() || '')
            setStep('fill-application')

            // Load existing section responses
            const { data: sectionsData } = await supabase
                .from('application_sections')
                .select('*')
                .eq('application_id', existingApp.id)

            if (sectionsData) {
                const responses: Record<string, string> = {}
                sectionsData.forEach((section: ApplicationSection) => {
                    responses[section.section_key] = section.content || ''
                })
                setSectionResponses(responses)
            }
        }

        setLoading(false)
    }

    const handleSelectProject = async () => {
        if (!selectedProject) return

        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('Not authenticated')

            // Create or update application
            if (application) {
                const { error: updateError } = await supabase
                    .from('applications')
                    .update({ project_id: selectedProject })
                    .eq('id', application.id)

                if (updateError) throw updateError
            } else {
                const { data: newApp, error: insertError } = await supabase
                    .from('applications')
                    .insert({
                        user_id: user.id,
                        project_id: selectedProject,
                        fund_id: fundId,
                        status: 'draft',
                        progress: 0,
                    })
                    .select()
                    .single()

                if (insertError) throw insertError
                setApplication(newApp)

                // Create application sections for each fund section
                const sections = fund?.requirements?.sections || []
                if (sections.length > 0 && newApp) {
                    const sectionInserts = sections.map((section, index) => ({
                        application_id: newApp.id,
                        section_key: section.key,
                        section_name: section.name,
                        content: '',
                        is_complete: false,
                        order_index: index,
                    }))

                    await supabase.from('application_sections').insert(sectionInserts)
                }
            }

            setStep('fill-application')
        } catch (err) {
            console.error('Error creating application:', err)
            setError(err instanceof Error ? err.message : 'Error creating application')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveProgress = async () => {
        if (!application) return

        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()

            // Calculate progress based on filled sections
            const sections = fund?.requirements?.sections || []
            const totalFields = sections.length + 1 // +1 for amount
            let filledFields = amountRequested ? 1 : 0
            sections.forEach(section => {
                if (sectionResponses[section.key]?.trim()) filledFields++
            })
            const progress = Math.round((filledFields / totalFields) * 100)

            // Update application
            const { error: updateError } = await supabase
                .from('applications')
                .update({
                    amount_requested: amountRequested ? parseFloat(amountRequested) : null,
                    progress,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', application.id)

            if (updateError) throw updateError

            // Update section responses
            for (const section of sections) {
                const content = sectionResponses[section.key] || ''
                await supabase
                    .from('application_sections')
                    .upsert({
                        application_id: application.id,
                        section_key: section.key,
                        section_name: section.name,
                        content,
                        is_complete: !!content.trim(),
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'application_id,section_key',
                        ignoreDuplicates: false,
                    })
            }

            setApplication({ ...application, progress })
        } catch (err) {
            console.error('Error saving progress:', err)
            setError(err instanceof Error ? err.message : 'Error saving progress')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!application) return

        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()

            // Save all section responses first
            const sections = fund?.requirements?.sections || []
            for (const section of sections) {
                const content = sectionResponses[section.key] || ''
                await supabase
                    .from('application_sections')
                    .upsert({
                        application_id: application.id,
                        section_key: section.key,
                        section_name: section.name,
                        content,
                        is_complete: !!content.trim(),
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'application_id,section_key',
                        ignoreDuplicates: false,
                    })
            }

            // Update application status
            const { error: updateError } = await supabase
                .from('applications')
                .update({
                    amount_requested: amountRequested ? parseFloat(amountRequested) : null,
                    status: 'submitted',
                    progress: 100,
                    submitted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', application.id)

            if (updateError) throw updateError

            router.push('/dashboard/applications')
        } catch (err) {
            console.error('Error submitting application:', err)
            setError(err instanceof Error ? err.message : 'Error submitting application')
        } finally {
            setSaving(false)
        }
    }

    const renderSectionInput = (section: FundSection) => {
        const value = sectionResponses[section.key] || ''
        const onChange = (newValue: string) => {
            setSectionResponses({ ...sectionResponses, [section.key]: newValue })
        }

        switch (section.type) {
            case 'textarea':
                return (
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={section.helpText || ''}
                        rows={4}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                )
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                    >
                        <option value="">{t('sections.selectOption')}</option>
                        {section.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                )
            case 'multiselect':
                const selectedValues = value ? value.split(',') : []
                return (
                    <div className="space-y-2">
                        {section.options?.map((opt) => (
                            <label key={opt} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(opt)}
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...selectedValues, opt]
                                            : selectedValues.filter(v => v !== opt)
                                        onChange(newValues.join(','))
                                    }}
                                    className="rounded border-slate-600"
                                />
                                {opt}
                            </label>
                        ))}
                    </div>
                )
            case 'link':
                return (
                    <Input
                        type="url"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="https://..."
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                )
            case 'file':
                return (
                    <div className="space-y-2">
                        <Input
                            type="url"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t('sections.fileUrlPlaceholder')}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        <p className="text-xs text-slate-500">{t('sections.fileHelp')}</p>
                    </div>
                )
            default: // text
                return (
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={section.helpText || ''}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                )
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!fund) {
        return (
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-red-400">{error || t('fundNotFound')}</p>
                        <Button asChild variant="outline" className="mt-4 border-slate-700 text-slate-300">
                            <Link href="/dashboard/funds">{t('backToFunds')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const sections = fund.requirements?.sections || []

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Link href="/dashboard/funds">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                    <p className="text-slate-400">{fund.name}</p>
                </div>
            </div>

            {/* Fund Summary Card */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-purple-400" />
                                {fund.organization}
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-1">
                                {fund.description || fund.name}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                                {fund.type}
                            </Badge>
                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                {fund.country}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{fund.amount_min?.toLocaleString()} - {fund.amount_max?.toLocaleString()} {fund.currency}</span>
                    </div>
                    {fund.deadline && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{t('deadline')}: {new Date(fund.deadline).toLocaleDateString()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Progress Steps */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {step === 'select-project' ? (
                        <Circle className="h-5 w-5 text-purple-500 fill-purple-500" />
                    ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <span className={step === 'select-project' ? 'text-white' : 'text-slate-400'}>
                        {t('steps.selectProject')}
                    </span>
                </div>
                <div className="flex-1 h-px bg-slate-700" />
                <div className="flex items-center gap-2">
                    {step === 'fill-application' ? (
                        <Circle className="h-5 w-5 text-purple-500 fill-purple-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-slate-600" />
                    )}
                    <span className={step === 'fill-application' ? 'text-white' : 'text-slate-400'}>
                        {t('steps.fillApplication')}
                    </span>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                    {error}
                </div>
            )}

            {/* Step 1: Select Project */}
            {step === 'select-project' && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">{t('selectProject.title')}</CardTitle>
                        <CardDescription className="text-slate-400">
                            {t('selectProject.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {projects.length > 0 ? (
                            <>
                                <div className="grid gap-3">
                                    {projects.map((project) => (
                                        <div
                                            key={project.id}
                                            onClick={() => setSelectedProject(project.id)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                                selectedProject === project.id
                                                    ? 'border-purple-500 bg-purple-500/10'
                                                    : 'border-slate-700 hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-white font-medium">{project.name}</h4>
                                                    <div className="flex gap-2 mt-1">
                                                        {project.industry && (
                                                            <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                                                                {project.industry}
                                                            </Badge>
                                                        )}
                                                        {project.stage && (
                                                            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                                                                {project.stage}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedProject === project.id && (
                                                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleSelectProject}
                                        disabled={!selectedProject || saving}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
                                        {t('selectProject.continue')}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                    <FolderKanban className="h-6 w-6 text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-center mb-4">
                                    {t('selectProject.noProjects')}
                                </p>
                                <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                    <Link href="/dashboard/projects/new">
                                        {t('selectProject.createProject')}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Fill Application */}
            {step === 'fill-application' && (
                <>
                    {/* Amount Requested */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">{t('fillApplication.title')}</CardTitle>
                            <CardDescription className="text-slate-400">
                                {t('fillApplication.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-slate-200">
                                    {t('fillApplication.amountRequested')} ({fund.currency}) *
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min={fund.amount_min}
                                    max={fund.amount_max}
                                    value={amountRequested}
                                    onChange={(e) => setAmountRequested(e.target.value)}
                                    placeholder={`${fund.amount_min?.toLocaleString()} - ${fund.amount_max?.toLocaleString()}`}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                                <p className="text-xs text-slate-500">
                                    {t('fillApplication.amountRange', { min: fund.amount_min?.toLocaleString(), max: fund.amount_max?.toLocaleString(), currency: fund.currency })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dynamic Sections */}
                    {sections.length > 0 ? (
                        sections.map((section, index) => (
                            <Card key={section.key} className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                                            {index + 1}
                                        </span>
                                        {section.name}
                                        {section.required && <span className="text-red-400">*</span>}
                                    </CardTitle>
                                    {section.helpText && (
                                        <CardDescription className="text-slate-400 flex items-start gap-2">
                                            <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            {section.helpText}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {renderSectionInput(section)}
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        /* Fallback generic description field if no sections configured */
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">{t('fillApplication.projectDescription')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={sectionResponses['_general'] || ''}
                                    onChange={(e) => setSectionResponses({ ...sectionResponses, _general: e.target.value })}
                                    placeholder={t('fillApplication.descriptionPlaceholder')}
                                    rows={6}
                                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('fillApplication.descriptionHelp')}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep('select-project')}
                            className="border-slate-700 text-slate-300"
                        >
                            {t('fillApplication.back')}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveProgress}
                                disabled={saving}
                                className="border-slate-700 text-slate-300"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {t('fillApplication.saveDraft')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving || !amountRequested}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : null}
                                {t('fillApplication.submit')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
