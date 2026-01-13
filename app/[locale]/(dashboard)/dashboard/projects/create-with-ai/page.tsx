'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { AIProjectCreator } from '@/components/ai/ai-project-creator'
import { useTranslations } from 'next-intl'

function AIProjectCreatorContent() {
  const searchParams = useSearchParams()
  const fundId = searchParams.get('fund') || undefined
  const fundName = searchParams.get('fundName') || undefined
  const t = useTranslations('aiProjectCreator')

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:text-white">
          <Link href="/dashboard/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-sm text-slate-400">{t('backToProjects')}</p>
        </div>
      </div>

      <AIProjectCreator fundId={fundId} fundName={fundName} />
    </div>
  )
}

export default function CreateWithAIPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <AIProjectCreatorContent />
    </Suspense>
  )
}
