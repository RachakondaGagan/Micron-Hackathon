import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Module 10 — PR detail + analysis
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'PR detail API not yet implemented' } }, { status: 501 })
}
