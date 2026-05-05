'use client'
import { createBrowserClient } from '@supabase/ssr'

// Cookie-based browser client — session is automatically synced with middleware.
// Supabase RLS policies apply using the signed-in user's identity.
const clean = s => (s || '').replace(/^﻿/, '').trim()

export const supabase = createBrowserClient(
  clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || clean(process.env.SUPABASE_SERVICE_KEY)
)
