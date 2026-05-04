import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import HomeClient from './HomeClient'
import RecipeArchive from './recipes/RecipeArchive'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createSessionClient()

  const [{ data: { user } }, { data: recipes, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('recipes')
      .select('id, title, category, source_type, source_url, created_at, instructions_markdown, submitted_by, user_id, recipe_type')
      .order('created_at', { ascending: false }),
  ])

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-950 border border-red-800 rounded">
        Failed to load recipes: {error.message}
      </div>
    )
  }

  const isAdmin = isAdminUser(user)

  return (
    <div className="space-y-14">
      <div className="max-w-xl mx-auto">
        <HomeClient />
      </div>
      <div id="archive" className="border-t border-gray-800 pt-10">
        <RecipeArchive
          initialRecipes={recipes ?? []}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
