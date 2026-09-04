// Resend Email Integration for Real-Time Requisition Alerts
// Non-blocking — email failures never interrupt procurement pipeline execution

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Micron ProcureAI <onboarding@resend.dev>'
const OWNER_EMAIL = 'gaganrachakonda.work@gmail.com'

function getFromEmail(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL
  // Free Resend tier requires onboarding@resend.dev unless custom domain is verified
  if (envFrom && !envFrom.includes('@gmail.com') && !envFrom.includes('@yahoo.') && !envFrom.includes('@outlook.')) {
    return envFrom
  }
  return DEFAULT_FROM
}

function resolveRecipient(email?: string | null): string {
  if (!email || email.endsWith('.demo') || email.includes('localhost')) {
    return OWNER_EMAIL
  }
  return email
}

function buildBaseEmailTemplate({
  title,
  badgeText,
  badgeBg,
  badgeColor,
  contentHtml,
  detailsHtml,
  prNumber,
  ctaText = 'Open Requisition in ProcureAI',
  ctaUrl,
}: {
  title: string
  badgeText: string
  badgeBg: string
  badgeColor: string
  contentHtml: string
  detailsHtml?: string
  prNumber: string
  ctaText?: string
  ctaUrl?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://procureai-kappa.vercel.app'
  const targetUrl = ctaUrl || `${appUrl}/pipeline?prId=${prNumber}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:620px;margin:28px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(15,23,42,0.06);">
    <!-- Brand Header -->
    <div style="background-color:#0f172a;padding:24px 32px;color:#ffffff;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:#60a5fa;text-transform:uppercase;margin-bottom:6px;">
        Micron Technology &bull; ProcureAI Autonomous Operations
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">
          ${title}
        </h1>
      </div>
      <div style="margin-top:10px;">
        <span style="display:inline-block;font-size:11px;font-weight:700;background-color:${badgeBg};color:${badgeColor};padding:4px 10px;border-radius:9999px;letter-spacing:0.5px;text-transform:uppercase;">
          ${badgeText}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      ${contentHtml}

      ${detailsHtml ? `
        <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin:22px 0;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
            Requisition Details
          </div>
          ${detailsHtml}
        </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="margin:28px 0 10px 0;text-align:center;">
        <a href="${targetUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);">
          ${ctaText} &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;line-height:1.5;text-align:center;">
      <p style="margin:0 0 4px 0;">This is an automated notification from <strong>Micron ProcureAI</strong> SCM Autonomous Pilot.</p>
      <p style="margin:0;">Micron Global Cleanroom & Fab Logistics &bull; Fab 4 (Boise) &bull; Fab 15 (Hiroshima) &bull; Fab 10 (Singapore) &bull; Sanand ATMP</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * 1. Send Real-Time Email on Purchase Requisition CREATION
 */
export async function sendPRCreatedEmail({
  recipientEmail,
  recipientName,
  prNumber,
  materialName,
  plantName,
  quantity,
  requiredDate,
}: {
  recipientEmail: string
  recipientName: string
  prNumber: string
  materialName?: string
  plantName?: string
  quantity?: number | string
  requiredDate?: string
}): Promise<{ sent: boolean; error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false, error: 'No RESEND_API_KEY' }

  try {
    const to = resolveRecipient(recipientEmail)
    const subject = `[ProcureAI] Requisition Created — ${prNumber}`

    const contentHtml = `
      <p style="font-size:15px;color:#334155;margin-top:0;">Dear <strong>${recipientName || 'Gagan Rachakonda'}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Your purchase requisition <strong>${prNumber}</strong> has been created and submitted to the <strong>ProcureAI Multi-Agent Autonomous Pipeline</strong> for real-time validation.
      </p>
      <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:4px;margin:18px 0;">
        <div style="font-size:13px;font-weight:600;color:#1e40af;">Autonomous AI Evaluation Initiated:</div>
        <div style="font-size:12px;color:#2563eb;margin-top:4px;">
          Agent 1 (Duplicate Check) &bull; Rule Engine (Fab Stock Buffer) &bull; Agent 2 (Supplier Sourcing) &bull; Agent 3 (Decision)
        </div>
      </div>
    `

    const detailsHtml = `
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#64748b;width:35%;">PR Number:</td><td style="padding:6px 0;color:#0f172a;font-weight:600;">${prNumber}</td></tr>
        ${materialName ? `<tr><td style="padding:6px 0;color:#64748b;">Material:</td><td style="padding:6px 0;color:#0f172a;font-weight:600;">${materialName}</td></tr>` : ''}
        ${plantName ? `<tr><td style="padding:6px 0;color:#64748b;">Target Fab:</td><td style="padding:6px 0;color:#0f172a;">${plantName}</td></tr>` : ''}
        ${quantity ? `<tr><td style="padding:6px 0;color:#64748b;">Requested Quantity:</td><td style="padding:6px 0;color:#0f172a;font-weight:600;">${Number(quantity).toLocaleString()}</td></tr>` : ''}
        ${requiredDate ? `<tr><td style="padding:6px 0;color:#64748b;">Required By Date:</td><td style="padding:6px 0;color:#0f172a;">${new Date(requiredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td></tr>` : ''}
      </table>
    `

    const html = buildBaseEmailTemplate({
      title: `Requisition Created: ${prNumber}`,
      badgeText: 'Status: Created &amp; Queued',
      badgeBg: '#dbeafe',
      badgeColor: '#1e40af',
      contentHtml,
      detailsHtml,
      prNumber,
      ctaText: 'Inspect Live AI Pipeline Trace',
    })

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('Resend sendPRCreatedEmail error:', err)
      return { sent: false, error: err.message || 'Resend API failed' }
    }

    return { sent: true, error: null }
  } catch (err: any) {
    console.warn('sendPRCreatedEmail failed (non-blocking):', err.message || err)
    return { sent: false, error: err.message || 'Network error' }
  }
}

/**
 * 2. Send Real-Time Email when PR is EVALUATED (Agent 4: APPROVE, REVIEW, REJECT)
 */
export async function sendPRDecisionEmail({
  recipientEmail,
  recipientName,
  prNumber,
  decision,
  reason,
  recommendedNextStep,
  poNumber,
}: {
  recipientEmail: string
  recipientName: string
  prNumber: string
  decision: 'APPROVE' | 'REVIEW' | 'REJECT' | string
  reason: string
  recommendedNextStep?: string
  poNumber?: string
}): Promise<{ sent: boolean; error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { sent: false, error: 'No RESEND_API_KEY' }

  try {
    const to = resolveRecipient(recipientEmail)
    const isApprove = decision === 'APPROVE'
    const isReview = decision === 'REVIEW'

    const badgeText = isApprove
      ? 'Outcome: Approved'
      : isReview
      ? 'Action: Flagged For Review'
      : 'Outcome: Rejected'

    const badgeBg = isApprove ? '#dcfce7' : isReview ? '#f3e8ff' : '#ffe4e6'
    const badgeColor = isApprove ? '#166534' : isReview ? '#6b21a8' : '#9f1239'
    const subject = `[ProcureAI] Requisition ${prNumber} — ${isApprove ? 'APPROVED' : isReview ? 'SENT FOR SCM REVIEW' : 'REJECTED'}`

    const contentHtml = `
      <p style="font-size:15px;color:#334155;margin-top:0;">Dear <strong>${recipientName || 'Gagan Rachakonda'}</strong>,</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Autonomous evaluation of purchase requisition <strong>${prNumber}</strong> has completed with the decision:
        <strong style="color:${badgeColor};">${decision}</strong>.
      </p>

      <div style="background-color:#f8fafc;border-left:4px solid ${badgeColor};padding:14px 18px;border-radius:4px;margin:18px 0;">
        <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">Evaluation Rationale:</div>
        <div style="font-size:13px;color:#334155;line-height:1.5;">${reason}</div>
      </div>

      ${recommendedNextStep ? `
        <div style="font-size:13px;color:#475569;margin-top:14px;">
          <strong>Recommended Next Step:</strong> ${recommendedNextStep}
        </div>
      ` : ''}

      ${poNumber ? `
        <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px 16px;margin:18px 0;">
          <span style="font-size:13px;font-weight:700;color:#065f46;">Purchase Order Dispatched: ${poNumber}</span>
        </div>
      ` : ''}
    `

    const html = buildBaseEmailTemplate({
      title: `Requisition Outcome: ${decision}`,
      badgeText,
      badgeBg,
      badgeColor,
      contentHtml,
      prNumber,
      ctaText: 'View Requisition & Decision Details',
    })

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromEmail(),
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('Resend sendPRDecisionEmail error:', err)
      return { sent: false, error: err.message || 'Resend API failed' }
    }

    return { sent: true, error: null }
  } catch (err: any) {
    console.warn('sendPRDecisionEmail failed (non-blocking):', err.message || err)
    return { sent: false, error: err.message || 'Network error' }
  }
}

/**
 * 3. Send Real-Time Email on SCM Reviewer APPROVAL
 */
export async function sendPRApprovedEmail({
  recipientEmail,
  recipientName,
  prNumber,
  poNumber,
  notes,
}: {
  recipientEmail: string
  recipientName: string
  prNumber: string
  poNumber?: string
  notes?: string
}): Promise<{ sent: boolean; error: string | null }> {
  return sendPRDecisionEmail({
    recipientEmail,
    recipientName,
    prNumber,
    decision: 'APPROVE',
    reason: notes || 'Approved by SCM Reviewer via Human-in-the-Loop Workbench.',
    recommendedNextStep: poNumber
      ? `Purchase Order ${poNumber} has been issued and dispatched to vendor.`
      : 'Internal transfer order queued for plant cleanroom dispatch.',
    poNumber,
  })
}

/**
 * 4. Send Real-Time Email on SCM Reviewer REJECTION
 */
export async function sendPRRejectedEmail({
  recipientEmail,
  recipientName,
  prNumber,
  reason,
}: {
  recipientEmail: string
  recipientName: string
  prNumber: string
  reason: string
}): Promise<{ sent: boolean; error: string | null }> {
  return sendPRDecisionEmail({
    recipientEmail,
    recipientName,
    prNumber,
    decision: 'REJECT',
    reason,
    recommendedNextStep: 'Requisition blocked. If replenishment is still essential, revise order parameters or contact SCM Lead.',
  })
}

/**
 * Generic backward-compatible email function
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  prNumber: string,
  decision: string,
  reason: string,
  recommendedNextStep: string
): Promise<{ sent: boolean; error: string | null }> {
  return sendPRDecisionEmail({
    recipientEmail,
    recipientName,
    prNumber,
    decision,
    reason,
    recommendedNextStep,
  })
}
