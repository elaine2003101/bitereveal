import { useState } from 'react'
import { Mail, CheckCircle2, RefreshCw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScanHistoryEntry } from '@/types'

type Props = {
  apiBaseUrl: string
  scanHistory: ScanHistoryEntry[]
}

function formatDate(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(ts)
}

export function WeeklyReport({ apiBaseUrl, scanHistory }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const subscribe = async () => {
    if (!email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch(`${apiBaseUrl}/api/weekly-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Subscription failed.')
      setStatus('success')
      setMessage('You are subscribed. Expect your first report next Monday.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  // Build a preview of what the report will look like
  const recent = scanHistory.slice(0, 5)
  const avgScore =
    recent.length > 0
      ? Math.round(recent.reduce((s, e) => s + e.scoreSummary.overall, 0) / recent.length)
      : null

  return (
    <div className="space-y-5">
      {/* Subscription form */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Mail className="h-4 w-4 text-cyan-600" />
          Weekly email report
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Get a concise Monday summary of your scan history, trend, and one habit tip — straight
          to your inbox.
        </p>

        {status === 'success' ? (
          <div className="mt-4 flex items-center gap-3 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[0.9rem] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              onKeyDown={(e) => e.key === 'Enter' && subscribe()}
            />
            {status === 'error' && (
              <p className="text-sm text-rose-600">{message}</p>
            )}
            <Button
              className="w-full"
              onClick={subscribe}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Subscribing…</>
              ) : (
                <><Mail className="h-4 w-4" /> Subscribe to weekly report</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Report preview */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText className="h-4 w-4 text-cyan-600" />
          Report preview
        </div>
        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm font-mono text-xs leading-6 text-slate-700">
          <div className="mb-4 border-b border-slate-100 pb-3 text-base font-semibold font-sans text-slate-900">
            🦷 BiteReveal — Weekly summary
          </div>

          {avgScore !== null ? (
            <>
              <div className="font-sans">
                <span className="text-slate-500">Average score this week: </span>
                <span className="font-bold text-slate-900">{avgScore}/100</span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="text-slate-500 font-sans">Recent scans:</div>
                {recent.map((e) => (
                  <div key={e.id} className="flex gap-4">
                    <span className="w-20 text-slate-400">{formatDate(e.createdAt)}</span>
                    <span className="font-semibold text-slate-800">
                      {e.scoreSummary.overall}
                    </span>
                    <span className="text-slate-500">{e.scoreSummary.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 font-sans text-slate-600">
                💡 Tip of the week: Try the chin tuck exercise daily — 3 sets of 30 seconds
                helps balance the muscles that support your jaw.
              </div>
            </>
          ) : (
            <div className="font-sans text-slate-400">
              No scans yet — your report will include your score history once you've run your first
              analysis.
            </div>
          )}

          <div className="mt-4 text-slate-400 font-sans text-[11px]">
            Educational prototype · Not a medical service
          </div>
        </div>
      </div>
    </div>
  )
}
