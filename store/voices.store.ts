import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProcessedVoicePreview = {
  url: string
  voiceId: string
  duration: number
  mediaType: string
}

interface VoicesState {
  selectedVoiceId: string
  setSelectedVoiceId: (id: string) => void
}

export const useVoicesStore = create<VoicesState>()(
  persist(
    (set) => ({
      selectedVoiceId: 'LcfcDJNUP1GQjkzn1xUU',
      setSelectedVoiceId: (id) =>
        set({
          selectedVoiceId: id
        })
    }),
    {
      name: 'elevenlabs-saved-voices'
    }
  )
)
