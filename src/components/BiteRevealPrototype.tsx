import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  RefreshCw,
  ScanLine,
  Shield,
  Sparkles,
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

const demoImage =
  'https://images.unsplash.com/photo-1588776814546-ec7e4e3a7d1a?q=80&w=1200&auto=format&fit=crop'

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
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedDetail, setSelectedDetail] = useState<DetailView | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null)

  const displayImage = uploadedImage || demoImage
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

  const readiness = useMemo(() => {
    if (!uploadedImage) return 20
    if (!hasAnalyzed) return 55
    return 100
  }, [uploadedImage, hasAnalyzed])

  const onUpload = (file?: File) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(String(reader.result))
      setHasAnalyzed(false)
      setProgress(0)
      setSelectedDetail(null)
      setAnalysisResult(null)
      setAnalysisError(null)
      setAnalysisNotice(null)
    }
    reader.readAsDataURL(file)
  }

  const runAnalysis = async () => {
    try {
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
          imageDataUrl: displayImage,
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
          return
        }

        throw new Error(message)
      }

      setAnalysisResult(payload)
      setProgress(100)
      setHasAnalyzed(true)
      setSelectedDetail({ type: 'current' })
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
    setAnalyzing(false)
    setHasAnalyzed(false)
    setProgress(0)
    setSelectedDetail(null)
    setAnalysisResult(null)
    setAnalysisError(null)
    setAnalysisNotice(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const returnToUpload = () => {
    setHasAnalyzed(false)
    setSelectedDetail(null)
    setProgress(uploadedImage ? 55 : 20)
  }

  const selectedInsight =
    selectedDetail?.type === 'insight'
      ? (analysisResult ?? fallbackAnalysis).insights[selectedDetail.index]
      : null

  const detailLabel =
    selectedDetail?.type === 'current'
      ? 'Current visible condition'
      : selectedDetail?.type === 'future'
        ? 'Future risk snapshot'
        : selectedInsight?.title

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_320px]"
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
                            src={displayImage}
                            alt="Teeth input demo"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
                            {uploadedImage ? 'Source image loaded' : 'Demo image loaded'}
                          </div>
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

                        <div className="flex min-h-56 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center">
                          <div className="max-w-md space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                              <ScanLine className="h-5 w-5" />
                            </div>
                            <div className="text-lg font-semibold text-slate-900">
                              Step 2 unlocks after analysis
                            </div>
                            <p className="text-sm leading-6 text-slate-500">
                              Once the scan finishes, the UI switches to a dedicated
                              result-details page.
                            </p>
                          </div>
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
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div>
                          <div className="text-sm font-medium text-slate-500">
                            Step 2
                          </div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            Result details
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            Review one result section at a time on a focused page.
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                            Confidence {(analysisResult ?? fallbackAnalysis).confidence}
                          </Badge>
                          <Button variant="outline" onClick={returnToUpload}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to upload
                          </Button>
                          <Button variant="outline" onClick={resetDemo}>
                            <RefreshCw className="h-4 w-4" />
                            New scan
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                            <Card className="rounded-[1.5rem] border-slate-200/80">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">Detail pages</CardTitle>
                                <CardDescription>
                                  Open one section at a time for a clearer read.
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <button
                                  type="button"
                                  className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                                  onClick={() => setSelectedDetail({ type: 'current' })}
                                >
                                  <div className="text-sm font-semibold text-slate-900">
                                    Current visible condition
                                  </div>
                                  <div className="mt-1 text-sm text-slate-500">
                                    Present-day alignment impression
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                                  onClick={() => setSelectedDetail({ type: 'future' })}
                                >
                                  <div className="text-sm font-semibold text-slate-900">
                                    Future risk snapshot
                                  </div>
                                  <div className="mt-1 text-sm text-slate-500">
                                    Speculative projection if unchanged
                                  </div>
                                </button>

                                {(analysisResult ?? fallbackAnalysis).insights.map((insight, index) => (
                                  <button
                                    key={insight.title}
                                    type="button"
                                    className="w-full rounded-[1rem] border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/40"
                                    onClick={() =>
                                      setSelectedDetail({ type: 'insight', index })
                                    }
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-sm font-semibold text-slate-900">
                                        {index + 1}. {insight.title}
                                      </div>
                                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                        {insight.severity}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-500">
                                      {insight.summary}
                                    </div>
                                  </button>
                                ))}
                              </CardContent>
                            </Card>

                            <Card className="rounded-[1.5rem] border-slate-200/80 shadow-sm">
                              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <CardTitle className="text-base">
                                      {detailLabel || 'Detailed review'}
                                    </CardTitle>
                                    <CardDescription>
                                      Focus on one result section at a time.
                                    </CardDescription>
                                  </div>
                                  {selectedDetail && (
                                    <Button
                                      variant="ghost"
                                      className="rounded-full px-3"
                                      onClick={() => setSelectedDetail(null)}
                                    >
                                      <ArrowLeft className="h-4 w-4" />
                                      Overview
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>

                              <CardContent className="space-y-4 p-5 md:p-6">
                                {analysisNotice && (
                                  <div className="rounded-[1.25rem] border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900">
                                    <div className="font-medium">Demo fallback active</div>
                                    <p className="mt-1 leading-6">{analysisNotice}</p>
                                  </div>
                                )}

                                {!selectedDetail && (
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                      <div className="text-sm font-semibold text-slate-900">
                                        Two visual pages
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Break the preview into current condition
                                        and future risk so each image gets more
                                        room.
                                      </p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                                      <div className="text-sm font-semibold text-slate-900">
                                        Three insight pages
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-600">
                                        Open each insight separately instead of
                                        stacking every explanation in one dense
                                        list.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {selectedDetail?.type === 'current' && (
                                  <div className="space-y-5">
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-100">
                                      <img
                                        src={displayImage}
                                        alt="Current visible condition"
                                        className="h-full w-full object-cover"
                                      />
                                      <AnalysisOverlay active={true} />
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                      <div className="rounded-[1rem] bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          Visible now
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .currentVisibleCondition.focusPoints[0]
                                          }
                                        </div>
                                      </div>
                                      <div className="rounded-[1rem] bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          Scan focus
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .currentVisibleCondition.focusPoints[1]
                                          }
                                        </div>
                                      </div>
                                      <div className="rounded-[1rem] bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                          Takeaway
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .currentVisibleCondition.focusPoints[2]
                                          }
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                      {
                                        (analysisResult ?? fallbackAnalysis)
                                          .currentVisibleCondition.summary
                                      }
                                    </p>
                                  </div>
                                )}

                                {selectedDetail?.type === 'future' && (
                                  <div className="space-y-5">
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-slate-950">
                                      <img
                                        src={displayImage}
                                        alt="Projected condition"
                                        className="h-full w-full object-cover opacity-70 saturate-50"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/15 via-transparent to-amber-400/15" />
                                      <div className="absolute inset-x-0 bottom-0 p-5">
                                        <div className="rounded-[1rem] border border-white/15 bg-black/45 p-4 text-white backdrop-blur-sm">
                                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                                            {
                                              (analysisResult ?? fallbackAnalysis)
                                                .futureRiskSnapshot.projectionLabel
                                            }
                                          </div>
                                          <div className="mt-2 text-sm leading-6 text-slate-100">
                                            {
                                              (analysisResult ?? fallbackAnalysis)
                                                .futureRiskSnapshot.summary
                                            }
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                      <div className="rounded-[1rem] bg-rose-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-rose-500">
                                          Risk
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .futureRiskSnapshot.riskPoints[0]
                                          }
                                        </div>
                                      </div>
                                      <div className="rounded-[1rem] bg-amber-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-amber-600">
                                          Warning
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .futureRiskSnapshot.riskPoints[1]
                                          }
                                        </div>
                                      </div>
                                      <div className="rounded-[1rem] bg-cyan-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-cyan-600">
                                          Goal
                                        </div>
                                        <div className="mt-2 text-sm font-medium text-slate-900">
                                          {
                                            (analysisResult ?? fallbackAnalysis)
                                              .futureRiskSnapshot.riskPoints[2]
                                          }
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {selectedInsight && (
                                  <div className="space-y-5">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                        {selectedInsight.severity}
                                      </Badge>
                                      <div className="text-sm text-slate-500">
                                        Insight detail page
                                      </div>
                                    </div>
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                      <div className="text-xl font-semibold text-slate-900">
                                        {selectedInsight.title}
                                      </div>
                                      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                                        {selectedInsight.detail}
                                      </p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <div className="rounded-[1rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                                        <div className="text-sm font-semibold text-slate-900">
                                          What this page explains
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                          {selectedInsight.summary}
                                        </p>
                                      </div>
                                      <div className="rounded-[1rem] bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                                        <div className="text-sm font-semibold text-slate-900">
                                          Why it matters
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                          {selectedInsight.whyItMatters}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <Card className="rounded-[1.75rem] border-slate-900/90 bg-[linear-gradient(160deg,#0f172a_0%,#111827_52%,#0b1220_100%)] text-white shadow-xl shadow-slate-300/40">
              <CardHeader>
                <CardTitle className="text-white">Why it clicks</CardTitle>
                <CardDescription className="text-slate-200">
                  BiteReveal makes an invisible concern feel clear and immediate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.25rem] border border-cyan-400/25 bg-white/8 p-4">
                  <div className="text-sm font-medium text-cyan-200">Fast signal</div>
                  <p className="mt-1 text-sm leading-6 text-slate-100">
                    One photo quickly turns risk into something visible.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-cyan-400/25 bg-white/8 p-4">
                  <div className="text-sm font-medium text-cyan-200">Low friction</div>
                  <p className="mt-1 text-sm leading-6 text-slate-100">
                    The flow is simple enough for demos and first-time users.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-cyan-400/25 bg-white/8 p-4">
                  <div className="text-sm font-medium text-cyan-200">Clear follow-up</div>
                  <p className="mt-1 text-sm leading-6 text-slate-100">
                    The result naturally points people toward professional care.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle>Next moves</CardTitle>
                <CardDescription>Simple ways to sharpen the prototype.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Guided photo capture
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add framing and lighting hints for better inputs.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Real scoring
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Swap the mock logic for a real analysis pipeline.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Progress history
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Let users compare scans over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
