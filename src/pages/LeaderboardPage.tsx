import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertCircle, Loader2, Shield } from 'lucide-react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { StudentCard } from '../components/leaderboard/StudentCard'

const RANK_HINT_MS = 1300

export default function LeaderboardPage() {
  const { students, error } = useLeaderboard()
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({})
  const previousRanksRef = useRef<Map<string, number>>(new Map())
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (students == null || students.length === 0) return

    const previous = previousRanksRef.current
    const next = new Map<string, number>()
    const changed: Record<string, number> = {}

    students.forEach((student, idx) => {
      const rank = idx + 1
      next.set(student.id, rank)
      const prevRank = previous.get(student.id)
      if (prevRank != null && prevRank !== rank) {
        changed[student.id] = prevRank - rank
      }
    })

    previousRanksRef.current = next
    setRankChanges(changed)

    if (clearTimerRef.current != null) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }

    if (Object.keys(changed).length > 0) {
      clearTimerRef.current = setTimeout(() => {
        setRankChanges({})
        clearTimerRef.current = null
      }, RANK_HINT_MS)
    }
  }, [students])

  useEffect(() => {
    return () => {
      if (clearTimerRef.current != null) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-svh bg-bg-primary pb-10 text-slate-100">
      <a href="#leaderboard-main" className="skip-link">
        Перейти к содержимому
      </a>
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f0f13]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4 sm:max-w-xl sm:px-5">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">MasterRank</h1>
            <p className="text-sm text-slate-500">Рейтинг учеников · обновляется в реальном времени</p>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1e1e28] px-3 py-2 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-[#262632] hover:text-white"
          >
            <Shield className="size-4 text-violet-400" aria-hidden />
            Учитель
          </Link>
        </div>
      </header>

      <main id="leaderboard-main" className="mx-auto max-w-lg px-4 pt-6 sm:max-w-xl sm:px-5 sm:pt-8">
        <p className="sr-only" aria-live="polite">
          {students == null
            ? 'Рейтинг загружается'
            : `Рейтинг обновлен: ${students.length} записей`}
        </p>
        {error != null && (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            <AlertCircle className="size-5 shrink-0 text-red-400" aria-hidden />
            <p>{error}</p>
          </div>
        )}

        {students === null && error == null && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#17171f] py-20 text-slate-500">
            <Loader2 className="size-9 animate-spin text-violet-500" aria-hidden />
            <span className="text-sm font-medium text-slate-400">Загрузка рейтинга…</span>
          </div>
        )}

        {students !== null && students.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-[#17171f] px-4 py-8 text-center text-slate-400">
            Ученики ещё не добавлены. Зайдите в админку под учителем и создайте записи.
          </p>
        )}

        {students !== null && students.length > 0 && (
          <motion.ol layout className="flex list-none flex-col gap-4" aria-label="Список рейтинга">
            <AnimatePresence initial={false}>
              {students.map((s, idx) => (
                <motion.li
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }}
                >
                  <StudentCard student={s} rank={idx + 1} rankDelta={rankChanges[s.id] ?? 0} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ol>
        )}
      </main>
    </div>
  )
}
