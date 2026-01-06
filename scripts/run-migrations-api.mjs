#!/usr/bin/env node
/**
 * Migration runner that uses Supabase client to execute migrations
 * Since we can't execute raw SQL via REST API, this script will:
 * 1. Check which tables already exist
 * 2. Create missing tables by using insert/upsert operations where possible
 * 3. Output SQL that needs to be run manually in Supabase SQL Editor
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(0)
  return !error || error.code !== '42P01'
}

async function runMigrations() {
  console.log('🔍 Checking existing database state...\n')

  // Check which tables exist
  const tables = {
    'profiles': await checkTable('profiles'),
    'projects': await checkTable('projects'),
    'funds': await checkTable('funds'),
    'applications': await checkTable('applications'),
    'user_roles': await checkTable('user_roles'),
    'subscription_history': await checkTable('subscription_history'),
    'platform_settings': await checkTable('platform_settings'),
    'meeting_types': await checkTable('meeting_types'),
    'meeting_pricing': await checkTable('meeting_pricing'),
    'meeting_bookings': await checkTable('meeting_bookings'),
  }

  console.log('📊 Table status:')
  for (const [table, exists] of Object.entries(tables)) {
    console.log(`  ${exists ? '✅' : '❌'} ${table}`)
  }

  // Check storage buckets
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketNames = buckets?.map(b => b.name) || []
  console.log('\n📦 Storage buckets:', bucketNames.join(', ') || 'none')

  // Generate list of needed migrations
  const needed = []

  // Migration 001: Stripe fields
  const { data: profileCols } = await supabase.from('profiles').select('stripe_customer_id').limit(0)
  if (profileCols === null) {
    needed.push('001_add_stripe_fields.sql')
  }

  // Migration 002: Platform settings
  if (!tables['platform_settings']) {
    needed.push('002_platform_settings.sql')
  }

  // Migration 003: Storage buckets
  if (!bucketNames.includes('project-documents') || !bucketNames.includes('avatars')) {
    needed.push('003_storage_buckets.sql')
  }

  // Migration 004: Meeting tables
  if (!tables['meeting_types'] || !tables['meeting_pricing'] || !tables['meeting_bookings']) {
    needed.push('004_meeting_tables.sql')
  }

  if (needed.length === 0) {
    console.log('\n✅ All migrations have been applied!')
    return
  }

  console.log('\n⚠️  The following migrations need to be applied:')
  for (const m of needed) {
    console.log(`  - ${m}`)
  }

  // Output combined SQL
  const projectRef = url.replace('https://', '').split('.')[0]
  console.log('\n' + '='.repeat(60))
  console.log('📝 Copy and paste the SQL below into Supabase SQL Editor:')
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  console.log('='.repeat(60) + '\n')

  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')

  for (const file of needed) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    console.log(`-- ==========================================`)
    console.log(`-- ${file}`)
    console.log(`-- ==========================================`)
    console.log(sql)
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('After running the SQL, execute this script again to verify.')
  console.log('='.repeat(60))
}

runMigrations().catch(console.error)
