import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth'
import { SOURCE_META } from '@/lib/sourceMeta'
import { formatDate } from '@/lib/ingredients'
import InviteSection from './InviteSection'
import UsersSection from './UsersSection'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — SousChef' }

// ── Status indicator ──────────────────────────────────────────────────────────
const STATUS_CONF = {
  connected:        { dot: 'bg-green-500',  ring: 'ring-green-900', label: 'Connected',        text: 'text-green-400'  },
  online:           { dot: 'bg-green-500',  ring: 'ring-green-900', label: 'Online',            text: 'text-green-400'  },
  configured:       { dot: 'bg-blue-500',   ring: 'ring-blue-900',  label: 'Key set',           text: 'text-blue-400'   },
  production:       { dot: 'bg-green-500',  ring: 'ring-green-900', label: 'Production',        text: 'text-green-400'  },
  preview:          { dot: 'bg-yellow-500', ring: 'ring-yellow-900',label: 'Preview',           text: 'text-yellow-400' },
  development:      { dot: 'bg-gray-500',   ring: 'ring-gray-800',  label: 'Local Dev',         text: 'text-gray-400'   },
  error:            { dot: 'bg-red-500',    ring: 'ring-red-900',   label: 'Error',             text: 'text-red-400'    },
  offline:          { dot: 'bg-red-500',    ring: 'ring-red-900',   label: 'Offline',           text: 'text-red-400'    },
  'not-configured': { dot: 'bg-gray-700',   ring: 'ring-gray-800',  label: 'Not configured',    text: 'text-gray-600'   },
  'missing-key':    { dot: 'bg-yellow-600', ring: 'ring-yellow-900',label: 'Key missing',       text: 'text-yellow-500' },
}

function StatusRow({ service, status, detail, meta }) {
  const s = STATUS_CONF[status] || STATUS_CONF['not-configured']
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-b-0">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ${s.dot} ${s.ring}`} />
      <span className="w-32 text-sm text-gray-300 flex-shrink-0 font-semibold">{service}</span>
      <span className={`w-28 text-xs font-bold flex-shrink-0 ${s.text}`}>{s.label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {detail && <p className="text-xs text-gray-500 font-mono truncate">{detail}</p>}
        {meta && <p className="text-xs text-gray-700 flex-shrink-0">{meta}</p>}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
      <p className="text-3xl font-black text-[#D35400]">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function AdminPage() {
  const sessionSupabase = await createSessionClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  if (!isAdminUser(user)) redirect('/')

  const supabase = createAdminClient()

  // ── Parallel: DB queries + worker health ping ─────────────────────────────
  const workerBaseUrl = process.env.WORKER_URL
  const workerPingUrl = workerBaseUrl ? `${workerBaseUrl.replace(/\/$/, '')}/health` : null

  const t0 = Date.now()
  const [recipesRes, ingredientCountRes, workerPingRes, featureEventsRes, referenceRes] = await Promise.allSettled([
    supabase
      .from('recipes')
      .select('id, title, source_type, created_at, submitted_by')
      .order('created_at', { ascending: false }),
    supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true }),
    workerPingUrl
      ? fetch(workerPingUrl, { signal: AbortSignal.timeout(4000), cache: 'no-store' })
      : Promise.resolve(null),
    supabase
      .from('feature_events')
      .select('event_name, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('culinary_standards')
      .select('id, title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])
  const dbLatency = Date.now() - t0

  const recipes         = recipesRes.status === 'fulfilled' ? (recipesRes.value.data ?? []) : []
  const ingredientCount = ingredientCountRes.status === 'fulfilled' ? (ingredientCountRes.value.count ?? 0) : 0
  const featureEvents   = featureEventsRes.status === 'fulfilled' ? (featureEventsRes.value.data ?? []) : []
  const recentReference = referenceRes.status === 'fulfilled' ? (referenceRes.value.data ?? []) : []

  // ── Connectivity status ───────────────────────────────────────────────────
  // Supabase
  const supabaseOk     = recipesRes.status === 'fulfilled' && !recipesRes.value.error
  const supabaseStatus = supabaseOk ? 'connected' : 'error'
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseHost   = supabaseUrl ? (() => { try { return new URL(supabaseUrl).hostname } catch { return supabaseUrl } })() : null

  // OpenAI
  const openaiKey    = process.env.OPENAI_API_KEY
  const openaiStatus = openaiKey ? 'configured' : 'missing-key'
  const openaiMasked = openaiKey ? `${openaiKey.slice(0, 10)}…${openaiKey.slice(-4)}` : 'OPENAI_API_KEY not set'

  // Worker
  const workerStatus =
    !workerBaseUrl       ? 'not-configured'
    : workerPingRes.status === 'rejected' ? 'offline'
    : workerPingRes.value === null        ? 'not-configured'
    : workerPingRes.value.ok              ? 'online'
    :                                       'error'
  const workerDisplay = workerBaseUrl
    ? (() => { try { return new URL(workerBaseUrl).hostname } catch { return workerBaseUrl } })()
    : 'WORKER_URL not set'
  const workerSecret  = process.env.WORKER_SECRET ? '🔑 secret set' : '⚠ no secret'

  // Vercel / deployment
  const vercelEnv    = process.env.VERCEL_ENV    // 'production' | 'preview' | 'development' | undefined
  const vercelRegion = process.env.VERCEL_REGION  // e.g. 'iad1'
  const vercelCommit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  const vercelUrl    = process.env.VERCEL_URL
  const deployStatus = vercelEnv === 'production' ? 'production'
    : vercelEnv === 'preview'    ? 'preview'
    : vercelEnv === 'development' ? 'development'
    : 'development'
  const deployDetail  = vercelUrl ?? 'localhost'
  const deployMeta    = [vercelRegion, vercelCommit].filter(Boolean).join(' · ')

  const total = recipes.length

  // ── Source breakdown ──────────────────────────────────────────────────────
  const sourceMap = {}
  for (const r of recipes) {
    const key = r.source_type || 'Unknown'
    sourceMap[key] = (sourceMap[key] || 0) + 1
  }
  if (sourceMap['Instagram Extraction']) {
    sourceMap['Instagram Extract'] = (sourceMap['Instagram Extract'] || 0) + sourceMap['Instagram Extraction']
    delete sourceMap['Instagram Extraction']
  }
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])

  // ── Daily activity — last 30 days ─────────────────────────────────────────
  const today = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    return { date: d.toISOString().slice(0, 10), count: 0 }
  })
  for (const r of recipes) {
    const key = r.created_at?.slice(0, 10)
    const slot = days.find(d => d.date === key)
    if (slot) slot.count++
  }
  const maxDay = Math.max(...days.map(d => d.count), 1)

  // ── Stats ─────────────────────────────────────────────────────────────────
  const thisMonth = new Date()
  thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const thisMonthCount = recipes.filter(r => new Date(r.created_at) >= thisMonth).length

  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastWeekCount = recipes.filter(r => new Date(r.created_at) >= lastWeek).length

  const recent = recipes.slice(0, 5)

  // ── Feature usage ─────────────────────────────────────────────────────────
  const EVENT_LABELS = {
    pdf_download:        { label: 'PDF Downloads',        icon: '📄' },
    scale_panel_open:    { label: 'Scaling Panel Opens',  icon: '⚖' },
    scale_pdf_download:  { label: 'Scaled PDF Downloads', icon: '📐' },
    bakers_percent_view: { label: "Baker's % Views",      icon: '🧑‍🍳' },
    scale_mode_yield:    { label: 'Target Yield Mode',    icon: '🎯' },
    scale_mode_key:      { label: 'Key Ingredient Mode',  icon: '🔑' },
  }

  const eventCounts = {}
  for (const e of featureEvents) {
    eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">ADMIN</h1>
        <p className="text-gray-500 text-sm">System status and recipe database statistics.</p>
      </div>

      {/* ── System Status ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">System Status</h2>
        <div className="bg-[#161B22] border border-gray-800 rounded-lg px-4 divide-y divide-gray-800">
          <StatusRow
            service="Database"
            status={supabaseStatus}
            detail={supabaseHost ?? 'NEXT_PUBLIC_SUPABASE_URL not set'}
            meta={supabaseOk ? `${dbLatency}ms` : recipesRes.value?.error?.message}
          />
          <StatusRow
            service="OpenAI"
            status={openaiStatus}
            detail={openaiMasked}
          />
          <StatusRow
            service="Video Worker"
            status={workerStatus}
            detail={workerDisplay}
            meta={workerBaseUrl ? workerSecret : null}
          />
          <StatusRow
            service="Deployment"
            status={deployStatus}
            detail={deployDetail}
            meta={deployMeta || null}
          />
        </div>
      </section>

      {/* Invite user */}
      <InviteSection />

      {/* User management */}
      <UsersSection />

      {/* Feature Usage */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Feature Usage — Last 30 Days</h2>
        <div className="bg-[#161B22] border border-gray-800 rounded-lg divide-y divide-gray-800">
          {Object.entries(EVENT_LABELS).map(([key, { label, icon }]) => {
            const count = eventCounts[key] || 0
            const max = Math.max(...Object.values(eventCounts), 1)
            return (
              <div key={key} className="flex items-center gap-3 px-4 py-3">
                <span className="text-base flex-shrink-0">{icon}</span>
                <span className="w-44 text-sm text-gray-300 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#D35400] h-1.5 rounded-full transition-all"
                    style={{ width: count === 0 ? '0%' : `${Math.max(4, (count / max) * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold tabular-nums text-gray-300 flex-shrink-0">
                  {count.toLocaleString()}
                </span>
              </div>
            )
          })}
          {featureEvents.length === 0 && (
            <div className="px-4 py-4 text-xs text-gray-600 italic">No events recorded yet — stats will appear as features are used.</div>
          )}
        </div>
      </section>

      {/* Summary cards */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recipe Database</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Recipes"  value={total} />
          <StatCard label="Ingredients"    value={ingredientCount} />
          <StatCard label="This Month"     value={thisMonthCount} />
          <StatCard label="Last 7 Days"    value={lastWeekCount} />
        </div>
      </section>

      {/* Source breakdown */}
      {sources.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Source</h2>
          <div className="space-y-3">
            {sources.map(([source, count]) => (
              <div key={source} className="flex items-center gap-3">
                <span className="w-6 text-base flex-shrink-0">{SOURCE_META[source]?.icon || '📋'}</span>
                <span className="w-24 text-sm text-gray-300 flex-shrink-0">{SOURCE_META[source]?.label || source}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#D35400] h-2 rounded-full transition-all"
                    style={{ width: `${((count / total) * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-sm text-gray-400 flex-shrink-0 tabular-nums">
                  {count.toLocaleString()} <span className="text-gray-600">({((count / total) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Daily bar chart */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Imports — Last 30 Days</h2>
        <div className="flex items-end gap-0.5 h-24 bg-[#161B22] border border-gray-800 rounded-lg px-3 pt-3 pb-2">
          {days.map(d => (
            <div key={d.date} className="flex-1 flex flex-col justify-end" title={`${d.date}: ${d.count} recipe${d.count !== 1 ? 's' : ''}`}>
              <div
                className="w-full rounded-sm"
                style={{
                  height: d.count === 0
                    ? '2px'
                    : `${Math.max(4, Math.round((d.count / maxDay) * 64))}px`,
                  backgroundColor: d.count === 0 ? '#1f2937' : '#D35400',
                  opacity: d.count === 0 ? 0.4 : 0.9,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
          <span>{days[0].date.slice(5)}</span>
          <span>today</span>
        </div>
      </section>

      {/* Recent imports */}
      {(recent.length > 0 || recentReference.length > 0) && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Imports</h2>

          {/* Recipe imports */}
          {recent.length > 0 && (
            <div className="border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800 mb-4">
              <div className="px-4 py-2 bg-[#0E1117]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recipes</span>
              </div>
              {recent.map(r => (
                <a
                  key={r.id}
                  href={`/?recipe=${r.id}`}
                  aria-label={`View recipe: ${r.title}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[#161B22] hover:bg-[#1c2230] transition-colors"
                >
                  <span className="text-base flex-shrink-0" aria-hidden="true">{SOURCE_META[r.source_type]?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-300 truncate block">{r.title}</span>
                    {r.submitted_by && <span className="text-xs text-gray-500 truncate block">by {r.submitted_by}</span>}
                  </div>
                  <time dateTime={r.created_at} className="text-xs text-gray-600 flex-shrink-0 tabular-nums">
                    {formatDate(r.created_at)}
                  </time>
                </a>
              ))}
            </div>
          )}
          {total > 5 && (
            <p className="text-xs text-gray-600 mb-4 text-center">
              Showing 5 of {total.toLocaleString()} — <a href="/" className="text-[#D35400] hover:text-[#E67E22] underline">view all in Archive</a>
            </p>
          )}

          {/* Reference updates */}
          {recentReference.length > 0 && (
            <div className="border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800">
              <div className="px-4 py-2 bg-[#0E1117]">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reference</span>
              </div>
              {recentReference.map(s => (
                <a
                  key={s.id}
                  href="/reference"
                  aria-label={`View reference: ${s.title}`}
                  className="flex items-center gap-3 px-4 py-3 bg-[#161B22] hover:bg-[#1c2230] transition-colors"
                >
                  <span className="text-base flex-shrink-0" aria-hidden="true">📚</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-300 truncate block">{s.title}</span>
                    <span className="text-xs text-gray-500 truncate block">{s.category}</span>
                  </div>
                  <time dateTime={s.created_at} className="text-xs text-gray-600 flex-shrink-0 tabular-nums">
                    {formatDate(s.created_at)}
                  </time>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Storage note */}
      <section className="border border-gray-800 rounded-lg px-4 py-3 bg-[#161B22]">
        <p className="text-xs text-gray-500">
          <span className="text-gray-300 font-bold">Storage policy:</span> Images and PDFs are never persisted.
          Files are sent to OpenAI Vision for extraction, then discarded. Only the extracted recipe markdown and ingredient text are stored in Supabase.
        </p>
      </section>

    </div>
  )
}
