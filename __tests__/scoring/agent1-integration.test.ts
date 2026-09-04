import { runAgent1 } from '@/lib/agents/agent1'
import type { PurchaseRequisition } from '@/types'

describe('Agent 1 Integration', () => {
  const newPR: PurchaseRequisition = {
    pr_id: 'pr-new-001',
    pr_number: 'PR-2025-9999',
    material_id: 'MAT-8491',
    plant_id: 'PLANT-1002',
    quantity: 1500,
    required_date: '2025-11-15',
    requestor_name: 'Eleanor Vance',
    requestor_email: 'eleanor@procureai.com',
    planner_name: 'System Planner',
    planner_email: 'planner@procureai.com',
    status: 'CREATED',
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  }

  it('handles empty historical PR list cleanly without calling LLM', async () => {
    const result = await runAgent1(newPR, [])
    expect(result.duplicate_detected).toBe(false)
    expect(result.overall_similarity_score).toBe(0)
    expect(result.confidence).toBe('LOW')
    expect(result.matched_pr_id).toBeNull()
  })

  it('detects HIGH duplicate when an identical PR was created recently', async () => {
    const identicalHistoricalPR: PurchaseRequisition = {
      pr_id: 'pr-hist-001',
      pr_number: 'PR-2025-0894',
      material_id: 'MAT-8491',
      plant_id: 'PLANT-1002',
      quantity: 1500,
      required_date: '2025-11-15',
      requestor_name: 'Eleanor Vance',
      requestor_email: 'eleanor@procureai.com',
      planner_name: 'System Planner',
      planner_email: 'planner@procureai.com',
      status: 'UNDER_REVIEW',
      created_at: '2025-11-01T08:00:00Z', // 2 hours earlier
      updated_at: '2025-11-01T08:00:00Z',
    }

    const result = await runAgent1(newPR, [identicalHistoricalPR])
    expect(result.overall_similarity_score).toBeGreaterThanOrEqual(75)
    expect(result.duplicate_detected).toBe(true)
    expect(result.confidence).toBe('HIGH')
    expect(result.matched_pr_id).toBe('pr-hist-001')
    expect(result.explanation).toBeDefined()
    expect(Array.isArray(result.evidence)).toBe(true)
  })

  it('detects LOW similarity for completely different material and plant', async () => {
    const differentPR: PurchaseRequisition = {
      pr_id: 'pr-hist-002',
      pr_number: 'PR-2025-0800',
      material_id: 'MAT-9999',
      plant_id: 'PLANT-9999',
      quantity: 100,
      required_date: '2025-12-30',
      requestor_name: 'Bob Ross',
      requestor_email: 'bob@example.com',
      planner_name: null,
      planner_email: null,
      status: 'APPROVED',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    }

    const result = await runAgent1(newPR, [differentPR])
    expect(result.overall_similarity_score).toBeLessThan(50)
    expect(result.duplicate_detected).toBe(false)
    expect(result.confidence).toBe('LOW')
  })
})
