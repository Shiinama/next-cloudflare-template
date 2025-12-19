import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { platform } from 'os'
import { join } from 'path'

function findSqliteFile(): string | null {
  const basePath = join('.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')

  if (!existsSync(basePath)) {
    console.error(`Base path does not exist: ${basePath}`)
    return null
  }

  try {
    function findFile(dir: string): string | null {
      const files = readdirSync(dir, { withFileTypes: true })

      for (const file of files) {
        const path = join(dir, file.name)
        if (file.isDirectory()) {
          const found = findFile(path)
          if (found) return found
        } else if (file.name.endsWith('.sqlite')) {
          return path
        }
      }

      return null
    }

    return findFile(basePath)
  } catch (error) {
    console.error('Error finding SQLite file:', error)
    return null
  }
}

function main() {
  const sqliteFilePath = findSqliteFile()

  if (!sqliteFilePath) {
    console.error('Could not find SQLite database file. Make sure you have run the local database first.')
    process.exit(1)
  }

  console.log(`Found SQLite database at: ${sqliteFilePath}`)

  // Set environment variable and run drizzle-kit studio
  const command =
    platform() === 'win32'
      ? `set "LOCAL_DB_PATH=${sqliteFilePath}" && drizzle-kit studio`
      : `LOCAL_DB_PATH="${sqliteFilePath}" drizzle-kit studio`

  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error('Failed to run drizzle-kit studio:', error)
    process.exit(1)
  }
}

main()
