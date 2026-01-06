#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', url)
console.log('Key length:', key?.length)
console.log('Key prefix:', key?.slice(0, 30))

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test query
const { data, error } = await supabase.from('profiles').select('id').limit(1)
console.log('\nTest query result:')
console.log('Data:', data)
console.log('Error:', error)

// Check what tables exist
const { data: tables, error: tablesError } = await supabase.rpc('get_tables')
console.log('\nTables RPC:')
console.log('Data:', tables)
console.log('Error:', tablesError)
