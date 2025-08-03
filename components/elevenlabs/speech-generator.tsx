'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'

import { generateSpeech } from '@/actions/design-voice'
import { VoiceSelectionDialog } from '@/components/elevenlabs/voice-selection-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/contexts/user-context'
import { useVoicesStore } from '@/store/voices.store'

export function SpeechGenerator() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [message, setMessage] = useState(
    'My dearest love, do you remember that rainy evening when we first met? I was standing under the old oak tree, watching the raindrops dance on the pavement, when you appeared with your gentle smile and offered me your umbrella. In that moment, something inside me awakened - a feeling I had never experienced before. Your kindness touched my soul so deeply that I knew my life would never be the same. Every day since then, I find myself falling deeper in love with your beautiful heart, your infectious laughter, and the way you see magic in the simplest moments. You are my sunshine on cloudy days, my anchor in stormy seas, and the reason I believe in forever.'
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const { checkIsLoggedIn, refetchGetToken } = useUser()

  const selectedVoiceId = useVoicesStore((state) => state.selectedVoiceId)

  const startAudioStream = async () => {
    if (!checkIsLoggedIn()) return

    if (!message.trim()) {
      toast.error('Please enter a message.')
      return
    }

    try {
      setIsPlaying(true)

      const result = await generateSpeech(message, selectedVoiceId)
      refetchGetToken()

      const audioBuffer = Buffer.from(result.audio, 'base64')

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Create new audio element
      const audio = new Audio(url)
      audioRef.current = audio

      // Set event listeners
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url) // Clean up Blob URL
      }

      audio.onerror = () => {
        const error = audio?.error
        console.error('Audio playback error:', error)
        toast.error('Error playing audio')
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch (err) {
      if ((err as any).name !== 'AbortError') {
        toast.error(err instanceof Error ? err.message : 'An error occurred')
        setIsPlaying(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-semibold">Voice Player</h2>
          <p className="text-muted-foreground mt-1">Pick a voice, type your text, and hear it come alive</p>
        </div>
        <VoiceSelectionDialog audioRef={audioRef} />
      </div>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your script here..."
        rows={4}
        disabled={isPlaying}
      />

      <Button className="w-full" onClick={startAudioStream} disabled={!message || isPlaying}>
        {isPlaying ? 'Playing...' : 'Generate Speech'}
      </Button>
    </div>
  )
}
