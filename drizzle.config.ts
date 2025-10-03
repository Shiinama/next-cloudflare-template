// drizzle.config.ts
import type { Config } from 'drizzle-kit'

const { LOCAL_DB_PATH, DATABASE_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env

// Use better-sqlite driver for local development
export default LOCAL_DB_PATH
  ? ({
      schema: './lib/db/schema.ts',
      out: './migrations',
      dialect: 'sqlite',
      dbCredentials: {
        url: LOCAL_DB_PATH
      }
    } satisfies Config)
  : ({
      schema: './lib/db/schema.ts',
      out: './migrations',
      dialect: 'sqlite',
      driver: 'd1-http',
      dbCredentials: {
        databaseId: DATABASE_ID!,
        token: CLOUDFLARE_API_TOKEN!,
        accountId: CLOUDFLARE_ACCOUNT_ID!
      }
    } satisfies Config)
