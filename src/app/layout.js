import './globals.css'

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0E1117] text-[#E0E0E0]">
        <nav className="border-b border-gray-800 px-4 py-3 flex items-center sticky top-0 bg-[#0E1117] z-10 gap-6">
          <a href="/" className="text-[#D35400] font-black text-lg tracking-tight hover:text-[#E67E22] transition-colors flex-shrink-0">
            SOUSCHEF
          </a>
          {/* Future module links */}
          <a href="/admin" className="ml-auto text-xs font-bold text-gray-600 hover:text-gray-300 transition-colors tracking-widest uppercase py-1">
            Admin
          </a>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6 pb-safe">
          {children}
        </main>
      </body>
    </html>
  )
}
