'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

const TABS = [
  { id: 'url',   label: 'Web Link' },
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
    <div className="mt-4 p-4 bg-[#161B22] border border-gray-700 rounded space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Category</label>
        <input 
          value={result.category} 
          onChange={e => setResult({...result, category: e.target.value})} 
          className="w-full bg-black border border-gray-600 rounded px-2 py-1 text-sm text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Title</label>
        <input 
          value={result.title} 
          onChange={e => setResult({...result, title: e.target.value})} 
          className="w-full bg-black border border-gray-600 rounded px-2 py-1 text-sm text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Content</label>
        <textarea 
          value={result.markdown} 
          onChange={e => setResult({...result, markdown: e.target.value})} 
          className="w-full h-64 bg-black border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full py-2 bg-[#D35400] text-white font-bold rounded hover:bg-[#E67E22] transition-colors"
      >
        Approve and Save to Reference Library →
      </button>
    </div>
  )
  return null
}

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
      <StatusBox status={status} error={error} result={result} />
    </form>
  )
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
      // 1. Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data, error: uploadErr } = await supabase.storage
        .from('temp-imports')
        .upload(fileName, file)
      
      if (uploadErr) throw uploadErr
      
      // 2. Get public/signed URL
      const { data: urlData } = supabase.storage.from('temp-imports').getPublicUrl(fileName)
      
      // 3. Send URL to API
      const res = await fetch('/api/import-reference', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlData.publicUrl, fileName, isStorageFile: true })
      })
      
      const dataResult = await res.json()
      if (!res.ok) throw new Error(dataResult.error || 'Import failed')
      setResult(dataResult); setStatus('done'); setFile(null)
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
  const [tab, setTab] = useState('url')

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

      {tab === 'url'   && <UrlTab />}
      {tab === 'pdf'   && (
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
