'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { type MilestoneFormData, type MilestoneStatus } from '@/types/project'

interface GanttChartProps {
  milestones: (MilestoneFormData & { id?: string })[]
  onMilestoneClick?: (milestone: MilestoneFormData & { id?: string }) => void
  className?: string
}

type ViewMode = 'month' | 'quarter' | 'year'

export function GanttChart({
  milestones,
  onMilestoneClick,
  className = ''
}: GanttChartProps) {
  const t = useTranslations('projectWizard.gantt')
  const [viewMode, setViewMode] = useState<ViewMode>('quarter')
  const [viewOffset, setViewOffset] = useState(0)

  const sortedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) =>
      new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )
  }, [milestones])

  const dateRange = useMemo(() => {
    if (milestones.length === 0) {
      const now = new Date()
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 6, 0),
      }
    }

    const dates = milestones.map(m => new Date(m.target_date))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    // Add some padding
    minDate.setMonth(minDate.getMonth() - 1)
    maxDate.setMonth(maxDate.getMonth() + 1)

    return { start: minDate, end: maxDate }
  }, [milestones])

  const columns = useMemo(() => {
    const cols: { label: string; start: Date; end: Date }[] = []
    const start = new Date(dateRange.start)

    // Adjust start based on view offset
    if (viewMode === 'month') {
      start.setMonth(start.getMonth() + viewOffset)
    } else if (viewMode === 'quarter') {
      start.setMonth(start.getMonth() + viewOffset * 3)
    } else {
      start.setFullYear(start.getFullYear() + viewOffset)
    }

    const colCount = viewMode === 'month' ? 6 : viewMode === 'quarter' ? 4 : 2

    for (let i = 0; i < colCount; i++) {
      const colStart = new Date(start)
      const colEnd = new Date(start)

      if (viewMode === 'month') {
        colStart.setMonth(colStart.getMonth() + i)
        colStart.setDate(1)
        colEnd.setMonth(colEnd.getMonth() + i + 1)
        colEnd.setDate(0)
        cols.push({
          label: colStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          start: colStart,
          end: colEnd,
        })
      } else if (viewMode === 'quarter') {
        colStart.setMonth(colStart.getMonth() + i * 3)
        colStart.setDate(1)
        colEnd.setMonth(colEnd.getMonth() + (i + 1) * 3)
        colEnd.setDate(0)
        const q = Math.floor(colStart.getMonth() / 3) + 1
        cols.push({
          label: `Q${q} ${colStart.getFullYear()}`,
          start: colStart,
          end: colEnd,
        })
      } else {
        colStart.setFullYear(colStart.getFullYear() + i)
        colStart.setMonth(0)
        colStart.setDate(1)
        colEnd.setFullYear(colEnd.getFullYear() + i)
        colEnd.setMonth(11)
        colEnd.setDate(31)
        cols.push({
          label: colStart.getFullYear().toString(),
          start: colStart,
          end: colEnd,
        })
      }
    }

    return cols
  }, [dateRange, viewMode, viewOffset])

  const getBarPosition = (targetDate: string) => {
    const date = new Date(targetDate)
    const totalDays = columns.reduce((sum, col) => {
      return sum + Math.ceil((col.end.getTime() - col.start.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)

    const startDate = columns[0].start
    const endDate = columns[columns.length - 1].end
    const daysFromStart = Math.ceil((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate position as percentage
    const position = (daysFromStart / totalDays) * 100
    return Math.max(0, Math.min(100, position))
  }

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'delayed':
        return 'bg-amber-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-slate-500'
    }
  }

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />
      case 'in_progress':
        return <Clock className="h-3 w-3" />
      case 'delayed':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const isOverdue = (milestone: MilestoneFormData) => {
    return (
      milestone.status !== 'completed' &&
      milestone.status !== 'cancelled' &&
      new Date(milestone.target_date) < new Date()
    )
  }

  // Today marker position
  const todayPosition = useMemo(() => {
    const today = new Date()
    const startDate = columns[0]?.start
    const endDate = columns[columns.length - 1]?.end

    if (!startDate || !endDate || today < startDate || today > endDate) {
      return null
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return (daysFromStart / totalDays) * 100
  }, [columns])

  if (milestones.length === 0) {
    return (
      <Card className={`bg-slate-900 border-slate-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            {t('title')}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* View mode selector */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              {(['month', 'quarter', 'year'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    viewMode === mode
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t(`view.${mode}`)}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewOffset(v => v - 1)}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewOffset(0)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {t('today')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewOffset(v => v + 1)}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Header */}
        <div className="flex border-b border-slate-700">
          <div className="w-48 flex-shrink-0 p-2 text-sm font-medium text-slate-400">
            {t('milestone')}
          </div>
          <div className="flex-1 flex">
            {columns.map((col, i) => (
              <div
                key={i}
                className="flex-1 p-2 text-center text-xs font-medium text-slate-400 border-l border-slate-700"
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>

        {/* Chart Body */}
        <div className="relative">
          {/* Today marker */}
          {todayPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `calc(192px + ${todayPosition}% * (100% - 192px) / 100)` }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-red-500 rounded text-[10px] text-white whitespace-nowrap">
                {t('todayLabel')}
              </div>
            </div>
          )}

          {sortedMilestones.map((milestone, index) => {
            const position = getBarPosition(milestone.target_date)
            const overdue = isOverdue(milestone)

            return (
              <div
                key={milestone.id || index}
                className={`flex items-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  onMilestoneClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onMilestoneClick?.(milestone)}
              >
                {/* Milestone name */}
                <div className="w-48 flex-shrink-0 p-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`} />
                    <span className="text-sm text-white truncate" title={milestone.title}>
                      {milestone.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {new Date(milestone.target_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative h-12">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {columns.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-slate-800" />
                    ))}
                  </div>

                  {/* Milestone marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1"
                    style={{ left: `${position}%` }}
                  >
                    {/* Diamond marker */}
                    <div
                      className={`w-4 h-4 rotate-45 ${getStatusColor(milestone.status)} ${
                        overdue ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-slate-900' : ''
                      }`}
                    />

                    {/* Progress indicator */}
                    {milestone.completion_percentage > 0 && milestone.completion_percentage < 100 && (
                      <div className="ml-2 flex items-center gap-1 bg-slate-800 rounded px-1.5 py-0.5">
                        {getStatusIcon(milestone.status)}
                        <span className="text-xs text-slate-300">
                          {milestone.completion_percentage}%
                        </span>
                      </div>
                    )}

                    {milestone.status === 'completed' && (
                      <div className="ml-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      </div>
                    )}

                    {overdue && (
                      <Badge className="ml-2 text-[10px] bg-red-500/20 text-red-400 border-red-500/30 py-0">
                        {t('overdue')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-green-500" />
            <span className="text-xs text-slate-400">{t('legend.completed')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-blue-500" />
            <span className="text-xs text-slate-400">{t('legend.inProgress')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-slate-500" />
            <span className="text-xs text-slate-400">{t('legend.pending')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-amber-500" />
            <span className="text-xs text-slate-400">{t('legend.delayed')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
