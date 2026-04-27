import { cn } from '@/lib/utils'
import type { ScoreSummary } from '@/types'

function computeBiteAge(overall: number) {
  return Math.round(22 + overall * 0.3)
}

export function BiteAge({ scoreSummary }: { scoreSummary: ScoreSummary }) {
  const age = computeBiteAge(scoreSummary.overall)
  const { ringColor, borderColor, bgColor, label } =
    scoreSummary.overall >= 70
      ? { ringColor: 'text-rose-600', borderColor: 'border-rose-200', bgColor: 'bg-rose-50', label: 'Older pattern' }
      : scoreSummary.overall >= 45
        ? { ringColor: 'text-amber-600', borderColor: 'border-amber-200', bgColor: 'bg-amber-50', label: 'Moderate pattern' }
        : { ringColor: 'text-emerald-600', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50', label: 'Younger pattern' }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-5 py-3 min-w-[82px]', borderColor, bgColor)}>
      <div className={cn('text-3xl font-bold tabular-nums leading-none', ringColor)}>{age}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 mt-0.5">Bite Age</div>
      <div className="text-[9px] text-slate-400">{label}</div>
    </div>
  )
}
