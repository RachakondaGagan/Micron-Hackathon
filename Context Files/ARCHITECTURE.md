# ARCHITECTURE.md — ProcureAI v1

## 1. Overall Architecture ProcureAI is a monolithic Next.js application deployed on Vercel, backed by Supabase (PostgreSQL). The AI pipeline runs server-side via Next.js API Routes, calling the Groq API. No message queues, microservices, or streaming infrastructure.

```

┌─────────────────────────────────────────────────────────┐ │                     Browser (Client)                     │ │           Next.js React App (Tailwind + shadcn)          │ └────────────────────────┬────────────────────────────────┘ │ HTTPS ┌────────────────────────▼────────────────────────────────┐ │                   Vercel Edge / Node                     │ │              Next.js API Routes (Server)                  │ │                                                           │ │   ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │ │   │ Business     │  │  AI Pipeline  │  │  Notification│  │ │   │ Logic Layer  │  │  Orchestrator │  │  Service     │  │ │   └──────┬───────┘  └───────┬───────┘  └──────┬──────┘  │ └──────────┼──────────────────┼─────────────────┼─────────┘ │                  │                  │ ┌──────▼───────┐  ┌───────▼──────┐  ┌───────▼──────┐ │  Supabase    │  │   Groq API   │  │    Resend    │ │  PostgreSQL  │  │  (LLM calls) │  │  (optional)  │ └──────────────┘  └──────────────┘  └──────────────┘

```

## 2. Frontend **Framework:** Next.js 14 App Router **Styling:** Tailwind CSS + shadcn/ui component library **Icons:** Lucide React **State:** React useState/useEffect (no Redux — keep it simple) **HTTP:** Native fetch to Next.js API Routes **Pages:**
- `/` — Main requestor dashboard
- `/pr/new` — Create PR form
- `/pr/[id]` — PR detail + AI analysis result
- `/notifications` — Notification center (also shown inline on dashboard) **Key Components:**
- `InventoryCard` — shows stock levels per material
- `PRForm` — PR creation form with validation
- `PRAnalysisPanel` — shows Agent 1/2/3/4 results
- `VendorRankingTable` — ranked vendor list
- `KPIScoreBreakdown` — visual score bars for Agent 1 KPIs
- `NotificationBell` — in-app notification indicator
- `POInfoCard` — PO details when created

## 3. Backend / API Layer All business logic runs in Next.js API Routes under `/app/api/`. **No direct database access from the client.** All Supabase queries happen server-side using the service role key. **AI API keys are server-only** — never in client bundles. API routes:
- `POST /api/pr` — create PR, trigger pipeline
- `GET /api/dashboard` — all dashboard data
- `GET /api/pr/[id]` — PR + analysis detail
- `GET /api/notifications` — user notifications
- `PATCH /api/notifications/[id]` — mark as read
- `POST /api/po` — confirm/create PO (called after APPROVE)

## 4. Supabase **Role:** Primary data store and auth infrastructure. **Client usage:**
- Server-side: `createClient(url, SERVICE_ROLE_KEY)` for API routes
- Client-side: `createClient(url, ANON_KEY)` for read-only public data only (if any) **Row Level Security:**
- `purchase_requisitions`: users can only read their own PRs (by requestor_email)
- `notifications`: users can only read their own notifications
- `ai_pr_analysis`: read-only for authenticated context
- Master tables (material, plant, vendor): public read, no write from client **No Supabase Auth in v1.** Requestor identity is captured via name/email on PR form and stored in localStorage for UX continuity. This is explicitly a hackathon simplification.

## 5. Agent Orchestration The pipeline is orchestrated by a single server-side function `runPRPipeline(prId)` called immediately after PR creation.

```

runPRPipeline(prId) │ ├── 1. Fetch PR + material + plant data │ ├── 2. runAgent1(pr, historicalPRs)           ← Groq call #1 │        └── returns: DuplicateResult │ ├── 3. runInventoryCheck(pr)                   ← deterministic │        └── returns: InventoryResult │ ├── 4. if (inventory !== SUFFICIENT): │        runAgent2(pr, eligibleVendors)         ← Groq call #2 │        └── returns: SourcingResult │ ├── 5. runAgent3(duplicateResult,               ← Groq call #3 │              inventoryResult, │              sourcingResult?) │        └── returns: DecisionResult │ ├── 6. if (decision === APPROVE && sourcingNeeded): │        createPO(pr, recommendedVendor) │ ├── 7. runAgent4(pr, decisionResult)            ← deterministic + optional Groq #4 │        └── creates notification record │        └── optional: sends Resend email │ └── 8. updatePRStatus(prId, finalStatus)

```

All results from steps 2-5 are written to `ai_pr_analysis` as a single upsert.

## 6. Agent 1 — PR Matching / Validation **Trigger:** Immediately after PR creation **Input:** New PR + all PRs created in the last 7 days (regardless of status) **Deterministic computation (application layer):**
- Material Match: exact ID comparison → 0 or 100
- Plant Match: exact ID comparison → 0 or 100
- Quantity Similarity: `max(0, 100
- abs(new_qty
- hist_qty) / max(new_qty, hist_qty) * 100)`
- Date Similarity: `max(0, 100
- min(abs(date_diff_days), 30) / 30 * 100)`
- Requestor Match: exact email comparison → 0 or 100
- Time Gap Score: `max(0, 100 - (hours_since_creation / 168) * 100)` (168 = 7*24 hrs)
- Weighted Overall Score: see AGENTS.md **LLM call:** Receives the computed scores + PR data → generates explanation and evidence in structured JSON **Output:** `DuplicateResult` JSON

## 7. Inventory Check (Deterministic) No LLM. Pure application logic.

```

usable_stock = available_stock
- next_period_forecast remaining_after_pr = usable_stock
- pr_quantity if remaining_after_pr >= safety_stock: status = SUFFICIENT elif remaining_after_pr >= 0: status = AT_RISK else: status = INSUFFICIENT

```

Where `next_period_forecast` = forecasted_quantity for the nearest future `forecast_period` for the same material/plant. If no forecast exists, treat forecasted demand as 0 (conservative fallback, logged as a warning).

## 8. Agent 2 — Vendor Ranking **Trigger:** Only when inventory is INSUFFICIENT or AT_RISK **Deterministic computation (application layer):**
- Fetch all active vendors for the material
- Normalize each score to 0–100
- Apply weights and compute total score
- Sort descending **LLM call:** Receives ranked vendor data + PR context → generates sourcing recommendation, risk summary, estimated savings narrative **Output:** `SourcingResult` JSON See AGENTS.md for full scoring formula.

## 9. Agent 3 — Decision **Trigger:** After Agent 1 + Inventory + Agent 2 (if run) **Process:** Application layer applies business rules to produce a preliminary decision signal, LLM confirms and generates human-readable reasoning **Output:** `DecisionResult` JSON → APPROVE / REVIEW / REJECT See AGENTS.md for decision rules.

## 10. Agent 4 — Notification **Trigger:** After Agent 3 **Process:** Purely deterministic — determines recipient and message from decision type **Groq:** Optional — can generate a more personalized message, but a template fallback exists **Output:** Record inserted into `notifications`, optional Resend API call

## 11. Notification Mechanism **Primary (always active):** Database record in `notifications` table, polled by dashboard every 10 seconds or on page focus. **Secondary (optional):** Resend transactional email. Configured via `RESEND_API_KEY` env var. If env var is absent or Resend call fails, the failure is logged but the pipeline continues.

## 12. Error Handling | Failure | Behavior |
|---|---| | Groq API down | Retry once, then store partial result with error flag, return 503 to client | | Groq returns malformed JSON | Validate with Zod schema, fall back to "analysis unavailable" state | | No historical PRs | Agent 1 skips comparison, returns no_duplicate with 0 similarity | | No eligible vendors | Agent 2 returns no_vendors_found, decision defaults to REVIEW | | No inventory record | Treat as INSUFFICIENT (conservative) | | No forecast record | Treat forecasted demand as 0 | | Resend failure | Log error, mark notification email_status = FAILED, continue | | Invalid material/plant | Validate at API layer before pipeline runs, return 400 | | Material not mapped to plant | Validate mapping, return 400 |

## 13. Security
- `GROQ_API_KEY`: server-only, never in client bundle
- `RESEND_API_KEY`: server-only
- `SUPABASE_SERVICE_ROLE_KEY`: server-only
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public (safe by Supabase design)
- All user input sanitized server-side
- Agent JSON outputs validated with Zod before storage
- RLS policies on `purchase_requisitions` and `notifications`

## 14. Deployment **Platform:** Vercel **Database:** Supabase (cloud-hosted) **AI:** Groq (external API) **Email:** Resend (external API, optional) Environment variables set in Vercel project settings. Local development uses `.env.local`.

--- ## Diagram A — High-Level System Architecture

```mermaid graph TB subgraph Client["Browser Client"] UI[Next.js React App] end subgraph Vercel["Vercel (Server)"] API[Next.js API Routes] PIPE[PR Pipeline Orchestrator] BL[Business Logic / Scoring] end subgraph External["External Services"] GROQ[Groq API<br/>llama-3.3-70b] RESEND[Resend Email<br/>optional] end subgraph Supabase["Supabase"] DB[(PostgreSQL)] RLS[Row Level Security] end UI -->|HTTPS fetch| API API --> PIPE PIPE --> BL PIPE -->|Structured prompts| GROQ PIPE -->|Notification| RESEND PIPE --> DB API --> DB DB --- RLS

```

## Diagram B — Agent Orchestration Flow

```mermaid flowchart TD PR[PR Created] --> A1[Agent 1\nDuplicate Detection] A1 --> IC[Inventory Check\nDeterministic] IC --> SUFF{Sufficient?} SUFF -->|Yes| A3 SUFF -->|No / At Risk| A2[Agent 2\nVendor Ranking] A2 --> A3[Agent 3\nDecision] A3 --> DEC{Decision} DEC -->|APPROVE| PO[Create PO] DEC -->|REVIEW| REV[Flag for Review] DEC -->|REJECT| REJ[Reject PR] PO --> A4[Agent 4\nNotification] REV --> A4 REJ --> A4 A4 --> NOTIF[In-App Notification] A4 -->|If configured| EMAIL[Resend Email]

```

## Diagram C — PR Processing Sequence

```mermaid sequenceDiagram participant R as Requestor participant UI as Dashboard participant API as API Route participant DB as Supabase participant AI as Groq API participant RS as Resend R->>UI: Fill PR form UI->>API: POST /api/pr API->>DB: Insert purchase_requisitions DB-->>API: pr_id API->>DB: Fetch last 7 days PRs API->>AI: Agent 1 prompt (scores + PR data) AI-->>API: DuplicateResult JSON API->>DB: Fetch inventory + forecast Note over API: Deterministic inventory check alt Inventory Insufficient API->>DB: Fetch eligible vendors API->>AI: Agent 2 prompt (vendor data) AI-->>API: SourcingResult JSON end API->>AI: Agent 3 prompt (all results) AI-->>API: DecisionResult JSON API->>DB: Upsert ai_pr_analysis API->>DB: Update PR status alt Decision = APPROVE API->>DB: Insert purchase_orders end API->>DB: Insert notification API-->>UI: Pipeline result opt Resend configured API->>RS: Send email RS-->>API: Delivery status API->>DB: Update notification email_status end UI->>R: Show decision + reasoning

```

## Diagram D — Database Relationships

```mermaid erDiagram material_master ||--o{ plant_material_mapping : "mapped via" plant_master ||--o{ plant_material_mapping : "mapped via" material_master ||--o{ vendor_master : "supplied by" material_master ||--o{ purchase_requisitions : "requested in" plant_master ||--o{ purchase_requisitions : "requested at" material_master ||--o{ inventory : "stocked in" plant_master ||--o{ inventory : "stocked at" material_master ||--o{ demand_forecast : "forecasted for" plant_master ||--o{ demand_forecast : "forecasted at" purchase_requisitions ||--o| ai_pr_analysis : "analyzed by" purchase_requisitions ||--o| purchase_orders : "converted to" vendor_master ||--o{ purchase_orders : "fulfilled by" purchase_requisitions ||--o{ notifications : "triggers"

```

## Diagram E — Agent 1 Duplicate Detection Flow

```mermaid flowchart TD START[New PR Created] --> FETCH[Fetch PRs last 7 days\nALL statuses] FETCH --> ANY{Any PRs\nfound?} ANY -->|No| NODUPE[no_duplicate\nscore=0] ANY -->|Yes| CALC[For each historical PR:\nCalculate 6 KPI scores] CALC --> MAT[Material Match\nexact ID = 0 or 100] CALC --> PLT[Plant Match\nexact ID = 0 or 100] CALC --> QTY[Quantity Similarity\ncontinuous 0-100] CALC --> DATE[Date Similarity\ncontinuous 0-100] CALC --> REQ[Requestor Match\nexact email = 0 or 100] CALC --> GAP[Time Gap Score\nrecency 0-100] MAT & PLT & QTY & DATE & REQ & GAP --> WGT[Apply Weights\nWeighted Sum] WGT --> BEST[Select highest-scoring\nhistorical PR] BEST --> THRESH{Overall Score} THRESH -->|≥ 75| HIGH[HIGH DUPLICATE\nflag for review] THRESH -->|50-74| MED[MEDIUM SIMILARITY\nnotify buyer] THRESH -->|< 50| LOW[LOW SIMILARITY\nproceed] HIGH & MED & LOW --> LLM[LLM: Generate\nexplanation + evidence] LLM --> OUT[DuplicateResult JSON]

```

## Diagram F — Agent 2 Vendor Ranking Flow

```mermaid flowchart TD TRIG[Agent 2 Triggered] --> FETCH[Fetch vendors\nfor material] FETCH --> FILT[Filter: is_active = true] FILT --> ANY{Vendors\nfound?} ANY -->|No| NOVEND[Return: no_vendors_found\nDecision defaults to REVIEW] ANY -->|Yes| NORM[Normalize each factor to 0-100] NORM --> PRICE[Price Score\nlowest=100, highest=0] NORM --> LEAD[Lead Time Score\nlowest=100, highest=0] NORM --> LOC[Location Score\nregion match 100/50/0] NORM --> QUAL[Quality Score\nrating * 20] NORM --> OTD[On-Time Delivery Score\npercentage direct] PRICE & LEAD & LOC & QUAL & OTD --> WEIGHT[Apply Weights:\nPrice 30%, Lead 25%\nLocation 20%, Quality 15%\nOTD 10%] WEIGHT --> RANK[Sort descending\nby total score] RANK --> BEST[Best vendor = #1] BEST --> SAVINGS[Estimate savings vs\nnext-best vendor price] SAVINGS --> LLM[LLM: Generate\nrecommendation + risks] LLM --> OUT[SourcingResult JSON]
