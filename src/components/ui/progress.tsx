import { cn } from '@/lib/utils'

type ProgressProps = {
  className?: string
  value?: number
}

export function Progress({ className, value = 0 }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn(
        'h-2.5 w-full overflow-hidden rounded-full bg-slate-200',
        className,
      )}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={clamped}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400 transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
