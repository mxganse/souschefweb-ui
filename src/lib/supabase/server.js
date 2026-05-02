import { createClient } from '@supabase/supabase-js'

// Strip BOM and whitespace that can sneak in via env var pipelines
const clean = s => (s || '').replace(/^﻿/, '').trim()

export function createServerClient() {
  return createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_SERVICE_KEY)
  )
}

