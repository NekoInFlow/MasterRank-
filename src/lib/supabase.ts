import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const PLACEHOLDER_URL = 'https://your-project-id.supabase.co'
const PLACEHOLDER_PROXY = 'https://your-worker.workers.dev'
const PLACEHOLDER_VERCEL_PROXY = 'https://your-domain.vercel.app/api/supabase'

if (
  !supabaseUrl ||
  supabaseUrl === PLACEHOLDER_URL ||
  supabaseUrl === PLACEHOLDER_PROXY ||
  supabaseUrl === PLACEHOLDER_VERCEL_PROXY
) {
  throw new Error(
    '[MasterRank] VITE_SUPABASE_URL is not set. ' +
      'Use your Supabase URL (….supabase.co) or proxy URL (for example /api/supabase on Vercel).',
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error(
    '[MasterRank] VITE_SUPABASE_ANON_KEY is not set. ' +
      'Copy .env.example → .env and fill in your Supabase credentials.',
  )
}

/**
 * Браузер ходит прямо в Supabase (….supabase.co) или через Cloudflare Worker.
 * Через прокси WebSocket Realtime недоступен — в приложении используется HTTP-опрос.
 */
export function masterrankUsesSupabaseProxy(): boolean {
  try {
    const host = new URL(supabaseUrl).hostname.toLowerCase()
    return !host.endsWith('.supabase.co')
  } catch {
    return true
  }
}

/** Интервал опроса лидерборда при прокси (мс). */
export const LEADERBOARD_POLL_MS_WHEN_PROXY = 4_000
/** Списки бейджей/групп в админке при прокси (мс). */
export const ADMIN_LISTS_POLL_MS_WHEN_PROXY = 5_000

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
