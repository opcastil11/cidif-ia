'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  Building2,
  Users,
  DollarSign,
  Target,
  ClipboardCheck,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { type WizardStep, wizardSteps } from '@/types/project'

interface WizardLayoutProps {
  currentStep: WizardStep
  onStepChange: (step: WizardStep) => void
  stepsCompleted: Record<WizardStep, boolean>
  onSave: () => Promise<void>
  onSubmit: () => Promise<void>
  isSaving?: boolean
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
  children: React.ReactNode
}

const stepConfig: Record<WizardStep, { icon: React.ReactNode; number: number }> = {
  basic: { icon: <FileText className="h-4 w-4" />, number: 1 },
  company: { icon: <Building2 className="h-4 w-4" />, number: 2 },
  team: { icon: <Users className="h-4 w-4" />, number: 3 },
  budget: { icon: <DollarSign className="h-4 w-4" />, number: 4 },
  milestones: { icon: <Target className="h-4 w-4" />, number: 5 },
  review: { icon: <ClipboardCheck className="h-4 w-4" />, number: 6 },
}

export function WizardLayout({
  currentStep,
  onStepChange,
  stepsCompleted,
  onSave,
  onSubmit,
  isSaving = false,
  lastSaved,
  hasUnsavedChanges = false,
  children,
}: WizardLayoutProps) {
  const t = useTranslations('projectWizard')
  const tCommon = useTranslations('common')

  const currentIndex = wizardSteps.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === wizardSteps.length - 1
  const isReviewStep = currentStep === 'review'

  const completedCount = Object.values(stepsCompleted).filter(Boolean).length
  const progress = (completedCount / (wizardSteps.length - 1)) * 100 // Exclude review from progress

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(wizardSteps[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(wizardSteps[currentIndex + 1])
    }
  }

  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)]">
      {/* Sidebar with steps */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="sticky top-4 bg-slate-900 rounded-lg border border-slate-800 p-4">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-400">{t('progress')}</span>
              <span className="text-purple-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps */}
          <nav className="space-y-1">
            {wizardSteps.map((step) => {
              const config = stepConfig[step]
              const isActive = step === currentStep
              const isCompleted = stepsCompleted[step]
              const stepIndex = wizardSteps.indexOf(step)
              const isAccessible = stepIndex <= currentIndex || stepsCompleted[wizardSteps[stepIndex - 1]]

              return (
                <button
                  key={step}
                  onClick={() => isAccessible && onStepChange(step)}
                  disabled={!isAccessible}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 text-white border border-purple-500/50'
                      : isCompleted
                      ? 'text-slate-300 hover:bg-slate-800'
                      : isAccessible
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t(`steps.${step}`)}</p>
                    {isCompleted && !isActive && (
                      <p className="text-xs text-green-400">{t('completed')}</p>
                    )}
                  </div>
                  {isActive && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      {config.number}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Save status */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {isSaving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('saving')}
                  </span>
                ) : lastSaved ? (
                  <span className="text-green-400">
                    {t('savedAt', { time: formatLastSaved(lastSaved) })}
                  </span>
                ) : (
                  t('notSaved')
                )}
              </span>
              {hasUnsavedChanges && !isSaving && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('unsaved')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Step content */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 mb-6">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-slate-900 rounded-lg border border-slate-800 p-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('previous')}
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onSave}
              disabled={isSaving}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('saveDraft')}
            </Button>

            {isReviewStep ? (
              <Button
                onClick={onSubmit}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {t('createProject')}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isLastStep}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Section navigation sidebar for project edit page
interface SectionNavProps {
  sections: { id: string; labelKey: string; icon: React.ReactNode; isComplete?: boolean }[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
  className?: string
}

export function SectionNav({ sections, activeSection, onSectionChange, className = '' }: SectionNavProps) {
  const t = useTranslations('projectWizard.sections')

  return (
    <nav className={`space-y-1 ${className}`}>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            activeSection === section.id
              ? 'bg-purple-600/20 text-white border border-purple-500/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
          }`}
        >
          <span className={`${activeSection === section.id ? 'text-purple-400' : 'text-slate-500'}`}>
            {section.icon}
          </span>
          <span className="flex-1 text-sm truncate">{t(section.labelKey)}</span>
          {section.isComplete && (
            <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
          )}
        </button>
      ))}
    </nav>
  )
}
