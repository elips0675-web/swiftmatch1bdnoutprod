import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let client: SupabaseClient<Database> | null = null
let initAttempted = false

export function getSupabase(): SupabaseClient<Database> | null {
  if (client) return client
  if (initAttempted) return null

  initAttempted = true

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (import.meta.env.DEV) console.warn(
      '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. ' +
      'Falling back to demo mode. Set these env vars for production.',
    )
    return null
  }

  try {
    client = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
    return client
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Supabase] Failed to init:', err)
    return null
  }
}

// getSupabaseAdmin удалён — service role key НЕ ДОЛЖЕН быть на клиенте.
// Для админских операций используйте серверный API с проверкой роли.
