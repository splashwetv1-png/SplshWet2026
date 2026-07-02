import dotenv from 'dotenv'

dotenv.config()

const requiredKeys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'] as const

requiredKeys.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing required variable: ${key}`)
  }
})

export const env = {
  port: Number(process.env.PORT || 10000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminUsername: process.env.ADMIN_USERNAME || 'Splashwet2026',
  adminPassword: process.env.ADMIN_PASSWORD || 'Thelastpsi6@',
  eromeApiKey:
    process.env.EROME_DOWNLOADER_API_KEY ||
    '15243882ca616c18185fb99c19e3f8ae22f40ee26b616bea2991cf9046081200',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60_000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 8),
  apiRateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
  apiRateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 240),
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 30_000),
  mediaProxyTimeoutMs: Number(process.env.MEDIA_PROXY_TIMEOUT_MS || 15_000),
} as const
