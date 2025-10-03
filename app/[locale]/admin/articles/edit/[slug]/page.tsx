'use client'

import { useRequest, useSetState } from 'ahooks'
import { Loader2, RefreshCw } from 'lucide-react'
import { use, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

import { deleteArticle, generateArticleCoverImage, getArticleBySlug, updateArticle } from '@/actions/ai-content'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/navigation'

type FormState = {
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
}

const EMPTY_FORM_STATE: FormState = {
  title: '',
  excerpt: '',
  content: '',
  coverImageUrl: ''
}

export default function EditArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const router = useRouter()
  const { slug, locale } = use(params)

  const [formState, setFormState] = useSetState<FormState>(EMPTY_FORM_STATE)
  const [isPublished, setIsPublished] = useState(false)

  const {
    data: article = null,
    loading: isLoading,
    mutate: mutateArticle
  } = useRequest(
    async () => {
      const data = await getArticleBySlug(slug, locale)

      if (!data) {
        toast.error('文章未找到')
        router.back()
        return null
      }

      return data
    },
    {
      refreshDeps: [slug, locale],
      onSuccess: (data) => {
        if (!data) return
        setFormState({
          title: data.title ?? '',
          excerpt: data.excerpt ?? '',
          content: data.content ?? '',
          coverImageUrl: data.coverImageUrl ?? ''
        })
        setIsPublished(Boolean(data.publishedAt))
      },
      onError: (error) => {
        console.error('获取文章时出错:', error)
        toast.error('获取文章失败')
      }
    }
  )

  const { runAsync: saveArticle, loading: isSaving } = useRequest(
    async () => {
      if (!article) return

      const payload = {
        locale: article.locale,
        title: formState.title,
        content: formState.content,
        excerpt: formState.excerpt,
        coverImageUrl: formState.coverImageUrl.trim().length > 0 ? formState.coverImageUrl : null,
        ...(article.isDefaultLocale ? { publishedAt: isPublished ? new Date() : null } : {})
      }

      const updated = await updateArticle(article.baseSlug, payload)

      if (!updated) {
        throw new Error('未能获取更新后的文章信息')
      }

      mutateArticle(updated)
      setFormState({
        title: updated.title ?? '',
        excerpt: updated.excerpt ?? '',
        content: updated.content ?? '',
        coverImageUrl: updated.coverImageUrl ?? ''
      })
      setIsPublished(Boolean(updated.publishedAt))

      toast.success('文章已更新')
      router.back()
    },
    {
      manual: true,
      onError: (error) => {
        console.error('更新文章时出错:', error)
        toast.error('更新文章失败')
      }
    }
  )

  const { runAsync: removeArticle, loading: isDeleting } = useRequest(
    async () => {
      if (!article) return

      await deleteArticle(article.baseSlug)
      toast.success('文章已删除')
      router.back()
    },
    {
      manual: true,
      onError: (error) => {
        console.error('删除文章时出错:', error)
        toast.error('删除文章失败')
      }
    }
  )

  const { runAsync: regenerateCover, loading: isGeneratingCover } = useRequest(
    async () => {
      const contentSource = formState.content.trim()
      if (!contentSource) return

      const imageUrl = await generateArticleCoverImage(
        contentSource,
        formState.title || article?.baseArticle.title || 'Article Cover'
      )

      if (imageUrl) {
        setFormState({ coverImageUrl: imageUrl })
        mutateArticle((prev) => (prev ? { ...prev, coverImageUrl: imageUrl } : prev))
        toast.success('封面图已重新生成')
      } else {
        toast.error('生成封面图失败')
      }
    },
    {
      manual: true,
      onError: (error) => {
        console.error('生成封面图时出错:', error)
        toast.error('生成封面图失败')
      }
    }
  )

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof FormState) => {
    const { value } = event.target
    setFormState({ [field]: value } as any)
  }

  const handlePublishToggle = () => {
    if (!article) return
    if (!article.isDefaultLocale) {
      toast.warning('仅可在默认语言下更改发布状态')
      return
    }
    setIsPublished((prev) => !prev)
  }

  const handleSave = () => {
    if (!article) return
    saveArticle()
  }

  const handleDelete = () => {
    if (!article) return
    removeArticle()
  }

  const handleRegenerateCover = () => {
    if (!formState.content.trim()) {
      toast.error('需要文章内容才能生成封面图')
      return
    }
    regenerateCover()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>正在加载...</p>
      </div>
    )
  }

  if (!article) {
    return null
  }

  const displayImageKey = formState.coverImageUrl || article.coverImageUrl || article.baseArticle.coverImageUrl

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? '正在删除...' : '删除文章'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>确定要删除这篇文章吗？此操作无法撤销。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {!article.isDefaultLocale && (
        <div className="text-muted-foreground mb-6 rounded-md border border-dashed p-4 text-sm">
          当前正在编辑 <span className="font-medium">{article.locale.toUpperCase()}</span> 版本， 基础语言为{' '}
          <span className="font-medium">{article.defaultLocale.toUpperCase()}</span>。 发布状态由基础语言统一管理。
        </div>
      )}

      <div className="bg-card rounded-lg border p-6 shadow">
        <div className="mb-4">
          <Label htmlFor="title">标题</Label>
          <Input id="title" value={formState.title} onChange={(event) => handleInputChange(event, 'title')} />
        </div>

        <div className="mb-4">
          <Label htmlFor="excerpt">摘要</Label>
          <Textarea
            id="excerpt"
            value={formState.excerpt}
            onChange={(event) => handleInputChange(event, 'excerpt')}
            rows={3}
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="coverImageUrl">封面图</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateCover}
              disabled={isGeneratingCover}
              className="flex items-center gap-1"
            >
              {isGeneratingCover ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>重新生成</span>
                </>
              )}
            </Button>
          </div>
          <div className="mt-2 rounded-md border">
            {displayImageKey ? (
              <figure className="relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${displayImageKey}`}
                  alt={formState.title || article.baseArticle.title}
                  className="h-auto w-full rounded-md"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                />
              </figure>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                <p className="text-sm text-gray-500">无封面图</p>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">封面图将显示在文章列表和文章详情页面顶部</p>
        </div>

        <div className="mb-6">
          <Label htmlFor="content">内容</Label>
          <Textarea
            id="content"
            value={formState.content}
            onChange={(event) => handleInputChange(event, 'content')}
            rows={20}
            className="font-mono"
          />
        </div>

        <div className="mb-6 flex items-center space-x-2">
          <Switch
            id="published"
            checked={isPublished}
            onCheckedChange={handlePublishToggle}
            disabled={!article.isDefaultLocale}
          />
          <Label htmlFor="published">发布文章</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '正在保存...' : '保存文章'}
          </Button>
        </div>
      </div>
    </>
  )
}
