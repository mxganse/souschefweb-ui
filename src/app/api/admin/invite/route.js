import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'mxganse@gmail.com'

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email?.trim()) return Response.json({ error: 'Email required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: 'https://souschef.fig8culinary.com/auth/callback',
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
