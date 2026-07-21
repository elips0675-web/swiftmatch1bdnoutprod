interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  apiUrl: string
  wsUrl: string
  appName: string
  appVersion: string
  isProduction: boolean
  isDevelopment: boolean
  sentryDsn: string | null
  imageBaseUrl: string
  paginationLimit: number
  chatPollInterval: number
  sessionTimeout: number
}

function getEnvVar(key: string, fallback: string): string {
  return (import.meta.env[key] as string) ?? fallback
}

const config: EnvConfig = {
  supabaseUrl: getEnvVar('VITE_SUPABASE_URL', ''),
  supabaseAnonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', ''),
  apiUrl: getEnvVar('VITE_API_URL', '/api'),
  wsUrl: getEnvVar('VITE_WS_URL', 'ws://localhost:8080'),
  appName: getEnvVar('VITE_APP_NAME', 'SwiftMatch'),
  appVersion: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  sentryDsn: getEnvVar('VITE_SENTRY_DSN', ''),
  imageBaseUrl: getEnvVar('VITE_IMAGE_BASE_URL', '/demo/people'),
  paginationLimit: Number(getEnvVar('VITE_PAGINATION_LIMIT', '20')),
  chatPollInterval: Number(getEnvVar('VITE_CHAT_POLL_INTERVAL', '3000')),
  sessionTimeout: Number(getEnvVar('VITE_SESSION_TIMEOUT', '3600000')),
}

export function getConfig(): EnvConfig {
  if (config.isProduction) {
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const
    for (const key of required) {
      if (!import.meta.env[key]) {
        if (import.meta.env.DEV) console.error(`Missing required env var: ${key}`)
      }
    }
  }
  return config
}

export { config }
