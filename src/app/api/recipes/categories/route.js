import { createSessionClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSessionClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    { data: mealTypes },
    { data: dietaryFlags },
    { data: cookingStyles },
  ] = await Promise.all([
    supabase.from('recipe_meal_types').select('meal_type'),
    supabase.from('recipe_dietary_flags').select('dietary_flag'),
    supabase.from('recipe_cooking_styles').select('cooking_style'),
  ])

  function countValues(rows, key) {
    const counts = {}
    for (const row of rows ?? []) {
      counts[row[key]] = (counts[row[key]] || 0) + 1
    }
    return Object.entries(counts)
      .map(([id, count]) => ({ id, label: id, count }))
      .sort((a, b) => b.count - a.count)
  }

  return Response.json({
    meal_types: countValues(mealTypes, 'meal_type'),
    dietary_flags: countValues(dietaryFlags, 'dietary_flag'),
    cooking_styles: countValues(cookingStyles, 'cooking_style'),
  })
}
