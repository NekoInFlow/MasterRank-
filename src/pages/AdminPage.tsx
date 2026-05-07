import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ChevronDown,
  Loader2,
  LogOut,
  Palette,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addStudent,
  assignBadgeToStudent,
  changeStudentScore,
  createCustomBadge,
  createGroup,
  fetchBadgesForAdmin,
  fetchGroups,
  removeStudent,
  setStudentGroup,
  unassignBadgeFromStudent,
} from '../lib/adminApi'
import { BadgeGlyph, BADGE_ICON_OPTIONS } from '../lib/badgeIcons'
import { useToast } from '../components/ui/ToastProvider'
import { useLeaderboard } from '../hooks/useLeaderboard'
import {
  ADMIN_LISTS_POLL_MS_WHEN_PROXY,
  masterrankUsesSupabaseProxy,
  supabase,
} from '../lib/supabase'
import type { Badge, Student, StudentGroup } from '../lib/types'

const AdminPage = () => {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { students, error } = useLeaderboard()
  const [badges, setBadges] = useState<Badge[]>([])
  const [badgesLoading, setBadgesLoading] = useState(true)
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentGroupId, setNewStudentGroupId] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newBadgeTitle, setNewBadgeTitle] = useState('')
  const [newBadgeIcon, setNewBadgeIcon] = useState('Star')
  const [newBadgeBorderColor, setNewBadgeBorderColor] = useState('#6d28d9')
  const [savingStudent, setSavingStudent] = useState(false)
  const [savingBadge, setSavingBadge] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [uiError, setUiError] = useState<string | null>(null)

  const orderedStudents = useMemo(() => students ?? [], [students])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    notify('Вы вышли из аккаунта учителя.', 'info')
    navigate('/login', { replace: true })
  }

  const loadBadges = async () => {
    setBadgesLoading(true)
    try {
      const rows = await fetchBadgesForAdmin()
      setBadges(rows)
    } catch {
      setUiError('Не удалось загрузить бейджи.')
      notify('Ошибка загрузки бейджей.', 'error')
    } finally {
      setBadgesLoading(false)
    }
  }

  const loadGroups = async () => {
    setGroupsLoading(true)
    try {
      const rows = await fetchGroups()
      setGroups(rows)
    } catch {
      setUiError('Не удалось загрузить группы. Если миграция ещё не применена — выполните SQL из supabase/migrations.')
      notify('Ошибка загрузки групп.', 'error')
    } finally {
      setGroupsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBadges()

    if (masterrankUsesSupabaseProxy()) {
      const id = setInterval(() => void loadBadges(), ADMIN_LISTS_POLL_MS_WHEN_PROXY)
      return () => clearInterval(id)
    }

    const channel = supabase
      .channel('masterrank-admin-badges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'badges' },
        () => void loadBadges(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadGroups()

    if (masterrankUsesSupabaseProxy()) {
      const id = setInterval(() => void loadGroups(), ADMIN_LISTS_POLL_MS_WHEN_PROXY)
      return () => clearInterval(id)
    }

    const channel = supabase
      .channel('masterrank-admin-groups')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_groups' },
        () => void loadGroups(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markBusy = (id: string, busy: boolean) => {
    setActionBusy((prev) => {
      if (!busy) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: true }
    })
  }

  const handleAddStudent = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    setUiError(null)
    setSavingStudent(true)
    try {
      await addStudent(newStudentName, newStudentGroupId || null)
      setNewStudentName('')
      setNewStudentGroupId('')
      setNotice('Ученик добавлен.')
      notify('Ученик добавлен.', 'success')
    } catch {
      setUiError('Не удалось добавить ученика. Проверьте права teacher и подключение к Supabase.')
      notify('Не удалось добавить ученика.', 'error')
    } finally {
      setSavingStudent(false)
    }
  }

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    setUiError(null)
    setSavingGroup(true)
    try {
      await createGroup(newGroupName)
      setNewGroupName('')
      setNotice('Группа создана.')
      notify('Группа создана.', 'success')
      await loadGroups()
    } catch {
      setUiError('Не удалось создать группу (возможно, такое имя уже есть).')
      notify('Ошибка создания группы.', 'error')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleScore = async (student: Student, delta: number) => {
    setNotice(null)
    setUiError(null)
    markBusy(`score:${student.id}`, true)
    try {
      await changeStudentScore(student.id, student.score, delta)
      notify(`Балл изменен (${delta > 0 ? '+' : ''}${delta}).`, 'info')
    } catch {
      setUiError('Не удалось обновить балл. Попробуйте снова.')
      notify('Ошибка изменения балла.', 'error')
    } finally {
      markBusy(`score:${student.id}`, false)
    }
  }

  const handleDelete = async (student: Student) => {
    const ok = window.confirm(`Удалить ученика "${student.name}"?`)
    if (!ok) return

    setNotice(null)
    setUiError(null)
    markBusy(`delete:${student.id}`, true)
    try {
      await removeStudent(student.id)
      setNotice(`Ученик "${student.name}" удален.`)
      notify(`Ученик "${student.name}" удален.`, 'success')
    } catch {
      setUiError('Не удалось удалить ученика. Попробуйте снова.')
      notify('Ошибка удаления ученика.', 'error')
    } finally {
      markBusy(`delete:${student.id}`, false)
    }
  }

  const handleCreateBadge = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    setUiError(null)
    setSavingBadge(true)
    try {
      await createCustomBadge({
        title: newBadgeTitle,
        icon: newBadgeIcon,
        borderColor: newBadgeBorderColor,
      })
      setNewBadgeTitle('')
      setNewBadgeIcon('Star')
      setNewBadgeBorderColor('#6d28d9')
      setNotice('Кастомный бейдж добавлен.')
      notify('Кастомный бейдж создан.', 'success')
      await loadBadges()
    } catch {
      setUiError('Не удалось создать бейдж. Проверьте поля и права teacher.')
      notify('Ошибка создания бейджа.', 'error')
    } finally {
      setSavingBadge(false)
    }
  }

  const hasBadge = (student: Student, badgeId: string) =>
    (student.badges ?? []).some((b) => b.id === badgeId)

  const handleToggleBadge = async (student: Student, badge: Badge) => {
    const assigned = hasBadge(student, badge.id)
    const key = `badge:${student.id}:${badge.id}`
    setNotice(null)
    setUiError(null)
    markBusy(key, true)
    try {
      if (assigned) {
        await unassignBadgeFromStudent(student.id, badge.id)
        notify(`Бейдж "${badge.title}" снят.`, 'info')
      } else {
        await assignBadgeToStudent(student.id, badge.id)
        notify(`Бейдж "${badge.title}" назначен.`, 'success')
      }
    } catch {
      setUiError('Не удалось изменить набор бейджей у ученика.')
      notify('Ошибка изменения бейджей.', 'error')
    } finally {
      markBusy(key, false)
    }
  }

  const handleGroupChange = async (student: Student, raw: string) => {
    const nextId = raw === '' ? null : raw
    const prev = student.group_id ?? null
    if (prev === nextId) return

    setNotice(null)
    setUiError(null)
    markBusy(`group:${student.id}`, true)
    try {
      await setStudentGroup(student.id, nextId)
      notify(nextId ? 'Группа обновлена.' : 'Ученик убран из группы.', 'info')
    } catch {
      setUiError('Не удалось обновить группу.')
      notify('Ошибка смены группы.', 'error')
    } finally {
      markBusy(`group:${student.id}`, false)
    }
  }

  const groupSelect = (student: Student) => {
    const busy = actionBusy[`group:${student.id}`] === true
    return (
      <label className="mt-2 block">
        <span className="mb-1 block text-xs text-slate-500">Группа</span>
        <select
          value={student.group_id ?? ''}
          disabled={busy || groupsLoading}
          onChange={(e) => void handleGroupChange(student, e.target.value)}
          aria-label={`Группа для ${student.name}`}
          className="min-h-11 w-full max-w-[16rem] rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-sm text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2 disabled:opacity-60"
        >
          <option value="">Без группы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
    )
  }

  const badgePanel = (student: Student) => {
    const assignedIds = new Set((student.badges ?? []).map((b) => b.id))
    const assignedCount = assignedIds.size

    return (
      <details className="mr-admin-details w-full overflow-hidden rounded-xl border border-white/10 bg-[#14141b]">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
          <span className="truncate">
            Награды · назначено {assignedCount}/{badges.length === 0 ? '—' : badges.length}
          </span>
          <ChevronDown
            aria-hidden
            className="mr-admin-details-chevron size-4 shrink-0 text-slate-400"
          />
        </summary>
        <div className="border-t border-white/10 px-3 py-2">
          {badgesLoading ? (
            <p className="text-xs text-slate-500">Бейджи загружаются...</p>
          ) : badges.length === 0 ? (
            <p className="text-xs text-slate-500">
              Нет бейджей — создайте в конструкторе выше на странице.
            </p>
          ) : (
            <ul
              role="group"
              aria-label={`Управление наградами для ${student.name}`}
              className="max-h-56 space-y-1 overflow-y-auto pr-1"
            >
              {badges.map((badge) => {
                const assigned = hasBadge(student, badge.id)
                const key = `badge:${student.id}:${badge.id}`
                const busy = actionBusy[key] === true
                return (
                  <li key={`${student.id}-${badge.id}`}>
                    <button
                      type="button"
                      onClick={() => void handleToggleBadge(student, badge)}
                      disabled={busy}
                      className={[
                        'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition',
                        assigned ? 'bg-violet-500/15 text-violet-100' : 'bg-[#101016] text-slate-200 hover:bg-[#1f1f2a]',
                        busy ? 'opacity-60' : '',
                      ].join(' ')}
                      style={{ borderColor: badge.border_color || '#3f3f52' }}
                    >
                      <BadgeGlyph iconName={badge.icon} className="size-5 shrink-0 text-violet-300" />
                      <span className="leading-snug break-words">{badge.title}</span>
                      <span className="ml-auto shrink-0 text-xs opacity-75">
                        {assigned ? 'снять' : 'назначить'}
                      </span>
                      {busy ? (
                        <Loader2 className="size-4 shrink-0 animate-spin opacity-75" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </details>
    )
  }

  return (
    <div className="min-h-svh bg-[#0f0f13] px-4 py-10 text-slate-100">
      <a href="#admin-main" className="skip-link">
        Перейти к содержимому
      </a>
      <div
        id="admin-main"
        className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl border border-white/10 bg-[#17171f] p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Панель учителя</h1>
              <p className="text-sm text-slate-400">
                Баллы, группы; награды — в компактном списке ниже каждого ученика.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-[#1f1f2a] px-3 py-2 text-sm text-slate-200 transition hover:bg-[#29293a]"
          >
            <LogOut className="size-4" aria-hidden />
            Выйти
          </button>
        </div>

        <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
          Баллы: +1, +5, -1; группа — выпадающий список. Нажмите строку «Награды», чтобы открыть полный список
          бейджей.
        </p>

        <form onSubmit={handleAddStudent} className="rounded-2xl border border-white/10 bg-[#14141b] p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">Добавить ученика</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="sm:col-span-2 lg:col-span-5">
              <label className="mb-1 block text-xs text-slate-400">ФИО</label>
              <input
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Имя ученика"
                className="w-full rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2"
                maxLength={80}
                required
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <label className="mb-1 block text-xs text-slate-400">Группа (необязательно)</label>
              <select
                value={newStudentGroupId}
                onChange={(e) => setNewStudentGroupId(e.target.value)}
                disabled={groupsLoading}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-sm text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2 disabled:opacity-60"
              >
                <option value="">Без группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={savingStudent}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStudent ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Добавить
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={handleCreateGroup} className="rounded-2xl border border-white/10 bg-[#14141b] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <UsersRound className="size-4 text-emerald-300" aria-hidden />
            Новая учебная группа
          </div>
          <p className="mb-3 text-xs text-slate-500">Например: БД.09.25.1 (имя уникально в проекте)</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Обозначение группы"
              className="w-full rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2"
              maxLength={64}
              required
            />
            <button
              type="submit"
              disabled={savingGroup || groupsLoading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingGroup ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" />}
              Создать группу
            </button>
          </div>
          {groups.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Сейчас в справочнике:{' '}
              <span className="text-slate-400">{groups.map((g) => g.name).join(', ')}</span>
            </p>
          )}
        </form>

        <form
          onSubmit={handleCreateBadge}
          className="rounded-2xl border border-white/10 bg-[#14141b] p-4"
        >
          <p className="mb-2 text-sm text-slate-300">Конструктор кастомного бейджа</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={newBadgeTitle}
              onChange={(e) => setNewBadgeTitle(e.target.value)}
              placeholder="Название бейджа"
              className="w-full rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2"
              maxLength={80}
              required
            />
            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#101016] px-3 py-2">
              <Palette className="size-4 text-violet-300" aria-hidden />
              <input
                type="color"
                value={newBadgeBorderColor}
                onChange={(e) => setNewBadgeBorderColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                title="Цвет обводки"
              />
              <span className="text-xs text-slate-400">{newBadgeBorderColor}</span>
            </label>
            <button
              type="submit"
              disabled={savingBadge}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingBadge ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              Создать бейдж
            </button>
          </div>

          <div className="mt-2">
            <label className="mb-1 block text-xs text-slate-400">Иконка</label>
            <select
              value={newBadgeIcon}
              onChange={(e) => setNewBadgeIcon(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101016] px-3 py-2 text-slate-100 outline-none ring-violet-500/50 transition focus:ring-2"
            >
              {BADGE_ICON_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {(error || uiError) && (
          <p
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {uiError ?? error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
          >
            {notice}
          </p>
        )}

        <section className="rounded-2xl border border-white/10 bg-[#14141b] p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Ученики</h2>
            <span className="text-xs text-slate-500">{orderedStudents.length} записей</span>
          </div>

          {students === null ? (
            <div className="py-8 text-center text-slate-500">Загрузка...</div>
          ) : orderedStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">Список пуст. Добавьте первого ученика.</div>
          ) : (
            <div className="space-y-3">
              {orderedStudents.map((student, idx) => {
                const scoreBusy = actionBusy[`score:${student.id}`] === true
                const deleteBusy = actionBusy[`delete:${student.id}`] === true
                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101016] px-3 py-3"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-100">
                          {idx + 1}. {student.name}
                        </p>
                        <p className="text-sm text-slate-400">Баллы: {student.score}</p>
                        {groupSelect(student)}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 lg:shrink-0">
                        <button
                          type="button"
                          disabled={scoreBusy}
                          onClick={() => handleScore(student, -1)}
                          className="rounded-lg border border-white/10 bg-[#1d1d2a] px-2.5 py-1.5 text-sm text-slate-200 transition hover:bg-[#2a2a3a] disabled:opacity-60"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          disabled={scoreBusy}
                          onClick={() => handleScore(student, 1)}
                          className="rounded-lg border border-white/10 bg-[#1d1d2a] px-2.5 py-1.5 text-sm text-slate-200 transition hover:bg-[#2a2a3a] disabled:opacity-60"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          disabled={scoreBusy}
                          onClick={() => handleScore(student, 5)}
                          className="rounded-lg border border-white/10 bg-[#1d1d2a] px-2.5 py-1.5 text-sm text-slate-200 transition hover:bg-[#2a2a3a] disabled:opacity-60"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => handleDelete(student)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-sm text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                        >
                          {deleteBusy ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="size-3.5" aria-hidden />
                          )}
                          Удалить
                        </button>
                      </div>
                    </div>

                    {badgePanel(student)}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <Link to="/" className="text-sm text-slate-400 transition hover:text-slate-200">
          ← Вернуться к рейтингу
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
