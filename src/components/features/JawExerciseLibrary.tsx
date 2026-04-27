import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Exercise = {
  id: string
  name: string
  duration: number // seconds per set
  sets: number
  cue: string
  benefit: string
  illustration: React.ReactNode
}

function ChinTuckSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="30" ry="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="48" y="54" width="24" height="10" rx="5" fill="#06b6d4" opacity="0.7" />
      </motion.g>
      <line x1="60" y1="12" x2="60" y2="68" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  )
}

function SideStretchSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="30" ry="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.ellipse
        cx="60"
        cy="60"
        rx="10"
        ry="7"
        fill="#f59e0b"
        opacity="0.7"
        animate={{ cx: [60, 72, 60, 48, 60] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function TongueSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="30" ry="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.path
        d="M48 56 Q60 44 72 56"
        fill="none"
        stroke="#ef4444"
        strokeWidth="4"
        strokeLinecap="round"
        animate={{ d: ['M48 56 Q60 44 72 56', 'M48 52 Q60 40 72 52', 'M48 56 Q60 44 72 56'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function JawDropSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="36" r="24" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.ellipse
        cx="60"
        cy="75"
        rx="20"
        ry="12"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="2"
        animate={{ cy: [75, 88, 75], ry: [12, 16, 12] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.rect
        x="50"
        y="56"
        width="20"
        height="4"
        rx="2"
        fill="#10b981"
        opacity="0.7"
        animate={{ y: [56, 68, 56] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

function ResistanceSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="36" r="24" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="78" rx="22" ry="14" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      {/* Fist */}
      <motion.rect
        x="46"
        y="88"
        width="28"
        height="14"
        rx="7"
        fill="#6366f1"
        opacity="0.8"
        animate={{ y: [88, 84, 88] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M52 78 Q60 72 68 78"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="3"
        animate={{ d: ['M52 78 Q60 72 68 78', 'M52 82 Q60 76 68 82', 'M52 78 Q60 72 68 78'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

const EXERCISES: Exercise[] = [
  {
    id: 'chin-tuck',
    name: 'Chin tuck',
    duration: 30,
    sets: 3,
    cue: 'Pull your chin straight back, creating a "double chin". Hold for 5 seconds, release, repeat.',
    benefit: 'Strengthens neck flexors and helps align the cervical spine with your jaw.',
    illustration: <ChinTuckSvg />,
  },
  {
    id: 'side-stretch',
    name: 'Side jaw stretch',
    duration: 40,
    sets: 3,
    cue: 'Open your mouth slightly. Slowly move the lower jaw left, hold 3 s, then right. Keep it smooth.',
    benefit: 'Improves lateral mobility and can reduce tension from asymmetric muscle use.',
    illustration: <SideStretchSvg />,
  },
  {
    id: 'tongue-press',
    name: 'Tongue press',
    duration: 30,
    sets: 3,
    cue: 'Press the tip of your tongue firmly against the roof of your mouth. Hold 10 seconds, repeat.',
    benefit: 'Builds the tongue muscles that support your airway and jaw resting posture.',
    illustration: <TongueSvg />,
  },
  {
    id: 'jaw-drop',
    name: 'Controlled jaw drop',
    duration: 45,
    sets: 3,
    cue: 'Open your mouth as wide as comfortable — no pain — then close slowly. Take 4 seconds each way.',
    benefit: 'Maintains full range of motion and loosens tight masseter muscles.',
    illustration: <JawDropSvg />,
  },
  {
    id: 'resistance-hold',
    name: 'Resistance hold',
    duration: 30,
    sets: 3,
    cue: 'Place a fist under your chin. Open your mouth gently against the resistance. Hold 5 s, release.',
    benefit: 'Strengthens the muscles that open the jaw against load, improving symmetry.',
    illustration: <ResistanceSvg />,
  },
]

function ExerciseTimer({
  duration,
  sets,
  onClose,
}: {
  duration: number
  sets: number
  onClose: () => void
}) {
  const [currentSet, setCurrentSet] = useState(1)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (currentSet < sets) {
              setCurrentSet((s) => s + 1)
              return duration
            }
            setRunning(false)
            setDone(true)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, currentSet, sets, duration])

  const toggle = () => setRunning((v) => !v)
  const reset = () => {
    setRunning(false)
    setCurrentSet(1)
    setTimeLeft(duration)
    setDone(false)
  }

  const pct = ((duration - timeLeft) / duration) * 100

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-slate-200 bg-white p-5">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <div className="font-semibold text-slate-900">Set complete!</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Again
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Set {currentSet} of {sets}
            </span>
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {timeLeft}s
            </span>
          </div>

          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-cyan-500"
              style={{ width: `${pct}%` }}
              transition={{ duration: 0.9 }}
            />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={toggle}>
              {running ? (
                <><Pause className="h-4 w-4" /> Pause</>
              ) : (
                <><Play className="h-4 w-4" /> {timeLeft === duration ? 'Start' : 'Resume'}</>
              )}
            </Button>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function JawExerciseLibrary() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const start = (id: string) => {
    setActiveId(id)
    setTimerKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-slate-500">
        These exercises support jaw mobility and muscle balance. Do them gently — skip or stop if
        you feel pain. Not a replacement for professional care.
      </p>

      {EXERCISES.map((ex) => {
        const isActive = activeId === ex.id

        return (
          <div
            key={ex.id}
            className={cn(
              'overflow-hidden rounded-[1.5rem] border transition-colors',
              isActive ? 'border-cyan-200 bg-cyan-50/50' : 'border-slate-200 bg-white',
            )}
          >
            <button
              type="button"
              className="flex w-full items-start gap-4 p-5 text-left"
              onClick={() => setActiveId(isActive ? null : ex.id)}
            >
              <div className="shrink-0">{ex.illustration}</div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">{ex.name}</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{ex.cue}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    {ex.duration}s × {ex.sets} sets
                  </span>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs text-cyan-700">
                    {ex.benefit}
                  </span>
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  key="timer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden px-5 pb-5"
                >
                  <ExerciseTimer
                    key={timerKey}
                    duration={ex.duration}
                    sets={ex.sets}
                    onClose={() => {
                      setActiveId(null)
                      start(ex.id)
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
