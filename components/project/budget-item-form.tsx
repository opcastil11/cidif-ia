'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DollarSign, Trash2, Calendar, RefreshCw } from 'lucide-react'
import {
  type BudgetItemFormData,
  type BudgetCategory,
  type Currency,
  type TimelineQuarter,
  budgetItemSchema,
  budgetCategories,
  currencies,
  timelineQuarters
} from '@/types/project'

interface BudgetItemFormProps {
  item?: BudgetItemFormData
  onSave: (item: BudgetItemFormData) => void
  onCancel: () => void
  onDelete?: () => void
  isOpen: boolean
}

const defaultBudgetItem: BudgetItemFormData = {
  category: 'personnel',
  description: '',
  amount: 0,
  currency: 'USD',
  justification: '',
  timeline_quarter: null,
  is_recurring: false,
  order_index: 0,
}

export function BudgetItemForm({ item, onSave, onCancel, onDelete, isOpen }: BudgetItemFormProps) {
  const t = useTranslations('projectWizard.budget')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState<BudgetItemFormData>(item || defaultBudgetItem)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof BudgetItemFormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const result = budgetItemSchema.omit({ id: true, project_id: true }).safeParse({
        ...formData,
        justification: formData.justification || null,
        timeline_quarter: formData.timeline_quarter || null,
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            {item ? t('editItem') : t('addItem')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-slate-300">{t('category')} *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value as BudgetCategory)}
              className={`w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white mt-1 ${errors.category ? 'border-red-500' : ''}`}
            >
              {budgetCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-slate-300">{t('description')} *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-slate-300">{t('amount')} *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value ? parseFloat(e.target.value) : 0)}
                placeholder="0.00"
                className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
            </div>
            <div>
              <Label htmlFor="currency" className="text-slate-300">{t('currency')}</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleChange('currency', e.target.value as Currency)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white mt-1"
              >
                {currencies.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {formData.amount > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-sm text-slate-400">{t('preview')}</p>
              <p className="text-xl font-semibold text-green-400">
                {formatCurrency(formData.amount, formData.currency)}
              </p>
            </div>
          )}

          {/* Timeline Quarter */}
          <div>
            <Label htmlFor="timeline_quarter" className="text-slate-300 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('timelineQuarter')}
            </Label>
            <select
              id="timeline_quarter"
              value={formData.timeline_quarter || ''}
              onChange={(e) => handleChange('timeline_quarter', e.target.value as TimelineQuarter || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white mt-1"
            >
              <option value="">{t('selectQuarter')}</option>
              {timelineQuarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Justification */}
          <div>
            <Label htmlFor="justification" className="text-slate-300">{t('justification')}</Label>
            <Textarea
              id="justification"
              value={formData.justification || ''}
              onChange={(e) => handleChange('justification', e.target.value || null)}
              placeholder={t('justificationPlaceholder')}
              rows={3}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 resize-none"
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => handleChange('is_recurring', e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="is_recurring" className="text-slate-300 flex items-center gap-1">
              <RefreshCw className="h-4 w-4" />
              {t('isRecurring')}
            </Label>
          </div>
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

// Card component for displaying a budget item in a list
interface BudgetItemCardProps {
  item: BudgetItemFormData
  onEdit: () => void
  onDelete: () => void
}

export function BudgetItemCard({ item, onEdit, onDelete }: BudgetItemCardProps) {
  const t = useTranslations('projectWizard.budget')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getCategoryColor = (category: BudgetCategory) => {
    const colors: Record<BudgetCategory, string> = {
      personnel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      equipment: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      software: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      infrastructure: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      marketing: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      legal: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      consulting: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      travel: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      training: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      materials: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
      overhead: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      contingency: 'bg-red-500/20 text-red-400 border-red-500/30',
      other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }
    return colors[category]
  }

  return (
    <div
      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <div className={`w-2 h-12 rounded-full ${getCategoryColor(item.category).split(' ')[0]}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs border ${getCategoryColor(item.category)}`}>
            {t(`categories.${item.category}`)}
          </span>
          {item.is_recurring && (
            <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {t('recurring')}
            </span>
          )}
          {item.timeline_quarter && (
            <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
              {item.timeline_quarter}
            </span>
          )}
        </div>
        <p className="text-white mt-1 truncate">{item.description}</p>
        {item.justification && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{item.justification}</p>
        )}
      </div>

      <div className="text-right">
        <p className="text-lg font-semibold text-green-400">
          {formatCurrency(item.amount, item.currency)}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
