import 'dotenv/config'

import cors from 'cors'
import express from 'express'

const app = express()
const port = Number(process.env.PORT || 8787)
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

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

const ANALYSIS_SCHEMA = {
  name: 'bite_reveal_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      confidence: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
      },
      currentVisibleCondition: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          focusPoints: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: { type: 'string' },
          },
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
          riskPoints: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: { type: 'string' },
          },
        },
        required: ['title', 'projectionLabel', 'summary', 'riskPoints'],
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
      disclaimer: { type: 'string' },
    },
    required: [
      'confidence',
      'currentVisibleCondition',
      'futureRiskSnapshot',
      'insights',
      'disclaimer',
    ],
  },
}

function getProvider() {
  const explicitProvider = process.env.AI_PROVIDER?.trim().toLowerCase()

  if (explicitProvider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY')
    }

    return {
      name: 'gemini',
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    }
  }

  if (explicitProvider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY')
    }

    return {
      name: 'openai',
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    }
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    }
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

  if (!match) {
    throw new Error('Please upload a JPG or PNG image as a valid base64 data URL.')
  }

  return {
    mimeType: match[1],
    data: match[2],
  }
}

async function resolveImageForGemini(imageReference) {
  if (imageReference.startsWith('data:image/')) {
    return parseDataUrlImage(imageReference)
  }

  const imageResponse = await fetch(imageReference)

  if (!imageResponse.ok) {
    throw new Error('Could not download the selected image for analysis.')
  }

  const mimeType = imageResponse.headers.get('content-type')?.split(';')[0]?.trim()

  if (!mimeType || !mimeType.startsWith('image/')) {
    throw new Error('The selected file is not a supported image.')
  }

  const arrayBuffer = await imageResponse.arrayBuffer()

  return {
    mimeType,
    data: Buffer.from(arrayBuffer).toString('base64'),
  }
}

async function analyzeWithGemini({ imageDataUrl, model }) {
  const { mimeType, data } = await resolveImageForGemini(imageDataUrl)

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                'You are assisting a non-diagnostic bite-awareness prototype. Analyze only visible cues from the image. Do not claim medical certainty. Keep the language concise, plain, and user-friendly.',
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'Review this teeth or smile photo. Return concise JSON for a prototype UI. Focus on visible bite alignment, possible wear cues, and crowding tendency. Keep results cautious and non-diagnostic.',
              },
              {
                inlineData: {
                  mimeType,
                  data,
                },
              },
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

  if (!geminiResponse.ok) {
    throw new Error(payload?.error?.message || 'Gemini analysis failed.')
  }

  const outputText = payload?.candidates
    ?.flatMap((candidate) => candidate.content?.parts || [])
    ?.map((part) => part.text)
    ?.find(Boolean)

  if (!outputText) {
    throw new Error('Gemini returned no structured output text.')
  }

  return JSON.parse(outputText)
}

app.get('/api/health', (_request, response) => {
  const provider =
    process.env.AI_PROVIDER?.trim().toLowerCase() ||
    (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : null)

  response.json({
    ok: true,
    provider,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
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
        error:
          'Please send imageDataUrl as a data URL or remote image URL string.',
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

    const result = await analyzeWithGemini({
      imageDataUrl,
      model: provider.model,
    })

    response.json(result)
  } catch (error) {
    console.error('Analyze route failed:', error)

    const message =
      error instanceof Error ? error.message : 'Unknown analysis error'

    const statusCode =
      message.includes('Please upload') ||
      message.includes('supported image') ||
      message.includes('Could not download')
        ? 400
        : 500

    response.status(statusCode).json({
      error: message,
    })
  }
})

app.listen(port, () => {
  console.log(`BiteReveal API listening on http://localhost:${port}`)
})
