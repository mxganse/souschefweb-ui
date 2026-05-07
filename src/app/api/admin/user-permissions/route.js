import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

const ALLOWED_FIELDS = [
  'can_add_recipes',
  'can_view_library',
  'library_view_scope',
  'can_access_reference',
  'can_export_pdf',
  'can_import_recipes',
  'can_email_recipe',
]

export async function GET() {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createAdminClient()
  const [usersRes, permsRes] = await Promise.all([
    supabase.auth.admin.listUsers(),
    supabase.from('user_permissions').select('*'),
  ])

  if (usersRes.error) return Response.json({ error: usersRes.error.message }, { status: 500 })

  const permsMap = {}
  for (const p of permsRes.data ?? []) permsMap[p.user_id] = p

  const users = usersRes.data.users.map(u => ({
    id:              u.id,
    email:           u.email,
    full_name:       u.user_metadata?.full_name ?? null,
    created_at:      u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    confirmed_at:    u.confirmed_at ?? null,
    permissions:     permsMap[u.id] ?? null,
  }))

  return Response.json({ users })
}

export async function PATCH(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, field, value } = await request.json()
  if (!userId || !field) return Response.json({ error: 'userId and field are required' }, { status: 400 })
  if (!ALLOWED_FIELDS.includes(field)) return Response.json({ error: 'Invalid field' }, { status: 400 })
  if (field === 'library_view_scope') {
    if (typeof value !== 'string') return Response.json({ error: 'library_view_scope must be a string' }, { status: 400 })
  } else if (typeof value !== 'boolean') {
    return Response.json({ error: `${field} must be a boolean` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_permissions')
    .upsert(
      { user_id: userId, [field]: value, updated_at: new Date().toISOString(), updated_by: user.id },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ permissions: data })
}
