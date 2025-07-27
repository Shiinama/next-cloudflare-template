'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { designVoice, saveVoice } from '@/actions/design-voice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/contexts/user-context'
import { ProcessedVoicePreview } from '@/store/voices.store'

export function VoiceDesigner({ getVoices }: { getVoices: () => Promise<void> }) {
  const [voicePreviews, setVoicePreviews] = useState<ProcessedVoicePreview[]>([])
  const [voicePrompt, setVoicePrompt] = useState(
    'A tiny, high-pitched female voice of a mouse with an adorable, squeaky timbre. Light and airy tone with a playful, mischievous energy. Speaking at a quick, excited pace with frequent giggles and animated inflections. Has a slight lisp that adds to the cuteness factor. The voice is sweet but with a hint of sassy confidence, like a cartoon character. Perfect audio quality.'
  )
  const [voiceNames, setVoiceNames] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})

  const { checkIsPaid } = useUser()

  const handleGenerateVoices = async () => {
    if (!checkIsPaid()) return

    if (!voicePrompt.trim()) return

    try {
      setIsGenerating(true)
      // 清理之前的预览
      voicePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
      setVoicePreviews([])
      setVoiceNames({})

      const previews = await designVoice({
        voiceDescription: voicePrompt,
        text: 'Hi darling, welcome to a world where my voice becomes your favorite addiction. Let me whisper secrets that make your pulse quicken, speak words that ignite your imagination, and create a symphony of desire that only we can share. Close your eyes and let my voice take you on a journey you will never forget.'
      })

      const processedPreviews = previews.map((preview) => {
        const blob = new Blob([Uint8Array.from(atob(preview.audioBase64), (c) => c.charCodeAt(0))], {
          type: preview.mediaType
        })
        return {
          url: URL.createObjectURL(blob),
          voiceId: preview.generatedVoiceId,
          duration: preview.durationSecs,
          mediaType: preview.mediaType
        }
      })

      setVoicePreviews(processedPreviews)
    } catch {
      toast.error('Failed to generate voices. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveVoice = async (voiceId: string) => {
    const voiceName = voiceNames[voiceId]
    if (!voiceName?.trim()) return

    try {
      setSavingStates((prev) => ({ ...prev, [voiceId]: true }))
      await saveVoice({
        voiceName,
        voiceDescription: voicePrompt,
        generatedVoiceId: voiceId
      })

      getVoices()

      // 保存成功后移除这个预览
      const previewToRemove = voicePreviews.find((p) => p.voiceId === voiceId)
      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove.url)
      }

      setVoicePreviews((prev) => prev.filter((p) => p.voiceId !== voiceId))
      setVoiceNames((prev) => {
        const newNames = { ...prev }
        delete newNames[voiceId]
        return newNames
      })

      toast.success(`Voice "${voiceName}" saved successfully!`)
    } catch {
      toast.error('Failed to save voice. Please try again.')
    } finally {
      setSavingStates((prev) => ({ ...prev, [voiceId]: false }))
    }
  }

  const handleRemovePreview = (voiceId: string) => {
    const previewToRemove = voicePreviews.find((p) => p.voiceId === voiceId)
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove.url)
    }

    setVoicePreviews((prev) => prev.filter((p) => p.voiceId !== voiceId))
    setVoiceNames((prev) => {
      const newNames = { ...prev }
      delete newNames[voiceId]
      return newNames
    })
  }

  const updateVoiceName = (voiceId: string, name: string) => {
    setVoiceNames((prev) => ({ ...prev, [voiceId]: name }))
  }

  const clearAllPreviews = () => {
    voicePreviews.forEach((preview) => URL.revokeObjectURL(preview.url))
    setVoicePreviews([])
    setVoiceNames({})
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Voice Designer</h2>
        <p className="text-muted-foreground mt-1">
          Design and own your personalized AI voice model. (Exclusive to Premium members)
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          value={voicePrompt}
          onChange={(e) => setVoicePrompt(e.target.value)}
          placeholder="Describe the voice you want to generate (e.g., A warm, friendly female voice with a slight British accent...)"
          rows={3}
          disabled={isGenerating}
          className="resize-none"
        />

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateVoices}
            disabled={isGenerating || !voicePrompt.trim()}
            size="lg"
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Voices'
            )}
          </Button>

          {voicePreviews.length > 0 && (
            <Button variant="outline" onClick={clearAllPreviews} disabled={isGenerating}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {voicePreviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Generated Voices ({voicePreviews.length})</h3>

          <div className="space-y-3">
            {voicePreviews.map((preview, index) => {
              const isSaving = savingStates[preview.voiceId] || false
              const voiceName = voiceNames[preview.voiceId] || ''

              return (
                <div key={preview.voiceId} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Voice {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">{preview.duration.toFixed(1)}s</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePreview(preview.voiceId)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <audio controls src={preview.url} className="w-full" />

                  <div className="flex gap-2">
                    <Input
                      value={voiceName}
                      onChange={(e) => updateVoiceName(preview.voiceId, e.target.value)}
                      placeholder="Enter voice name..."
                      disabled={isSaving}
                      className="flex-1"
                    />
                    <Button onClick={() => handleSaveVoice(preview.voiceId)} disabled={isSaving || !voiceName.trim()}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
