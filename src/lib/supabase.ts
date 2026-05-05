import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  throw new Error(
    '[MasterRank] VITE_SUPABASE_URL is not set. ' +
    'Copy .env.example → .env and fill in your Supabase credentials.'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error(
    '[MasterRank] VITE_SUPABASE_ANON_KEY is not set. ' +
    'Copy .env.example → .env and fill in your Supabase credentials.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
