import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Act = {
  number: string
  era: string
  timeframe: string
  headline: string
  color: { ring: string; bg: string; border: string; label: string; dot: string }
  paragraphs: string[]
}

const ACTS: Act[] = [
  {
    number: '01',
    era: 'The Near Future',
    timeframe: '2–5 years',
    headline: 'Awareness becomes ambient',
    color: {
      ring: 'text-cyan-700',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      label: 'text-cyan-700',
      dot: 'bg-cyan-500',
    },
    paragraphs: [
      'The scan is no longer an event. Your mirror has a sensor. Your brush has a sensor. Your phone camera reads your bite when you yawn. You do not think about scanning. Data about your oral health accumulates the way your step count does — quietly, continuously, without friction.',
      'You have an oral health score the way you have a credit score. It changes daily. It responds to your behaviour. It predicts your trajectory.',
      'The insight is no longer a card you receive after a scan. It is a continuous ambient awareness — a gentle signal that says "your left jaw load has been elevated for 11 days, this is likely stress-related, here is what that means long term."',
      'You do not visit a clinic. You adjust a habit. The problem never becomes a problem.',
    ],
  },
  {
    number: '02',
    era: 'The Medium Future',
    timeframe: '5–15 years',
    headline: 'Practice becomes embedded in identity',
    color: {
      ring: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      label: 'text-violet-700',
      dot: 'bg-violet-500',
    },
    paragraphs: [
      'Oral health is a social value. People talk about their bite score the way they talk about their sleep score or their VO₂ max. There is a community of practice around it — coaches, challenges, programmes, peer accountability.',
      'Children grow up with oral health tracking as normal. The generation born into this world has a fundamentally different relationship with their teeth than their parents did. Orthodontic cases that would have required 3 years of braces are caught at age 6 and corrected through guided habit formation by age 8.',
      'The dentist is still there. But the dentist now sees patients who arrive with 5 years of longitudinal data, pre-diagnosed, with a clear treatment pathway already mapped. The appointment is shorter, more precise, less traumatic. The patient is informed, not passive.',
      'The smart brush is not a luxury gadget. It is infrastructure — the way a seatbelt is infrastructure. Insurance companies price your premium based on your oral health behaviour score. Employers include it in wellness programmes. Schools track it alongside physical fitness.',
    ],
  },
  {
    number: '03',
    era: 'The Far Future',
    timeframe: '15–30 years',
    headline: 'Prevention becomes so complete that the problem changes shape',
    color: {
      ring: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      label: 'text-rose-700',
      dot: 'bg-rose-500',
    },
    paragraphs: [
      'The diseases that dentists currently spend most of their time treating — caries, periodontal disease, malocclusion — become significantly rarer in populations with access to the platform. Not eliminated. Rarer. The way polio is rarer. The way scurvy is rarer.',
      "The dentist's role evolves. They become more like a cardiologist — a specialist you see when something systemic is happening that the daily practice layer cannot manage. The routine work — the fillings, the scaling, the basic orthodontics — has been largely displaced by prevention.",
      'The oral-systemic connection becomes a major public health story. Because BiteReveal collects longitudinal oral health data at population scale, researchers discover correlations that were previously invisible — between oral microbiome patterns and early Alzheimer\'s markers, between bite stress patterns and cardiovascular risk, between jaw posture and sleep apnoea onset. Oral health data becomes a window into systemic health in ways nobody anticipated.',
      'The platform is no longer just about teeth. It is a continuous signal of whole-body health.',
    ],
  },
]

function ActCard({ act, defaultOpen = false }: { act: Act; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('overflow-hidden rounded-[1.75rem] border', act.color.border)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('flex w-full items-start gap-5 p-6 text-left transition hover:opacity-90', act.color.bg)}
      >
        <div className="shrink-0 pt-0.5">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-bold ring-1', act.color.ring, act.color.border)}>
            {act.number}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', act.color.label)}>
            Act {act.number} · {act.era} · {act.timeframe}
          </div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 leading-snug">{act.headline}</div>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 mt-1">
          <ChevronDown className={cn('h-5 w-5', act.color.label)} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-current/10 p-6 pt-5 space-y-4">
              {act.paragraphs.map((para, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="text-base leading-8 text-slate-700"
                >
                  {para}
                </motion.p>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <div className={cn('h-1.5 w-1.5 rounded-full', act.color.dot)} />
                <div className={cn('text-xs font-semibold', act.color.label)}>{act.era} · {act.timeframe}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FutureVision() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Where this is going</div>
        <h2 className="text-2xl font-bold text-slate-900 leading-snug max-w-2xl">
          BiteReveal is the beginning of something much larger than a scan.
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-500 max-w-3xl">
          This prototype is an early signal of a shift in how people relate to their oral health — from reactive and clinic-dependent to proactive, continuous, and self-directed. Here is what that future looks like, in three acts.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {ACTS.map((act) => (
            <div key={act.number} className={cn('flex items-center gap-2 rounded-full border px-4 py-2', act.color.border, act.color.bg)}>
              <div className={cn('h-1.5 w-1.5 rounded-full', act.color.dot)} />
              <span className={cn('text-xs font-semibold', act.color.label)}>Act {act.number} · {act.timeframe}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acts */}
      {ACTS.map((act, i) => (
        <ActCard key={act.number} act={act} defaultOpen={i === 0} />
      ))}

      {/* Closing note */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-7 text-slate-500">
          You are using this prototype at the very beginning. The scan you just ran is the first brick in that longer story. The habits you build now — the exercises, the monthly scans, the awareness — are the behaviour patterns that this future is built on.
        </p>
        <p className="mt-3 text-xs text-slate-400">
          This vision is speculative and educational. BiteReveal is not a medical device.
        </p>
      </div>
    </div>
  )
}
