import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost'
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-slate-950 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-slate-950',
  outline:
    'border border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline-cyan-500',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400',
}

export function Button({
  className,
  variant = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
