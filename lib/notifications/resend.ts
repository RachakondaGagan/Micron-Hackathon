// Resend Email Integration
// Implemented in Module 11
// Optional — email failure never breaks the pipeline

export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  prNumber: string,
  decision: string,
  reason: string,
  recommendedNextStep: string
): Promise<{ sent: boolean; error: string | null }> {
  // TODO: Module 11
  return { sent: false, error: 'Not implemented' }
}
