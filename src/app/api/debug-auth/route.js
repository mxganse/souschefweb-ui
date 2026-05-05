import { createSessionClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)

  const supabase = await createSessionClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: { user } } = await supabase.auth.getUser()

  return Response.json({
    cookieNames: allCookies,
    sessionUser: session?.user?.email ?? null,
    getUser: user?.email ?? null,
    isAdmin: user?.email === 'mxganse@gmail.com',
  })
}
