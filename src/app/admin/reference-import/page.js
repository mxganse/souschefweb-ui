import { createSessionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth'
import ReferenceImportClient from './ReferenceImportClient'

export const metadata = { title: 'Import Reference — SousChef' }

export default async function ReferenceImportPage() {
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!isAdminUser(user)) redirect('/')

  return (
    <div className="max-w-3xl mx-auto">
      <ReferenceImportClient />
    </div>
  )
}
