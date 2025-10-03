namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BASE_URL: string
    NEXT_PUBLIC_ADMIN_ID: string
    NEXT_PUBLIC_R2_DOMAIN: string
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: string
    TURNSTILE_SECRET_KEY?: string
    TURNSTILE_SECRET?: string
  }
}
