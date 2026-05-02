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
  downloading:  'Downloading reel…',
  extracting:   'Extracting frames & audio…',
  transcribing: 'Transcribing audio…',
  analyzing:    'Analyzing with GPT-4o…',
}

// ── Shared: save a draft to the DB ────────────────────────────────────────────
async function saveDraft(draft) {
  const res = await fetch('/api/save-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  const data = await res.json()
  if (res.status === 409) return { duplicate: data }
  if (!res.ok) throw new Error(data.error || 'Save failed')
  return { result: data }
}

// ── Preview / edit panel (shown after extraction) ─────────────────────────────
function PreviewEditor({ draft, onSave, onDiscard }) {
  const [markdown, setMarkdown] = useState(draft.markdown)
  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState(null)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true); setDuplicate(null); setError(null)
    try {
      const { duplicate: dup, result } = await saveDraft({ ...draft, markdown })
      if (dup) { setDuplicate(dup); setSaving(false); return }
      onSave(result)
    } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Review &amp; Edit</p>
        <button onClick={onDiscard} className="text-xs text-gray-500 hover:text-white underline">
          ✕ Discard
        </button>
      </div>

      <textarea
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        rows={20}
        className="w-full bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-y"
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm"
      >
        {saving ? 'Saving…' : 'SAVE TO ARCHIVE'}
      </button>

      {duplicate && (
        <div className="p-4 bg-yellow-950 border border-yellow-700 rounded text-sm text-yellow-300 space-y-1">
          <p>⚠️ {duplicate.error}</p>
          <a href="/recipes" className="inline-block text-[#D35400] hover:text-[#E67E22] underline">
            View in Archive →
          </a>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300">{error}</div>
      )}
    </div>
  )
}

function SavedBox({ result, onReset, resetLabel }) {
  return (
    <div className="p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
      <p className="text-[#D35400] font-bold text-lg">{result.title}</p>
      <p className="text-xs text-gray-500">{result.ingredientCount ?? 0} ingredients · saved to archive</p>
      <a href="/recipes" className="inline-block mt-1 text-sm text-[#D35400] hover:text-[#E67E22] underline">
        View in Archive →
      </a>
      <button onClick={onReset} className="block text-sm text-gray-400 hover:text-white underline pt-1">
        {resetLabel}
      </button>
    </div>
  )
}

// ── Instagram Reel ────────────────────────────────────────────────────────────
function ReelTab() {
  const [url, setUrl] = useState('')
  const [manualIngredients, setManualIngredients] = useState('')
  const [phase, setPhase] = useState('form') // form | extracting | preview | done
  const [reeStatus, setReelStatus] = useState('downloading')
  const [draft, setDraft] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setPhase('extracting'); setReelStatus('downloading')
    try {
      const res = await fetch('/api/process-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualIngredients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDraft(data)
      setPhase('preview')
    } catch (err) { setError(err.message); setPhase('form') }
  }

  function reset() { setPhase('form'); setUrl(''); setManualIngredients(''); setDraft(null); setResult(null); setError(null) }

  if (phase === 'done') return <SavedBox result={result} onReset={reset} resetLabel="Extract another" />

  if (phase === 'preview') return (
    <PreviewEditor draft={draft} onDiscard={reset} onSave={r => { setResult(r); setPhase('done') }} />
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Paste an Instagram reel URL — SousChef will download, transcribe, and extract the recipe for you to review.</p>
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
      <button type="submit" disabled={phase === 'extracting' || !url.trim()}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {phase === 'extracting' ? (REEL_STATUS[reeStatus] || 'Processing…') : 'EXTRACT RECIPE'}
      </button>
      {phase === 'extracting' && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          {REEL_STATUS[reeStatus]}
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-800 rounded text-red-300 text-sm"><strong>Error:</strong> {error}</div>}
    </form>
  )
}

// ── Shared import tab (URL / PDF / Photo / Text) ──────────────────────────────
function ImportTab({ extractFn, hint, formContent }) {
  const [phase, setPhase] = useState('form') // form | extracting | preview | done
  const [draft, setDraft] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleExtract(e) {
    e.preventDefault()
    setError(null); setPhase('extracting')
    try {
      const data = await extractFn()
      setDraft(data); setPhase('preview')
    } catch (err) { setError(err.message); setPhase('form') }
  }

  function reset() { setPhase('form'); setDraft(null); setResult(null); setError(null) }

  if (phase === 'done') return <SavedBox result={result} onReset={reset} resetLabel="Import another" />

  if (phase === 'preview') return (
    <PreviewEditor draft={draft} onDiscard={reset} onSave={r => { setResult(r); setPhase('done') }} />
  )

  return (
    <form onSubmit={handleExtract} className="space-y-4">
      <p className="text-sm text-gray-400">{hint}</p>
      {formContent({ disabled: phase === 'extracting' })}
      {phase === 'extracting' && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          Extracting recipe with GPT-4o…
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300">{error}</div>}
    </form>
  )
}

// ── Website URL ───────────────────────────────────────────────────────────────
function UrlTab() {
  const [url, setUrl] = useState('')

  return (
    <ImportTab
      hint="Paste any recipe page URL — SousChef will scrape and extract the recipe for you to review."
      extractFn={async () => {
        const res = await fetch('/api/import-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'url', url: url.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Import failed')
        return data
      }}
      formContent={({ disabled }) => (
        <>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://www.seriouseats.com/recipe/…"
            autoCapitalize="none" autoCorrect="off"
            className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-base focus:outline-none focus:border-[#D35400] transition-colors" />
          <button type="submit" disabled={disabled || !url.trim()}
            className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
            {disabled ? 'Importing…' : 'IMPORT RECIPE'}
          </button>
        </>
      )}
    />
  )
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function PdfTab() {
  const [file, setFile] = useState(null)
  const inputRef = useRef()

  return (
    <ImportTab
      hint="Upload a PDF recipe card, cookbook page scan, or any PDF containing a recipe."
      extractFn={async () => {
        const form = new FormData()
        form.append('file', file)
        form.append('type', 'pdf')
        const res = await fetch('/api/import-recipe', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Import failed')
        setFile(null)
        if (inputRef.current) inputRef.current.value = ''
        return data
      }}
      formContent={({ disabled }) => (
        <>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg py-10 px-4 cursor-pointer hover:border-[#D35400] transition-colors bg-[#161B22]">
            <span className="text-3xl mb-2">📄</span>
            <span className="text-sm text-gray-400">{file ? file.name : 'Tap to choose file'}</span>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={e => setFile(e.target.files[0] || null)} />
          </label>
          <button type="submit" disabled={disabled || !file}
            className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
            {disabled ? 'Importing…' : 'IMPORT RECIPE'}
          </button>
        </>
      )}
    />
  )
}

// ── Photo / Handwritten ───────────────────────────────────────────────────────
function PhotoTab() {
  const [file, setFile] = useState(null)
  const inputRef = useRef()

  return (
    <ImportTab
      hint="Take a photo of a handwritten recipe card, a cookbook page, or a printed recipe. GPT-4o Vision will read it."
      extractFn={async () => {
        const form = new FormData()
        form.append('file', file)
        form.append('type', 'image')
        const res = await fetch('/api/import-recipe', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Import failed')
        setFile(null)
        if (inputRef.current) inputRef.current.value = ''
        return data
      }}
      formContent={({ disabled }) => (
        <>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg py-10 px-4 cursor-pointer hover:border-[#D35400] transition-colors bg-[#161B22]">
            <span className="text-3xl mb-2">📷</span>
            <span className="text-sm text-gray-400">{file ? file.name : 'Tap to choose file'}</span>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => setFile(e.target.files[0] || null)} />
          </label>
          <button type="submit" disabled={disabled || !file}
            className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
            {disabled ? 'Importing…' : 'IMPORT RECIPE'}
          </button>
        </>
      )}
    />
  )
}

// ── Paste Text ────────────────────────────────────────────────────────────────
function TextTab() {
  const [text, setText] = useState('')

  return (
    <ImportTab
      hint="Paste raw recipe text — from an email, a document, anywhere. GPT-4o will structure it."
      extractFn={async () => {
        const res = await fetch('/api/import-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'text', text: text.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Import failed')
        setText('')
        return data
      }}
      formContent={({ disabled }) => (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
            placeholder="Paste recipe text here…"
            className="w-full bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-base font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-none" />
          <button type="submit" disabled={disabled || !text.trim()}
            className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
            {disabled ? 'Importing…' : 'IMPORT RECIPE'}
          </button>
        </>
      )}
    />
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
      {tab === 'pdf'   && <PdfTab />}
      {tab === 'image' && <PhotoTab />}
      {tab === 'text'  && <TextTab />}
    </div>
  )
}
