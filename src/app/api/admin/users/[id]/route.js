import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

export async function DELETE(request, { params }) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (user.id === id) {
    return Response.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
