import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AnalysisResult, ScoreSummary } from '@/types'

type Props = {
  result: AnalysisResult
  scoreSummary: ScoreSummary
  apiBaseUrl: string
}

export function CoachingPanel({ result, scoreSummary, apiBaseUrl }: Props) {
  const [coaching, setCoaching] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const fetchCoaching = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiBaseUrl}/api/coaching`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, scoreSummary }),
      })
      const data = (await response.json()) as { coaching?: string; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Failed to get coaching')
      setCoaching(data.coaching ?? '')
      setExpanded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load coaching text.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[1.25rem] border border-cyan-200 bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_100%)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-800">
          <Sparkles className="h-4 w-4" />
          AI bite coach
        </div>

        <div className="flex items-center gap-2">
          {coaching && (
            <button
              type="button"
              className="text-cyan-600 hover:text-cyan-800"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-300 bg-white/70 text-cyan-700 hover:bg-white"
            onClick={fetchCoaching}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading…
              </>
            ) : coaching ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Get coaching
              </>
            )}
          </Button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <AnimatePresence initial={false}>
        {coaching && expanded && (
          <motion.div
            key="coaching-text"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 text-sm leading-7 text-cyan-900">
              {coaching
                .split('\n')
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
