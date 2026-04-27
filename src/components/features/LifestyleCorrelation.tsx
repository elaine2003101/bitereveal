import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { Moon, Zap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScanHistoryEntry, LifestyleEntry } from '@/types'

ChartJS.register(LinearScale, PointElement, Tooltip)

const LIFESTYLE_KEY = 'bitereveal-lifestyle-v1'

type Props = {
  scanHistory: ScanHistoryEntry[]
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function LifestyleCorrelation({ scanHistory }: Props) {
  const [sleep, setSleep] = useState(7)
  const [stress, setStress] = useState(5)
  const [entries, setEntries] = useState<LifestyleEntry[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIFESTYLE_KEY)
      if (raw) setEntries(JSON.parse(raw) as LifestyleEntry[])
    } catch {
      // ignore
    }
  }, [])

  const latestScore =
    scanHistory.length > 0 ? scanHistory[0].scoreSummary.overall : null

  const logEntry = () => {
    const today = todayKey()
    const entry: LifestyleEntry = {
      date: today,
      sleep,
      stress,
      biteScore: latestScore,
    }
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== today)
      const next = [entry, ...filtered].slice(0, 30)
      window.localStorage.setItem(LIFESTYLE_KEY, JSON.stringify(next))
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const withScore = entries.filter((e) => e.biteScore !== null)

  const sleepScatterData = {
    datasets: [
      {
        label: 'Sleep vs Bite score',
        data: withScore.map((e) => ({ x: e.sleep, y: e.biteScore! })),
        backgroundColor: 'rgba(6,182,212,0.7)',
        pointRadius: 7,
      },
    ],
  }

  const stressScatterData = {
    datasets: [
      {
        label: 'Stress vs Bite score',
        data: withScore.map((e) => ({ x: e.stress, y: e.biteScore! })),
        backgroundColor: 'rgba(239,68,68,0.7)',
        pointRadius: 7,
      },
    ],
  }

  const scatterOptions = (xLabel: string) => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        min: 1,
        max: 10,
        title: { display: true, text: xLabel, color: '#94a3b8', font: { size: 12 } },
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: {
        min: 0,
        max: 100,
        title: { display: true, text: 'Bite score', color: '#94a3b8', font: { size: 12 } },
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  })

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Log today's lifestyle</div>
        <p className="mt-1 text-sm text-slate-500">
          Track sleep and stress alongside your scans to discover personal patterns.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <Moon className="h-4 w-4 text-cyan-600" /> Sleep quality
              </div>
              <span className="font-semibold text-slate-900">{sleep}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <Zap className="h-4 w-4 text-rose-500" /> Stress level
              </div>
              <span className="font-semibold text-slate-900">{stress}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="mt-2 w-full accent-rose-500"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>None</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {latestScore === null && (
          <p className="mt-4 rounded-[0.75rem] bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Run a scan first to attach your bite score to this entry.
          </p>
        )}

        <Button className="mt-4 w-full" onClick={logEntry}>
          <Plus className="h-4 w-4" />
          {saved ? 'Saved!' : "Log today's entry"}
        </Button>
      </div>

      {/* Scatter plots */}
      {withScore.length >= 2 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">
              Sleep vs Bite signal
            </div>
            <Scatter data={sleepScatterData} options={scatterOptions('Sleep quality (1–10)')} />
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-slate-700">
              Stress vs Bite signal
            </div>
            <Scatter data={stressScatterData} options={scatterOptions('Stress level (1–10)')} />
          </div>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
          Log at least 2 entries with completed scans to see correlation charts.
        </div>
      )}

      {/* Log history */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.slice(0, 7).map((e) => (
            <div
              key={e.date}
              className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-medium text-slate-700">{e.date}</span>
              <span className="text-slate-500">
                Sleep {e.sleep}/10 · Stress {e.stress}/10
              </span>
              {e.biteScore !== null && (
                <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Score {e.biteScore}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
