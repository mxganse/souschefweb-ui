import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { id, category, title, content_markdown, sort_order, tags = [] } = body

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

  // Sync tags
  if (id) await supabase.from('reference_tag_links').delete().eq('reference_id', id)
  if (tags.length > 0) {
    // 1. Ensure tags exist, 2. Link them
    const { data: existingTags } = await supabase.from('reference_tags').select('id, name').in('name', tags)
    const existingTagNames = existingTags.map(t => t.name)
    const newTags = tags.filter(t => !existingTagNames.includes(t))
    
    let tagIds = existingTags.map(t => t.id)
    if (newTags.length > 0) {
      const { data: inserted } = await supabase.from('reference_tags').insert(newTags.map(name => ({ name }))).select('id')
      tagIds = [...tagIds, ...inserted.map(t => t.id)]
    }
    await supabase.from('reference_tag_links').insert(tagIds.map(tag_id => ({ reference_id: data.id, tag_id })))
  }

  return Response.json({ standard: { ...data, tags } })
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
