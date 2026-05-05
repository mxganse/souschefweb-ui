import { createSessionClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSessionClient()

  const { data: standards, error } = await supabase
    .from('culinary_standards')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ standards: standards ?? [] })
}
