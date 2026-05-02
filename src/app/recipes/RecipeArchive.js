'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
    // Opens the PDF export API route in a new tab
    const params = new URLSearchParams({ id: recipe.id })
    window.open(`/api/export-pdf?${params}`, '_blank')
  }

  return (
    <details className="bg-[#161B22] border border-gray-800 rounded group">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none hover:bg-[#1c2230] transition-colors">
        <span className="text-[#D35400] mt-0.5">▶</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{recipe.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(recipe.created_at)}
            {recipe.category ? ` · @${recipe.category}` : ''}
          </p>
        </div>
      </summary>

      <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-[#D35400] hover:text-[#E67E22] underline"
          >
            View original source →
          </a>
        )}

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={12}
          className="w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={saveEdits}
            disabled={saving}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded transition-colors"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'SAVE EDITS'}
          </button>
          <button
            onClick={downloadPdf}
            className="flex-1 bg-[#D35400] hover:bg-[#E67E22] text-white text-sm font-bold py-2 rounded transition-colors"
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
      <h1 className="text-3xl font-black text-[#D35400] tracking-tight mb-2">RECIPE ARCHIVE</h1>
      <p className="text-gray-400 text-sm mb-6">{initialRecipes.length} recipes saved</p>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes, creators, ingredients..."
          className="flex-1 bg-[#161B22] border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
          <option value="creator">Creator A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">
          {search ? 'No recipes match your search.' : 'No recipes yet. Go extract one!'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}
