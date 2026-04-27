import { motion } from 'framer-motion'
import type { ScoreSummary } from '@/types'

const ACT_MILESTONES = [
  { time: 'This week', text: 'Start daily jaw exercises and schedule a routine check-up.' },
  { time: '3 months', text: 'Professional baseline recorded. Muscles begin rebalancing.' },
  { time: '6 months', text: 'Visible asymmetry stabilised. Dentist confirms no active wear progression.' },
  { time: '1 year', text: 'Scan scores improve. Habits locked in, grinding risk reduced.' },
  { time: '5 years', text: 'Bite remains balanced. No orthodontic intervention needed.' },
]

function getDoNothingMilestones(overall: number) {
  const severe = overall >= 70
  return [
    { time: 'This week', text: 'Patterns continue unchanged with each meal and sleep cycle.' },
    { time: '3 months', text: severe ? 'Wear accelerates on the dominant side.' : 'Minor patterns drift slowly — still manageable.' },
    { time: '6 months', text: severe ? 'Asymmetry starts becoming visually noticeable.' : 'Subtle shift continues. Reversal requires more effort.' },
    { time: '1 year', text: severe ? 'Enamel loss on high-load side becomes measurable.' : 'Patterns more established and harder to reverse naturally.' },
    { time: '5 years', text: severe ? 'Professional treatment likely required — options narrower.' : 'Compounding issues make intervention more complex.' },
  ]
}

export function TreatmentRoadmap({ scoreSummary }: { scoreSummary: ScoreSummary }) {
  const doNothing = getDoNothingMilestones(scoreSummary.overall)

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">5-year roadmap</div>
      <div className="text-lg font-semibold text-slate-900">Two paths from here</div>
      <p className="mt-1 text-sm text-slate-500">
        The same starting point leads to very different outcomes depending on what you do next.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Act now */}
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="text-sm font-bold text-emerald-800">Act now</div>
          </div>
          <div className="space-y-0">
            {ACT_MILESTONES.map((m, i) => (
              <motion.div
                key={m.time}
                className="flex gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  {i < ACT_MILESTONES.length - 1 && (
                    <div className="w-px flex-1 bg-emerald-200" style={{ minHeight: 20 }} />
                  )}
                </div>
                <div className="pb-3 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">{m.time}</div>
                  <p className="mt-0.5 text-xs leading-5 text-slate-600">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Do nothing */}
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50/60 p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <div className="text-sm font-bold text-rose-800">Do nothing</div>
          </div>
          <div className="space-y-0">
            {doNothing.map((m, i) => (
              <motion.div
                key={m.time}
                className="flex gap-3"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 + 0.1, duration: 0.35 }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  {i < doNothing.length - 1 && (
                    <div className="w-px flex-1 bg-rose-200" style={{ minHeight: 20 }} />
                  )}
                </div>
                <div className="pb-3 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700">{m.time}</div>
                  <p className="mt-0.5 text-xs leading-5 text-slate-600">{m.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-400">Educational projection only — not a clinical forecast.</p>
    </div>
  )
}
