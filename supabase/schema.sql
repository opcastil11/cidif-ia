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
