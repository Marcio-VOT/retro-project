// Environment configuration with defaults
export const env = {
  // API Configuration
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api',
  
  // Socket.IO Configuration
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:8080',
  
  // App Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Retro',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Environment
  ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' || process.env.NODE_ENV === 'development',
} as const

// Type-safe environment access
export type Env = typeof env

// Helper function to get environment variable with fallback
export function getEnvVar(key: keyof Env, fallback?: string): string {
  return env[key] as string || fallback || ''
}

// Development helpers
export const isDevelopment = env.ENVIRONMENT === 'development'
export const isProduction = env.ENVIRONMENT === 'production'
export const isTest = env.ENVIRONMENT === 'test' 