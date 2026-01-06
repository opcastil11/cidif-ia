#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

console.log('🔍 Verifying migration data...\n')

// Check meeting types
const { data: types, error: typesErr } = await supabase.from('meeting_types').select('*')
console.log('📅 Meeting Types:')
if (typesErr) {
  console.log('  ❌ Error:', typesErr.message)
} else if (types?.length === 0) {
  console.log('  ⚠️  No meeting types found')
} else {
  types.forEach(t => console.log(`  ✅ ${t.name}: ${t.duration_minutes}min, $${t.base_price_usd} (free: ${t.is_free})`))
}

// Check meeting pricing
const { data: pricing, error: pricingErr } = await supabase.from('meeting_pricing').select('*, meeting_types(name)')
console.log('\n💰 Meeting Pricing:')
if (pricingErr) {
  console.log('  ❌ Error:', pricingErr.message)
} else if (pricing?.length === 0) {
  console.log('  ⚠️  No pricing data found')
} else {
  pricing.forEach(p => console.log(`  ✅ ${p.meeting_types?.name || 'unknown'} - ${p.country_code}: $${p.price_usd}`))
}

// Check storage buckets
const { data: buckets } = await supabase.storage.listBuckets()
console.log('\n📦 Storage Buckets:')
buckets?.forEach(b => console.log(`  ✅ ${b.name} (public: ${b.public})`))

// Check subscription_history table structure
const { data: subHist, error: subErr } = await supabase.from('subscription_history').select('*').limit(1)
console.log('\n📜 Subscription History Table:')
if (subErr) {
  console.log('  ❌ Error:', subErr.message)
} else {
  console.log('  ✅ Table accessible')
}

// Check platform_settings
const { data: settings, error: settingsErr } = await supabase.from('platform_settings').select('*')
console.log('\n⚙️ Platform Settings:')
if (settingsErr) {
  console.log('  ❌ Error:', settingsErr.message)
} else if (settings?.length === 0) {
  console.log('  ⚠️  No settings found (expected for new install)')
} else {
  settings.forEach(s => console.log(`  ✅ ${s.key}`))
}

console.log('\n✅ Migration verification complete!')
