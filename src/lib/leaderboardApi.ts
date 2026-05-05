import { withTimeout } from './asyncTimeout'
import type { Database } from './database.types'
import { supabase } from './supabase'
import type { Badge, Student } from './types'

/** Таймаут одного прохода загрузки (два запроса к PostgREST). */
export const FETCH_LEADERBOARD_TIMEOUT_MS = 22_000

type StudentRow = Pick<
  Database['public']['Tables']['students']['Row'],
  'id' | 'name' | 'score' | 'created_at' | 'group_id'
> & {
  student_groups?: { id: string; name: string } | null
}

type JoinRow = {
  student_id: string
  badges: Badge | Badge[] | null
}

/**
 * Студенты с бейджами. Сортировка: score DESC, name ASC (RPD п. 5).
 * Два запроса — без зависимости от имени вложенной связи в PostgREST.
 * Таймаут — чтобы на слабом мобильном интернете не висеть «вечно» на загрузке.
 */
export async function fetchLeaderboard(): Promise<Student[]> {
  return withTimeout(fetchLeaderboardUnchecked(), FETCH_LEADERBOARD_TIMEOUT_MS)
}

async function fetchLeaderboardUnchecked(): Promise<Student[]> {
  const { data: studentRows, error: errStudents } = await supabase
    .from('students')
    .select('id, name, score, created_at, group_id, student_groups ( id, name )')
    .order('score', { ascending: false })
    .order('name', { ascending: true })

  if (errStudents) {
    console.error('[MasterRank]', errStudents)
    throw errStudents
  }

  const students: StudentRow[] = (studentRows ?? []) as StudentRow[]
  if (students.length === 0) return []

  const ids = students.map((s) => s.id)

  const { data: joinRows, error: errJoin } = await supabase
    .from('student_badges')
    .select('student_id, badges ( id, code, title, icon, border_color, created_at )')
    .in('student_id', ids)

  if (errJoin) {
    console.error('[MasterRank]', errJoin)
    throw errJoin
  }

  const badgeByStudent = new Map<string, Badge[]>()

  for (const row of (joinRows ?? []) as JoinRow[]) {
    const raw = row.badges
    const badge = Array.isArray(raw) ? raw[0] : raw
    if (!badge) continue
    const list = badgeByStudent.get(row.student_id) ?? []
    list.push(badge)
    badgeByStudent.set(row.student_id, list)
  }

  return students.map((s) => {
    const embed = s.student_groups
    const g = embed == null ? null : Array.isArray(embed) ? embed[0] ?? null : embed

    return {
      id: s.id,
      name: s.name,
      score: s.score,
      created_at: s.created_at,
      group_id: s.group_id ?? null,
      group: g ? { id: g.id, name: g.name } : null,
      badges: (badgeByStudent.get(s.id) ?? []).sort((a, b) =>
        a.code < b.code ? -1 : a.code > b.code ? 1 : 0,
      ),
    }
  })
}
