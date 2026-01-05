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
-- Drop policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active meeting types" ON meeting_types;
DROP POLICY IF EXISTS "Admins can manage meeting types" ON meeting_types;
DROP POLICY IF EXISTS "Anyone can view meeting pricing" ON meeting_pricing;
DROP POLICY IF EXISTS "Admins can manage meeting pricing" ON meeting_pricing;
DROP POLICY IF EXISTS "Users can view own bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Users can update own pending bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON meeting_bookings;

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
