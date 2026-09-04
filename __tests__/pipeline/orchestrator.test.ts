import { runPRPipeline } from '@/lib/agents/orchestrator'
import * as agent1Module from '@/lib/agents/agent1'
import * as inventoryModule from '@/lib/scoring/inventory-check'
import * as agent2Module from '@/lib/agents/agent2'
import * as agent3Module from '@/lib/agents/agent3'
import * as agent4Module from '@/lib/agents/agent4'
import * as supabaseModule from '@/lib/supabase'

jest.mock('@/lib/supabase')
jest.setTimeout(15000)

describe('Module 10 — Pipeline Orchestrator (runPRPipeline)', () => {
  const mockPR = {
    pr_id: 'test-pr-001',
    pr_number: 'PR-2026-00001',
    material_id: 'MAT-001',
    plant_id: 'PLT-01',
    quantity: 100,
    required_date: '2026-03-20',
    requestor_name: 'Gagan Rachakonda',
    requestor_email: 'gaganrachakonda.work@gmail.com',
    planner_name: null,
    planner_email: null,
    status: 'CREATED',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockPlant = {
    plant_id: 'PLT-01',
    location: 'Chicago, IL',
  }

  const mockDuplicateResult: any = {
    duplicate_detected: false,
    overall_similarity_score: 15,
    confidence: 'LOW',
    matched_pr_id: null,
    explanation: 'Clean requisition',
    evidence: [],
    recommended_action: 'Proceed',
  }

  const mockInventorySufficient: any = {
    status: 'SUFFICIENT',
    available_stock: 500,
    safety_stock: 100,
    forecasted_demand: 50,
    usable_stock: 450,
    pr_quantity: 100,
    remaining_after_pr: 350,
    explanation: 'Stock is sufficient',
    invoke_agent2: false,
  }

  const mockInventoryInsufficient: any = {
    status: 'INSUFFICIENT',
    available_stock: 50,
    safety_stock: 100,
    forecasted_demand: 50,
    usable_stock: 0,
    pr_quantity: 100,
    remaining_after_pr: -100,
    explanation: 'Stock deficit',
    invoke_agent2: true,
  }

  const mockSourcingResult: any = {
    recommended_vendor_id: 'VND-001',
    recommended_vendor_name: 'Precision Seal Co.',
    ranked_vendors: [
      {
        rank: 1,
        vendor_id: 'VND-001',
        vendor_name: 'Precision Seal Co.',
        unit_price: 45,
        total_score: 88,
      },
    ],
    estimated_savings: 420,
    sourcing_risks: [],
    explanation: 'Optimal vendor',
    trade_off_summary: 'Best lead time',
    no_vendors_found: false,
  }

  const mockDecisionApprove: any = {
    decision: 'APPROVE',
    reason: 'Approved for procurement',
    risk_level: 'LOW',
    key_evidence: ['Sufficient stock'],
    recommended_next_step: 'Proceed',
    created_po: null,
  }

  const mockDecisionPO: any = {
    decision: 'APPROVE',
    reason: 'Approved with vendor order',
    risk_level: 'LOW',
    key_evidence: ['Vendor selected'],
    recommended_next_step: 'Dispatch PO',
    created_po: { po_id: 'po-123', po_number: 'PO-2026-00001' },
  }

  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'purchase_requisitions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            neq: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({ data: mockPR, error: null }),
            update: jest.fn().mockReturnThis(),
          }
        }
        if (table === 'plant_master') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockPlant, error: null }),
          }
        }
        if (table === 'vendor_master') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: jest.fn((cb) => cb({ data: [{ vendor_id: 'VND-001' }], error: null })),
          }
        }
        if (table === 'ai_pr_analysis') {
          return {
            upsert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { pr_id: 'test-pr-001' }, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    }

    ;(supabaseModule.createServerClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  test('bypasses Agent 2 when inventory is SUFFICIENT', async () => {
    jest.spyOn(agent1Module, 'runAgent1').mockResolvedValue(mockDuplicateResult)
    jest.spyOn(inventoryModule, 'runInventoryCheck').mockResolvedValue(mockInventorySufficient)
    const runAgent2Spy = jest.spyOn(agent2Module, 'runAgent2').mockResolvedValue(mockSourcingResult)
    jest.spyOn(agent3Module, 'runAgent3').mockResolvedValue(mockDecisionApprove)
    jest.spyOn(agent4Module, 'runAgent4').mockResolvedValue({} as any)

    const result = await runPRPipeline('test-pr-001')

    expect(result.success).toBe(true)
    expect(result.pr_status).toBe('APPROVED')
    expect(runAgent2Spy).not.toHaveBeenCalled()
  })

  test('executes Agent 2 and creates PO when inventory is INSUFFICIENT and approved', async () => {
    jest.spyOn(agent1Module, 'runAgent1').mockResolvedValue(mockDuplicateResult)
    jest.spyOn(inventoryModule, 'runInventoryCheck').mockResolvedValue(mockInventoryInsufficient)
    const runAgent2Spy = jest.spyOn(agent2Module, 'runAgent2').mockResolvedValue(mockSourcingResult)
    jest.spyOn(agent3Module, 'runAgent3').mockResolvedValue(mockDecisionPO)
    jest.spyOn(agent4Module, 'runAgent4').mockResolvedValue({} as any)

    const result = await runPRPipeline('test-pr-001')

    expect(result.success).toBe(true)
    expect(runAgent2Spy).toHaveBeenCalled()
    expect(result.pr_status).toBe('PO_CREATED')
    expect(result.created_po).toBeDefined()
  })
})
