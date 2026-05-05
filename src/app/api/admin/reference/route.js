import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, category, title, content_markdown, sort_order } = body

  if (!category || !title) {
    return Response.json({ error: 'category and title are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const record = { category, title, content_markdown: content_markdown ?? '', sort_order: sort_order ?? 0 }
  if (id) record.id = id

  const { data, error } = await supabase
    .from('culinary_standards')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ standard: data })
}

export async function DELETE(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('culinary_standards').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
