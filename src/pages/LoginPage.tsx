import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/ui/ToastProvider'
import { useTeacherAuth } from '../hooks/useTeacherAuth'
import { supabase } from '../lib/supabase'

const LoginPage = () => {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { loading, isTeacher } = useTeacherAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && isTeacher) {
      navigate('/admin', { replace: true })
    }
  }, [loading, isTeacher, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Неверный email или пароль, либо пользователь не создан в Supabase Auth.')
      notify('Не удалось войти: проверьте email/пароль.', 'error')
      setSubmitting(false)
      return
    }

    const { data, error: roleError } = await supabase.rpc('is_teacher')
    if (roleError || !data) {
      setError('Пользователь вошел, но не имеет роли учителя. Проверь app_teacher.user_id.')
      await supabase.auth.signOut()
      notify('Аккаунт не привязан как teacher (app_teacher).', 'error')
      setSubmitting(false)
      return
    }

    notify('Успешный вход в панель учителя.', 'success')
    setSubmitting(false)
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-svh bg-[#0f0f13] px-4 py-10 text-slate-100">
      <a href="#login-main" className="skip-link">
        Перейти к форме входа
      </a>
      <div id="login-main" className="mx-auto w-full max-w-md">
        <Link to="/" className="mb-5 inline-flex text-sm text-slate-400 transition hover:text-slate-200">
          ← К рейтингу
        </Link>
        <section className="rounded-3xl border border-white/10 bg-[#17171f] p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
              <Shield className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Вход учителя</h1>
              <p className="text-sm text-slate-400">Только авторизованный teacher-аккаунт</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-400">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111118] px-3 py-2.5 text-slate-100 outline-none ring-violet-500/50 transition placeholder:text-slate-500 focus:ring-2"
                placeholder="teacher@example.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-400">Пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#111118] px-3 py-2.5 text-slate-100 outline-none ring-violet-500/50 transition placeholder:text-slate-500 focus:ring-2"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(loading || submitting) && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Войти
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default LoginPage
