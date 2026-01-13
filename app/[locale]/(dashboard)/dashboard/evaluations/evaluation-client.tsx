'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Lightbulb,
    Loader2,
    RefreshCw,
    Sparkles,
    Target,
    ThumbsDown,
    ThumbsUp,
    TrendingUp,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { AIEvaluationResponse, getScoreColor, getScoreLevel } from '@/types/evaluation'
import { cn } from '@/lib/utils'

interface Project {
    id: string
    name: string
    description: string | null
    industry: string | null
    stage: string | null
}

interface Fund {
    id: string
    name: string
    organization: string
    country: string
}

interface EvaluationClientContentProps {
    projects: Project[]
    funds: Fund[]
}

interface EvaluationResult {
    evaluation: AIEvaluationResponse
    project: { id: string; name: string }
    fund: { id: string; name: string } | null
    metadata: {
        tokens_used: number
        evaluation_time_ms: number
    }
}

export function EvaluationClientContent({ projects, funds }: EvaluationClientContentProps) {
    const t = useTranslations('evaluation')
    const locale = useLocale()
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [selectedFund, setSelectedFund] = useState<string>('')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const handleEvaluate = async () => {
        if (!selectedProject) {
            toast.error(t('errors.selectProject'))
            return
        }

        setIsEvaluating(true)
        setEvaluation(null)

        try {
            const response = await fetch('/api/agent/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject,
                    fundId: selectedFund && selectedFund !== 'none' ? selectedFund : undefined,
                    language: locale,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to evaluate')
            }

            const result = await response.json()
            setEvaluation(result)
            toast.success(t('success.evaluated'))

            // Expand all sections by default
            setExpandedSections({
                problem: true,
                solution: true,
                market: true,
                team: true,
                financials: true,
                innovation: true,
                impact: true,
                execution: true,
                fundFit: true,
            })
        } catch (error) {
            console.error('Evaluation error:', error)
            toast.error(t('errors.evaluationFailed'))
        } finally {
            setIsEvaluating(false)
        }
    }

    const ScoreCircle = ({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClasses = {
            sm: 'h-12 w-12 text-lg',
            md: 'h-20 w-20 text-2xl',
            lg: 'h-32 w-32 text-4xl',
        }
        const level = getScoreLevel(score)
        const bgColors: Record<string, string> = {
            excellent: 'from-green-500 to-emerald-600',
            good: 'from-blue-500 to-cyan-600',
            fair: 'from-yellow-500 to-amber-600',
            poor: 'from-orange-500 to-red-500',
            critical: 'from-red-600 to-red-800',
        }

        return (
            <div
                className={cn(
                    'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br shadow-lg',
                    sizeClasses[size],
                    bgColors[level]
                )}
            >
                {score}
            </div>
        )
    }

    const DimensionCard = ({
        dimension,
        score,
        feedback,
        icon: Icon,
    }: {
        dimension: string
        score: number
        feedback: string
        icon: React.ComponentType<{ className?: string }>
    }) => {
        const isExpanded = expandedSections[dimension]
        const level = getScoreLevel(score)

        return (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader
                    className="cursor-pointer hover:bg-slate-800/80 transition-colors"
                    onClick={() => toggleSection(dimension)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'p-2 rounded-lg',
                                level === 'excellent' && 'bg-green-500/20',
                                level === 'good' && 'bg-blue-500/20',
                                level === 'fair' && 'bg-yellow-500/20',
                                level === 'poor' && 'bg-orange-500/20',
                                level === 'critical' && 'bg-red-500/20',
                            )}>
                                <Icon className={cn('h-5 w-5', getScoreColor(score))} />
                            </div>
                            <CardTitle className="text-lg text-white">
                                {t(`dimensions.${dimension}`)}
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Progress
                                    value={score}
                                    className="w-24 h-2"
                                />
                                <span className={cn('font-bold text-lg', getScoreColor(score))}>
                                    {score}
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                    </div>
                </CardHeader>
                {isExpanded && (
                    <CardContent className="pt-0">
                        <p className="text-slate-300 leading-relaxed">{feedback}</p>
                    </CardContent>
                )}
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Project Selection */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-purple-400" />
                        {t('selectProject.title')}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        {t('selectProject.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">{t('selectProject.projectLabel')}</label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder={t('selectProject.projectPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {projects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id}
                                            className="text-white hover:bg-slate-700"
                                        >
                                            <div className="flex flex-col">
                                                <span>{project.name}</span>
                                                {project.industry && (
                                                    <span className="text-xs text-slate-400">{project.industry}</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">{t('selectProject.fundLabel')}</label>
                            <Select value={selectedFund} onValueChange={setSelectedFund}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder={t('selectProject.fundPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="none" className="text-slate-400 hover:bg-slate-700">
                                        {t('selectProject.noFund')}
                                    </SelectItem>
                                    {funds.map((fund) => (
                                        <SelectItem
                                            key={fund.id}
                                            value={fund.id}
                                            className="text-white hover:bg-slate-700"
                                        >
                                            <div className="flex flex-col">
                                                <span>{fund.name}</span>
                                                <span className="text-xs text-slate-400">{fund.organization}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleEvaluate}
                        disabled={!selectedProject || isEvaluating}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        {isEvaluating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('evaluating')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {t('evaluateButton')}
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Evaluation Results */}
            {evaluation && (
                <div className="space-y-6">
                    {/* Overall Score */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <ScoreCircle score={evaluation.evaluation.overall_score} size="lg" />
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {t('overallScore.title')}
                                    </h2>
                                    <Badge
                                        className={cn(
                                            'text-sm px-3 py-1',
                                            getScoreLevel(evaluation.evaluation.overall_score) === 'excellent' && 'bg-green-500/20 text-green-400 border-green-500/30',
                                            getScoreLevel(evaluation.evaluation.overall_score) === 'good' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                            getScoreLevel(evaluation.evaluation.overall_score) === 'fair' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                                            getScoreLevel(evaluation.evaluation.overall_score) === 'poor' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                                            getScoreLevel(evaluation.evaluation.overall_score) === 'critical' && 'bg-red-500/20 text-red-400 border-red-500/30',
                                        )}
                                    >
                                        {t(`levels.${getScoreLevel(evaluation.evaluation.overall_score)}`)}
                                    </Badge>
                                    <p className="text-slate-300 mt-4 leading-relaxed">
                                        {evaluation.evaluation.summary}
                                    </p>
                                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                                        <span>{evaluation.project.name}</span>
                                        {evaluation.fund && (
                                            <>
                                                <span>•</span>
                                                <span>{evaluation.fund.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Score Overview Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { key: 'problem', score: evaluation.evaluation.problem_score },
                            { key: 'solution', score: evaluation.evaluation.solution_score },
                            { key: 'market', score: evaluation.evaluation.market_score },
                            { key: 'team', score: evaluation.evaluation.team_score },
                            { key: 'financials', score: evaluation.evaluation.financials_score },
                            { key: 'innovation', score: evaluation.evaluation.innovation_score },
                            { key: 'impact', score: evaluation.evaluation.impact_score },
                            { key: 'execution', score: evaluation.evaluation.execution_score },
                        ].map(({ key, score }) => (
                            <Card key={key} className="bg-slate-800/50 border-slate-700">
                                <CardContent className="p-4 text-center">
                                    <ScoreCircle score={score} size="sm" />
                                    <p className="text-sm text-slate-400 mt-2">{t(`dimensions.${key}`)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Strengths, Weaknesses, Recommendations */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Strengths */}
                        <Card className="bg-green-500/10 border-green-500/30">
                            <CardHeader>
                                <CardTitle className="text-green-400 flex items-center gap-2">
                                    <ThumbsUp className="h-5 w-5" />
                                    {t('feedback.strengths')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {evaluation.evaluation.strengths.map((strength, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                                            <CheckCircle className="h-4 w-4 text-green-400 mt-1 shrink-0" />
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Weaknesses */}
                        <Card className="bg-orange-500/10 border-orange-500/30">
                            <CardHeader>
                                <CardTitle className="text-orange-400 flex items-center gap-2">
                                    <ThumbsDown className="h-5 w-5" />
                                    {t('feedback.weaknesses')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {evaluation.evaluation.weaknesses.map((weakness, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                                            <AlertTriangle className="h-4 w-4 text-orange-400 mt-1 shrink-0" />
                                            <span>{weakness}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card className="bg-purple-500/10 border-purple-500/30">
                            <CardHeader>
                                <CardTitle className="text-purple-400 flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    {t('feedback.recommendations')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {evaluation.evaluation.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-slate-300">
                                            <Target className="h-4 w-4 text-purple-400 mt-1 shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Dimension Feedback */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">{t('detailedFeedback.title')}</h3>
                        <div className="space-y-3">
                            <DimensionCard
                                dimension="problem"
                                score={evaluation.evaluation.problem_score}
                                feedback={evaluation.evaluation.problem_feedback}
                                icon={AlertTriangle}
                            />
                            <DimensionCard
                                dimension="solution"
                                score={evaluation.evaluation.solution_score}
                                feedback={evaluation.evaluation.solution_feedback}
                                icon={Lightbulb}
                            />
                            <DimensionCard
                                dimension="market"
                                score={evaluation.evaluation.market_score}
                                feedback={evaluation.evaluation.market_feedback}
                                icon={TrendingUp}
                            />
                            <DimensionCard
                                dimension="team"
                                score={evaluation.evaluation.team_score}
                                feedback={evaluation.evaluation.team_feedback}
                                icon={Target}
                            />
                            <DimensionCard
                                dimension="financials"
                                score={evaluation.evaluation.financials_score}
                                feedback={evaluation.evaluation.financials_feedback}
                                icon={TrendingUp}
                            />
                            <DimensionCard
                                dimension="innovation"
                                score={evaluation.evaluation.innovation_score}
                                feedback={evaluation.evaluation.innovation_feedback}
                                icon={Sparkles}
                            />
                            <DimensionCard
                                dimension="impact"
                                score={evaluation.evaluation.impact_score}
                                feedback={evaluation.evaluation.impact_feedback}
                                icon={Target}
                            />
                            <DimensionCard
                                dimension="execution"
                                score={evaluation.evaluation.execution_score}
                                feedback={evaluation.evaluation.execution_feedback}
                                icon={CheckCircle}
                            />
                        </div>
                    </div>

                    {/* Fund Fit (if applicable) */}
                    {evaluation.evaluation.fund_fit_score !== undefined && evaluation.fund && (
                        <Card className="bg-slate-900 border-purple-500/30">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-purple-400 flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        {t('fundFit.title', { fundName: evaluation.fund.name })}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={evaluation.evaluation.fund_fit_score}
                                            className="w-24 h-2"
                                        />
                                        <span className={cn('font-bold text-lg', getScoreColor(evaluation.evaluation.fund_fit_score))}>
                                            {evaluation.evaluation.fund_fit_score}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300 leading-relaxed">
                                    {evaluation.evaluation.fund_fit_feedback}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Re-evaluate button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={handleEvaluate}
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('reEvaluate')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
