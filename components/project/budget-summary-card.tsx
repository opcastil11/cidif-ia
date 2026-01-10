'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DollarSign, TrendingUp, PieChart } from 'lucide-react'
import { type BudgetItemFormData, type BudgetCategory, budgetCategories } from '@/types/project'

interface BudgetSummaryCardProps {
  items: BudgetItemFormData[]
  currency?: string
  showChart?: boolean
  className?: string
}

interface CategorySummary {
  category: BudgetCategory
  amount: number
  percentage: number
  count: number
}

export function BudgetSummaryCard({
  items,
  currency = 'USD',
  showChart = true,
  className = ''
}: BudgetSummaryCardProps) {
  const t = useTranslations('projectWizard.budget')

  const summary = useMemo(() => {
    // Calculate totals
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    const recurringTotal = items
      .filter(item => item.is_recurring)
      .reduce((sum, item) => sum + item.amount, 0)
    const oneTimeTotal = total - recurringTotal

    // Calculate by category
    const byCategory: CategorySummary[] = budgetCategories
      .map(category => {
        const categoryItems = items.filter(item => item.category === category)
        const amount = categoryItems.reduce((sum, item) => sum + item.amount, 0)
        return {
          category,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          count: categoryItems.length,
        }
      })
      .filter(cat => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    // Calculate by quarter
    const byQuarter: Record<string, number> = {}
    items.forEach(item => {
      const quarter = item.timeline_quarter || 'unassigned'
      byQuarter[quarter] = (byQuarter[quarter] || 0) + item.amount
    })

    return {
      total,
      recurringTotal,
      oneTimeTotal,
      itemCount: items.length,
      byCategory,
      byQuarter,
    }
  }, [items])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryColor = (category: BudgetCategory, index: number) => {
    const colors: Record<BudgetCategory, string> = {
      personnel: 'bg-blue-500',
      equipment: 'bg-amber-500',
      software: 'bg-purple-500',
      infrastructure: 'bg-slate-500',
      marketing: 'bg-pink-500',
      legal: 'bg-indigo-500',
      consulting: 'bg-cyan-500',
      travel: 'bg-orange-500',
      training: 'bg-teal-500',
      materials: 'bg-lime-500',
      overhead: 'bg-gray-500',
      contingency: 'bg-red-500',
      other: 'bg-slate-400',
    }
    return colors[category] || `bg-slate-${400 + index * 100}`
  }

  if (items.length === 0) {
    return (
      <Card className={`bg-slate-900 border-slate-800 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <PieChart className="h-5 w-5 text-green-400" />
            {t('summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noItems')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('addItemsPrompt')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-900 border-slate-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          <PieChart className="h-5 w-5 text-green-400" />
          {t('summary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Amount */}
        <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">{t('totalBudget')}</p>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(summary.total)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.itemCount} {t('items')}
          </p>
        </div>

        {/* Recurring vs One-time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">{t('recurring')}</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.recurringTotal)}</p>
          </div>
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">{t('oneTime')}</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatCurrency(summary.oneTimeTotal)}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {showChart && summary.byCategory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">{t('byCategory')}</h4>

            {/* Simple bar chart visualization */}
            <div className="h-6 rounded-full overflow-hidden flex mb-4 bg-slate-800">
              {summary.byCategory.map((cat, index) => (
                <div
                  key={cat.category}
                  className={`${getCategoryColor(cat.category, index)} transition-all duration-300`}
                  style={{ width: `${cat.percentage}%` }}
                  title={`${t(`categories.${cat.category}`)}: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>

            {/* Category list */}
            <div className="space-y-3">
              {summary.byCategory.map((cat, index) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${getCategoryColor(cat.category, index)}`} />
                      <span className="text-sm text-slate-300">{t(`categories.${cat.category}`)}</span>
                      <span className="text-xs text-slate-500">({cat.count})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">{formatCurrency(cat.amount)}</span>
                      <span className="text-xs text-slate-500 ml-2">{cat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress
                    value={cat.percentage}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quarter Distribution */}
        {Object.keys(summary.byQuarter).length > 1 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">{t('byQuarter')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(summary.byQuarter)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([quarter, amount]) => (
                  <div
                    key={quarter}
                    className="p-2 bg-slate-800/30 rounded border border-slate-700"
                  >
                    <span className="text-xs text-slate-400">
                      {quarter === 'unassigned' ? t('unassigned') : quarter}
                    </span>
                    <p className="text-sm font-medium text-white">{formatCurrency(amount)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
