import { createServerClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'
import RecipeArchive from './recipes/RecipeArchive'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createServerClient()

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, category, source_type, source_url, created_at, instructions_markdown')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-14">
      {/* Import section */}
      <div className="max-w-xl mx-auto">
        <HomeClient />
      </div>

      {/* Archive section */}
      <div id="archive" className="border-t border-gray-800 pt-10">
        <RecipeArchive initialRecipes={recipes ?? []} />
      </div>
    </div>
  )
}
