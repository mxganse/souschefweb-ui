import OpenAI from 'openai'

export const maxDuration = 300

const NORMALIZE_PROMPT = `You are an expert culinary editor and recipe categorizer. Reformat the provided recipe into clean markdown and categorize it.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "markdown": "# [Dish Title]\\n\\n## Overview\\n- **Yield:** [amount]\\n- **Prep Time:** [time]\\n- **Cook Time:** [time]\\n- **Cuisine:** [type]\\n\\n## Ingredients\\n- [quantity] [unit] [ingredient, with prep note]\\n\\n## Method\\n[Numbered steps. Include temperatures in °F and °C, timing, visual/textural cues.]\\n\\n## Chef's Notes\\n[Substitutions, make-ahead tips, storage, food science where relevant.]",
  "cuisine": "Italian",
  "meal_types": ["dinner"],
  "dietary_flags": ["omnivore"],
  "cooking_styles": ["roasting"],
  "confidence": 0.95
}

MARKDOWN RULES:
- Use EXACTLY these section headings: # [Dish Title], ## Overview, ## Ingredients, ## Method, ## Chef's Notes
- Preserve all quantities exactly as written — never round or approximate.
- Keep all recipe content; only reformat the structure.

CATEGORIZATION RULES:
- cuisine: STRING, cuisine origin (e.g. "Italian", "Mexican", "Thai", "French", "Japanese", "Indian", "Mediterranean", etc.)
- meal_types: ARRAY, can be multiple (e.g. ["breakfast","dessert"]). Choose from: breakfast, lunch, dinner, dessert, snack, appetizer, beverage, sauce/condiment
- dietary_flags: ARRAY, include ALL applicable. Always include base flag (omnivore unless restricted). Choose from: omnivore, vegetarian, vegan, pescatarian, gluten-free, dairy-free, nut-free, kosher, halal, keto, paleo, whole30
- cooking_styles: ARRAY, identify ALL methods used. Choose from: baking, grilling, braising, sous-vide, roasting, sautéing, raw/no-cook, frying, boiling, steaming, slow-cooking, smoking, curing, fermenting
- confidence: 0.0-1.0, lower if ambiguous`

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

    const { title, recipe: rawMarkdown, creator, source_brand } = await resp.json()

    // Normalize markdown to ## heading format and extract categorization tags
    let markdown = rawMarkdown
    let cuisine = null
    let meal_types = []
    let dietary_flags = []
    let cooking_styles = []
    let confidence = null

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const normResp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: NORMALIZE_PROMPT },
          { role: 'user', content: `Reformat and categorize this recipe:\n\n${rawMarkdown}` },
        ],
        temperature: 0.2,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(normResp.choices[0].message.content.trim())
      if (parsed.markdown) markdown = parsed.markdown
      cuisine = parsed.cuisine || null
      meal_types = parsed.meal_types || []
      dietary_flags = parsed.dietary_flags || []
      cooking_styles = parsed.cooking_styles || []
      confidence = parsed.confidence ?? null
    } catch (normErr) {
      console.error('process-reel normalize error:', normErr)
      // Keep raw markdown and empty categories — better than failing the whole import
    }

    const sourceTypeMap = {
      'Instagram': 'Instagram Extract',
      'Serious Eats': 'Web Import',
      'AllRecipes': 'Web Import',
      'NYT Cooking': 'Web Import',
      'Bon Appétit': 'Web Import',
      'Epicurious': 'Web Import',
    }
    const sourceType = sourceTypeMap[source_brand] || 'Web Import'

    return Response.json({
      markdown,
      title,
      sourceType,
      sourceUrl: cleanUrl,
      creator: creator && creator !== 'Unknown' && creator !== 'Instagram' ? creator : null,
      source_brand,
      cuisine,
      meal_types,
      dietary_flags,
      cooking_styles,
      confidence,
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
