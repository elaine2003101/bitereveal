import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import cron from 'node-cron'
import nodemailer from 'nodemailer'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SUBSCRIBERS_FILE = join(__dirname, 'subscribers.json')

const app = express()
const port = Number(process.env.PORT || 8787)
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

function hasConfiguredValue(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false

  const placeholders = new Set([
    'your_gemini_api_key_here',
    'your_openai_api_key_here',
    'your_key_here',
  ])

  return !placeholders.has(trimmed)
}

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,https://elaine2003101.github.io'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
  }),
)

app.use(express.json({ limit: '12mb' }))

// ── Helpers ─────────────────────────────────────────────────────────────────

function readSubscribers() {
  try {
    if (!existsSync(SUBSCRIBERS_FILE)) return []
    return JSON.parse(readFileSync(SUBSCRIBERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeSubscribers(list) {
  writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2))
}

function buildMailTransporter() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function buildWeeklyHtml(subscribers) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: system-ui, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; font-weight: 700; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; }
  .tip { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-top: 16px; }
  .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; }
</style></head>
<body>
  <div class="label">BiteReveal</div>
  <h1>Your weekly bite summary</h1>
  <p>Here is a reminder to scan this week and keep your streak going.</p>
  <div class="tip">
    💡 <strong>Tip of the week:</strong> Try the chin tuck exercise daily — 3 sets of 30 seconds
    helps balance the muscles that support your jaw.
  </div>
  <p style="margin-top:20px">Open the app to run your scan and track your progress.</p>
  <div class="footer">Educational prototype only · Not a medical service · ${subscribers.length} subscriber${subscribers.length === 1 ? '' : 's'}</div>
</body>
</html>`
}

// ── Weekly cron (every Monday 08:00 local) ───────────────────────────────────
cron.schedule('0 8 * * 1', async () => {
  const subscribers = readSubscribers()
  if (subscribers.length === 0) return

  const transporter = buildMailTransporter()
  if (!transporter) {
    console.log('[cron] SMTP not configured — skipping weekly send')
    return
  }

  console.log(`[cron] Sending weekly report to ${subscribers.length} subscriber(s)`)
  const html = buildWeeklyHtml(subscribers)
  for (const email of subscribers) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'BiteReveal — your weekly summary',
        html,
      })
    } catch (err) {
      console.error(`[cron] Failed to send to ${email}:`, err)
    }
  }
})

// ── Analysis schema ──────────────────────────────────────────────────────────

const ANALYSIS_SCHEMA = {
  name: 'bite_reveal_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      currentVisibleCondition: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          focusPoints: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
        },
        required: ['title', 'summary', 'focusPoints'],
      },
      futureRiskSnapshot: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          projectionLabel: { type: 'string' },
          summary: { type: 'string' },
          riskPoints: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
          threeMonths: { type: 'string' },
          oneYear: { type: 'string' },
          threeYears: { type: 'string' },
        },
        required: ['title', 'projectionLabel', 'summary', 'riskPoints', 'threeMonths', 'oneYear', 'threeYears'],
      },
      insights: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            severity: { type: 'string' },
            summary: { type: 'string' },
            detail: { type: 'string' },
            whyItMatters: { type: 'string' },
          },
          required: ['title', 'severity', 'summary', 'detail', 'whyItMatters'],
        },
      },
      actions: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            urgency: { type: 'string', enum: ['today', 'this-week', 'this-month'] },
          },
          required: ['title', 'description', 'urgency'],
        },
      },
      disclaimer: { type: 'string' },
    },
    required: [
      'confidence',
      'currentVisibleCondition',
      'futureRiskSnapshot',
      'insights',
      'actions',
      'disclaimer',
    ],
  },
}

// ── Provider helpers ─────────────────────────────────────────────────────────

function getProvider() {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase()
  const hasGeminiKey = hasConfiguredValue(process.env.GEMINI_API_KEY)
  const hasOpenAIKey = hasConfiguredValue(process.env.OPENAI_API_KEY)

  if (explicitProvider === 'gemini') {
    if (!hasGeminiKey) throw new Error('Missing GEMINI_API_KEY')
    return { name: 'gemini', model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL }
  }

  if (explicitProvider === 'openai') {
    if (!hasOpenAIKey) throw new Error('Missing OPENAI_API_KEY')
    return { name: 'openai', model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL }
  }

  if (hasGeminiKey) {
    return { name: 'gemini', model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL }
  }

  if (hasOpenAIKey) {
    return { name: 'openai', model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL }
  }

  throw new Error('Missing AI provider credentials')
}

function isSupportedImageReference(value) {
  return (
    typeof value === 'string' &&
    (value.startsWith('data:image/') ||
      value.startsWith('https://') ||
      value.startsWith('http://'))
  )
}

function parseDataUrlImage(value) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) throw new Error('Please upload a JPG or PNG image as a valid base64 data URL.')
  return { mimeType: match[1], data: match[2] }
}

async function resolveImageForGemini(imageReference) {
  if (imageReference.startsWith('data:image/')) return parseDataUrlImage(imageReference)

  const imageResponse = await fetch(imageReference)
  if (!imageResponse.ok) throw new Error('Could not download the selected image for analysis.')

  const mimeType = imageResponse.headers.get('content-type')?.split(';')[0]?.trim()
  if (!mimeType || !mimeType.startsWith('image/'))
    throw new Error('The selected file is not a supported image.')

  const arrayBuffer = await imageResponse.arrayBuffer()
  return { mimeType, data: Buffer.from(arrayBuffer).toString('base64') }
}

async function analyzeWithGemini({ imageDataUrl, model }) {
  const { mimeType, data } = await resolveImageForGemini(imageDataUrl)

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: 'You are assisting a non-diagnostic bite-awareness prototype. Analyze only visible cues from the image. Do not claim medical certainty. Keep the language concise, plain, and user-friendly.',
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Review this teeth or smile photo for a bite-awareness educational app. Return JSON with: currentVisibleCondition (what is visibly observable right now with 3 specific focus points); futureRiskSnapshot (what could happen if unchanged — include plain-English predictions for threeMonths, oneYear, and threeYears); insights (3 findings labelled Early/Watch/Low covering symmetry, wear, crowding); actions (3 specific steps — one urgency:today, one urgency:this-week, one urgency:this-month). Keep language warm, plain, non-alarming, non-diagnostic. Focus on education and motivation.',
              },
              { inlineData: { mimeType, data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: ANALYSIS_SCHEMA.schema,
        },
      }),
    },
  )

  const payload = await geminiResponse.json()
  if (!geminiResponse.ok) throw new Error(payload?.error?.message || 'Gemini analysis failed.')

  const outputText = payload?.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    ?.map((part) => part.text)
    ?.find(Boolean)

  if (!outputText) throw new Error('Gemini returned no structured output text.')
  return JSON.parse(outputText)
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_request, response) => {
  const hasGeminiKey = hasConfiguredValue(process.env.GEMINI_API_KEY)
  const hasOpenAIKey = hasConfiguredValue(process.env.OPENAI_API_KEY)
  const provider =
    process.env.AI_PROVIDER?.trim().toLowerCase() ||
    (hasGeminiKey ? 'gemini' : hasOpenAIKey ? 'openai' : null)

  response.json({
    ok: true,
    provider,
    hasGeminiKey,
    hasOpenAIKey,
    hasAnthropicKey: hasConfiguredValue(process.env.ANTHROPIC_API_KEY),
    hasSmtp: Boolean(process.env.SMTP_HOST),
    model:
      provider === 'openai'
        ? process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
        : process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  })
})

app.post('/api/analyze', async (request, response) => {
  try {
    const { imageDataUrl } = request.body ?? {}

    if (!isSupportedImageReference(imageDataUrl)) {
      response.status(400).json({
        error: 'Please send imageDataUrl as a data URL or remote image URL string.',
      })
      return
    }

    const provider = getProvider()

    if (provider.name !== 'gemini') {
      response.status(503).json({
        error:
          'This deployment is currently configured for Gemini. Switch AI_PROVIDER to gemini and set GEMINI_API_KEY.',
      })
      return
    }

    const result = await analyzeWithGemini({ imageDataUrl, model: provider.model })
    response.json(result)
  } catch (error) {
    console.error('Analyze route failed:', error)
    const message = error instanceof Error ? error.message : 'Unknown analysis error'
    const statusCode =
      message.includes('Please upload') ||
      message.includes('supported image') ||
      message.includes('Could not download')
        ? 400
        : 500
    response.status(statusCode).json({ error: message })
  }
})

app.post('/api/coaching', async (request, response) => {
  try {
    const { result, scoreSummary } = request.body ?? {}

    if (!result || !scoreSummary) {
      response.status(400).json({ error: 'Missing result or scoreSummary.' })
      return
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      response.status(503).json({
        error: 'Coaching service unavailable. Set ANTHROPIC_API_KEY to enable.',
      })
      return
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are a friendly, non-alarmist dental wellness coach helping someone understand their bite scan results from an educational prototype app.

Their results:
- Overall signal score: ${scoreSummary.overall}/100 (${scoreSummary.label})
- Confidence: ${result.confidence}
- Main findings:
${result.insights.map((i) => `  • ${i.title} (${i.severity}): ${i.summary}`).join('\n')}
- Current condition: ${result.currentVisibleCondition.summary}
- Future risk: ${result.futureRiskSnapshot.summary}

Give 4 personalised coaching tips, each 2–3 sentences. Cover: (1) what they can do at home today, (2) daily habits worth considering, (3) when to see a professional, (4) an encouraging observation. Write in plain paragraphs — no headers, no bullet points. Warm, clear, non-alarming tone. Do NOT diagnose.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const coaching =
      message.content[0]?.type === 'text' ? message.content[0].text : ''
    response.json({ coaching })
  } catch (error) {
    console.error('Coaching route failed:', error)
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Coaching generation failed.',
    })
  }
})

app.post('/api/weekly-subscribe', (request, response) => {
  try {
    const { email } = request.body ?? {}

    if (!email || !String(email).includes('@')) {
      response.status(400).json({ error: 'Please provide a valid email address.' })
      return
    }

    const subscribers = readSubscribers()
    const normalised = String(email).trim().toLowerCase()

    if (!subscribers.includes(normalised)) {
      subscribers.push(normalised)
      writeSubscribers(subscribers)
      console.log(`[subscribe] New subscriber: ${normalised} (total: ${subscribers.length})`)
    }

    response.json({ ok: true, message: 'Subscribed successfully.' })
  } catch (error) {
    console.error('Subscribe route failed:', error)
    response.status(500).json({ error: 'Subscription failed. Please try again.' })
  }
})

app.listen(port, () => {
  console.log(`BiteReveal API listening on http://localhost:${port}`)
})
