-- CIDIF.TECH Database Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  rut_empresa TEXT,
  country TEXT DEFAULT 'CL',
  phone TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,
  team_size INTEGER,
  annual_revenue DECIMAL,
  founded_date DATE,
  pitch_deck_url TEXT,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}',
  -- Company/Organization Info
  legal_name TEXT,
  tax_id TEXT,
  legal_entity_type TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  -- Contact Info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_position TEXT,
  -- Online Presence
  website_url TEXT,
  linkedin_url TEXT,
  social_media JSONB DEFAULT '{}',
  -- Business Info
  problem_statement TEXT,
  target_market TEXT,
  value_proposition TEXT,
  business_model TEXT,
  competitive_advantages TEXT,
  -- Financial Info
  monthly_burn_rate DECIMAL,
  funding_received DECIMAL,
  funding_seeking DECIMAL,
  -- Product/Technology Info
  technology_description TEXT,
  ip_status TEXT,
  product_status TEXT,
  -- Metrics
  monthly_users INTEGER,
  monthly_revenue DECIMAL,
  growth_rate_monthly DECIMAL,
  customer_count INTEGER,
  -- Team Info
  cofounders TEXT,
  key_team_members TEXT,
  advisors TEXT,
  team_background TEXT,
  previous_grants TEXT,
  -- Impact & Objectives (Grant-specific)
  project_objectives TEXT,
  expected_impact TEXT,
  sdg_alignment TEXT,
  environmental_impact TEXT,
  social_impact TEXT,
  -- Implementation (Grant-specific)
  timeline_milestones TEXT,
  risk_assessment TEXT,
  key_activities TEXT,
  -- Market (Grant-specific)
  market_size_tam TEXT,
  market_size_sam TEXT,
  market_size_som TEXT,
  competitors_list TEXT,
  go_to_market_strategy TEXT,
  -- Financial (Grant-specific)
  use_of_funds TEXT,
  revenue_projections TEXT,
  runway_months INTEGER,
  -- Technical (Grant-specific)
  trl_level TEXT,
  rd_activities TEXT,
  patents_publications TEXT,
  -- References (Grant-specific)
  previous_customers TEXT,
  letters_of_support TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add new columns to existing projects table
-- Run these if the table already exists
DO $$
BEGIN
  -- Company/Organization Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'legal_name') THEN
    ALTER TABLE projects ADD COLUMN legal_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tax_id') THEN
    ALTER TABLE projects ADD COLUMN tax_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'legal_entity_type') THEN
    ALTER TABLE projects ADD COLUMN legal_entity_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'country') THEN
    ALTER TABLE projects ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'city') THEN
    ALTER TABLE projects ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'address') THEN
    ALTER TABLE projects ADD COLUMN address TEXT;
  END IF;
  -- Contact Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_name') THEN
    ALTER TABLE projects ADD COLUMN contact_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_email') THEN
    ALTER TABLE projects ADD COLUMN contact_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_phone') THEN
    ALTER TABLE projects ADD COLUMN contact_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_position') THEN
    ALTER TABLE projects ADD COLUMN contact_position TEXT;
  END IF;
  -- Online Presence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'website_url') THEN
    ALTER TABLE projects ADD COLUMN website_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'linkedin_url') THEN
    ALTER TABLE projects ADD COLUMN linkedin_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'social_media') THEN
    ALTER TABLE projects ADD COLUMN social_media JSONB DEFAULT '{}';
  END IF;
  -- Business Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'problem_statement') THEN
    ALTER TABLE projects ADD COLUMN problem_statement TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'target_market') THEN
    ALTER TABLE projects ADD COLUMN target_market TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'value_proposition') THEN
    ALTER TABLE projects ADD COLUMN value_proposition TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'business_model') THEN
    ALTER TABLE projects ADD COLUMN business_model TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'competitive_advantages') THEN
    ALTER TABLE projects ADD COLUMN competitive_advantages TEXT;
  END IF;
  -- Financial Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'monthly_burn_rate') THEN
    ALTER TABLE projects ADD COLUMN monthly_burn_rate DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'funding_received') THEN
    ALTER TABLE projects ADD COLUMN funding_received DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'funding_seeking') THEN
    ALTER TABLE projects ADD COLUMN funding_seeking DECIMAL;
  END IF;
  -- Product/Technology Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'technology_description') THEN
    ALTER TABLE projects ADD COLUMN technology_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'ip_status') THEN
    ALTER TABLE projects ADD COLUMN ip_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'product_status') THEN
    ALTER TABLE projects ADD COLUMN product_status TEXT;
  END IF;
  -- Metrics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'monthly_users') THEN
    ALTER TABLE projects ADD COLUMN monthly_users INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'monthly_revenue') THEN
    ALTER TABLE projects ADD COLUMN monthly_revenue DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'growth_rate_monthly') THEN
    ALTER TABLE projects ADD COLUMN growth_rate_monthly DECIMAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'customer_count') THEN
    ALTER TABLE projects ADD COLUMN customer_count INTEGER;
  END IF;
  -- Team Info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'cofounders') THEN
    ALTER TABLE projects ADD COLUMN cofounders TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'key_team_members') THEN
    ALTER TABLE projects ADD COLUMN key_team_members TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'advisors') THEN
    ALTER TABLE projects ADD COLUMN advisors TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_background') THEN
    ALTER TABLE projects ADD COLUMN team_background TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'previous_grants') THEN
    ALTER TABLE projects ADD COLUMN previous_grants TEXT;
  END IF;
  -- Impact & Objectives (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_objectives') THEN
    ALTER TABLE projects ADD COLUMN project_objectives TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'expected_impact') THEN
    ALTER TABLE projects ADD COLUMN expected_impact TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sdg_alignment') THEN
    ALTER TABLE projects ADD COLUMN sdg_alignment TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'environmental_impact') THEN
    ALTER TABLE projects ADD COLUMN environmental_impact TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'social_impact') THEN
    ALTER TABLE projects ADD COLUMN social_impact TEXT;
  END IF;
  -- Implementation (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'timeline_milestones') THEN
    ALTER TABLE projects ADD COLUMN timeline_milestones TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'risk_assessment') THEN
    ALTER TABLE projects ADD COLUMN risk_assessment TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'key_activities') THEN
    ALTER TABLE projects ADD COLUMN key_activities TEXT;
  END IF;
  -- Market (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'market_size_tam') THEN
    ALTER TABLE projects ADD COLUMN market_size_tam TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'market_size_sam') THEN
    ALTER TABLE projects ADD COLUMN market_size_sam TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'market_size_som') THEN
    ALTER TABLE projects ADD COLUMN market_size_som TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'competitors_list') THEN
    ALTER TABLE projects ADD COLUMN competitors_list TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'go_to_market_strategy') THEN
    ALTER TABLE projects ADD COLUMN go_to_market_strategy TEXT;
  END IF;
  -- Financial (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'use_of_funds') THEN
    ALTER TABLE projects ADD COLUMN use_of_funds TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'revenue_projections') THEN
    ALTER TABLE projects ADD COLUMN revenue_projections TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'runway_months') THEN
    ALTER TABLE projects ADD COLUMN runway_months INTEGER;
  END IF;
  -- Technical (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'trl_level') THEN
    ALTER TABLE projects ADD COLUMN trl_level TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'rd_activities') THEN
    ALTER TABLE projects ADD COLUMN rd_activities TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'patents_publications') THEN
    ALTER TABLE projects ADD COLUMN patents_publications TEXT;
  END IF;
  -- References (Grant-specific)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'previous_customers') THEN
    ALTER TABLE projects ADD COLUMN previous_customers TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'letters_of_support') THEN
    ALTER TABLE projects ADD COLUMN letters_of_support TEXT;
  END IF;
END $$;

-- Funds catalog
CREATE TABLE IF NOT EXISTS funds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  country TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_min DECIMAL,
  amount_max DECIMAL,
  currency TEXT DEFAULT 'USD',
  deadline DATE,
  requirements JSONB DEFAULT '{}',
  eligibility JSONB DEFAULT '{}',
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id),
  status TEXT DEFAULT 'draft',
  progress INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  result_at TIMESTAMPTZ,
  amount_requested DECIMAL,
  amount_awarded DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application sections
CREATE TABLE IF NOT EXISTS application_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  section_name TEXT NOT NULL,
  content TEXT,
  ai_suggestions TEXT,
  is_complete BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own applications" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sections" ON application_sections FOR ALL 
  USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can view active funds" ON funds FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin helper function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Meeting Types (configurable pricing)
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price_usd DECIMAL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Country-specific meeting pricing
CREATE TABLE IF NOT EXISTS meeting_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  price_usd DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_type_id, country_code)
);

-- Meeting bookings
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  price_usd DECIMAL DEFAULT 0,
  country_code TEXT,
  notes TEXT,
  admin_notes TEXT,
  report_url TEXT,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for meeting tables
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting tables
CREATE POLICY "Anyone can view active meeting types" ON meeting_types FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage meeting types" ON meeting_types FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view meeting pricing" ON meeting_pricing FOR SELECT USING (true);
CREATE POLICY "Admins can manage meeting pricing" ON meeting_pricing FOR ALL USING (is_admin());

CREATE POLICY "Users can view own bookings" ON meeting_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON meeting_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending bookings" ON meeting_bookings FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage all bookings" ON meeting_bookings FOR ALL USING (is_admin());

-- Insert default meeting types
INSERT INTO meeting_types (name, description, duration_minutes, base_price_usd, is_free) VALUES
  ('intro', 'Introductory meeting to learn about our services', 30, 0, true),
  ('review', 'Complete project review with detailed report', 120, 70, false)
ON CONFLICT DO NOTHING;

-- Insert default country pricing for review meeting
-- Get the review meeting type id and insert pricing
DO $$
DECLARE
  review_id UUID;
BEGIN
  SELECT id INTO review_id FROM meeting_types WHERE name = 'review' LIMIT 1;
  IF review_id IS NOT NULL THEN
    INSERT INTO meeting_pricing (meeting_type_id, country_code, price_usd) VALUES
      (review_id, 'PE', 40),
      (review_id, 'CL', 70),
      (review_id, 'MX', 70),
      (review_id, 'CO', 50),
      (review_id, 'AR', 40),
      (review_id, 'BR', 50),
      (review_id, 'US', 70),
      (review_id, 'DEFAULT', 70)
    ON CONFLICT (meeting_type_id, country_code) DO UPDATE SET price_usd = EXCLUDED.price_usd;
  END IF;
END $$;
