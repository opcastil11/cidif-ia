-- Migration: Add project founders, team members, budget items, and milestones tables
-- Date: 2026-01-10

-- ======================
-- PROJECT FOUNDERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS project_founders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  equity_percentage DECIMAL(5,2) CHECK (equity_percentage >= 0 AND equity_percentage <= 100),
  linkedin_url TEXT,
  bio TEXT,
  photo_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for project_founders
ALTER TABLE project_founders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_founders
CREATE POLICY "Users can view founders of own projects" ON project_founders
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert founders to own projects" ON project_founders
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update founders of own projects" ON project_founders
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete founders from own projects" ON project_founders
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Admins can manage all founders
CREATE POLICY "Admins can manage all founders" ON project_founders
  FOR ALL USING (is_admin());

-- =========================
-- PROJECT TEAM MEMBERS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  start_date DATE,
  linkedin_url TEXT,
  skills TEXT[], -- Array of skills
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for project_team_members
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_team_members
CREATE POLICY "Users can view team members of own projects" ON project_team_members
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert team members to own projects" ON project_team_members
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update team members of own projects" ON project_team_members
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete team members from own projects" ON project_team_members
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Admins can manage all team members
CREATE POLICY "Admins can manage all team members" ON project_team_members
  FOR ALL USING (is_admin());

-- ==========================
-- PROJECT BUDGET ITEMS TABLE
-- ==========================
CREATE TABLE IF NOT EXISTS project_budget_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'USD',
  justification TEXT,
  timeline_quarter TEXT, -- e.g., 'Q1', 'Q2', 'Q3', 'Q4', 'Q1-Q2', etc.
  is_recurring BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for project_budget_items
ALTER TABLE project_budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_budget_items
CREATE POLICY "Users can view budget items of own projects" ON project_budget_items
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert budget items to own projects" ON project_budget_items
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update budget items of own projects" ON project_budget_items
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete budget items from own projects" ON project_budget_items
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Admins can manage all budget items
CREATE POLICY "Admins can manage all budget items" ON project_budget_items
  FOR ALL USING (is_admin());

-- =========================
-- PROJECT MILESTONES TABLE
-- =========================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
  deliverables TEXT[], -- Array of deliverables
  dependencies UUID[], -- Array of milestone IDs that this depends on
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_milestones
CREATE POLICY "Users can view milestones of own projects" ON project_milestones
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert milestones to own projects" ON project_milestones
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update milestones of own projects" ON project_milestones
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete milestones from own projects" ON project_milestones
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Admins can manage all milestones
CREATE POLICY "Admins can manage all milestones" ON project_milestones
  FOR ALL USING (is_admin());

-- ====================
-- PROJECT DRAFTS TABLE
-- ====================
-- For auto-save functionality
CREATE TABLE IF NOT EXISTS project_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  wizard_step INTEGER DEFAULT 1,
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS for project_drafts
ALTER TABLE project_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_drafts
CREATE POLICY "Users can manage own drafts" ON project_drafts
  FOR ALL USING (user_id = auth.uid());

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_project_founders_project_id ON project_founders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_founders_order ON project_founders(project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_order ON project_team_members(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_team_members_active ON project_team_members(project_id, is_active);

CREATE INDEX IF NOT EXISTS idx_project_budget_items_project_id ON project_budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budget_items_category ON project_budget_items(project_id, category);
CREATE INDEX IF NOT EXISTS idx_project_budget_items_order ON project_budget_items(project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON project_milestones(project_id, target_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_order ON project_milestones(project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_project_drafts_user_id ON project_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_project_drafts_expires ON project_drafts(expires_at);

-- ===================
-- UPDATED_AT TRIGGERS
-- ===================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_founders_updated_at ON project_founders;
CREATE TRIGGER update_project_founders_updated_at
  BEFORE UPDATE ON project_founders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_team_members_updated_at ON project_team_members;
CREATE TRIGGER update_project_team_members_updated_at
  BEFORE UPDATE ON project_team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_budget_items_updated_at ON project_budget_items;
CREATE TRIGGER update_project_budget_items_updated_at
  BEFORE UPDATE ON project_budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_milestones_updated_at ON project_milestones;
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_saved_at for drafts
DROP TRIGGER IF EXISTS update_project_drafts_last_saved ON project_drafts;
CREATE TRIGGER update_project_drafts_last_saved
  BEFORE UPDATE ON project_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired drafts (run periodically via cron job or pg_cron)
-- DELETE FROM project_drafts WHERE expires_at < NOW();
