import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronRight,
  Eye,
  History,
  Radar,
  RefreshCw,
  ScanLine,
  Shield,
  Sparkles,
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

type AnalysisInsight = {
  title: string
  severity: string
  summary: string
  detail: string
  whyItMatters: string
}

type AnalysisResult = {
  confidence: 'low' | 'medium' | 'high'
  currentVisibleCondition: {
    title: string
    summary: string
    focusPoints: string[]
  }
  futureRiskSnapshot: {
    title: string
    projectionLabel: string
    summary: string
    riskPoints: string[]
  }
  insights: AnalysisInsight[]
  disclaimer: string
}

type CaptureMeta = {
  width: number
  height: number
  mimeType: string
  sizeKb: number
}

type GuidanceItem = {
  label: string
  detail: string
  status: 'good' | 'watch'
}

type ScoreDimension = {
  label: string
  score: number
  summary: string
  toneClassName: string
}

type ScoreSummary = {
  overall: number
  label: string
  action: string
  confidenceScore: number
  dimensions: ScoreDimension[]
}

type ScanHistoryEntry = {
  id: string
  createdAt: number
  imageSrc: string
  result: AnalysisResult
  source: 'live' | 'demo'
  scoreSummary: ScoreSummary
}

const fallbackAnalysis: AnalysisResult = {
  confidence: 'medium',
  currentVisibleCondition: {
    title: 'Current visible condition',
    summary: 'Mild asymmetry cues may already be visible from the front view.',
    focusPoints: [
      'Small midline imbalance',
      'Visible tooth-edge alignment differences',
      'Early shift may already be noticeable',
    ],
  },
  futureRiskSnapshot: {
    title: 'Future risk snapshot',
    projectionLabel: '3-year projection',
    summary:
      'If unchanged, asymmetry and uneven contact may become more visible over time.',
    riskPoints: [
      'Uneven contact may become more obvious',
      'Front edge wear may show earlier',
      'Future impact becomes easier to notice visually',
    ],
  },
  insights: [
    {
      title: 'Minor bite asymmetry',
      severity: 'Early',
      summary:
        'Slight left-right imbalance detected from visible tooth alignment cues.',
      detail:
        'The visible center balance appears slightly off, which can be a useful early visual flag in a screening-style experience.',
      whyItMatters:
        'Showing this clearly helps users understand the idea of subtle bite imbalance before symptoms become obvious.',
    },
    {
      title: 'Potential uneven wear',
      severity: 'Watch',
      summary:
        'Front teeth edges may be experiencing uneven contact over time.',
      detail:
        'The front edge line suggests contact may not be evenly distributed, which is worth surfacing as a watch item.',
      whyItMatters:
        'Wear risk is a strong educational cue because it connects a visible image to a possible long-term effect.',
    },
    {
      title: 'Crowding tendency',
      severity: 'Low',
      summary:
        'Mild overlap patterns suggest possible future alignment shift.',
      detail:
        'Small overlap cues can make the result feel more forward-looking without overstating certainty.',
      whyItMatters:
        'This gives the prototype a gentler, lower-severity insight that rounds out the overall result set.',
    },
  ],
  disclaimer: 'Demo only. This is a concept view, not a diagnosis.',
}
const HISTORY_STORAGE_KEY = 'bitereveal-scan-history-v1'

type DetailView =
  | { type: 'current' }
  | { type: 'future' }
  | { type: 'insight'; index: number }

function shouldUseDemoFallback(message: string, status?: number) {
  const normalized = message.toLowerCase()

  return (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('toomanyrequests') ||
    normalized.includes('exceeded your current quota') ||
    normalized.includes('free_tier') ||
    normalized.includes('service unavailable') ||
    normalized.includes('failed to fetch')
  )
}

function getConfidenceMeta(confidence: AnalysisResult['confidence']) {
  if (confidence === 'high') {
    return {
      label: 'Clear visual signal',
      score: 3,
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      panelClassName: 'border-emerald-200 bg-emerald-50/80',
    }
  }

  if (confidence === 'medium') {
    return {
      label: 'Moderate visual signal',
      score: 2,
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      panelClassName: 'border-amber-200 bg-amber-50/80',
    }
  }

  return {
    label: 'Subtle visual signal',
    score: 1,
    badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    panelClassName: 'border-slate-200 bg-slate-50/80',
  }
}

function getSeverityMeta(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized.includes('watch')) {
    return {
      score: 3,
      badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
      dotClassName: 'bg-rose-500',
      panelClassName: 'border-rose-200 bg-rose-50/80',
      icon: TriangleAlert,
    }
  }

  if (normalized.includes('early')) {
    return {
      score: 2,
      badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      dotClassName: 'bg-amber-500',
      panelClassName: 'border-amber-200 bg-amber-50/80',
      icon: Radar,
    }
  }

  return {
    score: 1,
    badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    dotClassName: 'bg-cyan-500',
    panelClassName: 'border-cyan-200 bg-cyan-50/80',
    icon: CheckCircle2,
  }
}

function severityToNumeric(severity: string) {
  const normalized = severity.toLowerCase()

  if (normalized.includes('watch')) return 82
  if (normalized.includes('early')) return 64
  return 36
}

function confidenceToNumeric(confidence: AnalysisResult['confidence']) {
  if (confidence === 'high') return 88
  if (confidence === 'medium') return 68
  return 45
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function buildScoreSummary(result: AnalysisResult): ScoreSummary {
  const [symmetryInsight, wearInsight, crowdingInsight] = result.insights

  const dimensions: ScoreDimension[] = [
    {
      label: 'Symmetry',
      score: severityToNumeric(symmetryInsight?.severity || 'low'),
      summary:
        symmetryInsight?.summary ||
        'No clear left-right imbalance was highlighted in this scan.',
      toneClassName: 'bg-cyan-500',
    },
    {
      label: 'Wear',
      score: severityToNumeric(wearInsight?.severity || 'low'),
      summary:
        wearInsight?.summary ||
        'No strong uneven wear cue was surfaced in this scan.',
      toneClassName: 'bg-rose-500',
    },
    {
      label: 'Crowding',
      score: severityToNumeric(crowdingInsight?.severity || 'low'),
      summary:
        crowdingInsight?.summary ||
        'No strong crowding tendency was surfaced in this scan.',
      toneClassName: 'bg-amber-500',
    },
  ]

  const confidenceScore = confidenceToNumeric(result.confidence)
  const overall = clampScore(
    dimensions[0].score * 0.4 +
      dimensions[1].score * 0.35 +
      dimensions[2].score * 0.25 +
      (confidenceScore - 60) * 0.15,
  )

  if (overall >= 70) {
    return {
      overall,
      label: 'Clear issue pattern',
      action: 'Worth explaining carefully and encouraging follow-up.',
      confidenceScore,
      dimensions,
    }
  }

  if (overall >= 45) {
    return {
      overall,
      label: 'Moderate watch signal',
      action: 'Useful as an early-warning result with a gentle prompt to check in.',
      confidenceScore,
      dimensions,
    }
  }

  return {
    overall,
    label: 'Subtle visible pattern',
    action: 'Best framed as a low-pressure watch item rather than an urgent issue.',
    confidenceScore,
    dimensions,
  }
}

function scoreDeltaLabel(current: number, previous: number) {
  const delta = current - previous

  if (Math.abs(delta) < 4) {
    return {
      title: 'Looks similar to the last saved scan',
      detail: 'The visible signal level is staying in a similar range.',
    }
  }

  if (delta > 0) {
    return {
      title: `Up ${delta} points from the last saved scan`,
      detail: 'This scan looks a bit more pronounced than the previous saved result.',
    }
  }

  return {
    title: `Down ${Math.abs(delta)} points from the last saved scan`,
    detail: 'This scan looks slightly gentler than the previous saved result.',
  }
}

function formatHistoryDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

async function readCaptureMeta(dataUrl: string, file: File): Promise<CaptureMeta> {
  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        mimeType: file.type || 'image/jpeg',
        sizeKb: Math.round(file.size / 1024),
      })
    }

    image.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        mimeType: file.type || 'image/jpeg',
        sizeKb: Math.round(file.size / 1024),
      })
    }

    image.src = dataUrl
  })
}

function buildCaptureGuidance(meta: CaptureMeta | null): GuidanceItem[] {
  if (!meta) {
    return [
      {
        label: 'Center the smile',
        detail: 'Keep the mouth straight and close enough to fill the guide frame.',
        status: 'watch',
      },
      {
        label: 'Use bright light',
        detail: 'Face a window or bright room so teeth edges are easier to read.',
        status: 'watch',
      },
      {
        label: 'Use a clean format',
        detail: 'JPG or PNG works best for a stable analysis pass.',
        status: 'watch',
      },
    ]
  }

  const minSide = Math.min(meta.width, meta.height)
  const ratio = meta.height === 0 ? 1 : meta.width / meta.height

  return [
    {
      label: 'Center the smile',
      detail:
        ratio >= 0.75 && ratio <= 1.6
          ? 'Framing looks balanced enough for a front-facing scan.'
          : 'Try a straighter front-facing photo with less tilt and less background.',
      status: ratio >= 0.75 && ratio <= 1.6 ? 'good' : 'watch',
    },
    {
      label: 'Use bright detail',
      detail:
        minSide >= 900
          ? `The image has enough visible detail at ${meta.width} x ${meta.height}.`
          : 'Move a little closer or use a sharper photo so the front teeth are clearer.',
      status: minSide >= 900 ? 'good' : 'watch',
    },
    {
      label: 'Use a stable file',
      detail:
        /image\/(jpeg|jpg|png|webp)/.test(meta.mimeType)
          ? `${meta.mimeType.replace('image/', '').toUpperCase()} is a good upload format for this prototype.`
          : 'JPG or PNG will be the most reliable format for this prototype.',
      status: /image\/(jpeg|jpg|png|webp)/.test(meta.mimeType) ? 'good' : 'watch',
    },
  ]
}

function ResultMeter({
  score,
  activeClassName,
}: {
  score: number
  activeClassName: string
}) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'h-2 flex-1 rounded-full bg-white/70 ring-1 ring-slate-200',
            index < score && activeClassName,
          )}
        />
      ))}
    </div>
  )
}

function DetailNavCard({
  title,
  subtitle,
  active,
  onClick,
  badge,
}: {
  title: string
  subtitle: string
  active: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        'w-full rounded-[1.15rem] border p-4 text-left transition',
        active
          ? 'border-cyan-300 bg-cyan-50 shadow-sm shadow-cyan-100'
          : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/40',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</div>
        </div>
        <div className="shrink-0">
          {badge ? (
            <Badge className="border-slate-200 bg-white/80 text-slate-700">
              {badge}
            </Badge>
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>
    </button>
  )
}

function AnalysisOverlay({ active }: { active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: active ? 0.85 : 0, y: active ? 0 : -20 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/25 to-transparent"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.7 }}
        className="absolute inset-0"
      >
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

export default function BiteRevealPrototype() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedMeta, setUploadedMeta] = useState<CaptureMeta | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<DetailView | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

  useEffect(() => {
    try {
      const rawHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!rawHistory) return

      const parsedHistory = JSON.parse(rawHistory) as ScanHistoryEntry[]
      if (Array.isArray(parsedHistory)) {
        setScanHistory(parsedHistory)
      }
    } catch (error) {
      console.error('Unable to load scan history:', error)
    }
  }, [])

  const readiness = useMemo(() => {
    if (!uploadedImage) return 20
    if (!hasAnalyzed) return 55
    return 100
  }, [uploadedImage, hasAnalyzed])

  const updateScanHistory = (entry: ScanHistoryEntry) => {
    setCurrentScanId(entry.id)
    setScanHistory((previousHistory) => {
      const nextHistory = [entry, ...previousHistory].slice(0, 6)
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory))
      return nextHistory
    })
  }

  const onUpload = (file?: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const nextImage = String(reader.result)
      const nextMeta = await readCaptureMeta(nextImage, file)

      setUploadedImage(nextImage)
      setUploadedMeta(nextMeta)
      setHasAnalyzed(false)
      setProgress(0)
      setSelectedDetail(null)
      setAnalysisResult(null)
      setAnalysisError(null)
      setAnalysisNotice(null)
      setCurrentScanId(null)
    }
    reader.readAsDataURL(file)
  }

  const runAnalysis = async () => {
    try {
      if (!uploadedImage) {
        setAnalysisError('Please upload a smile photo before running the analysis.')
        return
      }

      setAnalyzing(true)
      setHasAnalyzed(false)
      setProgress(8)
      setAnalysisError(null)
      setAnalysisNotice(null)

      const analysisPromise = fetch(`${apiBaseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: uploadedImage,
        }),
      })

      const steps = [22, 39, 57, 76, 92]
      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 240))
        setProgress(step)
      }

      const response = await analysisPromise
      const payload = (await response.json()) as AnalysisResult | { error: string }

      if (!response.ok || 'error' in payload) {
        const message =
          'error' in payload ? payload.error : 'Analysis request failed.'

        if (shouldUseDemoFallback(message, response.status)) {
          setAnalysisResult(fallbackAnalysis)
          setAnalysisNotice(
            'Live AI is unavailable right now, so this view is showing demo results with your uploaded photo.',
          )
          setProgress(100)
          setHasAnalyzed(true)
          setSelectedDetail({ type: 'current' })
          updateScanHistory({
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            imageSrc: uploadedImage,
            result: fallbackAnalysis,
            source: 'demo',
            scoreSummary: buildScoreSummary(fallbackAnalysis),
          })
          return
        }

        throw new Error(message)
      }

      setAnalysisResult(payload)
      setProgress(100)
      setHasAnalyzed(true)
      setSelectedDetail({ type: 'current' })
      updateScanHistory({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        imageSrc: uploadedImage,
        result: payload,
        source: 'live',
        scoreSummary: buildScoreSummary(payload),
      })
    } catch (error) {
      setProgress(0)
      setHasAnalyzed(false)
      setSelectedDetail(null)
      setAnalysisResult(null)
      setAnalysisNotice(null)
      setAnalysisError(
        error instanceof Error
          ? error.message
          : 'Unable to analyze the image right now.',
      )
    } finally {
      setAnalyzing(false)
    }
  }

  const resetDemo = () => {
    setUploadedImage(null)
    setUploadedMeta(null)
    setAnalyzing(false)
    setHasAnalyzed(false)
    setProgress(0)
    setSelectedDetail(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setAnalysisNotice(null)
    setCurrentScanId(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const returnToUpload = () => {
    setHasAnalyzed(false)
    setSelectedDetail(null)
    setProgress(uploadedImage ? 55 : 20)
  }

  const activeResult = analysisResult ?? fallbackAnalysis
  const scoreSummary = useMemo(
    () => buildScoreSummary(activeResult),
    [activeResult],
  )
  const captureGuidance = useMemo(
    () => buildCaptureGuidance(uploadedMeta),
    [uploadedMeta],
  )
  const captureReadyCount = captureGuidance.filter(
    (item) => item.status === 'good',
  ).length
  const confidenceMeta = getConfidenceMeta(activeResult.confidence)
  const effectiveDetail: DetailView = selectedDetail ?? { type: 'current' }
  const selectedInsight =
    effectiveDetail.type === 'insight'
      ? activeResult.insights[effectiveDetail.index]
      : null
  const leadInsight = activeResult.insights[0]
  const currentScanIndex = scanHistory.findIndex((entry) => entry.id === currentScanId)
  const previousScan =
    currentScanIndex >= 0 ? scanHistory[currentScanIndex + 1] : scanHistory[0] ?? null
  const historyDelta =
    previousScan ? scoreDeltaLabel(scoreSummary.overall, previousScan.scoreSummary.overall) : null

  const openHistoryScan = (entry: ScanHistoryEntry) => {
    setUploadedImage(entry.imageSrc)
    setUploadedMeta(null)
    setAnalysisResult(entry.result)
    setHasAnalyzed(true)
    setAnalyzing(false)
    setProgress(100)
    setSelectedDetail(null)
    setAnalysisError(null)
    setAnalysisNotice(
      entry.source === 'demo'
        ? 'Loaded a saved demo-result scan from progress history.'
        : 'Loaded a saved scan from progress history.',
    )
    setCurrentScanId(entry.id)
  }

  const detailLabel =
    effectiveDetail.type === 'current'
      ? activeResult.currentVisibleCondition.title
      : effectiveDetail.type === 'future'
        ? activeResult.futureRiskSnapshot.title
        : selectedInsight?.title

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-8"
        >
          <div className="space-y-8">
            <Badge className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-cyan-700">
              Early Protection Platform Concept
            </Badge>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                BiteReveal
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-[1.15rem]">
                A simple teeth photo becomes a quick, visual warning for bite
                imbalance, wear risk, and future shift.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">Spot hidden patterns</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Turn subtle issues into visuals people understand fast.
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">Encourage early action</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Create a reason to check in before pain shows up.
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">Keep it approachable</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Use clear storytelling instead of heavy technical language.
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 shadow-lg shadow-slate-200/50">
              <CardHeader className="border-b border-slate-100 bg-white/70 backdrop-blur">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanLine className="h-5 w-5" /> Prototype demo
                </CardTitle>
                <CardDescription>
                  {!hasAnalyzed
                    ? 'Step 1: upload and run the demo.'
                    : 'Step 2: review focused result details.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5 md:p-7">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => onUpload(event.target.files?.[0])}
                />

                <AnimatePresence mode="wait" initial={false}>
                  {!hasAnalyzed ? (
                    <motion.div
                      key="upload-step"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid items-start gap-6 xl:grid-cols-[0.88fr_1.12fr]"
                    >
                      <div className="space-y-4">
                        <button
                          type="button"
                          className="group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-white text-left transition hover:border-cyan-300 hover:bg-cyan-50/40"
                          onClick={() => inputRef.current?.click()}
                        >
                          <img
                            src={uploadedImage ?? ''}
                            alt="Uploaded smile"
                            className="h-full w-full object-cover"
                          />
                          {!uploadedImage && (
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef5fb_100%)]" />
                          )}
                          {!uploadedImage && (
                            <div className="absolute inset-0 flex items-center justify-center p-8">
                              <div className="max-w-sm space-y-3 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200">
                                  <Upload className="h-5 w-5" />
                                </div>
                                <div className="text-lg font-semibold text-slate-900">
                                  Upload a smile photo
                                </div>
                                <p className="text-sm leading-6 text-slate-500">
                                  Use a front-facing JPG or PNG with good light so the teeth line is easier to read.
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                          <div className="pointer-events-none absolute inset-4 rounded-[1.2rem] border border-white/70 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]" />
                          <div className="pointer-events-none absolute inset-x-[22%] top-[16%] h-10 rounded-full border border-cyan-200/80 bg-cyan-100/20" />
                          <div className="pointer-events-none absolute left-1/2 top-[18%] h-[56%] w-px -translate-x-1/2 bg-white/70" />
                          <div className="pointer-events-none absolute inset-x-[24%] bottom-[22%] h-px bg-white/70" />
                          {uploadedImage && (
                            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                              Source image loaded
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                            <Upload className="h-3.5 w-3.5" />
                            Click to choose a smile photo
                          </div>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            className="h-11 rounded-[1rem]"
                            variant="outline"
                            onClick={() => inputRef.current?.click()}
                          >
                            <Camera className="h-4 w-4" /> Choose Image
                          </Button>
                          <Button
                            className="h-11 rounded-[1rem]"
                            variant="outline"
                            onClick={resetDemo}
                          >
                            <RefreshCw className="h-4 w-4" /> Reset
                          </Button>
                        </div>

                        <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Prototype readiness</span>
                            <span className="text-slate-500">{readiness}%</span>
                          </div>
                          <Progress value={readiness} />
                          <div className="text-sm text-slate-500">
                            Upload a photo and run the demo to unlock the results page.
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <Camera className="h-4 w-4 text-cyan-700" />
                            Guided photo capture
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-slate-900">
                              {captureReadyCount}/3 capture checks ready
                            </div>
                            <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                              {uploadedMeta
                                ? `${uploadedMeta.width} x ${uploadedMeta.height}`
                                : 'Waiting for photo'}
                            </Badge>
                          </div>

                          <div className="mt-4 space-y-3">
                            {captureGuidance.map((item) => (
                              <div
                                key={item.label}
                                className="rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {item.label}
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                      {item.detail}
                                    </p>
                                  </div>
                                  <div className="shrink-0">
                                    {item.status === 'good' ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                Step 1
                              </div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">
                                Reveal the analysis
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                This first page is just for upload and scan.
                              </div>
                            </div>
                            <Button
                              className="min-w-[11rem]"
                              onClick={runAnalysis}
                              disabled={analyzing}
                            >
                              {analyzing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  See result page
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </div>

                          <AnimatePresence initial={false}>
                            {analyzing && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-5 space-y-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Analyzing visible bite signals...
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {progress}%
                                    </span>
                                  </div>
                                  <Progress value={progress} />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {analysisError && (
                          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            <div className="font-medium">Analysis failed</div>
                            <p className="mt-1 leading-6">{analysisError}</p>
                          </div>
                        )}

                        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>
                              {(analysisResult ?? fallbackAnalysis).disclaimer}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <History className="h-4 w-4 text-cyan-700" />
                            Progress history
                          </div>
                          <div className="mt-3 text-lg font-semibold text-slate-900">
                            {scanHistory.length === 0
                              ? 'No saved scans yet'
                              : `${scanHistory.length} saved scan${scanHistory.length === 1 ? '' : 's'}`}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Each completed analysis is saved here so users can reopen a scan and compare how the signal changes over time.
                          </p>

                          {scanHistory.length > 0 && (
                            <div className="mt-4 space-y-3">
                              {scanHistory.slice(0, 3).map((entry) => (
                                <button
                                  key={entry.id}
                                  type="button"
                                  className="flex w-full items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50/50"
                                  onClick={() => openHistoryScan(entry)}
                                >
                                  <img
                                    src={entry.imageSrc}
                                    alt="Saved scan"
                                    className="h-14 w-14 rounded-xl object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="truncate text-sm font-semibold text-slate-900">
                                        Score {entry.scoreSummary.overall}
                                      </div>
                                      <Badge className="border-slate-200 bg-white text-slate-700">
                                        {entry.source === 'demo' ? 'Demo' : 'Live'}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                      {formatHistoryDate(entry.createdAt)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="results-step"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <Card className="rounded-[1.5rem] border-slate-200/80">
                          <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
                            <div className="text-sm font-medium text-cyan-700">Step 2</div>
                            <CardTitle className="text-xl">AI result summary</CardTitle>
                            <CardDescription>
                              One clear scan summary, then tap into the part you want to inspect.
                            </CardDescription>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="border-slate-200 bg-white text-slate-700">
                                Signal {scoreSummary.overall}/100
                              </Badge>
                              <Badge className={confidenceMeta.badgeClassName}>
                                Confidence {activeResult.confidence}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 p-5">
                            {analysisNotice && (
                              <div className="rounded-[1rem] border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900">
                                <div className="font-medium">Demo fallback active</div>
                                <p className="mt-1 leading-6">{analysisNotice}</p>
                              </div>
                            )}

                            <div className="rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_100%)] p-4">
                              <div className="text-xs uppercase tracking-[0.18em] text-cyan-700">
                                Main takeaway
                              </div>
                              <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                                {leadInsight.title}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {leadInsight.summary}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-slate-500">
                                {scoreSummary.action}
                              </p>
                            </div>

                            <div className="space-y-3">
                              <DetailNavCard
                                title="Current photo"
                                subtitle={activeResult.currentVisibleCondition.summary}
                                active={effectiveDetail.type === 'current'}
                                onClick={() => setSelectedDetail({ type: 'current' })}
                              />
                              <DetailNavCard
                                title="Future risk view"
                                subtitle={activeResult.futureRiskSnapshot.summary}
                                active={effectiveDetail.type === 'future'}
                                onClick={() => setSelectedDetail({ type: 'future' })}
                              />
                              {activeResult.insights.map((insight, index) => (
                                <DetailNavCard
                                  key={insight.title}
                                  title={insight.title}
                                  subtitle={insight.summary}
                                  badge={insight.severity}
                                  active={
                                    effectiveDetail.type === 'insight' &&
                                    effectiveDetail.index === index
                                  }
                                  onClick={() =>
                                    setSelectedDetail({ type: 'insight', index })
                                  }
                                />
                              ))}
                            </div>

                            <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <BarChart3 className="h-4 w-4 text-cyan-600" />
                                Score breakdown
                              </div>
                              <div className="mt-3 space-y-3">
                                {scoreSummary.dimensions.map((dimension) => (
                                  <div key={dimension.label}>
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                      <span className="font-medium text-slate-900">
                                        {dimension.label}
                                      </span>
                                      <span className="text-slate-500">{dimension.score}</span>
                                    </div>
                                    <div className="mt-2">
                                      <ResultMeter
                                        score={Math.max(
                                          1,
                                          Math.round(dimension.score / 34),
                                        )}
                                        activeClassName={dimension.toneClassName}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {previousScan && historyDelta && (
                              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                  <History className="h-4 w-4 text-cyan-600" />
                                  Progress history
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {historyDelta.title}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {historyDelta.detail}
                                </p>
                                <Button
                                  variant="outline"
                                  className="mt-3 w-full"
                                  onClick={() => openHistoryScan(previousScan)}
                                >
                                  Open previous saved scan
                                </Button>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <Button variant="outline" onClick={returnToUpload}>
                                <ArrowLeft className="h-4 w-4" />
                                Back to upload
                              </Button>
                              <Button variant="outline" onClick={resetDemo}>
                                <RefreshCw className="h-4 w-4" />
                                New scan
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="rounded-[1.5rem] border-slate-200/80 shadow-sm">
                          <CardHeader className="border-b border-slate-100 bg-white/80">
                            <CardTitle className="text-xl">{detailLabel}</CardTitle>
                            <CardDescription>
                              AI analysis is already feeding this page. The layout now focuses on one result at a time.
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="space-y-5 p-5 md:p-6">
                            {effectiveDetail.type === 'current' && (
                              <div className="space-y-5">
                                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_320px]">
                                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-100">
                                    <img
                                      src={uploadedImage ?? ''}
                                      alt="Current visible condition"
                                      className="h-full w-full object-cover"
                                    />
                                    <AnalysisOverlay active={true} />
                                  </div>
                                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-700">
                                      AI read of the current image
                                    </div>
                                    <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                      Front alignment looks slightly uneven
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                      {activeResult.currentVisibleCondition.summary}
                                    </p>
                                    <div className="mt-5 space-y-3">
                                      {activeResult.currentVisibleCondition.focusPoints.map(
                                        (point, index) => (
                                          <div
                                            key={point}
                                            className="rounded-[1rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80"
                                          >
                                            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                              Focus {index + 1}
                                            </div>
                                            <div className="mt-2 text-sm font-medium leading-6 text-slate-900">
                                              {point}
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {effectiveDetail.type === 'future' && (
                              <div className="space-y-5">
                                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_320px]">
                                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-950">
                                    <img
                                      src={uploadedImage ?? ''}
                                      alt="Projected condition"
                                      className="h-full w-full object-cover opacity-70 saturate-50"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-amber-400/20" />
                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                      <div className="rounded-[1rem] border border-white/15 bg-black/45 p-4 text-white backdrop-blur-sm">
                                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                                          {activeResult.futureRiskSnapshot.projectionLabel}
                                        </div>
                                        <div className="mt-2 text-sm leading-6 text-slate-100">
                                          {activeResult.futureRiskSnapshot.summary}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-rose-500">
                                      What the AI is warning about
                                    </div>
                                    <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                      Small issues could become easier to notice later
                                    </div>
                                    <div className="mt-5 space-y-3">
                                      {activeResult.futureRiskSnapshot.riskPoints.map(
                                        (point, index) => (
                                          <div
                                            key={point}
                                            className="rounded-[1rem] bg-white/90 p-4 shadow-sm ring-1 ring-rose-100"
                                          >
                                            <div className="text-xs uppercase tracking-[0.18em] text-rose-500">
                                              Watch {index + 1}
                                            </div>
                                            <div className="mt-2 text-sm font-medium leading-6 text-slate-900">
                                              {point}
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedInsight && (() => {
                              const severityMeta = getSeverityMeta(selectedInsight.severity)
                              const SeverityIcon = severityMeta.icon

                              return (
                                <div className="space-y-5">
                                  <div
                                    className={cn(
                                      'rounded-[1.5rem] border p-5',
                                      severityMeta.panelClassName,
                                    )}
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                      <div className="max-w-2xl">
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
                                            <SeverityIcon className="h-5 w-5 text-slate-900" />
                                          </div>
                                          <Badge className={severityMeta.badgeClassName}>
                                            {selectedInsight.severity}
                                          </Badge>
                                        </div>
                                        <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                                          {selectedInsight.title}
                                        </div>
                                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                                          {selectedInsight.detail}
                                        </p>
                                      </div>

                                      <div className="min-w-[170px] rounded-[1.1rem] bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/80">
                                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          Signal strength
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {selectedInsight.severity}
                                        </div>
                                        <div className="mt-3">
                                          <ResultMeter
                                            score={severityMeta.score}
                                            activeClassName={severityMeta.dotClassName}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[1.2rem] border border-slate-200 bg-white p-5 shadow-sm">
                                      <div className="text-sm font-semibold text-slate-900">
                                        What the AI noticed
                                      </div>
                                      <p className="mt-2 text-sm leading-7 text-slate-600">
                                        {selectedInsight.summary}
                                      </p>
                                    </div>
                                    <div className="rounded-[1.2rem] border border-slate-200 bg-white p-5 shadow-sm">
                                      <div className="text-sm font-semibold text-slate-900">
                                        Why this matters
                                      </div>
                                      <p className="mt-2 text-sm leading-7 text-slate-600">
                                        {selectedInsight.whyItMatters}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
