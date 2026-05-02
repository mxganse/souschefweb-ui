import { createServerClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export const maxDuration = 120

const SYSTEM_PROMPT = `You are an expert culinary editor. The user will provide recipe content from various sources (web pages, PDFs, images, pasted text). Extract and structure the recipe in clean markdown.

Output format — use EXACTLY these sections when present:
# [Dish Title]

## Overview
- **Yield:** [amount]
- **Prep Time:** [time]
- **Cook Time:** [time]
- **Cuisine:** [type]

## Ingredients
- [quantity] [unit] [ingredient, with prep note]

## Method
[Numbered steps. Include temperatures in °F and °C, timing, visual/textural cues.]

## Chef's Notes
[Substitutions, make-ahead tips, storage, food science where relevant.]

Rules:
- If percentages appear (baker's percentages, brine concentrations, hydrocolloid ratios), include them in the Ingredients list.
- Preserve all quantities exactly as written — never round or approximate.
- If the source has multiple recipes, extract only the primary/main recipe.
- Output ONLY the markdown, no preamble or commentary.`

async function extractRecipeFromText(content, openai) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  })
  return resp.choices[0].message.content.trim()
}

async function extractRecipeFromImage(base64, mimeType, openai) {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
          { type: 'text', text: 'Extract the recipe from this image.' },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  })
  return resp.choices[0].message.content.trim()
}

function parseMarkdown(markdown) {
  // Extract title from first H1
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe'

  // Extract ingredients lines (bullet points under ## Ingredients)
  const ingMatch = markdown.match(/##\s+Ingredients\s*\n([\s\S]*?)(?=\n##|\n*$)/)
  const ingredients = []
  if (ingMatch) {
    const lines = ingMatch[1].split('\n')
    for (const line of lines) {
      const m = line.match(/^[-*]\s+(.+)/)
      if (m) ingredients.push(m[1].trim())
    }
  }

  return { title, ingredients }
}

async function saveToSupabase(title, markdown, ingredients, sourceType, sourceUrl = null) {
  const supabase = createServerClient()

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title,
      category: null,
      source_type: sourceType,
      source_url: sourceUrl,
      instructions_markdown: markdown,
    })
    .select('id')
    .single()

  if (recipeError) throw new Error(recipeError.message)

  if (ingredients.length > 0) {
    await supabase.from('ingredients').insert(
      ingredients.map(raw_text => ({ recipe_id: recipe.id, raw_text }))
    )
  }

  return recipe.id
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const contentType = request.headers.get('content-type') || ''

  let type, markdown, sourceUrl

  try {
    // ── JSON body (url or text) ──────────────────────────────────────────────
    if (contentType.includes('application/json')) {
      const body = await request.json()
      type = body.type

      if (type === 'url') {
        const url = body.url
        if (!url) return Response.json({ error: 'URL is required' }, { status: 400 })

        // Fetch the page
        const pageResp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SousChef/1.0)' },
          signal: AbortSignal.timeout(20_000),
        })
        if (!pageResp.ok) throw new Error(`Could not fetch page: ${pageResp.status} ${pageResp.statusText}`)

        const html = await pageResp.text()
        // Strip tags crudely — good enough for recipe content
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 24000) // stay well within token limits

        markdown = await extractRecipeFromText(
          `Extract the recipe from this web page content:\n\n${text}`,
          openai
        )
        sourceUrl = url

      } else if (type === 'text') {
        const text = body.text
        if (!text) return Response.json({ error: 'Text is required' }, { status: 400 })
        markdown = await extractRecipeFromText(`Extract the recipe from this text:\n\n${text}`, openai)

      } else {
        return Response.json({ error: 'Unknown type' }, { status: 400 })
      }

    // ── FormData (pdf or image) ──────────────────────────────────────────────
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
        markdown = await extractRecipeFromImage(base64, mime, openai)

      } else if (type === 'pdf') {
        // Send PDF as image (GPT-4o can read PDF rendered as image via base64 in some cases,
        // but more reliably: send as a file message). We'll use the text extraction approach.
        // For PDFs, use the Files API to extract text, then send to chat.
        // Simple approach: treat as image if small enough, else use text extraction hint.
        // GPT-4o can't natively parse PDF binary — we send first page as image via pdf.js on server isn't available.
        // Best approach without extra deps: upload to OpenAI files API.
        const fileBlob = new File([bytes], file.name || 'recipe.pdf', { type: 'application/pdf' })
        const uploadResp = await openai.files.create({
          file: fileBlob,
          purpose: 'assistants',
        })
        const fileId = uploadResp.id

        // Use responses API with file input
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract the recipe from this PDF document.',
                },
                {
                  type: 'file',
                  file: { file_id: fileId },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        })
        markdown = resp.choices[0].message.content.trim()

        // Clean up file
        await openai.files.del(fileId).catch(() => {})

      } else {
        return Response.json({ error: 'Unknown file type' }, { status: 400 })
      }

    } else {
      return Response.json({ error: 'Unsupported content type' }, { status: 415 })
    }

    // ── Parse and save ─────────────────────────────────────────────────────
    const { title, ingredients } = parseMarkdown(markdown)
    const sourceTypeMap = { url: 'Web Import', text: 'Text Import', pdf: 'PDF Import', image: 'Image Import' }
    const id = await saveToSupabase(title, markdown, ingredients, sourceTypeMap[type] || 'Import', sourceUrl)

    return Response.json({ id, title, ingredients, recipe: markdown })

  } catch (err) {
    console.error('import-recipe error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
