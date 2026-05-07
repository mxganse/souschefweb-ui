import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import { requirePermission } from '@/lib/auth-server'

// Word-boundary regex to avoid substring false positives (gin→begin, rum→forum, etc.)
const BEVERAGE_PATTERN = /\b(jigger|cocktail|bourbon|vodka|whiskey|vermouth|bitters|liqueur|amaro|mezcal|tequila)\b/i

function detectBeverage(title, markdown) {
  const hay = `${title} ${markdown}`
  return BEVERAGE_PATTERN.test(hay)
}

function parseMarkdown(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
    || markdown.match(/\*\*Dish Title:\s*(.*?)\*\*/i)
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Recipe'

  // Try ## Ingredients heading format, then **Ingredients:** bold format
  const ingMatch = markdown.match(/##\s+Ingredients\s*\n([\s\S]*?)(?=\n##|\n*$)/)
    || markdown.match(/\*\*Ingredients:\*\*\s*\n([\s\S]*?)(?=\n\*\*[A-Za-z]|\n##\s|$)/i)
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
    const { markdown, title: titleOverride = null, sourceType, sourceUrl = null, creator = null, source_brand = null, force = false, recipeType = null, cuisine = null, meal_types = [], dietary_flags = [], cooking_styles = [], category_confidence = null } = await request.json()
    console.log('[save-recipe] Received:', { cuisine, meal_types, dietary_flags, cooking_styles })
    if (!markdown) return Response.json({ error: 'markdown is required' }, { status: 400 })

    const parsed = parseMarkdown(markdown)
    // Use the pre-parsed title from the worker when the markdown lacks a standard # heading
    const title = (parsed.title === 'Untitled Recipe' && titleOverride) ? titleOverride : parsed.title
    const { ingredients } = parsed
    const supabase = await createSessionClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const denied = await requirePermission(user, 'can_add_recipes', 'You do not have permission to add recipes.')
    if (denied) return denied

    const submittedBy = !isAdminUser(user)
      ? (user.user_metadata?.full_name || user.email)
      : null

    if (!force) {
      // ── Duplicate check 1: title (case-insensitive exact) ────────────────
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

      // ── Duplicate check 2: content fingerprint (free — no AI) ────────────
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
    }

    // ── Detect beverage type ───────────────────────────────────────────────────
    // Priority: explicit override → AI meal_types → keyword fallback (only when AI gave no meal_types)
    const detectedType = recipeType
      || (meal_types.includes('beverage') ? 'beverage' : null)
      || (meal_types.length === 0 && detectBeverage(title, markdown) ? 'beverage' : null)
      || 'food'

    // ── Save ───────────────────────────────────────────────────────────────
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title,
        category: creator || null,
        cuisine: cuisine || null,
        source_type: sourceType,
        source_url: sourceUrl,
        source_brand: source_brand || null,
        instructions_markdown: markdown,
        user_id: user.id,
        submitted_by: submittedBy,
        recipe_type: detectedType,
        ...(meal_types.length > 0 && { ai_categorized_at: new Date().toISOString(), category_confidence }),
      })
      .select('id')
      .single()

    if (recipeError) throw new Error(recipeError.message)

    if (ingredients.length > 0) {
      await supabase.from('ingredients').insert(
        ingredients.map(raw_text => ({ recipe_id: recipe.id, raw_text }))
      )
    }

    // Save category junction tables in parallel
    const categoryInserts = []
    if (meal_types.length > 0) {
      console.log(`[save-recipe] Inserting ${meal_types.length} meal_types for recipe ${recipe.id}:`, meal_types)
      categoryInserts.push(
        supabase.from('recipe_meal_types').insert(
          meal_types.map(meal_type => ({ recipe_id: recipe.id, meal_type }))
        )
      )
    }
    if (dietary_flags.length > 0) {
      categoryInserts.push(
        supabase.from('recipe_dietary_flags').insert(
          dietary_flags.map(dietary_flag => ({ recipe_id: recipe.id, dietary_flag }))
        )
      )
    }
    if (cooking_styles.length > 0) {
      categoryInserts.push(
        supabase.from('recipe_cooking_styles').insert(
          cooking_styles.map(cooking_style => ({ recipe_id: recipe.id, cooking_style }))
        )
      )
    }
    if (categoryInserts.length > 0) {
      try {
        await Promise.all(categoryInserts)
        console.log('[save-recipe] Category inserts completed successfully')
      } catch (catErr) {
        console.error('[save-recipe] Category insert error:', catErr)
        throw catErr
      }
    }

    return Response.json({
      id: recipe.id,
      title,
      ingredientCount: ingredients.length,
      category: creator || null,
      cuisine: cuisine || null,
      source_type: sourceType,
      source_brand: source_brand || null,
      source_url: sourceUrl || null,
      created_at: new Date().toISOString(),
      instructions_markdown: markdown,
      recipe_type: detectedType,
      user_id: user.id,
      submitted_by: submittedBy,
      meal_types: meal_types || [],
      dietary_flags: dietary_flags || [],
      cooking_styles: cooking_styles || [],
      category_overrides: {},
    })

  } catch (err) {
    console.error('save-recipe error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
