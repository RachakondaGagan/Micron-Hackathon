import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const notificationId = params.id

    const { data: updated, error } = await supabase
      .from('notifications')
      .update({
        status: 'READ',
        read_at: new Date().toISOString(),
      })
      .eq('notification_id', notificationId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: 'UPDATE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updated, error: null })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'SERVER_ERROR', message: err.message || 'Unknown error' } },
      { status: 500 }
    )
  }
}
