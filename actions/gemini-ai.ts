'use server'

import { GoogleGenAI } from '@google/genai'

export type GeminiGenerationParams = {
  prompt: string
  userId: string
  model?: string
  temperature?: number
  maxOutputTokens?: number
  systemPrompt?: string
  userPrompt?: string
}

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

export async function getModelsWithGemini() {
  const modelIterator = await genAI.models.list()
  const models = []

  for await (const model of modelIterator) {
    models.push(model)
  }

  return models
}

export async function generateWithGemini({
  prompt,
  userPrompt,
  model = 'gemini-pro',
  temperature = 0.7,
  maxOutputTokens = 2048,
  systemPrompt
}: GeminiGenerationParams) {
  const chats = genAI.chats.create({
    model: model,
    config: {
      maxOutputTokens: maxOutputTokens || 65535,
      temperature: temperature || 0.7,
      topP: 0.9,
      tools: [
        {
          googleSearch: {
            timeRangeFilter: {
              startTime: '2025-01-01T00:00:00Z',
              endTime: '2026-01-01T00:00:00Z'
            }
          }
        }
      ],
      systemInstruction: systemPrompt
        ? {
            parts: [
              {
                text: systemPrompt
              }
            ]
          }
        : undefined
    }
  })

  const result = await chats.sendMessage({
    message: [{ text: userPrompt || prompt }]
  })

  let tokensUsed = 0

  if (result.usageMetadata) {
    const inputTokens = result.usageMetadata.promptTokenCount || 0
    const outputTokens = result.usageMetadata.candidatesTokenCount || 0
    tokensUsed = inputTokens + outputTokens
  }

  return {
    usageData: result.usageMetadata,
    text: result.text
  }
}
