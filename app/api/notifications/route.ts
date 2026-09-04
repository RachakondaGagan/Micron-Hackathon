import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Module 9 — Notifications list
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Notifications API not yet implemented' } }, { status: 501 })
}
