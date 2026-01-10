import { z } from 'zod'

// ===================
// PROJECT FOUNDER
// ===================
export const founderSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  role: z.string().min(1, 'Role is required'),
  equity_percentage: z.number().min(0).max(100).optional().nullable(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  bio: z.string().optional().nullable(),
  photo_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  order_index: z.number().int().default(0),
})

export type Founder = z.infer<typeof founderSchema> & {
  created_at?: string
  updated_at?: string
}

export type FounderFormData = Omit<Founder, 'id' | 'project_id' | 'created_at' | 'updated_at'>

// ===================
// PROJECT TEAM MEMBER
// ===================
export const teamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable().or(z.literal('')),
  skills: z.array(z.string()).default([]),
  bio: z.string().optional().nullable(),
  photo_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  is_active: z.boolean().default(true),
  order_index: z.number().int().default(0),
})

export type TeamMember = z.infer<typeof teamMemberSchema> & {
  created_at?: string
  updated_at?: string
}

export type TeamMemberFormData = Omit<TeamMember, 'id' | 'project_id' | 'created_at' | 'updated_at'>

// ===================
// PROJECT BUDGET ITEM
// ===================
export const budgetCategories = [
  'personnel',
  'equipment',
  'software',
  'infrastructure',
  'marketing',
  'legal',
  'consulting',
  'travel',
  'training',
  'materials',
  'overhead',
  'contingency',
  'other',
] as const

export type BudgetCategory = (typeof budgetCategories)[number]

export const currencies = ['USD', 'EUR', 'CLP', 'MXN', 'COP', 'ARS', 'BRL', 'PEN'] as const
export type Currency = (typeof currencies)[number]

export const timelineQuarters = ['Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q2', 'Q2-Q3', 'Q3-Q4', 'Q1-Q4'] as const
export type TimelineQuarter = (typeof timelineQuarters)[number]

export const budgetItemSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  category: z.enum(budgetCategories),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(currencies).default('USD'),
  justification: z.string().optional().nullable(),
  timeline_quarter: z.enum(timelineQuarters).optional().nullable(),
  is_recurring: z.boolean().default(false),
  order_index: z.number().int().default(0),
})

export type BudgetItem = z.infer<typeof budgetItemSchema> & {
  created_at?: string
  updated_at?: string
}

export type BudgetItemFormData = Omit<BudgetItem, 'id' | 'project_id' | 'created_at' | 'updated_at'>

// ===================
// PROJECT MILESTONE
// ===================
export const milestoneStatuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'] as const
export type MilestoneStatus = (typeof milestoneStatuses)[number]

export const milestoneSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  target_date: z.string().min(1, 'Target date is required'),
  status: z.enum(milestoneStatuses).default('pending'),
  deliverables: z.array(z.string()).default([]),
  dependencies: z.array(z.string().uuid()).default([]),
  completion_percentage: z.number().int().min(0).max(100).default(0),
  completed_at: z.string().optional().nullable(),
  order_index: z.number().int().default(0),
})

export type Milestone = z.infer<typeof milestoneSchema> & {
  created_at?: string
  updated_at?: string
}

export type MilestoneFormData = Omit<Milestone, 'id' | 'project_id' | 'created_at' | 'updated_at'>

// ===================
// PROJECT DRAFT
// ===================
export interface ProjectDraft {
  id: string
  user_id: string
  project_id: string | null
  draft_data: Record<string, unknown>
  wizard_step: number
  last_saved_at: string
  expires_at: string
  created_at: string
}

// ===================
// WIZARD STEPS
// ===================
export const wizardSteps = [
  'basic',
  'company',
  'team',
  'budget',
  'milestones',
  'review',
] as const

export type WizardStep = (typeof wizardSteps)[number]

export interface WizardStepConfig {
  id: WizardStep
  number: number
  titleKey: string
  activeFormKey: string
  isComplete: (data: Partial<ProjectWizardData>) => boolean
}

// ===================
// PROJECT WIZARD DATA
// ===================
export interface ProjectWizardData {
  // Basic Info (Step 1)
  name: string
  description: string
  industry: string
  stage: string
  team_size: number | null
  annual_revenue: number | null
  founded_date: string
  pitch_deck_url: string
  logo_url: string

  // Company Info (Step 2)
  legal_name: string
  tax_id: string
  legal_entity_type: string
  country: string
  city: string
  address: string
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_position: string
  website_url: string
  linkedin_url: string

  // Business Info (Step 2 cont.)
  problem_statement: string
  value_proposition: string
  target_market: string
  business_model: string
  competitive_advantages: string

  // Financial Info (Step 2 cont.)
  monthly_burn_rate: number | null
  funding_received: number | null
  funding_seeking: number | null

  // Team (Step 3) - Arrays of sub-items
  founders: FounderFormData[]
  team_members: TeamMemberFormData[]

  // Budget (Step 4) - Array of budget items
  budget_items: BudgetItemFormData[]

  // Milestones (Step 5) - Array of milestones
  milestones: MilestoneFormData[]

  // Additional fields for existing projects
  project_objectives: string
  expected_impact: string
  sdg_alignment: string
  environmental_impact: string
  social_impact: string
  timeline_milestones: string
  risk_assessment: string
  key_activities: string
  market_size_tam: string
  market_size_sam: string
  market_size_som: string
  competitors_list: string
  go_to_market_strategy: string
  use_of_funds: string
  revenue_projections: string
  runway_months: number | null
  trl_level: string
  rd_activities: string
  patents_publications: string
  previous_customers: string
  letters_of_support: string
  technology_description: string
  ip_status: string
  product_status: string
  monthly_users: number | null
  monthly_revenue: number | null
  growth_rate_monthly: number | null
  customer_count: number | null
  cofounders: string
  key_team_members: string
  advisors: string
  team_background: string
  previous_grants: string
}

// Default values for wizard
export const defaultProjectWizardData: Partial<ProjectWizardData> = {
  name: '',
  description: '',
  industry: '',
  stage: '',
  team_size: null,
  annual_revenue: null,
  founded_date: '',
  pitch_deck_url: '',
  logo_url: '',
  legal_name: '',
  tax_id: '',
  legal_entity_type: '',
  country: '',
  city: '',
  address: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  contact_position: '',
  website_url: '',
  linkedin_url: '',
  problem_statement: '',
  value_proposition: '',
  target_market: '',
  business_model: '',
  competitive_advantages: '',
  monthly_burn_rate: null,
  funding_received: null,
  funding_seeking: null,
  founders: [],
  team_members: [],
  budget_items: [],
  milestones: [],
  project_objectives: '',
  expected_impact: '',
  sdg_alignment: '',
  environmental_impact: '',
  social_impact: '',
  timeline_milestones: '',
  risk_assessment: '',
  key_activities: '',
  market_size_tam: '',
  market_size_sam: '',
  market_size_som: '',
  competitors_list: '',
  go_to_market_strategy: '',
  use_of_funds: '',
  revenue_projections: '',
  runway_months: null,
  trl_level: '',
  rd_activities: '',
  patents_publications: '',
  previous_customers: '',
  letters_of_support: '',
  technology_description: '',
  ip_status: '',
  product_status: '',
  monthly_users: null,
  monthly_revenue: null,
  growth_rate_monthly: null,
  customer_count: null,
  cofounders: '',
  key_team_members: '',
  advisors: '',
  team_background: '',
  previous_grants: '',
}

// Helper types for API responses
export interface ProjectWithRelations {
  id: string
  user_id: string
  name: string
  description: string | null
  industry: string | null
  stage: string | null
  team_size: number | null
  annual_revenue: number | null
  founded_date: string | null
  pitch_deck_url: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
  // Relations
  founders?: Founder[]
  team_members?: TeamMember[]
  budget_items?: BudgetItem[]
  milestones?: Milestone[]
}
