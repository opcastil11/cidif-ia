'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Save, Loader2, Crown, Sparkles, Zap, Plus, Trash2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  limits: {
    maxProjects: number
    maxApplications: number
    aiTokensPerMonth: number
  }
  isActive: boolean
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Para empezar a explorar',
    price: 0,
    features: ['1 proyecto', '1 postulación activa', 'Asistente IA (limitado)', 'Catálogo de fondos'],
    limits: { maxProjects: 1, maxApplications: 1, aiTokensPerMonth: 10000 },
    isActive: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Para equipos en crecimiento',
    price: 50,
    features: ['Hasta 5 proyectos', 'Hasta 5 postulaciones activas', 'Asistente IA completo', 'Auto-llenado con IA', 'Investigación con IA', 'Soporte por email'],
    limits: { maxProjects: 5, maxApplications: 5, aiTokensPerMonth: 100000 },
    isActive: true,
  },
  {
    id: 'max',
    name: 'Max',
    description: 'Para empresas y agencias',
    price: 100,
    features: ['Proyectos ilimitados', 'Postulaciones ilimitadas', 'Asistente IA ilimitado', 'Auto-llenado con IA', 'Investigación con IA', 'Soporte prioritario', 'Acceso anticipado'],
    limits: { maxProjects: -1, maxApplications: -1, aiTokensPerMonth: -1 },
    isActive: true,
  },
]

export default function PlansManagementPage() {
  const t = useTranslations('backoffice.plans')
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'plans')
      .single()

    if (data?.value) {
      setPlans(data.value as Plan[])
    }
  }

  const savePlans = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const supabase = createClient()

      // Upsert the plans setting
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'plans',
          value: plans,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving plans:', error)
    } finally {
      setSaving(false)
    }
  }

  const updatePlan = (planId: string, updates: Partial<Plan>) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, ...updates } : p))
  }

  const updateFeature = (planId: string, featureIndex: number, value: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const newFeatures = [...p.features]
        newFeatures[featureIndex] = value
        return { ...p, features: newFeatures }
      }
      return p
    }))
  }

  const addFeature = (planId: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return { ...p, features: [...p.features, ''] }
      }
      return p
    }))
  }

  const removeFeature = (planId: string, featureIndex: number) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const newFeatures = p.features.filter((_, i) => i !== featureIndex)
        return { ...p, features: newFeatures }
      }
      return p
    }))
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'max': return Crown
      case 'standard': return Sparkles
      default: return Zap
    }
  }

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'max': return 'from-orange-500 to-rose-500'
      case 'standard': return 'from-purple-500 to-pink-500'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-slate-400">{t('subtitle')}</p>
        </div>
        <Button
          onClick={savePlans}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? t('saved') : t('saveChanges')}
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.id)
          const isEditing = editingPlan === plan.id

          return (
            <Card key={plan.id} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getPlanGradient(plan.id)} flex items-center justify-center`}>
                      <PlanIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-slate-400">
                        ${plan.price}/mes
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPlan(isEditing ? null : plan.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    {isEditing ? t('collapse') : t('edit')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Edit Mode */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('planName')}</Label>
                        <Input
                          value={plan.name}
                          onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('description')}</Label>
                        <Input
                          value={plan.description}
                          onChange={(e) => updatePlan(plan.id, { description: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('priceUsd')}</Label>
                        <Input
                          type="number"
                          value={plan.price}
                          onChange={(e) => updatePlan(plan.id, { price: parseInt(e.target.value) || 0 })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">{t('maxProjects')}</Label>
                          <Input
                            type="number"
                            value={plan.limits.maxProjects}
                            onChange={(e) => updatePlan(plan.id, {
                              limits: { ...plan.limits, maxProjects: parseInt(e.target.value) || 0 }
                            })}
                            className="bg-slate-800 border-slate-700 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">{t('maxApps')}</Label>
                          <Input
                            type="number"
                            value={plan.limits.maxApplications}
                            onChange={(e) => updatePlan(plan.id, {
                              limits: { ...plan.limits, maxApplications: parseInt(e.target.value) || 0 }
                            })}
                            className="bg-slate-800 border-slate-700 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">{t('aiTokens')}</Label>
                          <Input
                            type="number"
                            value={plan.limits.aiTokensPerMonth}
                            onChange={(e) => updatePlan(plan.id, {
                              limits: { ...plan.limits, aiTokensPerMonth: parseInt(e.target.value) || 0 }
                            })}
                            className="bg-slate-800 border-slate-700 text-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">{t('features')}</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addFeature(plan.id)}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {t('addFeature')}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => updateFeature(plan.id, idx, e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFeature(plan.id, idx)}
                                className="text-red-400 hover:text-red-300 shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <p className="text-slate-400 text-sm">{plan.description}</p>
                    <div className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                          {feature}
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <p className="text-slate-500 text-xs">
                          +{plan.features.length - 4} {t('moreFeatures')}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{t('limits')}:</span>
                        <span>
                          {plan.limits.maxProjects === -1 ? '∞' : plan.limits.maxProjects} proj,
                          {plan.limits.maxApplications === -1 ? '∞' : plan.limits.maxApplications} apps
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-4">
          <p className="text-slate-400 text-sm">
            {t('note')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
