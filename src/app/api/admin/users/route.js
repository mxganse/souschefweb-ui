import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

export async function GET() {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const users = data.users.map(u => ({
    id:             u.id,
    email:          u.email,
    full_name:      u.user_metadata?.full_name ?? null,
    created_at:     u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    confirmed_at:   u.confirmed_at ?? null,
    invited_at:     u.invited_at ?? null,
  }))

  return Response.json({ users })
}
