import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/server'

export const maxDuration = 120

// Card-format system prompt — output must match ReferenceViewer's markdown parser
// which renders: ## → skipped (title in card header), ### → orange h3, | tables | → TableCards, - lists → bordered list
const SYSTEM_PROMPT = `You are an expert culinary reference editor. Extract and structure the document into a clean professional culinary reference CARD.

IMPORTANT: THIS IS A CULINARY REFERENCE DOCUMENT. DO NOT EXTRACT RECIPES.
Focus ONLY on:
1. Technical ratios, percentages, and usage concentrations.
2. Scientific principles (how temperature, pH, or ion content affects a technique).
3. Troubleshooting and pro-tips.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "title": "[Concise Technical Title, e.g. Agar-Agar Gels]",
  "category": "[Must choose one: Proteins, Vegetables, Starches, Sugars, Fats, Thickening, Recipe Scaling, Portioning, Delta-T Cooking, Sous-Vide, Combi-Oven, Precision Cooking, Foams, Gels, Spherification, Emulsions, Hydrocolloids, BOH Basics]",
  "markdown": "...",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95
}

MARKDOWN FORMAT RULES — the markdown field must use EXACTLY this structure:
- Use ### for section headings (e.g. ### Overview, ### Key Ratios, ### Science, ### Technique & Tips)
- Use markdown tables for ratio/temperature/timing data: | Parameter | Value | Notes |
- Use - bullet lists for tips, troubleshooting, and steps
- Use **bold** for key terms
- Do NOT use ## headings (they are skipped by the renderer)
- Do NOT use # headings

EXAMPLE OUTPUT MARKDOWN:
### Overview
**Agar-agar** is a plant-based hydrocolloid derived from red algae. Sets firm at room temperature; melts at ~85°C.

### Key Ratios
| Application | Concentration | Notes |
|-------------|---------------|-------|
| Fluid gel | 0.2% – 0.5% | Blended hot, yields silky pourable gel |
| Firm set | 0.5% – 1.0% | Classic terrine or jelly |
| Brittle | >1.5% | Crisp sheets, glass noodles |

### Science
- Sets at **32–45°C**, melts at **85°C** — stable at service temp unlike gelatin
- pH sensitive: acid (below 4.5) weakens gel; compensate with higher concentration
- Synergistic with locust bean gum — improves elasticity

### Technique & Tips
- Disperse in cold liquid first, then bring to full boil (100°C) while stirring
- Pour into molds immediately — sets quickly
- Re-melting and re-setting is possible without quality loss

CATEGORIZATION: Map content to one of the provided categories. Do NOT create new categories.
If the document is purely a recipe (dish with quantities), reject it with confidence: 0.1.`

async function extractReference(messages, openai) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })
  const raw = resp.choices[0].message.content.trim()
  try {
    return JSON.parse(raw.replace(/^```json\n/, '').replace(/\n```$/, ''))
  } catch {
    return { markdown: raw, category: 'Other', tags: [], confidence: 0 }
  }
}

async function findExistingMatches(supabase, title, category) {
  const words = title.split(/\s+/).filter(w => w.length > 3)
  const searchTerm = words.slice(0, 3).join(' ')

  const queries = [
    supabase.from('culinary_standards').select('id, title, category').eq('category', category).limit(5),
  ]
  if (searchTerm) {
    queries.push(
      supabase.from('culinary_standards').select('id, title, category').ilike('title', `%${searchTerm}%`).limit(5)
    )
  }

  const results = await Promise.all(queries)
  const [catRes, titleRes] = [results[0], results[1] ?? { data: [] }]

  const seen = new Set()
  const matches = []
  for (const row of [...(titleRes.data ?? []), ...(catRes.data ?? [])]) {
    if (!seen.has(row.id)) { seen.add(row.id); matches.push(row) }
  }
  return matches
}

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const body = await request.json()

  try {
    const supabase = createAdminClient()
    let result

    if (body.isStorageFile) {
      const { data, error } = await supabase.storage.from('temp-imports').download(body.fileName)
      if (error) throw error

      const arrayBuffer = await data.arrayBuffer()
      const fileBlob = new File([arrayBuffer], body.fileName, { type: 'application/pdf' })
      const uploadResp = await openai.files.create({ file: fileBlob, purpose: 'assistants' })
      const fileId = uploadResp.id

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: [{ type: 'text', text: 'Extract and structure this document into a reference card.' }, { type: 'file', file: { file_id: fileId } }] },
        ],
        response_format: { type: 'json_object' },
      })
      await openai.files.del(fileId).catch(() => {})
      result = JSON.parse(resp.choices[0].message.content.trim())
      await supabase.storage.from('temp-imports').remove([body.fileName])

    } else if (body.url) {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extract and structure this URL into a reference card: ${body.url}` },
      ]
      result = await extractReference(messages, openai)
    } else {
      return Response.json({ error: 'url or file required' }, { status: 400 })
    }

    const existingMatches = result.confidence > 0.3
      ? await findExistingMatches(supabase, result.title || '', result.category || '')
      : []

    return Response.json({
      title:            result.title || 'Untitled Reference',
      markdown:         result.markdown || '',
      category:         result.category || 'Other',
      tags:             result.tags || [],
      confidence:       result.confidence ?? null,
      existing_matches: existingMatches,
    })

  } catch (err) {
    console.error('import-reference error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
