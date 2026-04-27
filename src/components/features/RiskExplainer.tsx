import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type RiskTopic = {
  id: string
  title: string
  tagline: string
  color: string
  svgContent: React.ReactNode
  explanation: string
  selfCheck: string[]
  whenToAct: string
}

const TOPICS: RiskTopic[] = [
  {
    id: 'symmetry',
    title: 'Bite symmetry',
    tagline: 'How evenly your jaw closes on both sides.',
    color: 'cyan',
    svgContent: (
      <svg viewBox="0 0 200 100" className="w-full" aria-hidden>
        {/* Arch */}
        <path
          d="M20 80 Q100 10 180 80"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Left side highlight */}
        <path
          d="M20 80 Q60 30 100 18"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.7"
        >
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </path>
        {/* Right side highlight */}
        <path
          d="M100 18 Q140 30 180 80"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.5"
        >
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
        </path>
        {/* Centre line */}
        <line x1="100" y1="10" x2="100" y2="90" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
        <text x="100" y="97" textAnchor="middle" fontSize="9" fill="#94a3b8">midline</text>
      </svg>
    ),
    explanation:
      'Bite symmetry refers to whether your teeth and jaw come together evenly on the left and right. A slight imbalance is common and often not noticeable, but over time it can lead to uneven muscle use and increased wear on one side.',
    selfCheck: [
      'Look straight in a mirror and check if your front teeth are centred.',
      'Bite down gently — notice if one side touches before the other.',
      'Feel for jaw soreness on one side after chewing.',
    ],
    whenToAct:
      'If you notice persistent clicking, one-sided pain, or significant midline deviation, mention it at your next dental check-up.',
  },
  {
    id: 'wear',
    title: 'Tooth wear',
    tagline: 'Gradual loss of enamel from contact and pressure.',
    color: 'rose',
    svgContent: (
      <svg viewBox="0 0 200 110" className="w-full" aria-hidden>
        {/* Tooth silhouette */}
        <rect x="60" y="20" width="80" height="60" rx="14" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2" />
        {/* Enamel layer */}
        <rect x="60" y="20" width="80" height="16" rx="8" fill="#e0f2fe" />
        {/* Worn top */}
        <rect x="60" y="20" width="80" height="8" rx="4" fill="#ef4444" opacity="0.5">
          <animate attributeName="height" values="8;12;8" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <text x="100" y="18" textAnchor="middle" fontSize="8" fill="#ef4444">wear zone</text>
        {/* Root */}
        <path d="M72 80 Q80 105 100 108 Q120 105 128 80" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      </svg>
    ),
    explanation:
      'Enamel is the hardest substance in the body, but it can wear down from grinding (bruxism), acidic foods, or an uneven bite that concentrates force on specific teeth. Once gone, enamel does not regenerate — so catching wear early matters.',
    selfCheck: [
      'Look for teeth that appear shorter or flatter at the edges.',
      'Notice increased sensitivity to hot, cold, or sweet food.',
      'Ask someone if you grind your teeth at night.',
    ],
    whenToAct:
      'Visible flattening or sensitivity that is new or worsening is worth discussing with a dentist. A night guard may be recommended.',
  },
  {
    id: 'crowding',
    title: 'Crowding tendency',
    tagline: 'When there is not enough space for teeth to sit straight.',
    color: 'amber',
    svgContent: (
      <svg viewBox="0 0 200 100" className="w-full" aria-hidden>
        {/* Teeth row */}
        {[20, 48, 72, 96, 124, 152, 176].map((x, i) => (
          <rect
            key={i}
            x={x + (i === 3 ? -4 : i === 2 ? 3 : 0)}
            y={i % 2 === 0 ? 30 : 24}
            width={22}
            height={42}
            rx={5}
            fill={i === 2 || i === 3 ? '#fef3c7' : '#f8fafc'}
            stroke={i === 2 || i === 3 ? '#f59e0b' : '#e2e8f0'}
            strokeWidth="2"
          >
            {(i === 2 || i === 3) && (
              <animate attributeName="fill" values="#fef3c7;#fde68a;#fef3c7" dur="2s" repeatCount="indefinite" />
            )}
          </rect>
        ))}
        <text x="100" y="95" textAnchor="middle" fontSize="9" fill="#94a3b8">overlap tendency</text>
      </svg>
    ),
    explanation:
      'Crowding occurs when the jaw does not have enough space to accommodate all teeth in a straight row. Mild crowding is very common and may shift slowly over years. It can make cleaning between teeth harder and contribute to uneven contact.',
    selfCheck: [
      'Look for any teeth that appear to be in front of or behind their neighbours.',
      'Notice if flossing is harder in specific gaps.',
      'Check if any tooth feels like it is being pushed.',
    ],
    whenToAct:
      'Mild crowding is monitored over time. If it is worsening, causing discomfort, or making hygiene difficult, an orthodontic consultation is worthwhile.',
  },
]

const colorMap: Record<string, { badge: string; panel: string; heading: string }> = {
  cyan: {
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    panel: 'border-cyan-200 bg-cyan-50/50',
    heading: 'text-cyan-700',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    panel: 'border-rose-200 bg-rose-50/50',
    heading: 'text-rose-700',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    panel: 'border-amber-200 bg-amber-50/50',
    heading: 'text-amber-700',
  },
}

export function RiskExplainer() {
  const [openId, setOpenId] = useState<string | null>('symmetry')

  return (
    <div className="space-y-3">
      {TOPICS.map((topic) => {
        const open = openId === topic.id
        const colors = colorMap[topic.color]

        return (
          <div
            key={topic.id}
            className={cn(
              'overflow-hidden rounded-[1.5rem] border transition-colors',
              open ? colors.panel : 'border-slate-200 bg-white',
            )}
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 p-5 text-left"
              onClick={() => setOpenId(open ? null : topic.id)}
            >
              <div>
                <span
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                    colors.badge,
                  )}
                >
                  {topic.title}
                </span>
                <p className="mt-2 text-sm text-slate-600">{topic.tagline}</p>
              </div>
              {open ? (
                <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-5 px-5 pb-5 md:grid-cols-[200px_minmax(0,1fr)]">
                    {/* SVG illustration */}
                    <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
                      {topic.svgContent}
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm leading-7 text-slate-700">
                        {topic.explanation}
                      </p>

                      <div>
                        <div className={cn('mb-2 text-xs font-semibold uppercase tracking-[0.15em]', colors.heading)}>
                          Self-check
                        </div>
                        <ul className="space-y-1.5">
                          {topic.selfCheck.map((item, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-600">
                              <span className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', `bg-${topic.color}-400`)} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-[0.85rem] border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">When to act: </span>
                        {topic.whenToAct}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
