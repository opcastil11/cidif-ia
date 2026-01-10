'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Trash2, Linkedin, Percent } from 'lucide-react'
import { type FounderFormData, founderSchema } from '@/types/project'

interface FounderFormProps {
  founder?: FounderFormData
  onSave: (founder: FounderFormData) => void
  onCancel: () => void
  onDelete?: () => void
  isOpen: boolean
}

const defaultFounder: FounderFormData = {
  name: '',
  email: '',
  role: '',
  equity_percentage: null,
  linkedin_url: '',
  bio: '',
  photo_url: '',
  order_index: 0,
}

export function FounderForm({ founder, onSave, onCancel, onDelete, isOpen }: FounderFormProps) {
  const t = useTranslations('projectWizard.founders')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState<FounderFormData>(founder || defaultFounder)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof FounderFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is modified
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
      // Validate with Zod
      const result = founderSchema.omit({ id: true, project_id: true }).safeParse({
        ...formData,
        linkedin_url: formData.linkedin_url || null,
        photo_url: formData.photo_url || null,
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            {founder ? t('editFounder') : t('addFounder')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-slate-700">
              <AvatarImage src={formData.photo_url || undefined} alt={formData.name} />
              <AvatarFallback className="bg-purple-600 text-white text-lg">
                {formData.name ? getInitials(formData.name) : <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="photo_url" className="text-slate-300 text-sm">{t('photoUrl')}</Label>
              <Input
                id="photo_url"
                value={formData.photo_url || ''}
                onChange={(e) => handleChange('photo_url', e.target.value)}
                placeholder="https://..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-slate-300">{t('name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('namePlaceholder')}
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-slate-300">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value || null)}
              placeholder={t('emailPlaceholder')}
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-slate-300">{t('role')} *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              placeholder={t('rolePlaceholder')}
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.role ? 'border-red-500' : ''}`}
            />
            {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
          </div>

          {/* Equity Percentage */}
          <div>
            <Label htmlFor="equity_percentage" className="text-slate-300 flex items-center gap-1">
              <Percent className="h-4 w-4" />
              {t('equityPercentage')}
            </Label>
            <Input
              id="equity_percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.equity_percentage ?? ''}
              onChange={(e) => handleChange('equity_percentage', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0 - 100"
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.equity_percentage ? 'border-red-500' : ''}`}
            />
            {errors.equity_percentage && <p className="text-red-400 text-sm mt-1">{errors.equity_percentage}</p>}
          </div>

          {/* LinkedIn URL */}
          <div>
            <Label htmlFor="linkedin_url" className="text-slate-300 flex items-center gap-1">
              <Linkedin className="h-4 w-4" />
              {t('linkedinUrl')}
            </Label>
            <Input
              id="linkedin_url"
              type="url"
              value={formData.linkedin_url || ''}
              onChange={(e) => handleChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className={`bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 ${errors.linkedin_url ? 'border-red-500' : ''}`}
            />
            {errors.linkedin_url && <p className="text-red-400 text-sm mt-1">{errors.linkedin_url}</p>}
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-slate-300">{t('bio')}</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value || null)}
              placeholder={t('bioPlaceholder')}
              rows={3}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 mt-1 resize-none"
            />
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

// Card component for displaying a founder in a list
interface FounderCardProps {
  founder: FounderFormData
  onEdit: () => void
  onDelete: () => void
}

export function FounderCard({ founder, onEdit, onDelete }: FounderCardProps) {
  const t = useTranslations('projectWizard.founders')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
      onClick={onEdit}
    >
      <Avatar className="h-12 w-12 border border-slate-600">
        <AvatarImage src={founder.photo_url || undefined} alt={founder.name} />
        <AvatarFallback className="bg-purple-600/20 text-purple-400">
          {getInitials(founder.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white truncate">{founder.name}</h4>
        <p className="text-sm text-slate-400 truncate">{founder.role}</p>
        <div className="flex items-center gap-3 mt-1">
          {founder.equity_percentage !== null && founder.equity_percentage !== undefined && (
            <span className="text-xs text-purple-400 flex items-center gap-1">
              <Percent className="h-3 w-3" />
              {founder.equity_percentage}%
            </span>
          )}
          {founder.linkedin_url && (
            <a
              href={founder.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </a>
          )}
        </div>
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
