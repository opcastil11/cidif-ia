'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Link } from '@/i18n/routing'
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Loader2, Eye, EyeOff, FileCode2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { HtmlFundImporter } from '@/components/backoffice/html-fund-importer'

interface Section {
    id: string
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
    amount_min: number | null
    amount_max: number | null
    currency: string
    deadline: string | null
    url: string | null
    description: string | null
    is_active: boolean
    requirements: { sections?: Section[]; agent_context?: string } | null
}

interface ParsedSection {
    key: string
    name: string
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'link' | 'file'
    options?: string[]
    required: boolean
    helpText?: string
}

interface ParsedFund {
    name?: string
    organization?: string
    description?: string
    sections: ParsedSection[]
}

export default function EditFundPage() {
    const params = useParams()
    const router = useRouter()
    const t = useTranslations('backoffice.editFund')
    const locale = useLocale()
    const fundId = params.id as string

    const [loading, setLoading] = useState(true)
    const [htmlImportOpen, setHtmlImportOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fund, setFund] = useState<Fund | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        country: 'CL',
        type: 'grant',
        amount_min: '',
        amount_max: '',
        currency: 'USD',
        deadline: '',
        url: '',
        description: '',
        is_active: true,
    })
    const [sections, setSections] = useState<Section[]>([])

    useEffect(() => {
        loadFund()
    }, [fundId])

    const loadFund = async () => {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
            .from('funds')
            .select('*')
            .eq('id', fundId)
            .single()

        if (fetchError || !data) {
            setError(t('notFound'))
            setLoading(false)
            return
        }

        setFund(data)
        setFormData({
            name: data.name || '',
            organization: data.organization || '',
            country: data.country || 'CL',
            type: data.type || 'grant',
            amount_min: data.amount_min?.toString() || '',
            amount_max: data.amount_max?.toString() || '',
            currency: data.currency || 'USD',
            deadline: data.deadline || '',
            url: data.url || '',
            description: data.description || '',
            is_active: data.is_active ?? true,
        })
        setSections(
            (data.requirements?.sections || []).map((s: Omit<Section, 'id'>) => ({
                ...s,
                id: crypto.randomUUID(),
            }))
        )
        setLoading(false)
    }

    const addSection = () => {
        setSections([
            ...sections,
            {
                id: crypto.randomUUID(),
                key: `section_${sections.length + 1}`,
                name: '',
                type: 'textarea',
                required: true,
                options: [],
            },
        ])
    }

    const updateSection = (id: string, updates: Partial<Section>) => {
        setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id))
    }

    const handleHtmlImport = (fund: ParsedFund) => {
        // Add imported sections to existing ones (not replace)
        const newSections: Section[] = fund.sections.map((section) => ({
            id: crypto.randomUUID(),
            key: section.key,
            name: section.name,
            type: section.type,
            options: section.options || [],
            required: section.required,
            helpText: section.helpText || '',
        }))

        setSections(prev => [...prev, ...newSections])
        setHtmlImportOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()

            const existingRequirements = fund?.requirements || {}
            const { error: updateError } = await supabase
                .from('funds')
                .update({
                    ...formData,
                    amount_min: formData.amount_min ? parseFloat(formData.amount_min) : null,
                    amount_max: formData.amount_max ? parseFloat(formData.amount_max) : null,
                    requirements: {
                        ...existingRequirements,
                        sections: sections.map(({ id, ...s }) => s),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', fundId)

            if (updateError) throw updateError

            router.push('/backoffice/funds')
        } catch (err) {
            console.error('Error updating fund:', err)
            setError(err instanceof Error ? err.message : t('saveError'))
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async () => {
        setSaving(true)
        setError(null)

        try {
            const supabase = createClient()
            const newStatus = !formData.is_active

            const { error: updateError } = await supabase
                .from('funds')
                .update({ is_active: newStatus, updated_at: new Date().toISOString() })
                .eq('id', fundId)

            if (updateError) throw updateError

            setFormData({ ...formData, is_active: newStatus })
        } catch (err) {
            console.error('Error toggling fund status:', err)
            setError(err instanceof Error ? err.message : t('saveError'))
        } finally {
            setSaving(false)
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
                <Card className="bg-card border-border">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-destructive">{error || t('notFound')}</p>
                        <Button asChild variant="outline" className="mt-4">
                            <Link href="/backoffice/funds">{t('backToFunds')}</Link>
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
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/backoffice/funds">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-xl font-heading font-semibold text-foreground">{t('title')}</h2>
                        <p className="text-muted-foreground">{fund.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                        {formData.is_active ? t('active') : t('inactive')}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleActive}
                        disabled={saving}
                    >
                        {formData.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {formData.is_active ? t('deactivate') : t('activate')}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/30 text-destructive text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>{t('fundInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('fundName')} *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="organization">{t('organization')} *</Label>
                                <Input
                                    id="organization"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('description')}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('descriptionPlaceholder')}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="country">{t('country')}</Label>
                                <select
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="CL">Chile</option>
                                    <option value="MX">México</option>
                                    <option value="CO">Colombia</option>
                                    <option value="AR">Argentina</option>
                                    <option value="PE">Perú</option>
                                    <option value="US">USA</option>
                                    <option value="EU">Europa</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">{t('type')}</Label>
                                <select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="grant">{t('types.grant')}</option>
                                    <option value="loan">{t('types.loan')}</option>
                                    <option value="equity">{t('types.equity')}</option>
                                    <option value="mixed">{t('types.mixed')}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline">{t('deadline')}</Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="amount_min">{t('minAmount')}</Label>
                                <Input
                                    id="amount_min"
                                    type="number"
                                    value={formData.amount_min}
                                    onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount_max">{t('maxAmount')}</Label>
                                <Input
                                    id="amount_max"
                                    type="number"
                                    value={formData.amount_max}
                                    onChange={(e) => setFormData({ ...formData, amount_max: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">{t('currency')}</Label>
                                <select
                                    id="currency"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border"
                                >
                                    <option value="USD">USD</option>
                                    <option value="CLP">CLP</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">{t('fundUrl')}</Label>
                            <Input
                                id="url"
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sections */}
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('formSections')}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Dialog open={htmlImportOpen} onOpenChange={setHtmlImportOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                        <FileCode2 className="h-4 w-4 mr-2" />
                                        {t('importFromHtml')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>{t('importFromHtml')}</DialogTitle>
                                        <DialogDescription>
                                            {t('importFromHtmlDescription')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <HtmlFundImporter onImport={handleHtmlImport} language={locale} />
                                </DialogContent>
                            </Dialog>
                            <Button type="button" onClick={addSection} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('addSection')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sections.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                {t('noSections')}
                            </p>
                        ) : (
                            sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className="p-4 rounded-lg border border-border bg-muted/30"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {t('section')} {index + 1}
                                        </span>
                                        <div className="flex-1" />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSection(section.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>{t('sectionName')}</Label>
                                            <Input
                                                value={section.name}
                                                onChange={(e) => updateSection(section.id, { name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('sectionKey')}</Label>
                                            <Input
                                                value={section.key}
                                                onChange={(e) => updateSection(section.id, { key: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('fieldType')}</Label>
                                            <select
                                                value={section.type}
                                                onChange={(e) => updateSection(section.id, { type: e.target.value as Section['type'] })}
                                                className="w-full px-3 py-2 rounded-lg bg-background border border-border"
                                            >
                                                <option value="text">{t('fieldTypes.text')}</option>
                                                <option value="textarea">{t('fieldTypes.textarea')}</option>
                                                <option value="select">{t('fieldTypes.select')}</option>
                                                <option value="multiselect">{t('fieldTypes.multiselect')}</option>
                                                <option value="link">{t('fieldTypes.link')}</option>
                                                <option value="file">{t('fieldTypes.file')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {(section.type === 'select' || section.type === 'multiselect') && (
                                        <div className="mt-4 space-y-2">
                                            <Label>{t('options')}</Label>
                                            <Textarea
                                                value={section.options?.join('\n') || ''}
                                                onChange={(e) => updateSection(section.id, { options: e.target.value.split('\n').filter(Boolean) })}
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-2">
                                        <Label>{t('helpText')}</Label>
                                        <Input
                                            value={section.helpText || ''}
                                            onChange={(e) => updateSection(section.id, { helpText: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        {saving ? t('saving') : t('save')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
