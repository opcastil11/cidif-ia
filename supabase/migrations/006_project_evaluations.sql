-- Migration: Add project evaluations table
-- Date: 2026-01-13

-- ======================
-- PROJECT EVALUATIONS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS project_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Overall scores (0-100)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Individual dimension scores (0-100)
  problem_score INTEGER CHECK (problem_score >= 0 AND problem_score <= 100),
  solution_score INTEGER CHECK (solution_score >= 0 AND solution_score <= 100),
  market_score INTEGER CHECK (market_score >= 0 AND market_score <= 100),
  team_score INTEGER CHECK (team_score >= 0 AND team_score <= 100),
  financials_score INTEGER CHECK (financials_score >= 0 AND financials_score <= 100),
  innovation_score INTEGER CHECK (innovation_score >= 0 AND innovation_score <= 100),
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 100),
  execution_score INTEGER CHECK (execution_score >= 0 AND execution_score <= 100),

  -- Feedback
  summary TEXT, -- Overall summary
  strengths TEXT[], -- Array of strengths
  weaknesses TEXT[], -- Array of weaknesses
  recommendations TEXT[], -- Array of actionable recommendations

  -- Detailed feedback by dimension
  problem_feedback TEXT,
  solution_feedback TEXT,
  market_feedback TEXT,
  team_feedback TEXT,
  financials_feedback TEXT,
  innovation_feedback TEXT,
  impact_feedback TEXT,
  execution_feedback TEXT,

  -- Fund-specific evaluation (optional)
  fund_id UUID REFERENCES funds(id) ON DELETE SET NULL,
  fund_fit_score INTEGER CHECK (fund_fit_score >= 0 AND fund_fit_score <= 100),
  fund_fit_feedback TEXT,

  -- Metadata
  evaluation_model TEXT DEFAULT 'gpt-4o', -- AI model used
  tokens_used INTEGER,
  evaluation_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for project_evaluations
ALTER TABLE project_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_evaluations
CREATE POLICY "Users can view evaluations of own projects" ON project_evaluations
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create evaluations for own projects" ON project_evaluations
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete own evaluations" ON project_evaluations
  FOR DELETE USING (user_id = auth.uid());

-- Admins can manage all evaluations
CREATE POLICY "Admins can manage all evaluations" ON project_evaluations
  FOR ALL USING (is_admin());

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_project_evaluations_project_id ON project_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_user_id ON project_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_fund_id ON project_evaluations(fund_id);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_overall_score ON project_evaluations(overall_score);
CREATE INDEX IF NOT EXISTS idx_project_evaluations_created_at ON project_evaluations(created_at DESC);

-- ===================
-- UPDATED_AT TRIGGER
-- ===================
DROP TRIGGER IF EXISTS update_project_evaluations_updated_at ON project_evaluations;
CREATE TRIGGER update_project_evaluations_updated_at
  BEFORE UPDATE ON project_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
