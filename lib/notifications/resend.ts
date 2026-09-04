// Resend Email Integration
// Optional — email failure never breaks the pipeline

export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  prNumber: string,
  decision: string,
  reason: string,
  recommendedNextStep: string
): Promise<{ sent: boolean; error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Graceful bypass when Resend is not configured
    return { sent: false, error: null }
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'procurement@procureai.com'
    const subject = `[ProcureAI] Requisition ${prNumber} — ${decision}`
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0f172a;">ProcureAI Requisition Update</h2>
        <p>Dear ${recipientName},</p>
        <p>Your purchase requisition <strong>${prNumber}</strong> has been evaluated with the outcome: <strong>${decision}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 12px; border-left: 4px solid #3b82f6; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="font-size: 14px; color: #475569;"><strong>Next Step:</strong> ${recommendedNextStep}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from the ProcureAI Autonomous Procurement Pipeline.</p>
      </div>
    `

    // Attempt direct fetch to Resend API without hard dependency on resend package
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.warn('Resend API returned error:', errData)
      return { sent: false, error: errData.message || 'Resend API request failed' }
    }

    return { sent: true, error: null }
  } catch (err: any) {
    console.warn('Failed to send Resend email (non-blocking):', err.message || err)
    return { sent: false, error: err.message || 'Network error' }
  }
}
