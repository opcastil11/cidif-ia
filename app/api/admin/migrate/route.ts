import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Migration SQL for meeting tables
const MEETING_TABLES_MIGRATION = `
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
`

const RLS_POLICIES = `
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
`

const SEED_DATA = `
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
`

export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 32)

  if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
    console.log('[Migrate API] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Migrate API] Starting migration...')
  const results: { step: string; success: boolean; error?: string }[] = []

  try {
    const supabase = createAdminClient()

    // Step 1: Create tables
    console.log('[Migrate API] Creating tables...')
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: MEETING_TABLES_MIGRATION })

    if (tablesError) {
      // Try raw query approach
      const { error: rawError } = await supabase.from('meeting_types').select('id').limit(1)

      if (rawError && rawError.code === '42P01') {
        // Table doesn't exist, we need to run migration via SQL editor
        console.log('[Migrate API] Tables do not exist, migration SQL needed')
        results.push({ step: 'create_tables', success: false, error: 'Table does not exist - run migration SQL in Supabase dashboard' })
      } else if (!rawError) {
        console.log('[Migrate API] Tables already exist')
        results.push({ step: 'create_tables', success: true })
      } else {
        results.push({ step: 'create_tables', success: false, error: rawError.message })
      }
    } else {
      results.push({ step: 'create_tables', success: true })
    }

    // Step 2: Check if tables exist by querying them
    const { data: meetingTypes, error: checkError } = await supabase
      .from('meeting_types')
      .select('id, name')
      .limit(5)

    if (checkError) {
      console.log('[Migrate API] Tables check failed:', checkError.message)
      results.push({ step: 'verify_tables', success: false, error: checkError.message })

      return NextResponse.json({
        success: false,
        message: 'Migration tables do not exist. Please run the SQL migration manually in Supabase dashboard.',
        migration_sql: MEETING_TABLES_MIGRATION + '\n\n' + RLS_POLICIES + '\n\n' + SEED_DATA,
        results
      }, { status: 500 })
    }

    results.push({ step: 'verify_tables', success: true, error: undefined })
    console.log('[Migrate API] Tables exist, found meeting types:', meetingTypes?.length || 0)

    // If tables exist but no data, seed them
    if (!meetingTypes || meetingTypes.length === 0) {
      console.log('[Migrate API] Seeding meeting types...')

      // Insert intro meeting type
      const { error: introError } = await supabase
        .from('meeting_types')
        .upsert({
          name: 'intro',
          description: 'Introductory meeting to learn about our services',
          duration_minutes: 30,
          base_price_usd: 0,
          is_free: true,
          is_active: true
        }, { onConflict: 'name' })

      if (introError) {
        results.push({ step: 'seed_intro', success: false, error: introError.message })
      } else {
        results.push({ step: 'seed_intro', success: true })
      }

      // Insert review meeting type
      const { data: reviewData, error: reviewError } = await supabase
        .from('meeting_types')
        .upsert({
          name: 'review',
          description: 'Complete project review with detailed report',
          duration_minutes: 120,
          base_price_usd: 70,
          is_free: false,
          is_active: true
        }, { onConflict: 'name' })
        .select()

      if (reviewError) {
        results.push({ step: 'seed_review', success: false, error: reviewError.message })
      } else {
        results.push({ step: 'seed_review', success: true })

        // Get review meeting id for pricing
        const { data: reviewType } = await supabase
          .from('meeting_types')
          .select('id')
          .eq('name', 'review')
          .single()

        if (reviewType) {
          // Insert pricing data
          const pricingData = [
            { meeting_type_id: reviewType.id, country_code: 'PE', price_usd: 40 },
            { meeting_type_id: reviewType.id, country_code: 'CL', price_usd: 70 },
            { meeting_type_id: reviewType.id, country_code: 'MX', price_usd: 70 },
            { meeting_type_id: reviewType.id, country_code: 'CO', price_usd: 50 },
            { meeting_type_id: reviewType.id, country_code: 'AR', price_usd: 40 },
            { meeting_type_id: reviewType.id, country_code: 'BR', price_usd: 50 },
            { meeting_type_id: reviewType.id, country_code: 'US', price_usd: 70 },
            { meeting_type_id: reviewType.id, country_code: 'DEFAULT', price_usd: 70 }
          ]

          const { error: pricingError } = await supabase
            .from('meeting_pricing')
            .upsert(pricingData, { onConflict: 'meeting_type_id,country_code' })

          if (pricingError) {
            results.push({ step: 'seed_pricing', success: false, error: pricingError.message })
          } else {
            results.push({ step: 'seed_pricing', success: true })
          }
        }
      }
    } else {
      console.log('[Migrate API] Meeting types already seeded:', meetingTypes.map(t => t.name).join(', '))
      results.push({ step: 'seed_data', success: true, error: 'Data already exists' })
    }

    console.log('[Migrate API] Migration completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      meeting_types: meetingTypes,
      results
    })

  } catch (error) {
    console.error('[Migrate API] Migration failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      migration_sql: MEETING_TABLES_MIGRATION + '\n\n' + RLS_POLICIES + '\n\n' + SEED_DATA,
      results
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to run migrations',
    required_header: 'Authorization: Bearer <ADMIN_SECRET>',
    note: 'ADMIN_SECRET defaults to first 32 chars of SUPABASE_SERVICE_ROLE_KEY'
  })
}
