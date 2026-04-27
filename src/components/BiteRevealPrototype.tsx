import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  Dumbbell,
  Eye,
  Heart,
  History,
  House,
  Mail,
  Radar,
  RefreshCw,
  ScanLine,
  Shield,
  SplitSquareHorizontal,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Upload,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { BenchmarkBar } from './features/BenchmarkBar'
import { BeforeAfterComparison } from './features/BeforeAfterComparison'
import { CoachingPanel } from './features/CoachingPanel'
import { JawExerciseLibrary } from './features/JawExerciseLibrary'
import { LifestyleCorrelation } from './features/LifestyleCorrelation'
import { ProgressTimeline } from './features/ProgressTimeline'
import { RiskExplainer } from './features/RiskExplainer'
import { ShareCard } from './features/ShareCard'
import { StreakBadge, recordScanToday } from './features/StreakBadge'
import { WeeklyReport } from './features/WeeklyReport'

import type {
  AnalysisAction,
  AnalysisInsight,
  AnalysisResult,
  ScanHistoryEntry,
  ScoreDimension,
  ScoreSummary,
} from '@/types'

export type { AnalysisAction, AnalysisInsight, AnalysisResult, ScanHistoryEntry, ScoreDimension, ScoreSummary }

type CaptureMeta = { width: number; height: number; mimeType: string; sizeKb: number }
type GuidanceItem = { label: string; detail: string; status: 'good' | 'watch' }
type DetailView = { type: 'current' } | { type: 'future' } | { type: 'insight'; index: number }
type TabId = 'scan' | 'timeline' | 'compare' | 'exercises' | 'lifestyle' | 'explain' | 'report'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'scan', label: 'Scan', icon: <ScanLine className="h-3.5 w-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: 'compare', label: 'Compare', icon: <SplitSquareHorizontal className="h-3.5 w-3.5" /> },
  { id: 'exercises', label: 'Exercises', icon: <Dumbbell className="h-3.5 w-3.5" /> },
  { id: 'lifestyle', label: 'Lifestyle', icon: <Heart className="h-3.5 w-3.5" /> },
  { id: 'explain', label: 'Risk guide', icon: <Eye className="h-3.5 w-3.5" /> },
  { id: 'report', label: 'Report', icon: <Mail className="h-3.5 w-3.5" /> },
]

const HISTORY_STORAGE_KEY = 'bitereveal-scan-history-v1'

const fallbackAnalysis: AnalysisResult = {
  confidence: 'medium',
  currentVisibleCondition: {
    title: 'Current visible condition',
    summary: 'Mild asymmetry cues are already visible from a straight-on view.',
    focusPoints: [
      'Small midline shift to the left',
      'Upper tooth edges show slight uneven contact',
      'Mild overlap visible on lower right',
    ],
  },
  futureRiskSnapshot: {
    title: 'Future risk snapshot',
    projectionLabel: '3-year projection',
    summary: 'If unchanged, the visible patterns could become more pronounced over the next few years.',
    riskPoints: [
      'Uneven contact may gradually increase visible asymmetry',
      'Front edge wear could become more noticeable',
      'Mild crowding may shift further without intervention',
    ],
    threeMonths: 'The visible asymmetry is unlikely to change noticeably in the next 3 months, but clenching or grinding habits may accelerate wear if present.',
    oneYear: 'Over 12 months, uneven contact can cause measurable enamel thinning on the side bearing more load — worth monitoring with a check-up.',
    threeYears: 'Without changes, the alignment shift may become visually obvious and harder to address without professional help. Early action now keeps options open.',
  },
  insights: [
    {
      title: 'Minor bite asymmetry',
      severity: 'Early',
      summary: 'Slight left-right imbalance detected from visible tooth alignment cues.',
      detail: 'The visible center balance appears slightly off. This is a common early finding that is easy to monitor.',
      whyItMatters: 'Catching asymmetry early gives the most treatment options and the gentlest interventions.',
    },
    {
      title: 'Potential uneven wear',
      severity: 'Watch',
      summary: 'Front tooth edges may be experiencing uneven contact over time.',
      detail: 'The front edge line suggests contact may not be evenly distributed. Watching this over time is valuable.',
      whyItMatters: 'Enamel does not grow back — catching wear early prevents bigger problems later.',
    },
    {
      title: 'Crowding tendency',
      severity: 'Low',
      summary: 'Mild overlap patterns suggest possible future alignment shift.',
      detail: 'Small overlap cues are very common and often stable for years, but worth tracking.',
      whyItMatters: 'Crowding can make cleaning harder and may shift slowly if left unmonitored.',
    },
  ],
  actions: [
    {
      title: 'Check your bite in a mirror',
      description: 'Stand in front of a mirror, relax your jaw, and bite down gently. Notice if one side touches before the other or if your midline is off-centre. Take a photo for comparison.',
      urgency: 'today',
    },
    {
      title: 'Book a routine dental check-up',
      description: 'Mention bite balance and any clenching or grinding to your dentist. A quick bite assessment takes under 5 minutes and gives you a professional baseline.',
      urgency: 'this-week',
    },
    {
      title: 'Start the jaw exercise routine',
      description: 'The Exercises tab has 5 guided jaw exercises that take under 10 minutes a day. Regular practice supports muscle balance and can reduce tension from asymmetric use.',
      urgency: 'this-month',
    },
  ],
  disclaimer: 'Educational prototype only — not a medical diagnosis.',
}

function shouldUseDemoFallback(message: string, status?: number) {
  const n = message.toLowerCase()
  return (
    status === 429 || status === 502 || status === 503 || status === 504 ||
    n.includes('quota') || n.includes('rate limit') || n.includes('too many requests') ||
    n.includes('toomanyrequests') || n.includes('exceeded your current quota') ||
    n.includes('free_tier') || n.includes('service unavailable') || n.includes('failed to fetch')
  )
}

function getConfidenceMeta(confidence: AnalysisResult['confidence']) {
  if (confidence === 'high') return { label: 'Clear visual signal', score: 3, badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700', panelClassName: 'border-emerald-200 bg-emerald-50/80' }
  if (confidence === 'medium') return { label: 'Moderate visual signal', score: 2, badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700', panelClassName: 'border-amber-200 bg-amber-50/80' }
  return { label: 'Subtle visual signal', score: 1, badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700', panelClassName: 'border-slate-200 bg-slate-50/80' }
}

function getSeverityMeta(severity: string) {
  const n = severity.toLowerCase()
  if (n.includes('watch')) return { score: 3, badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700', dotClassName: 'bg-rose-500', panelClassName: 'border-rose-200 bg-rose-50/80', icon: TriangleAlert }
  if (n.includes('early')) return { score: 2, badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700', dotClassName: 'bg-amber-500', panelClassName: 'border-amber-200 bg-amber-50/80', icon: Radar }
  return { score: 1, badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700', dotClassName: 'bg-cyan-500', panelClassName: 'border-cyan-200 bg-cyan-50/80', icon: CheckCircle2 }
}

function severityToNumeric(s: string) {
  const n = s.toLowerCase()
  if (n.includes('watch')) return 82
  if (n.includes('early')) return 64
  return 36
}

function confidenceToNumeric(c: AnalysisResult['confidence']) {
  if (c === 'high') return 88
  if (c === 'medium') return 68
  return 45
}

function clampScore(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }

function buildScoreSummary(result: AnalysisResult): ScoreSummary {
  const [s, w, c] = result.insights
  const dimensions: ScoreDimension[] = [
    { label: 'Symmetry', score: severityToNumeric(s?.severity || 'low'), summary: s?.summary || 'No clear imbalance found.', toneClassName: 'bg-cyan-500' },
    { label: 'Wear', score: severityToNumeric(w?.severity || 'low'), summary: w?.summary || 'No strong wear cue found.', toneClassName: 'bg-rose-500' },
    { label: 'Crowding', score: severityToNumeric(c?.severity || 'low'), summary: c?.summary || 'No strong crowding tendency found.', toneClassName: 'bg-amber-500' },
  ]
  const confidenceScore = confidenceToNumeric(result.confidence)
  const overall = clampScore(dimensions[0].score * 0.4 + dimensions[1].score * 0.35 + dimensions[2].score * 0.25 + (confidenceScore - 60) * 0.15)
  if (overall >= 70) return { overall, label: 'Clear issue pattern', action: 'Worth explaining carefully and encouraging professional follow-up.', confidenceScore, dimensions }
  if (overall >= 45) return { overall, label: 'Moderate watch signal', action: 'A gentle early-warning signal — worth monitoring and acting on.', confidenceScore, dimensions }
  return { overall, label: 'Subtle visible pattern', action: 'A low-pressure watch item — keep scanning monthly to track any changes.', confidenceScore, dimensions }
}

function scoreDeltaLabel(current: number, previous: number) {
  const delta = current - previous
  if (Math.abs(delta) < 4) return { title: 'Looks similar to the last saved scan', detail: 'The visible signal level is staying in a similar range.' }
  if (delta > 0) return { title: `Up ${delta} points from the last saved scan`, detail: 'This scan looks a bit more pronounced than the previous saved result.' }
  return { title: `Down ${Math.abs(delta)} points from the last saved scan`, detail: 'This scan looks slightly gentler than the previous saved result.' }
}

function formatHistoryDate(ts: number) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(ts)
}

function buildConsultationNotes(result: AnalysisResult, scoreSummary: ScoreSummary) {
  return [
    'BiteReveal consultation notes',
    '',
    `Overall signal score: ${scoreSummary.overall}/100`,
    `Confidence: ${result.confidence}`,
    '',
    'Main findings:',
    ...result.insights.map((i, idx) => `${idx + 1}. ${i.title} (${i.severity}) — ${i.summary}`),
    '',
    'Recommended actions:',
    ...result.actions.map((a, idx) => `${idx + 1}. [${a.urgency}] ${a.title}: ${a.description}`),
    '',
    'Current condition:',
    result.currentVisibleCondition.summary,
    '',
    'Future risk:',
    result.futureRiskSnapshot.summary,
  ].join('\n')
}

async function readCaptureMeta(dataUrl: string, file?: File | null): Promise<CaptureMeta> {
  const inferredMimeType = file?.type || dataUrl.match(/^data:([^;]+);/)?.[1] || 'image/jpeg'
  const sizeKb = file ? Math.round(file.size / 1024) : 0
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, mimeType: inferredMimeType, sizeKb })
    image.onerror = () => resolve({ width: 0, height: 0, mimeType: inferredMimeType, sizeKb })
    image.src = dataUrl
  })
}

function buildCaptureGuidance(meta: CaptureMeta | null): GuidanceItem[] {
  if (!meta) return [
    { label: 'Centre your smile', detail: 'Keep mouth straight and close enough to fill the guide frame.', status: 'watch' },
    { label: 'Use bright light', detail: 'Face a window or bright room so the teeth edge is easy to read.', status: 'watch' },
    { label: 'Use JPG or PNG', detail: 'These formats give the most stable analysis.', status: 'watch' },
  ]
  const minSide = Math.min(meta.width, meta.height)
  const ratio = meta.height === 0 ? 1 : meta.width / meta.height
  return [
    { label: 'Centre your smile', detail: ratio >= 0.75 && ratio <= 1.6 ? 'Framing looks balanced for a front-facing scan.' : 'Try a straighter, more centred photo with less background.', status: ratio >= 0.75 && ratio <= 1.6 ? 'good' : 'watch' },
    { label: 'Image detail', detail: minSide >= 900 ? `Good detail at ${meta.width}×${meta.height}.` : 'Move a little closer or use a sharper photo.', status: minSide >= 900 ? 'good' : 'watch' },
    { label: 'File format', detail: /image\/(jpeg|jpg|png|webp)/.test(meta.mimeType) ? `${meta.mimeType.replace('image/', '').toUpperCase()} — good format.` : 'JPG or PNG works best.', status: /image\/(jpeg|jpg|png|webp)/.test(meta.mimeType) ? 'good' : 'watch' },
  ]
}

function truncateCopy(text: string, max = 96) {
  if (text.length <= max) return text
  const sliced = text.slice(0, max)
  const lastSpace = sliced.lastIndexOf(' ')
  const safeCut = lastSpace > max * 0.6 ? lastSpace : max
  return `${sliced.slice(0, safeCut).trim()}…`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 38
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - score / 100)
  const color = score >= 70 ? '#ef4444' : score >= 45 ? '#f59e0b' : '#10b981'
  const label = score >= 70 ? 'High signal' : score >= 45 ? 'Watch' : 'Low signal'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="mt-[-76px] flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[10px] font-medium text-slate-500">/100</span>
      </div>
      <div className="mt-12 text-xs font-medium" style={{ color }}>{label}</div>
    </div>
  )
}


function RiskTimeline({ risk }: { risk: AnalysisResult['futureRiskSnapshot'] }) {
  const steps = [
    { label: '3 months', text: risk.threeMonths, color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { label: '1 year', text: risk.oneYear, color: 'border-orange-300 bg-orange-50 text-orange-800' },
    { label: '3 years', text: risk.threeYears, color: 'border-rose-300 bg-rose-50 text-rose-800' },
  ]
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.label} className={cn('rounded-[1rem] border p-4', step.color)}>
          <div className="text-xs font-semibold uppercase tracking-[0.15em] opacity-70">{step.label}</div>
          <p className="mt-1 text-sm leading-6">{step.text}</p>
        </div>
      ))}
    </div>
  )
}



function AnalysisOverlay({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem]">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: active ? 0.85 : 0, y: active ? 0 : -20 }} transition={{ duration: 0.5 }}
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/25 to-transparent" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.7 }} className="absolute inset-0">
        <div className="absolute left-[16%] top-[18%] h-[56%] w-px bg-cyan-300/80" />
        <div className="absolute left-1/2 top-[12%] h-[66%] w-px -translate-x-1/2 bg-cyan-200/90" />
        <div className="absolute right-[18%] top-[20%] h-[54%] w-px bg-cyan-300/80" />
        <div className="absolute left-[22%] top-[38%] h-20 w-20 rounded-full border border-amber-300/80 bg-amber-300/15 blur-[1px]" />
        <div className="absolute right-[20%] top-[34%] h-24 w-24 rounded-full border border-rose-300/80 bg-rose-300/15 blur-[1px]" />
        <div className="absolute left-[26%] top-[46%] h-px w-[48%] bg-cyan-200/90" />
        <div className="absolute left-[24%] top-[58%] h-px w-[52%] bg-cyan-200/90" />
      </motion.div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BiteRevealPrototype() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const demoRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('scan')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedMeta, setUploadedMeta] = useState<CaptureMeta | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<DetailView | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null)
  const [consultationCopied, setConsultationCopied] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as ScanHistoryEntry[]
      if (Array.isArray(parsed)) setScanHistory(parsed)
    } catch { /* ignore */ }
  }, [])

  const readiness = useMemo(() => (!uploadedImage ? 20 : !hasAnalyzed ? 55 : 100), [uploadedImage, hasAnalyzed])

  const updateScanHistory = (entry: ScanHistoryEntry) => {
    setCurrentScanId(entry.id)
    setScanHistory((prev) => {
      const next = [entry, ...prev].slice(0, 6)
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const onUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const nextImage = String(reader.result)
      const nextMeta = await readCaptureMeta(nextImage, file)
      setUploadedImage(nextImage); setUploadedMeta(nextMeta)
      setHasAnalyzed(false); setProgress(0); setSelectedDetail(null)
      setAnalysisResult(null); setAnalysisError(null); setAnalysisNotice(null)
      setConsultationCopied(false); setCurrentScanId(null)
    }
    reader.readAsDataURL(file)
  }

  const runAnalysis = async () => {
    try {
      if (!uploadedImage) { setAnalysisError('Please upload a smile photo first.'); return }
      setAnalyzing(true); setHasAnalyzed(false); setProgress(8)
      setAnalysisError(null); setAnalysisNotice(null); setConsultationCopied(false)

      const analysisPromise = fetch(`${apiBaseUrl}/api/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: uploadedImage }),
      })

      for (const step of [22, 39, 57, 76, 92]) {
        await new Promise((r) => setTimeout(r, 240))
        setProgress(step)
      }

      const response = await analysisPromise
      const payload = (await response.json()) as AnalysisResult | { error: string }

      if (!response.ok || 'error' in payload) {
        const message = 'error' in payload ? payload.error : 'Analysis request failed.'
        if (shouldUseDemoFallback(message, response.status)) {
          setAnalysisResult(fallbackAnalysis)
          setAnalysisNotice('Live AI is unavailable right now. Showing a demo result with your photo.')
          setProgress(100); setHasAnalyzed(true); setSelectedDetail({ type: 'current' })
          updateScanHistory({ id: crypto.randomUUID(), createdAt: Date.now(), imageSrc: uploadedImage, result: fallbackAnalysis, source: 'demo', scoreSummary: buildScoreSummary(fallbackAnalysis) })
          recordScanToday(); return
        }
        throw new Error(message)
      }

      // Patch missing fields from older schema responses
      const result: AnalysisResult = {
        ...fallbackAnalysis,
        ...payload,
        futureRiskSnapshot: { ...fallbackAnalysis.futureRiskSnapshot, ...(payload as AnalysisResult).futureRiskSnapshot },
        actions: (payload as AnalysisResult).actions?.length ? (payload as AnalysisResult).actions : fallbackAnalysis.actions,
      }

      setAnalysisResult(result); setProgress(100); setHasAnalyzed(true); setSelectedDetail({ type: 'current' })
      updateScanHistory({ id: crypto.randomUUID(), createdAt: Date.now(), imageSrc: uploadedImage, result, source: 'live', scoreSummary: buildScoreSummary(result) })
      recordScanToday()
    } catch (error) {
      setProgress(0); setHasAnalyzed(false); setSelectedDetail(null)
      setAnalysisResult(null); setAnalysisNotice(null); setConsultationCopied(false)
      setAnalysisError(error instanceof Error ? error.message : 'Unable to analyse the image right now.')
    } finally { setAnalyzing(false) }
  }

  const resetDemo = () => {
    setUploadedImage(null); setUploadedMeta(null); setAnalyzing(false)
    setHasAnalyzed(false); setProgress(0); setSelectedDetail(null)
    setAnalysisResult(null); setAnalysisError(null); setAnalysisNotice(null)
    setConsultationCopied(false); setCurrentScanId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const returnToUpload = () => { setHasAnalyzed(false); setSelectedDetail(null); setProgress(uploadedImage ? 55 : 20) }
  const returnHome = () => { returnToUpload(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const activeResult = analysisResult ?? fallbackAnalysis
  const scoreSummary = useMemo(() => buildScoreSummary(activeResult), [activeResult])
  const captureGuidance = useMemo(() => buildCaptureGuidance(uploadedMeta), [uploadedMeta])
  const captureReadyCount = captureGuidance.filter((i) => i.status === 'good').length
  const uploadedImageFrameStyle = useMemo(
    () => ({
      aspectRatio: uploadedMeta?.width && uploadedMeta.height ? `${uploadedMeta.width} / ${uploadedMeta.height}` : '4 / 3',
    }),
    [uploadedMeta],
  )
  const confidenceMeta = getConfidenceMeta(activeResult.confidence)
  const effectiveDetail: DetailView = selectedDetail ?? { type: 'current' }
  const selectedInsight = effectiveDetail.type === 'insight' ? activeResult.insights[effectiveDetail.index] : null
  const leadInsight = activeResult.insights[0]
  const currentScanIndex = scanHistory.findIndex((e) => e.id === currentScanId)
  const previousScan = currentScanIndex >= 0 ? scanHistory[currentScanIndex + 1] : scanHistory[0] ?? null
  const historyDelta = previousScan ? scoreDeltaLabel(scoreSummary.overall, previousScan.scoreSummary.overall) : null
  const consultationNotes = useMemo(() => buildConsultationNotes(activeResult, scoreSummary), [activeResult, scoreSummary])
  const readinessMessage = !uploadedImage
    ? 'Start with one clear, front-facing smile photo.'
    : captureReadyCount >= 2
      ? 'Nice. This photo looks good enough for a first scan.'
      : 'You can still try this photo, but brighter light and a closer crop may help.'
  const scanSteps = [
    {
      step: '01',
      title: 'Add a photo',
      description: uploadedImage ? 'Your smile photo is loaded and ready.' : 'Use a recent smile photo with teeth visible.',
      state: uploadedImage ? 'done' : 'current',
    },
    {
      step: '02',
      title: 'Quick quality check',
      description: uploadedMeta ? `${captureReadyCount}/3 checks look good.` : 'We check framing, sharpness, and file type.',
      state: !uploadedImage ? 'upcoming' : captureReadyCount >= 2 ? 'done' : 'current',
    },
    {
      step: '03',
      title: 'See your results',
      description: hasAnalyzed ? 'Your score, timeline, and next steps are ready.' : 'Run the scan for your score and action plan.',
      state: hasAnalyzed ? 'done' : uploadedImage ? 'current' : 'upcoming',
    },
  ] as const
  const photoMetaLabel = uploadedMeta
    ? `${uploadedMeta.width}×${uploadedMeta.height}${uploadedMeta.sizeKb ? ` · ${uploadedMeta.sizeKb} KB` : ''}`
    : 'No photo yet'
  const scanButtonLabel = !uploadedImage ? 'Choose a photo first' : analyzing ? 'Analysing...' : 'Run my scan'
  const resultSource = analysisNotice?.toLowerCase().includes('demo')
    ? { label: 'Demo result', detail: 'Fallback summary', badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700' }
    : analysisNotice
      ? { label: 'Saved result', detail: 'Loaded from history', badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700' }
      : { label: 'Live result', detail: 'Generated from this photo', badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700' }

  const openHistoryScan = async (entry: ScanHistoryEntry) => {
    const nextMeta = await readCaptureMeta(entry.imageSrc)
    setUploadedImage(entry.imageSrc); setUploadedMeta(nextMeta); setAnalysisResult(entry.result)
    setHasAnalyzed(true); setAnalyzing(false); setProgress(100)
    setSelectedDetail(null); setAnalysisError(null)
    setAnalysisNotice(entry.source === 'demo' ? 'Saved demo scan loaded.' : 'Saved scan loaded.')
    setCurrentScanId(entry.id); setActiveTab('scan')
  }

  const copyConsultationNotes = async () => {
    try { await navigator.clipboard.writeText(consultationNotes); setConsultationCopied(true) }
    catch { /* ignore */ }
  }



  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-14">

          {/* ── HERO ── */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-cyan-700">
                Friendly first scan · Educational prototype
              </Badge>
              <StreakBadge />
            </div>

            <div className="space-y-5">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm text-slate-600 shadow-sm">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  One photo, one quick scan, clear next steps
                </div>
                <h1 className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                  Understand your bite.<br />
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                    Without guessing what to do next.
                  </span>
                </h1>
                <p className="max-w-3xl text-xl leading-8 text-slate-500">
                  Upload a clear smile photo and get a simple read on bite balance, visible wear, and what to watch over time. The goal is to make your first scan feel calm, fast, and easy to understand.
                </p>
                <p className="text-sm font-medium text-slate-500">
                  Takes about 30 seconds. Works with a regular phone photo. Gives you a plain-language action plan.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-2xl px-6 py-3 text-base"
                    onClick={() => { demoRef.current?.scrollIntoView({ behavior: 'smooth' }); setActiveTab('scan') }}
                  >
                    Start my first scan <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" className="rounded-2xl px-6 py-3 text-base"
                    onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Jump to the scanner
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div>
                    <div className="text-sm font-semibold text-cyan-700">Before you scan</div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Keep it simple.</div>
                    <div className="mt-5 space-y-3">
                      {[
                        { icon: Camera, title: 'A clear smile photo', desc: 'Front-facing, well lit, and close enough that your teeth are easy to see.' },
                        { icon: ScanLine, title: 'About 30 seconds', desc: 'Upload your image, run the scan, then review the explanation at your own pace.' },
                        { icon: CheckCircle2, title: 'A learning mindset', desc: 'This helps you spot patterns and plan next steps. It is not a diagnosis.' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.title} className="flex items-start gap-3 rounded-[1.15rem] bg-slate-50 px-4 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 ring-1 ring-slate-200">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{item.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 rounded-[1.15rem] border border-amber-200 bg-amber-50/80 p-3.5 text-sm text-amber-900">
                      If you have pain, swelling, or a dental emergency, skip the scan and contact a clinician directly.
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-cyan-700">How it works</div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">One simple flow, one useful result.</div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                      Add a clear smile photo, let the scan read visible bite patterns, then review one result page with a summary, timeline, and next steps.
                    </p>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      {[
                        { step: '01', icon: Upload, title: 'Add a smile photo', desc: 'Take or choose a front-facing photo with teeth visible.' },
                        { step: '02', icon: ScanLine, title: 'Run the scan', desc: 'The model checks visible asymmetry, wear cues, and crowding patterns.' },
                        { step: '03', icon: CheckCircle2, title: 'Review next steps', desc: 'See one clear summary with a timeline and action plan.' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.step} className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="text-sm font-semibold text-cyan-700">Step {item.step}</div>
                            </div>
                            <div className="mt-4 text-base font-semibold text-slate-900">{item.title}</div>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      {[
                        { icon: Eye, label: 'Visual summary' },
                        { icon: TrendingUp, label: 'Timeline view' },
                        { icon: Shield, label: 'Action plan' },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-cyan-700 ring-1 ring-slate-200">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-sm font-medium text-slate-700">{item.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PROTOTYPE CARD ── */}
          <div ref={demoRef}>
            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 shadow-lg shadow-slate-200/50">
              <CardHeader className="border-b border-slate-100 bg-white/70 backdrop-blur">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanLine className="h-5 w-5" /> Your bite scan
                </CardTitle>
                <CardDescription>
                  {activeTab === 'scan' ? (!hasAnalyzed ? 'Follow the steps below and we will guide you through the first scan.' : 'Your results are ready. Explore each section below.') : TABS.find((t) => t.id === activeTab)?.label}
                </CardDescription>
                <div className="mt-3 -mx-1 overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-1.5 px-1">
                    {TABS.map((tab) => (
                      <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                        className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                          activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                      >
                        {tab.icon} {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-7 p-5 md:p-7 lg:p-8">
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />

                {/* ── SCAN TAB ── */}
                {activeTab === 'scan' && (
                  <AnimatePresence mode="wait" initial={false}>
                    {!hasAnalyzed ? (
                      /* Upload step */
                      <motion.div key="upload" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="space-y-6"
                      >
                        <div className="grid gap-3 md:grid-cols-3">
                          {scanSteps.map((item) => (
                            <div
                              key={item.step}
                              className={cn(
                                'rounded-[1.25rem] border p-4 transition',
                                item.state === 'done'
                                  ? 'border-emerald-200 bg-emerald-50/80'
                                  : item.state === 'current'
                                    ? 'border-cyan-200 bg-cyan-50/80'
                                    : 'border-slate-200 bg-slate-50',
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold',
                                  item.state === 'done'
                                    ? 'bg-emerald-600 text-white'
                                    : item.state === 'current'
                                      ? 'bg-cyan-600 text-white'
                                      : 'bg-white text-slate-500 ring-1 ring-slate-200',
                                )}>
                                  {item.state === 'done' ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.14fr)_minmax(380px,0.86fr)] xl:gap-8">
                          <div className="space-y-4">
                            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-cyan-700">Step 1</div>
                                  <div className="mt-1 text-xl font-semibold text-slate-950">Choose a smile photo</div>
                                  <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Use a front-facing photo with your teeth visible. A bright selfie or a recent camera roll image both work well.
                                  </p>
                                </div>
                                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{photoMetaLabel}</Badge>
                              </div>

                              <button type="button"
                                className="group relative mt-5 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-white transition hover:border-cyan-300 hover:bg-cyan-50/40"
                                style={uploadedImageFrameStyle}
                                onClick={() => inputRef.current?.click()}
                              >
                                {uploadedImage && <img src={uploadedImage} alt="Uploaded smile" className="h-full w-full object-cover" />}
                                {!uploadedImage && (
                                  <>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef5fb_100%)]" />
                                    <div className="absolute inset-0 flex items-center justify-center p-8">
                                      <div className="max-w-sm space-y-3 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200">
                                          <Upload className="h-5 w-5" />
                                        </div>
                                        <div className="text-lg font-semibold text-slate-900">Tap to upload a photo</div>
                                        <p className="text-sm leading-6 text-slate-500">Keep the smile centred, use bright light, and avoid heavy shadows.</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                {uploadedImage && (
                                  <>
                                    <div className="pointer-events-none absolute inset-4 rounded-[1.2rem] border border-white/70 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]" />
                                    <div className="pointer-events-none absolute inset-x-[22%] top-[16%] h-10 rounded-full border border-cyan-200/80 bg-cyan-100/20" />
                                    <div className="pointer-events-none absolute left-1/2 top-[18%] h-[56%] w-px -translate-x-1/2 bg-white/70" />
                                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">Photo loaded</div>
                                  </>
                                )}
                                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                                  <Upload className="h-3.5 w-3.5" /> {uploadedImage ? 'Replace photo' : 'Choose photo'}
                                </div>
                              </button>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <Button className="h-11 rounded-[1rem]" variant="outline" onClick={() => inputRef.current?.click()}>
                                  <Camera className="h-4 w-4" /> {uploadedImage ? 'Replace photo' : 'Choose photo'}
                                </Button>
                                <Button className="h-11 rounded-[1rem]" variant="outline" onClick={resetDemo}>
                                  <RefreshCw className="h-4 w-4" /> Clear
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                  <span className="font-medium text-slate-800">Scan readiness</span>
                                  <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-500 ring-1 ring-slate-200">{readiness}%</span>
                                </div>
                                <Progress value={readiness} />
                                <p className="mt-3 text-sm leading-6 text-slate-500">{readinessMessage}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {captureGuidance.map((item) => (
                                    <div
                                      key={item.label}
                                      className={cn(
                                        'rounded-full px-3 py-1 text-xs font-medium ring-1',
                                        item.status === 'good'
                                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                          : 'bg-amber-50 text-amber-700 ring-amber-200',
                                      )}
                                    >
                                      {item.label}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-sm font-medium text-slate-700">This works best with</div>
                                <div className="mt-3 grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-1">
                                  {[
                                    'A straight-on smile',
                                    'Bright natural or overhead light',
                                    'A close crop with teeth visible',
                                  ].map((tip) => (
                                    <div key={tip} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      <span>{tip}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-cyan-700">Step 2</div>
                                  <div className="mt-1 text-xl font-semibold text-slate-900">Check the photo quality</div>
                                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">These checks help the scan read the image more reliably. If one item is marked watch, you can still continue, but improving it usually gives you a clearer first result.</p>
                                </div>
                                <Badge className="border-slate-200 bg-slate-100 text-slate-700">{captureReadyCount}/3 ready</Badge>
                              </div>
                              <div className="mt-4 rounded-[1.15rem] border border-cyan-100 bg-cyan-50/70 p-4">
                                <div className="text-sm font-semibold text-cyan-900">What we check</div>
                                <p className="mt-1 text-sm leading-6 text-cyan-900/80">Framing makes sure the smile is centered, image detail helps the AI see tooth edges clearly, and file type keeps the upload stable.</p>
                              </div>
                              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                                {captureGuidance.map((item) => (
                                  <div
                                    key={item.label}
                                    className={cn(
                                      'rounded-[1.1rem] border p-4',
                                      item.status === 'good'
                                        ? 'border-emerald-200 bg-emerald-50/60'
                                        : 'border-amber-200 bg-amber-50/70',
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      {item.status === 'good'
                                        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                        : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                                          <Badge className={cn(
                                            'px-2 py-0.5 text-[11px]',
                                            item.status === 'good'
                                              ? 'border-emerald-200 bg-white text-emerald-700'
                                              : 'border-amber-200 bg-white text-amber-700',
                                          )}>
                                            {item.status === 'good' ? 'Looks good' : 'Needs attention'}
                                          </Badge>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-cyan-700">Step 3</div>
                                  <div className="mt-1 text-lg font-semibold text-slate-900">Run your bite scan</div>
                                  <p className="mt-1 text-sm text-slate-500">You will get a score, visual explanation, future timeline, and suggested next steps.</p>
                                </div>
                                <Button className="min-w-[12rem]" onClick={runAnalysis} disabled={analyzing || !uploadedImage}>
                                  {analyzing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analysing...</> : <>{scanButtonLabel} <ArrowRight className="h-4 w-4" /></>}
                                </Button>
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                {[
                                  { icon: Eye, label: 'Visual summary' },
                                  { icon: TrendingUp, label: 'Risk timeline' },
                                  { icon: Sparkles, label: 'Clear action plan' },
                                ].map((item) => {
                                  const Icon = item.icon
                                  return (
                                    <div key={item.label} className="flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                                      <Icon className="h-4 w-4 text-cyan-600" />
                                      <span>{item.label}</span>
                                    </div>
                                  )
                                })}
                              </div>

                              <AnimatePresence initial={false}>
                                {analyzing && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="mt-5 space-y-3">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Reading visible bite signals...</span>
                                        <span className="font-medium text-slate-700">{progress}%</span>
                                      </div>
                                      <Progress value={progress} />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {!uploadedImage && (
                                <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                  Add a photo first and the scan button will unlock automatically.
                                </div>
                              )}
                            </div>

                            {analysisError && (
                              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                <div className="font-medium">We could not finish the scan yet</div>
                                <p className="mt-1 leading-6">{analysisError}</p>
                              </div>
                            )}

                            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>{(analysisResult ?? fallbackAnalysis).disclaimer}</p>
                              </div>
                            </div>

                            {scanHistory.length > 0 && (
                              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                  <History className="h-4 w-4 text-cyan-700" /> Previous scans
                                </div>
                                <div className="mt-3 space-y-2">
                                  {scanHistory.slice(0, 3).map((entry) => (
                                    <button key={entry.id} type="button"
                                      className="flex w-full items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50"
                                      onClick={() => openHistoryScan(entry)}
                                    >
                                      <img src={entry.imageSrc} alt="" className="h-12 w-12 rounded-xl object-cover" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-sm font-semibold text-slate-900">Score {entry.scoreSummary.overall}</span>
                                          <Badge className="border-slate-200 bg-white text-slate-600">{entry.source === 'demo' ? 'Demo' : 'Live'}</Badge>
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-500">{formatHistoryDate(entry.createdAt)}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* Results step */
                      <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                        {/* ── Score overview bar ── */}
                        <div className="flex flex-wrap items-center gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                          <ScoreRing score={scoreSummary.overall} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xl font-bold text-slate-900">{scoreSummary.label}</div>
                            <p className="mt-0.5 text-sm leading-5 text-slate-500">{scoreSummary.action}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge className={confidenceMeta.badgeClassName}>Confidence: {activeResult.confidence}</Badge>
                              <Badge className={resultSource.badgeClassName}>{resultSource.label}</Badge>
                            </div>
                            {analysisNotice && <p className="mt-1.5 text-xs text-cyan-700">{analysisNotice}</p>}
                          </div>
                          <div className="hidden sm:flex gap-6 border-l border-slate-100 pl-5">
                            {scoreSummary.dimensions.map((d) => (
                              <div key={d.label} className="min-w-[52px] text-center">
                                <div className="text-2xl font-bold tabular-nums text-slate-900">{d.score}</div>
                                <div className="mt-0.5 text-xs font-medium text-slate-500">{d.label}</div>
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                  <div className={cn('h-full rounded-full', d.toneClassName)} style={{ width: `${d.score}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Main layout: photo left (3fr), sidebar right (2fr) ── */}
                        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">

                          {/* Photo + detail panel */}
                          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                            <div className="relative bg-slate-100" style={uploadedImageFrameStyle}>
                              <img
                                src={uploadedImage ?? ''}
                                alt={effectiveDetail.type === 'future' ? 'Projected condition' : 'Current condition'}
                                className="h-full w-full object-cover"
                              />
                              {effectiveDetail.type === 'future' && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/25 via-transparent to-amber-400/25" />
                                  <div className="absolute inset-x-0 bottom-0 p-5">
                                    <div className="rounded-[1rem] border border-white/15 bg-black/50 p-4 text-white backdrop-blur">
                                      <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">{activeResult.futureRiskSnapshot.projectionLabel}</div>
                                      <p className="mt-1 text-sm leading-6 text-slate-200">{activeResult.futureRiskSnapshot.summary}</p>
                                    </div>
                                  </div>
                                </>
                              )}
                              <AnalysisOverlay active={effectiveDetail.type === 'current'} />
                            </div>

                            <div className="p-5 space-y-4">
                              {/* Current condition */}
                              {effectiveDetail.type === 'current' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-700">What the AI sees right now</div>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">{activeResult.currentVisibleCondition.summary}</p>
                                  </div>
                                  <div className="space-y-2">
                                    {activeResult.currentVisibleCondition.focusPoints.map((point, i) => {
                                      const styles = ['border-cyan-200 bg-cyan-50/80', 'border-amber-200 bg-amber-50/80', 'border-rose-200 bg-rose-50/80']
                                      const icons = ['bg-cyan-600', 'bg-amber-500', 'bg-rose-500']
                                      return (
                                        <div key={point} className={cn('rounded-[0.9rem] border p-3', styles[i] || 'border-slate-200 bg-white')}>
                                          <div className="flex items-start gap-2.5">
                                            <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white', icons[i] || 'bg-slate-700')}>{i + 1}</div>
                                            <p className="text-sm leading-6 text-slate-800">{point}</p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Future risk */}
                              {effectiveDetail.type === 'future' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold text-slate-900">If nothing changes…</div>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">{activeResult.futureRiskSnapshot.summary}</p>
                                  </div>
                                  <RiskTimeline risk={activeResult.futureRiskSnapshot} />
                                </div>
                              )}

                              {/* Insight detail */}
                              {selectedInsight && (() => {
                                const sm = getSeverityMeta(selectedInsight.severity)
                                const SeverityIcon = sm.icon
                                return (
                                  <div className="space-y-4">
                                    <div className={cn('rounded-[1.25rem] border p-5', sm.panelClassName)}>
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                                          <SeverityIcon className="h-4 w-4 text-slate-900" />
                                        </div>
                                        <Badge className={sm.badgeClassName}>{selectedInsight.severity}</Badge>
                                      </div>
                                      <div className="mt-3 text-lg font-semibold text-slate-950">{selectedInsight.title}</div>
                                      <p className="mt-1.5 text-sm leading-7 text-slate-600">{selectedInsight.detail}</p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">What the AI noticed</div>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">{selectedInsight.summary}</p>
                                      </div>
                                      <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-4">
                                        <div className="text-sm font-semibold text-slate-900">Why this matters</div>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">{selectedInsight.whyItMatters}</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Right sidebar */}
                          <div className="space-y-3">

                            {/* Top finding */}
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Top finding</div>
                                <Badge className={getSeverityMeta(leadInsight.severity).badgeClassName}>{leadInsight.severity}</Badge>
                              </div>
                              <div className="mt-2 text-base font-semibold text-slate-900">{leadInsight.title}</div>
                              <p className="mt-1.5 text-sm leading-6 text-slate-500">{leadInsight.summary}</p>
                            </div>

                            {/* Explore nav */}
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Explore</div>
                              <div className="space-y-0.5">
                                {([
                                  { key: 'current', label: 'Current photo', badge: undefined },
                                  { key: 'future', label: 'Future risk', badge: undefined },
                                  ...activeResult.insights.map((ins, i) => ({ key: `insight-${i}`, label: ins.title, badge: ins.severity })),
                                ] as { key: string; label: string; badge?: string }[]).map((item) => {
                                  const isActive =
                                    item.key === 'current' ? effectiveDetail.type === 'current'
                                    : item.key === 'future' ? effectiveDetail.type === 'future'
                                    : effectiveDetail.type === 'insight' && effectiveDetail.index === Number(item.key.split('-')[1])
                                  const handleClick = () => {
                                    if (item.key === 'current') setSelectedDetail({ type: 'current' })
                                    else if (item.key === 'future') setSelectedDetail({ type: 'future' })
                                    else setSelectedDetail({ type: 'insight', index: Number(item.key.split('-')[1]) })
                                  }
                                  return (
                                    <button key={item.key} type="button"
                                      className={cn('flex w-full items-center justify-between rounded-[0.85rem] px-3 py-2.5 text-sm transition',
                                        isActive ? 'bg-cyan-50 font-medium text-cyan-800' : 'text-slate-600 hover:bg-slate-50')}
                                      onClick={handleClick}
                                    >
                                      <span>{item.label}</span>
                                      {item.badge
                                        ? <span className="text-xs text-slate-400">{item.badge}</span>
                                        : <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Next steps */}
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Next steps</div>
                              <div className="space-y-3">
                                {activeResult.actions.map((action) => {
                                  const urgencyStyle = {
                                    today: 'bg-rose-100 text-rose-700',
                                    'this-week': 'bg-amber-100 text-amber-700',
                                    'this-month': 'bg-cyan-100 text-cyan-700',
                                  }[action.urgency]
                                  const urgencyLabel = { today: 'Today', 'this-week': 'This week', 'this-month': 'This month' }[action.urgency]
                                  return (
                                    <div key={action.title} className="flex items-start gap-2.5">
                                      <span className={cn('mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', urgencyStyle)}>{urgencyLabel}</span>
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{action.title}</div>
                                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{truncateCopy(action.description, 90)}</p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Benchmark */}
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
                              <BenchmarkBar score={scoreSummary.overall} />
                            </div>

                            {/* AI Coaching */}
                            <CoachingPanel result={activeResult} scoreSummary={scoreSummary} apiBaseUrl={apiBaseUrl} />

                            {/* Share + consult */}
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                              <ShareCard result={activeResult} scoreSummary={scoreSummary} imageSrc={uploadedImage} />
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={copyConsultationNotes}>
                                  <Copy className="h-3.5 w-3.5" /> {consultationCopied ? 'Copied!' : 'Copy notes'}
                                </Button>
                                <Button variant="outline" size="sm" onClick={resetDemo}>
                                  <RefreshCw className="h-3.5 w-3.5" /> New scan
                                </Button>
                              </div>
                            </div>

                            {previousScan && historyDelta && (
                              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  <History className="h-3.5 w-3.5" /> vs. last scan
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{historyDelta.title}</div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{historyDelta.detail}</p>
                                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openHistoryScan(previousScan)}>Open previous scan</Button>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" onClick={returnHome}><House className="h-4 w-4" /> Home</Button>
                              <Button variant="outline" onClick={resetDemo}><RefreshCw className="h-4 w-4" /> New scan</Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {activeTab === 'timeline' && <ProgressTimeline scanHistory={scanHistory} />}
                {activeTab === 'compare' && <BeforeAfterComparison currentImage={uploadedImage} />}
                {activeTab === 'exercises' && <JawExerciseLibrary />}
                {activeTab === 'lifestyle' && <LifestyleCorrelation scanHistory={scanHistory} />}
                {activeTab === 'explain' && <RiskExplainer />}
                {activeTab === 'report' && <WeeklyReport apiBaseUrl={apiBaseUrl} scanHistory={scanHistory} />}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
