import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Supabase calls this URL after the user authorizes via Google.
// We exchange the one-time code for a session and redirect home.
// Cookies must be set directly on the NextResponse — next/headers cookies()
// does not merge into an explicit NextResponse.redirect() in Route Handlers.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // On Vercel with a custom domain, x-forwarded-host is the canonical host.
    const forwardedHost = request.headers.get('x-forwarded-host')
    const redirectBase = forwardedHost ? `https://${forwardedHost}` : origin
    const response = NextResponse.redirect(`${redirectBase}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
