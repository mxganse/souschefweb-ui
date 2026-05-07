import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-server'
import { buildPdf, safeName } from '@/lib/buildPdf'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new Response('Missing id', { status: 400 })

  const supabase = createAdminClient()
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('title, category, source_url, instructions_markdown, created_at')
    .eq('id', id)
    .single()

  if (error || !recipe) return new Response('Recipe not found', { status: 404 })

  const pdfBuffer = await buildPdf(recipe)
  supabase.from('feature_events').insert({ event_name: 'pdf_download', metadata: { recipe_id: id } }).then(() => {}).catch(() => {})
  const filename = `${safeName(recipe.title)}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const denied = await requirePermission(user, 'can_export_pdf', 'You do not have permission to export PDFs.')
  if (denied) return denied

  const body = await request.json()
  const { title, category, source_url, created_at, instructions_markdown } = body

  if (!instructions_markdown) return new Response('Missing markdown', { status: 400 })

  const recipe = { title, category, source_url, created_at, instructions_markdown }
  const pdfBuffer = await buildPdf(recipe)
  const filename = `${safeName(title)}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
