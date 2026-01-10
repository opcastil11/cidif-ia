'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Trash2, Calendar, X, Plus, CheckCircle2, Clock, AlertCircle, XCircle, Pause } from 'lucide-react'
import {
  type MilestoneFormData,
  type MilestoneStatus,
  type Milestone,
  milestoneSchema,
  milestoneStatuses
} from '@/types/project'

interface MilestoneFormProps {
  milestone?: MilestoneFormData
  existingMilestones?: Milestone[]
  onSave: (milestone: MilestoneFormData) => void
  onCancel: () => void
  onDelete?: () => void
  isOpen: boolean
}

const defaultMilestone: MilestoneFormData = {
  title: '',
  description: '',
  target_date: '',
  status: 'pending',
  deliverables: [],
  dependencies: [],
  completion_percentage: 0,
  completed_at: null,
  order_index: 0,
}

export function MilestoneForm({ milestone, existingMilestones = [], onSave, onCancel, onDelete, isOpen }: MilestoneFormProps) {
  const t = useTranslations('projectWizard.milestones')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState<MilestoneFormData>(milestone || defaultMilestone)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newDeliverable, setNewDeliverable] = useState('')

  const handleChange = (field: keyof MilestoneFormData, value: string | number | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAddDeliverable = () => {
    if (newDeliverable.trim() && !formData.deliverables.includes(newDeliverable.trim())) {
      handleChange('deliverables', [...formData.deliverables, newDeliverable.trim()])
      setNewDeliverable('')
    }
  }

  const handleRemoveDeliverable = (deliverable: string) => {
    handleChange('deliverables', formData.deliverables.filter(d => d !== deliverable))
  }

  const handleToggleDependency = (milestoneId: string) => {
    if (formData.dependencies.includes(milestoneId)) {
      handleChange('dependencies', formData.dependencies.filter(d => d !== milestoneId))
    } else {
      handleChange('dependencies', [...formData.dependencies, milestoneId])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const result = milestoneSchema.omit({ id: true, project_id: true }).safeParse({
        ...formData,
        description: formData.description || null,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      })

      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach(err => {
          const field = err.path[0] as string
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
        return
      }

      onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400" />
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-amber-400" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Pause className="h-4 w-4 text-slate-400" />
    }
  }

  // Filter out the current milestone from dependencies
  const availableDependencies = existingMilestones.filter(m =>
    m.id !== (milestone as Milestone | undefined)?.id
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            {milestone ? t('editMilestone') : t('addMilestone')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-slate-300">{t('title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('titlePlaceholder')}
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-slate-300">{t('description')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value || null)}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 resize-none"
            />
          </div>

          {/* Target Date */}
          <div>
            <Label htmlFor="target_date" className="text-slate-300 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('targetDate')} *
            </Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => handleChange('target_date', e.target.value)}
              className={`bg-slate-800 border-slate-700 text-white mt-1 ${errors.target_date ? 'border-red-500' : ''}`}
            />
            {errors.target_date && <p className="text-red-400 text-sm mt-1">{errors.target_date}</p>}
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className="text-slate-300">{t('status')}</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as MilestoneStatus)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white mt-1"
            >
              {milestoneStatuses.map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Completion Percentage */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="completion_percentage" className="text-slate-300">{t('completionPercentage')}</Label>
              <span className="text-sm text-purple-400">{formData.completion_percentage}%</span>
            </div>
            <Input
              id="completion_percentage"
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.completion_percentage}
              onChange={(e) => handleChange('completion_percentage', parseInt(e.target.value))}
              className="mt-1 accent-purple-600"
            />
            <Progress value={formData.completion_percentage} className="h-2 mt-2" />
          </div>

          {/* Deliverables */}
          <div>
            <Label className="text-slate-300">{t('deliverables')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDeliverable())}
                placeholder={t('deliverablePlaceholder')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                onClick={handleAddDeliverable}
                variant="outline"
                size="icon"
                className="border-slate-700 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.deliverables.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm text-slate-200 flex-1">{deliverable}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(deliverable)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dependencies */}
          {availableDependencies.length > 0 && (
            <div>
              <Label className="text-slate-300">{t('dependencies')}</Label>
              <p className="text-xs text-slate-500 mb-2">{t('dependenciesHelp')}</p>
              <div className="space-y-2">
                {availableDependencies.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleDependency(m.id!)}
                    className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.dependencies.includes(m.id!)
                        ? 'bg-purple-600/20 border-purple-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.dependencies.includes(m.id!)}
                      onChange={() => {}}
                      className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{m.title}</p>
                      <p className="text-xs text-slate-500">{m.target_date}</p>
                    </div>
                    {getStatusIcon(m.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-500/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Card component for displaying a milestone in a list
interface MilestoneCardProps {
  milestone: MilestoneFormData & { id?: string }
  onEdit: () => void
  onDelete: () => void
}

export function MilestoneCard({ milestone, onEdit, onDelete }: MilestoneCardProps) {
  const t = useTranslations('projectWizard.milestones')

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'delayed':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'delayed':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <Pause className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = milestone.status !== 'completed' &&
                    milestone.status !== 'cancelled' &&
                    new Date(milestone.target_date) < new Date()

  return (
    <div
      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-white">{milestone.title}</h4>
            <Badge className={`${getStatusColor(milestone.status)} text-xs flex items-center gap-1`}>
              {getStatusIcon(milestone.status)}
              {t(`statuses.${milestone.status}`)}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
              <Calendar className="h-3 w-3" />
              {formatDate(milestone.target_date)}
              {isOverdue && <AlertCircle className="h-3 w-3" />}
            </span>
            {milestone.deliverables.length > 0 && (
              <span className="text-slate-500">
                {milestone.deliverables.length} {t('deliverableCount')}
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-sm text-slate-400 mt-2 line-clamp-2">{milestone.description}</p>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{t('progress')}</span>
              <span>{milestone.completion_percentage}%</span>
            </div>
            <Progress value={milestone.completion_percentage} className="h-1.5" />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
