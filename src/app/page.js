'use client'
import { useState, useRef } from 'react'

const TABS = [
  { id: 'reel',  label: 'Instagram' },
  { id: 'url',   label: 'Website'   },
  { id: 'pdf',   label: 'PDF'       },
  { id: 'image', label: 'Photo'     },
  { id: 'text',  label: 'Text'      },
]

const REEL_STATUS = {
  downloading: 'Downloading reel…',
  extracting:  'Extracting frames & audio…',
  transcribing:'Transcribing audio…',
  analyzing:   'Analyzing with GPT-4o…',
  saving:      'Saving to database…',
}

function ImportStatusBox({ error, duplicate, processing, result }) {
  if (duplicate) return (
    <div className="mt-4 p-4 bg-yellow-950 border border-yellow-700 rounded text-sm text-yellow-300 space-y-1">
      <p>⚠️ {duplicate.error}</p>
      <a href="/recipes" className="inline-block text-[#D35400] hover:text-[#E67E22] underline">View in Archive →</a>
    </div>
  )
  if (error) return (
    <div className="mt-4 p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300 whitespace-pre-wrap">{error}</div>
  )
  if (processing) return (
    <div className="mt-4 flex items-center gap-3 text-gray-400 text-sm">
      <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
      Extracting recipe with GPT-4o…
    </div>
  )
  if (result) return (
    <div className="mt-4 p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
      <p className="text-[#D35400] font-bold text-lg">{result.title}</p>
      <p className="text-xs text-gray-500">{result.ingredients?.length ?? 0} ingredients · saved to archive</p>
      <a href="/recipes" className="inline-block mt-1 text-sm text-[#D35400] hover:text-[#E67E22] underline">
        View in Archive →
      </a>
    </div>
  )
  return null
}

// ── Instagram Reel ────────────────────────────────────────────────────────────
function ReelTab() {
  const [url, setUrl] = useState('')
  const [manualIngredients, setManualIngredients] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const busy = !['idle', 'done', 'error'].includes(status)

  async function handleSubmit(e) {
    e.preventDefault()
    setResult(null); setError(null); setStatus('downloading')
    try {
      const res = await fetch('/api/process-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualIngredients }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setError(data.error || 'Something went wrong'); return }
      setStatus('done'); setResult(data)
    } catch (err) { setStatus('error'); setError(err.message) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste an Instagram reel URL — SousChef will download, transcribe, and extract the recipe.</p>
      <input
        type="url" value={url} onChange={e => setUrl(e.target.value)}
        placeholder="https://www.instagram.com/reel/…"
        required autoCapitalize="none" autoCorrect="off"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors"
      />
      <textarea
        value={manualIngredients} onChange={e => setManualIngredients(e.target.value)}
        placeholder="Optional: paste any ingredients visible in the video that might be missed…"
        rows={3}
        className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors resize-none"
      />
      <button type="submit" disabled={busy || !url.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {busy ? (REEL_STATUS[status] || 'Processing…') : 'EXTRACT RECIPE'}
      </button>
      {busy && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          {REEL_STATUS[status]}
        </div>
      )}
      {status === 'error' && (
        <div className="p-4 bg-red-950 border border-red-800 rounded text-red-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      {result && (
        <div className="p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
          <p className="text-[#D35400] font-bold text-lg">{result.title}</p>
          <p className="text-xs text-gray-500">Saved to archive</p>
          <a href="/recipes" className="inline-block mt-1 text-sm text-[#D35400] hover:text-[#E67E22] underline">
            View in Archive →
          </a>
          <button type="button"
            onClick={() => { setStatus('idle'); setUrl(''); setManualIngredients(''); setResult(null) }}
            className="block text-sm text-gray-400 hover:text-white underline pt-1">
            Extract another
          </button>
        </div>
      )}
    </form>
  )
}

// ── Website URL ───────────────────────────────────────────────────────────────
function UrlTab() {
  const [url, setUrl] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [duplicate, setDuplicate] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return
    setProcessing(true); setError(null); setDuplicate(null); setResult(null)
    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'url', url: url.trim() }),
      })
      const data = await res.json()
      if (res.status === 409) { setDuplicate(data); return }
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setUrl('')
    } catch (err) { setError(err.message) }
    finally { setProcessing(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste any recipe page URL — SousChef will scrape and extract the recipe with GPT-4o.</p>
      <input type="url" value={url} onChange={e => setUrl(e.target.value)}
        placeholder="https://www.seriouseats.com/recipe/…"
        autoCapitalize="none" autoCorrect="off"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors" />
      <button type="submit" disabled={processing || !url.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {processing ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <ImportStatusBox error={error} duplicate={duplicate} processing={processing} result={result} />
    </form>
  )
}

// ── File upload (PDF + Photo) ─────────────────────────────────────────────────
function FileTab({ type, accept, hint }) {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [duplicate, setDuplicate] = useState(null)
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setProcessing(true); setError(null); setDuplicate(null); setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      const res = await fetch('/api/import-recipe', { method: 'POST', body: form })
      const data = await res.json()
      if (res.status === 409) { setDuplicate(data); return }
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) { setError(err.message) }
    finally { setProcessing(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">{hint}</p>
      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg py-10 px-4 cursor-pointer hover:border-[#D35400] transition-colors bg-[#161B22]">
        <span className="text-3xl mb-2">{type === 'pdf' ? '📄' : '📷'}</span>
        <span className="text-sm text-gray-400">{file ? file.name : 'Tap to choose file'}</span>
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={e => { setFile(e.target.files[0] || null); setResult(null); setError(null) }} />
      </label>
      <button type="submit" disabled={processing || !file}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {processing ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <ImportStatusBox error={error} duplicate={duplicate} processing={processing} result={result} />
    </form>
  )
}

// ── Paste Text ────────────────────────────────────────────────────────────────
function TextTab() {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [duplicate, setDuplicate] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setProcessing(true); setError(null); setDuplicate(null); setResult(null)
    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', text: text.trim() }),
      })
      const data = await res.json()
      if (res.status === 409) { setDuplicate(data); return }
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data); setText('')
    } catch (err) { setError(err.message) }
    finally { setProcessing(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste raw recipe text — from an email, a document, anywhere. GPT-4o will structure it.</p>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
        placeholder="Paste recipe text here…"
        className="w-full bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-base font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none" />
      <button type="submit" disabled={processing || !text.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {processing ? 'Importing…' : 'IMPORT RECIPE'}
      </button>
      <ImportStatusBox error={error} duplicate={duplicate} processing={processing} result={result} />
    </form>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AddRecipePage() {
  const [tab, setTab] = useState('reel')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">ADD RECIPE</h1>
      <p className="text-gray-400 text-sm mb-6">Extract from Instagram, scrape a website, upload a PDF or photo, or paste text.</p>

      <div className="flex gap-1 mb-6 bg-[#161B22] rounded p-1 border border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
              tab === t.id ? 'bg-[#D35400] text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reel'  && <ReelTab />}
      {tab === 'url'   && <UrlTab />}
      {tab === 'pdf'   && (
        <FileTab type="pdf" accept=".pdf,application/pdf"
          hint="Upload a PDF recipe card, cookbook page scan, or any PDF containing a recipe." />
      )}
      {tab === 'image' && (
        <FileTab type="image" accept="image/*"
          hint="Take a photo of a handwritten recipe card, a cookbook page, or a printed recipe. GPT-4o Vision will read it." />
      )}
      {tab === 'text'  && <TextTab />}
    </div>
  )
}
