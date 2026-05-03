'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SOURCE_META } from '@/lib/sourceMeta'

const ITEMS_PER_PAGE = 20

const SOURCE_FILTERS = [
  { id: 'all',                 label: 'All' },
  { id: 'Instagram Extract',   label: '📸 Instagram' },
  { id: 'Web Import',          label: '🌐 Web' },
  { id: 'PDF Import',          label: '📄 PDF' },
  { id: 'Image Import',        label: '📷 Photo' },
  { id: 'Text Import',         label: '📝 Text' },
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

function RecipeCard({ recipe, onDelete, onUpdate }) {
  const detailsRef              = useRef()
  const [title, setTitle]       = useState(recipe.title || '')
  const [category, setCategory] = useState(recipe.category || '')
  const [text, setText]         = useState(recipe.instructions_markdown || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function saveEdits() {
    setSaving(true)
    await supabase
      .from('recipes')
      .update({ title, category: category || null, instructions_markdown: text })
      .eq('id', recipe.id)
    setSaving(false)
    setSaved(true)
    onUpdate(recipe.id, { title, category: category || null, instructions_markdown: text })
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCancel() {
    setTitle(recipe.title || '')
    setCategory(recipe.category || '')
    setText(recipe.instructions_markdown || '')
    if (detailsRef.current) detailsRef.current.open = false
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('ingredients').delete().eq('recipe_id', recipe.id)
    await supabase.from('recipes').delete().eq('id', recipe.id)
    onDelete(recipe.id)
  }

  function downloadPdf() {
    const params = new URLSearchParams({ id: recipe.id })
    window.open(`/api/export-pdf?${params}`, '_blank')
  }

  return (
    <details ref={detailsRef} className="bg-[#161B22] border border-gray-800 rounded group">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none select-none active:bg-[#1c2230] hover:bg-[#1c2230] transition-colors">
        <SourceIcon type={recipe.source_type} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">{title || recipe.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(recipe.created_at)}
            {category && category !== 'Unknown' ? ` · @${category}` : ''}
          </p>
        </div>
        <span className="text-gray-600 text-xs mt-0.5 group-open:rotate-90 transition-transform">▶</span>
      </summary>

      <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
        {/* Editable metadata fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Creator / Handle</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="@username or source name"
              className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors"
            />
          </div>
        </div>

        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-[#D35400] hover:text-[#E67E22] underline py-0.5"
          >
            View original source →
          </a>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Recipe Markdown</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-base sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={saveEdits}
              disabled={saving}
              className="flex-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded transition-colors"
            >
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'SAVE EDITS'}
            </button>
            <button
              onClick={downloadPdf}
              className="flex-1 bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] text-white text-sm font-bold py-2.5 rounded transition-colors"
            >
              DOWNLOAD PDF
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 bg-transparent border border-gray-700 hover:border-gray-500 hover:text-white text-gray-400 text-sm font-bold py-2.5 rounded transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-transparent border border-red-900 hover:bg-red-950 hover:border-red-700 disabled:opacity-40 text-red-500 hover:text-red-400 text-sm font-bold py-2.5 rounded transition-colors"
            >
              {deleting ? 'Deleting…' : 'DELETE'}
            </button>
          </div>
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
  const [recipes, setRecipes]         = useState(initialRecipes)
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState('newest')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage]               = useState(1)

  // Sync when server re-fetches (e.g. after router.refresh())
  useEffect(() => { setRecipes(initialRecipes) }, [initialRecipes])

  function handleSearch(v)  { setSearch(v);       setPage(1) }
  function handleSource(v)  { setSourceFilter(v); setPage(1) }
  function handleSort(v)    { setSort(v);          setPage(1) }

  function handleDelete(id) {
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  function handleUpdate(id, patches) {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...patches } : r))
  }

  const filtered = recipes
    .filter(r => {
      if (sourceFilter === 'Instagram Extract') {
        if (!['Instagram Extract', 'Instagram Extraction'].includes(r.source_type)) return false
      } else if (sourceFilter !== 'all' && r.source_type !== sourceFilter) return false
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
        <h2 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight">RECIPE ARCHIVE</h2>
        <span className="text-xs text-gray-500">{recipes.length} recipes</span>
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
          {search || sourceFilter !== 'all' ? 'No recipes match your filters.' : 'No recipes yet. Add your first one above!'}
        </p>
      ) : (
        <div className="space-y-2">
          {paginated.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
