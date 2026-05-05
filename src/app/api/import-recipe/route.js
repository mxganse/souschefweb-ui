import OpenAI from 'openai'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are an expert culinary editor and recipe categorizer. Extract and structure the recipe in clean markdown, then categorize it.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "markdown": "# [Dish Title]\\n\\n## Overview\\n- **Yield:** [amount]\\n- **Prep Time:** [time]\\n- **Cook Time:** [time]\\n- **Cuisine:** [type]\\n\\n## Ingredients\\n- [quantity] [unit] [ingredient, with prep note]\\n\\n## Method\\n[Numbered steps. Include temperatures in °F and °C, timing, visual/textural cues.]\\n\\n## Chef's Notes\\n[Substitutions, make-ahead tips, storage, food science where relevant.]",
  "meal_types": ["dinner"],
  "dietary_flags": ["omnivore"],
  "cooking_styles": ["roasting"],
  "confidence": 0.95
}

MARKDOWN RULES:
- Use EXACTLY these sections when present: # [Dish Title], ## Overview, ## Ingredients, ## Method, ## Chef's Notes
- If percentages appear (baker's percentages, brine concentrations, hydrocolloid ratios), include them in the Ingredients list.
- Preserve all quantities exactly as written — never round or approximate.
- If the source has multiple recipes, extract only the primary/main recipe.

CATEGORIZATION RULES:
- meal_types: ARRAY, can be multiple (e.g. ["breakfast","dessert"]). Choose from: breakfast, lunch, dinner, dessert, snack, appetizer, beverage, sauce/condiment
- dietary_flags: ARRAY, include ALL applicable. Always include base flag (omnivore unless restricted). Choose from: omnivore, vegetarian, vegan, pescatarian, gluten-free, dairy-free, nut-free, kosher, halal, keto, paleo, whole30
- cooking_styles: ARRAY, identify ALL methods used. Choose from: baking, grilling, braising, sous-vide, roasting, sautéing, raw/no-cook, frying, boiling, steaming, slow-cooking, smoking, curing, fermenting
- confidence: 0.0-1.0, lower if ambiguous`

async function extractRecipe(messages, openai) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })
  const raw = resp.choices[0].message.content.trim()
  try {
    return JSON.parse(raw)
  } catch {
    // Fallback: treat as plain markdown if JSON parse fails
    return { markdown: raw, meal_types: [], dietary_flags: [], cooking_styles: [], confidence: 0 }
  }
}

function extractJsonLdRecipe(html) {
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const match of html.matchAll(pattern)) {
    try {
      const raw = JSON.parse(match[1])
      const nodes = Array.isArray(raw) ? raw : raw['@graph'] ? raw['@graph'] : [raw]
      const recipe = nodes.find(n => {
        const t = n['@type']
        return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))
      })
      if (recipe) return recipe
    } catch {}
  }
  return null
}

// ── Handler — extract only, no DB write ───────────────────────────────────────
export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const contentType = request.headers.get('content-type') || ''

  let type, result, sourceUrl

  try {
    if (contentType.includes('application/json')) {
      const body = await request.json()
      type = body.type

      if (type === 'url') {
        const url = body.url
        if (!url) return Response.json({ error: 'URL is required' }, { status: 400 })

        const fetchHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
        if (/cooking\.nytimes\.com/i.test(url) && process.env.NYT_COOKING_COOKIE) {
          fetchHeaders['Cookie'] = process.env.NYT_COOKING_COOKIE
        }

        const pageResp = await fetch(url, {
          headers: fetchHeaders,
          signal: AbortSignal.timeout(20_000),
        })
        if (!pageResp.ok) throw new Error(`Could not fetch page: ${pageResp.status} ${pageResp.statusText}`)

        const html = await pageResp.text()
        const jsonLdRecipe = extractJsonLdRecipe(html)
        const userContent = jsonLdRecipe
          ? `Extract the recipe from this structured JSON-LD data:\n\n${JSON.stringify(jsonLdRecipe, null, 2).slice(0, 24000)}`
          : `Extract the recipe from this web page content:\n\n${html
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s{2,}/g, ' ')
              .trim()
              .slice(0, 24000)}`

        result = await extractRecipe([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ], openai)
        sourceUrl = url

      } else if (type === 'text') {
        const text = body.text
        if (!text) return Response.json({ error: 'Text is required' }, { status: 400 })
        result = await extractRecipe([
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract the recipe from this text:\n\n${text}` },
        ], openai)

      } else {
        return Response.json({ error: 'Unknown type' }, { status: 400 })
      }

    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      type = form.get('type')
      const file = form.get('file')
      if (!file) return Response.json({ error: 'File is required' }, { status: 400 })

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mime = file.type || 'application/octet-stream'

      if (type === 'image') {
        if (!mime.startsWith('image/')) return Response.json({ error: 'File must be an image' }, { status: 400 })
        result = await extractRecipe([
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' } },
              { type: 'text', text: 'Extract the recipe from this image.' },
            ],
          },
        ], openai)

      } else if (type === 'pdf') {
        const fileBlob = new File([bytes], file.name || 'recipe.pdf', { type: 'application/pdf' })
        const uploadResp = await openai.files.create({ file: fileBlob, purpose: 'assistants' })
        const fileId = uploadResp.id

        const resp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract the recipe from this PDF document.' },
                { type: 'file', file: { file_id: fileId } },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        })
        await openai.files.del(fileId).catch(() => {})
        try {
          result = JSON.parse(resp.choices[0].message.content.trim())
        } catch {
          result = { markdown: resp.choices[0].message.content.trim(), meal_types: [], dietary_flags: [], cooking_styles: [], confidence: 0 }
        }

      } else {
        return Response.json({ error: 'Unknown file type' }, { status: 400 })
      }

    } else {
      return Response.json({ error: 'Unsupported content type' }, { status: 415 })
    }

    const sourceTypeMap = { url: 'Web Import', text: 'Text Import', pdf: 'PDF Import', image: 'Image Import' }
    return Response.json({
      markdown: result.markdown || '',
      sourceType: sourceTypeMap[type] || 'Import',
      sourceUrl: sourceUrl || null,
      meal_types: result.meal_types || [],
      dietary_flags: result.dietary_flags || [],
      cooking_styles: result.cooking_styles || [],
      confidence: result.confidence ?? null,
    })

  } catch (err) {
    console.error('import-recipe error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
