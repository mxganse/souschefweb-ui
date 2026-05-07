'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const TABS = [
  { id: 'url',   label: 'Web Link' },
  { id: 'pdf',   label: 'PDF Document' },
  { id: 'image', label: 'Photo/Scan' },
]

// ── Editable result + merge flow ──────────────────────────────────────────────

function ResultPanel({ result, onResultChange, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [merging, setMerging] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [error, setError] = useState(null)

  const hasMatches = result.existing_matches?.length > 0

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const body = {
        category: result.category,
        title: result.title,
        content_markdown: result.markdown,
        tags: result.tags || [],
      }
      if (mergeMode && selectedMatch) body.id = selectedMatch.id

      const res = await fetch('/api/admin/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMerge(match) {
    setMerging(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/reference-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existing_id: match.id, new_markdown: result.markdown }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Merge failed')
      setSelectedMatch(match)
      setMergeMode(true)
      onResultChange({
        ...result,
        title: match.title,
        category: match.category,
        markdown: data.merged_markdown,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setMerging(false)
    }
  }

  function handleCreateNew() {
    setSelectedMatch(null)
    setMergeMode(false)
  }

  const inputCls = 'w-full bg-black border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#D35400]'

  return (
    <div className="mt-4 space-y-4">
      {/* Duplicate warning */}
      {hasMatches && !mergeMode && (
        <div className="p-4 bg-yellow-950 border border-yellow-700 rounded space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 text-base flex-shrink-0">⚠</span>
            <div>
              <p className="text-sm font-semibold text-yellow-300">Possible existing entries found</p>
              <p className="text-xs text-yellow-500 mt-0.5">Supplement an existing entry to merge new data in, or create a new entry.</p>
            </div>
          </div>
          <div className="space-y-2">
            {result.existing_matches.map(match => (
              <div key={match.id} className="flex items-center justify-between gap-3 bg-yellow-900/30 border border-yellow-800 rounded px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-yellow-200 truncate">{match.title}</p>
                  <p className="text-xs text-yellow-600">{match.category}</p>
                </div>
                <button
                  onClick={() => handleMerge(match)}
                  disabled={merging}
                  className="flex-shrink-0 px-3 py-1 text-xs font-bold bg-yellow-700 hover:bg-yellow-600 text-white rounded transition-colors disabled:opacity-50"
                >
                  {merging ? 'Merging…' : 'Supplement →'}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleCreateNew}
            className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
          >
            Create new entry instead
          </button>
        </div>
      )}

      {/* Merge mode banner */}
      {mergeMode && selectedMatch && (
        <div className="flex items-center justify-between gap-3 p-3 bg-green-950 border border-green-700 rounded">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <p className="text-xs text-green-300">
              Merged into <span className="font-semibold">{selectedMatch.title}</span> — review below and save.
            </p>
          </div>
          <button onClick={handleCreateNew} className="text-xs text-gray-500 hover:text-gray-300 underline flex-shrink-0">
            Undo merge
          </button>
        </div>
      )}

      {/* Editable fields */}
      <div className="p-4 bg-[#161B22] border border-gray-700 rounded space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Category</label>
            <input
              value={result.category}
              onChange={e => onResultChange({ ...result, category: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Title</label>
            <input
              value={result.title}
              onChange={e => onResultChange({ ...result, title: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
            Content (Markdown)
            {result.confidence != null && (
              <span className="ml-2 normal-case font-normal text-gray-600">
                · AI confidence: {Math.round(result.confidence * 100)}%
              </span>
            )}
          </label>
          <textarea
            value={result.markdown}
            onChange={e => onResultChange({ ...result, markdown: e.target.value })}
            rows={14}
            className={`${inputCls} font-mono text-xs leading-relaxed resize-y`}
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-[#D35400] hover:bg-[#E67E22] text-white font-bold rounded transition-colors disabled:opacity-50 text-sm"
        >
          {saving
            ? 'Saving…'
            : mergeMode
              ? `Update "${selectedMatch?.title}" in Reference Library →`
              : 'Approve and Save to Reference Library →'}
        </button>
      </div>
    </div>
  )
}

// ── URL tab ───────────────────────────────────────────────────────────────────

function UrlTab({ onSaved }) {
  const [url, setUrl]       = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError]   = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('processing'); setError(null); setResult(null)
    try {
      const res = await fetch('/api/import-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setStatus('done'); setUrl('')
    } catch (err) {
      setError(err.message); setStatus('idle')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400">Paste a URL to a culinary article, food science paper, or technique guide.</p>
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setResult(null); setError(null) }}
          placeholder="https://example.com/culinary-reference…"
          autoCapitalize="none"
          autoCorrect="off"
          className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'processing' || !url.trim()}
          className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm"
        >
          {status === 'processing' ? 'Processing…' : 'IMPORT REFERENCE'}
        </button>
      </form>

      {status === 'processing' && (
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <span className="animate-spin text-[#D35400] text-xl">⏳</span>
          Extracting and structuring reference data with GPT-4o…
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300 whitespace-pre-wrap">{error}</div>}
      {result && (
        <ResultPanel
          result={result}
          onResultChange={setResult}
          onSaved={() => { setResult(null); setStatus('idle'); onSaved() }}
        />
      )}
    </div>
  )
}

// ── File tab ──────────────────────────────────────────────────────────────────

function FileTab({ type, accept, hint, onSaved }) {
  const [file, setFile]     = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError]   = useState(null)
  const [result, setResult] = useState(null)
  const inputRef            = useRef()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setStatus('processing'); setError(null); setResult(null)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('temp-imports').upload(fileName, file)
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('temp-imports').getPublicUrl(fileName)
      const res = await fetch('/api/import-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlData.publicUrl, fileName, isStorageFile: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setStatus('done'); setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message); setStatus('idle')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400">{hint}</p>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg py-10 px-4 cursor-pointer hover:border-[#D35400] transition-colors bg-[#161B22]">
          <span className="text-3xl mb-2">{type === 'pdf' ? '📄' : '📷'}</span>
          <span className="text-sm text-gray-400">{file ? file.name : 'Tap to choose file'}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(null) }}
          />
        </label>
        <button
          type="submit"
          disabled={status === 'processing' || !file}
          className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm"
        >
          {status === 'processing' ? 'Processing…' : 'IMPORT REFERENCE'}
        </button>
      </form>

      {status === 'processing' && (
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <span className="animate-spin text-[#D35400] text-xl">⏳</span>
          Extracting and structuring reference data with GPT-4o…
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300 whitespace-pre-wrap">{error}</div>}
      {result && (
        <ResultPanel
          result={result}
          onResultChange={setResult}
          onSaved={() => { setResult(null); setStatus('idle'); onSaved() }}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReferenceImportClient() {
  const [tab, setTab]         = useState('url')
  const [savedBanner, setSavedBanner] = useState(false)
  const savedTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(savedTimerRef.current), [])

  function handleSaved() {
    setSavedBanner(true)
    clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSavedBanner(false), 4000)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Admin</a>
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mt-2 mb-1">IMPORT REFERENCE</h1>
        <p className="text-gray-400 text-sm">Upload PDFs or photos of techniques, food science articles, or SOPs.</p>
      </div>

      {savedBanner && (
        <div className="mb-4 p-3 bg-green-950 border border-green-700 rounded text-sm text-green-300 flex items-center gap-2">
          <span>✓</span> Saved to reference library successfully.
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-[#161B22] rounded p-1 border border-gray-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
              tab === t.id ? 'bg-[#D35400] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'url' && <UrlTab onSaved={handleSaved} />}
      {tab === 'pdf' && (
        <FileTab
          type="pdf"
          accept=".pdf,application/pdf"
          hint="Upload articles, SOP documents, or reference PDFs."
          onSaved={handleSaved}
        />
      )}
      {tab === 'image' && (
        <FileTab
          type="image"
          accept="image/*"
          hint="Upload photos of equipment manuals, technique diagrams, or food science notes."
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
