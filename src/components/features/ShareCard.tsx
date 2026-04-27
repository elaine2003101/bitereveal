import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Share2, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScoreSummary, AnalysisResult } from '@/types'

type Props = {
  result: AnalysisResult
  scoreSummary: ScoreSummary
  imageSrc: string | null
}

export function ShareCard({ result, scoreSummary, imageSrc }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)

  const capture = async () => {
    if (!cardRef.current) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fbff',
      })
      const dataUrl = canvas.toDataURL('image/png')

      if ('share' in navigator) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'bitereveal-result.png', { type: 'image/png' })
        await navigator.share({ title: 'My BiteReveal Result', files: [file] })
      } else {
        const link = document.createElement('a')
        link.download = 'bitereveal-result.png'
        link.href = dataUrl
        link.click()
      }
    } catch (err: unknown) {
      console.error('Share failed:', err)
    } finally {
      setCapturing(false)
    }
  }

  const lead = result.insights[0]
  const leadSummary =
    lead?.summary && lead.summary.length > 88
      ? `${lead.summary.slice(0, 88).trim()}…`
      : lead?.summary
  const scoreColor =
    scoreSummary.overall >= 70
      ? '#ef4444'
      : scoreSummary.overall >= 45
        ? '#f59e0b'
        : '#10b981'

  return (
    <div className="space-y-3">
      {/* Shareable card — this is what gets captured */}
      <div
        ref={cardRef}
        style={{ fontFamily: 'system-ui, sans-serif' }}
        className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_60%,#f0fdf4_100%)] p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">
              BiteReveal
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              My Bite Scan
            </div>
          </div>
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm"
            style={{ backgroundColor: scoreColor }}
          >
            {scoreSummary.overall}
          </div>
        </div>

        <div className="mt-4 text-sm font-medium text-slate-700">{scoreSummary.label}</div>

        {lead && (
          <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white/80 p-4">
            <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Top finding</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{lead.title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{leadSummary}</p>
          </div>
        )}

        {imageSrc && (
          <img
            src={imageSrc}
            alt="Scan"
            className="mt-4 h-24 w-full rounded-xl object-cover opacity-80"
            crossOrigin="anonymous"
          />
        )}

        <div className="mt-4 text-[11px] text-slate-400">
          Educational prototype only · Not a medical diagnosis
        </div>
      </div>

      <Button
        className="w-full"
        variant="outline"
        onClick={capture}
        disabled={capturing}
      >
        {capturing ? (
          <><RefreshCw className="h-4 w-4 animate-spin" /> Preparing...</>
        ) : 'share' in navigator ? (
          <><Share2 className="h-4 w-4" /> Share insight card</>
        ) : (
          <><Download className="h-4 w-4" /> Download insight card</>
        )}
      </Button>
    </div>
  )
}
