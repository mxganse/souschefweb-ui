import { createAdminClient, createSessionClient } from '@/lib/supabase/server'

const ALLOWED_EVENTS = new Set([
  'pdf_download',
  'scale_panel_open',
  'scale_pdf_download',
  'bakers_percent_view',
  'scale_mode_yield',
  'scale_mode_key',
])

export async function POST(request) {
  try {
    const { event, metadata = {} } = await request.json()

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return Response.json({ ok: false }, { status: 200 }) // silent reject
    }

    // Try to get user_id — optional, don't block if session fails
    let userId = null
    try {
      const sessionClient = await createSessionClient()
      const { data: { user } } = await sessionClient.auth.getUser()
      userId = user?.id ?? null
    } catch {}

    const supabase = createAdminClient()
    await supabase.from('feature_events').insert({
      event_name: event,
      user_id: userId,
      metadata,
    })
  } catch {}

  return Response.json({ ok: true })
}
