import { supabase } from './supabase'
import type { Badge, StudentGroup } from './types'

export async function addStudent(name: string, groupId?: string | null): Promise<void> {
  const normalized = name.trim()
  if (!normalized) {
    throw new Error('Введите имя ученика')
  }

  const payload: Record<string, unknown> = {
    name: normalized,
    score: 0,
  }
  if (groupId != null && groupId !== '') {
    payload.group_id = groupId
  }

  // Типы Supabase на данном этапе частично расходятся с локальной schema-моделью.
  // До генерации актуальных типов используем точечный unsafe-cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('students').insert(payload)

  if (error) {
    throw error
  }
}

export async function removeStudent(studentId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('students').delete().eq('id', studentId)
  if (error) {
    throw error
  }
}

export async function changeStudentScore(
  studentId: string,
  currentScore: number,
  delta: number,
): Promise<void> {
  const nextScore = Math.max(0, currentScore + delta)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('students')
    .update({ score: nextScore })
    .eq('id', studentId)

  if (error) {
    throw error
  }
}

export async function fetchBadgesForAdmin(): Promise<Badge[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('badges')
    .select('id, code, title, icon, border_color, created_at')
    .order('title', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as Badge[]
}

function makeBadgeCode(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'badge'}-${suffix}`
}

export async function createCustomBadge(input: {
  title: string
  icon: string
  borderColor: string
}): Promise<void> {
  const title = input.title.trim()
  const icon = input.icon.trim()
  const borderColor = input.borderColor.trim()

  if (!title) throw new Error('Введите название бейджа')
  if (!icon) throw new Error('Выберите иконку')
  if (!borderColor) throw new Error('Выберите цвет обводки')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('badges').insert({
    code: makeBadgeCode(title),
    title,
    icon,
    border_color: borderColor,
  })

  if (error) {
    throw error
  }
}

export async function assignBadgeToStudent(studentId: string, badgeId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('student_badges').upsert(
    {
      student_id: studentId,
      badge_id: badgeId,
    },
    { onConflict: 'student_id,badge_id', ignoreDuplicates: true },
  )

  if (error) {
    throw error
  }
}

export async function unassignBadgeFromStudent(
  studentId: string,
  badgeId: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('student_badges')
    .delete()
    .eq('student_id', studentId)
    .eq('badge_id', badgeId)

  if (error) {
    throw error
  }
}

export async function fetchGroups(): Promise<StudentGroup[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('student_groups')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as StudentGroup[]
}

export async function createGroup(name: string): Promise<void> {
  const n = name.trim()
  if (!n) {
    throw new Error('Введите название группы')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('student_groups').insert({ name: n })

  if (error) {
    throw error
  }
}

export async function setStudentGroup(studentId: string, groupId: string | null): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('students')
    .update({ group_id: groupId })
    .eq('id', studentId)

  if (error) {
    throw error
  }
}
