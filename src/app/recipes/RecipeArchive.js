'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const SOURCE_BADGE = {
  'Instagram Extract': 'bg-orange-950 text-orange-400 border-orange-800',
  'Web Import':        'bg-blue-950  text-blue-400  border-blue-800',
  'PDF Import':        'bg-slate-800 text-slate-300 border-slate-600',
  'Image Import':      'bg-green-950 text-green-400 border-green-800',
  'Text Import':       'bg-slate-800 text-slate-300 border-slate-600',
}

function SourceBadge({ type }) {
  if (!type) return null
  const cls = SOURCE_BADGE[type] || 'bg-slate-800 text-slate-300 border-slate-600'
  return (
    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls}`}>
      {type}
    </span>
  )
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
        <span className="text-[#D35400] mt-0.5 flex-shrink-0">▶</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug">{recipe.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-gray-500">{formatDate(recipe.created_at)}</span>
            {recipe.category && recipe.category !== 'Unknown' && (
              <span className="text-xs text-gray-500">@{recipe.category}</span>
            )}
            <SourceBadge type={recipe.source_type} />
          </div>
        </div>
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

export default function RecipeArchive({ initialRecipes }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  const filtered = initialRecipes
    .filter(r => {
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
      if (sort === 'title') return (a.title || '').localeCompare(b.title || '')
      if (sort === 'creator') return (a.category || '').localeCompare(b.category || '')
      return 0
    })

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">RECIPE ARCHIVE</h1>
      <p className="text-gray-400 text-sm mb-5">{initialRecipes.length} recipes saved</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes, creators, ingredients..."
          className="flex-1 bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-[#161B22] border border-gray-700 rounded px-3 py-3 text-base focus:outline-none focus:border-[#D35400] sm:w-40"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="creator">Creator / Source A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">
          {search ? 'No recipes match your search.' : 'No recipes yet. Add your first one!'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}
