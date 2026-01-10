'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, Trash2, Linkedin, X, Plus, Building2, Calendar } from 'lucide-react'
import { type TeamMemberFormData, teamMemberSchema } from '@/types/project'

interface TeamMemberFormProps {
  member?: TeamMemberFormData
  onSave: (member: TeamMemberFormData) => void
  onCancel: () => void
  onDelete?: () => void
  isOpen: boolean
}

const DEPARTMENTS = [
  'engineering',
  'product',
  'design',
  'marketing',
  'sales',
  'operations',
  'finance',
  'hr',
  'legal',
  'other',
] as const

const defaultTeamMember: TeamMemberFormData = {
  name: '',
  role: '',
  department: '',
  start_date: '',
  linkedin_url: '',
  skills: [],
  bio: '',
  photo_url: '',
  is_active: true,
  order_index: 0,
}

export function TeamMemberForm({ member, onSave, onCancel, onDelete, isOpen }: TeamMemberFormProps) {
  const t = useTranslations('projectWizard.teamMembers')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState<TeamMemberFormData>(member || defaultTeamMember)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSkill, setNewSkill] = useState('')

  const handleChange = (field: keyof TeamMemberFormData, value: string | boolean | string[] | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      handleChange('skills', [...formData.skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    handleChange('skills', formData.skills.filter(s => s !== skill))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    try {
      const result = teamMemberSchema.omit({ id: true, project_id: true }).safeParse({
        ...formData,
        linkedin_url: formData.linkedin_url || null,
        photo_url: formData.photo_url || null,
        department: formData.department || null,
        start_date: formData.start_date || null,
        bio: formData.bio || null,
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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            {member ? t('editMember') : t('addMember')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-slate-700">
              <AvatarImage src={formData.photo_url || undefined} alt={formData.name} />
              <AvatarFallback className="bg-purple-600 text-white text-lg">
                {formData.name ? getInitials(formData.name) : <Users className="h-6 w-6" />}
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

          {/* Department */}
          <div>
            <Label htmlFor="department" className="text-slate-300 flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {t('department')}
            </Label>
            <select
              id="department"
              value={formData.department || ''}
              onChange={(e) => handleChange('department', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white mt-1"
            >
              <option value="">{t('selectDepartment')}</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {t(`departments.${dept}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="start_date" className="text-slate-300 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('startDate')}
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value || null)}
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>

          {/* Skills */}
          <div>
            <Label className="text-slate-300">{t('skills')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder={t('skillPlaceholder')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                onClick={handleAddSkill}
                variant="outline"
                size="icon"
                className="border-slate-700 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
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

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="is_active" className="text-slate-300">{t('isActive')}</Label>
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

// Card component for displaying a team member in a list
interface TeamMemberCardProps {
  member: TeamMemberFormData
  onEdit: () => void
  onDelete: () => void
}

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  const t = useTranslations('projectWizard.teamMembers')

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
      className={`flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer ${!member.is_active ? 'opacity-60' : ''}`}
      onClick={onEdit}
    >
      <Avatar className="h-12 w-12 border border-slate-600">
        <AvatarImage src={member.photo_url || undefined} alt={member.name} />
        <AvatarFallback className="bg-blue-600/20 text-blue-400">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white truncate">{member.name}</h4>
          {!member.is_active && (
            <Badge variant="secondary" className="bg-slate-700 text-slate-400 text-xs">
              {t('inactive')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 truncate">{member.role}</p>
        {member.department && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Building2 className="h-3 w-3" />
            {t(`departments.${member.department}`)}
          </p>
        )}
        {member.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {member.skills.slice(0, 3).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="bg-slate-700/50 text-slate-300 text-xs py-0"
              >
                {skill}
              </Badge>
            ))}
            {member.skills.length > 3 && (
              <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 text-xs py-0">
                +{member.skills.length - 3}
              </Badge>
            )}
          </div>
        )}
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
