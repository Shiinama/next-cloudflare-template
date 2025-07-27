'use client'

import { Voice } from '@elevenlabs/elevenlabs-js/api'
import { Play, Pause } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VoiceCardProps {
  voice: Voice
  isCustom?: boolean
  isSelected: boolean
  isPlaying: boolean
  isLoading: boolean
  onVoiceSelect: (voiceId: string) => void
  onPlayPreview: (voiceId: string, previewUrl: string) => void
}

export const VoiceCard = memo(
  ({ voice, isCustom, isSelected, isPlaying, isLoading, onVoiceSelect, onPlayPreview }: VoiceCardProps) => {
    const voiceId = voice.voiceId

    return (
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-sm ${
          isSelected
            ? 'border-primary bg-primary/5 ring-primary/20 shadow-sm ring-1'
            : 'border-border bg-card hover:border-border/80 hover:bg-accent/50'
        }`}
        onClick={() => onVoiceSelect(voiceId)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-foreground truncate text-sm font-medium">{voice.name}</CardTitle>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                {voice.labels?.description || voice.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onPlayPreview(voiceId, voice.previewUrl!)
              }}
              disabled={isLoading}
              className="hover:bg-accent ml-2 h-8 w-8 shrink-0 p-0"
            >
              {isLoading ? (
                <div className="border-muted-foreground h-3 w-3 animate-spin rounded-full border border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {isCustom ? (
              <Badge variant="outline" className="text-xs">
                Custom Voice
              </Badge>
            ) : (
              voice?.labels &&
              Object.entries(voice.labels).map(
                ([key, value]) =>
                  value && (
                    <Badge key={key} variant="outline" className="text-xs">
                      {value}
                    </Badge>
                  )
              )
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

VoiceCard.displayName = 'VoiceCard'
