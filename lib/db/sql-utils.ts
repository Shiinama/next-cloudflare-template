import { and, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

export const pushCondition = (conditions: SQL[], condition?: SQL) => {
  if (condition) {
    conditions.push(condition)
  }
}

export const combineConditions = (conditions: SQL[]) => (conditions.length ? and(...conditions) : undefined)

export const escapeLikePattern = (value: string): string => value.replace(/[%_]/g, '\\$&')

export interface PaginationOptions {
  page?: number
  pageSize?: number
  minPageSize?: number
  maxPageSize?: number
}

export interface PaginationResult {
  page: number
  pageSize: number
  limit: number
  offset: number
}

export const resolvePagination = ({
  page = 1,
  pageSize = 10,
  minPageSize = 1,
  maxPageSize = Number.POSITIVE_INFINITY
}: PaginationOptions = {}): PaginationResult => {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const lowerBound = Math.max(1, Math.floor(minPageSize))
  const upperBound = Math.max(lowerBound, Math.floor(maxPageSize))

  let normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : lowerBound
  if (normalizedPageSize < lowerBound) normalizedPageSize = lowerBound
  if (normalizedPageSize > upperBound) normalizedPageSize = upperBound

  const offset = (normalizedPage - 1) * normalizedPageSize

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    limit: normalizedPageSize,
    offset
  }
}

export const calculateTotalPages = (totalItems: number, pageSize: number): number => {
  if (!Number.isFinite(totalItems) || totalItems <= 0) return 0
  if (!Number.isFinite(pageSize) || pageSize <= 0) return 0
  return Math.ceil(totalItems / pageSize)
}

export interface LikeSearchOptions {
  value?: string | null
  caseInsensitive?: boolean
}

export const buildLikeSearch = (
  columns: AnyColumn[],
  { value, caseInsensitive = true }: LikeSearchOptions
): SQL | undefined => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const normalized = caseInsensitive ? trimmed.toLowerCase() : trimmed
  const escapedPattern = `%${escapeLikePattern(normalized)}%`
  const escapeLiteral = sql.raw("'\\\\'")

  const comparators = columns.map((column) =>
    caseInsensitive
      ? sql`lower(${column}) LIKE ${escapedPattern} ESCAPE ${escapeLiteral}`
      : sql`${column} LIKE ${escapedPattern} ESCAPE ${escapeLiteral}`
  )

  return comparators.length === 1 ? comparators[0] : or(...comparators)
}
