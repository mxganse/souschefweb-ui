import { createSessionClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth-server'
import { buildPdf, safeName } from '@/lib/buildPdf'
import { Resend } from 'resend'

export async function POST(request) {
  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY is not configured on this server' }, { status: 500 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = await createSessionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const denied = await requirePermission(user, 'can_email_recipe', 'You do not have permission to email recipes.')
  if (denied) return denied

  const body = await request.json()
  const { title, category, source_url, created_at, instructions_markdown } = body

  if (!instructions_markdown) return Response.json({ error: 'Missing markdown' }, { status: 400 })

  const recipe = { title, category, source_url, created_at, instructions_markdown }
  const pdfBuffer = await buildPdf(recipe)
  const filename = `${safeName(title)}.pdf`

  const { error } = await resend.emails.send({
    from: 'SousChef <recipes@fig8culinary.com>',
    to: user.email,
    subject: `Your recipe: ${title || 'Recipe'}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h1 style="color:#D35400;font-size:20px;font-weight:900;margin-bottom:8px">SOUSCHEF</h1>
        <p style="color:#333;font-size:15px">Here's your recipe card for <strong>${title || 'your recipe'}</strong>.</p>
        <p style="color:#666;font-size:13px">The PDF is attached below.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">You requested this from <a href="https://souschef.fig8culinary.com" style="color:#D35400">souschef.fig8culinary.com</a></p>
      </div>
    `,
    attachments: [
      {
        filename,
        content: Buffer.from(pdfBuffer).toString('base64'),
      },
    ],
  })

  if (error) {
    console.error('Resend error:', error)
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
