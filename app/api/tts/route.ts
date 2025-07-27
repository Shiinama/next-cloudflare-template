'use server'

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const elevenlabs = new ElevenLabsClient()

  try {
    const {
      text,
      voice
    }: {
      text: string
      voice: string
    } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const audioStream = await elevenlabs.textToSpeech.stream(voice, {
            text: text,
            modelId: 'eleven_flash_v2_5',
            outputFormat: 'mp3_44100_64'
          })

          const reader = audioStream.getReader()
          let result
          while (!(result = await reader.read()).done) {
            controller.enqueue(result.value)
          }
        } catch (error) {
          controller.error(error)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
