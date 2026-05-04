import './globals.css'
import { createSessionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'SousChef',
  description: 'Add and archive recipes from any source — Instagram, websites, PDFs, photos, or text.',
  robots: { index: false, follow: false },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({ children }) {
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createSessionClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0E1117] text-[#E0E0E0]">
        <nav className="border-b border-gray-800 px-4 py-3 flex items-center sticky top-0 bg-[#0E1117] z-10 gap-6">
          <a href="/" className="text-[#D35400] font-black text-lg tracking-tight hover:text-[#E67E22] transition-colors flex-shrink-0">
            SOUSCHEF
          </a>

          {user ? (
            <>
              {user.email === 'mxganse@gmail.com' && (
                <a href="/admin" className="text-xs font-bold text-gray-600 hover:text-gray-300 transition-colors tracking-widest uppercase py-1">
                  Admin
                </a>
              )}
              <div className="ml-auto flex items-center gap-4">
                <span className="text-xs text-gray-700 hidden sm:block">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <form action={signOut}>
                  <button type="submit" className="text-xs font-bold text-gray-600 hover:text-red-400 transition-colors tracking-widest uppercase py-1">
                    Sign out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <a href="/login" className="ml-auto text-xs font-bold text-gray-600 hover:text-gray-300 transition-colors tracking-widest uppercase py-1">
              Sign in
            </a>
          )}
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-6 pb-safe">
          {children}
        </main>
      </body>
    </html>
  )
}
