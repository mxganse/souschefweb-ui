import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

async function getAuthedUser(supabase, recipeId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, canEdit: false }

  const isAdmin = isAdminUser(user)
  if (isAdmin) return { user, canEdit: true }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('user_id')
    .eq('id', recipeId)
    .single()

  const canEdit = recipe?.user_id === user.id
  return { user, canEdit }
}

export async function POST(request) {
  const supabase = await createSessionClient()
  const body = await request.json()
  const { id, title, category, instructions_markdown, recipe_type } = body

  if (!id) return Response.json({ error: 'Missing recipe id' }, { status: 400 })

  const { user, canEdit } = await getAuthedUser(supabase, id)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Snapshot current state into recipe_versions
  const { data: latest } = await supabase
    .from('recipe_versions')
    .select('version_number')
    .eq('recipe_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version_number ?? 0) + 1
  await supabase.from('recipe_versions').insert({
    recipe_id: id,
    user_id: user.id,
    version_number: nextVersion,
    title,
    category,
    instructions_markdown,
  })

  const { error } = await supabase
    .from('recipes')
    .update({ title, category: category || null, instructions_markdown, recipe_type })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(request) {
  const supabase = await createSessionClient()
  const { id } = await request.json()

  if (!id) return Response.json({ error: 'Missing recipe id' }, { status: 400 })

  const { user, canEdit } = await getAuthedUser(supabase, id)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEdit) return Response.json({ error: 'Forbidden' }, { status: 403 })

  await supabase.from('ingredients').delete().eq('recipe_id', id)
  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
