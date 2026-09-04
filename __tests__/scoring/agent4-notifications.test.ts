import { runAgent4 } from '@/lib/agents/agent4'
import type { PurchaseRequisition, DecisionResult } from '@/types'

describe('Agent 4 — Notifications (Module 9)', () => {
  const pr: PurchaseRequisition = {
    pr_id: 'pr-test-100',
    pr_number: 'PR-2025-0894',
    material_id: 'MAT-8491',
    plant_id: 'PLT-01',
    quantity: 500,
    required_date: '2025-12-01',
    requestor_name: 'Eleanor Vance',
    requestor_email: 'eleanor@procureai.com',
    planner_name: 'David Keller',
    planner_email: 'david.keller@procureai.com',
    status: 'CREATED',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  }

  // Mock Supabase client to test without hitting network
  const createMockSupabase = () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { notification_id: 'notif-mock-123' },
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  })

  it('routes APPROVE notification to the requestor', async () => {
    const mockSupabase = createMockSupabase()
    const decision: DecisionResult = {
      decision: 'APPROVE',
      reason: 'Sufficient internal inventory available.',
      risk_level: 'LOW',
      key_evidence: ['Stock exceeds threshold'],
      recommended_next_step: 'Fulfill internally from plant storage.',
    }

    const result = await runAgent4(pr, decision, mockSupabase)

    expect(result.recipient_email).toBe('eleanor@procureai.com')
    expect(result.recipient_type).toBe('REQUESTOR')
    expect(result.message).toContain('APPROVED')
    expect(result.message).toContain('Fulfill internally from plant storage.')
    expect(result.in_app_created).toBe(true)
  })

  it('routes REVIEW notification to the planner (primary recipient)', async () => {
    const mockSupabase = createMockSupabase()
    const decision: DecisionResult = {
      decision: 'REVIEW',
      reason: 'Requisition requires buyer review due to potential duplicate.',
      risk_level: 'MEDIUM',
      key_evidence: ['Similarity 68%'],
      recommended_next_step: 'Escalate to Senior Buyer queue.',
    }

    const result = await runAgent4(pr, decision, mockSupabase)

    expect(result.recipient_email).toBe('david.keller@procureai.com')
    expect(result.recipient_type).toBe('PLANNER')
    expect(result.message).toContain('requires review')
    expect(result.in_app_created).toBe(true)
  })

  it('routes REJECT notification to the requestor with reason', async () => {
    const mockSupabase = createMockSupabase()
    const decision: DecisionResult = {
      decision: 'REJECT',
      reason: 'Duplicate of approved order PR-2025-0800.',
      risk_level: 'HIGH',
      key_evidence: ['Similarity 92%'],
      recommended_next_step: 'Cancel requisition.',
    }

    const result = await runAgent4(pr, decision, mockSupabase)

    expect(result.recipient_email).toBe('eleanor@procureai.com')
    expect(result.recipient_type).toBe('REQUESTOR')
    expect(result.message).toContain('rejected')
    expect(result.message).toContain('Duplicate of approved order')
    expect(result.in_app_created).toBe(true)
  })

  it('falls back to requestor for REVIEW if no planner is assigned', async () => {
    const mockSupabase = createMockSupabase()
    const prNoPlanner: PurchaseRequisition = {
      ...pr,
      planner_name: null,
      planner_email: null,
    }

    const decision: DecisionResult = {
      decision: 'REVIEW',
      reason: 'No vendors available.',
      risk_level: 'MEDIUM',
      key_evidence: [],
      recommended_next_step: 'Review sourcing.',
    }

    const result = await runAgent4(prNoPlanner, decision, mockSupabase)
    expect(result.recipient_email).toBe('eleanor@procureai.com')
    expect(result.recipient_type).toBe('PLANNER')
  })
})
