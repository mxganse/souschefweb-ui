import OpenAI from 'openai'
import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

export const maxDuration = 60

const MERGE_PROMPT = `You are an expert culinary reference editor. You will be given two versions of a culinary reference card — an existing entry and new information to supplement it.

Your task: produce a single merged reference card that:
- Keeps ALL unique data from the existing entry
- Adds ALL unique new data that isn't already covered
- Eliminates exact redundancies (keep the most detailed version of duplicate info)
- Maintains the same card format: ### headings, | markdown tables |, - bullet lists

Do NOT summarize or compress existing data — expand and enrich it.

Return ONLY the merged markdown content (no JSON wrapper, just the markdown).`

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!isAdminUser(user)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { existing_id, new_markdown } = await request.json()
  if (!existing_id || !new_markdown) {
    return Response.json({ error: 'existing_id and new_markdown are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: existing, error } = await supabase
    .from('culinary_standards')
    .select('id, title, category, content_markdown')
    .eq('id', existing_id)
    .single()

  if (error || !existing) return Response.json({ error: 'Existing entry not found' }, { status: 404 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: MERGE_PROMPT },
      {
        role: 'user',
        content: `EXISTING ENTRY (${existing.title}):\n\n${existing.content_markdown}\n\n---\n\nNEW INFORMATION TO SUPPLEMENT WITH:\n\n${new_markdown}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  })

  const merged_markdown = resp.choices[0].message.content.trim()

  return Response.json({
    merged_markdown,
    existing_id: existing.id,
    existing_title: existing.title,
    existing_category: existing.category,
  })
}
