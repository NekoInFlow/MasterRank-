import { useEffect, useRef, useState } from 'react'
import { fetchLeaderboard } from '../lib/leaderboardApi'
import { supabase } from '../lib/supabase'
import type { Student } from '../lib/types'

const REALTIME_DEBOUNCE_MS = 150

type Result = {
  students: Student[] | null
  error: string | null
}

/**
 * Первоначальная загрузка + подписка на Realtime изменения таблиц
 * students и student_badges (пункт дорожной карты 7). При любом событии — refetch с debounce.
 */
export function useLeaderboard(): Result {
  const [students, setStudents] = useState<Student[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    const clearDebounce = () => {
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }

    void fetchLeaderboard()
      .then((rows) => {
        if (!cancelled) {
          setStudents(rows)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            'Не удалось загрузить рейтинг. Проверьте сеть и настройку Supabase.',
          )
        }
      })

    const scheduleRefetch = () => {
      clearDebounce()
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        void fetchLeaderboard()
          .then((rows) => {
            if (!cancelled) {
              setStudents(rows)
              setError(null)
            }
          })
          .catch(() => {
            if (!cancelled) {
              console.error('[MasterRank] Realtime refetch leaderboard failed')
            }
          })
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
        if (status === 'CHANNEL_ERROR') {
          console.error('[MasterRank] Realtime channel error:', err ?? status)
        }
      })

    return () => {
      cancelled = true
      clearDebounce()
      void supabase.removeChannel(channel)
    }
  }, [])

  return { students, error }
}
