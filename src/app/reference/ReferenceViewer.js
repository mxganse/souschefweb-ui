'use client'
import { useState, useRef } from 'react'

const CATEGORY_ORDER = [
  // ── Foundation ──────────────────────────────────────────────────────────
  'BOH Basics',

  // ── Core Ingredients & Fundamentals ─────────────────────────────────────
  'Proteins - Meat',
  'Proteins - Poultry',
  'Proteins - Fish',
  'Proteins - Eggs',
  'Vegetables',
  'Starches',
  'Sugars',
  'Fats',

  // ── Technique & Craft ───────────────────────────────────────────────────
  'Thickening',
  'Recipe Scaling',
  'Portioning',
  'Delta-T Cooking',
  'Sous-Vide',
  'Combi-Oven',
  'Precision Cooking',

  // ── Modernist & Advanced ────────────────────────────────────────────────
  'Foams',
  'Gels',
  'Spherification',
  'Emulsions',
  'Hydrocolloids',
]

const REFERENCE_BADGE_STYLES = {
  'Scientific Standard': { badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200', icon: '🧪' },
  'BOH Manual': { badge: 'bg-green-100 text-green-800 border border-green-200', icon: '📖' },
  'Field Note': { badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: '📝' },
}

function inferReferenceType(category) {
  if (category === 'BOH Basics') return 'BOH Manual'
  if (/^Proteins|Vegetables|Starches|Sugars|Fats/.test(category)) return 'Scientific Standard'
  return 'Field Note'
}

function sortCategories(groups) {
  const known = CATEGORY_ORDER.filter(c => groups[c])
  const extra = Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)).sort()
  return [...known, ...extra]
}

function ReferenceBadge({ referenceType }) {
  const styles = REFERENCE_BADGE_STYLES[referenceType] || REFERENCE_BADGE_STYLES['Field Note']
  return (
    <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded z-10 ${styles.badge}`}>
      {styles.icon} {referenceType}
    </span>
  )
}

// ── Markdown parser ───────────────────────────────────────────────────────────

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic text-gray-300">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-[#0E1117] text-[#D35400] px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    return part
  })
}

function parseTableLines(lines) {
  const rows = lines
    .filter(l => !/^\|[\s|:-]+\|/.test(l.trim()))
    .map(l =>
      l.split('|')
        .filter((_, i, a) => i > 0 && i < a.length - 1)
        .map(c => c.trim())
    )
    .filter(r => r.length > 0)
  return { headers: rows[0] ?? [], data: rows.slice(1) }
}

function parseSegments(markdown) {
  const lines = markdown.split('\n')
  const segments = []
  let textLines = []
  let tableLines = []
  let inTable = false

  const flushText = () => {
    const content = textLines.join('\n').trim()
    if (content) segments.push({ type: 'text', content })
    textLines = []
  }
  const flushTable = () => {
    if (tableLines.length > 0) segments.push({ type: 'table', ...parseTableLines(tableLines) })
    tableLines = []
  }

  for (const line of lines) {
    if (/^\s*\|/.test(line)) {
      if (!inTable) { flushText(); inTable = true }
      tableLines.push(line)
    } else {
      if (inTable) { flushTable(); inTable = false }
      textLines.push(line)
    }
  }
  if (inTable) flushTable()
  else flushText()

  return segments
}

function MarkdownBlock({ content }) {
  const lines = content.split('\n')
  const elements = []
  let listItems = []
  let key = 0

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={key++} className="space-y-1 my-3 pl-4 border-l-2 border-gray-700">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={key++} className="text-sm font-bold text-[#D35400] uppercase tracking-wide mt-5 mb-2">{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      flushList()
      // skip — title already shown in the card summary
    } else if (line.startsWith('- ')) {
      listItems.push(<li key={key++} className="text-sm text-gray-300 leading-relaxed">{renderInline(line.slice(2))}</li>)
    } else if (line.trim() === '---') {
      flushList()
      elements.push(<hr key={key++} className="border-gray-700 my-4" />)
    } else if (line.trim()) {
      flushList()
      elements.push(<p key={key++} className="text-sm text-gray-300 leading-relaxed my-2">{renderInline(line)}</p>)
    }
  }
  flushList()
  return <>{elements}</>
}

// ── Table → card grid ─────────────────────────────────────────────────────────

function TableCards({ headers, data }) {
  if (!headers.length || !data.length) return null
  const [titleCol, ...metaCols] = headers

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {data.map((row, i) => {
        const title = row[0]
        const meta = metaCols.map((h, j) => ({ label: h, value: row[j + 1] ?? '—' }))
        const hasValue = meta.some(m => m.value && m.value !== '—')
        return (
          <div key={i} className="bg-[#0E1117] border border-gray-800 rounded-lg px-4 py-3 flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-gray-100 leading-snug">{title || '—'}</span>
            {hasValue && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {meta.map(({ label, value }) => (
                  value && value !== '—' ? (
                    <span key={label} className="text-xs text-gray-400">
                      <span className="text-gray-600 uppercase tracking-wide text-[10px] mr-1">{label}</span>
                      <span className="text-gray-300 font-medium">{value}</span>
                    </span>
                  ) : null
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Content renderer ──────────────────────────────────────────────────────────

function RenderedContent({ markdown }) {
  const segments = parseSegments(markdown)
  return (
    <div className="space-y-1">
      {segments.map((seg, i) =>
        seg.type === 'table'
          ? <TableCards key={i} headers={seg.headers} data={seg.data} />
          : <MarkdownBlock key={i} content={seg.content} />
      )}
    </div>
  )
}

// ── Add / Edit form ───────────────────────────────────────────────────────────

function StandardForm({ initial, onSave, onCancel }) {
  const [category, setCategory]   = useState(initial?.category ?? '')
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [content, setContent]     = useState(initial?.content_markdown ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? 0)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const body = { category, title, content_markdown: content, sort_order: Number(sortOrder) }
    if (initial?.id) body.id = initial.id
    const res = await fetch('/api/admin/reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
      return
    }
    const { standard } = await res.json()
    onSave(standard)
  }

  const inputCls = 'w-full bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-[#161B22] border border-[#D35400] rounded">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category</label>
          <input value={category} onChange={e => setCategory(e.target.value)} required className={inputCls} placeholder="e.g. Thickening" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} placeholder="e.g. Thickening Chart" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Content (Markdown)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={10}
          className={`${inputCls} font-mono leading-relaxed resize-y`}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-28">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Sort Order</label>
          <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={inputCls} />
        </div>
        <div className="flex gap-2 mt-4 ml-auto">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold bg-[#D35400] hover:bg-[#E67E22] text-white rounded transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  )
}

// ── Individual standard card ──────────────────────────────────────────────────

function StandardCard({ standard, isAdmin, onUpdate, onDelete }) {
  const detailsRef              = useRef()
  const [editing, setEditing]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${standard.title}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch('/api/admin/reference', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: standard.id }),
    })
    if (res.ok) onDelete(standard.id)
    else setDeleting(false)
  }

  const referenceType = inferReferenceType(standard.category)

  return (
    <details id={`ref-${standard.id}`} ref={detailsRef} className="bg-[#161B22] border border-gray-800 rounded-lg group relative">
      <ReferenceBadge referenceType={referenceType} />
      <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none hover:bg-[#1c2230] active:bg-[#1c2230] transition-colors rounded-lg">
        <span className="flex-1 text-sm font-bold text-gray-200">{standard.title}</span>
        <span className="text-gray-600 text-xs flex-shrink-0 group-open:rotate-90 transition-transform duration-150">▶</span>
      </summary>

      <div className="px-4 pb-4 pt-3 border-t border-gray-800">
        {isAdmin && !editing && (
          <div className="flex justify-end gap-4 mb-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-[#D35400] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        )}
        {editing ? (
          <StandardForm
            initial={standard}
            onSave={updated => { onUpdate(updated); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <RenderedContent markdown={standard.content_markdown} />
        )}
      </div>
    </details>
  )
}

// ── Main viewer ───────────────────────────────────────────────────────────────

export default function ReferenceViewer({ initialData, isAdmin }) {
  const [standards, setStandards] = useState(initialData)
  const [search, setSearch]       = useState('')
  function handleUpdate(updated) {
    setStandards(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  function handleDelete(id) {
    setStandards(prev => prev.filter(s => s.id !== id))
  }

  const filtered = standards.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.title?.toLowerCase().includes(q) ||
      s.content_markdown?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    )
  })

  const groups = {}
  for (const s of filtered) {
    if (!groups[s.category]) groups[s.category] = []
    groups[s.category].push(s)
  }
  const categoryKeys = sortCategories(groups)

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight">KITCHEN REFERENCE</h1>
          <p className="text-gray-500 text-sm mt-0.5">Standards for sanitation, cooking technique, and gastronomy.</p>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search reference material…"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-2.5 text-base focus:outline-none focus:border-[#D35400] transition-colors"
      />

      {categoryKeys.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-12">
          {search ? 'No entries match your search.' : 'No reference entries yet.'}
        </p>
      ) : (
        <div className="space-y-10">
          {categoryKeys.map(cat => (
            <section key={cat}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-gray-800">
                {cat}
              </h2>
              <div className="space-y-2">
                {groups[cat].map(s => (
                  <StandardCard
                    key={s.id}
                    standard={s}
                    isAdmin={isAdmin}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
