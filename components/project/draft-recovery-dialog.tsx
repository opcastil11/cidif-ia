'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RotateCcw, Trash2, Clock } from 'lucide-react'
import type { ProjectDraft } from '@/types/project'

interface DraftRecoveryDialogProps {
  isOpen: boolean
  draft: ProjectDraft | null
  onRecover: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function DraftRecoveryDialog({
  isOpen,
  draft,
  onRecover,
  onDiscard,
  onCancel,
}: DraftRecoveryDialogProps) {
  const t = useTranslations('projectWizard.draftRecovery')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('justNow')
    if (diffMins < 60) return t('minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    return t('daysAgo', { count: diffDays })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-400" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <div className="py-4">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <Clock className="h-4 w-4" />
                <span>{t('lastSaved')}</span>
              </div>
              <p className="text-white font-medium">
                {formatDate(draft.last_saved_at)}
              </p>
              <p className="text-sm text-purple-400 mt-1">
                {getTimeAgo(draft.last_saved_at)}
              </p>

              {draft.wizard_step && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    {t('stepSaved', { step: draft.wizard_step })}
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-4">
              {t('expiresNote')}
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('discard')}
          </Button>
          <div className="flex gap-2 flex-1 sm:justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {t('startFresh')}
            </Button>
            <Button
              onClick={onRecover}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('recover')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
