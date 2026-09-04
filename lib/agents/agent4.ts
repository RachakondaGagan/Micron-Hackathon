// Agent 4 — Notification
// Module 9 Implementation

import type {
  PurchaseRequisition,
  DecisionResult,
  NotificationResult,
  RecipientType,
  NotificationType,
} from '@/types'
import { createServerClient } from '@/lib/supabase'
import { sendNotificationEmail } from '@/lib/notifications/resend'

export async function runAgent4(
  pr: PurchaseRequisition,
  decisionResult: DecisionResult,
  customSupabaseClient?: any
): Promise<NotificationResult> {
  const supabase = customSupabaseClient || createServerClient()

  // 1. Determine recipient and notification type
  let recipient_email: string
  let recipient_name: string
  let recipient_type: RecipientType
  let notification_type: NotificationType
  let message: string

  if (decisionResult.decision === 'APPROVE') {
    recipient_email = pr.requestor_email
    recipient_name = pr.requestor_name
    recipient_type = 'REQUESTOR'
    notification_type = 'APPROVE_NOTIFICATION'
    message = `Your PR ${pr.pr_number} has been APPROVED. ${decisionResult.recommended_next_step}`
  } else if (decisionResult.decision === 'REVIEW') {
    recipient_email = pr.planner_email || pr.requestor_email
    recipient_name = pr.planner_name || pr.requestor_name
    recipient_type = 'PLANNER'
    notification_type = 'REVIEW_NOTIFICATION'
    message = `PR ${pr.pr_number} requires review. ${decisionResult.reason}`
  } else {
    // REJECT
    recipient_email = pr.requestor_email
    recipient_name = pr.requestor_name
    recipient_type = 'REQUESTOR'
    notification_type = 'REJECT_NOTIFICATION'
    message = `Your PR ${pr.pr_number} has been rejected. ${decisionResult.reason}`
  }

  // 2. Insert In-App Notification Record into Supabase
  let notification_id = `notif-${Date.now()}`
  let in_app_created = false

  try {
    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        pr_id: pr.pr_id,
        recipient_name,
        recipient_email,
        recipient_type,
        notification_type,
        message,
        status: 'PENDING',
        sent_at: new Date().toISOString(),
      })
      .select('notification_id')
      .single()

    if (insertError) {
      console.error('Failed to insert notification into database:', insertError)
    } else if (inserted) {
      notification_id = inserted.notification_id
      in_app_created = true
    }
  } catch (dbErr) {
    console.error('Database notification insert error:', dbErr)
  }

  // 3. Optional Resend Email Delivery (Non-blocking)
  const emailResult = await sendNotificationEmail(
    recipient_email,
    recipient_name,
    pr.pr_number,
    decisionResult.decision,
    decisionResult.reason,
    decisionResult.recommended_next_step
  )

  // Update notification status if record was created
  if (in_app_created) {
    const newStatus = emailResult.sent ? 'SENT' : emailResult.error ? 'EMAIL_FAILED' : 'SENT'
    try {
      await supabase
        .from('notifications')
        .update({ status: newStatus })
        .eq('notification_id', notification_id)
    } catch (e: any) {
      console.warn('Failed to update notification status:', e)
    }
  }

  return {
    notification_id,
    recipient_email,
    recipient_type,
    message,
    in_app_created,
    email_sent: emailResult.sent,
    email_error: emailResult.error,
  }
}
