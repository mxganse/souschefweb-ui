import { createSessionClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Supabase calls this URL after the user authorizes via Google.
// We exchange the one-time code for a session and redirect home.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createSessionClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
