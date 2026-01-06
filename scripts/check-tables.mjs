#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🔍 Detailed table check...\n')

const tablesToCheck = [
  'profiles',
  'projects',
  'funds',
  'applications',
  'user_roles',
  'subscription_history',
  'platform_settings',
  'meeting_types',
  'meeting_pricing',
  'meeting_bookings',
]

for (const table of tablesToCheck) {
  const { data, error } = await supabase.from(table).select('*').limit(1)

  if (error) {
    if (error.code === '42P01') {
      console.log(`❌ ${table}: TABLE DOES NOT EXIST`)
    } else if (error.message.includes('schema cache')) {
      console.log(`⚠️  ${table}: Not in schema cache (may need reload)`)
    } else {
      console.log(`❌ ${table}: ${error.message}`)
    }
  } else {
    console.log(`✅ ${table}: EXISTS (${data?.length || 0} rows)`)
  }
}

// Try to force schema cache reload by making a specific query
console.log('\n📊 Checking via information_schema workaround...')
// We can't query information_schema directly, but we can check the REST API
