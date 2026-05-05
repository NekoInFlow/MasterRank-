import { useEffect, useState } from 'react'
import { TimeoutError, withTimeout } from '../lib/asyncTimeout'
import { supabase } from '../lib/supabase'

const TEACHER_AUTH_TIMEOUT_MS = 16_000

type TeacherAuthState = {
  loading: boolean
  isTeacher: boolean
}

async function resolveTeacherStateInner(): Promise<TeacherAuthState> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { loading: false, isTeacher: false }
  }

  const { data, error } = await supabase.rpc('is_teacher')
  if (error) {
    console.error('[MasterRank] is_teacher() check failed:', error)
    return { loading: false, isTeacher: false }
  }

  return { loading: false, isTeacher: Boolean(data) }
}

async function resolveTeacherState(): Promise<TeacherAuthState> {
  try {
    return await withTimeout(resolveTeacherStateInner(), TEACHER_AUTH_TIMEOUT_MS)
  } catch (e) {
    if (e instanceof TimeoutError) {
      console.warn('[MasterRank] Проверка сессии учителя: таймаут сети')
    }
    return { loading: false, isTeacher: false }
  }
}

export function useTeacherAuth(): TeacherAuthState {
  const [state, setState] = useState<TeacherAuthState>({
    loading: true,
    isTeacher: false,
  })

  useEffect(() => {
    let disposed = false

    const refresh = () => {
      void resolveTeacherState().then((next) => {
        if (!disposed) setState(next)
      })
    }

    refresh()
    const { data } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => refresh())
    })

    return () => {
      disposed = true
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}
