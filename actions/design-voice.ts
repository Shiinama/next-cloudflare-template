'use server'

import { ElevenLabs, ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

import { updateUserTokenUsage } from '@/actions/payment/tokens'
import { TOKENS_PER_SECOND } from '@/config/token'

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
    const alignments: ElevenLabs.CharacterAlignmentResponseModel[] = []

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

    let duration = 0
    if (alignments.length > 0) {
      // 找到最后一个字符的结束时间
      const lastAlignment = alignments[alignments.length - 1]
      if (lastAlignment.characterEndTimesSeconds && lastAlignment.characterEndTimesSeconds.length > 0) {
        // 获取最后一个字符的结束时间
        duration = lastAlignment.characterEndTimesSeconds[lastAlignment.characterEndTimesSeconds.length - 1]
      }
    }

    // 合并所有音频块
    const completeAudio = Buffer.concat(audioChunks)

    await updateUserTokenUsage({
      amount: Math.floor(duration) * TOKENS_PER_SECOND
    })

    return {
      audio: completeAudio.toString('base64'),
      alignments: alignments,
      duration
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
