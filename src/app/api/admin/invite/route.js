import { createAdminClient, createSessionClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'mxganse@gmail.com'

export async function POST(request) {
  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email } = await request.json()
  if (!email?.trim()) return Response.json({ error: 'Email required' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ error: 'RESEND_API_KEY is not configured on this server' }, { status: 500 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const supabase = createAdminClient()

  // Generate invite link without Supabase sending its own email
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: email.trim(),
    options: { redirectTo: 'https://souschef.fig8culinary.com/auth/callback' },
  })

  if (linkError) return Response.json({ error: linkError.message }, { status: 500 })

  const inviteUrl = linkData?.properties?.action_link

  const { error: emailError } = await resend.emails.send({
    from: 'SousChef <invites@fig8culinary.com>',
    to: email.trim(),
    subject: "You're invited to SousChef",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h1 style="color:#D35400;font-size:24px;font-weight:900;margin-bottom:4px">SOUSCHEF</h1>
        <p style="color:#555;font-size:13px;margin-bottom:24px">fig8culinary.com</p>
        <p style="color:#222;font-size:16px">You've been invited to join SousChef — your personal recipe archive.</p>
        <p style="color:#555;font-size:14px;margin-top:12px">Click the button below to set up your account and start adding recipes from Instagram, websites, PDFs, and more.</p>
        <div style="margin:28px 0">
          <a href="${inviteUrl}" style="background:#D35400;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block">
            Accept Invitation →
          </a>
        </div>
        <p style="color:#999;font-size:12px">This link expires in 24 hours. If you didn't expect this invitation, you can ignore it.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#bbb;font-size:11px">Sent by <a href="https://souschef.fig8culinary.com" style="color:#D35400">souschef.fig8culinary.com</a></p>
      </div>
    `,
  })

  if (emailError) return Response.json({ error: emailError.message }, { status: 500 })
  return Response.json({ success: true })
}
