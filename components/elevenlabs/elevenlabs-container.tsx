'use client'

import { Voice } from '@elevenlabs/elevenlabs-js/api'
import { useEffect, useRef, useState } from 'react'

import { getAllVoices } from '@/actions/design-voice'
import { SpeechGenerator } from '@/components/elevenlabs/speech-generator'
import { VoiceDesignAndSave } from '@/components/elevenlabs/voice-design-and-save'
import { VoiceDesigner } from '@/components/elevenlabs/voice-designer'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ElevenLabsContainer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [voices, setSavingStates] = useState<Voice[]>([])

  const getVoices = async () => {
    const data = await getAllVoices()
    setSavingStates(data)
  }

  useEffect(() => {
    getVoices()
  }, [])

  return (
    <Card className="mx-auto max-w-6xl p-8">
      <Tabs defaultValue="tts" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tts">Text to Speech</TabsTrigger>
          <TabsTrigger value="design">Voice Designer</TabsTrigger>
          <TabsTrigger value="save-design">Design & Save</TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="space-y-8">
          <SpeechGenerator voices={voices} audioRef={audioRef} />
        </TabsContent>

        <TabsContent value="design" className="space-y-8">
          <VoiceDesignAndSave audioRef={audioRef} />
        </TabsContent>

        <TabsContent value="save-design" className="space-y-8">
          <VoiceDesigner getVoices={getVoices} />
          <SpeechGenerator voices={voices} audioRef={audioRef} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
