export type AnalysisInsight = {
  title: string
  severity: string
  summary: string
  detail: string
  whyItMatters: string
}

export type AnalysisResult = {
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

export type ScoreDimension = {
  label: string
  score: number
  summary: string
  toneClassName: string
}

export type ScoreSummary = {
  overall: number
  label: string
  action: string
  confidenceScore: number
  dimensions: ScoreDimension[]
}

export type ScanHistoryEntry = {
  id: string
  createdAt: number
  imageSrc: string
  result: AnalysisResult
  source: 'live' | 'demo'
  scoreSummary: ScoreSummary
}

export type LifestyleEntry = {
  date: string
  sleep: number
  stress: number
  biteScore: number | null
}
