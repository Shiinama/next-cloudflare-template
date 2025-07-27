'use server'

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function designVoice({ voiceDescription, text }: { voiceDescription: string; text: string }) {
  const elevenlabs = new ElevenLabsClient()

  const { previews } = await elevenlabs.textToVoice.design({
    modelId: 'eleven_multilingual_ttv_v2',
    voiceDescription,
    text
  })

  return previews
}

export async function saveVoice({
  voiceName,
  voiceDescription,
  generatedVoiceId
}: {
  voiceName: string
  voiceDescription: string
  generatedVoiceId: string
  labels?: string[]
}) {
  const elevenlabs = new ElevenLabsClient()

  return await elevenlabs.textToVoice.create({
    voiceName,
    voiceDescription,
    generatedVoiceId
  })
}

export async function generateSpeech(text: string, voice: string) {
  const elevenlabs = new ElevenLabsClient()

  try {
    const audioStream = await elevenlabs.textToSpeech.streamWithTimestamps(voice, {
      text: text,
      modelId: 'eleven_flash_v2_5',
      outputFormat: 'mp3_44100_64'
    })

    const audioChunks: Buffer[] = []
    const alignments: any[] = []

    for await (const item of audioStream) {
      if (item.audioBase64) {
        // 收集音频数据
        const audioBuffer = Buffer.from(item.audioBase64, 'base64')
        audioChunks.push(audioBuffer)
      }

      if (item.alignment) {
        // 收集时间戳信息
        alignments.push(item.alignment)
      }
    }

    // 合并所有音频块
    const completeAudio = Buffer.concat(audioChunks)

    return {
      audio: completeAudio.toString('base64'),
      alignments: alignments
    }
  } catch (error) {
    throw new Error(`TTS generation failed: ${error}`)
  }
}

export async function getAllVoices() {
  const elevenlabs = new ElevenLabsClient()

  const data = await elevenlabs.voices.search({
    pageSize: 100
  })
  return data.voices
}

export async function deleteVoice(voiceId: string) {
  const elevenlabs = new ElevenLabsClient()

  await elevenlabs.voices.delete(voiceId)
}
