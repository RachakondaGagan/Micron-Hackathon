import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Module 6 — Inventory data
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Inventory API not yet implemented' } }, { status: 501 })
}
