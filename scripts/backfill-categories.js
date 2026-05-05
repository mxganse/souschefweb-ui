/**
 * Backfill AI categorization for existing uncategorized recipes.
 * Usage: node scripts/backfill-categories.js [--limit=50] [--dry-run]
 *
 * Set env vars before running:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local')
const envLines = fs.readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const eqIdx = line.indexOf('=')
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '').replace(/^﻿/, '')
    if (key && !key.startsWith('#')) process.env[key] = val
  }
}

const args = process.argv.slice(2)
const limitArg = args.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 50
const DRY_RUN = args.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CATEGORIZE_PROMPT = `You are a culinary categorization expert. Given a recipe in markdown, return ONLY valid JSON:
{
  "meal_types": ["breakfast"|"lunch"|"dinner"|"dessert"|"snack"|"appetizer"|"beverage"|"sauce/condiment"],
  "dietary_flags": ["omnivore"|"vegetarian"|"vegan"|"pescatarian"|"gluten-free"|"dairy-free"|"nut-free"|"kosher"|"halal"|"keto"|"paleo"|"whole30"],
  "cooking_styles": ["baking"|"grilling"|"braising"|"sous-vide"|"roasting"|"sautéing"|"raw/no-cook"|"frying"|"boiling"|"steaming"|"slow-cooking"|"smoking"|"curing"|"fermenting"],
  "confidence": 0.95
}
meal_types and cooking_styles can have multiple values. dietary_flags should include 'omnivore' unless recipe is restricted. Return only JSON, no explanation.`

async function categorizeRecipe(title, markdown) {
  const content = `# ${title}\n\n${markdown}`.slice(0, 8000)
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: CATEGORIZE_PROMPT },
      { role: 'user', content },
    ],
    temperature: 0.1,
    max_tokens: 256,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(resp.choices[0].message.content)
}

async function main() {
  console.log(`\nSousChef Category Backfill — limit: ${LIMIT}${DRY_RUN ? ' [DRY RUN]' : ''}\n`)

  // Fetch uncategorized recipes (no entries in recipe_meal_types)
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, instructions_markdown')
    .is('ai_categorized_at', null)
    .order('created_at', { ascending: false })
    .limit(LIMIT)

  if (error) { console.error('Fetch error:', error.message); process.exit(1) }
  console.log(`Found ${recipes.length} uncategorized recipes\n`)

  let success = 0, failed = 0

  for (const recipe of recipes) {
    process.stdout.write(`  Processing: ${recipe.title.slice(0, 50).padEnd(52)}`)
    try {
      const cats = await categorizeRecipe(recipe.title, recipe.instructions_markdown || '')

      if (!DRY_RUN) {
        const inserts = []

        if (cats.meal_types?.length) {
          inserts.push(supabase.from('recipe_meal_types').upsert(
            cats.meal_types.map(meal_type => ({ recipe_id: recipe.id, meal_type })),
            { onConflict: 'recipe_id,meal_type', ignoreDuplicates: true }
          ))
        }
        if (cats.dietary_flags?.length) {
          inserts.push(supabase.from('recipe_dietary_flags').upsert(
            cats.dietary_flags.map(dietary_flag => ({ recipe_id: recipe.id, dietary_flag })),
            { onConflict: 'recipe_id,dietary_flag', ignoreDuplicates: true }
          ))
        }
        if (cats.cooking_styles?.length) {
          inserts.push(supabase.from('recipe_cooking_styles').upsert(
            cats.cooking_styles.map(cooking_style => ({ recipe_id: recipe.id, cooking_style })),
            { onConflict: 'recipe_id,cooking_style', ignoreDuplicates: true }
          ))
        }

        inserts.push(supabase.from('recipes').update({
          ai_categorized_at: new Date().toISOString(),
          category_confidence: cats.confidence ?? null,
        }).eq('id', recipe.id))

        await Promise.all(inserts)
      }

      process.stdout.write(`✓ [${(cats.meal_types || []).join('/')}] [${(cats.dietary_flags || []).join('+')}]\n`)
      success++
    } catch (err) {
      process.stdout.write(`✗ ${err.message}\n`)
      failed++
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\nDone: ${success} succeeded, ${failed} failed\n`)
}

main().catch(err => { console.error(err); process.exit(1) })
