'use client'

import { Voice } from '@elevenlabs/elevenlabs-js/api'
import { Check, Filter, X } from 'lucide-react'
import { useState, useMemo, RefObject } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useVoicesStore } from '@/store/voices.store'

import { VoiceCard } from './voice-card'

interface VoiceSelectionDialogProps {
  audioRef: RefObject<HTMLAudioElement | null>
  voices: Voice[]
}

export function VoiceSelectionDialog({ audioRef, voices }: VoiceSelectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null)
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [activeTab, setActiveTab] = useState('default')

  const selectedVoiceId = useVoicesStore((state) => state.selectedVoiceId)
  const setSelectedVoiceId = useVoicesStore((state) => state.setSelectedVoiceId)
  const savedVoices = voices.filter((i) => i.category === 'generated')

  const genderOptions = useMemo(() => {
    const genders = new Set<string>()
    voices.forEach((voice) => {
      if (voice?.labels?.gender) {
        genders.add(voice.labels.gender)
      }
    })
    return Array.from(genders).sort()
  }, [])

  const filteredVoices = useMemo(() => {
    if (!genderFilter) return voices
    return voices.filter((voice) => voice?.labels?.gender === genderFilter)
  }, [genderFilter, voices])

  const formatLabel = (text: string) => {
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const playPreview = async (voiceId: string, previewUrl: string) => {
    try {
      setLoadingVoiceId(voiceId)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      if (playingVoiceId === voiceId) {
        setPlayingVoiceId(null)
        setLoadingVoiceId(null)
        return
      }

      const audio = new Audio(previewUrl)
      audioRef.current = audio

      audio.onloadeddata = () => {
        setLoadingVoiceId(null)
        setPlayingVoiceId(voiceId)
      }

      audio.onended = () => {
        setPlayingVoiceId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        setPlayingVoiceId(null)
        setLoadingVoiceId(null)
        audioRef.current = null
      }

      await audio.play()
    } catch {
      setPlayingVoiceId(null)
      setLoadingVoiceId(null)
    }
  }

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoiceId(voiceId)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {voices.find((voice) => voice.voiceId === selectedVoiceId)?.name}
          {selectedVoiceId && <Check className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Voice</DialogTitle>
          <DialogDescription>Choose a voice for your text-to-speech generation</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="default">Default Voices ({voices.length})</TabsTrigger>
            <TabsTrigger value="my-voices">My Voices ({savedVoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="default" className="mt-4">
            {/* Filter */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {genderFilter && (
                <Button variant="ghost" size="sm" onClick={() => setGenderFilter('')}>
                  <X className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
              <Badge variant="secondary" className="text-xs">
                {filteredVoices.length} voices
              </Badge>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredVoices.map((voice) => (
                  <VoiceCard
                    key={voice.voiceId}
                    voice={voice}
                    isSelected={selectedVoiceId === voice.voiceId}
                    isPlaying={playingVoiceId === voice.voiceId}
                    isLoading={loadingVoiceId === voice.voiceId}
                    onVoiceSelect={handleVoiceSelect}
                    onPlayPreview={playPreview}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="my-voices" className="mt-4">
            <ScrollArea className="h-[400px]">
              {savedVoices.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground text-sm">No custom voices saved yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedVoices.map((voice) => (
                    <VoiceCard
                      key={voice.voiceId}
                      voice={voice}
                      isCustom
                      isSelected={selectedVoiceId === voice.voiceId}
                      isPlaying={playingVoiceId === voice.voiceId}
                      isLoading={loadingVoiceId === voice.voiceId}
                      onVoiceSelect={handleVoiceSelect}
                      onPlayPreview={playPreview}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
