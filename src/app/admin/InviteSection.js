'use client'
import { useState } from 'react'

export default function InviteSection() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState(null) // null | 'sending' | 'sent' | 'error'
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending'); setMessage('')
    const res  = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('sent')
      setMessage(`Invite sent to ${email}`)
      setEmail('')
    } else {
      setStatus('error')
      setMessage(data.error || 'Failed to send invite')
    }
  }

  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Invite User</h2>
      <div className="bg-[#161B22] border border-gray-800 rounded-lg px-4 py-4 space-y-2">
        <p className="text-xs text-gray-500">Sends a Supabase invite email. The recipient can sign in immediately after clicking the link.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            className="flex-1 bg-[#0E1117] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#D35400] transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'sending' || !email.trim()}
            className="px-4 py-2 bg-[#D35400] hover:bg-[#E67E22] disabled:opacity-40 text-white text-sm font-bold rounded transition-colors flex-shrink-0"
          >
            {status === 'sending' ? 'Sending…' : 'SEND INVITE'}
          </button>
        </form>
        {status === 'sent'  && <p className="text-xs text-green-400">{message}</p>}
        {status === 'error' && <p className="text-xs text-red-400">{message}</p>}
      </div>
    </section>
  )
}
