/* eslint-disable react-refresh/only-export-components */
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneClasses: Record<ToastTone, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
}

function toneIcon(tone: ToastTone) {
  if (tone === 'success') return <CheckCircle2 className="size-4 shrink-0" aria-hidden />
  if (tone === 'error') return <TriangleAlert className="size-4 shrink-0" aria-hidden />
  return <Info className="size-4 shrink-0" aria-hidden />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
    const timer = timersRef.current[id]
    if (timer) {
      clearTimeout(timer)
      delete timersRef.current[id]
    }
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      setItems((prev) => [...prev, { id, message, tone }].slice(-4))
      timersRef.current[id] = setTimeout(() => remove(id), 3200)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
        <div className="flex w-full max-w-md flex-col gap-2">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                className={[
                  'pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur-sm',
                  toneClasses[item.tone],
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  {toneIcon(item.tone)}
                  <p className="flex-1">{item.message}</p>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-md p-0.5 text-current/80 transition hover:bg-white/10 hover:text-current"
                    aria-label="Закрыть уведомление"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
