import OpenAI from 'openai'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are an expert culinary reference editor. Extract and structure the document into clean, professional culinary markdown. Augment with relevant culinary science, tips, or related data.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "title": "[Concise Title]",
  "markdown": "# [Title]\\n\\n## Overview\\n[Summary]\\n\\n## Principles\\n[Core principles]\\n\\n## Techniques\\n[Relevant techniques]\\n\\n## Science & Tips\\n[Related food science or pro-tips]\\n\\n## References\\n[Sources or further reading]",
  "category": "[One of: Food Science, Techniques, Ingredient Profile, SOPs, Equipment]",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95
}

RULES:
- Use EXACTLY these sections when present: # [Title], ## Overview, ## Principles, ## Techniques, ## Science & Tips, ## References
- Preserve technical accuracy in recipes, percentages, or ratios.
- If the document covers multiple topics, focus on the primary one.
- CATEGORIZATION: Choose the most appropriate category from the provided list.
- TAGS: Identify ALL relevant topics/ingredients/techniques (e.g., ["sous-vide", "meat", "chemistry"]).`

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
    return JSON.parse(raw)
  } catch {
    return { markdown: raw, category: 'Other', tags: [], confidence: 0 }
  }
}

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const contentType = request.headers.get('content-type') || ''

  let result

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      if (!file) return Response.json({ error: 'File is required' }, { status: 400 })

      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mime = file.type || 'application/octet-stream'

      if (mime.startsWith('image/')) {
        result = await extractReference([
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' } },
              { type: 'text', text: 'Extract and structure this document.' },
            ],
          },
        ], openai)
      } else if (mime === 'application/pdf') {
        const fileBlob = new File([bytes], file.name || 'document.pdf', { type: 'application/pdf' })
        const uploadResp = await openai.files.create({ file: fileBlob, purpose: 'assistants' })
        const fileId = uploadResp.id

        const resp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract and structure this PDF document.' },
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
          result = { markdown: resp.choices[0].message.content.trim(), category: 'Other', tags: [], confidence: 0 }
        }
      } else {
        return Response.json({ error: 'Unsupported file type' }, { status: 400 })
      }
    } else {
      return Response.json({ error: 'Unsupported content type' }, { status: 415 })
    }

    return Response.json({
      title: result.title || 'Untitled Reference',
      markdown: result.markdown || '',
      category: result.category || 'Other',
      tags: result.tags || [],
      confidence: result.confidence ?? null,
    })
  } catch (err) {
    console.error('import-reference error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
