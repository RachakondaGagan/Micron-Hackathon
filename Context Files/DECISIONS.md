# DECISIONS.md — Architectural Decision Records Each decision documents: Context → Decision → Rationale → Alternatives Considered

---

## ADR-001: Why Supabase **Context:** Need a database + auth + hosting that works fast to set up for a hackathon. **Decision:** Use Supabase (PostgreSQL) as the backend-as-a-service. **Rationale:**
- Free tier sufficient for hackathon scale
- PostgreSQL is industry-standard for procurement data (relational, transactional)
- Built-in Row Level Security for basic data governance
- Instant REST/realtime APIs via PostgREST
- No server infrastructure to manage
- Excellent Next.js integration (@supabase/supabase-js) **Alternatives:** PlanetScale (MySQL), Firebase (NoSQL — wrong fit for relational procurement data), self-hosted PostgreSQL (too much ops overhead)

---

## ADR-002: Why PostgreSQL Data Model **Context:** Procurement data is highly relational (materials, plants, vendors, PRs, POs all reference each other). **Decision:** Use a normalized relational schema with foreign keys and constraints. **Rationale:**
- Referential integrity prevents orphaned records
- JOIN queries for inventory + forecast + PR are natural
- JSONB columns for AI outputs give flexibility without over-normalization
- PostgreSQL ENUM types enforce valid status values **Alternatives:** MongoDB (flexible but weak referential integrity for this use case), single-table design (too limiting for agent output queries)

---

## ADR-003: Why Next.js **Context:** Need a full-stack TypeScript framework deployable to Vercel. **Decision:** Next.js 14 with App Router. **Rationale:**
- API Routes keep secrets server-side (AI keys never reach browser)
- TypeScript end-to-end: same type definitions for API and UI
- Vercel deployment is trivial (zero config)
- shadcn/ui ecosystem works natively with Next.js + Tailwind
- App Router enables server components for faster initial load **Alternatives:** Express + React SPA (more setup, separate deployment), T3 Stack (adds tRPC complexity not needed here)

---

## ADR-004: Why Groq (not Mistral) **Context:** Need a free-tier LLM API with strong structured output support. **Decision:** Groq API with `llama-3.3-70b-versatile` model. **Rationale:**
- Groq has the fastest inference latency (important for a hackathon demo — pipeline must feel snappy)
- `llama-3.3-70b-versatile` supports `response_format: { type: "json_object" }` natively
- Free tier is generous for hackathon volume
- Strong instruction-following for structured procurement reasoning
- Widely available in free tier without waitlists **Alternatives:**
- Mistral API (good, but slightly higher latency; `mistral-large` is not free; `mistral-7b` may struggle with complex multi-step reasoning)
- OpenAI (paid, excluded by spec)
- Anthropic Claude (paid, excluded by spec)
- Local Ollama (unreliable in deployment; Vercel serverless has no local model support)

---

## ADR-005: Why Agents Are Separated **Context:** Could implement one monolithic LLM call for everything. **Decision:** Four separate agents with distinct responsibilities. **Rationale:**
- Single responsibility makes each agent debuggable independently
- Reduces hallucination risk: each agent receives only relevant data
- Allows Agent 2 to be skipped when inventory is sufficient (cost and latency savings)
- Each agent can be unit-tested and improved independently
- Makes the architecture explainable to hackathon judges ("here is what each agent does")
- Aligns with real enterprise procurement workflows (validation → stock check → sourcing → approval) **Alternatives:** Single LLM call (unpredictable, harder to explain, more hallucination risk)

---

## ADR-006: Why Inventory Check Is Deterministic **Context:** Could ask the LLM to assess inventory adequacy. **Decision:** Inventory check is pure application logic, no LLM. **Rationale:**
- Inventory math is exact arithmetic — there is no ambiguity to resolve
- LLM cannot improve on: `remaining = available
- forecast
- quantity; compare to safety_stock`
- LLM would introduce hallucination risk into a critical business rule
- Deterministic logic is auditable, explainable, and testable
- Faster (no API latency)

---

## ADR-007: Why Agent 1 Uses a 7-Day Window **Context:** Need a time window for duplicate detection. **Decision:** Search ALL PRs created in the previous 7 days. **Rationale:** - 7 days captures the typical procurement review cycle (most PRs are reviewed within a week)
- Shorter windows (1-3 days) miss PRs submitted on weekends or holidays
- Longer windows (30+ days) generate too many false positives (seasonal reorders are legitimate)
- Aligns with business requirement stated explicitly in the spec
- Simple to explain: "one business week lookback"

---

## ADR-008: Why PR Status Is Ignored During Duplicate Search **Context:** Should only active/open PRs be compared? **Decision:** Ignore PR status entirely during duplicate candidate search. **Rationale:**
- A REJECTED PR may still represent a recent procurement attempt for the same material — if someone tries to re-submit it immediately without authorization, we should detect it
- A COMPLETED PR means inventory was already replenished — very relevant to flag
- An APPROVED PR with PO_CREATED means delivery is coming — extremely relevant to flag (avoid double-ordering)
- Status-filtering creates blind spots: a buyer might approve a duplicate PR without knowing the original was already completed

---

## ADR-009: Why Agent 2 Only Triggers When Inventory Is Insufficient/At Risk **Context:** Always run sourcing analysis for completeness? **Decision:** Only trigger Agent 2 when inventory is INSUFFICIENT or AT_RISK. **Rationale:**
- If stock is SUFFICIENT, there is no procurement need — no vendors need to be ranked
- Running Agent 2 on a SUFFICIENT inventory check would confuse the requestor ("why are vendors being ranked if we have stock?")
- Reduces Groq API calls (cost and latency)
- Aligns with business intent: Agent 2 is a sourcing agent, not an analytics agent

---

## ADR-010: Why Vendor Ranking Uses Deterministic Scoring **Context:** Could ask the LLM to rank vendors. **Decision:** Application calculates all normalized scores and rankings; LLM only explains. **Rationale:**
- Vendor prices, lead times, and ratings are database facts — LLM cannot know them
- LLM hallucinating a vendor price would be a serious procurement error
- The scoring formula (weighted sum) is simple enough to compute deterministically
- Deterministic scoring is auditable and reproducible
- LLM adds genuine value for explaining trade-offs and identifying non-numeric risks (e.g., vendor geopolitical risk)

---

## ADR-011: Why Agent 3 Exists as a Separate Step **Context:** Could combine Agent 1 output directly into a yes/no decision. **Decision:** Agent 3 is a dedicated decision synthesis step. **Rationale:**
- Decision requires combining three distinct data sources (duplicate + inventory + sourcing)
- Rules have precedence ordering that benefits from explicit combination logic
- Clear separation makes the decision auditable ("what information fed into the decision?")
- Agent 3 can be tuned independently without touching the analysis agents
- Mirrors real procurement approval workflows where a decision-maker synthesizes information

---

## ADR-012: Why Agent 4 Only Handles Notifications **Context:** Could let Agent 3 also handle notifications. **Decision:** Agent 4 is a dedicated notification step. **Rationale:**
- Single responsibility: one agent, one job
- Notification format/channel can change without touching decision logic
- Resend integration complexity is isolated in one place
- Agent 4 can be extended (SMS, Teams, Slack) without modifying other agents

---

## ADR-013: Why In-App Notification Is Primary **Context:** Email is widely used for notifications — why not make it primary? **Decision:** In-app database notification is the primary mechanism; email is optional. **Rationale:**
- Email requires Resend API key configuration (a deployment dependency)
- In-app notification always works regardless of email configuration
- For a hackathon demo, showing a notification appearing in the UI is more impressive than checking email
- Resend can go down — email must not be a pipeline hard dependency

---

## ADR-014: Why Resend Is Optional **Context:** Email is expected in enterprise procurement systems. **Decision:** Resend is opt-in via environment variable. **Rationale:**
- Hackathon should work without configuring Resend
- Resend API failure must not fail PR processing
- MVP demonstrates the concept with in-app notifications; email is additive
- Easy to enable: just add RESEND_API_KEY to environment

---

## ADR-015: Why RAG Is Postponed **Context:** RAG could allow agents to reference procurement policy documents. **Decision:** No RAG in v1. **Rationale:**
- RAG requires: document store, embedding model, vector database, retrieval pipeline
- This adds 3+ new infrastructure components and 1-2 additional hours of implementation
- The MVP demonstrates sufficient AI value without RAG
- Structured database data provides all the facts the agents need
- RAG is a v2 feature: "Query procurement policy: is this material category approved for this plant?" **Future RAG use cases (v2):**
- Retrieve procurement policy clauses relevant to the PR material category
- Retrieve historical supplier contracts for the selected vendor
- Retrieve plant-specific procurement guidelines

---

## ADR-016: Vendor Location Approach **Context:** Agent 2 requires vendor location for scoring but original schema didn't have it. **Decision:** Add `location VARCHAR(100)` column to `vendor_master`. **Rationale:**
- Location is a property of the vendor (or vendor-material record) — it belongs in vendor_master
- No new table needed — adding a column is the minimum viable change
- `VARCHAR(100)` with "City, Region" format matches `plant_master.location` for string-based comparison
- Composite PK remains `(vendor_id, material_id)` — location is per-vendor, consistent across materials they supply from the same location

---

## ADR-017: PR Number Generation Strategy **Context:** PR numbers must be human-readable, unique, and sequential. **Decision:** PostgreSQL function `generate_pr_number()` using year + 5-digit sequence. **Format:** `PR-2024-00001` **Rationale:**
- Sequential numbers are meaningful to procurement staff
- Year prefix prevents cross-year collisions
- Server-side generation prevents race conditions
- UUID pk is retained for internal references (safe, stable foreign keys)

---

## ADR-018: No Authentication in MVP **Context:** Real system would require role-based auth (requestor, planner, buyer, admin). **Decision:** No Supabase Auth in MVP. Requestor identity captured via form + localStorage. **Rationale:**
- Auth setup (sign-up flow, roles, RLS by user) adds 2-3 hours to implementation
- Hackathon judges evaluate AI pipeline, not auth implementation
- localStorage identity is sufficient to demonstrate the requestor experience
- Security note: RLS policies are permissive in MVP — documented as limitation **v2 plan:** Add Supabase Auth with role-based RLS; restrict PRs to authenticated users; planner/buyer approval workflow

---

## ADR-019: Groq Temperature Setting **Context:** What temperature for LLM calls? **Decision:** `temperature: 0.1` for all agents. **Rationale:**
- Low temperature = consistent, predictable structured outputs
- Procurement reasoning should be consistent, not creative
- Reduces risk of hallucinated reasoning or inconsistent JSON structure - 0.1 allows slight natural language variation in explanations while maintaining reliability

---

## ADR-020: Single vs. Streaming Pipeline **Context:** Stream agent results to show real-time progress? **Decision:** Non-streaming pipeline; client polls GET /api/pr/:id every 3 seconds. **Rationale:**
- Server-Sent Events or WebSockets add complexity
- Polling at 3s is imperceptible for a 15-30 second pipeline
- Simpler to implement and debug
- Works reliably on Vercel serverless (no long-running connections)
- Progress stages visible via PR status field (UNDER_REVIEW → APPROVED/REJECTED)
