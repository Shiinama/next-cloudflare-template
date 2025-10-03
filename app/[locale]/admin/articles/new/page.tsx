'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { cloudflareTextToImage } from '@/actions/ai'
import { generateArticle, saveGeneratedArticle } from '@/actions/ai-content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/navigation'
import { locales, routing } from '@/i18n/routing'

export default function NewArticlePage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<{
    title: string
    slug: string
    content: string
    excerpt: string
  }>()
  const [isSaving, setIsSaving] = useState(false)
  const [publishImmediately, setPublishImmediately] = useState(true)

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const defaultLocaleCode = routing.defaultLocale
  const defaultLocale = locales.find((item) => item.code === defaultLocaleCode) ?? locales[0]

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      toast.error('关键词不能为空')
      return
    }

    setIsGenerating(true)
    try {
      const article = await generateArticle({
        keyword: keyword.trim()
      })
      if (article) {
        setGeneratedArticle(article)
        setCoverImageUrl(article.coverImageUrl ?? null)
        toast.success('文章生成成功')
      }
    } catch (error) {
      console.error('生成文章时出错:', error)
      toast.error('生成文章失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedArticle) return

    setIsSaving(true)
    try {
      // 将语言和封面图传递给保存函数
      await saveGeneratedArticle(
        {
          ...generatedArticle,
          coverImageUrl: coverImageUrl || undefined
        },
        publishImmediately
      )
      toast.success(publishImmediately ? '文章已发布' : '文章已保存为草稿')
      router.back()
    } catch (error) {
      console.error('保存文章时出错:', error)
      toast.error('保存文章失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (!generatedArticle) return
    setGeneratedArticle({
      ...generatedArticle,
      [field]: e.target.value
    })
  }

  // 生成封面图的函数
  const handleGenerateCoverImage = async () => {
    if (!generatedArticle?.title) {
      toast.error('需要先生成文章内容')
      return
    }

    setIsGeneratingImage(true)
    try {
      // 使用文章标题作为提示词生成图片
      const result = await cloudflareTextToImage({
        prompt: `${generatedArticle.title} - high quality, professional blog cover image`,
        ratio: '16:9',
        style: 'artistic',
        steps: 8
      })

      if (result.imageUrl) {
        setCoverImageUrl(result.imageUrl)
        toast.success('封面图生成成功')
      } else {
        toast.error(result.error || '生成封面图失败')
      }
    } catch (error) {
      console.error('生成封面图时出错:', error)
      toast.error('生成封面图失败')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">新建文章</h1>
        <Button variant="outline" onClick={() => router.back()}>
          返回文章列表
        </Button>
      </div>

      <div className="border-border bg-card mb-6 rounded-lg border p-6 shadow">
        <div className="mb-4">
          <Label htmlFor="keyword">关键词</Label>
          <div className="mt-4 flex gap-2">
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词以生成文章..."
              disabled={isGenerating}
            />
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGenerating ? '正在生成...' : '生成文章'}
            </Button>
          </div>
        </div>

        {/* 默认语言展示 */}
        <div className="mb-4">
          <Label className="mb-2 block">语言</Label>
          <div className="w-full rounded-md border px-3 py-2 text-sm sm:w-[240px]">
            {defaultLocale?.name ?? defaultLocaleCode.toUpperCase()} ({defaultLocaleCode.toUpperCase()})
          </div>
          <p className="text-muted-foreground mt-1 text-xs">新文章将以默认语言创建。</p>
        </div>
      </div>

      {generatedArticle && (
        <div className="border-border bg-card rounded-lg border p-6 shadow">
          <div className="mb-4">
            <Label htmlFor="title">标题</Label>
            <Input id="title" value={generatedArticle.title} onChange={(e) => handleInputChange(e, 'title')} />
          </div>

          <div className="mb-4">
            <Label htmlFor="slug">URL 别名</Label>
            <Input id="slug" value={generatedArticle.slug} onChange={(e) => handleInputChange(e, 'slug')} />
          </div>

          <div className="mb-4">
            <Label htmlFor="excerpt">摘要</Label>
            <Textarea
              id="excerpt"
              value={generatedArticle.excerpt}
              onChange={(e) => handleInputChange(e, 'excerpt')}
              rows={3}
            />
          </div>

          {/* 封面图部分 */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="coverImage">封面图</Label>
              <Button variant="outline" size="sm" onClick={handleGenerateCoverImage} disabled={isGeneratingImage}>
                {isGeneratingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGeneratingImage ? '正在生成...' : '生成封面图'}
              </Button>
            </div>

            {coverImageUrl && (
              <div className="mt-2 overflow-hidden rounded-md border">
                <img
                  src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${coverImageUrl}`}
                  alt="文章封面"
                  className="aspect-video h-auto w-full object-cover"
                />
              </div>
            )}

            {!coverImageUrl && (
              <div className="mt-2 rounded-md border border-dashed p-8 text-center text-gray-500">
                点击"生成封面图"按钮创建文章封面
              </div>
            )}
          </div>

          <div className="mb-6">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={generatedArticle.content}
              onChange={(e) => handleInputChange(e, 'content')}
              rows={20}
              className="font-mono"
            />
          </div>

          <div className="mb-6 flex items-center space-x-2">
            <Switch id="published" checked={publishImmediately} onCheckedChange={setPublishImmediately} />
            <Label htmlFor="published">立即发布</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? '正在保存...' : '保存文章'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
