'use client'
import { useState, useEffect, useRef } from 'react'
import { SOURCE_META } from '@/lib/sourceMeta'
import ScalingPanel from './ScalingPanel'
import CategoryFilter from './CategoryFilter'

const ITEMS_PER_PAGE = 20

const BADGE_STYLES = {
  'Serious Eats': { badge: 'bg-orange-100 text-orange-800 border border-orange-200', icon: '🍳' },
  'AllRecipes': { badge: 'bg-amber-100 text-amber-800 border border-amber-200', icon: '👨‍🍳' },
  'NYT Cooking': { badge: 'bg-gray-100 text-gray-900 border border-gray-300', icon: '📰' },
  'Bon Appétit': { badge: 'bg-blue-100 text-blue-800 border border-blue-200', icon: '✨' },
  'Epicurious': { badge: 'bg-blue-100 text-blue-800 border border-blue-200', icon: '✨' },
  'Instagram': { badge: 'bg-purple-100 text-purple-800 border border-purple-200', icon: '📸' },
  'Unknown': { badge: 'bg-gray-100 text-gray-600 border border-gray-300', icon: '📋' },
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function SourceIcon({ type }) {
  const meta = SOURCE_META[type]
  if (!meta) return <span className="text-base">📋</span>
  return <span className="text-base" title={meta.label}>{meta.icon}</span>
}

function SourceBadge({ sourceBrand }) {
  if (!sourceBrand) return null
  const styles = BADGE_STYLES[sourceBrand] || BADGE_STYLES['Unknown']
  return (
    <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded z-10 ${styles.badge}`}>
      {styles.icon} {sourceBrand}
    </span>
  )
}

function CategoryBadges({ recipe }) {
  const mealTypes = recipe.meal_types || []
  const dietaryFlags = recipe.dietary_flags || []
  const cookingStyles = recipe.cooking_styles || []
  const overrides = recipe.category_overrides || {}

  if (!mealTypes.length && !dietaryFlags.length && !cookingStyles.length) return null

  function renderBadge(value, originalAiValue) {
    const hasOverride = originalAiValue && originalAiValue !== value
    return (
      <span key={value} className="inline-flex items-center gap-0.5">
        <span className="text-gray-300">{value}</span>
        {hasOverride && (
          <span className="text-gray-600 text-[10px]">(was: {originalAiValue})</span>
        )}
      </span>
    )
  }

  const visibleDietary = dietaryFlags.filter(f => f !== 'omnivore')

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
      {mealTypes.length > 0 && (
        <span className="text-[11px] text-gray-500">
          🍽 {mealTypes.map((v, i) => [i > 0 ? ', ' : null, renderBadge(v, overrides[v])])}
        </span>
      )}
      {visibleDietary.length > 0 && (
        <span className="text-[11px] text-gray-500">
          · {visibleDietary.map((v, i) => [i > 0 ? ', ' : null, renderBadge(v, overrides[v])])}
        </span>
      )}
      {cookingStyles.length > 0 && (
        <span className="text-[11px] text-gray-500">
          · {cookingStyles.join(', ')}
        </span>
      )}
    </div>
  )
}

function RecipeCard({ recipe, onDelete, onUpdate, currentUserId, isAdmin }) {
  const detailsRef              = useRef()
  const [title, setTitle]       = useState(recipe.title || '')
  const [category, setCategory] = useState(recipe.category || '')
  const [text, setText]         = useState(recipe.instructions_markdown || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showScale, setShowScale] = useState(false)
  const [scaleState, setScaleState] = useState({ factor: 1, system: 'auto' })
  const [recipeType, setRecipeType]         = useState(recipe.recipe_type || 'food')
  const [versions, setVersions]             = useState(null)
  const [showHistory, setShowHistory]       = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [emailSending, setEmailSending]     = useState(false)
  const [emailSent, setEmailSent]           = useState(false)

  const canEdit = isAdmin || (currentUserId && recipe.user_id === currentUserId)

  function track(event, metadata = {}) {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, metadata }),
    }).catch(() => {})
  }

  async function loadVersions() {
    setLoadingHistory(true)
    const res = await fetch(`/api/recipe-versions/${recipe.id}`)
    const data = await res.json()
    setLoadingHistory(false)
    if (res.ok) setVersions(data.versions)
  }

  async function emailCard() {
    setEmailSending(true)
    setEmailSent(false)
    const res = await fetch('/api/send-recipe-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category: recipe.category,
        source_url: recipe.source_url,
        created_at: recipe.created_at,
        instructions_markdown: text,
      }),
    })
    setEmailSending(false)
    if (res.ok) {
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    }
  }

  async function saveEdits() {
    setSaving(true)
    const res = await fetch('/api/recipe-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recipe.id, title, category, instructions_markdown: text, recipe_type: recipeType }),
    })
    setSaving(false)
    if (!res.ok) return
    setSaved(true)
    onUpdate(recipe.id, { title, category: category || null, instructions_markdown: text, recipe_type: recipeType })
    setTimeout(() => setSaved(false), 2000)
    if (showHistory) loadVersions()
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
    const res = await fetch('/api/recipe-update', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: recipe.id }),
    })
    if (res.ok) onDelete(recipe.id)
    else setDeleting(false)
  }

  async function downloadPdf() {
    const isScaled = Math.abs(scaleState.factor - 1) > 0.001

    if (isScaled) {
      // Build scaled markdown client-side, POST it to the PDF endpoint
      const { buildScaledMarkdown } = await import('@/lib/ingredients')
      const scaledMarkdown = buildScaledMarkdown(text, scaleState.factor, scaleState.system)

      track('scale_pdf_download', { scaleFactor: scaleState.factor })

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          category: recipe.category,
          source_url: recipe.source_url,
          created_at: recipe.created_at,
          instructions_markdown: scaledMarkdown,
        }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(title || 'recipe').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      track('pdf_download')
      const params = new URLSearchParams({ id: recipe.id })
      window.open(`/api/export-pdf?${params}`, '_blank')
    }
  }

  return (
    <details ref={detailsRef} className="bg-[#161B22] border border-gray-800 rounded group relative">
      <SourceBadge sourceBrand={recipe.source_brand} />
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none select-none active:bg-[#1c2230] hover:bg-[#1c2230] transition-colors">
        <SourceIcon type={recipe.source_type} />
        {recipe.recipe_type === 'beverage' && <span className="text-xs">🍹</span>}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">{title || recipe.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(recipe.created_at)}
            {category && category !== 'Unknown' ? ` · @${category}` : ''}
            {recipe.submitted_by ? ` · submitted by ${recipe.submitted_by}` : ''}
          </p>
          <CategoryBadges recipe={recipe} />
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
              className={`w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors ${!canEdit ? 'opacity-60 cursor-default' : ''}`}
              readOnly={!canEdit}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Creator / Handle</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="@username or source name"
              className={`w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors ${!canEdit ? 'opacity-60 cursor-default' : ''}`}
              readOnly={!canEdit}
            />
          </div>
          {canEdit && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecipeType('food')}
                  className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
                    recipeType === 'food'
                      ? 'bg-[#D35400] border-[#D35400] text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >🍽 Food</button>
                <button
                  onClick={() => setRecipeType('beverage')}
                  className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
                    recipeType === 'beverage'
                      ? 'bg-[#D35400] border-[#D35400] text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >🍹 Beverage</button>
              </div>
            </div>
          )}
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

        {recipe.submitted_by && (
          <p className="text-xs text-gray-500">
            <span className="font-bold text-gray-400">Submitted by</span> {recipe.submitted_by}
          </p>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Recipe Markdown</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            readOnly={!canEdit}
            className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-base sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none"
          />
        </div>

        {recipeType !== 'beverage' && showScale && <ScalingPanel markdown={text} onScaleChange={s => setScaleState(s)} />}

        <div className="flex flex-col gap-2">
          {recipeType !== 'beverage' && (
            <button
              onClick={() => {
                const next = !showScale
                if (next) track('scale_panel_open')
                setShowScale(next)
              }}
              className={`w-full text-sm font-bold py-2.5 rounded border transition-colors ${
                showScale
                  ? 'bg-[#D35400]/10 border-[#D35400] text-[#D35400]'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
              }`}
            >
              {showScale ? '⚖ Hide Scaling' : '⚖ Scale Recipe'}
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={saveEdits}
              disabled={saving || !canEdit}
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
            <button
              onClick={emailCard}
              disabled={emailSending}
              title="Send PDF to your email"
              className="px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded transition-colors"
            >
              {emailSending ? '…' : emailSent ? '✓' : '📧'}
            </button>
          </div>
          {!canEdit && (
            <p className="text-xs text-gray-600 italic text-center py-1">View only — not your recipe</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 bg-transparent border border-gray-700 hover:border-gray-500 hover:text-white text-gray-400 text-sm font-bold py-2.5 rounded transition-colors"
            >
              CANCEL
            </button>
            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-transparent border border-red-900 hover:bg-red-950 hover:border-red-700 disabled:opacity-40 text-red-500 hover:text-red-400 text-sm font-bold py-2.5 rounded transition-colors"
              >
                {deleting ? 'Deleting…' : 'DELETE'}
              </button>
            )}
          </div>
        </div>

        {/* Version History */}
        <div className="border-t border-gray-800 pt-3">
          <button
            onClick={() => {
              const next = !showHistory
              setShowHistory(next)
              if (next && versions === null) loadVersions()
            }}
            className="text-xs text-gray-500 hover:text-gray-300 font-bold flex items-center gap-1 transition-colors"
          >
            🕒 Version History {showHistory ? '▴' : '▾'}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {loadingHistory && <p className="text-xs text-gray-600">Loading…</p>}
              {versions?.length === 0 && !loadingHistory && (
                <p className="text-xs text-gray-600 italic">No saved versions yet.</p>
              )}
              {versions?.map(v => (
                <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-gray-800/50 last:border-0">
                  <div>
                    <span className="text-xs font-mono text-gray-400">v{v.version_number}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setTitle(v.title || '')
                        setCategory(v.category || '')
                        setText(v.instructions_markdown || '')
                      }}
                      className="text-xs text-[#D35400] hover:text-[#E67E22] font-bold transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

export default function RecipeArchive({ initialRecipes, currentUserId, isAdmin }) {
  const [recipes, setRecipes]           = useState(initialRecipes)
  const [search, setSearch]             = useState('')
  const [sort, setSort]                 = useState('newest')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [page, setPage]                 = useState(1)
  const [catFilters, setCatFilters] = useState({ mealTypes: [], dietaryFlags: [], cookingStyles: [] })


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
      // Source filter
      if (sourceFilter === 'beverage') {
        if (r.recipe_type !== 'beverage') return false
      } else if (sourceFilter === 'Instagram Extract') {
        if (!['Instagram Extract', 'Instagram Extraction'].includes(r.source_type)) return false
      } else if (sourceFilter !== 'all' && r.source_type !== sourceFilter) return false
      // Category filters
      if (catFilters.mealTypes.length > 0 && !catFilters.mealTypes.some(m => (r.meal_types || []).includes(m))) return false
      if (catFilters.dietaryFlags.length > 0 && !catFilters.dietaryFlags.some(d => (r.dietary_flags || []).includes(d))) return false
      if (catFilters.cookingStyles.length > 0 && !catFilters.cookingStyles.some(c => (r.cooking_styles || []).includes(c))) return false
      // Search
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

      <CategoryFilter
        filters={catFilters}
        onChange={v => { setCatFilters(v); setPage(1) }}
        sourceFilter={sourceFilter}
        onSourceChange={v => { handleSource(v) }}
      />

      {/* Results count when filtered */}
      {(search || sourceFilter !== 'all' || catFilters.mealTypes.length > 0 || catFilters.dietaryFlags.length > 0 || catFilters.cookingStyles.length > 0) && (
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
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
