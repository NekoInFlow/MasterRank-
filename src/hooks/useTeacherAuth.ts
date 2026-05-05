import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type TeacherAuthState = {
  loading: boolean
  isTeacher: boolean
}

async function resolveTeacherState(): Promise<TeacherAuthState> {
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
    const { data } = supabase.auth.onAuthStateChange(() => refresh())

    return () => {
      disposed = true
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}
