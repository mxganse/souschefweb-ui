import { createSessionClient } from '@/lib/supabase/server'

function parseMarkdown(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe'

  const ingMatch = markdown.match(/##\s+Ingredients\s*\n([\s\S]*?)(?=\n##|\n*$)/)
  const ingredients = []
  if (ingMatch) {
    for (const line of ingMatch[1].split('\n')) {
      const m = line.match(/^[-*]\s+(.+)/)
      if (m) ingredients.push(m[1].trim())
    }
  }

  return { title, ingredients }
}

// Extract a distinctive phrase from the Method section for content fingerprinting
function getContentFingerprint(markdown) {
  const methodMatch = markdown.match(/##\s+Method\s*\n([\s\S]*?)(?=\n##|\n*$)/)
  if (!methodMatch) return null
  const lines = methodMatch[1].split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(l => l.length > 40)
  return lines[0]?.slice(0, 120) || null
}

export async function POST(request) {
  try {
    const { markdown, sourceType, sourceUrl = null, creator = null } = await request.json()
    if (!markdown) return Response.json({ error: 'markdown is required' }, { status: 400 })

    const { title, ingredients } = parseMarkdown(markdown)
    const supabase = await createSessionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Duplicate check 1: title (case-insensitive exact) ──────────────────
    const { data: titleMatch } = await supabase
      .from('recipes')
      .select('id, title')
      .ilike('title', title.trim())
      .maybeSingle()

    if (titleMatch) {
      return Response.json(
        { error: `"${titleMatch.title}" is already in your archive.`, duplicate: true, existingId: titleMatch.id },
        { status: 409 }
      )
    }

    // ── Duplicate check 2: content fingerprint (free — no AI) ──────────────
    const fingerprint = getContentFingerprint(markdown)
    if (fingerprint) {
      const { data: contentMatch } = await supabase
        .from('recipes')
        .select('id, title')
        .ilike('instructions_markdown', `%${fingerprint}%`)
        .maybeSingle()

      if (contentMatch) {
        return Response.json(
          {
            error: `This recipe appears to already exist as "${contentMatch.title}".`,
            duplicate: true,
            existingId: contentMatch.id,
          },
          { status: 409 }
        )
      }
    }

    // ── Save ───────────────────────────────────────────────────────────────
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        category: creator || null,
        source_type: sourceType,
        source_url: sourceUrl,
        instructions_markdown: markdown,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (recipeError) throw new Error(recipeError.message)

    if (ingredients.length > 0) {
      await supabase.from('ingredients').insert(
        ingredients.map(raw_text => ({ recipe_id: recipe.id, raw_text }))
      )
    }

    return Response.json({ id: recipe.id, title, ingredientCount: ingredients.length })

  } catch (err) {
    console.error('save-recipe error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
