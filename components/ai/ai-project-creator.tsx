'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Save,
  Edit3,
  CheckCircle2,
  Lightbulb,
  Target,
  Building2,
  Users,
  Rocket
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface ProjectData {
  name: string
  description: string
  industry: string
  stage: string
  team_size: number | null
  annual_revenue: number | null
  country: string
  problem_statement: string
  value_proposition: string
  target_market: string
  business_model: string
  competitive_advantages: string
  technology_description: string
  project_objectives: string
  expected_impact: string
}

interface AIProjectCreatorProps {
  fundId?: string
  fundName?: string
}

const INDUSTRIES = [
  'technology', 'health', 'fintech', 'agritech', 'energy',
  'education', 'ecommerce', 'logistics', 'manufacturing', 'food', 'environment', 'other',
]

const STAGES = ['idea', 'mvp', 'early_revenue', 'growth', 'scale']

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

export function AIProjectCreator({ fundId, fundName }: AIProjectCreatorProps) {
  const t = useTranslations('aiProjectCreator')
  const tNew = useTranslations('newProject')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const locale = useLocale()

  const [step, setStep] = useState<'describe' | 'review' | 'saving'>('describe')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectData, setProjectData] = useState<ProjectData | null>(null)
  const [editMode, setEditMode] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim()) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/agent/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          fundId,
          language: locale
        }),
      })

      if (response.status === 401) {
        router.push(`/${locale}/login`)
        return
      }

      const data = await response.json()

      if (response.ok && data.projectData) {
        setProjectData(data.projectData)
        setStep('review')
      } else {
        setError(data.error || t('generateError'))
      }
    } catch (err) {
      console.error('Error generating project:', err)
      setError(t('generateError'))
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!projectData) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/${locale}/login`)
        return
      }

      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name,
          description: projectData.description,
          industry: projectData.industry,
          stage: projectData.stage,
          team_size: projectData.team_size,
          annual_revenue: projectData.annual_revenue,
          country: projectData.country,
          problem_statement: projectData.problem_statement,
          value_proposition: projectData.value_proposition,
          target_market: projectData.target_market,
          business_model: projectData.business_model,
          competitive_advantages: projectData.competitive_advantages,
          technology_description: projectData.technology_description,
          project_objectives: projectData.project_objectives,
          expected_impact: projectData.expected_impact,
          metadata: {
            created_with_ai: true,
            source_fund_id: fundId || null,
            ai_generated_at: new Date().toISOString(),
          },
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Redirect to the project detail page
      router.push(`/${locale}/dashboard/projects/${newProject.id}`)
    } catch (err) {
      console.error('Error saving project:', err)
      setError(t('saveError'))
      setSaving(false)
    }
  }

  const updateField = (field: keyof ProjectData, value: string | number | null) => {
    if (projectData) {
      setProjectData({ ...projectData, [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-slate-400">{t('subtitle')}</p>
        </div>
      </div>

      {/* Fund Badge */}
      {fundName && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            <Target className="h-3 w-3 mr-1" />
            {t('applyingFor', { fundName })}
          </Badge>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'describe' ? 'text-purple-400' : 'text-slate-500'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'describe' ? 'bg-purple-600 text-white' :
            step === 'review' || step === 'saving' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            {step === 'review' || step === 'saving' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
          </div>
          <span className="text-sm font-medium">{t('steps.describe')}</span>
        </div>
        <div className="h-px flex-1 bg-slate-700" />
        <div className={`flex items-center gap-2 ${step === 'review' || step === 'saving' ? 'text-purple-400' : 'text-slate-500'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'review' || step === 'saving' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">{t('steps.review')}</span>
        </div>
      </div>

      {/* Step 1: Describe */}
      {step === 'describe' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              {t('describeTitle')}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {t('describeSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">
                {t('descriptionLabel')}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={8}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">{t('descriptionHelp')}</p>
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <p className="text-sm text-slate-400">{t('examplesTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => setDescription(t(`examples.example${i}`))}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {t(`examples.label${i}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={generating || !description.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('generate')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 'review' && projectData && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep('describe')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEditMode(!editMode)}
                className="border-slate-700 text-slate-300"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {editMode ? tCommon('cancel') : tCommon('edit')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tCommon('saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('createProject')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Project Preview Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  {tNew('sections.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('name')}</Label>
                  {editMode ? (
                    <Input
                      value={projectData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">{projectData.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">{tNew('industry')}</Label>
                    {editMode ? (
                      <select
                        value={projectData.industry}
                        onChange={(e) => updateField('industry', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>{tNew(`industries.${ind}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {tNew(`industries.${projectData.industry}`)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">{tNew('stage')}</Label>
                    {editMode ? (
                      <select
                        value={projectData.stage}
                        onChange={(e) => updateField('stage', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                      >
                        {STAGES.map((stg) => (
                          <option key={stg} value={stg}>{tNew(`stages.${stg}`)}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                        {tNew(`stages.${projectData.stage}`)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('country')}</Label>
                  {editMode ? (
                    <select
                      value={projectData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-slate-300 text-sm">
                      {COUNTRIES.find(c => c.code === projectData.country)?.name || projectData.country}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('description')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Problem & Solution */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  {t('problemSolution')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('problemStatement')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.problem_statement}
                      onChange={(e) => updateField('problem_statement', e.target.value)}
                      rows={3}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.problem_statement}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('valueProposition')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.value_proposition}
                      onChange={(e) => updateField('value_proposition', e.target.value)}
                      rows={3}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.value_proposition}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market & Business */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-400" />
                  {t('marketBusiness')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('targetMarket')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.target_market}
                      onChange={(e) => updateField('target_market', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.target_market}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('businessModel')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.business_model}
                      onChange={(e) => updateField('business_model', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.business_model}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('competitiveAdvantages')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.competitive_advantages}
                      onChange={(e) => updateField('competitive_advantages', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.competitive_advantages}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Impact & Technology */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Rocket className="h-5 w-5 text-orange-400" />
                  {t('impactTech')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('technologyDescription')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.technology_description}
                      onChange={(e) => updateField('technology_description', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.technology_description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('projectObjectives')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.project_objectives}
                      onChange={(e) => updateField('project_objectives', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.project_objectives}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">{tNew('expectedImpact')}</Label>
                  {editMode ? (
                    <Textarea
                      value={projectData.expected_impact}
                      onChange={(e) => updateField('expected_impact', e.target.value)}
                      rows={2}
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{projectData.expected_impact}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep('describe')
                setProjectData(null)
              }}
              className="border-slate-700 text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('regenerate')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {tCommon('saving')}
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {t('createProject')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
