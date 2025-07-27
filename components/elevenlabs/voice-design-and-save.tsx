'use client'

import { Loader2, Pause } from 'lucide-react'
import { useState, RefObject } from 'react'
import { toast } from 'sonner'

import { designVoice, saveVoice, generateSpeech, deleteVoice } from '@/actions/design-voice'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/contexts/user-context'

interface VoiceDesignAndSaveProps {
  audioRef: RefObject<HTMLAudioElement | null>
}

// 生成随机字符串数字
const generateRandomVoiceName = () => {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 10000)
  return `Voice_${timestamp}_${randomNum}`
}

export function VoiceDesignAndSave({ audioRef }: VoiceDesignAndSaveProps) {
  const [ttsMessage, setTtsMessage] = useState(
    'Hi darling, welcome to a world where my voice becomes your favorite addiction. Let me whisper secrets that make your pulse quicken, speak words that ignite your imagination, and create a symphony of desire that only we can share. Close your eyes and let my voice take you on a journey you will never forget.'
  )
  const [voicePrompt, setVoicePrompt] = useState(
    'A tiny, high-pitched female voice of a mouse with an adorable, squeaky timbre. Light and airy tone with a playful, mischievous energy. Speaking at a quick, excited pace with frequent giggles and animated inflections. Has a slight lisp that adds to the cuteness factor. The voice is sweet but with a hint of sassy confidence, like a cartoon character. Perfect audio quality.'
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const { checkIsLoggedIn } = useUser()

  const handleDesignAndSave = async () => {
    if (!checkIsLoggedIn()) return

    if (!ttsMessage.trim()) {
      toast.error('Please enter a test message.')
      return
    }

    if (!voicePrompt.trim()) {
      toast.error('Please enter a voice description.')
      return
    }

    try {
      setIsProcessing(true)

      // Generate random voice name
      const randomVoiceName = generateRandomVoiceName()

      // Step 1: Design voice using user's prompt
      const previews = await designVoice({
        voiceDescription: voicePrompt,
        text: 'Hi darling, welcome to a world where my voice becomes your favorite addiction. Let me whisper secrets that make your pulse quicken, speak words that ignite your imagination, and create a symphony of desire that only we can share. Close your eyes and let my voice take you on a journey you will never forget.'
      })

      if (previews.length === 0) {
        throw new Error('No voice previews generated')
      }

      // Get the first preview
      const firstPreview = previews[0]

      // Step 2: Save the voice automatically
      const savedVoiceResult = await saveVoice({
        voiceName: randomVoiceName,
        voiceDescription: voicePrompt,
        generatedVoiceId: firstPreview.generatedVoiceId
      })

      // Step 3: Generate TTS with the new voice and play immediately
      await generateTTSWithNewVoice(savedVoiceResult.voiceId)
      deleteVoice(savedVoiceResult.voiceId)

      toast.success(`Voice "${randomVoiceName}" created and speech generated!`)
    } catch (error) {
      console.error('Error in design and save process:', error)
      toast.error('Failed to design and save voice. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateTTSWithNewVoice = async (voiceId: string) => {
    try {
      const result = await generateSpeech(ttsMessage, voiceId)
      const audioBuffer = Buffer.from(result.audio, 'base64')
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }

      audio.onerror = () => {
        console.error('Audio playback error')
        toast.error('Error playing audio')
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }

      setIsPlaying(true)
      await audio.play()
    } catch (error) {
      console.error('TTS generation error:', error)
      toast.error('Failed to generate speech with new voice.')
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Custom Voice Generator</h2>
        <p className="text-muted-foreground mt-1">
          Describe any voice you want and we'll make your text sound exactly like that. No bullshit.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">What voice do you want?</label>
          <Textarea
            value={voicePrompt}
            onChange={(e) => setVoicePrompt(e.target.value)}
            placeholder="Tell us what voice you're after (like: raspy old cowboy, valley girl with attitude, deep movie trailer guy...)"
            rows={3}
            disabled={isProcessing}
            className="resize-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">What should it say?</label>
          <Textarea
            value={ttsMessage}
            onChange={(e) => setTtsMessage(e.target.value)}
            placeholder="Type whatever you want this voice to say..."
            rows={4}
            disabled={isProcessing}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleDesignAndSave}
          disabled={isProcessing || !ttsMessage.trim() || !voicePrompt.trim()}
          size="lg"
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cooking up your voice...
            </>
          ) : (
            'Make It Talk'
          )}
        </Button>
      </div>

      {isPlaying && (
        <div className="border-primary/20 bg-primary/5 flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
            <span className="text-primary font-medium">Your custom voice is talking</span>
          </div>
          <Button variant="outline" size="sm" onClick={stopAudio}>
            <Pause className="mr-2 h-4 w-4" />
            Stop
          </Button>
        </div>
      )}
    </div>
  )
}
