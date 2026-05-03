import { createSessionClient } from '@/lib/supabase/server'
import RecipeArchive from './RecipeArchive'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const supabase = await createSessionClient()

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, category, source_type, source_url, created_at, instructions_markdown')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-950 border border-red-800 rounded">
        Failed to load recipes: {error.message}
      </div>
    )
  }

  return <RecipeArchive initialRecipes={recipes ?? []} />
}
