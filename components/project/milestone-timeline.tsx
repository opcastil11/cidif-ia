'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Pause,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { type MilestoneFormData, type MilestoneStatus } from '@/types/project'

interface MilestoneTimelineProps {
  milestones: (MilestoneFormData & { id?: string })[]
  onMilestoneClick?: (milestone: MilestoneFormData & { id?: string }) => void
  className?: string
}

export function MilestoneTimeline({
  milestones,
  onMilestoneClick,
  className = ''
}: MilestoneTimelineProps) {
  const t = useTranslations('projectWizard.milestones')

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) =>
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )
  }, [milestones])

  const stats = useMemo(() => {
    const total = milestones.length
    const completed = milestones.filter(m => m.status === 'completed').length
    const inProgress = milestones.filter(m => m.status === 'in_progress').length
    const delayed = milestones.filter(m => m.status === 'delayed').length
    const overdue = milestones.filter(m =>
      m.status !== 'completed' &&
      m.status !== 'cancelled' &&
      new Date(m.target_date) < new Date()
    ).length

    return { total, completed, inProgress, delayed, overdue }
  }, [milestones])

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-400" />
      case 'delayed':
        return <AlertCircle className="h-5 w-5 text-amber-400" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Pause className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10'
      case 'in_progress':
        return 'border-blue-500 bg-blue-500/10'
      case 'delayed':
        return 'border-amber-500 bg-amber-500/10'
      case 'cancelled':
        return 'border-red-500 bg-red-500/10'
      default:
        return 'border-slate-600 bg-slate-800/50'
    }
  }

  const getLineColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      default:
        return 'bg-slate-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (milestone: MilestoneFormData) => {
    return (
      milestone.status !== 'completed' &&
      milestone.status !== 'cancelled' &&
      new Date(milestone.target_date) < new Date()
    )
  }

  if (milestones.length === 0) {
    return (
      <Card className={`bg-slate-900 border-slate-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-400" />
            {t('timeline')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noMilestones')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('addMilestonesPrompt')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-900 border-slate-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <Target className="h-5 w-5 text-purple-400" />
          {t('timeline')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">{t('totalCount')}</p>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/30">
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-xs text-green-400/70">{t('completedCount')}</p>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-xs text-blue-400/70">{t('inProgressCount')}</p>
          </div>
          {stats.overdue > 0 && (
            <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
              <p className="text-xs text-red-400/70">{t('overdueCount')}</p>
            </div>
          )}
          {stats.overdue === 0 && (
            <div className="text-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <p className="text-2xl font-bold text-amber-400">{stats.delayed}</p>
              <p className="text-xs text-amber-400/70">{t('delayedCount')}</p>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">{t('overallProgress')}</span>
            <span className="text-purple-400 font-medium">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </span>
          </div>
          <Progress
            value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
            className="h-2"
          />
        </div>

        {/* Timeline */}
        <div className="relative">
          {sortedMilestones.map((milestone, index) => (
            <div
              key={milestone.id || index}
              className="relative pl-8 pb-6 last:pb-0"
            >
              {/* Connecting line */}
              {index < sortedMilestones.length - 1 && (
                <div
                  className={`absolute left-[11px] top-6 w-0.5 h-full ${getLineColor(milestone.status)}`}
                />
              )}

              {/* Status indicator */}
              <div
                className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${getStatusColor(milestone.status)}`}
              >
                {milestone.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${
                    milestone.status === 'in_progress' ? 'bg-blue-400' :
                    milestone.status === 'delayed' ? 'bg-amber-400' :
                    milestone.status === 'cancelled' ? 'bg-red-400' :
                    'bg-slate-400'
                  }`} />
                )}
              </div>

              {/* Milestone content */}
              <div
                className={`p-3 rounded-lg border transition-colors ${
                  onMilestoneClick ? 'cursor-pointer hover:border-slate-500' : ''
                } ${getStatusColor(milestone.status)}`}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{milestone.title}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue(milestone) ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        {formatDate(milestone.target_date)}
                      </span>
                      <Badge className={`text-xs ${
                        milestone.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        milestone.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        milestone.status === 'delayed' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        milestone.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}>
                        {getStatusIcon(milestone.status)}
                        <span className="ml-1">{t(`statuses.${milestone.status}`)}</span>
                      </Badge>
                      {isOverdue(milestone) && (
                        <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {t('overdue')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-purple-400">
                      {milestone.completion_percentage}%
                    </span>
                  </div>
                </div>

                {milestone.description && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">{milestone.description}</p>
                )}

                {/* Deliverables preview */}
                {milestone.deliverables.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {milestone.deliverables.slice(0, 2).map((d, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-300 flex items-center gap-1"
                      >
                        <ArrowRight className="h-3 w-3" />
                        {d}
                      </span>
                    ))}
                    {milestone.deliverables.length > 2 && (
                      <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-500">
                        +{milestone.deliverables.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-2">
                  <Progress value={milestone.completion_percentage} className="h-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
