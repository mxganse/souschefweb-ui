'use client'
import { useState, useEffect, useCallback } from 'react'
import { ADMIN_EMAIL } from '@/lib/auth'

const DEFAULT_PERMS = {
  can_add_recipes: false,
  can_view_library: false,
  library_view_scope: 'own_only',
  can_access_reference: false,
  can_export_pdf: false,
  can_import_recipes: false,
  can_email_recipe: false,
}

const PERM_COLS = [
  { field: 'can_add_recipes',      label: 'Add Recipes',   title: 'Can submit new recipes via URL or import' },
  { field: 'can_view_library',     label: 'View Library',  title: 'Can browse the full recipe archive' },
  { field: 'can_access_reference', label: 'Reference',     title: 'Can access the Kitchen Reference library' },
  { field: 'can_export_pdf',       label: 'Export PDF',    title: 'Can download recipe PDFs' },
  { field: 'can_import_recipes',   label: 'Import',        title: 'Can use the reel/web/image importer' },
  { field: 'can_email_recipe',     label: 'Email Recipe',  title: 'Can email recipes' },
]

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Toggle({ checked, onChange, disabled, title }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-[#D35400] border-[#D35400]' : 'bg-gray-700 border-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ScopeSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="text-xs bg-[#0E1117] border border-gray-700 rounded px-2 py-1 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-[#D35400]"
    >
      <option value="own_only">Own only</option>
      <option value="all">All recipes</option>
    </select>
  )
}

function UserPermRow({ user, onToggle, onScope, saving }) {
  const isAdmin = user.email === ADMIN_EMAIL
  const perms = user.permissions ?? DEFAULT_PERMS
  const initials = user.full_name
    ? user.full_name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-lg p-4">
      {/* User identity row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#D35400]/20 border border-[#D35400]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#D35400]">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-200 font-semibold truncate">{user.full_name || user.email}</p>
            {isAdmin && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#D35400]/20 text-[#D35400] border border-[#D35400]/40 flex-shrink-0">Admin</span>
            )}
            {!user.confirmed_at && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400 border border-yellow-800 flex-shrink-0">Invite pending</span>
            )}
          </div>
          {user.full_name && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
          <p className="text-xs text-gray-600 mt-0.5">
            Joined {fmt(user.created_at)}
            {user.last_sign_in_at ? ` · Last login ${fmt(user.last_sign_in_at)}` : ' · Never signed in'}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <p className="text-xs text-gray-600 italic">Admin has unrestricted access to all features.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PERM_COLS.map(({ field, label, title }) => {
            const isSaving = saving === `${user.id}:${field}`
            const isLibraryField = field === 'can_view_library'
            return (
              <div key={field} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={!!perms[field]}
                    onChange={val => onToggle(user.id, field, val)}
                    disabled={isSaving}
                    title={title}
                  />
                  <span className={`text-xs font-medium ${isSaving ? 'text-gray-600' : 'text-gray-300'}`}>
                    {label}
                    {isSaving && ' …'}
                  </span>
                </div>
                {isLibraryField && perms.can_view_library && (
                  <div className="ml-7">
                    <ScopeSelect
                      value={perms.library_view_scope || 'own_only'}
                      onChange={val => onScope(user.id, val)}
                      disabled={saving?.startsWith(user.id)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PermissionsClient() {
  const [users, setUsers]   = useState(null)
  const [error, setError]   = useState(null)
  const [saving, setSaving] = useState(null) // 'userId:field'

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/admin/user-permissions')
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to load'); return }
    setUsers(data.users)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(userId, field, value) {
    setSaving(`${userId}:${field}`)
    // Optimistic update
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, permissions: { ...(u.permissions ?? DEFAULT_PERMS), [field]: value } }
        : u
    ))
    const res = await fetch('/api/admin/user-permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, field, value }),
    })
    setSaving(null)
    if (!res.ok) {
      // Revert
      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, permissions: { ...(u.permissions ?? DEFAULT_PERMS), [field]: !value } }
          : u
      ))
      const data = await res.json()
      setError(data.error || 'Save failed')
    }
  }

  async function handleScope(userId, value) {
    setSaving(`${userId}:library_view_scope`)
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, permissions: { ...(u.permissions ?? DEFAULT_PERMS), library_view_scope: value } }
        : u
    ))
    const res = await fetch('/api/admin/user-permissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, field: 'library_view_scope', value }),
    })
    setSaving(null)
    if (!res.ok) {
      setError('Failed to update scope')
      load()
    }
  }

  const sorted = users
    ? [...users].sort((a, b) => {
        if (a.email === ADMIN_EMAIL) return -1
        if (b.email === ADMIN_EMAIL) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      })
    : null

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 pb-2 border-b border-gray-800">
        {PERM_COLS.map(({ label, title }) => (
          <span key={label} title={title} className="cursor-help">
            <span className="font-semibold text-gray-400">{label}</span> — {title}
          </span>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-950 border border-red-800 rounded text-xs text-red-300">{error}</div>
      )}

      {!sorted && !error && (
        <div className="text-center text-xs text-gray-600 py-12">Loading users…</div>
      )}

      {sorted?.map(user => (
        <UserPermRow
          key={user.id}
          user={user}
          onToggle={handleToggle}
          onScope={handleScope}
          saving={saving}
        />
      ))}
    </div>
  )
}
