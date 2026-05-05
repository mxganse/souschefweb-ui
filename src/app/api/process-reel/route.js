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

    const { title, recipe: markdown, creator, source_brand } = await resp.json()

    // Map source_brand to sourceType for backwards compatibility
    const sourceTypeMap = {
      'Instagram': 'Instagram Extract',
      'Serious Eats': 'Web Import',
      'AllRecipes': 'Web Import',
      'NYT Cooking': 'Web Import',
      'Bon Appétit': 'Web Import',
      'Epicurious': 'Web Import',
    }
    const sourceType = sourceTypeMap[source_brand] || 'Web Import'

    // Return extracted content — no DB write yet (user reviews first)
    return Response.json({
      markdown,
      title,
      sourceType,
      sourceUrl: cleanUrl,
      creator: creator && creator !== 'Unknown' ? creator : null,
      source_brand,
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
