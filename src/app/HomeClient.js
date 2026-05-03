'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const TABS = [
  { id: 'reel',  label: 'Instagram' },
  { id: 'url',   label: 'Website'   },
  { id: 'pdf',   label: 'PDF'       },
  { id: 'image', label: 'Photo'     },
  { id: 'bulk',  label: 'Bulk'      },
  { id: 'text',  label: 'Text'      },
]

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

function PreviewEditor({ draft, onSave, onDiscard }) {
  const [markdown, setMarkdown]   = useState(draft.markdown)
  const [saving, setSaving]       = useState(false)
  const [duplicate, setDuplicate] = useState(null)
  const [error, setError]         = useState(null)

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
        <button onClick={onDiscard} className="text-xs text-gray-500 hover:text-white underline">✕ Discard</button>
      </div>
      <textarea
        value={markdown} onChange={e => setMarkdown(e.target.value)} rows={20}
        className="w-full bg-[#161B22] border border-gray-700 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#D35400] resize-y"
      />
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] disabled:opacity-40 text-white font-bold py-3 rounded transition-colors text-sm">
        {saving ? 'Saving…' : 'SAVE TO ARCHIVE'}
      </button>
      {duplicate && (
        <div className="p-4 bg-yellow-950 border border-yellow-700 rounded text-sm text-yellow-300 space-y-1">
          <p>⚠️ {duplicate.error}</p>
          <a href="#archive" className="inline-block text-[#D35400] hover:text-[#E67E22] underline">View in Archive ↓</a>
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300">{error}</div>}
    </div>
  )
}

function SavedBox({ result, onReset, resetLabel }) {
  return (
    <div className="p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
      <p className="text-[#D35400] font-bold text-lg">{result.title}</p>
      <p className="text-xs text-gray-500">{result.ingredientCount ?? 0} ingredients · saved to archive</p>
      <a href="#archive" className="inline-block mt-1 text-sm text-[#D35400] hover:text-[#E67E22] underline">View in Archive ↓</a>
      <button onClick={onReset} className="block text-sm text-gray-400 hover:text-white underline pt-1">{resetLabel}</button>
    </div>
  )
}

// ── Instagram Reel ────────────────────────────────────────────────────────────
function ReelTab({ onSaved }) {
  const [url, setUrl]                           = useState('')
  const [manualIngredients, setManualIngredients] = useState('')
  const [phase, setPhase]                       = useState('form')
  const [draft, setDraft]                       = useState(null)
  const [result, setResult]                     = useState(null)
  const [error, setError]                       = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setPhase('extracting')
    try {
      const res = await fetch('/api/process-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualIngredients }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDraft(data); setPhase('preview')
    } catch (err) { setError(err.message); setPhase('form') }
  }

  function reset() {
    setPhase('form'); setUrl(''); setManualIngredients('')
    setDraft(null); setResult(null); setError(null)
  }

  if (phase === 'done') return <SavedBox result={result} onReset={reset} resetLabel="Extract another" />
  if (phase === 'preview') return (
    <PreviewEditor draft={draft} onDiscard={reset} onSave={r => { setResult(r); setPhase('done'); onSaved() }} />
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
        {phase === 'extracting' ? 'Processing…' : 'EXTRACT RECIPE'}
      </button>
      {phase === 'extracting' && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
          Processing…
        </div>
      )}
      {error && <div className="p-4 bg-red-950 border border-red-800 rounded text-red-300 text-sm"><strong>Error:</strong> {error}</div>}
    </form>
  )
}

// ── Shared import tab (URL / PDF / Photo / Text) ──────────────────────────────
function ImportTab({ extractFn, hint, formContent, onSaved }) {
  const [phase, setPhase]   = useState('form')
  const [draft, setDraft]   = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)

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
    <PreviewEditor draft={draft} onDiscard={reset} onSave={r => { setResult(r); setPhase('done'); onSaved() }} />
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
function UrlTab({ onSaved }) {
  const [url, setUrl] = useState('')

  return (
    <ImportTab
      hint="Paste any recipe page URL — SousChef will scrape and extract the recipe for you to review."
      onSaved={onSaved}
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

// ── File upload (PDF or Photo) ────────────────────────────────────────────────
function FileImportTab({ hint, accept, fileType, icon, onSaved }) {
  const [file, setFile] = useState(null)
  const inputRef = useRef()

  return (
    <ImportTab
      hint={hint}
      onSaved={onSaved}
      extractFn={async () => {
        const form = new FormData()
        form.append('file', file)
        form.append('type', fileType)
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
            <span className="text-3xl mb-2">{icon}</span>
            <span className="text-sm text-gray-400">{file ? file.name : 'Tap to choose file'}</span>
            <input ref={inputRef} type="file" accept={accept} className="hidden"
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

// ── Bulk Photos ───────────────────────────────────────────────────────────────
const ITEM_STATUS = {
  pending:    { icon: '·', cls: 'text-gray-500'              },
  extracting: { icon: '◌', cls: 'text-blue-400 animate-pulse'},
  saving:     { icon: '◌', cls: 'text-blue-400 animate-pulse'},
  done:       { icon: '✓', cls: 'text-green-400'             },
  duplicate:  { icon: '⚠', cls: 'text-yellow-400'            },
  error:      { icon: '✗', cls: 'text-red-400'               },
}

function BulkItemRow({ item, running, onRemove }) {
  const [imgUrl, setImgUrl] = useState(null)
  const s = ITEM_STATUS[item.status] || ITEM_STATUS.pending

  useEffect(() => {
    if (item.status !== 'error' || !item.file) return
    const url = URL.createObjectURL(item.file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [item.status, item.file])

  return (
    <div className="bg-[#161B22] border-b border-gray-800 last:border-b-0">
      <div className="flex items-start gap-2 px-3 py-2 text-sm">
        <span className={`flex-shrink-0 font-mono mt-0.5 w-4 text-center ${s.cls}`}>{s.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-gray-300">{item.title || item.name}</p>
          {item.status === 'duplicate' && item.note &&
            <p className="text-xs text-yellow-600 truncate mt-0.5">{item.note}</p>}
        </div>
        {item.status === 'pending' && !running && (
          <button onClick={() => onRemove(item.id)}
            className="flex-shrink-0 text-gray-600 hover:text-red-400 text-xs mt-0.5 px-1">✕</button>
        )}
      </div>
      {item.status === 'error' && (
        <div className="px-3 pb-3 flex gap-3 items-start">
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt={item.name}
              className="w-24 h-24 object-cover rounded border border-red-900 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs font-bold text-red-400 mb-1 truncate">{item.name}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.note || 'Unknown error'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function BulkPhotoTab({ onSaved }) {
  const [items, setItems]       = useState([])
  const [running, setRunning]   = useState(false)
  const [finished, setFinished] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  function addFiles(fileList) {
    const next = Array.from(fileList)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ id: Math.random().toString(36).slice(2), file: f, name: f.name, status: 'pending', title: null, note: null }))
    if (next.length) setItems(prev => [...prev, ...next])
  }

  function update(id, patch) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))
  }

  async function processAll() {
    setRunning(true); setFinished(false)
    for (const item of items.filter(it => it.status === 'pending')) {
      update(item.id, { status: 'extracting' })
      let draft
      try {
        const form = new FormData()
        form.append('file', item.file)
        form.append('type', 'image')
        const res = await fetch('/api/import-recipe', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Extraction failed')
        draft = data
        update(item.id, { title: draft.title || item.name })
      } catch (err) {
        update(item.id, { status: 'error', note: err.message }); continue
      }

      update(item.id, { status: 'saving' })
      try {
        const { duplicate: dup, result } = await saveDraft(draft)
        if (dup) {
          update(item.id, { status: 'duplicate', note: dup.error })
        } else {
          update(item.id, { status: 'done', title: result.title })
        }
      } catch (err) {
        update(item.id, { status: 'error', note: err.message })
      }
    }
    setRunning(false); setFinished(true)
    onSaved()
  }

  const counts       = items.reduce((a, it) => { a[it.status] = (a[it.status] || 0) + 1; return a }, {})
  const pendingCount = counts.pending || 0
  const activeIdx    = items.findIndex(i => i.status === 'extracting' || i.status === 'saving')

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Select multiple recipe photos at once — each image is extracted and saved automatically.
        Google Drive for Desktop users can select photos directly from their mounted Drive folder.
      </p>

      {!running && (
        <label
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors bg-[#161B22] ${
            dragOver ? 'border-[#D35400]' : 'border-gray-700 hover:border-[#D35400]'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
        >
          <span className="text-3xl mb-2">📷</span>
          <span className="text-sm font-bold text-gray-300">
            {dragOver ? 'Drop photos here' : 'Select or drag photos'}
          </span>
          <span className="text-xs text-gray-500 mt-1">JPG, PNG, HEIC, WEBP — multiple files OK</span>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
        </label>
      )}

      {items.length > 0 && (
        <div className="border border-gray-800 rounded overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {items.map(item => (
              <BulkItemRow key={item.id} item={item} running={running}
                onRemove={id => setItems(p => p.filter(i => i.id !== id))} />
            ))}
          </div>
        </div>
      )}

      {finished && items.length > 0 && (
        <div className="p-3 bg-[#161B22] border border-gray-700 rounded text-sm space-y-1">
          {counts.done      && <p className="text-green-400">✓ {counts.done} saved</p>}
          {counts.duplicate && <p className="text-yellow-400">⚠ {counts.duplicate} duplicate{counts.duplicate !== 1 ? 's' : ''} skipped</p>}
          {counts.error     && <p className="text-red-400">✗ {counts.error} failed</p>}
          <a href="#archive" className="inline-block text-sm text-[#D35400] hover:text-[#E67E22] underline pt-1">View Archive ↓</a>
        </div>
      )}

      <div className="flex gap-3">
        {running ? (
          <div className="flex-1 flex items-center justify-center gap-3 py-3 text-sm text-gray-400 bg-[#161B22] rounded border border-gray-800">
            <span className="inline-block w-4 h-4 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
            {activeIdx >= 0 ? `Processing ${activeIdx + 1} of ${items.length}` : 'Processing…'}
          </div>
        ) : pendingCount > 0 ? (
          <button onClick={processAll}
            className="flex-1 bg-[#D35400] hover:bg-[#E67E22] active:bg-[#C0392B] text-white font-bold py-3 rounded transition-colors text-sm">
            PROCESS {pendingCount} PHOTO{pendingCount !== 1 ? 'S' : ''}
          </button>
        ) : null}

        {!running && items.length > 0 && (
          <button onClick={() => { setItems([]); setFinished(false) }}
            className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ── Paste Text ────────────────────────────────────────────────────────────────
function TextTab({ onSaved }) {
  const [text, setText] = useState('')

  return (
    <ImportTab
      hint="Paste raw recipe text — from an email, a document, anywhere. GPT-4o will structure it."
      onSaved={onSaved}
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
export default function HomeClient() {
  const router = useRouter()
  const [tab, setTab] = useState('reel')

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">ADD RECIPE</h1>
      <p className="text-gray-400 text-sm mb-6">Extract from Instagram, scrape a website, upload a PDF, photo, or bulk-import a folder of images.</p>

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

      {tab === 'reel'  && <ReelTab onSaved={router.refresh} />}
      {tab === 'url'   && <UrlTab  onSaved={router.refresh} />}
      {tab === 'pdf'   && (
        <FileImportTab
          fileType="pdf" icon="📄" accept=".pdf,application/pdf"
          hint="Upload a PDF recipe card, cookbook page scan, or any PDF containing a recipe."
          onSaved={router.refresh}
        />
      )}
      {tab === 'image' && (
        <FileImportTab
          fileType="image" icon="📷" accept="image/*"
          hint="Take a photo of a handwritten recipe card, a cookbook page, or a printed recipe. GPT-4o Vision will read it."
          onSaved={router.refresh}
        />
      )}
      {tab === 'bulk'  && <BulkPhotoTab onSaved={router.refresh} />}
      {tab === 'text'  && <TextTab      onSaved={router.refresh} />}
    </div>
  )
}
