'use client'
import { useState, useRef } from 'react'

const TABS = [
  { id: 'url',   label: 'Website URL' },
  { id: 'pdf',   label: 'PDF' },
  { id: 'image', label: 'Handwritten / Photo' },
  { id: 'text',  label: 'Paste Text' },
]

function StatusBox({ status, error, result }) {
  if (error) return (
    <div className="mt-4 p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300 whitespace-pre-wrap">{error}</div>
  )
  if (status === 'processing') return (
    <div className="mt-4 flex items-center gap-3 text-gray-400 text-sm">
      <span className="animate-spin text-[#D35400] text-xl">⏳</span>
      Extracting recipe with GPT-4o…
    </div>
  )
  if (result) return (
    <div className="mt-4 p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
      <p className="text-[#D35400] font-bold text-lg">{result.title}</p>
      <p className="text-xs text-gray-500">{result.ingredients?.length} ingredients imported · saved to archive</p>
      <a href="/recipes" className="inline-block mt-1 text-sm text-[#D35400] hover:text-[#E67E22] underline">
        View in Archive →
      </a>
    </div>
  )
  return null
}

// ── URL tab ─────────────────────────────────────────────────────────────────
function UrlTab() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('processing'); setError(null); setResult(null)
    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setStatus('done')
    } catch (err) {
      setError(err.message); setStatus('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste any recipe page URL — SousChef will scrape the page and extract the recipe with GPT-4o.</p>
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="https://example.com/recipe/…"
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'processing' || !url.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm"
      >
        {status === 'processing' ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <StatusBox status={status} error={error} result={result} />
    </form>
  )
}

// ── File upload tab (shared by PDF + Image) ──────────────────────────────────
function FileTab({ type, accept, hint }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setStatus('processing'); setError(null); setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      const res = await fetch('/api/import-recipe', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setStatus('done'); setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message); setStatus('idle')
    }
  }

  return (
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
        {status === 'processing' ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <StatusBox status={status} error={error} result={result} />
    </form>
  )
}

// ── Paste text tab ───────────────────────────────────────────────────────────
function TextTab() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('processing'); setError(null); setResult(null)
    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setStatus('done'); setText('')
    } catch (err) {
      setError(err.message); setStatus('idle')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste raw recipe text — from an email, a document, anywhere. GPT-4o will structure it.</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={10}
        placeholder="Paste recipe text here…"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-base font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none"
      />
      <button
        type="submit"
        disabled={status === 'processing' || !text.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm"
      >
        {status === 'processing' ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <StatusBox status={status} error={error} result={result} />
    </form>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ImportPage() {
  const [tab, setTab] = useState('url')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">IMPORT RECIPE</h1>
      <p className="text-gray-400 text-sm mb-6">Add recipes from any source — website, PDF, photo, or pasted text.</p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#161B22] rounded p-1 border border-gray-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
              tab === t.id
                ? 'bg-[#D35400] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'url'   && <UrlTab />}
      {tab === 'pdf'   && (
        <FileTab
          type="pdf"
          accept=".pdf,application/pdf"
          hint="Upload a PDF recipe card, cookbook page scan, or any PDF containing a recipe."
        />
      )}
      {tab === 'image' && (
        <FileTab
          type="image"
          accept="image/*"
          hint="Take a photo of a handwritten recipe card, a cookbook page, or a printed recipe. GPT-4o Vision will read it."
        />
      )}
      {tab === 'text'  && <TextTab />}
    </div>
  )
}
