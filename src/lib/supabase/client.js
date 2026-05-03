'use client'
import { createBrowserClient } from '@supabase/ssr'

// Cookie-based browser client — session is automatically synced with middleware.
// Supabase RLS policies apply using the signed-in user's identity.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
