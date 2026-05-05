export interface Badge {
  id: string
  code: string
  title: string
  icon: string
  border_color: string
  created_at: string
}

/** Справочник группы (таблица student_groups). */
export interface StudentGroup {
  id: string
  name: string
  created_at: string
}

/** Укороченная ссылка на группу в составе ученика (для отображения). */
export interface StudentGroupRef {
  id: string
  name: string
}

export interface Student {
  id: string
  name: string
  score: number
  created_at: string
  /** FK в БД; null — ученик без группы. */
  group_id?: string | null
  /** Загружается вместе с лидербордом (embed). */
  group?: StudentGroupRef | null
  badges?: Badge[]
}

export interface StudentBadge {
  student_id: string
  badge_id: string
  assigned_at: string
}
