import { createServerClient as createSSRClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const clean = s => (s || '').replace(/^﻿/, '').trim()

// Service-role client — bypasses RLS. Use only in trusted server code (admin page, cron jobs, etc.)
export function createAdminClient() {
  return createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_SERVICE_KEY)
  )
}

// Session-aware server client — respects RLS, reads user identity from request cookies.
// Use in API routes, server components, and server actions that operate on behalf of a user.
export async function createSessionClient() {
  const cookieStore = await cookies()
  return createSSRClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only there.
            // The middleware handles cookie refresh; this is a no-op.
          }
        },
      },
    }
  )
}
