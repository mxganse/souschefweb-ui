import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import { getUserRecipeViewScope } from '@/lib/auth-server'
import HomeClient from './HomeClient'
import RecipeArchive from './recipes/RecipeArchive'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { scope } = await getUserRecipeViewScope(user)

  const recipeSelect = 'id, title, category, cuisine, source_type, source_brand, source_url, created_at, instructions_markdown, submitted_by, user_id, recipe_type'

  let recipes, mealTypes, dietaryFlags, cookingStyles, error

  if (scope === 'own_only' && user) {
    // Fetch only this user's recipes, then filter tag tables to those IDs
    const recipesRes = await supabase.from('recipes').select(recipeSelect).eq('user_id', user.id).order('created_at', { ascending: false })
    recipes = recipesRes.data
    error = recipesRes.error
    const ids = recipes?.map(r => r.id) ?? []
    if (ids.length > 0) {
      ;[{ data: mealTypes }, { data: dietaryFlags }, { data: cookingStyles }] = await Promise.all([
        supabase.from('recipe_meal_types').select('recipe_id, meal_type, is_admin_override, original_ai_value').in('recipe_id', ids),
        supabase.from('recipe_dietary_flags').select('recipe_id, dietary_flag').in('recipe_id', ids),
        supabase.from('recipe_cooking_styles').select('recipe_id, cooking_style').in('recipe_id', ids),
      ])
    } else {
      mealTypes = []; dietaryFlags = []; cookingStyles = []
    }
  } else {
    ;[{ data: recipes, error }, { data: mealTypes }, { data: dietaryFlags }, { data: cookingStyles }] = await Promise.all([
      supabase.from('recipes').select(recipeSelect).order('created_at', { ascending: false }),
      supabase.from('recipe_meal_types').select('recipe_id, meal_type, is_admin_override, original_ai_value'),
      supabase.from('recipe_dietary_flags').select('recipe_id, dietary_flag'),
      supabase.from('recipe_cooking_styles').select('recipe_id, cooking_style'),
    ])
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-950 border border-red-800 rounded">
        Failed to load recipes: {error.message}
      </div>
    )
  }

  // Build lookup maps for O(1) joins
  const mealTypeMap = {}
  for (const row of mealTypes ?? []) {
    if (!mealTypeMap[row.recipe_id]) mealTypeMap[row.recipe_id] = { values: [], overrides: {} }
    mealTypeMap[row.recipe_id].values.push(row.meal_type)
    if (row.is_admin_override && row.original_ai_value) {
      mealTypeMap[row.recipe_id].overrides[row.meal_type] = row.original_ai_value
    }
  }

  const dietaryMap = {}
  for (const row of dietaryFlags ?? []) {
    if (!dietaryMap[row.recipe_id]) dietaryMap[row.recipe_id] = []
    dietaryMap[row.recipe_id].push(row.dietary_flag)
  }

  const cookingMap = {}
  for (const row of cookingStyles ?? []) {
    if (!cookingMap[row.recipe_id]) cookingMap[row.recipe_id] = []
    cookingMap[row.recipe_id].push(row.cooking_style)
  }

  const enriched = (recipes ?? []).map(r => ({
    ...r,
    meal_types: mealTypeMap[r.id]?.values ?? [],
    dietary_flags: dietaryMap[r.id] ?? [],
    cooking_styles: cookingMap[r.id] ?? [],
    category_overrides: mealTypeMap[r.id]?.overrides ?? {},
  }))

  const isAdmin = isAdminUser(user)

  return (
    <div className="space-y-14">
      <div className="max-w-xl mx-auto">
        <HomeClient />
      </div>
      <div id="archive" className="border-t border-gray-800 pt-10">
        <RecipeArchive
          initialRecipes={enriched}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
