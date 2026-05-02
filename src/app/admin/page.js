import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin — SousChef' }

const SOURCE_ICON = {
  'Instagram Extract':    '📸',
  'Instagram Extraction': '📸',
  'Web Import':           '🌐',
  'PDF Import':           '📄',
  'Image Import':         '📷',
  'Text Import':          '📝',
}

const SOURCE_LABEL = {
  'Instagram Extract':    'Instagram',
  'Instagram Extraction': 'Instagram',
  'Web Import':           'Web',
  'PDF Import':           'PDF',
  'Image Import':         'Photo',
  'Text Import':          'Text',
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
  const supabase = createServerClient()

  const [recipesRes, ingredientCountRes] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, title, source_type, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true }),
  ])

  const recipes = recipesRes.data ?? []
  const ingredientCount = ingredientCountRes.count ?? 0
  const total = recipes.length

  // ── Source breakdown ────────────────────────────────────────────────────────
  const sourceMap = {}
  for (const r of recipes) {
    const key = r.source_type || 'Unknown'
    sourceMap[key] = (sourceMap[key] || 0) + 1
  }
  // Merge legacy Instagram label
  if (sourceMap['Instagram Extraction']) {
    sourceMap['Instagram Extract'] = (sourceMap['Instagram Extract'] || 0) + sourceMap['Instagram Extraction']
    delete sourceMap['Instagram Extraction']
  }
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])

  // ── Daily activity — last 30 days ───────────────────────────────────────────
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

  // ── Stats ───────────────────────────────────────────────────────────────────
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const thisMonthCount = recipes.filter(r => new Date(r.created_at) >= thisMonth).length

  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastWeekCount = recipes.filter(r => new Date(r.created_at) >= lastWeek).length

  const recent = recipes.slice(0, 15)

  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#D35400] tracking-tight mb-1">ADMIN</h1>
        <p className="text-gray-500 text-sm">Recipe database and processing statistics.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Recipes" value={total} />
        <StatCard label="Ingredients" value={ingredientCount} />
        <StatCard label="This Month" value={thisMonthCount} />
        <StatCard label="Last 7 Days" value={lastWeekCount} />
      </div>

      {/* Source breakdown */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Source</h2>
        <div className="space-y-3">
          {sources.map(([source, count]) => (
            <div key={source} className="flex items-center gap-3">
              <span className="w-6 text-base flex-shrink-0">{SOURCE_ICON[source] || '📋'}</span>
              <span className="w-24 text-sm text-gray-300 flex-shrink-0">{SOURCE_LABEL[source] || source}</span>
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
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Imports</h2>
        <div className="border border-gray-800 rounded-lg overflow-hidden divide-y divide-gray-800">
          {recent.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 bg-[#161B22] hover:bg-[#1c2230] transition-colors">
              <span className="text-base flex-shrink-0">
                {SOURCE_ICON[r.source_type] || '📋'}
              </span>
              <span className="flex-1 text-sm text-gray-300 truncate">{r.title}</span>
              <span className="text-xs text-gray-600 flex-shrink-0 tabular-nums">
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
        {total > 15 && (
          <p className="text-xs text-gray-600 mt-2 text-center">
            Showing 15 of {total.toLocaleString()} — <a href="/recipes" className="text-[#D35400] hover:text-[#E67E22] underline">view all in Archive</a>
          </p>
        )}
      </section>

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
