'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { cloudflareTextToImage, ImageRatio, ImageStyle } from '@/actions/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface ImageGeneratorProps {
  className?: string
}

const ratioOptions: { value: ImageRatio; label: string; description: string }[] = [
  { value: '1:1', label: 'Square (1:1)', description: '1024×1024 - Perfect for profile pictures and icons' },
  {
    value: '16:9',
    label: 'Landscape (16:9)',
    description: '1280×720 - Ideal for desktop wallpapers and presentations'
  },
  { value: '4:3', label: 'Standard (4:3)', description: '1024×768 - Classic computer screen ratio' },
  { value: '3:2', label: 'Photo (3:2)', description: '1200×800 - Common photography aspect ratio' },
  { value: '9:16', label: 'Portrait (9:16)', description: '720×1280 - Perfect for mobile screens and stories' },
  { value: 'custom', label: 'Custom', description: 'Specify your own dimensions' }
]

const styleOptions: { value: ImageStyle; label: string; description: string }[] = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic images with high detail' },
  { value: 'artistic', label: 'Artistic', description: 'Painterly style with expressive brushstrokes' },
  { value: 'anime', label: 'Anime', description: 'Japanese animation style with clean lines' },
  { value: 'cinematic', label: 'Cinematic', description: 'Movie-like scenes with dramatic lighting' },
  { value: 'fantasy', label: 'Fantasy', description: 'Magical and ethereal fantasy art style' },
  { value: 'abstract', label: 'Abstract', description: 'Non-representational art with bold shapes and colors' }
]

export function ImageGenerator({ className }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState<string>('')
  const [negativePrompt, setNegativePrompt] = useState<string>(
    'blurry, low quality, distorted, deformed, text, watermark, signature, username, logo, copyright'
  )
  const [ratio, setRatio] = useState<ImageRatio>('16:9')
  const [style, setStyle] = useState<ImageStyle>('realistic')
  const [customWidth, setCustomWidth] = useState<number>(1024)
  const [customHeight, setCustomHeight] = useState<number>(1024)
  const [steps, setSteps] = useState<number>(8)
  const [seed, setSeed] = useState<number | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageMetadata, setImageMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      setIsGenerating(true)
      setError(null)

      const result = await cloudflareTextToImage({
        prompt,
        negativePrompt: negativePrompt || undefined,
        ratio,
        style,
        customWidth: ratio === 'custom' ? customWidth : undefined,
        customHeight: ratio === 'custom' ? customHeight : undefined,
        steps,
        seed: seed || undefined
      })

      if (result.success && result.imageData) {
        setGeneratedImage(result.imageData)
        if (result.imageUrl) {
          setImageUrl(result.imageUrl)
        }
        if (result.metadata) {
          setImageMetadata(result.metadata)
        }
      } else {
        setError(result.error || 'Failed to generate image')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647))
  }

  return (
    <div className={`flex flex-col space-y-6 ${className}`}>
      <div className="flex flex-col space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-base font-medium">
            Image Prompt
          </Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate in detail..."
            disabled={isGenerating}
            className="min-h-24"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="style" className="text-sm font-medium">
              Image Style
            </Label>
            <Select value={style} onValueChange={(value) => setStyle(value as ImageStyle)} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {styleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ratio" className="text-sm font-medium">
              Aspect Ratio
            </Label>
            <Select value={ratio} onValueChange={(value) => setRatio(value as ImageRatio)} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue placeholder="Select ratio" />
              </SelectTrigger>
              <SelectContent>
                {ratioOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {ratio === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customWidth" className="text-sm font-medium">
                Width (px)
              </Label>
              <Input
                id="customWidth"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                min={256}
                max={2048}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customHeight" className="text-sm font-medium">
                Height (px)
              </Label>
              <Input
                id="customHeight"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                min={256}
                max={2048}
                disabled={isGenerating}
              />
            </div>
          </div>
        )}

        <div className="flex items-center">
          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs">
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="negativePrompt" className="text-sm font-medium">
                Negative Prompt (things to avoid)
              </Label>
              <Textarea
                id="negativePrompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Elements you want to exclude from the image..."
                disabled={isGenerating}
                className="min-h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="steps" className="text-sm font-medium">
                  Generation Steps
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="steps"
                    type="number"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    min={4}
                    max={50}
                    disabled={isGenerating}
                  />
                  <span className="text-xs text-gray-500">
                    {steps < 8 ? 'Faster' : steps > 20 ? 'Higher quality' : 'Balanced'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seed" className="text-sm font-medium">
                  Seed
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="seed"
                    type="number"
                    value={seed || ''}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Random"
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRandomSeed}
                    disabled={isGenerating}
                    title="Generate random seed"
                  >
                    🎲
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Use the same seed to create similar images</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 pt-2">
          <Button onClick={handleGenerateImage} disabled={isGenerating || !prompt.trim()} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Image...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      {generatedImage && (
        <div className="space-y-4">
          <Separator />

          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Generated Image</h3>

            <div className="overflow-hidden rounded-md border">
              <figure className="mx-auto flex max-w-3xl flex-col items-center">
                <img src={generatedImage} alt={prompt} className="h-auto w-full" loading="lazy" />
                <figcaption className="bg-muted/20 text-muted-foreground w-full p-3 text-sm">
                  <p className="font-medium">{prompt}</p>

                  {imageMetadata && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                      <div>
                        <span className="font-semibold">Style:</span> {imageMetadata.style}
                      </div>
                      <div>
                        <span className="font-semibold">Dimensions:</span> {imageMetadata.width}×{imageMetadata.height}
                      </div>
                      <div>
                        <span className="font-semibold">Steps:</span> {imageMetadata.steps}
                      </div>
                      <div>
                        <span className="font-semibold">Seed:</span> {imageMetadata.seed || 'Random'}
                      </div>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="mt-3">
                      <a
                        href={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${imageUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary inline-flex items-center hover:underline"
                      >
                        <span>View full resolution</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-1 h-3 w-3"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  )}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
