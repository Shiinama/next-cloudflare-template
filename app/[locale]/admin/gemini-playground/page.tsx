'use client'

import { Model } from '@google/genai'
import { Loader } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { generateWithGemini, getModelsWithGemini } from '@/actions/gemini-ai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

type FormValues = {
  userPrompt: string
  model: string
  temperature: number
  maxOutputTokens: number
  systemPrompt: string
  useGoogleSearch: boolean
}

const DefaultModel = 'models/gemini-2.5-flash-lite-preview-06-17'

export default function GeminiPlayground() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [models, setModels] = useState<Model[]>([])
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      userPrompt: '',
      model: DefaultModel,
      temperature: 0.7,
      maxOutputTokens: 65535,
      systemPrompt: '',
      useGoogleSearch: true
    }
  })

  const temperature = watch('temperature')
  const maxOutputTokens = watch('maxOutputTokens')
  const useGoogleSearch = watch('useGoogleSearch')

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelsList = await getModelsWithGemini()
        setModels(modelsList)
      } catch (err) {
        console.error('Failed to fetch models:', err)
        setError('Failed to load Gemini models. Please check your API key configuration.')
      }
    }

    fetchModels()
  }, [])

  const se = useSession()

  const onSubmit = async (data: FormValues) => {
    if (!se.data?.user?.id) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await generateWithGemini({
        prompt: data.userPrompt, // For backward compatibility
        userPrompt: data.userPrompt,
        userId: se.data?.user?.id,
        model: data.model.split('models/')[1],
        temperature: data.temperature,
        maxOutputTokens: data.maxOutputTokens,
        systemPrompt: data.systemPrompt
      })

      if (response.text) {
        setResult(response.text)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">Gemini AI Playground</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure your Gemini AI request</CardDescription>
          </CardHeader>

          <CardContent>
            <form id="gemini-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select defaultValue={DefaultModel} onValueChange={(value) => setValue('model', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-auto">
                    {models.map((model) => {
                      return (
                        <SelectItem key={model.name} value={model.name!}>
                          {model.displayName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPrompt">User Prompt</Label>
                <Textarea
                  id="userPrompt"
                  placeholder="Enter your prompt here..."
                  className="min-h-32"
                  {...register('userPrompt', { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Enter system instructions here..."
                  className="min-h-20"
                  {...register('systemPrompt')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={(value) => setValue('temperature', value[0])}
                />
                <p className="text-muted-foreground text-xs">
                  Lower values make output more focused and deterministic, higher values make output more creative.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxOutputTokens">Max Output Tokens: {maxOutputTokens}</Label>
                </div>
                <Slider
                  id="maxOutputTokens"
                  min={1024}
                  max={65535}
                  step={1024}
                  value={[maxOutputTokens]}
                  onValueChange={(value) => setValue('maxOutputTokens', value[0])}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="useGoogleSearch"
                  checked={useGoogleSearch}
                  onCheckedChange={(checked) => setValue('useGoogleSearch', checked)}
                />
                <Label htmlFor="useGoogleSearch">Enable Google Search</Label>
              </div>
            </form>
          </CardContent>

          <CardFooter>
            <Button type="submit" form="gemini-form" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Generated content will appear here</CardDescription>
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="bg-destructive/15 text-destructive rounded-md p-4">
                <p>{error}</p>
              </div>
            ) : isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader className="text-primary h-8 w-8 animate-spin" />
              </div>
            ) : result ? (
              <div className="prose dark:prose-invert max-w-none">
                <pre className="bg-muted rounded-md p-4 font-mono text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            ) : (
              <div className="text-muted-foreground flex h-64 items-center justify-center">
                <p>Your generated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
