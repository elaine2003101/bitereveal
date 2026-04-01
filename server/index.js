import 'dotenv/config'

import express from 'express'
import OpenAI from 'openai'

const app = express()
const port = Number(process.env.PORT || 8787)

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

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function isSupportedImageReference(value) {
  return (
    typeof value === 'string' &&
    (value.startsWith('data:image/') ||
      value.startsWith('https://') ||
      value.startsWith('http://'))
  )
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
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

    const client = getClient()

    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'You are assisting a non-diagnostic bite-awareness prototype. Analyze only visible cues from the image. Do not claim medical certainty. Keep the language concise, plain, and user-friendly.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Review this teeth or smile photo. Return concise JSON for a prototype UI. Focus on visible bite alignment, possible wear cues, and crowding tendency. Keep results cautious and non-diagnostic.',
            },
            {
              type: 'input_image',
              image_url: imageDataUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          ...ANALYSIS_SCHEMA,
        },
      },
    })

    if (!result.output_text) {
      throw new Error('OpenAI returned no structured output text.')
    }

    response.json(JSON.parse(result.output_text))
  } catch (error) {
    console.error('Analyze route failed:', error)

    const message =
      error instanceof Error ? error.message : 'Unknown analysis error'

    response.status(500).json({
      error: message,
    })
  }
})

app.listen(port, () => {
  console.log(`BiteReveal API listening on http://localhost:${port}`)
})
