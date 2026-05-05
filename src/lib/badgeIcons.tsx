/* eslint-disable react-refresh/only-export-components */
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BookOpen,
  Crown,
  Flame,
  Gem,
  Medal,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
} from 'lucide-react'

/** Иконки по имени из lucide-react (совпадает с полем badges.icon в БД). Неизвестное имя → Award. */
const MAP: Partial<Record<string, LucideIcon>> = {
  Trophy,
  Medal,
  Star,
  Flame,
  BookOpen,
  Award,
  Crown,
  Gem,
  Target,
  Rocket,
  Sparkles,
}

export const BADGE_ICON_OPTIONS = Object.keys(MAP).sort()

export function BadgeGlyph({
  iconName,
  className,
}: {
  iconName: string
  className?: string
}) {
  const Icon = MAP[iconName] ?? Award
  return (
    <span title={iconName} className="inline-flex shrink-0 items-center justify-center">
      <Icon aria-hidden className={className} />
    </span>
  )
}
