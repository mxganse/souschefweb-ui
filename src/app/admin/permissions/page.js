import { createSessionClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PermissionsClient from './PermissionsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'User Permissions — SousChef Admin' }

export default async function PermissionsPage() {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminUser(user)) redirect('/')

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <a href="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Admin</a>
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mt-2 mb-1">USER PERMISSIONS</h1>
        <p className="text-gray-500 text-sm">Control what each user can access and do. Changes take effect immediately.</p>
      </div>
      <PermissionsClient />
    </div>
  )
}
