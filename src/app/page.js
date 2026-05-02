'use client'
import { useState } from 'react'

const STATUS = {
  idle: null,
  downloading: 'Downloading reel...',
  extracting: 'Extracting frames & audio...',
  transcribing: 'Transcribing audio...',
  analyzing: 'Analyzing with GPT-4o...',
  saving: 'Saving to database...',
  done: 'Done!',
  error: 'Error',
}

export default function ExtractPage() {
  const [url, setUrl] = useState('')
  const [manualIngredients, setManualIngredients] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setResult(null)
    setError(null)
    setStatus('downloading')

    try {
      const res = await fetch('/api/process-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), manualIngredients }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Something went wrong')
        return
      }

      setStatus('done')
      setResult(data)
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-[#D35400] tracking-tight mb-2">EXTRACT RECIPE</h1>
      <p className="text-gray-400 text-sm mb-8">Paste an Instagram reel URL to extract and save the recipe.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Instagram Reel URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            required
            className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#D35400] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
            Manual Ingredient Override <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={manualIngredients}
            onChange={e => setManualIngredients(e.target.value)}
            placeholder="Paste any ingredients you can see in the video that may be missed..."
            rows={3}
            className="w-full bg-[#161B22] border border-gray-700 rounded px-4 py-3 text-sm focus:outline-none focus:border-[#D35400] transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status !== 'idle' && status !== 'done' && status !== 'error'}
          className="w-full bg-[#D35400] hover:bg-[#E67E22] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors"
        >
          {status !== 'idle' && status !== 'done' && status !== 'error' ? STATUS[status] : 'PROCESS REEL'}
        </button>
      </form>

      {status === 'error' && (
        <div className="mt-6 p-4 bg-red-950 border border-red-800 rounded text-red-300 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#D35400]">{result.title}</h2>
            <a
              href="/recipes"
              className="text-xs text-gray-400 hover:text-white underline transition-colors"
            >
              View in archive →
            </a>
          </div>
          <pre className="bg-[#161B22] border border-gray-700 rounded p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[500px]">
            {result.recipe.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^#+\s*/gm, '')}
          </pre>
          <button
            onClick={() => { setStatus('idle'); setUrl(''); setManualIngredients(''); setResult(null) }}
            className="text-sm text-gray-400 hover:text-white underline transition-colors"
          >
            Extract another
          </button>
        </div>
      )}
    </div>
  )
}
