import { Loader2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useTeacherAuth } from '../../hooks/useTeacherAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { loading, isTeacher } = useTeacherAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0f0f13] text-slate-300">
        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#191922] px-4 py-2">
          <Loader2 className="size-4 animate-spin text-violet-400" />
          Проверка доступа...
        </div>
      </div>
    )
  }

  if (!isTeacher) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
