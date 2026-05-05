import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Student } from '../../lib/types'
import { BadgeGlyph } from '../../lib/badgeIcons'

type PodiumTone = 'gold' | 'silver' | 'bronze' | 'default'

function toneForRank(rank: number): PodiumTone {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'default'
}

const shell: Record<PodiumTone, string> = {
  gold: [
    'border-amber-500/70',
    'bg-gradient-to-br from-amber-500/22 via-transparent to-transparent',
    'shadow-[0_0_48px_-8px_rgba(245,158,11,0.35)]',
  ].join(' '),
  silver: [
    'border-slate-400/65',
    'bg-gradient-to-br from-slate-400/16 via-transparent to-transparent',
    'shadow-[0_0_44px_-10px_rgba(148,163,184,0.35)]',
  ].join(' '),
  bronze: [
    'border-orange-700/70',
    'bg-gradient-to-br from-orange-700/25 via-transparent to-transparent',
    'shadow-[0_0_42px_-10px_rgba(180,83,9,0.35)]',
  ].join(' '),
  default: 'border-[#2d2d3d] bg-[#1a1a22] shadow-none',
}

const rankBadgeClass: Record<PodiumTone, string> = {
  gold: 'bg-amber-500/95 text-neutral-950 font-extrabold',
  silver: 'bg-slate-300 text-neutral-950 font-extrabold',
  bronze: 'bg-orange-700 text-amber-100 font-extrabold',
  default: 'bg-[#2a2a36] text-slate-200 font-semibold',
}

interface StudentCardProps {
  student: Student
  rank: number
  rankDelta?: number
}

export function StudentCard({ student, rank, rankDelta = 0 }: StudentCardProps) {
  const tone = toneForRank(rank)
  const movedUp = rankDelta > 0
  const movedDown = rankDelta < 0

  return (
    <motion.article
      layout
      transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.85 }}
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: rankDelta === 0 ? 1 : 1.015,
      }}
      data-rank={rank}
      aria-label={`${rank} место, ${student.name}, ${student.score} баллов`}
      className={[
        'rounded-2xl border px-4 py-4 transition-[transform,border-color] sm:px-5',
        rankDelta !== 0 ? 'ring-1 ring-violet-400/35' : '',
        shell[tone],
      ].join(' ')}
    >
      <div className="flex gap-4">
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg sm:h-14 sm:w-14 sm:text-xl',
            rankBadgeClass[tone],
          ].join(' ')}
          aria-hidden
        >
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
                  {student.name}
                </h2>
                {movedUp && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold text-emerald-300"
                    title={`Поднялся на ${rankDelta} поз.`}
                  >
                    <ArrowUp className="size-3.5" aria-hidden />
                    {rankDelta}
                  </span>
                )}
                {movedDown && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-1.5 py-0.5 text-xs font-semibold text-rose-300"
                    title={`Опустился на ${Math.abs(rankDelta)} поз.`}
                  >
                    <ArrowDown className="size-3.5" aria-hidden />
                    {Math.abs(rankDelta)}
                  </span>
                )}
              </div>
              {student.group?.name ? (
                <p className="truncate text-xs font-medium text-slate-500">{student.group.name}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-lg font-bold tabular-nums text-violet-300 sm:text-xl">
              {student.score}
              <span className="ml-1 text-sm font-medium text-slate-500">б.</span>
            </p>
          </div>
          <div className="mt-3 flex min-h-[1.75rem] flex-wrap gap-2">
            {(student.badges?.length ?? 0) === 0 ? (
              <span className="text-sm text-slate-500">Нет бейджей</span>
            ) : (
              student.badges?.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-[#252530] px-2.5 py-1 text-sm text-slate-200"
                  title={b.title}
                  style={{ borderColor: b.border_color || '#3f3f52' }}
                >
                  <BadgeGlyph iconName={b.icon} className="size-4 text-violet-400" />
                  <span className="max-w-[10rem] truncate">{b.title}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
