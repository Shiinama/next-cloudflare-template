'use client'

import { useDebounce, useMemoizedFn, useRequest, useUpdateEffect } from 'ahooks'
import { MoreHorizontalIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { deleteArticle, getPaginatedArticles } from '@/actions/ai-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination-client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { formatDate } from '@/lib/utils'

type ArticleStatusFilter = 'all' | 'published' | 'draft'

const ALL_LANGUAGES_OPTION = 'all'
const PAGE_SIZE = 10

export default function ArticlesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchParamValue = searchParams.get('search') ?? ''
  const languageParam = searchParams.get('language') ?? ALL_LANGUAGES_OPTION
  const statusParam = searchParams.get('status') as ArticleStatusFilter | null
  const pageParam = Number(searchParams.get('page') ?? '1')

  const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const selectedLanguage = locales.some((item) => item.code === languageParam) ? languageParam : ALL_LANGUAGES_OPTION
  const statusFilter: ArticleStatusFilter = ['all', 'published', 'draft'].includes(statusParam ?? '')
    ? (statusParam as ArticleStatusFilter)
    : 'all'

  const [searchTerm, setSearchTerm] = useState(searchParamValue)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, { wait: 400 })

  const updateQueryParams = useCallback(
    (updates: Partial<{ page: number; language: string; status: ArticleStatusFilter; search: string }>) => {
      const currentQuery = searchParams.toString()
      const params = new URLSearchParams(currentQuery)

      if (updates.page !== undefined) {
        if (updates.page <= 1) {
          params.delete('page')
        } else {
          params.set('page', String(updates.page))
        }
      }

      if (updates.language !== undefined) {
        if (updates.language === ALL_LANGUAGES_OPTION) {
          params.delete('language')
        } else {
          params.set('language', updates.language)
        }
      }

      if (updates.status !== undefined) {
        if (updates.status === 'all') {
          params.delete('status')
        } else {
          params.set('status', updates.status)
        }
      }

      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search)
        } else {
          params.delete('search')
        }
      }

      const nextQuery = params.toString()
      if (nextQuery === currentQuery) {
        return
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const {
    data,
    loading: isLoading,
    refresh: refreshArticles
  } = useRequest(
    async () => {
      const result = await getPaginatedArticles({
        page: currentPage,
        pageSize: PAGE_SIZE,
        filters: {
          language: selectedLanguage,
          status: statusFilter,
          search: searchParamValue || undefined
        }
      })

      const nextTotalPages = result.pagination.totalPages ?? 0

      if (nextTotalPages === 0 && currentPage !== 1) {
        updateQueryParams({ page: 1 })
      }

      if (nextTotalPages > 0 && currentPage > nextTotalPages) {
        updateQueryParams({ page: nextTotalPages })
      }

      return result
    },
    {
      refreshDeps: [currentPage, selectedLanguage, statusFilter, searchParamValue],
      onError: (error) => {
        console.error('Failed to fetch articles:', error)
        toast.error('加载文章失败，请重试')
      }
    }
  )

  const articles = data?.articles ?? []
  const totalPages = data?.pagination.totalPages ?? 0

  useUpdateEffect(() => {
    if (debouncedSearchTerm === searchParamValue) {
      return
    }

    updateQueryParams({ search: debouncedSearchTerm, page: 1 })
  }, [debouncedSearchTerm, searchParamValue, updateQueryParams])

  const { runAsync: deleteArticleRequest } = useRequest(deleteArticle, { manual: true })

  const handleDelete = useMemoizedFn(async (slug: string, id: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return
    }

    try {
      setIsDeleting(id)
      await deleteArticleRequest(slug)
      toast.success('文章已成功删除')
      await refreshArticles()
    } catch (error) {
      console.error('删除文章失败:', error)
      toast.error('删除文章失败，请重试')
    } finally {
      setIsDeleting(null)
    }
  })

  const handlePageChange = useMemoizedFn((page: number) => {
    updateQueryParams({ page })
  })
  const renderPaginationItems = () => {
    if (totalPages <= 1) {
      return null
    }

    const items: Array<number | 'ellipsis'> = [1]
    const maxVisiblePages = 5
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    if (startPage > 2) {
      items.push('ellipsis')
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(page)
    }

    if (endPage < totalPages - 1) {
      items.push('ellipsis')
    }

    if (totalPages > 1) {
      items.push(totalPages)
    }

    return items.map((item, index) => {
      if (item === 'ellipsis') {
        return (
          <PaginationItem key={`ellipsis-${index}`}>
            <span className="flex h-9 w-9 items-center justify-center">
              <MoreHorizontalIcon className="h-4 w-4" />
            </span>
          </PaginationItem>
        )
      }

      return (
        <PaginationItem key={item}>
          <PaginationLink isActive={currentPage === item} onClick={() => handlePageChange(item)}>
            {item}
          </PaginationLink>
        </PaginationItem>
      )
    })
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章列表</h1>
        <div>
          <Link href="/admin/articles/batch">
            <Button>批量创建</Button>
          </Link>
          <Link href="/admin/articles/new">
            <Button className="ml-4" variant="secondary">
              新建文章
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex min-w-[220px] flex-1 flex-col gap-2">
          <span className="text-muted-foreground text-sm font-medium">搜索</span>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="输入标题、slug 或摘要"
          />
        </div>
        <div className="flex min-w-[160px] flex-col gap-2">
          <span className="text-muted-foreground text-sm font-medium">语言</span>
          <Select value={selectedLanguage} onValueChange={(value) => updateQueryParams({ language: value, page: 1 })}>
            <SelectTrigger>
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LANGUAGES_OPTION}>全部语言</SelectItem>
              {locales.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[160px] flex-col gap-2">
          <span className="text-muted-foreground text-sm font-medium">状态</span>
          <Select
            value={statusFilter}
            onValueChange={(value) => updateQueryParams({ status: value as ArticleStatusFilter, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-lg border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {['封面图', '标题', '创建日期', '语言', '状态', '操作'].map((header) => {
                const isActionsHeader = header === '操作'

                return (
                  <TableHead
                    key={header}
                    className={[
                      'text-muted-foreground px-6 py-3 text-xs font-medium tracking-wider whitespace-nowrap uppercase',
                      isActionsHeader ? 'bg-card sticky right-0 z-10 shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {header}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="flex justify-center">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground px-6 py-4 text-center">
                  暂无文章
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {article.coverImageUrl ? (
                      <div className="bg-muted relative h-[54px] w-24 overflow-hidden rounded-md">
                        <img
                          src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${article.coverImageUrl}`}
                          alt={article.title}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="bg-muted text-muted-foreground flex h-[54px] w-24 items-center justify-center rounded-md text-xs">
                        无图片
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{article.title}</div>
                    <div className="text-muted-foreground truncate text-sm">{article.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                    {formatDate(article.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{locales.find((i) => i.code === article.locale)?.name}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={article.publishedAt ? 'success' : 'secondary'}>
                      {article.publishedAt ? '已发布' : '草稿'}
                    </Badge>
                  </TableCell>
                  <TableCell className="bg-card sticky right-0 px-6 py-4 text-sm font-medium whitespace-nowrap shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]">
                    <Link
                      href={`/admin/articles/edit/${article.slug}`}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      编辑
                    </Link>
                    <Link
                      href={`/blog/${article.slug}`}
                      locale={article.locale}
                      className="text-primary hover:text-primary/80 mr-4"
                      target="_blank"
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => handleDelete(article.slug, article.id)}
                      disabled={isDeleting === article.id}
                      className="text-destructive hover:text-destructive/80 font-medium"
                    >
                      {isDeleting === article.id ? '删除中...' : '删除'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
