import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ScoreSummary } from '@/types'

function computeOrthoNeed(symmetryScore: number, crowdingScore: number) {
  const combined = Math.round(symmetryScore * 0.4 + crowdingScore * 0.6)
  if (combined >= 65) return {
    label: 'Consult recommended',
    pct: combined,
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
    barClass: 'bg-rose-500',
    detail: "Alignment and crowding signals suggest an orthodontic assessment could be valuable — even just to confirm you're fine.",
  }
  if (combined >= 40) return {
    label: 'Worth discussing',
    pct: combined,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    barClass: 'bg-amber-500',
    detail: 'Mild patterns detected. Not urgent, but worth mentioning at your next routine dental visit.',
  }
  return {
    label: 'Low likelihood',
    pct: combined,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    barClass: 'bg-emerald-500',
    detail: 'Current visible alignment looks balanced. Keep scanning monthly to catch any drift early.',
  }
}

export function OrthoNeed({ scoreSummary }: { scoreSummary: ScoreSummary }) {
  const symmetry = scoreSummary.dimensions.find((d) => d.label === 'Symmetry')?.score ?? 36
  const crowding = scoreSummary.dimensions.find((d) => d.label === 'Crowding')?.score ?? 36
  const need = computeOrthoNeed(symmetry, crowding)

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Orthodontic Need</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">Alignment estimate</div>
        </div>
        <Badge className={cn('text-[10px]', need.badgeClass)}>{need.label}</Badge>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn('h-full rounded-full', need.barClass)}
          initial={{ width: 0 }}
          animate={{ width: `${need.pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        <span>Unlikely</span><span>Likely needed</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{need.detail}</p>
    </div>
  )
}
