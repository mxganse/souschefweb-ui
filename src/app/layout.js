import './globals.css'

export const metadata = {
  title: 'SousChef',
  description: 'Extract recipes from Instagram reels',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0E1117] text-[#E0E0E0]">
        <nav className="border-b border-gray-800 px-6 py-4 flex gap-6 items-center">
          <span className="text-[#D35400] font-black text-xl tracking-tight">SOUSCHEF</span>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Extract</a>
          <a href="/recipes" className="text-sm text-gray-400 hover:text-white transition-colors">Archive</a>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  )
}
