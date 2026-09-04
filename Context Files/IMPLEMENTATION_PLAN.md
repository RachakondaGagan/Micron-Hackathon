# IMPLEMENTATION_PLAN.md — ProcureAI v1

## Architecture Summary

ProcureAI is a **monolithic Next.js 14 App Router application** deployed on Vercel, backed by Supabase (PostgreSQL), using Groq (`llama-3.3-70b-versatile`) for AI inference. No separate frontend/backend directories — everything runs as a single Next.js project per ADR-003.

---

## Module Dependency Graph

```
MODULE 0 ─→ MODULE 1 ─→ MODULE 2 ─→ MODULE 3 ─→ MODULE 4
                                        │            │
                                        │            ├─→ MODULE 5
                                        │            │      │
                                        │            ├─→ MODULE 6
                                        │            │      │
                                        │            │      ├─→ MODULE 7
                                        │            │      │      │
                                        │            │      └──────┴─→ MODULE 8
                                        │            │                    │
                                        │            │                    ├─→ MODULE 9
                                        │            │                    │      │
                                        │            └────────────────────┴──────┴─→ MODULE 10
                                        │                                              │
                                        │                                              ├─→ MODULE 11
                                        └──────────────────────────────────────────────┴─→ MODULE 12
                                                                                            │
                                                                                            ├─→ MODULE 13
                                                                                            ├─→ MODULE 14
                                                                                            ├─→ MODULE 15
                                                                                            └─→ MODULE 16
```

---

## MODULE 0 — Project Foundation

### Objective
Set up the Next.js project skeleton with all configurations, dependencies, placeholder files, TypeScript types, and the complete folder structure.

### Inputs
- Context Files (ARCHITECTURE.md, DECISIONS.md, ENV_SETUP.md)
- Technology requirements (Next.js 14, Tailwind, shadcn/ui, TypeScript)

### Outputs
- Working `npm run dev` that starts without errors
- All configuration files (package.json, tsconfig.json, tailwind.config.ts, etc.)
- Placeholder pages, API routes, and service files
- Shared TypeScript type definitions
- Zod validation schemas (structure only)
- `.gitignore` with proper exclusions

### Files Involved
| File | Status |
|---|---|
| `package.json` | NEW |
| `tsconfig.json` | NEW |
| `next.config.mjs` | NEW |
| `tailwind.config.ts` | NEW |
| `postcss.config.mjs` | NEW |
| `.gitignore` | NEW |
| `.eslintrc.json` | NEW |
| `jest.config.ts` | NEW |
| `components.json` | NEW |
| `.env.example` | UPDATED |
| `app/layout.tsx` | NEW |
| `app/globals.css` | NEW |
| `app/page.tsx` | NEW (placeholder) |
| `app/pr/new/page.tsx` | NEW (placeholder) |
| `app/pr/[id]/page.tsx` | NEW (placeholder) |
| `app/notifications/page.tsx` | NEW (placeholder) |
| `app/api/dashboard/route.ts` | NEW (501 stub) |
| `app/api/pr/route.ts` | NEW (501 stub) |
| `app/api/pr/[id]/route.ts` | NEW (501 stub) |
| `app/api/notifications/route.ts` | NEW (501 stub) |
| `app/api/notifications/[id]/route.ts` | NEW (501 stub) |
| `app/api/po/route.ts` | NEW (501 stub) |
| `app/api/inventory/route.ts` | NEW (501 stub) |
| `types/index.ts` | NEW |
| `lib/utils.ts` | NEW |
| `lib/supabase.ts` | NEW (placeholder) |
| `lib/groq.ts` | NEW (placeholder) |
| `lib/scoring/agent1-scoring.ts` | NEW (placeholder) |
| `lib/scoring/inventory-check.ts` | NEW (placeholder) |
| `lib/scoring/agent2-scoring.ts` | NEW (placeholder) |
| `lib/scoring/agent3-decision.ts` | NEW (placeholder) |
| `lib/agents/agent1.ts` | NEW (placeholder) |
| `lib/agents/agent2.ts` | NEW (placeholder) |
| `lib/agents/agent3.ts` | NEW (placeholder) |
| `lib/agents/agent4.ts` | NEW (placeholder) |
| `lib/agents/orchestrator.ts` | NEW (placeholder) |
| `lib/agents/prompts.ts` | NEW |
| `lib/validation/pr-validation.ts` | NEW |
| `lib/validation/agent-output-validation.ts` | NEW |
| `lib/notifications/resend.ts` | NEW (placeholder) |

### Dependencies
- None (first module)

### Implementation Steps
1. Create `package.json` with all dependencies
2. Create all configuration files
3. Create app directory structure with placeholder pages
4. Create API route stubs (return 501)
5. Create `types/index.ts` with all DB + agent output types
6. Create Zod validation schemas
7. Create lib placeholder files
8. Create agent prompt constants
9. Run `npm install`
10. Verify `npm run dev` starts

### Testing Requirements
- `npm run dev` starts without TypeScript errors
- All pages render their placeholder text
- API routes return 501 with proper error JSON

### Acceptance Criteria
- [x] All files created
- [ ] `npm install` succeeds
- [ ] `npm run dev` compiles and starts
- [ ] Type definitions match DATABASE_SCHEMA.md exactly
- [ ] No secrets in committed files

### Definition of Done
Application skeleton compiles and runs. All future modules can be implemented by replacing placeholder logic.

---

## MODULE 1 — Supabase Connection

### Objective
Establish a working Supabase client connection. Verify server-side and client-side clients can reach the database.

### Inputs
- Supabase project URL, anon key, service role key (from user's Supabase dashboard)
- `lib/supabase.ts` placeholder

### Outputs
- Working `createServerClient()` that can query tables
- Working `createBrowserClient()` for future client-side reads
- `.env.local` created with real credentials (gitignored)

### Files Involved
| File | Status |
|---|---|
| `lib/supabase.ts` | MODIFY (finalize implementation) |
| `.env.local` | NEW (user-created, gitignored) |
| `app/api/health/route.ts` | NEW (health check endpoint) |

### Dependencies
- MODULE 0 complete
- User has created a Supabase project

### Implementation Steps
1. User provides Supabase credentials
2. Create `.env.local` with real values
3. Finalize `lib/supabase.ts`
4. Create `GET /api/health` endpoint that queries Supabase
5. Test connection

### Testing Requirements
- `GET /api/health` returns `{ status: 'ok', tables: [...] }`
- Server client can list tables
- Env vars are not exposed in client bundle

### Acceptance Criteria
- [ ] Supabase connection established
- [ ] Health endpoint returns success
- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is server-only

### Definition of Done
Supabase is connected and verified. All subsequent modules can use `createServerClient()` for database operations.

---

## MODULE 2 — Database + Seed Data

### Objective
Execute the full database schema migration and populate seed/demo data to support all 4 demo scenarios.

### Inputs
- `Context Files/DATABASE_SCHEMA.md` (migration SQL)
- `TASKS.md` (seed data specifications)
- Supabase SQL Editor access

### Outputs
- 10 tables created with all constraints, indexes, triggers
- RLS policies enabled
- PR/PO number generation functions
- Seed data for 6 materials, 3 plants, 8+ vendors, inventory, forecasts, historical PRs
- 4 demo scenarios ready to test

### Files Involved
| File | Status |
|---|---|
| `database/schema.sql` | REPLACE (full migration SQL from DATABASE_SCHEMA.md) |
| `database/seed.sql` | REPLACE (realistic demo data) |

### Dependencies
- MODULE 1 complete (Supabase connected)

### Implementation Steps
1. Write complete `schema.sql` from DATABASE_SCHEMA.md
2. Write `seed.sql` with demo data supporting all 4 scenarios:
   - Scenario 1: MAT-001 at PLT-01 — duplicate detection (historical PR exists)
   - Scenario 2: MAT-005 at PLT-01 — sufficient inventory → direct APPROVE
   - Scenario 3: MAT-002 at PLT-01 — insufficient inventory → Agent 2 runs
   - Scenario 4: Duplicate + insufficient → REVIEW or REJECT
3. Execute schema.sql in Supabase SQL Editor
4. Execute seed.sql in Supabase SQL Editor
5. Verify all tables and data via health endpoint

### Testing Requirements
- All 10 tables exist with correct columns and types
- Foreign key constraints are enforced
- RLS policies active
- Seed data queryable via API
- `generate_pr_number()` returns `PR-2026-00001` format
- `generate_po_number()` returns `PO-2026-00001` format

### Acceptance Criteria
- [ ] All 10 tables created
- [ ] All constraints and indexes applied
- [ ] RLS enabled on PR, notification, and analysis tables
- [ ] Seed data inserted without errors
- [ ] All 4 demo scenarios have supporting data
- [ ] Inventory levels match scenario requirements

### Definition of Done
Database is fully set up with realistic demo data. All agents will have data to work with.

---

## MODULE 3 — Requestor Dashboard

### Objective
Build the main requestor dashboard page that displays materials, inventory, recent PRs, recent POs, and notifications count.

### Inputs
- `Context Files/API_CONTRACT.md` (GET /api/dashboard spec)
- `Context Files/REQUIREMENTS.md` (FR-01 through FR-07)
- Seed data from Module 2

### Outputs
- `GET /api/dashboard` returning all dashboard data
- Dashboard page with inventory table, PR list, PO list, stats
- Navigation bar with notification bell
- User identity modal (localStorage)

### Files Involved
| File | Status |
|---|---|
| `app/api/dashboard/route.ts` | MODIFY (implement) |
| `app/page.tsx` | MODIFY (implement dashboard) |
| `app/layout.tsx` | MODIFY (add nav bar) |
| `components/dashboard/InventoryTable.tsx` | NEW |
| `components/dashboard/PRList.tsx` | NEW |
| `components/dashboard/POList.tsx` | NEW |
| `components/dashboard/QuickStatsBar.tsx` | NEW |
| `components/NavBar.tsx` | NEW |
| `components/NotificationBell.tsx` | NEW |
| `components/UserIdentityModal.tsx` | NEW |
| `lib/user-context.tsx` | NEW |
| `hooks/useDashboard.ts` | NEW |

### Dependencies
- MODULE 2 complete (database + seed data)

### Implementation Steps
1. Implement `GET /api/dashboard` with all required queries
2. Compute `usable_stock = available_stock - forecasted_demand` server-side
3. Compute `open_po_quantity` from purchase_orders table
4. Create `NavBar` component with links and notification bell
5. Create `UserIdentityModal` for first-visit name/email capture
6. Create `InventoryTable` with stock status indicators
7. Create `PRList` with status badges
8. Create `POList` with vendor and delivery info
9. Create `QuickStatsBar` with summary counts
10. Integrate all into dashboard page

### Testing Requirements
- Dashboard loads in < 3 seconds (NFR-02)
- All inventory data displays correctly
- Usable stock computed correctly
- User identity persists across page refresh
- Navigation links work

### Acceptance Criteria
- [ ] Dashboard shows materials with stock levels
- [ ] Dashboard shows recent PRs with status
- [ ] Dashboard shows recent POs
- [ ] Notification count visible in nav
- [ ] User identity captured and stored
- [ ] "Create PR" button navigates to `/pr/new`

### Definition of Done
Requestor can view the dashboard with all seeded data. Navigation is functional. Identity is captured.

---

## MODULE 4 — Create Purchase Requisition

### Objective
Build the PR creation form and API endpoint. PR is saved to database with status CREATED. Pipeline is NOT triggered yet (that comes in Module 12).

### Inputs
- `Context Files/API_CONTRACT.md` (POST /api/pr spec)
- `Context Files/REQUIREMENTS.md` (FR-08 through FR-11)
- `lib/validation/pr-validation.ts`

### Outputs
- PR creation form with client-side validation
- `POST /api/pr` endpoint with server-side validation
- PR number auto-generation
- PR saved with status CREATED
- Redirect to PR detail page after creation

### Files Involved
| File | Status |
|---|---|
| `app/api/pr/route.ts` | MODIFY (implement POST) |
| `app/pr/new/page.tsx` | MODIFY (implement form) |
| `components/pr/PRForm.tsx` | NEW |
| `lib/validation/pr-validation.ts` | MODIFY (add business rule validation) |

### Dependencies
- MODULE 3 complete (dashboard + navigation)

### Implementation Steps
1. Implement `PRForm` component with material/plant dropdowns, quantity, date, requestor fields
2. Material dropdown fetches active materials
3. Plant dropdown filters to plants mapped to selected material
4. Client-side validation (Zod)
5. Implement `POST /api/pr`:
   - Validate input with Zod
   - Check material exists and is active
   - Check plant exists and is active
   - Check plant_material_mapping exists and is active
   - Generate PR number via `generate_pr_number()`
   - Insert into purchase_requisitions
   - Return 201 with pr_id, pr_number, status
6. Pre-fill requestor name/email from localStorage identity
7. Redirect to `/pr/[id]` after successful creation

### Testing Requirements
- Form validates required fields
- Invalid material/plant combos return 400
- PR number generates correctly
- PR appears in dashboard PR list after creation
- Future date validation works

### Acceptance Criteria
- [ ] Form renders with correct dropdowns
- [ ] Server validates all business rules
- [ ] PR saved to database with CREATED status
- [ ] PR number format: PR-2026-XXXXX
- [ ] Redirect to PR detail page
- [ ] Error messages display for invalid input

### Definition of Done
Users can create purchase requisitions. PRs are validated and stored in the database. They appear on the dashboard.

---

## MODULE 5 — Agent 1: 7-Day PR Matching

### Objective
Implement the complete Agent 1 pipeline: historical PR fetching, deterministic KPI scoring, Groq LLM explanation, and DuplicateResult output.

### Inputs
- `Context Files/AGENTS.md` (Agent 1 specification)
- `Context Files/ARCHITECTURE.md` (Section 6)
- Historical PRs from database

### Outputs
- 6 deterministic KPI score functions (unit tested)
- Weighted overall similarity calculation
- Groq integration for explanation generation
- Valid DuplicateResult JSON output
- Zod validation of LLM output

### Files Involved
| File | Status |
|---|---|
| `lib/scoring/agent1-scoring.ts` | MODIFY (implement all formulas) |
| `lib/agents/agent1.ts` | MODIFY (implement full agent) |
| `lib/agents/prompts.ts` | VERIFY (Agent 1 prompt) |
| `lib/validation/agent-output-validation.ts` | VERIFY (DuplicateResultSchema) |
| `__tests__/scoring/agent1-scoring.test.ts` | NEW |

### Dependencies
- MODULE 4 complete (PRs exist in database)
- GROQ_API_KEY in `.env.local`

### Implementation Steps
1. Implement `calculateMaterialMatch`: exact ID → 0 or 100
2. Implement `calculatePlantMatch`: exact ID → 0 or 100
3. Implement `calculateQuantitySimilarity`: `max(0, round((1 - abs(new - hist) / max(new, hist)) * 100))`
4. Implement `calculateDateSimilarity`: `max(0, round((1 - min(days, 30) / 30) * 100))`
5. Implement `calculateRequestorMatch`: exact email → 0 or 100
6. Implement `calculateTimeGapScore`: `max(0, round((1 - min(hours, 168) / 168) * 100))`
7. Implement `calculateOverallSimilarity`: weighted sum / 23
8. Implement historical PR fetching (last 7 days, all statuses, exclude self)
9. Compute KPIs for each historical PR
10. Select best match (highest overall)
11. Call Groq with scores + PR data for explanation
12. Validate Groq response with Zod
13. Return DuplicateResult
14. Write unit tests for all scoring functions

### Testing Requirements
- Unit tests for all 6 KPIs with edge cases:
  - Same material → 100, different → 0
  - Same quantity → 100, double quantity → 50
  - Same date → 100, 30+ days → 0
  - 0 hours gap → 100, 168+ hours → 0
- Weighted overall: verify sum = 23
- No historical PRs → score 0, no duplicate
- Multiple matches → highest selected
- Groq failure → deterministic fallback

### Acceptance Criteria
- [ ] All 6 KPI formulas correct
- [ ] Weights: material=5, plant=4, qty=3, date=4, requestor=2, time_gap=5
- [ ] Overall score thresholds: ≥75 HIGH, 50-74 MEDIUM, <50 LOW
- [ ] Groq returns valid DuplicateResult
- [ ] Fallback works when Groq fails
- [ ] Unit tests pass

### Definition of Done
Agent 1 can analyze any PR against historical data and produce a valid, Zod-validated DuplicateResult.

---

## MODULE 6 — Deterministic Inventory Check

### Objective
Implement the deterministic inventory check. No LLM. Pure arithmetic.

### Inputs
- `Context Files/AGENTS.md` (Inventory Check specification)
- `Context Files/ARCHITECTURE.md` (Section 7)
- Inventory + forecast data from database

### Outputs
- InventoryResult with SUFFICIENT / AT_RISK / INSUFFICIENT
- `invoke_agent2` boolean flag
- Human-readable explanation (template, no LLM)

### Files Involved
| File | Status |
|---|---|
| `lib/scoring/inventory-check.ts` | MODIFY (implement) |
| `__tests__/scoring/inventory-check.test.ts` | NEW |

### Dependencies
- MODULE 2 complete (inventory + forecast data)

### Implementation Steps
1. Fetch inventory record for material_id + plant_id
2. Fetch nearest future demand forecast
3. Calculate: `usable_stock = available_stock - forecasted_demand`
4. Calculate: `remaining_after_pr = usable_stock - pr_quantity`
5. Classify:
   - `remaining >= safety_stock` → SUFFICIENT
   - `remaining >= 0` → AT_RISK
   - `remaining < 0` → INSUFFICIENT
6. Set `invoke_agent2 = status !== 'SUFFICIENT'`
7. Generate template explanation string
8. Handle edge cases: no inventory record → INSUFFICIENT, no forecast → demand=0

### Testing Requirements
- SUFFICIENT: available=500, safety=100, forecast=100, PR=200 → remaining=200 ≥ 100
- AT_RISK: available=300, safety=250, forecast=50, PR=100 → remaining=-100... wait recalc
- INSUFFICIENT: available=80, safety=150, forecast=30, PR=100 → remaining=-50 < 0
- No inventory record → INSUFFICIENT
- No forecast → demand=0
- available_stock < 0 → treat as 0

### Acceptance Criteria
- [ ] Correct classification for all 3 statuses
- [ ] `invoke_agent2` = true for AT_RISK and INSUFFICIENT
- [ ] `invoke_agent2` = false for SUFFICIENT
- [ ] Explanation string is human-readable
- [ ] No LLM calls
- [ ] Unit tests pass

### Definition of Done
Inventory check function produces correct InventoryResult for all scenarios. It is fully deterministic and unit tested.

---

## MODULE 7 — Agent 2: Vendor Sourcing

### Objective
Implement Agent 2: fetch eligible vendors, compute deterministic scores, call Groq for recommendation explanation, return SourcingResult.

### Inputs
- `Context Files/AGENTS.md` (Agent 2 specification)
- `Context Files/ARCHITECTURE.md` (Section 8)
- Vendor data from database

### Outputs
- 5 vendor scoring functions (unit tested)
- Weighted total score and ranking
- Estimated savings calculation
- Groq integration for recommendation/risk summary
- Valid SourcingResult JSON output

### Files Involved
| File | Status |
|---|---|
| `lib/scoring/agent2-scoring.ts` | MODIFY (implement all formulas) |
| `lib/agents/agent2.ts` | MODIFY (implement full agent) |
| `lib/agents/prompts.ts` | VERIFY (Agent 2 prompt) |
| `__tests__/scoring/agent2-scoring.test.ts` | NEW |

### Dependencies
- MODULE 6 complete (inventory check determines whether Agent 2 runs)
- GROQ_API_KEY available

### Implementation Steps
1. Implement `calculatePriceScore`: `(max - vendor) / (max - min) * 100`
2. Implement `calculateLeadTimeScore`: `(max - vendor) / (max - min) * 100`
3. Implement `calculateLocationScore`: same city=100, same region=50, else=0
4. Implement `calculateQualityScore`: `(rating - 1) / 4 * 100`
5. Implement `calculateOnTimeDeliveryScore`: direct percentage
6. Implement `calculateTotalVendorScore`: weighted sum (30/25/20/15/10)
7. Implement `estimateSavings`: compare #1 vs #2 vendor price
8. Fetch active vendors for material, compute all scores, sort descending
9. Call Groq with ranked data for explanation
10. Validate with Zod
11. Handle: no vendors → `no_vendors_found: true`
12. Handle: single vendor → "sole source" note

### Testing Requirements
- Price: lowest=100, highest=0, all same=100
- Lead time: fastest=100, slowest=0
- Location: exact city match, region match, no match
- Quality: rating 1→0, rating 5→100
- OTD: percentage direct
- Total: weights sum to 100%
- Savings: positive savings, negative savings, single vendor
- Unit tests for all formulas

### Acceptance Criteria
- [ ] All 5 vendor scores correct (0-100)
- [ ] Weights: Price 30%, Lead 25%, Location 20%, Quality 15%, OTD 10%
- [ ] Vendors ranked descending by total score
- [ ] Savings calculated when 2+ vendors
- [ ] Groq generates recommendation and risks
- [ ] `no_vendors_found` handled
- [ ] Unit tests pass

### Definition of Done
Agent 2 can rank vendors for any material and produce a valid, Zod-validated SourcingResult.

---

## MODULE 8 — Agent 3: Final Decision

### Objective
Implement Agent 3: combine all prior results, apply business rules for preliminary decision, call Groq for explanation, return DecisionResult. Create PO on APPROVE when sourcing was needed.

### Inputs
- `Context Files/AGENTS.md` (Agent 3 specification)
- DuplicateResult, InventoryResult, SourcingResult (optional)

### Outputs
- Deterministic preliminary decision function (unit tested)
- APPROVE / REVIEW / REJECT with business rule enforcement
- LLM cannot downgrade REJECT to APPROVE (safety check)
- PO creation on APPROVE with recommended vendor
- Valid DecisionResult JSON output

### Files Involved
| File | Status |
|---|---|
| `lib/scoring/agent3-decision.ts` | MODIFY (implement) |
| `lib/agents/agent3.ts` | MODIFY (implement full agent) |
| `app/api/po/route.ts` | MODIFY (implement PO creation) |
| `lib/agents/prompts.ts` | VERIFY (Agent 3 prompt) |
| `__tests__/scoring/agent3-decision.test.ts` | NEW |

### Dependencies
- MODULE 5 (Agent 1 output)
- MODULE 6 (Inventory output)
- MODULE 7 (Agent 2 output, when applicable)

### Implementation Steps
1. Implement `computePreliminaryDecision`:
   - REJECT: similarity ≥ 75 + matched PR is APPROVED/PO_CREATED/COMPLETED
   - REVIEW: similarity ≥ 75 + matched PR is CREATED/UNDER_REVIEW
   - REVIEW: similarity 50-74 + INSUFFICIENT
   - REVIEW: no vendors found + INSUFFICIENT
   - APPROVE: otherwise
2. Assign risk_level: REJECT→HIGH, REVIEW→MEDIUM, APPROVE→LOW
3. Call Groq with all data + preliminary decision
4. Validate Groq output with Zod
5. Safety check: if Groq returns APPROVE but prelim was REJECT → override to REJECT
6. Implement PO creation logic:
   - If APPROVE + sourcing needed: insert purchase_orders with recommended vendor
   - Generate PO number via `generate_po_number()`
7. Write comprehensive unit tests for all decision paths

### Testing Requirements
- All decision rule combinations from AGENTS.md thresholds table
- REJECT override safety check
- PO creation with correct vendor, price, delivery date
- No PO when inventory sufficient (no sourcing needed)
- Groq failure → use deterministic decision with template reason
- Unit tests for all paths

### Acceptance Criteria
- [ ] All APPROVE/REVIEW/REJECT rules match AGENTS.md
- [ ] LLM cannot downgrade REJECT
- [ ] PO created on APPROVE + sourcing
- [ ] PO number format: PO-2026-XXXXX
- [ ] Risk levels assigned correctly
- [ ] Unit tests pass for all decision paths

### Definition of Done
Agent 3 produces correct, auditable decisions for all scenarios. POs are created when appropriate.

---

## MODULE 9 — Agent 4: Notifications

### Objective
Implement Agent 4: create in-app notification records in the database and optionally send email via Resend.

### Inputs
- `Context Files/AGENTS.md` (Agent 4 specification)
- DecisionResult from Agent 3
- PR data

### Outputs
- Notification record in database
- Correct recipient routing (requestor vs planner)
- Optional Resend email (non-blocking)
- Notifications API endpoints (GET list, PATCH mark-as-read)

### Files Involved
| File | Status |
|---|---|
| `lib/agents/agent4.ts` | MODIFY (implement) |
| `lib/notifications/resend.ts` | MODIFY (implement) |
| `app/api/notifications/route.ts` | MODIFY (implement GET) |
| `app/api/notifications/[id]/route.ts` | MODIFY (implement PATCH) |
| `app/notifications/page.tsx` | MODIFY (implement UI) |
| `components/NotificationBell.tsx` | MODIFY (implement) |

### Dependencies
- MODULE 8 complete (DecisionResult available)

### Implementation Steps
1. Implement recipient logic:
   - APPROVE → requestor
   - REVIEW → planner (fallback to requestor)
   - REJECT → requestor
2. Generate notification message from decision + PR data
3. Insert notification record with status PENDING
4. If `RESEND_API_KEY` configured:
   - Try sending email
   - On success: update status to SENT
   - On failure: update status to EMAIL_FAILED, log error, continue
5. Implement `GET /api/notifications` with email filter
6. Implement `PATCH /api/notifications/:id` to mark as READ
7. Implement notifications page UI
8. Implement NotificationBell with unread count

### Testing Requirements
- Notification created for each decision type
- Correct recipient for each decision
- Email failure does not throw
- Mark-as-read updates status + read_at
- Unread count accurate

### Acceptance Criteria
- [ ] In-app notification always created
- [ ] Correct recipient per decision type
- [ ] Email sent when Resend configured
- [ ] Email failure is non-blocking
- [ ] GET notifications returns user's notifications
- [ ] PATCH marks notification as read
- [ ] Notification bell shows unread count

### Definition of Done
Notifications are created for every decision. Email is optional and non-blocking. Users can view and dismiss notifications.

---

## MODULE 10 — Dashboard Result / Status Updates

### Objective
Build the PR detail page that shows the full AI analysis pipeline results, and update the dashboard to reflect PR status changes.

### Inputs
- `Context Files/API_CONTRACT.md` (GET /api/pr/:id spec)
- `Context Files/REQUIREMENTS.md` (FR-05, FR-07, NFR-15, NFR-16)
- Analysis data from ai_pr_analysis table

### Outputs
- PR detail page with all analysis panels
- Pipeline status indicator (polling)
- KPI score breakdown visualization
- Vendor ranking table (if Agent 2 ran)
- Decision banner with color coding
- PO info card (if created)
- Dashboard PR list with updated statuses

### Files Involved
| File | Status |
|---|---|
| `app/api/pr/[id]/route.ts` | MODIFY (implement) |
| `app/api/pr/route.ts` | MODIFY (implement GET for list) |
| `app/pr/[id]/page.tsx` | MODIFY (implement detail view) |
| `components/analysis/DuplicateAnalysisPanel.tsx` | NEW |
| `components/analysis/InventoryPanel.tsx` | NEW |
| `components/analysis/VendorRankingTable.tsx` | NEW |
| `components/analysis/DecisionBanner.tsx` | NEW |
| `components/analysis/ReasoningPanel.tsx` | NEW |
| `components/analysis/KPIScoreBreakdown.tsx` | NEW |
| `components/analysis/PipelineStatus.tsx` | NEW |
| `components/pr/PRInfoCard.tsx` | NEW |
| `components/pr/POInfoCard.tsx` | NEW |
| `hooks/usePRDetail.ts` | NEW |

### Dependencies
- MODULES 5-9 complete (analysis data exists)

### Implementation Steps
1. Implement `GET /api/pr/:id` with PR + analysis + PO data
2. Implement `GET /api/pr` for filtered PR list
3. Create PRInfoCard showing PR details
4. Create PipelineStatus showing agent progress
5. Create DuplicateAnalysisPanel with KPI score bars
6. Create KPIScoreBreakdown with visual progress bars per KPI
7. Create InventoryPanel showing stock data and status
8. Create VendorRankingTable (conditional on Agent 2 execution)
9. Create DecisionBanner (APPROVE=green, REVIEW=yellow, REJECT=red)
10. Create ReasoningPanel showing LLM explanation and evidence
11. Create POInfoCard showing PO details (if created)
12. Implement polling: page polls `/api/pr/:id` every 3s until analysis available (max 60s)
13. Update dashboard PR list to show current statuses and decisions

### Testing Requirements
- PR detail page renders all panels
- Polling works during pipeline execution
- All panels handle null data gracefully
- KPI scores displayed with correct values
- Vendor table shows when Agent 2 ran, hidden when not
- Decision banner colors correct

### Acceptance Criteria
- [ ] PR detail shows full analysis
- [ ] KPI scores displayed with visual bars
- [ ] Vendor ranking table shows when applicable
- [ ] Decision banner shows APPROVE/REVIEW/REJECT with color
- [ ] LLM reasoning visible
- [ ] PO details shown when created
- [ ] Polling works for in-progress analysis
- [ ] Dashboard PR list updated with statuses

### Definition of Done
Users can view the complete AI analysis for any PR. All pipeline results are visible and the reasoning is transparent.

---

## MODULE 11 — Resend Email Integration

### Objective
Complete the Resend email integration for Agent 4 notifications.

### Inputs
- Resend API key (from user)
- Decision + PR data for email content

### Outputs
- Email templates for APPROVE, REVIEW, REJECT
- Resend API integration
- Email delivery status tracking

### Files Involved
| File | Status |
|---|---|
| `lib/notifications/resend.ts` | MODIFY (full implementation) |
| `lib/notifications/email-templates.ts` | NEW |

### Dependencies
- MODULE 9 complete (notification infrastructure)
- RESEND_API_KEY configured (optional — module is skippable)

### Implementation Steps
1. Create HTML email templates for each decision type
2. Implement Resend API call with retry logic
3. Update notification status: SENT or EMAIL_FAILED
4. Include PR detail link in email

### Testing Requirements
- Email sends when key configured
- Email fails gracefully when key missing
- Template renders correctly

### Acceptance Criteria
- [ ] Email sent on APPROVE/REVIEW/REJECT
- [ ] Failure does not break pipeline
- [ ] Email content matches decision

### Definition of Done
Resend emails work when configured. System operates normally when not configured.

---

## MODULE 12 — Integration (Pipeline Orchestrator)

### Objective
Wire all agents into the sequential pipeline orchestrator and connect it to PR creation.

### Inputs
- All agent functions (Modules 5-9)
- `lib/agents/orchestrator.ts`

### Outputs
- Complete `runPRPipeline(prId)` function
- PR status transitions (CREATED → UNDER_REVIEW → APPROVED/REJECTED/PO_CREATED)
- Error handling at each stage
- Pipeline results stored in ai_pr_analysis
- PR creation triggers pipeline automatically

### Files Involved
| File | Status |
|---|---|
| `lib/agents/orchestrator.ts` | MODIFY (full implementation) |
| `app/api/pr/route.ts` | MODIFY (trigger pipeline after PR creation) |

### Dependencies
- MODULES 5-9 complete (all agents)
- MODULE 4 (PR creation)

### Implementation Steps
1. Implement `runPRPipeline(prId)`:
   - Fetch PR + material + plant data
   - Update PR status to UNDER_REVIEW
   - Run Agent 1 (duplicate detection)
   - Run inventory check
   - If inventory not SUFFICIENT: run Agent 2
   - Run Agent 3 (decision)
   - If APPROVE + sourcing: create PO, update status to PO_CREATED
   - Run Agent 4 (notification)
   - Update PR status to final state
   - Upsert all results to ai_pr_analysis
2. Wrap each step in try/catch — log errors, continue where possible
3. Store `pipeline_error` if any step fails
4. Connect pipeline to `POST /api/pr` (fire-and-forget after 201 response)
5. Test all 4 demo scenarios end-to-end

### Testing Requirements
- Full pipeline executes for all 4 scenarios
- PR status transitions correctly
- Results stored in ai_pr_analysis
- Groq failures handled gracefully
- Pipeline completes within 30 seconds (NFR-01)

### Acceptance Criteria
- [ ] Pipeline runs end-to-end
- [ ] All 4 demo scenarios produce expected results
- [ ] PR status updates correctly at each stage
- [ ] ai_pr_analysis populated with all results
- [ ] Error handling prevents pipeline crashes
- [ ] Pipeline triggered automatically on PR creation

### Definition of Done
The complete AI pipeline works end-to-end. Creating a PR triggers the full agent chain and results are visible on the PR detail page.

---

## MODULE 13 — Playwright Testing

### Objective
Write end-to-end Playwright tests for the 3 main user journeys.

### Inputs
- Seed data from Module 2
- All implemented features

### Outputs
- Playwright test suite
- CI-runnable tests

### Files Involved
| File | Status |
|---|---|
| `e2e/main-flow.spec.ts` | NEW |
| `playwright.config.ts` | NEW |

### Dependencies
- MODULE 12 complete (full pipeline working)

### Implementation Steps
1. Configure Playwright
2. Test scenario 1: Create PR → see decision result
3. Test scenario 2: Create duplicate PR → see high similarity warning
4. Test scenario 3: Create PR with insufficient stock → see vendor ranking
5. Verify dashboard updates after PR creation

### Testing Requirements
- All 3 E2E scenarios pass
- Tests run in < 2 minutes total
- Tests are deterministic with seeded data

### Acceptance Criteria
- [ ] 3 E2E test scenarios pass
- [ ] Tests can run in CI
- [ ] No flaky tests

### Definition of Done
E2E test suite validates the main user journeys. All tests pass consistently.

---

## MODULE 14 — UI Polish

### Objective
Refine the UI based on the Stitch design reference (when provided). Add loading states, transitions, responsive layout, accessibility.

### Inputs
- Stitch UI design reference (to be provided)
- Existing functional UI from Modules 3, 4, 10

### Outputs
- Polished, production-quality UI
- Responsive layout
- Loading states and transitions
- Accessible components

### Files Involved
- All component files
- `app/globals.css`

### Dependencies
- MODULE 12 complete (functional app)
- Stitch design reference provided

### Implementation Steps
1. Apply Stitch design colors, spacing, typography
2. Add loading skeletons for async data
3. Add success/error toasts
4. Ensure responsive layout (mobile + desktop)
5. Add keyboard navigation and ARIA labels
6. Polish decision banner animations
7. Polish score bar animations

### Acceptance Criteria
- [ ] UI matches Stitch design reference
- [ ] Responsive on mobile and desktop
- [ ] All loading states handled
- [ ] Accessible (keyboard navigable)
- [ ] Clean, minimal, modern appearance

### Definition of Done
UI is production-quality and matches the design reference.

---

## MODULE 15 — Production Build

### Objective
Verify the application builds for production without errors.

### Inputs
- Complete application code

### Outputs
- Clean `next build` output
- No TypeScript errors
- No lint errors
- Bundle size reasonable

### Files Involved
- All source files

### Dependencies
- MODULE 14 complete

### Implementation Steps
1. Run `npm run build`
2. Fix any TypeScript errors
3. Fix any lint errors
4. Verify no secrets in client bundle
5. Check bundle size

### Acceptance Criteria
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Secrets not in client bundle

### Definition of Done
Application builds cleanly for production deployment.

---

## MODULE 16 — Vercel Deployment

### Objective
Deploy the application to Vercel and verify all features work in production.

### Inputs
- Production build from Module 15
- GitHub repository
- Vercel account

### Outputs
- Live production URL
- All environment variables configured
- All 4 demo scenarios working

### Files Involved
| File | Status |
|---|---|
| `vercel.json` | NEW (if needed) |

### Dependencies
- MODULE 15 complete

### Implementation Steps
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy
4. Run smoke test on production URL
5. Verify all 4 demo scenarios

### Acceptance Criteria
- [ ] Production URL accessible
- [ ] All features work in production
- [ ] Environment variables not exposed
- [ ] All 4 demo scenarios pass

### Definition of Done
Application is live on Vercel. All demo scenarios work end-to-end on the production URL.
