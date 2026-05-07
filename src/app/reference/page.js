import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import { getUserPermissions } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import ReferenceViewer from './ReferenceViewer'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reference — SousChef' }

export default async function ReferencePage() {
  const supabase = await createSessionClient()

  const [
    { data: { user } },
    { data: standards, error }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('culinary_standards')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true }),
  ])

  if (!user) redirect('/login')

  if (!isAdminUser(user)) {
    const perms = await getUserPermissions(user.id)
    if (!perms.can_access_reference) redirect('/')
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm p-4 bg-red-950 border border-red-800 rounded">
        Failed to load reference: {error.message}
      </div>
    )
  }

  return (
    <ReferenceViewer
      initialData={standards ?? []}
      isAdmin={isAdminUser(user)}
    />
  )
}
