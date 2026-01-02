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
import {
    ArrowLeft, Save, Loader2, Trash2, Users, DollarSign, Calendar, ExternalLink,
    Building2, Mail, Phone, Globe, Linkedin, Target, TrendingUp, Cpu, ChevronDown, ChevronUp
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProjectAgentTrainer } from '@/components/ai/project-agent-trainer'

const INDUSTRIES = [
    'technology', 'health', 'fintech', 'agritech', 'energy',
    'education', 'ecommerce', 'logistics', 'manufacturing', 'food', 'environment', 'other',
]

const STAGES = ['idea', 'mvp', 'early_revenue', 'growth', 'scale']

const LEGAL_ENTITY_TYPES = ['spa', 'sa', 'ltda', 'eirl', 'corporation', 'llc', 'other']

const IP_STATUS_OPTIONS = ['none', 'pending', 'granted', 'trade_secret', 'multiple']

const PRODUCT_STATUS_OPTIONS = ['concept', 'development', 'beta', 'launched', 'scaling']

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
    metadata: { agent_context?: string } | null
    // Company/Organization Info
    legal_name: string | null
    tax_id: string | null
    legal_entity_type: string | null
    country: string | null
    city: string | null
    address: string | null
    // Contact Info
    contact_name: string | null
    contact_email: string | null
    contact_phone: string | null
    contact_position: string | null
    // Online Presence
    website_url: string | null
    linkedin_url: string | null
    // Business Info
    problem_statement: string | null
    target_market: string | null
    value_proposition: string | null
    business_model: string | null
    competitive_advantages: string | null
    // Financial Info
    monthly_burn_rate: number | null
    funding_received: number | null
    funding_seeking: number | null
    // Product/Technology Info
    technology_description: string | null
    ip_status: string | null
    product_status: string | null
    // Metrics
    monthly_users: number | null
    monthly_revenue: number | null
    growth_rate_monthly: number | null
    customer_count: number | null
    // Team Info
    cofounders: string | null
    key_team_members: string | null
    advisors: string | null
    created_at: string
    updated_at: string
}

interface FormData {
    name: string
    description: string
    industry: string
    stage: string
    team_size: string
    annual_revenue: string
    founded_date: string
    pitch_deck_url: string
    legal_name: string
    tax_id: string
    legal_entity_type: string
    country: string
    city: string
    address: string
    contact_name: string
    contact_email: string
    contact_phone: string
    contact_position: string
    website_url: string
    linkedin_url: string
    problem_statement: string
    target_market: string
    value_proposition: string
    business_model: string
    competitive_advantages: string
    monthly_burn_rate: string
    funding_received: string
    funding_seeking: string
    technology_description: string
    ip_status: string
    product_status: string
    monthly_users: string
    monthly_revenue: string
    growth_rate_monthly: string
    customer_count: string
    cofounders: string
    key_team_members: string
    advisors: string
}

function CollapsibleSection({
    title,
    icon: Icon,
    children,
    defaultOpen = false
}: {
    title: string
    icon: React.ElementType
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border border-slate-700 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-purple-400" />
                    <span className="font-medium text-white">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 space-y-4 bg-slate-900/50">
                    {children}
                </div>
            )}
        </div>
    )
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
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        industry: '',
        stage: '',
        team_size: '',
        annual_revenue: '',
        founded_date: '',
        pitch_deck_url: '',
        legal_name: '',
        tax_id: '',
        legal_entity_type: '',
        country: '',
        city: '',
        address: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_position: '',
        website_url: '',
        linkedin_url: '',
        problem_statement: '',
        target_market: '',
        value_proposition: '',
        business_model: '',
        competitive_advantages: '',
        monthly_burn_rate: '',
        funding_received: '',
        funding_seeking: '',
        technology_description: '',
        ip_status: '',
        product_status: '',
        monthly_users: '',
        monthly_revenue: '',
        growth_rate_monthly: '',
        customer_count: '',
        cofounders: '',
        key_team_members: '',
        advisors: '',
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
            legal_name: data.legal_name || '',
            tax_id: data.tax_id || '',
            legal_entity_type: data.legal_entity_type || '',
            country: data.country || '',
            city: data.city || '',
            address: data.address || '',
            contact_name: data.contact_name || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            contact_position: data.contact_position || '',
            website_url: data.website_url || '',
            linkedin_url: data.linkedin_url || '',
            problem_statement: data.problem_statement || '',
            target_market: data.target_market || '',
            value_proposition: data.value_proposition || '',
            business_model: data.business_model || '',
            competitive_advantages: data.competitive_advantages || '',
            monthly_burn_rate: data.monthly_burn_rate?.toString() || '',
            funding_received: data.funding_received?.toString() || '',
            funding_seeking: data.funding_seeking?.toString() || '',
            technology_description: data.technology_description || '',
            ip_status: data.ip_status || '',
            product_status: data.product_status || '',
            monthly_users: data.monthly_users?.toString() || '',
            monthly_revenue: data.monthly_revenue?.toString() || '',
            growth_rate_monthly: data.growth_rate_monthly?.toString() || '',
            customer_count: data.customer_count?.toString() || '',
            cofounders: data.cofounders || '',
            key_team_members: data.key_team_members || '',
            advisors: data.advisors || '',
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
                    legal_name: formData.legal_name || null,
                    tax_id: formData.tax_id || null,
                    legal_entity_type: formData.legal_entity_type || null,
                    country: formData.country || null,
                    city: formData.city || null,
                    address: formData.address || null,
                    contact_name: formData.contact_name || null,
                    contact_email: formData.contact_email || null,
                    contact_phone: formData.contact_phone || null,
                    contact_position: formData.contact_position || null,
                    website_url: formData.website_url || null,
                    linkedin_url: formData.linkedin_url || null,
                    problem_statement: formData.problem_statement || null,
                    target_market: formData.target_market || null,
                    value_proposition: formData.value_proposition || null,
                    business_model: formData.business_model || null,
                    competitive_advantages: formData.competitive_advantages || null,
                    monthly_burn_rate: formData.monthly_burn_rate ? parseFloat(formData.monthly_burn_rate) : null,
                    funding_received: formData.funding_received ? parseFloat(formData.funding_received) : null,
                    funding_seeking: formData.funding_seeking ? parseFloat(formData.funding_seeking) : null,
                    technology_description: formData.technology_description || null,
                    ip_status: formData.ip_status || null,
                    product_status: formData.product_status || null,
                    monthly_users: formData.monthly_users ? parseInt(formData.monthly_users) : null,
                    monthly_revenue: formData.monthly_revenue ? parseFloat(formData.monthly_revenue) : null,
                    growth_rate_monthly: formData.growth_rate_monthly ? parseFloat(formData.growth_rate_monthly) : null,
                    customer_count: formData.customer_count ? parseInt(formData.customer_count) : null,
                    cofounders: formData.cofounders || null,
                    key_team_members: formData.key_team_members || null,
                    advisors: formData.advisors || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', projectId)

            if (updateError) throw updateError

            // Reload the project to get updated data
            await loadProject()
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

    const resetFormData = () => {
        if (!project) return
        setFormData({
            name: project.name || '',
            description: project.description || '',
            industry: project.industry || '',
            stage: project.stage || '',
            team_size: project.team_size?.toString() || '',
            annual_revenue: project.annual_revenue?.toString() || '',
            founded_date: project.founded_date || '',
            pitch_deck_url: project.pitch_deck_url || '',
            legal_name: project.legal_name || '',
            tax_id: project.tax_id || '',
            legal_entity_type: project.legal_entity_type || '',
            country: project.country || '',
            city: project.city || '',
            address: project.address || '',
            contact_name: project.contact_name || '',
            contact_email: project.contact_email || '',
            contact_phone: project.contact_phone || '',
            contact_position: project.contact_position || '',
            website_url: project.website_url || '',
            linkedin_url: project.linkedin_url || '',
            problem_statement: project.problem_statement || '',
            target_market: project.target_market || '',
            value_proposition: project.value_proposition || '',
            business_model: project.business_model || '',
            competitive_advantages: project.competitive_advantages || '',
            monthly_burn_rate: project.monthly_burn_rate?.toString() || '',
            funding_received: project.funding_received?.toString() || '',
            funding_seeking: project.funding_seeking?.toString() || '',
            technology_description: project.technology_description || '',
            ip_status: project.ip_status || '',
            product_status: project.product_status || '',
            monthly_users: project.monthly_users?.toString() || '',
            monthly_revenue: project.monthly_revenue?.toString() || '',
            growth_rate_monthly: project.growth_rate_monthly?.toString() || '',
            customer_count: project.customer_count?.toString() || '',
            cofounders: project.cofounders || '',
            key_team_members: project.key_team_members || '',
            advisors: project.advisors || '',
        })
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
        <div className="space-y-6 max-w-4xl">
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
                                    resetFormData()
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
                        <div className="space-y-6">
                            {/* Basic Info Section - Always visible */}
                            <CollapsibleSection title={tNew('sections.basicInfo')} icon={Building2} defaultOpen={true}>
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
                                        rows={3}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('descriptionPlaceholder')}
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
                                        placeholder={tNew('pitchDeckHelp')}
                                    />
                                </div>
                            </CollapsibleSection>

                            {/* Company/Legal Info Section */}
                            <CollapsibleSection title={tNew('sections.companyInfo')} icon={Building2}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="legal_name" className="text-slate-200">{tNew('legalName')}</Label>
                                        <Input
                                            id="legal_name"
                                            value={formData.legal_name}
                                            onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder={tNew('legalNamePlaceholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_id" className="text-slate-200">{tNew('taxId')}</Label>
                                        <Input
                                            id="tax_id"
                                            value={formData.tax_id}
                                            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder={tNew('taxIdPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="legal_entity_type" className="text-slate-200">{tNew('legalEntityType')}</Label>
                                        <select
                                            id="legal_entity_type"
                                            value={formData.legal_entity_type}
                                            onChange={(e) => setFormData({ ...formData, legal_entity_type: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                        >
                                            <option value="">{tNew('selectEntityType')}</option>
                                            {LEGAL_ENTITY_TYPES.map((type) => (
                                                <option key={type} value={type}>{tNew(`entityTypes.${type}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-slate-200">{tNew('country')}</Label>
                                        <select
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                        >
                                            <option value="">{tNew('selectCountry')}</option>
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-slate-200">{tNew('city')}</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-slate-200">{tNew('address')}</Label>
                                    <Input
                                        id="address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('addressPlaceholder')}
                                    />
                                </div>
                            </CollapsibleSection>

                            {/* Contact Info Section */}
                            <CollapsibleSection title={tNew('sections.contactInfo')} icon={Mail}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_name" className="text-slate-200">{tNew('contactName')}</Label>
                                        <Input
                                            id="contact_name"
                                            value={formData.contact_name}
                                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_position" className="text-slate-200">{tNew('contactPosition')}</Label>
                                        <Input
                                            id="contact_position"
                                            value={formData.contact_position}
                                            onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder={tNew('contactPositionPlaceholder')}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_email" className="text-slate-200">{tNew('contactEmail')}</Label>
                                        <Input
                                            id="contact_email"
                                            type="email"
                                            value={formData.contact_email}
                                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_phone" className="text-slate-200">{tNew('contactPhone')}</Label>
                                        <Input
                                            id="contact_phone"
                                            type="tel"
                                            value={formData.contact_phone}
                                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Online Presence Section */}
                            <CollapsibleSection title={tNew('sections.onlinePresence')} icon={Globe}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="website_url" className="text-slate-200">{tNew('websiteUrl')}</Label>
                                        <Input
                                            id="website_url"
                                            type="url"
                                            value={formData.website_url}
                                            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin_url" className="text-slate-200">{tNew('linkedinUrl')}</Label>
                                        <Input
                                            id="linkedin_url"
                                            type="url"
                                            value={formData.linkedin_url}
                                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="https://linkedin.com/company/..."
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Business Info Section */}
                            <CollapsibleSection title={tNew('sections.businessInfo')} icon={Target}>
                                <div className="space-y-2">
                                    <Label htmlFor="problem_statement" className="text-slate-200">{tNew('problemStatement')}</Label>
                                    <Textarea
                                        id="problem_statement"
                                        value={formData.problem_statement}
                                        onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                                        rows={3}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('problemStatementPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="value_proposition" className="text-slate-200">{tNew('valueProposition')}</Label>
                                    <Textarea
                                        id="value_proposition"
                                        value={formData.value_proposition}
                                        onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                                        rows={3}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('valuePropositionPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="target_market" className="text-slate-200">{tNew('targetMarket')}</Label>
                                    <Textarea
                                        id="target_market"
                                        value={formData.target_market}
                                        onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('targetMarketPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="business_model" className="text-slate-200">{tNew('businessModel')}</Label>
                                    <Textarea
                                        id="business_model"
                                        value={formData.business_model}
                                        onChange={(e) => setFormData({ ...formData, business_model: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('businessModelPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="competitive_advantages" className="text-slate-200">{tNew('competitiveAdvantages')}</Label>
                                    <Textarea
                                        id="competitive_advantages"
                                        value={formData.competitive_advantages}
                                        onChange={(e) => setFormData({ ...formData, competitive_advantages: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('competitiveAdvantagesPlaceholder')}
                                    />
                                </div>
                            </CollapsibleSection>

                            {/* Financial Info Section */}
                            <CollapsibleSection title={tNew('sections.financialInfo')} icon={DollarSign}>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="monthly_burn_rate" className="text-slate-200">{tNew('monthlyBurnRate')}</Label>
                                        <Input
                                            id="monthly_burn_rate"
                                            type="number"
                                            min="0"
                                            value={formData.monthly_burn_rate}
                                            onChange={(e) => setFormData({ ...formData, monthly_burn_rate: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="USD"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="funding_received" className="text-slate-200">{tNew('fundingReceived')}</Label>
                                        <Input
                                            id="funding_received"
                                            type="number"
                                            min="0"
                                            value={formData.funding_received}
                                            onChange={(e) => setFormData({ ...formData, funding_received: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="USD"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="funding_seeking" className="text-slate-200">{tNew('fundingSeeking')}</Label>
                                        <Input
                                            id="funding_seeking"
                                            type="number"
                                            min="0"
                                            value={formData.funding_seeking}
                                            onChange={(e) => setFormData({ ...formData, funding_seeking: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="USD"
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Product/Technology Section */}
                            <CollapsibleSection title={tNew('sections.productTech')} icon={Cpu}>
                                <div className="space-y-2">
                                    <Label htmlFor="technology_description" className="text-slate-200">{tNew('technologyDescription')}</Label>
                                    <Textarea
                                        id="technology_description"
                                        value={formData.technology_description}
                                        onChange={(e) => setFormData({ ...formData, technology_description: e.target.value })}
                                        rows={3}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('technologyDescriptionPlaceholder')}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="ip_status" className="text-slate-200">{tNew('ipStatus')}</Label>
                                        <select
                                            id="ip_status"
                                            value={formData.ip_status}
                                            onChange={(e) => setFormData({ ...formData, ip_status: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                        >
                                            <option value="">{tNew('selectIpStatus')}</option>
                                            {IP_STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{tNew(`ipStatuses.${status}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product_status" className="text-slate-200">{tNew('productStatus')}</Label>
                                        <select
                                            id="product_status"
                                            value={formData.product_status}
                                            onChange={(e) => setFormData({ ...formData, product_status: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                        >
                                            <option value="">{tNew('selectProductStatus')}</option>
                                            {PRODUCT_STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{tNew(`productStatuses.${status}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Metrics Section */}
                            <CollapsibleSection title={tNew('sections.metrics')} icon={TrendingUp}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="monthly_users" className="text-slate-200">{tNew('monthlyUsers')}</Label>
                                        <Input
                                            id="monthly_users"
                                            type="number"
                                            min="0"
                                            value={formData.monthly_users}
                                            onChange={(e) => setFormData({ ...formData, monthly_users: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_count" className="text-slate-200">{tNew('customerCount')}</Label>
                                        <Input
                                            id="customer_count"
                                            type="number"
                                            min="0"
                                            value={formData.customer_count}
                                            onChange={(e) => setFormData({ ...formData, customer_count: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="monthly_revenue" className="text-slate-200">{tNew('monthlyRevenue')}</Label>
                                        <Input
                                            id="monthly_revenue"
                                            type="number"
                                            min="0"
                                            value={formData.monthly_revenue}
                                            onChange={(e) => setFormData({ ...formData, monthly_revenue: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="USD"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="growth_rate_monthly" className="text-slate-200">{tNew('growthRateMonthly')}</Label>
                                        <Input
                                            id="growth_rate_monthly"
                                            type="number"
                                            step="0.1"
                                            value={formData.growth_rate_monthly}
                                            onChange={(e) => setFormData({ ...formData, growth_rate_monthly: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                            placeholder="%"
                                        />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            {/* Team Section */}
                            <CollapsibleSection title={tNew('sections.teamInfo')} icon={Users}>
                                <div className="space-y-2">
                                    <Label htmlFor="cofounders" className="text-slate-200">{tNew('cofounders')}</Label>
                                    <Textarea
                                        id="cofounders"
                                        value={formData.cofounders}
                                        onChange={(e) => setFormData({ ...formData, cofounders: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('cofoundersPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="key_team_members" className="text-slate-200">{tNew('keyTeamMembers')}</Label>
                                    <Textarea
                                        id="key_team_members"
                                        value={formData.key_team_members}
                                        onChange={(e) => setFormData({ ...formData, key_team_members: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('keyTeamMembersPlaceholder')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="advisors" className="text-slate-200">{tNew('advisors')}</Label>
                                    <Textarea
                                        id="advisors"
                                        value={formData.advisors}
                                        onChange={(e) => setFormData({ ...formData, advisors: e.target.value })}
                                        rows={2}
                                        className="bg-slate-800 border-slate-700 text-white"
                                        placeholder={tNew('advisorsPlaceholder')}
                                    />
                                </div>
                            </CollapsibleSection>
                        </div>
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
                                {project.product_status && (
                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                        {tNew(`productStatuses.${project.product_status}`)}
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
                                        <span>${Number(project.annual_revenue).toLocaleString()}/yr</span>
                                    </div>
                                )}
                                {project.founded_date && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <span>{new Date(project.founded_date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Company Info View */}
                            {(project.legal_name || project.country || project.city) && (
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">{tNew('sections.companyInfo')}</h4>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {project.legal_name && (
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Building2 className="h-4 w-4 text-slate-500" />
                                                <span>{project.legal_name}</span>
                                            </div>
                                        )}
                                        {(project.city || project.country) && (
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Globe className="h-4 w-4 text-slate-500" />
                                                <span>{[project.city, project.country].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Contact Info View */}
                            {(project.contact_name || project.contact_email) && (
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">{tNew('sections.contactInfo')}</h4>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {project.contact_name && (
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Users className="h-4 w-4 text-slate-500" />
                                                <span>{project.contact_name}{project.contact_position && ` - ${project.contact_position}`}</span>
                                            </div>
                                        )}
                                        {project.contact_email && (
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                                <a href={`mailto:${project.contact_email}`} className="hover:text-purple-400">{project.contact_email}</a>
                                            </div>
                                        )}
                                        {project.contact_phone && (
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Phone className="h-4 w-4 text-slate-500" />
                                                <span>{project.contact_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Business Info View */}
                            {(project.problem_statement || project.value_proposition) && (
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">{tNew('sections.businessInfo')}</h4>
                                    {project.problem_statement && (
                                        <div className="mb-3">
                                            <Label className="text-slate-500 text-xs">{tNew('problemStatement')}</Label>
                                            <p className="text-slate-300 text-sm mt-1">{project.problem_statement}</p>
                                        </div>
                                    )}
                                    {project.value_proposition && (
                                        <div className="mb-3">
                                            <Label className="text-slate-500 text-xs">{tNew('valueProposition')}</Label>
                                            <p className="text-slate-300 text-sm mt-1">{project.value_proposition}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Financial Metrics View */}
                            {(project.funding_received || project.funding_seeking || project.monthly_burn_rate) && (
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">{tNew('sections.financialInfo')}</h4>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        {project.funding_received && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('fundingReceived')}</p>
                                                <p className="text-lg font-semibold text-green-400">${Number(project.funding_received).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {project.funding_seeking && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('fundingSeeking')}</p>
                                                <p className="text-lg font-semibold text-purple-400">${Number(project.funding_seeking).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {project.monthly_burn_rate && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('monthlyBurnRate')}</p>
                                                <p className="text-lg font-semibold text-orange-400">${Number(project.monthly_burn_rate).toLocaleString()}/mo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Traction Metrics View */}
                            {(project.monthly_users || project.customer_count || project.monthly_revenue) && (
                                <div className="pt-4 border-t border-slate-700">
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">{tNew('sections.metrics')}</h4>
                                    <div className="grid gap-2 md:grid-cols-4">
                                        {project.monthly_users && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('monthlyUsers')}</p>
                                                <p className="text-lg font-semibold text-blue-400">{Number(project.monthly_users).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {project.customer_count && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('customerCount')}</p>
                                                <p className="text-lg font-semibold text-blue-400">{Number(project.customer_count).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {project.monthly_revenue && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('monthlyRevenue')}</p>
                                                <p className="text-lg font-semibold text-green-400">${Number(project.monthly_revenue).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {project.growth_rate_monthly && (
                                            <div className="bg-slate-800 rounded-lg p-3">
                                                <p className="text-xs text-slate-500">{tNew('growthRateMonthly')}</p>
                                                <p className="text-lg font-semibold text-green-400">{project.growth_rate_monthly}%</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            <div className="pt-4 flex flex-wrap gap-2">
                                {project.pitch_deck_url && (
                                    <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                        <a href={project.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            {t('viewPitchDeck')}
                                        </a>
                                    </Button>
                                )}
                                {project.website_url && (
                                    <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                        <a href={project.website_url} target="_blank" rel="noopener noreferrer">
                                            <Globe className="h-4 w-4 mr-2" />
                                            Website
                                        </a>
                                    </Button>
                                )}
                                {project.linkedin_url && (
                                    <Button asChild variant="outline" className="border-slate-700 text-slate-300">
                                        <a href={project.linkedin_url} target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="h-4 w-4 mr-2" />
                                            LinkedIn
                                        </a>
                                    </Button>
                                )}
                            </div>
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

            {/* AI Agent Trainer */}
            {!isEditing && (
                <ProjectAgentTrainer
                    projectId={projectId}
                    initialContext={project.metadata?.agent_context || ''}
                />
            )}
        </div>
    )
}
