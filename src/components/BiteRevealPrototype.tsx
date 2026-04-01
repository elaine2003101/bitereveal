import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
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

const sampleInsights = [
  {
    title: 'Minor bite asymmetry',
    severity: 'Early',
    description:
      'Slight left-right imbalance detected from visible tooth alignment cues.',
  },
  {
    title: 'Potential uneven wear',
    severity: 'Watch',
    description:
      'Front teeth edges may be experiencing uneven contact over time.',
  },
  {
    title: 'Crowding tendency',
    severity: 'Low',
    description:
      'Mild overlap patterns suggest possible future alignment shift.',
  },
]

const demoImage =
  'https://images.unsplash.com/photo-1588776814546-ec7e4e3a7d1a?q=80&w=1200&auto=format&fit=crop'

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

function FutureSnapshot({ imageSrc }: { imageSrc: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Current visible condition</CardTitle>
          <CardDescription>Present-day alignment impression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-100">
            <img
              src={imageSrc}
              alt="Current visible condition"
              className="h-full w-full object-cover"
            />
            <AnalysisOverlay active={true} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Future risk snapshot</CardTitle>
          <CardDescription>Speculative projection if unchanged</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-slate-950">
            <img
              src={imageSrc}
              alt="Projected condition"
              className="h-full w-full object-cover opacity-70 saturate-50"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/15 via-transparent to-amber-400/15" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="rounded-[1rem] border border-white/15 bg-black/40 p-3 text-white backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                  3-year projection
                </div>
                <div className="mt-1 text-sm">
                  Slight worsening of asymmetry and potential edge wear.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BiteRevealPrototype() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [progress, setProgress] = useState(0)

  const displayImage = uploadedImage || demoImage

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
    }
    reader.readAsDataURL(file)
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    setHasAnalyzed(false)
    setProgress(8)

    const steps = [22, 39, 57, 76, 92, 100]
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 280))
      setProgress(step)
    }

    setAnalyzing(false)
    setHasAnalyzed(true)
  }

  const resetDemo = () => {
    setUploadedImage(null)
    setAnalyzing(false)
    setHasAnalyzed(false)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#f6f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="space-y-6">
            <Badge className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-cyan-700">
              Early Protection Platform Concept
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
                BiteReveal
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                A creative early oral health platform that turns a simple teeth
                photo into a visible warning moment, revealing bite imbalance,
                wear risk, and future shift before pain appears.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-5">
                  <Eye className="mb-3 h-5 w-5" />
                  <div className="text-sm font-medium">
                    Make invisible risks visible
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Translate subtle oral issues into intuitive visual cues.
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-5">
                  <Shield className="mb-3 h-5 w-5" />
                  <div className="text-sm font-medium">
                    Promote early protection
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Encourage action before conditions become painful or severe.
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
                <CardContent className="p-5">
                  <Sparkles className="mb-3 h-5 w-5" />
                  <div className="text-sm font-medium">
                    Creative interpretation
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Use visual storytelling, not technical jargon, to build
                    awareness.
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden rounded-[1.75rem] border-slate-200/80 shadow-lg shadow-slate-200/50">
              <CardHeader className="border-b border-slate-100 bg-white/70 backdrop-blur">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScanLine className="h-5 w-5" /> Core interaction prototype
                </CardTitle>
                <CardDescription>
                  One focused experience: upload, reveal, project.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-5 md:p-6">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onUpload(event.target.files?.[0])}
                />

                <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
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
                        Upload a photo, then run the concept analysis to reveal
                        insight cards and a future-risk mockup.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            Visual scan simulation
                          </div>
                          <div className="text-sm text-slate-500">
                            Demo-only interpretation for concept testing
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
                              Reveal insights
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>

                      <AnimatePresence initial={false}>
                        {(analyzing || hasAnalyzed) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                  {analyzing
                                    ? 'Analyzing visible bite signals...'
                                    : 'Concept analysis completed'}
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

                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                          This prototype is a visual concept, not a medical
                          diagnosis. It is meant to help users notice patterns
                          worth checking with a dental professional.
                        </p>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {hasAnalyzed ? (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="space-y-4"
                        >
                          <FutureSnapshot imageSrc={displayImage} />
                          <div className="grid gap-4">
                            {sampleInsights.map((insight, index) => (
                              <Card key={insight.title} className="rounded-[1.5rem]">
                                <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="text-base font-semibold text-slate-900">
                                      {index + 1}. {insight.title}
                                    </div>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                      {insight.description}
                                    </p>
                                  </div>
                                  <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                                    {insight.severity}
                                  </Badge>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="flex min-h-56 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center"
                        >
                          <div className="max-w-md space-y-3">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                              <ScanLine className="h-5 w-5" />
                            </div>
                            <div className="text-lg font-semibold text-slate-900">
                              Ready to simulate the reveal
                            </div>
                            <p className="text-sm leading-6 text-slate-500">
                              Choose a photo or use the demo image, then run the
                              mock analysis to generate insight cards and a
                              future-risk preview.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="rounded-[1.75rem] border-slate-200/70 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
              <CardHeader>
                <CardTitle className="text-white">Why this concept works</CardTitle>
                <CardDescription className="text-slate-300">
                  BiteReveal turns an invisible oral-health concern into a clear
                  visual moment people can understand quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-cyan-200">
                    Emotional hook
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Showing a possible future outcome makes preventive care feel
                    immediate instead of abstract.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-cyan-200">
                    Fast onboarding
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    A single image upload keeps the experience simple for early
                    concept demos and stakeholder feedback.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-medium text-cyan-200">
                    Clear next step
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    The output frames the product as an early-warning tool that
                    guides users toward professional follow-up.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-slate-200/70 shadow-sm">
              <CardHeader>
                <CardTitle>Suggested next product moves</CardTitle>
                <CardDescription>
                  Good directions if you want to develop this prototype further.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Add guided photo capture
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Help users take consistent front-facing photos with framing
                    guides and lighting hints.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Replace demo logic with real scoring
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Connect the experience to an actual image-analysis pipeline
                    and confidence scoring.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-900">
                    Add comparison history
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Let users revisit previous scans to see visible trend
                    changes over time.
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
