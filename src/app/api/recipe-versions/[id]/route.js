import { createSessionClient } from '@/lib/supabase/server'

export async function GET(request, { params }) {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('recipe_versions')
    .select('id, version_number, title, category, instructions_markdown, created_at')
    .eq('recipe_id', id)
    .order('version_number', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ versions: data ?? [] })
}
