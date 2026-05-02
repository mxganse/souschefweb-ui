import './globals.css'

export const metadata = {
  title: 'SousChef',
  description: 'Extract recipes from Instagram reels',
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
        <nav className="border-b border-gray-800 px-4 py-3 flex gap-4 items-center sticky top-0 bg-[#0E1117] z-10">
          <span className="text-[#D35400] font-black text-lg tracking-tight">SOUSCHEF</span>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Extract</a>
          <a href="/recipes" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Archive</a>
          <a href="/import" className="text-sm text-gray-400 hover:text-white transition-colors py-1">Import</a>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6 pb-safe">
          {children}
        </main>
      </body>
    </html>
  )
}
