import { createServerClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function POST(request) {
  const { url, manualIngredients = '' } = await request.json()

  if (!url) {
    return Response.json({ error: 'URL is required' }, { status: 400 })
  }

  const workerUrl = process.env.WORKER_URL
  if (!workerUrl) {
    return Response.json({ error: 'Video processing service is not configured. Set WORKER_URL.' }, { status: 503 })
  }

  const cleanUrl = url.split('?')[0]

  let workerResult
  try {
    const resp = await fetch(`${workerUrl}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.WORKER_SECRET ? { 'x-worker-secret': process.env.WORKER_SECRET } : {}),
      },
      body: JSON.stringify({ url: cleanUrl, manualIngredients }),
      signal: AbortSignal.timeout(280_000),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }))
      return Response.json({ error: err.error || 'Worker error' }, { status: 500 })
    }

    workerResult = await resp.json()
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }

  const { title, ingredients, recipe: recipeMarkdown } = workerResult
  const creator = workerResult.creator && workerResult.creator !== 'Unknown' ? workerResult.creator : null

  const supabase = createServerClient()

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title,
      category: creator,
      source_type: 'Instagram Extraction',
      source_url: cleanUrl,
      instructions_markdown: recipeMarkdown,
    })
    .select('id')
    .single()

  if (recipeError) return Response.json({ error: recipeError.message }, { status: 500 })

  if (ingredients?.length > 0) {
    await supabase.from('ingredients').insert(
      ingredients.map(raw_text => ({ recipe_id: recipe.id, raw_text }))
    )
  }

  return Response.json({ id: recipe.id, title, recipe: recipeMarkdown, creator })
}
