import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createPurchaseOrder } from '@/lib/orders/po'
import { sendPRApprovedEmail, sendPRRejectedEmail } from '@/lib/notifications/resend'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pr_id, action, notes, vendor_id, unit_price } = body

    if (!pr_id || !action) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'pr_id and action are required' } },
        { status: 400 }
      )
    }

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_ACTION', message: 'Action must be APPROVE or REJECT' } },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 1. Fetch PR details
    const { data: pr, error: prError } = await supabase
      .from('purchase_requisitions')
      .select('*, ai_pr_analysis(*)')
      .eq('pr_id', pr_id)
      .single()

    if (prError || !pr) {
      return NextResponse.json(
        { data: null, error: { code: 'PR_NOT_FOUND', message: 'Purchase Requisition not found' } },
        { status: 404 }
      )
    }

    const analysis = pr.ai_pr_analysis?.[0] || pr.ai_pr_analysis

    if (action === 'APPROVE') {
      // Sourcing recommendations fallback
      const effectiveVendorId =
        vendor_id || analysis?.sourcing_result?.recommended_vendor_id || 'VND-001'
      const effectiveUnitPrice =
        unit_price || analysis?.sourcing_result?.recommended_unit_price || 150.0

      let createdPo = null
      try {
        createdPo = await createPurchaseOrder({
          prId: pr.pr_id,
          vendorId: effectiveVendorId,
          materialId: pr.material_id,
          quantity: pr.quantity,
          unitPrice: effectiveUnitPrice,
          expectedDeliveryDate: pr.required_date,
          customSupabaseClient: supabase,
        })
      } catch (poErr: any) {
        console.warn('PO creation error during approval, setting status to APPROVED:', poErr)
        await supabase
          .from('purchase_requisitions')
          .update({ status: 'APPROVED' })
          .eq('pr_id', pr_id)
      }

      // Notify Requestor
      const requestorMessage = `Your PR ${pr.pr_number} has been APPROVED by SCM Reviewer.${
        createdPo ? ` Purchase Order ${createdPo.po_number} generated.` : ''
      }${notes ? ` Note: ${notes}` : ''}`

      await supabase.from('notifications').insert({
        pr_id: pr.pr_id,
        recipient_name: pr.requestor_name,
        recipient_email: pr.requestor_email,
        recipient_type: 'REQUESTOR',
        notification_type: 'APPROVE_NOTIFICATION',
        channel: 'IN_APP',
        message: requestorMessage,
        status: 'UNREAD',
      })

      // Notify Reviewer / Audit Log
      await supabase.from('notifications').insert({
        pr_id: pr.pr_id,
        recipient_name: 'SCM Procurement Lead',
        recipient_email: 'planner.scm@micron.com',
        recipient_type: 'PLANNER',
        notification_type: 'APPROVE_NOTIFICATION',
        channel: 'IN_APP',
        message: `Reviewer override: PR ${pr.pr_number} approved and dispatched.${
          createdPo ? ` PO: ${createdPo.po_number}` : ''
        }`,
        status: 'READ',
      })

      // Send Real-Time Email to Requestor
      sendPRApprovedEmail({
        recipientEmail: pr.requestor_email,
        recipientName: pr.requestor_name,
        prNumber: pr.pr_number,
        poNumber: createdPo?.po_number,
        notes,
      }).catch((emailErr) => {
        console.warn('Real-time approval email dispatch failed:', emailErr)
      })

      return NextResponse.json({
        data: {
          pr_id,
          status: createdPo ? 'PO_CREATED' : 'APPROVED',
          purchase_order: createdPo,
          message: `PR ${pr.pr_number} successfully approved.`,
        },
        error: null,
      })
    } else {
      // REJECT
      const rejectionReason = notes || 'Requisition rejected by SCM Reviewer during review.'

      await supabase
        .from('purchase_requisitions')
        .update({ status: 'REJECTED' })
        .eq('pr_id', pr_id)

      // Notify Requestor
      await supabase.from('notifications').insert({
        pr_id: pr.pr_id,
        recipient_name: pr.requestor_name,
        recipient_email: pr.requestor_email,
        recipient_type: 'REQUESTOR',
        notification_type: 'REJECT_NOTIFICATION',
        channel: 'IN_APP',
        message: `Your PR ${pr.pr_number} was REJECTED by SCM Reviewer. Rationale: ${rejectionReason}`,
        status: 'UNREAD',
      })

      // Notify Reviewer / Audit Log
      await supabase.from('notifications').insert({
        pr_id: pr.pr_id,
        recipient_name: 'SCM Procurement Lead',
        recipient_email: 'planner.scm@micron.com',
        recipient_type: 'PLANNER',
        notification_type: 'REJECT_NOTIFICATION',
        channel: 'IN_APP',
        message: `Review completed: PR ${pr.pr_number} rejected. Reason: ${rejectionReason}`,
        status: 'READ',
      })

      // Send Real-Time Email to Requestor
      sendPRRejectedEmail({
        recipientEmail: pr.requestor_email,
        recipientName: pr.requestor_name,
        prNumber: pr.pr_number,
        reason: rejectionReason,
      }).catch((emailErr) => {
        console.warn('Real-time rejection email dispatch failed:', emailErr)
      })

      return NextResponse.json({
        data: {
          pr_id,
          status: 'REJECTED',
          message: `PR ${pr.pr_number} has been rejected.`,
        },
        error: null,
      })
    }
  } catch (err: any) {
    console.error('Reviewer action failed:', err)
    return NextResponse.json(
      { data: null, error: { code: 'REVIEWER_ACTION_ERROR', message: err.message || 'Action failed' } },
      { status: 500 }
    )
  }
}
