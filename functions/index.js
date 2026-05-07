// functions/index.js — Firebase Cloud Function + SendGrid
// Deploy: firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────────────────
// SETUP SendGrid:
//   1. sendgrid.com → cont gratuit (100 emailuri/zi)
//   2. Settings → API Keys → Create API Key (Full Access)
//   3. Settings → Sender Authentication → verifică domeniul studiokolectiv.ro
//   4. firebase functions:config:set sendgrid.api_key="SG.XXXXXXXXXXXXXXXX"
//   5. firebase functions:config:set app.url="https://app.studiokolectiv.ro"
//   6. firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────────────────

const functions  = require('firebase-functions')
const sgMail     = require('@sendgrid/mail')

const COMPANY = { name: 'Studio Office Kolectiv', site: 'www.studiokolectiv.ro' }

const CHANNEL_LABELS = {
  general: 'General', cu: 'CU',
  avize: 'Avize', pt: 'PT', ac: 'Dosar AC',
}

exports.notifyMention = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Trebuie să fii autentificat.')
  }

  const { toEmail, toName, mentionedBy, projectName, channel, messageText, projectId } = data
  if (!toEmail) throw new functions.https.HttpsError('invalid-argument', 'toEmail lipsă.')

  const apiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY
  sgMail.setApiKey(apiKey)

  const appUrl    = functions.config().app?.url || 'https://app.studiokolectiv.ro'
  const chanLabel = CHANNEL_LABELS[channel] || channel

  // Escape HTML in user-generated text
  const escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  // Highlight @mentions in the message preview
  const highlightMentions = text =>
    escHtml(text).replace(/@([\w][^\s@]*(?:\s[\w][^\s@]*)*)/g,
      '<span style="color:#0969da;font-weight:600;background:#ddf4ff;border-radius:3px;padding:0 3px">@$1</span>')

  const html = `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f8fa;font-family:-apple-system,'Geist','Helvetica Neue',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d0d7de;border-radius:12px;overflow:hidden;max-width:540px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0969da,#8250df);padding:22px 28px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;height:34px;background:rgba(255,255,255,.18);border-radius:9px;text-align:center;vertical-align:middle;padding:7px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </td>
            <td style="padding-left:12px;">
              <div style="color:#fff;font-size:16px;font-weight:700;letter-spacing:-.3px;">ArchPlan</div>
              <div style="color:rgba(255,255,255,.7);font-size:11px;margin-top:1px;">${COMPANY.name}</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:26px 28px 20px;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#24292f;">Ai fost menționat în chat</p>
          <p style="margin:0 0 18px;font-size:13px;color:#57606a;line-height:1.6;">
            <strong style="color:#24292f;">${escHtml(mentionedBy)}</strong> te-a menționat în proiectul
            <strong style="color:#24292f;">${escHtml(projectName)}</strong>
            în canalul <strong style="color:#24292f;">#${chanLabel}</strong>.
          </p>

          <!-- Message preview -->
          <div style="background:#f6f8fa;border:1px solid #d0d7de;border-left:3px solid #0969da;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:22px;">
            <div style="font-size:11px;font-weight:600;color:#8c959f;text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px;">Mesaj</div>
            <div style="font-size:14px;color:#24292f;line-height:1.6;">${highlightMentions(messageText)}</div>
          </div>

          <!-- CTA button -->
          <a href="${appUrl}" style="display:inline-block;background:#0969da;color:#fff;text-decoration:none;border-radius:8px;padding:11px 22px;font-size:13px;font-weight:700;letter-spacing:-.1px;">
            Deschide ArchPlan →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f6f8fa;border-top:1px solid #d0d7de;padding:14px 28px;">
          <p style="margin:0;font-size:11px;color:#8c959f;line-height:1.6;">
            ${COMPANY.name} ·
            <a href="https://${COMPANY.site}" style="color:#0969da;text-decoration:none;">${COMPANY.site}</a>
            · Notificare automată generată de ArchPlan.<br>
            Primești acest email deoarece ești menționat într-un proiect din aplicație.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await sgMail.send({
    to:      toEmail,
    from:    { email: `notifications@${COMPANY.site}`, name: `ArchPlan — ${COMPANY.name}` },
    subject: `@${toName} — ai fost menționat în ${projectName}`,
    html,
    text: `Ai fost menționat în ${projectName} (#${chanLabel}) de ${mentionedBy}:\n\n"${messageText}"\n\nDeschide ArchPlan: ${appUrl}`,
  })

  return { success: true }
})
