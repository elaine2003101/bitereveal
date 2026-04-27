import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScoreSummary } from '@/types'

type ExerciseFocus = 'symmetry' | 'wear' | 'crowding'

type Exercise = {
  id: string
  name: string
  duration: number
  sets: number
  cue: string
  benefit: string
  focus: ExerciseFocus[]
  focusReason: Record<ExerciseFocus, string>
  illustration: React.ReactNode
}

function ChinTuckSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="30" ry="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
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
      <motion.ellipse cx="60" cy="60" rx="10" ry="7" fill="#f59e0b" opacity="0.7"
        animate={{ cx: [60, 72, 60, 48, 60] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  )
}

function TongueSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="85" rx="30" ry="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.path d="M48 56 Q60 44 72 56" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"
        animate={{ d: ['M48 56 Q60 44 72 56', 'M48 52 Q60 40 72 52', 'M48 56 Q60 44 72 56'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  )
}

function JawDropSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="36" r="24" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.ellipse cx="60" cy="75" rx="20" ry="12" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"
        animate={{ cy: [75, 88, 75], ry: [12, 16, 12] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.rect x="50" y="56" width="20" height="4" rx="2" fill="#10b981" opacity="0.7"
        animate={{ y: [56, 68, 56] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  )
}

function ResistanceSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="36" r="24" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <ellipse cx="60" cy="78" rx="22" ry="14" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.rect x="46" y="88" width="28" height="14" rx="7" fill="#6366f1" opacity="0.8"
        animate={{ y: [88, 84, 88] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.path d="M52 78 Q60 72 68 78" fill="none" stroke="#e2e8f0" strokeWidth="3"
        animate={{ d: ['M52 78 Q60 72 68 78', 'M52 82 Q60 76 68 82', 'M52 78 Q60 72 68 78'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
    </svg>
  )
}

function PostureSvg() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
      <circle cx="60" cy="38" r="24" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
      <motion.line x1="60" y1="62" x2="60" y2="100" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"
        animate={{ x2: [60, 56, 60, 64, 60] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.line x1="60" y1="75" x2="44" y2="88" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"
        animate={{ x2: [44, 40, 44] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.line x1="60" y1="75" x2="76" y2="88" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"
        animate={{ x2: [76, 80, 76] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      <line x1="60" y1="10" x2="60" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  )
}

const EXERCISES: Exercise[] = [
  {
    id: 'side-stretch',
    name: 'Side jaw stretch',
    duration: 40,
    sets: 3,
    cue: 'Open your mouth slightly. Slowly move the lower jaw left, hold 3 s, then right. Keep it smooth and controlled.',
    benefit: 'Directly targets left-right muscle imbalance and improves lateral mobility.',
    focus: ['symmetry'],
    focusReason: {
      symmetry: 'Your scan shows asymmetry signals — this exercise works both sides equally to rebalance jaw muscles.',
      wear: 'Lateral movement flushes tension out of whichever side bears more load during grinding.',
      crowding: 'Gentle lateral work creates more balanced jaw space over time.',
    },
    illustration: <SideStretchSvg />,
  },
  {
    id: 'resistance-hold',
    name: 'Resistance hold',
    duration: 30,
    sets: 3,
    cue: 'Place a fist under your chin. Open your mouth gently against the resistance. Hold 5 s, release.',
    benefit: 'Strengthens the muscles that open the jaw symmetrically, improving left-right balance.',
    focus: ['symmetry'],
    focusReason: {
      symmetry: 'Your scan detected a balance issue — resistance training builds the weaker side back up.',
      wear: 'Controlled load on the opening muscles reduces compensatory clenching on the worn side.',
      crowding: 'Strengthening jaw openers reduces downward pressure that can worsen crowding.',
    },
    illustration: <ResistanceSvg />,
  },
  {
    id: 'jaw-drop',
    name: 'Controlled jaw drop',
    duration: 45,
    sets: 3,
    cue: 'Open your mouth as wide as comfortable — no pain — then close slowly. Take 4 seconds each way.',
    benefit: 'Maintains full range of motion and releases tight masseter muscles that drive grinding.',
    focus: ['wear'],
    focusReason: {
      symmetry: 'Slow full-range movement reveals if one side opens further than the other — good for tracking.',
      wear: 'Your wear pattern suggests tight masseters. Slow jaw drops reduce tension at the root cause.',
      crowding: 'Opening fully gives the tongue room to rest in the correct position.',
    },
    illustration: <JawDropSvg />,
  },
  {
    id: 'chin-tuck',
    name: 'Chin tuck',
    duration: 30,
    sets: 3,
    cue: 'Pull your chin straight back, creating a "double chin". Hold for 5 seconds, release, repeat.',
    benefit: 'Aligns the cervical spine with the jaw and reduces forward-head posture that drives clenching.',
    focus: ['wear'],
    focusReason: {
      symmetry: 'Neck alignment directly affects jaw position — this resets your baseline resting posture.',
      wear: 'Forward head posture multiplies bite force on the front teeth. This exercise corrects that.',
      crowding: 'Proper head and jaw alignment reduces pressure that can push teeth together over time.',
    },
    illustration: <ChinTuckSvg />,
  },
  {
    id: 'tongue-press',
    name: 'Tongue press',
    duration: 30,
    sets: 3,
    cue: 'Press the tip of your tongue firmly against the roof of your mouth. Hold 10 seconds, repeat.',
    benefit: 'Trains the tongue to rest against the palate, which naturally widens the arch and reduces crowding.',
    focus: ['crowding'],
    focusReason: {
      symmetry: 'Tongue resting position affects which side of the palate gets more pressure — this normalises it.',
      wear: 'Correct tongue posture keeps the jaw resting in neutral and reduces nighttime bruxism.',
      crowding: 'Your scan shows crowding tendency. This is the most evidence-backed habit for arch-widening.',
    },
    illustration: <TongueSvg />,
  },
  {
    id: 'posture-reset',
    name: 'Jaw-posture reset',
    duration: 60,
    sets: 2,
    cue: 'Sit tall, let your jaw hang relaxed (lips together, teeth apart). Breathe through your nose for 60 s. Tongue tip rests on palate.',
    benefit: 'Resets the entire jaw-neck-posture chain to a neutral baseline — most effective done before sleep.',
    focus: ['crowding', 'wear'],
    focusReason: {
      symmetry: 'Resting in neutral prevents the asymmetric muscle loading that builds up during the day.',
      wear: 'A daily rest reset dramatically reduces unconscious clenching tension carried into sleep.',
      crowding: 'Habitual jaw-open resting posture is a primary driver of crowding in adults — this reverses it.',
    },
    illustration: <PostureSvg />,
  },
]

function ExerciseTimer({ duration, sets, onClose }: { duration: number; sets: number; onClose: () => void }) {
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
            if (currentSet < sets) { setCurrentSet((s) => s + 1); return duration }
            setRunning(false); setDone(true); return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, currentSet, sets, duration])

  const toggle = () => setRunning((v) => !v)
  const reset = () => { setRunning(false); setCurrentSet(1); setTimeLeft(duration); setDone(false) }
  const pct = ((duration - timeLeft) / duration) * 100

  return (
    <div className="space-y-4 rounded-[1.25rem] border border-slate-200 bg-white p-5">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <div className="font-semibold text-slate-900">Set complete!</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Again</Button>
            <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Set {currentSet} of {sets}</span>
            <span className="text-2xl font-bold tabular-nums text-slate-900">{timeLeft}s</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} transition={{ duration: 0.9 }} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={toggle}>
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {timeLeft === duration ? 'Start' : 'Resume'}</>}
            </Button>
            <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </>
      )}
    </div>
  )
}

function getTopFocus(scoreSummary?: ScoreSummary): ExerciseFocus {
  if (!scoreSummary) return 'symmetry'
  const dims = scoreSummary.dimensions
  const sym = dims.find((d) => d.label === 'Symmetry')?.score ?? 0
  const wear = dims.find((d) => d.label === 'Wear')?.score ?? 0
  const crowd = dims.find((d) => d.label === 'Crowding')?.score ?? 0
  if (sym >= wear && sym >= crowd) return 'symmetry'
  if (wear >= crowd) return 'wear'
  return 'crowding'
}

function sortExercises(exercises: Exercise[], focus: ExerciseFocus): Exercise[] {
  return [...exercises].sort((a, b) => {
    const aMatch = a.focus.includes(focus) ? 1 : 0
    const bMatch = b.focus.includes(focus) ? 1 : 0
    return bMatch - aMatch
  })
}

const FOCUS_META: Record<ExerciseFocus, { label: string; color: string; bg: string; border: string; desc: string }> = {
  symmetry: {
    label: 'Jaw balance',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    desc: 'Your scan detected asymmetry signals. These exercises prioritise left-right muscle rebalancing.',
  },
  wear: {
    label: 'Tension relief',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    desc: 'Your scan shows wear indicators consistent with jaw tension. These exercises focus on release and posture.',
  },
  crowding: {
    label: 'Arch support',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    desc: 'Your scan shows crowding tendency. These exercises train tongue posture and arch-widening habits.',
  },
}

export function JawExerciseLibrary({ scoreSummary }: { scoreSummary?: ScoreSummary }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [timerKey, setTimerKey] = useState(0)

  const topFocus = getTopFocus(scoreSummary)
  const sorted = sortExercises(EXERCISES, topFocus)
  const recommended = sorted.filter((e) => e.focus.includes(topFocus)).slice(0, 2)
  const meta = FOCUS_META[topFocus]

  const start = (id: string) => { setActiveId(id); setTimerKey((k) => k + 1) }

  return (
    <div className="space-y-5">
      {/* Personalised recommendation banner */}
      {scoreSummary && (
        <div className={cn('rounded-[1.5rem] border p-5', meta.border, meta.bg)}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={cn('h-4 w-4', meta.color)} />
            <div className={cn('text-[11px] font-bold uppercase tracking-[0.15em]', meta.color)}>
              Recommended for your scan · {meta.label}
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">{meta.desc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommended.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setActiveId(ex.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80',
                  meta.bg, meta.color, 'ring-1', meta.border,
                )}
              >
                {ex.name} →
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm leading-6 text-slate-500">
        All exercises are gentle and take under 10 minutes total. Stop if you feel pain. Not a replacement for professional care.
      </p>

      {sorted.map((ex) => {
        const isActive = activeId === ex.id
        const isRecommended = scoreSummary && ex.focus.includes(topFocus)
        const whyText = isRecommended ? ex.focusReason[topFocus] : null

        return (
          <div key={ex.id}
            className={cn(
              'overflow-hidden rounded-[1.5rem] border transition-colors',
              isActive ? 'border-cyan-200 bg-cyan-50/50'
              : isRecommended ? cn(meta.border, 'bg-white')
              : 'border-slate-200 bg-white',
            )}
          >
            <button type="button" className="flex w-full items-start gap-4 p-5 text-left" onClick={() => setActiveId(isActive ? null : ex.id)}>
              <div className="shrink-0">{ex.illustration}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-slate-900">{ex.name}</div>
                  {isRecommended && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]', meta.bg, meta.color)}>
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{ex.cue}</p>
                {whyText && (
                  <p className={cn('mt-2 text-xs leading-5 font-medium', meta.color)}>{whyText}</p>
                )}
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
                <motion.div key="timer"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden px-5 pb-5"
                >
                  <ExerciseTimer key={timerKey} duration={ex.duration} sets={ex.sets}
                    onClose={() => { setActiveId(null); start(ex.id) }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
