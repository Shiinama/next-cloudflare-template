'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { saveBatchArticles } from '@/actions/ai-content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/navigation'
import { locales, routing } from '@/i18n/routing'

export default function BatchArticlesPage() {
  const router = useRouter()
  const [keywordsInput, setKeywordsInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [publishImmediately, setPublishImmediately] = useState(true)
  const [generatedArticles, setGeneratedArticles] = useState<Array<any>>([])
  const [results, setResults] = useState<Array<any>>([])
  const [selectAll, setSelectAll] = useState(true)
  const defaultLocaleCode = routing.defaultLocale
  const defaultLocale = locales.find((item) => item.code === defaultLocaleCode) ?? locales[0]

  const handleGenerate = async () => {
    if (!keywordsInput.trim()) {
      toast.error('关键词不能为空')
      return
    }

    // 按换行符分割关键词并过滤空行
    const keywords = keywordsInput
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (keywords.length === 0) {
      toast.error('没有有效的关键词')
      return
    }

    setIsGenerating(true)
    const batchSize = 8
    const results = []

    try {
      for (let i = 0; i < keywords.length; i += batchSize) {
        const batch = keywords.slice(i, i + batchSize)
        const batchPromises = batch.map(async (keyword) => {
          const response = await fetch('/api/generate-article', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyword })
          })

          if (!response.ok) {
            const errorData = await response.json()
            return {
              keyword,
              error: errorData,
              status: 'error'
            }
          }

          const article = await response.json()
          return {
            keyword,
            article,
            status: 'success'
          }
        })

        const batchResults = []
        for (const promise of batchPromises) {
          try {
            const result = await promise
            batchResults.push(result)
          } catch (error) {
            batchResults.push({
              status: 'error',
              error: error instanceof Error ? error.message : '未知错误'
            })
          }
        }
        results.push(...batchResults)
      }

      const articlesWithSelection = results.map((item) => ({
        ...item,
        selected: item.status === 'success'
      }))

      setGeneratedArticles(articlesWithSelection)

      const successCount = results.filter((a) => a.status === 'success').length
      const errorCount = results.filter((a) => a.status === 'error').length

      toast.success(`成功生成 ${successCount} 篇文章${errorCount > 0 ? `，但有 ${errorCount} 个错误` : ''}`)
    } catch (error) {
      console.error('生成文章时出错:', error)
      toast.error('生成文章失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (generatedArticles.length === 0) {
      toast.error('没有可保存的文章')
      return
    }

    const selectedArticles = generatedArticles
      .filter((item) => item.status === 'success' && item.selected)
      .map((item) => ({
        ...item.article,
        selected: true
      }))

    if (selectedArticles.length === 0) {
      toast.error('没有选择任何文章')
      return
    }

    setIsSaving(true)
    try {
      const saveResults = await saveBatchArticles(selectedArticles, publishImmediately)
      setResults(saveResults)

      const successCount = saveResults.filter((r) => r.status === 'success').length
      const errorCount = saveResults.filter((r) => r.status === 'error').length

      toast.success(
        `成功保存 ${successCount} 篇文章${publishImmediately ? '并已发布' : '为草稿'}${
          errorCount > 0 ? `，但有 ${errorCount} 个错误` : ''
        }`
      )
    } catch (error) {
      console.error('保存文章时出错:', error)
      toast.error('保存文章失败')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)

    setGeneratedArticles(
      generatedArticles.map((item) => ({
        ...item,
        selected: item.status === 'success' ? newSelectAll : false
      }))
    )
  }

  const toggleArticleSelection = (index: number) => {
    const updatedArticles = [...generatedArticles]
    updatedArticles[index] = {
      ...updatedArticles[index],
      selected: !updatedArticles[index].selected
    }
    setGeneratedArticles(updatedArticles)

    // 根据所有成功文章是否都被选中来更新selectAll状态
    const allSuccessfulSelected = updatedArticles
      .filter((item) => item.status === 'success')
      .every((item) => item.selected)

    setSelectAll(allSuccessfulSelected)
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">批量生成文章</h1>
        <Button variant="outline" onClick={() => router.back()}>
          返回文章列表
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>关键词输入</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="keywords">请输入关键词（每行一个）</Label>
            <Textarea
              id="keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="输入关键词，每行一个..."
              rows={5}
              disabled={isGenerating}
              className="mt-4 font-mono"
            />
          </div>

          {/* 默认语言展示 */}
          <div className="mb-4">
            <Label className="mb-2 block">语言</Label>
            <div className="w-full rounded-md border px-3 py-2 text-sm sm:w-[240px]">
              {defaultLocale?.name ?? defaultLocaleCode.toUpperCase()} ({defaultLocaleCode.toUpperCase()})
            </div>
            <p className="text-muted-foreground mt-1 text-xs">批量文章将以默认语言创建。</p>
          </div>

          <div className="mb-4 flex items-center space-x-2">
            <Switch id="published" checked={publishImmediately} onCheckedChange={setPublishImmediately} />
            <Label htmlFor="published">立即发布</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isGenerating || !keywordsInput.trim()}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGenerating ? '正在生成...' : '生成文章'}
            </Button>

            {generatedArticles.length > 0 && (
              <Button
                onClick={handleSave}
                disabled={isSaving || !generatedArticles.some((a) => a.selected && a.status === 'success')}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? '正在保存...' : '保存选中文章'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>已生成的文章</span>
              {generatedArticles.some((a) => a.status === 'success') && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="selectAll" checked={selectAll} onCheckedChange={toggleSelectAll} />
                  <Label htmlFor="selectAll" className="text-sm font-normal">
                    全选
                  </Label>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedArticles.map((item, index) => (
                <div key={index} className="flex items-center rounded border p-2">
                  {item.status === 'success' && (
                    <div className="mr-2">
                      <Checkbox
                        id={`article-${index}`}
                        checked={item.selected}
                        onCheckedChange={() => toggleArticleSelection(index)}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="font-medium">{item.status === 'success' ? item.article.title : item.keyword}</span>
                  </div>
                  <div>
                    {item.status === 'success' ? (
                      <span className="text-success font-medium">已生成</span>
                    ) : (
                      <span className="text-destructive font-medium">失败</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>保存结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center rounded border p-2">
                  <div className="flex-1">
                    <span className="font-medium">{result.title}</span>
                  </div>
                  <div>
                    {result.status === 'success' ? (
                      <span className="text-success font-medium">已保存</span>
                    ) : (
                      <span className="text-destructive font-medium">失败</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
