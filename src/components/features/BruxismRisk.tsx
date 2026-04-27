import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScoreSummary } from '@/types'

function computeRisk(wearScore: number) {
  if (wearScore >= 70) return {
    label: 'High',
    pct: wearScore,
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    barClass: 'bg-rose-500',
    tip: 'Visible wear patterns suggest a higher chance of nighttime grinding. Ask your dentist about a custom night guard.',
  }
  if (wearScore >= 45) return {
    label: 'Moderate',
    pct: wearScore,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    barClass: 'bg-amber-500',
    tip: 'Some wear indicators present. Mention any clenching or grinding at your next check-up — early guards are simple and effective.',
  }
  return {
    label: 'Low',
    pct: wearScore,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    barClass: 'bg-emerald-500',
    tip: 'Wear patterns look minimal. Stay consistent with soft food days and avoid stress-driven jaw clenching habits.',
  }
}

export function BruxismRisk({ scoreSummary }: { scoreSummary: ScoreSummary }) {
  const wearScore = scoreSummary.dimensions.find((d) => d.label === 'Wear')?.score ?? 36
  const risk = computeRisk(wearScore)

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Bruxism Risk</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">Grinding likelihood</div>
        </div>
        <Badge className={risk.badgeClass}>{risk.label}</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn('h-full rounded-full', risk.barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${risk.pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Low risk</span><span>High risk</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{risk.tip}</p>
    </div>
  )
}
