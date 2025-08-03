import { SpeechGenerator } from '@/components/elevenlabs/speech-generator'
import { VoiceDesigner } from '@/components/elevenlabs/voice-designer'

export const VoiceDeignContainer = () => {
  return (
    <div className="space-y-10">
      <VoiceDesigner />
      <SpeechGenerator />
    </div>
  )
}
