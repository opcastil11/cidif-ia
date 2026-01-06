#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Get credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('Supabase URL:', SUPABASE_URL.slice(0, 30) + '...')
console.log('Service Key:', SUPABASE_SERVICE_KEY.slice(0, 20) + '...')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Get migration files
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')
const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

console.log('\nFound migrations:', files.join(', '))
console.log('')

// Run each migration
for (const file of files) {
  console.log(`\n=== Running ${file} ===`)
  const sql = readFileSync(join(migrationsDir, file), 'utf-8')

  // Split by semicolons and run each statement
  // But be careful with $$ blocks
  const statements = []
  let current = ''
  let inBlock = false

  for (const line of sql.split('\n')) {
    const trimmed = line.trim()

    // Skip comments
    if (trimmed.startsWith('--') && !inBlock) {
      continue
    }

    current += line + '\n'

    // Check for $$ blocks (functions, DO blocks)
    if (trimmed.includes('$$')) {
      inBlock = !inBlock
    }

    // If we hit a semicolon and not in a block, it's a statement
    if (trimmed.endsWith(';') && !inBlock) {
      const stmt = current.trim()
      if (stmt.length > 0 && stmt !== ';') {
        statements.push(stmt)
      }
      current = ''
    }
  }

  // Add any remaining content
  if (current.trim()) {
    statements.push(current.trim())
  }

  console.log(`Found ${statements.length} statements`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
    console.log(`[${i + 1}/${statements.length}] ${preview}...`)

    try {
      // Try using rpc exec_sql first
      const { error } = await supabase.rpc('exec_sql', { sql: stmt })

      if (error) {
        // If exec_sql doesn't exist, try direct query approach
        if (error.code === 'PGRST202') {
          console.log('  Note: exec_sql not available, statement will need to be run manually')
          console.log('  SQL:', stmt.slice(0, 100) + '...')
        } else {
          console.error(`  Error: ${error.message}`)
        }
      } else {
        console.log('  OK')
      }
    } catch (err) {
      console.error(`  Exception: ${err.message}`)
    }
  }
}

console.log('\n=== Migration complete ===')
console.log('\nNote: If exec_sql is not available, you may need to run migrations manually in the Supabase SQL Editor.')
console.log('Migration files are in: supabase/migrations/')
