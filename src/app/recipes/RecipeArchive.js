'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const ITEMS_PER_PAGE = 20

const SOURCE_META = {
  'Instagram Extract': { icon: '📸', label: 'Instagram' },
  'Web Import':        { icon: '🌐', label: 'Web' },
  'PDF Import':        { icon: '📄', label: 'PDF' },
  'Image Import':      { icon: '📷', label: 'Photo' },
  'Text Import':       { icon: '📝', label: 'Text' },
}

const SOURCE_FILTERS = [
  { id: 'all', label: 'All' },
  ...Object.entries(SOURCE_META).map(([id, { icon, label }]) => ({ id, label: `${icon} ${label}` })),
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function SourceIcon({ type }) {
  const meta = SOURCE_META[type]
  if (!meta) return <span className="text-base">📋</span>
  return <span className="text-base" title={meta.label}>{meta.icon}</span>
}

function RecipeCard({ recipe }) {
  const [text, setText] = useState(recipe.instructions_markdown || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveEdits() {
    setSaving(true)
    await supabase
      .from('recipes')
      .update({ instructions_markdown: text })
      .eq('id', recipe.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function downloadPdf() {
    const params = new URLSearchParams({ id: recipe.id })
    window.open(`/api/export-pdf?${params}`, '_blank')
  }

  return (
    <details className="bg-[#161B22] border border-gray-800 rounded group">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none select-none active:bg-[#1c2230] hover:bg-[#1c2230] transition-colors">
        <SourceIcon type={recipe.source_type} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">{recipe.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(recipe.created_at)}
            {recipe.category && recipe.category !== 'Unknown' ? ` · @${recipe.category}` : ''}
          </p>
        </div>
        <span className="text-gray-600 text-xs mt-0.5 group-open:rotate-90 transition-transform">▶</span>
      </summary>

      <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-[#D35400] hover:text-[#E67E22] underline py-1"
          >
            View original source →
          </a>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={12}
          className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-base sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={saveEdits}
            disabled={saving}
            className="flex-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 text-white text-sm font-bold py-3 rounded transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'SAVE EDITS'}
          </button>
          <button
            onClick={downloadPdf}
            className="flex-1 bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] text-white text-sm font-bold py-3 rounded transition-colors"
          >
            DOWNLOAD PDF
          </button>
        </div>
      </div>
    </details>
  )
}

function Pagination({ page, pageCount, onPage }) {
  if (pageCount <= 1) return null
  const pages = []
  for (let i = 1; i <= pageCount; i++) {
    // Show first, last, current ±1, and ellipsis
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 text-sm rounded transition-colors ${
              p === page
                ? 'bg-[#D35400] text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === pageCount}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  )
}

export default function RecipeArchive({ initialRecipes }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage] = useState(1)

  function handleSearch(v) { setSearch(v); setPage(1) }
  function handleSource(v) { setSourceFilter(v); setPage(1) }
  function handleSort(v) { setSort(v); setPage(1) }

  const filtered = initialRecipes
    .filter(r => {
      if (sourceFilter !== 'all' && r.source_type !== sourceFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.title?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.instructions_markdown?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sort === 'title')  return (a.title || '').localeCompare(b.title || '')
      return 0
    })

  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight">RECIPE ARCHIVE</h1>
        <span className="text-xs text-gray-500">{initialRecipes.length} recipes</span>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-3">
        <input
          type="search"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search recipes, ingredients…"
          className="flex-1 bg-[#161B22] border border-gray-700 rounded px-4 py-2.5 text-base focus:outline-none focus:border-[#D35400] transition-colors"
        />
        <select
          value={sort}
          onChange={e => handleSort(e.target.value)}
          className="bg-[#161B22] border border-gray-700 rounded px-3 py-2.5 text-base focus:outline-none focus:border-[#D35400] sm:w-36"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* Source filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {SOURCE_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => handleSource(f.id)}
            className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
              sourceFilter === f.id
                ? 'bg-[#D35400] border-[#D35400] text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count when filtered */}
      {(search || sourceFilter !== 'all') && (
        <p className="text-xs text-gray-500 mb-3">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {pageCount > 1 ? ` · page ${page} of ${pageCount}` : ''}
        </p>
      )}
      {!search && sourceFilter === 'all' && pageCount > 1 && (
        <p className="text-xs text-gray-500 mb-3">Page {page} of {pageCount}</p>
      )}

      {paginated.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">
          {search || sourceFilter !== 'all' ? 'No recipes match your filters.' : 'No recipes yet. Add your first one!'}
        </p>
      ) : (
        <div className="space-y-2">
          {paginated.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
