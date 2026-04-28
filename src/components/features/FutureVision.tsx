import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Bluetooth,
  Brain,
  CheckCircle2,
  Heart,
  Loader2,
  Moon,
  RefreshCw,
  Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ScoreSummary } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function buildWeekScores(base: number): number[] {
  const rng = seededRand(base * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const drift = (rng() - 0.5) * 14
    return Math.max(10, Math.min(98, Math.round(base + drift + i * 0.4)))
  })
}

function toOralScore(biteScore: number) {
  // higher bite signal = worse oral health score (like a credit score)
  return Math.max(620, Math.min(890, Math.round(830 - biteScore * 1.8)))
}

function toPercentile(oralScore: number) {
  return Math.round(((oralScore - 620) / 270) * 65 + 28)
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Pulse({ color }: { color: string }) {
  return (
    <motion.span
      className={cn('inline-block h-2 w-2 rounded-full', color)}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    />
  )
}

// ── Act 1 — Ambient device sync ───────────────────────────────────────────────

type DeviceStatus = 'idle' | 'syncing' | 'done'

const DEVICES = [
  { id: 'brush', label: 'Smart Brush', icon: Activity, delay: 0 },
  { id: 'mirror', label: 'Mirror Sensor', icon: Wifi, delay: 0.9 },
  { id: 'phone', label: 'Phone Camera', icon: Bluetooth, delay: 1.8 },
]

function buildAmbientAlert(scoreSummary?: ScoreSummary): { title: string; detail: string; color: string } {
  if (!scoreSummary) return {
    title: 'Left jaw load elevated · Day 11',
    detail: 'Stress-pattern detected across brush and posture data. Likely daytime clenching.',
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  const top = scoreSummary.dimensions.reduce((a, b) => (a.score > b.score ? a : b))
  if (top.label === 'Wear') return {
    title: 'Grinding pressure detected · 3 nights this week',
    detail: 'Your brush torque and mirror jaw posture data both indicate elevated bite force during sleep.',
    color: 'border-rose-200 bg-rose-50 text-rose-800',
  }
  if (top.label === 'Symmetry') return {
    title: 'Left jaw load elevated · Day 11',
    detail: 'Mirror posture sensor shows your jaw rests 2 mm off-centre. Likely stress-related clenching.',
    color: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return {
    title: 'Anterior tooth pressure elevated · This week',
    detail: 'Brush pressure map shows front teeth bearing more load than back. Tongue posture may be the cause.',
    color: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  }
}

function Act1Panel({ scoreSummary }: { scoreSummary?: ScoreSummary }) {
  const [status, setStatus] = useState<Record<string, DeviceStatus>>({
    brush: 'idle', mirror: 'idle', phone: 'idle',
  })
  const [synced, setSynced] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const base = scoreSummary?.overall ?? 52
  const weekScores = buildWeekScores(base)
  const alert = buildAmbientAlert(scoreSummary)

  const runSync = () => {
    if (syncing) return
    setSyncing(true)
    setSynced(false)
    setStatus({ brush: 'idle', mirror: 'idle', phone: 'idle' })
    DEVICES.forEach(({ id, delay }) => {
      setTimeout(() => setStatus((s) => ({ ...s, [id]: 'syncing' })), delay * 1000)
      setTimeout(() => setStatus((s) => ({ ...s, [id]: 'done' })), (delay + 0.8) * 1000)
    })
    setTimeout(() => { setSynced(true); setSyncing(false) }, 3200)
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-4">
      {/* Device cards */}
      <div className="grid grid-cols-3 gap-3">
        {DEVICES.map(({ id, label, icon: Icon }) => {
          const s = status[id]
          return (
            <div key={id} className={cn(
              'rounded-[1.25rem] border p-4 text-center transition-all duration-300',
              s === 'done' ? 'border-emerald-200 bg-emerald-50'
              : s === 'syncing' ? 'border-cyan-200 bg-cyan-50'
              : 'border-slate-200 bg-white',
            )}>
              <div className="flex justify-center mb-2">
                {s === 'syncing'
                  ? <Loader2 className="h-6 w-6 text-cyan-600 animate-spin" />
                  : s === 'done'
                    ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    : <Icon className="h-6 w-6 text-slate-400" />}
              </div>
              <div className="text-xs font-semibold text-slate-700">{label}</div>
              <div className={cn('mt-1 text-[10px]',
                s === 'done' ? 'text-emerald-600' : s === 'syncing' ? 'text-cyan-600' : 'text-slate-400'
              )}>
                {s === 'done' ? 'Synced' : s === 'syncing' ? 'Syncing…' : 'Idle'}
              </div>
            </div>
          )
        })}
      </div>

      <Button className="w-full" onClick={runSync} disabled={syncing}>
        {syncing ? <><Loader2 className="h-4 w-4 animate-spin" /> Syncing devices…</> : <><RefreshCw className="h-4 w-4" /> Sync all devices</>}
      </Button>

      <AnimatePresence>
        {synced && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* 7-day chart */}
            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-slate-700">7-day bite score trend</div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600">
                  <Pulse color="bg-emerald-500" /> Live
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {weekScores.map((score, i) => {
                  const barH = Math.round((score / 100) * 56)
                  const isToday = i === 6
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <motion.div
                        className={cn('w-full rounded-t-md', isToday ? 'bg-cyan-500' : score >= 70 ? 'bg-rose-300' : score >= 45 ? 'bg-amber-300' : 'bg-emerald-300')}
                        initial={{ height: 0 }}
                        animate={{ height: barH }}
                        transition={{ delay: i * 0.07, duration: 0.4 }}
                      />
                      <div className={cn('text-[9px]', isToday ? 'font-bold text-cyan-700' : 'text-slate-400')}>{days[i]}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ambient alert */}
            <div className={cn('rounded-[1.25rem] border p-4', alert.color)}>
              <div className="flex items-center gap-2 mb-1">
                <Pulse color={alert.color.includes('amber') ? 'bg-amber-500' : alert.color.includes('rose') ? 'bg-rose-500' : 'bg-cyan-500'} />
                <div className="text-xs font-bold">{alert.title}</div>
              </div>
              <p className="text-xs leading-5">{alert.detail}</p>
              <div className="mt-2 text-[10px] opacity-60">Last synced: just now · 3 devices</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Act 2 — Oral health identity ──────────────────────────────────────────────

function Act2Panel({ scoreSummary }: { scoreSummary?: ScoreSummary }) {
  const biteScore = scoreSummary?.overall ?? 52
  const oralScore = toOralScore(biteScore)
  const percentile = toPercentile(oralScore)
  const streak = 14
  const dailyChange = biteScore < 45 ? +4 : biteScore < 70 ? +1 : -2
  const savingsEst = Math.round((oralScore - 700) / 10)

  const scoreColor = oralScore >= 780 ? 'text-emerald-600' : oralScore >= 700 ? 'text-amber-600' : 'text-rose-600'
  const scoreLabel = oralScore >= 780 ? 'Excellent' : oralScore >= 700 ? 'Good' : 'Fair'

  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Oral Health Score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <motion.div
                className={cn('text-5xl font-bold tabular-nums', scoreColor)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                {oralScore}
              </motion.div>
              <div className="text-sm text-slate-400">/ 900</div>
            </div>
            <div className={cn('mt-1 text-sm font-semibold', scoreColor)}>{scoreLabel}</div>
          </div>
          <div className="text-right">
            <div className={cn('text-sm font-bold', dailyChange > 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {dailyChange > 0 ? '+' : ''}{dailyChange} today
            </div>
            <div className="text-xs text-slate-400 mt-0.5">🔥 {streak}-day streak</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200">
          <motion.div
            className="h-full w-1.5 rounded-full bg-slate-900 shadow"
            initial={{ left: 0 }}
            animate={{ left: `${((oralScore - 620) / 270) * 100}%` }}
            style={{ position: 'relative' }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>620</span><span>755</span><span>890</span>
        </div>
      </div>

      {/* Community percentile */}
      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold text-slate-700 mb-3">Population percentile · Your age group</div>
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentile}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
            Better than {percentile}% of users your age
          </div>
        </div>
      </div>

      {/* Reveal more */}
      {!revealed ? (
        <Button variant="outline" className="w-full" onClick={() => setRevealed(true)}>
          Show insurance & community data
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 mb-1">Insurance impact</div>
            <div className="text-xl font-bold text-emerald-700">${Math.max(4, savingsEst)}/mo</div>
            <div className="text-xs text-slate-500 mt-0.5">estimated savings based on your consistency score</div>
          </div>
          <div className="rounded-[1.25rem] border border-violet-200 bg-violet-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-700 mb-1">Your network</div>
            <div className="text-xl font-bold text-violet-700">23</div>
            <div className="text-xs text-slate-500 mt-0.5">friends tracking · you rank #4 this week</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Act 3 — Systemic correlations ────────────────────────────────────────────

function Act3Panel({ scoreSummary }: { scoreSummary?: ScoreSummary }) {
  const [ticked, setTicked] = useState(false)
  const wear = scoreSummary?.dimensions.find((d) => d.label === 'Wear')?.score ?? 36
  const sym = scoreSummary?.dimensions.find((d) => d.label === 'Symmetry')?.score ?? 36

  const correlations = [
    {
      icon: Moon,
      label: 'Sleep apnoea risk',
      value: sym >= 60 ? 'Moderate' : 'Low',
      detail: sym >= 60
        ? 'Jaw asymmetry patterns correlate with airway narrowing during sleep. Monitoring recommended.'
        : 'Jaw posture and airway data show no elevated risk signal at this time.',
      color: sym >= 60 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      icon: Activity,
      label: 'Stress marker',
      value: wear >= 60 ? 'Elevated' : 'Normal',
      detail: wear >= 60
        ? 'Wear data is consistent with chronic stress-related clenching. 11 days of elevated load detected.'
        : 'No sustained clenching pattern detected. Bite force remains within expected range.',
      color: wear >= 60 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      icon: Heart,
      label: 'Cardiovascular signal',
      value: 'No signal',
      detail: 'No oral-systemic correlation flagged. Periodontal inflammation markers within normal range based on scan patterns.',
      color: 'border-slate-200 bg-slate-50 text-slate-500',
    },
    {
      icon: Brain,
      label: 'Research contribution',
      value: 'Active',
      detail: 'Your longitudinal data contributed to 3 anonymised research insights this month, including a study on bite stress and sleep quality.',
      color: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ]

  useEffect(() => {
    const t = setTimeout(() => setTicked(true), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="space-y-3">
      {correlations.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: ticked ? 1 : 0, x: ticked ? 0 : 12 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            className={cn('flex items-start gap-4 rounded-[1.25rem] border p-4', item.color)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-current/20">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', item.color)}>{item.value}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
            </div>
          </motion.div>
        )
      })}
      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-400">
        Correlations are simulated projections based on scan pattern data — not clinical diagnosis.
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const ACTS = [
  {
    number: '01',
    era: 'The Near Future',
    timeframe: '2–5 years',
    headline: 'Awareness becomes ambient',
    sub: 'Your mirror, brush, and phone all contribute. You stop thinking about scanning.',
    color: { ring: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  },
  {
    number: '02',
    era: 'The Medium Future',
    timeframe: '5–15 years',
    headline: 'Practice becomes embedded in identity',
    sub: 'An oral health score you carry everywhere — like a credit score, but for your bite.',
    color: { ring: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
  },
  {
    number: '03',
    era: 'The Far Future',
    timeframe: '15–30 years',
    headline: 'Prevention becomes so complete that the problem changes shape',
    sub: 'Your bite data becomes a window into systemic health. Dentistry changes permanently.',
    color: { ring: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
  },
]

export function FutureVision({ scoreSummary }: { scoreSummary?: ScoreSummary }) {
  const [activeAct, setActiveAct] = useState<string>('01')

  const act = ACTS.find((a) => a.number === activeAct)!

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
          Where this is going
        </div>
        <h2 className="text-2xl font-bold text-slate-900 max-w-2xl leading-snug">
          BiteReveal is the beginning of something much larger than a scan.
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-500 max-w-3xl">
          Each act below is a live demo of the feature as it would actually work. Press the sync button, explore the score card, read the systemic signals — then imagine this is just your Tuesday morning.
        </p>
      </div>

      {/* Act selector */}
      <div className="grid grid-cols-3 gap-3">
        {ACTS.map((a) => (
          <button
            key={a.number}
            type="button"
            onClick={() => setActiveAct(a.number)}
            className={cn(
              'rounded-[1.25rem] border p-4 text-left transition-all',
              activeAct === a.number ? cn(a.color.border, a.color.bg) : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <div className={cn('text-[10px] font-bold uppercase tracking-[0.15em]',
              activeAct === a.number ? a.color.ring : 'text-slate-400')}>
              Act {a.number}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-800 leading-4">{a.era}</div>
            <div className="mt-0.5 text-[10px] text-slate-400">{a.timeframe}</div>
          </button>
        ))}
      </div>

      {/* Active act panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAct}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Act header */}
          <div className={cn('rounded-[1.5rem] border p-5', act.color.border, act.color.bg)}>
            <div className={cn('text-[10px] font-bold uppercase tracking-[0.18em] mb-1', act.color.ring)}>
              Act {act.number} · {act.era} · {act.timeframe}
            </div>
            <div className="text-lg font-bold text-slate-900">{act.headline}</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{act.sub}</p>
          </div>

          {/* Interactive demo */}
          {activeAct === '01' && <Act1Panel scoreSummary={scoreSummary} />}
          {activeAct === '02' && <Act2Panel scoreSummary={scoreSummary} />}
          {activeAct === '03' && <Act3Panel scoreSummary={scoreSummary} />}
        </motion.div>
      </AnimatePresence>

      {/* Closing */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-7 text-slate-500">
          You are using this prototype at the very beginning. The habits you build now — the exercises, the monthly scans, the awareness — are the behaviour patterns that this future is built on.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Simulated demo — all device sync, scores, and correlations are projected from your scan data. Not a clinical service.
        </p>
      </div>
    </div>
  )
}
