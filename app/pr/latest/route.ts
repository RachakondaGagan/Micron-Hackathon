import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: pr } = await supabase
      .from('purchase_requisitions')
      .select('pr_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pr?.pr_id) {
      return NextResponse.redirect(new URL(`/pipeline?prId=${pr.pr_id}`, request.url))
    }

    return NextResponse.redirect(new URL('/pipeline', request.url))
  } catch (err) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}
