import { cn } from '@/lib/utils'

type Props = {
  score: number
}

// Approximate normal CDF using Abramowitz & Stegun approximation
function erf(x: number) {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)
  const t = 1 / (1 + p * x)
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return sign * y
}

function scoreToPercentile(score: number) {
  // Population modelled as N(mean=42, std=19) — most users are low-moderate
  const z = (score - 42) / 19
  const cdf = 0.5 * (1 + erf(z / Math.SQRT2))
  return Math.max(1, Math.min(99, Math.round(cdf * 100)))
}

export function BenchmarkBar({ score }: Props) {
  const percentile = scoreToPercentile(score)
  const isHigh = percentile >= 70
  const isMid = percentile >= 40 && percentile < 70

  const barColor = isHigh
    ? 'bg-rose-500'
    : isMid
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  const label = isHigh
    ? 'higher signal than most'
    : isMid
      ? 'in the mid-range'
      : 'lower signal than most'

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-900">Benchmark</span>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            isHigh
              ? 'bg-rose-50 text-rose-700'
              : isMid
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700',
          )}
        >
          {percentile}th percentile
        </span>
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${percentile}%` }}
        />
        {/* marker at user's position */}
        <div
          className="absolute top-0 h-full w-0.5 bg-slate-900/60"
          style={{ left: `${percentile}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-slate-500">
        You are <span className="font-medium text-slate-700">{label}</span> at {score}/100.
      </p>
    </div>
  )
}
