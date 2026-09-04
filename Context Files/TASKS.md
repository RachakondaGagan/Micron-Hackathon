**# TASKS.md — ProcureAI v1 Implementation ## Implementation Order Dependencies flow top to bottom. Do not start a phase until prior phases are complete. --- 
## PHASE 1 — Project Setup

### T1.1 — Initialize Next.js Project ****Objective:**** Create the project skeleton ****Files:**** `package.json`, `next.config.ts`, `tsconfig.json`, `.gitignore` ****Dependencies:**** None ******Steps:****** 
```
bash npx create-next-app@latest procurement-ai --typescript --tailwind --app --eslint cd procurement-ai ```
 ****Acceptance:**** `npm run dev` starts without errors

### T1.2 — Install Dependencies ****Objective:**** Add all required packages ****Files:**** `package.json` ****Dependencies:**** T1.1 ****Packages:**** 
```
bash npm install @supabase/supabase-js groq-sdk resend zod lucide-react date-fns npx shadcn@latest init npx shadcn@latest add button card badge input label select textarea table dialog progress alert tabs separator ```
 ****Acceptance:**** All imports resolve; no peer dependency errors

### T1.3 — Environment Setup ****Objective:**** Configure environment variables ****Files:**** `.env.local`, `.env.example`, `.gitignore` ****Dependencies:**** T1.1 ****Acceptance:**** `.env.local` in `.gitignore`; `.env.example` committed to Git

### T1.4 — Supabase Project Setup ****Objective:**** Create Supabase project and get credentials ****Files:**** `.env.local` ****Dependencies:**** T1.3 ******Steps:****** Create project at supabase.com, copy URL and keys ****Acceptance:**** Supabase client connects successfully from Next.js

### T1.5 — Project Structure ****Objective:**** Create folder structure ****Files:**** All directories ****Dependencies:**** T1.1 ```
 /app /api /dashboard/route.ts /pr/route.ts /pr/[id]/route.ts /notifications/route.ts /notifications/[id]/route.ts /po/route.ts /inventory/route.ts /pr/new/page.tsx /pr/[id]/page.tsx /notifications/page.tsx page.tsx (dashboard) layout.tsx /components /ui (shadcn) /dashboard /pr /analysis /lib /supabase.ts /groq.ts /scoring /agent1-scoring.ts /inventory-check.ts /agent2-scoring.ts /agent3-decision.ts /agents /agent1.ts /agent2.ts /agent3.ts /agent4.ts /orchestrator.ts /validation /pr-validation.ts /agent-output-validation.ts /notifications /resend.ts /utils.ts /types /index.ts ```
 ****Acceptance:**** All directories created; TypeScript compiles --- 
## PHASE 2 — Database

### T2.1 — Run Migration SQL ****Objective:**** Create all 10 tables in Supabase ****Files:**** `supabase/migrations/001_initial_schema.sql` ****Dependencies:**** T1.4 ******Steps:****** Paste migration SQL from DATABASE_SCHEMA.md into Supabase SQL Editor ****Acceptance:**** All 10 tables exist; all constraints applied; RLS enabled

### T2.2 — Supabase Client Library ****Objective:**** Create server-side and client-side Supabase clients ****Files:**** `/lib/supabase.ts` ****Dependencies:**** T2.1 
```
typescript // Server client (uses SERVICE_ROLE_KEY — never exposed to browser) export const createServerClient = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) // Browser client (uses ANON_KEY — safe) export const createBrowserClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!) ```
 ****Acceptance:**** Both clients instantiate without errors; service client can query tables

### T2.3 — TypeScript Types from Schema ****Objective:**** Define TypeScript interfaces matching all database tables ****Files:**** `/types/index.ts` ****Dependencies:**** T2.1 ****Acceptance:**** All DB types defined; used by API routes without cast errors --- 
## PHASE 3 — Seed / Demo Data

### T3.1 — Seed Master Data ****Objective:**** Insert realistic demo data for all 4 scenarios ****Files:**** `supabase/seed.sql` ****Dependencies:**** T2.1 ****Materials (6):****
- MAT-001: Industrial Pump Seals (SPARE_PART)
- MAT-002: Hydraulic Fluid (CONSUMABLE)
- MAT-003: Steel Pipe 2-inch (RAW_MATERIAL)
- MAT-004: Control Valve (EQUIPMENT)
- MAT-005: Safety Gloves (CONSUMABLE)
- MAT-006: Bearing Assembly (SPARE_PART) ****Plants (3):****
- PLT-01: North Plant, Chicago, IL
- PLT-02: South Plant, Houston, TX
- PLT-03: East Plant, Newark, NJ ****Plant-Material Mappings:**** All materials mapped to PLT-01 and PLT-02 ****Vendors (8):**** 2 vendors per key material, varying price/lead/quality/location ****Inventory:**** Configured to support all 4 demo scenarios:
- MAT-001 at PLT-01: available=500, safety=100 → SUFFICIENT
- MAT-002 at PLT-01: available=80, safety=150 → INSUFFICIENT
- MAT-003 at PLT-01: available=300, safety=250 → AT_RISK ****Demand Forecasts:**** 2 months of forecasts for each material/plant combo ****Historical PRs (for Scenario 1 duplicate detection):****
- PR for MAT-001 at PLT-01, qty=200, created 2 days ago → triggers duplicate ****Acceptance:**** All seed data inserts without errors; demo scenarios visible in DB

### T3.2 — Verify Demo Scenarios ****Objective:**** Confirm seed data produces expected agent behavior ****Files:**** Documentation check ****Dependencies:**** T3.1 ****Acceptance:****
- Scenario 1: MAT-001 PR creates duplicate alert (score ≥ 75)
- Scenario 2: MAT-005 PR → SUFFICIENT → APPROVE
- Scenario 3: MAT-002 PR → INSUFFICIENT → Agent 2 runs → vendor ranked
- Scenario 4: Duplicate + insufficient → REVIEW or REJECT --- 
## PHASE 4 — Backend Business Logic

### T4.1 — Input Validation ****Objective:**** Zod schemas for all API request bodies ****Files:**** `/lib/validation/pr-validation.ts` ****Dependencies:**** T1.2, T2.3 
```
typescript export const CreatePRSchema = z.object({ material_id: z.string().min(1), plant_id: z.string().min(1), quantity: z.number().positive(), required_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), requestor_name: z.string().min(1).max(100), requestor_email: z.string().email(), planner_name: z.string().max(100).optional(), planner_email: z.string().email().optional(), }) ```
 ****Acceptance:**** Invalid inputs return 400 with clear error messages

### T4.2 — Agent Output Validation ****Objective:**** Zod schemas for all LLM outputs ****Files:**** `/lib/validation/agent-output-validation.ts` ****Dependencies:**** T1.2 Define schemas for: - DuplicateResultSchema - InventoryResultSchema (not LLM, but validate programmatic output)
- SourcingResultSchema - DecisionResultSchema ****Acceptance:**** Zod parse throws on invalid LLM output; fallback behavior tested

### T4.3 — PR API Route ****Objective:**** POST /api/pr endpoint ****Files:**** `/app/api/pr/route.ts` ****Dependencies:**** T4.1, T2.2 ****Acceptance:**** PR created in DB; pipeline triggered async; 201 returned

### T4.4 — Dashboard API Route ****Objective:**** GET /api/dashboard endpoint ****Files:**** `/app/api/dashboard/route.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Returns all required fields; usable_stock computed correctly

### T4.5 — PR Detail API Route ****Objective:**** GET /api/pr/:id endpoint ****Files:**** `/app/api/pr/[id]/route.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Returns PR + analysis + PO data; null analysis when pipeline running

### T4.6 — Notifications API Routes ****Objective:**** GET and PATCH notification endpoints ****Files:**** `/app/api/notifications/route.ts`, `/app/api/notifications/[id]/route.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Notifications fetched and marked read correctly --- 
## PHASE 5 — Agent 1

### T5.1 — Historical PR Fetching ****Objective:**** Query all PRs from last 7 days regardless of status ****Files:**** `/lib/agents/agent1.ts` ****Dependencies:**** T2.2 
```
typescript const sevenDaysAgo = new Date(Date.now() - 7 \* 24 \* 60 \* 60 \* 1000) const { data } = await supabase .from('purchase_requisitions') .select('\*') .gte('created_at', sevenDaysAgo.toISOString()) .neq('pr_id', newPR.pr_id)  // exclude the new PR itself ```
 ****Acceptance:**** Returns PRs of ALL statuses; excludes new PR itself

### T5.2 — KPI Score Calculations ****Objective:**** Implement all 6 deterministic KPI formulas ****Files:**** `/lib/scoring/agent1-scoring.ts` ****Dependencies:**** None (pure functions) ****Functions:****
- `calculateMaterialMatch(newPR, histPR): number`
- `calculatePlantMatch(newPR, histPR): number`
- `calculateQuantitySimilarity(newPR, histPR): number`
- `calculateDateSimilarity(newPR, histPR): number`
- `calculateRequestorMatch(newPR, histPR): number`
- `calculateTimeGapScore(newPR, histPR): number`
- `calculateOverallSimilarity(scores): number` ****Acceptance:**** Unit tested (see Phase 12); all scores 0-100; weights sum to 23

### T5.3 — Agent 1 Groq Integration ****Objective:**** Call Groq with computed scores; parse structured JSON response ****Files:**** `/lib/agents/agent1.ts`, `/lib/groq.ts` ****Dependencies:**** T5.2, T4.2 
```
typescript const completion = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [...], response_format: { type: 'json_object' }, temperature: 0.1,  // low temperature for consistent structured output max_tokens: 1000 }) ```
 ****Acceptance:**** Returns valid DuplicateResult; falls back gracefully if Groq fails --- 
## PHASE 6 — Inventory Check

### T6.1 — Inventory Check Logic ****Objective:**** Implement deterministic inventory check ****Files:**** `/lib/scoring/inventory-check.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Returns InventoryResult with correct status; no LLM call

### T6.2 — Forecast Query ****Objective:**** Fetch nearest future forecast for material/plant ****Files:**** Part of `/lib/scoring/inventory-check.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Returns correct forecast_quantity; returns 0 if no forecast --- 
## PHASE 7 — Agent 2

### T7.1 — Vendor Fetching ****Objective:**** Fetch all active vendors for the required material ****Files:**** `/lib/agents/agent2.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Returns only active vendors for the correct material_id

### T7.2 — Vendor Scoring Calculations ****Objective:**** Implement all 5 vendor scoring formulas ****Files:**** `/lib/scoring/agent2-scoring.ts` ****Functions:****
- `calculatePriceScore(vendor, allVendors): number`
- `calculateLeadTimeScore(vendor, allVendors): number`
- `calculateLocationScore(vendor, plant): number`
- `calculateQualityScore(vendor): number`
- `calculateOnTimeDeliveryScore(vendor): number`
- `calculateTotalScore(scores): number`
- `estimateSavings(rankedVendors, quantity): number | null` ****Acceptance:**** Unit tested; scores 0-100; rank order correct

### T7.3 — Agent 2 Groq Integration ****Objective:**** Call Groq with vendor rankings; parse structured response ****Files:**** `/lib/agents/agent2.ts` ****Dependencies:**** T7.2, T4.2 ****Acceptance:**** Returns valid SourcingResult; no_vendors_found handled --- 
## PHASE 8 — Agent 3

### T8.1 — Decision Business Rules ****Objective:**** Implement deterministic preliminary decision logic ****Files:**** `/lib/scoring/agent3-decision.ts` ****Dependencies:**** None (pure function) **Function:** `computePreliminaryDecision(duplicate, inventory, sourcing?): 'APPROVE' | 'REVIEW' | 'REJECT'` ****Acceptance:**** Unit tested against all documented threshold combinations

### T8.2 — Agent 3 Groq Integration ****Objective:**** Call Groq with preliminary decision + all context; parse response ****Files:**** `/lib/agents/agent3.ts` ****Dependencies:**** T8.1, T4.2 ****Safety check:**** LLM cannot downgrade REJECT to APPROVE — validate and override ****Acceptance:**** Returns valid DecisionResult; REJECT override tested

### T8.3 — PO Creation on Approve ****Objective:**** Create PO record when APPROVE + sourcing needed ****Files:**** Part of `/lib/agents/orchestrator.ts` ****Dependencies:**** T8.2, T2.2 ****Acceptance:**** PO created with correct vendor, price, expected_delivery_date --- 
## PHASE 9 — Agent 4

### T9.1 — In-App Notification Creation ****Objective:**** Insert notification record in database ****Files:**** `/lib/agents/agent4.ts` ****Dependencies:**** T2.2 ****Acceptance:**** Notification inserted; recipient and message correct per decision type

### T9.2 — Resend Email Integration ****Objective:**** Send email if RESEND_API_KEY configured ****Files:**** `/lib/notifications/resend.ts` ****Dependencies:**** T9.1 ****Acceptance:**** Email sent when key present; failure does not break pipeline; status updated --- 
## PHASE 10 — Frontend

### T10.1 — Layout + Navigation ****Objective:**** App shell with nav bar and notification bell ****Files:**** `/app/layout.tsx`, `/components/NavBar.tsx`, `/components/NotificationBell.tsx` ****Acceptance:**** Layout renders; nav links work

### T10.2 — Dashboard Page ****Objective:**** Main requestor dashboard ****Files:**** `/app/page.tsx`, `/components/dashboard/` ****Components:****
- `InventoryTable` — material, plant, stock, safety stock, forecast, usable stock, status indicator
- `PRList` — recent PRs with status badges
- `POList` — recent POs with vendor and delivery info
- `QuickStatsBar` — summary counts ****Acceptance:**** Dashboard loads all data; usable stock computed and displayed; color indicators for stock status

### T10.3 — Create PR Form ****Objective:**** PR creation page ****Files:**** `/app/pr/new/page.tsx`, `/components/pr/PRForm.tsx` ****Fields:**** Material dropdown, Plant dropdown, Quantity, Required Date, Requestor Name, Email ****Behavior:**** - Material dropdown shows only active materials
- Plant dropdown filters to plants where selected material is mapped - On submit: POST /api/pr, redirect to PR detail page
- Show loading state during submission ****Acceptance:**** Form validates client-side; API called on submit; redirects to detail page

### T10.4 — PR Detail + Analysis Page ****Objective:**** Show PR info + AI pipeline results ****Files:**** `/app/pr/[id]/page.tsx`, `/components/analysis/` ****Components:****
- `PRInfoCard` — PR details
- `PipelineStatus` — shows stage progress (Agent 1 → Inventory → Agent 2? → Decision)
- `DuplicateAnalysisPanel` — KPI score breakdown with visual bars
- `InventoryPanel` — stock values and status
- `VendorRankingTable` — ranked vendor table (only if Agent 2 ran)
- `DecisionBanner` — APPROVE/REVIEW/REJECT with color coding
- `ReasoningPanel` — LLM explanation and evidence
- `POInfoCard` — PO details if created ****Polling:**** Page polls GET /api/pr/:id every 3 seconds until analysis is available (max 60s) ****Acceptance:**** All analysis panels render correctly; loading states shown during pipeline

### T10.5 — Notifications Page ****Objective:**** Full notification list ****Files:**** `/app/notifications/page.tsx`, `/components/NotificationList.tsx` ****Acceptance:**** All user notifications listed; mark-as-read works

### T10.6 — Requestor Identity (localStorage) ****Objective:**** Simple identity persistence (no auth) ****Files:**** `/components/UserIdentityModal.tsx`, `/lib/user-context.tsx` ****Behavior:**** On first visit, prompt for name + email. Store in localStorage. Pre-fill PR form. ****Acceptance:**** Identity persists across page refreshes; PR form pre-filled --- 
## PHASE 11 — Pipeline Orchestration

### T11.1 — Pipeline Orchestrator ****Objective:**** Wire all agents into sequential pipeline ****Files:**** `/lib/agents/orchestrator.ts` ****Dependencies:**** T5.3, T6.1, T7.3, T8.2, T9.1 **Function:** `runPRPipeline(prId: string): Promise\<void>` ****Acceptance:**** Full pipeline runs end-to-end; results stored in ai_pr_analysis

### T11.2 — PR Status Updates ****Objective:**** Update PR status throughout pipeline ****Files:**** Part of orchestrator ****Transitions:****
- After creation: CREATED
- Pipeline running: UNDER_REVIEW
- Decision = APPROVE: APPROVED (then PO_CREATED if PO made)
- Decision = REVIEW: UNDER_REVIEW (remains)
- Decision = REJECT: REJECTED ****Acceptance:**** Status transitions correctly; no stuck status

### T11.3 — Error Handling in Pipeline ****Objective:**** Graceful failure at each stage ****Files:**** Part of orchestrator ****Acceptance:**** Groq failure → stores pipeline_error, PR stays UNDER_REVIEW; email failure → logs, continues --- 
## PHASE 12 — Testing

### T12.1 — Unit Tests for Scoring ****Objective:**** Test all calculation functions ****Files:**** `/__tests__/scoring/` ****Tool:**** Jest (included with Next.js) **Tests:**
- `agent1-scoring.test.ts`: all 6 KPI formulas + overall
- `inventory-check.test.ts`: SUFFICIENT/AT_RISK/INSUFFICIENT cases
- `agent2-scoring.test.ts`: all 5 vendor scores + ranking
- `agent3-decision.test.ts`: all APPROVE/REVIEW/REJECT rule combinations ****Acceptance:**** All tests pass; edge cases covered

### T12.2 — API Route Tests ****Objective:**** Test API routes with mocked Supabase ****Files:**** `/__tests__/api/` ****Acceptance:**** PR creation validates correctly; 400s returned for invalid input

### T12.3 — Playwright E2E Tests ****Objective:**** Test main user journey ****Files:**** `/e2e/main-flow\.spec.ts` ****Scenarios:**** 1. Create PR → see decision 2. Create duplicate PR → see high similarity warning 3. Create PR with insufficient stock → see vendor ranking ****Acceptance:**** All 3 E2E scenarios pass in CI --- 
## PHASE 13 — Deployment

### T13.1 — Vercel Configuration ****Objective:**** Configure Vercel project ****Files:**** `vercel.json` (if needed), Vercel dashboard ******Steps:****** Connect GitHub repo, set environment variables, deploy ****Acceptance:**** Production URL accessible; env vars not exposed in client bundle

### T13.2 — Production Database Check ****Objective:**** Verify Supabase RLS works in production ****Dependencies:**** T13.1 ****Acceptance:**** Can create PRs; can read notifications; master data readable

### T13.3 — Smoke Test Production ****Objective:**** Run demo flow on production URL ****Acceptance:**** All 4 demo scenarios work end-to-end on production --- 
## File Ownership | Phase | Files | Owner (if parallel) | | --- | --- | --- | | Frontend | `/app/`, `/components/` | Agent A | | Backend + DB | `/lib/supabase.ts`, `/app/api/`, `/lib/validation/` | Agent B | | AI Pipeline | `/lib/agents/`, `/lib/scoring/` | Agent C | | Testing | `/__tests__/`, `/e2e/` | Agent D | **Shared/coordination files:** `/types/index.ts` (define first, shared by all) - Task**
