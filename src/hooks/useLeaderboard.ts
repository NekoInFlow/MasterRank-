import { useEffect, useRef, useState } from 'react'
import { TimeoutError } from '../lib/asyncTimeout'
import { fetchLeaderboard } from '../lib/leaderboardApi'
import {
  LEADERBOARD_POLL_MS_WHEN_PROXY,
  masterrankUsesSupabaseProxy,
  supabase,
} from '../lib/supabase'
import type { Student } from '../lib/types'

const REALTIME_DEBOUNCE_MS = 150
const FALLBACK_POLL_MS = 15000

function leaderboardErrorMessage(err: unknown): string {
  if (err instanceof TimeoutError) {
    return 'Сервер не ответил вовремя. Проверьте интернет (Wi‑Fi или мобильную сеть) и обновите страницу.'
  }
  return 'Не удалось загрузить рейтинг. Проверьте сеть и настройку Supabase.'
}

type Result = {
  students: Student[] | null
  error: string | null
}

/**
 * Первоначальная загрузка + подписка на Realtime (таблицы students, badges, student_badges).
 * Если базовый URL — не *.supabase.co (например Cloudflare Worker-прокси), Realtime не используется;
 * рейтинг обновляется опросом по HTTP.
 */
export function useLeaderboard(): Result {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    const clearDebounce = () => {
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }

    const refetchLeaderboard = () => {
      void fetchLeaderboard()
        .then((rows) => {
          if (!cancelled) {
            setStudents(rows)
            setError(null)
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(leaderboardErrorMessage(err))
          }
        })
    }

    const startFallbackPolling = () => {
      if (fallbackPollRef.current != null) {
        return
      }
      // Some networks block Supabase Realtime WebSocket (close code 1006).
      // Fallback keeps leaderboard usable with periodic HTTP refresh.
      fallbackPollRef.current = setInterval(() => {
        refetchLeaderboard()
      }, FALLBACK_POLL_MS)
    }

    const stopFallbackPolling = () => {
      if (fallbackPollRef.current != null) {
        clearInterval(fallbackPollRef.current)
        fallbackPollRef.current = null
      }
    }

    refetchLeaderboard()

    // Cloudflare Worker proxy: HTTPS к Supabase есть, WebSocket Realtime — нет.
    if (masterrankUsesSupabaseProxy()) {
      const pollId = setInterval(refetchLeaderboard, LEADERBOARD_POLL_MS_WHEN_PROXY)
      return () => {
        cancelled = true
        clearInterval(pollId)
      }
    }

    const scheduleRefetch = () => {
      clearDebounce()
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        refetchLeaderboard()
      }, REALTIME_DEBOUNCE_MS)
    }

    const channel = supabase
      .channel('masterrank-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
        },
        scheduleRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'badges',
        },
        scheduleRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_badges',
        },
        scheduleRefetch,
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          stopFallbackPolling()
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[MasterRank] Realtime channel error:', err ?? status)
          startFallbackPolling()
        }
        if (status === 'TIMED_OUT' || status === 'CLOSED') {
          startFallbackPolling()
        }
      })

    return () => {
      cancelled = true
      clearDebounce()
      stopFallbackPolling()
      void supabase.removeChannel(channel)
    }
  }, [])

  return { students, error }
}
