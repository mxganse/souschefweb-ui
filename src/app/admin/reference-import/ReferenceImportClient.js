'use client'
import { useState, useRef } from 'react'

const TABS = [
  { id: 'pdf',   label: 'PDF Document' },
  { id: 'image', label: 'Photo/Scan' },
]

function StatusBox({ status, error, result }) {
  if (error) return (
    <div className="mt-4 p-4 bg-red-950 border border-red-700 rounded text-sm text-red-300 whitespace-pre-wrap">{error}</div>
  )
  if (status === 'processing') return (
    <div className="mt-4 flex items-center gap-3 text-gray-400 text-sm">
      <span className="animate-spin text-[#D35400] text-xl">⏳</span>
      Extracting and synthesizing reference data with GPT-4o…
    </div>
  )
  async function handleSave() {
    if (!result) return
    try {
      const res = await fetch('/api/admin/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: result.category,
          title: result.title,
          content_markdown: result.markdown,
          tags: result.tags,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      alert('Successfully saved to reference library!')
    } catch (err) {
      alert(err.message)
    }
  }

  if (result) return (
    <div className="mt-4 p-4 bg-[#161B22] border border-gray-700 rounded space-y-2">
      <p className="text-[#D35400] font-bold text-lg">Processed: {result.category}</p>
      <p className="text-xs text-gray-500">Categorized: {result.category} · {result.tags.length} tags · AI Confidence: {Math.round(result.confidence * 100)}%</p>
      <div className="text-sm text-gray-300 mt-2 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono text-[10px] bg-black p-2 rounded">
        {result.markdown.substring(0, 300)}...
      </div>
      <button
        onClick={handleSave}
        className="inline-block mt-3 text-sm text-[#D35400] hover:text-[#E67E22] underline"
      >
        Save to Reference Library →
      </button>
    </div>
  )
  return null
}

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
      const res = await fetch('/api/import-reference', { method: 'POST', body: form })
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
        {status === 'processing' ? 'Processing…' : 'IMPORT REFERENCE'}
      </button>
      <StatusBox status={status} error={error} result={result} />
    </form>
  )
}

export default function ReferenceImportClient() {
  const [tab, setTab] = useState('pdf')

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Admin</a>
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mt-2 mb-1">IMPORT REFERENCE</h1>
        <p className="text-gray-400 text-sm">Upload PDFs or photos of techniques, food science articles, or SOPs.</p>
      </div>

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

      {tab === 'pdf' && (
        <FileTab
          type="pdf"
          accept=".pdf,application/pdf"
          hint="Upload articles, SOP documents, or reference PDFs."
        />
      )}
      {tab === 'image' && (
        <FileTab
          type="image"
          accept="image/*"
          hint="Upload photos of equipment manuals, technique diagrams, or food science notes."
        />
      )}
    </div>
  )
}
