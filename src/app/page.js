import { createSessionClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import RecipeArchive from './recipes/RecipeArchive'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createSessionClient()

  // Middleware guarantees the user is authenticated before reaching here.
  // RLS filters recipes automatically to the signed-in user.
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, category, source_type, source_url, created_at, instructions_markdown, submitted_by')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-14">
      <div className="max-w-xl mx-auto">
        <HomeClient />
      </div>
      <div id="archive" className="border-t border-gray-800 pt-10">
        <RecipeArchive initialRecipes={recipes ?? []} />
      </div>
    </div>
  )
}
