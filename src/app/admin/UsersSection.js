'use client'
import { useState, useEffect, useCallback } from 'react'
import { ADMIN_EMAIL } from '@/lib/auth'

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function UserRow({ user, onRevoke, revoking }) {
  const isInvitePending = !user.confirmed_at
  const initials = user.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#161B22] hover:bg-[#1c2230] transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#D35400]/20 border border-[#D35400]/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[#D35400]">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-200 font-medium truncate">{user.full_name || user.email}</p>
          {isInvitePending && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-800 flex-shrink-0">
              Invite pending
            </span>
          )}
        </div>
        {user.full_name && (
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
        )}
      </div>

      {/* Dates */}
      <div className="flex flex-col items-end text-right flex-shrink-0 w-28">
        <p className="text-xs text-gray-500">
          {user.last_sign_in_at ? `Last in ${fmt(user.last_sign_in_at)}` : 'Never signed in'}
        </p>
        <p className="text-xs text-gray-700">Joined {fmt(user.created_at)}</p>
      </div>

      {/* Revoke */}
      {!user.isAdmin && (
        <button
          onClick={() => onRevoke(user)}
          disabled={revoking === user.id}
          className="ml-3 px-3 py-1.5 text-xs font-bold rounded border border-red-800 text-red-400 hover:bg-red-900/30 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          {revoking === user.id ? 'Removing…' : 'Revoke'}
        </button>
      )}
      {user.isAdmin && (
        <span className="ml-3 px-3 py-1.5 text-xs font-bold text-gray-600 flex-shrink-0">Admin</span>
      )}
    </div>
  )
}

export default function UsersSection() {
  const [users, setUsers]       = useState(null)
  const [error, setError]       = useState(null)
  const [revoking, setRevoking] = useState(null)
  const [confirm, setConfirm]   = useState(null) // user object awaiting confirmation

  const load = useCallback(async () => {
    setError(null)
    const res  = await fetch('/api/admin/users')
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to load users'); return }
    setUsers(data.users)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRevoke(user) {
    setConfirm(user)
  }

  async function confirmRevoke() {
    const user = confirm
    setConfirm(null)
    setRevoking(user.id)
    const res  = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    setRevoking(null)
    if (!res.ok) { setError(data.error || 'Failed to revoke user'); return }
    setUsers(prev => prev.filter(u => u.id !== user.id))
  }

  const sorted = users
    ? [...users].sort((a, b) => {
        if (a.isAdmin) return -1
        if (b.isAdmin) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      }).map(u => ({ ...u, isAdmin: u.email === ADMIN_EMAIL }))
    : null

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Users</h2>
        {users && (
          <span className="text-xs text-gray-600">{users.length} account{users.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800">
        {!users && !error && (
          <div className="px-4 py-6 bg-[#161B22] text-center text-xs text-gray-600">Loading…</div>
        )}
        {error && (
          <div className="px-4 py-4 bg-[#161B22] text-xs text-red-400">{error}</div>
        )}
        {sorted?.map(user => (
          <UserRow key={user.id} user={user} onRevoke={handleRevoke} revoking={revoking} />
        ))}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Revoke access?</h3>
            <p className="text-xs text-gray-400">
              This will permanently delete <span className="text-gray-200 font-medium">{confirm.email}</span> and all their data. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
