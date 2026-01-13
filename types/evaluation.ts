import { z } from 'zod'

// ===================
// EVALUATION DIMENSIONS
// ===================
export const evaluationDimensions = [
  'problem',
  'solution',
  'market',
  'team',
  'financials',
  'innovation',
  'impact',
  'execution',
] as const

export type EvaluationDimension = (typeof evaluationDimensions)[number]

// ===================
// EVALUATION SCHEMA
// ===================
export const evaluationSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Overall score
  overall_score: z.number().int().min(0).max(100),

  // Individual dimension scores
  problem_score: z.number().int().min(0).max(100),
  solution_score: z.number().int().min(0).max(100),
  market_score: z.number().int().min(0).max(100),
  team_score: z.number().int().min(0).max(100),
  financials_score: z.number().int().min(0).max(100),
  innovation_score: z.number().int().min(0).max(100),
  impact_score: z.number().int().min(0).max(100),
  execution_score: z.number().int().min(0).max(100),

  // Feedback
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.string()),

  // Detailed feedback by dimension
  problem_feedback: z.string(),
  solution_feedback: z.string(),
  market_feedback: z.string(),
  team_feedback: z.string(),
  financials_feedback: z.string(),
  innovation_feedback: z.string(),
  impact_feedback: z.string(),
  execution_feedback: z.string(),

  // Fund-specific (optional)
  fund_id: z.string().uuid().optional().nullable(),
  fund_fit_score: z.number().int().min(0).max(100).optional().nullable(),
  fund_fit_feedback: z.string().optional().nullable(),

  // Metadata
  evaluation_model: z.string().optional(),
  tokens_used: z.number().int().optional(),
  evaluation_time_ms: z.number().int().optional(),
})

export type Evaluation = z.infer<typeof evaluationSchema> & {
  created_at?: string
  updated_at?: string
}

// ===================
// AI EVALUATION REQUEST
// ===================
export interface EvaluationRequest {
  projectId: string
  fundId?: string
  language?: 'es' | 'en'
}

// ===================
// AI EVALUATION RESPONSE
// ===================
export interface AIEvaluationResponse {
  overall_score: number

  // Dimension scores
  problem_score: number
  solution_score: number
  market_score: number
  team_score: number
  financials_score: number
  innovation_score: number
  impact_score: number
  execution_score: number

  // Feedback
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]

  // Detailed feedback
  problem_feedback: string
  solution_feedback: string
  market_feedback: string
  team_feedback: string
  financials_feedback: string
  innovation_feedback: string
  impact_feedback: string
  execution_feedback: string

  // Fund-specific (if fund context provided)
  fund_fit_score?: number
  fund_fit_feedback?: string
}

// ===================
// SCORE THRESHOLDS
// ===================
export const scoreThresholds = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 20,
} as const

export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= scoreThresholds.excellent) return 'excellent'
  if (score >= scoreThresholds.good) return 'good'
  if (score >= scoreThresholds.fair) return 'fair'
  if (score >= scoreThresholds.poor) return 'poor'
  return 'critical'
}

export function getScoreColor(score: number): string {
  const level = getScoreLevel(score)
  const colors: Record<ScoreLevel, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-orange-600',
    critical: 'text-red-600',
  }
  return colors[level]
}

export function getScoreBgColor(score: number): string {
  const level = getScoreLevel(score)
  const colors: Record<ScoreLevel, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    critical: 'bg-red-500',
  }
  return colors[level]
}
