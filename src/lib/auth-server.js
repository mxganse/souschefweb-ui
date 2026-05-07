import { createAdminClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'

const DEFAULT_PERMS = {
  can_add_recipes: false,
  can_view_library: false,
  library_view_scope: 'own_only',
  can_access_reference: false,
  can_export_pdf: false,
  can_import_recipes: false,
  can_email_recipe: false,
}

export async function getUserPermissions(userId) {
  if (!userId) return DEFAULT_PERMS
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data ? { ...DEFAULT_PERMS, ...data } : DEFAULT_PERMS
}

// Returns the recipe query scope for a given user object.
// Admin always sees all; granted users see based on library_view_scope.
export async function requirePermission(user, permKey, errorMsg) {
  if (isAdminUser(user)) return null
  const perms = await getUserPermissions(user.id)
  if (!perms[permKey]) {
    return Response.json({ error: errorMsg ?? 'Permission denied.' }, { status: 403 })
  }
  return null
}

export async function getUserRecipeViewScope(user) {
  if (!user) return { scope: 'own_only' }
  if (isAdminUser(user)) return { scope: 'all' }
  const perms = await getUserPermissions(user.id)
  if (!perms.can_view_library) return { scope: 'own_only' }
  return { scope: perms.library_view_scope || 'own_only' }
}
