import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Module 3 — List PRs
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'PR list API not yet implemented' } }, { status: 501 })
}

export async function POST() {
  // TODO: Module 4 — Create PR + trigger pipeline
  return NextResponse.json({ data: null, error: { code: 'NOT_IMPLEMENTED', message: 'PR creation API not yet implemented' } }, { status: 501 })
}
