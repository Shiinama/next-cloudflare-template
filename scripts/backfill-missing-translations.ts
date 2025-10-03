import 'dotenv/config'

import Database from 'better-sqlite3'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { desc, inArray } from 'drizzle-orm'
import { drizzle as drizzleBetter } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy'
import type { AsyncRemoteCallback, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'

import { locales } from '@/i18n/routing'
import { d1HttpDriver } from '@/lib/db/d1-http-driver'
import * as schema from '@/lib/db/schema'
import { postTranslations, posts } from '@/lib/db/schema'

type MissingTask = {
  postId: string
  slug: string
  locale: string
}

type DatabaseMode = 'local' | 'remote'
type ExecutionMode = DatabaseMode | 'auto'

// Default location where Miniflare stores the local D1 sqlite database.
const LOCAL_DB_BASE = join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')
const MAX_RETRIES = 5
const INITIAL_BACKOFF_DELAY_MS = 1000
const MAX_BACKOFF_DELAY_MS = 20000
const BACKOFF_JITTER_RATIO = 0.25

const ensureTrailingSlash = (value: string): string => (value.endsWith('/') ? value : `${value}/`)

const BASE_LOCALE = 'en'
const REQUEST_DELAY_MS = 500
const REQUEST_TIMEOUT_MS = 20000
const TRANSLATION_LOCALES = locales.map((locale) => locale.code).filter((code) => code !== BASE_LOCALE)

if (TRANSLATION_LOCALES.length === 0) {
  throw new Error('No valid locales provided. Check the locales configuration.')
}

const parseExecutionMode = (argv: string[]): ExecutionMode => {
  const args = [...argv]

  for (const arg of args) {
    if (arg === '--local') {
      return 'local'
    }
    if (arg === '--remote') {
      return 'remote'
    }

    const modeEqualsMatch = arg.match(/^--mode=(.+)$/)
    if (modeEqualsMatch) {
      const value = modeEqualsMatch[1]
      if (value === 'local' || value === 'remote') {
        return value
      }
      throw new Error(`Invalid mode "${value}". Use "local" or "remote".`)
    }
  }

  const modeIndex = args.findIndex((arg) => arg === '--mode')
  if (modeIndex !== -1) {
    const value = args[modeIndex + 1]
    if (!value) {
      throw new Error('Missing value for --mode. Use "local" or "remote".')
    }
    if (value === 'local' || value === 'remote') {
      return value
    }
    throw new Error(`Invalid mode "${value}". Use "local" or "remote".`)
  }

  return 'auto'
}

const createRemoteDb = () => {
  const wrappedDriver: AsyncRemoteCallback = async (sql, params, method) => {
    if (method === 'values') {
      return d1HttpDriver(sql, params, 'all')
    }
    return d1HttpDriver(sql, params, method as 'all' | 'run' | 'get')
  }

  return drizzleProxy(wrappedDriver, { schema })
}

const findSqliteFile = (): string | null => {
  const manualPath = process.env.LOCAL_DB_PATH || process.env.SQLITE_PATH
  if (manualPath) {
    return manualPath
  }

  if (!existsSync(LOCAL_DB_BASE)) {
    return null
  }

  const stack = [LOCAL_DB_BASE]
  while (stack.length > 0) {
    const current = stack.pop()!
    const entries = readdirSync(current, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.sqlite')) {
        return fullPath
      }
    }
  }

  return null
}

const openLocalDb = (filePath: string) => {
  const sqlite = new Database(filePath)
  return {
    db: drizzleBetter(sqlite, { schema }),
    close: () => sqlite.close(),
    mode: 'local'
  }
}

const getDbClient = (mode: ExecutionMode) => {
  if (mode !== 'remote') {
    const localFile = findSqliteFile()
    if (localFile) {
      console.log(`Using local SQLite database: ${localFile}`)
      return openLocalDb(localFile)
    }

    if (mode === 'local') {
      throw new Error(
        'Local mode requested but no SQLite database was found. Set LOCAL_DB_PATH or ensure the Miniflare database exists.'
      )
    }
  }

  const requiredEnv = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'DATABASE_ID'] as const
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing ${key}. Provide LOCAL_DB_PATH or set Cloudflare D1 credentials.`)
    }
  }

  console.log('Using remote Cloudflare D1 database.')
  return {
    db: createRemoteDb(),
    close: () => {},
    mode: 'remote' as DatabaseMode
  }
}

const findMissingTranslations = async (
  db: SqliteRemoteDatabase<typeof schema>,
  baseLocale: string,
  targetLocales: string[]
): Promise<MissingTask[]> => {
  const basePosts = await db.select({ id: posts.id, slug: posts.slug }).from(posts).orderBy(desc(posts.createdAt))

  if (basePosts.length === 0) {
    return []
  }

  const localesToCheck = targetLocales.filter((locale) => locale !== baseLocale)
  if (localesToCheck.length === 0) {
    return []
  }

  const translations = await db
    .select({
      postId: postTranslations.postId,
      locale: postTranslations.locale,
      content: postTranslations.content
    })
    .from(postTranslations)
    .where(inArray(postTranslations.locale, localesToCheck))

  const translationMap = new Map<string, Set<string>>()
  for (const translation of translations) {
    if (!translation.content || translation.content.trim().length === 0) {
      continue
    }
    if (!translationMap.has(translation.postId)) {
      translationMap.set(translation.postId, new Set())
    }
    translationMap.get(translation.postId)!.add(translation.locale)
  }

  const tasks: MissingTask[] = []
  for (const post of basePosts) {
    for (const locale of localesToCheck) {
      const completed = translationMap.get(post.id)
      if (!completed || !completed.has(locale)) {
        tasks.push({ postId: post.id, slug: post.slug, locale })
      }
    }
  }

  return tasks
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const calculateBackoffDelay = (attempt: number) => {
  const delay = Math.min(INITIAL_BACKOFF_DELAY_MS * 2 ** attempt, MAX_BACKOFF_DELAY_MS)
  const jitter = delay * BACKOFF_JITTER_RATIO * Math.random()
  return Math.round(delay + jitter)
}

const triggerTranslationRequest = async (task: MissingTask, baseUrl: string) => {
  const url = new URL(`/api/blog/${encodeURIComponent(task.slug)}?script=true`, baseUrl)
  url.searchParams.set('locale', task.locale)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = Date.now()

  try {
    const response = await fetch(url, { signal: controller.signal })
    const elapsed = Date.now() - startedAt

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`${response.status} ${response.statusText} ${body}`.trim())
    }

    console.log(`✔️  ${task.locale.toUpperCase()} ${task.slug} (${elapsed}ms)`)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)
    }

    throw error instanceof Error ? error : new Error(String(error))
  } finally {
    clearTimeout(timeout)
  }
}

const runWithBackoff = async (task: MissingTask, baseUrl: string): Promise<void> => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await triggerTranslationRequest(task, baseUrl)
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt === MAX_RETRIES) {
        throw error instanceof Error ? error : new Error(message)
      }

      const delay = calculateBackoffDelay(attempt)
      const retryCount = `${attempt + 1}/${MAX_RETRIES}`
      console.warn(`⏳  ${task.locale.toUpperCase()} ${task.slug} retry ${retryCount}: ${message}. Waiting ${delay}ms.`)
      await wait(delay)
    }
  }
}

const run = async (requestedMode: ExecutionMode) => {
  const client = getDbClient(requestedMode)
  const { db, close, mode } = client
  const baseUrl = ensureTrailingSlash(mode === 'local' ? 'http://localhost:3000' : 'https://demo.getwhynot.org')

  if (requestedMode !== 'auto' && requestedMode !== mode) {
    console.warn(`Requested mode "${requestedMode}" could not be used. Falling back to "${mode}".`)
  }

  console.log(`Base URL: ${baseUrl}`)
  console.log(`Locales: ${[BASE_LOCALE, ...TRANSLATION_LOCALES].join(' -> ')}`)

  try {
    const tasks = await findMissingTranslations(db as any, BASE_LOCALE, TRANSLATION_LOCALES)

    if (tasks.length === 0) {
      console.log('All translations are up to date.')
      return
    }

    console.log(`Found ${tasks.length} missing translations.`)

    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      const position = `${index + 1}/${tasks.length}`

      try {
        console.log(`[${position}] Requesting ${task.locale} -> ${task.slug}`)
        await runWithBackoff(task, baseUrl)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`✖️  ${task.locale.toUpperCase()} ${task.slug} failed: ${message}`)
      }

      if (index < tasks.length - 1 && REQUEST_DELAY_MS > 0) {
        await wait(REQUEST_DELAY_MS)
      }
    }
  } finally {
    close()
  }
}

const executionMode = parseExecutionMode(process.argv.slice(2))

console.log(`Requested execution mode: ${executionMode}`)

run(executionMode).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
