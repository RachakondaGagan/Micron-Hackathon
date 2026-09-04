import { NextResponse } from 'next/server'

export async function POST() {
  // TODO: Module 8 — Create PO on approval
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'PO creation API not yet implemented' } }, { status: 501 })
}
