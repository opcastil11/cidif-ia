#!/usr/bin/env node
import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Build connection string from Supabase URL
// Supabase connection format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

if (!SUPABASE_URL) {
  console.error('Missing SUPABASE_URL')
  process.exit(1)
}

// Extract project ref from URL: https://[project-ref].supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
console.log('Project ref:', projectRef)

// Check for direct database connection string or password
const DATABASE_URL = process.env.DATABASE_URL ||
  (SUPABASE_DB_PASSWORD ? `postgresql://postgres.${projectRef}:${SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` : null)

if (!DATABASE_URL) {
  console.log('\n⚠️  No DATABASE_URL or SUPABASE_DB_PASSWORD found.')
  console.log('\nTo run migrations directly, you need either:')
  console.log('1. Set DATABASE_URL environment variable with your Supabase pooler connection string')
  console.log('2. Set SUPABASE_DB_PASSWORD with your database password')
  console.log('\nYou can find this in Supabase Dashboard > Project Settings > Database > Connection string')
  console.log('\nAlternatively, run migrations manually in Supabase SQL Editor:')
  console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('\nMigration files location: supabase/migrations/')

  // Output combined migration SQL
  console.log('\n=== Combined Migration SQL ===\n')
  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    console.log(`-- ======================================`)
    console.log(`-- ${file}`)
    console.log(`-- ======================================`)
    console.log(sql)
    console.log('')
  }

  process.exit(0)
}

console.log('Connecting to database...')

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function runMigrations() {
  try {
    await client.connect()
    console.log('Connected to database!\n')

    // Get migration files
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')
    const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    console.log('Found migrations:', files.join(', '))
    console.log('')

    for (const file of files) {
      console.log(`\n=== Running ${file} ===`)
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')

      try {
        await client.query(sql)
        console.log(`✅ ${file} completed successfully`)
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⚠️  ${file} - Some objects already exist (skipped)`)
        } else {
          console.error(`❌ ${file} - Error: ${err.message}`)
        }
      }
    }

    console.log('\n=== All migrations processed ===')

  } catch (err) {
    console.error('Database connection error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
