import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    let query = supabase
      .from('notifications')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)

    if (email) {
      query = query.eq('recipient_email', email)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { data: null, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // Deduplicate notifications by pr_id + notification_type to prevent any legacy duplicates
    const seen = new Set<string>()
    const dedupedNotifications = (notifications || []).filter((n: any) => {
      const key = `${n.pr_id}_${n.notification_type}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const unreadCount = dedupedNotifications.filter(
      (n: any) => n.status !== 'READ' && !n.read_at
    ).length

    return NextResponse.json({
      data: {
        notifications: dedupedNotifications,
        unread_count: unreadCount,
      },
      error: null,
    })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'SERVER_ERROR', message: err.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
