import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp } from 'lucide-react'
import type { ScanHistoryEntry } from '@/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

type Props = {
  scanHistory: ScanHistoryEntry[]
}

function shortDate(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(ts)
}

export function ProgressTimeline({ scanHistory }: Props) {
  if (scanHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp className="h-10 w-10 text-slate-300" />
        <p className="mt-4 text-slate-500">
          Complete your first scan to start tracking progress over time.
        </p>
      </div>
    )
  }

  // Oldest first for the chart
  const ordered = [...scanHistory].reverse()
  const labels = ordered.map((e) => shortDate(e.createdAt))
  const scores = ordered.map((e) => e.scoreSummary.overall)

  const data = {
    labels,
    datasets: [
      {
        label: 'Bite signal score',
        data: scores,
        fill: true,
        tension: 0.4,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.10)',
        pointBackgroundColor: scores.map((s) =>
          s >= 70 ? '#ef4444' : s >= 45 ? '#f59e0b' : '#10b981',
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => ` Score ${ctx.parsed.y}/100`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#94a3b8', font: { size: 12 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12 } },
      },
    },
  }

  const latest = scanHistory[0].scoreSummary.overall
  const previous =
    scanHistory.length > 1 ? scanHistory[1].scoreSummary.overall : null
  const delta = previous !== null ? latest - previous : null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Latest
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{latest}</div>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Scans
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {scanHistory.length}
          </div>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Change
          </div>
          <div
            className={`mt-1 text-2xl font-bold ${
              delta === null
                ? 'text-slate-400'
                : delta > 0
                  ? 'text-rose-500'
                  : delta < 0
                    ? 'text-emerald-600'
                    : 'text-slate-400'
            }`}
          >
            {delta === null
              ? '—'
              : delta > 0
                ? `+${delta}`
                : delta === 0
                  ? '±0'
                  : delta}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <Line data={data} options={options} />
      </div>

      <div className="space-y-2">
        {scanHistory.slice(0, 6).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-3"
          >
            <img
              src={entry.imageSrc}
              alt=""
              className="h-10 w-10 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1 text-sm">
              <div className="font-semibold text-slate-900">
                Score {entry.scoreSummary.overall}
              </div>
              <div className="text-slate-500">{shortDate(entry.createdAt)}</div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {entry.source === 'demo' ? 'Demo' : 'Live'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
