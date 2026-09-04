# REQUIREMENTS.md — ProcureAI MVP

## 1. Functional Requirements

### 1.1 Dashboard

- **FR-01:** Requestor can view all materials available at a plant
- **FR-02:** Dashboard shows current stock, safety stock, maximum stock, and forecasted demand per material/plant
- **FR-03:** Dashboard shows open purchase orders and their statuses
- **FR-04:** Dashboard shows a calculated "usable available stock" field
- **FR-05:** Requestor can view all their own PRs and statuses
- **FR-06:** Requestor can view notifications
- **FR-07:** Dashboard shows PO information for approved PRs

### 1.2 Purchase Requisition

- **FR-08:** Requestor can create a new PR by selecting material, plant, quantity, and required date
- **FR-09:** The system generates a unique PR number automatically
- **FR-10:** PR is saved with status `CREATED`
- **FR-11:** PR submission automatically triggers the AI pipeline

### 1.3 Agent 1 — PR Matching

- **FR-12:** On PR creation, the system fetches **ALL** PRs created within the previous 7 days
- **FR-13:** PR status is **IGNORED** during duplicate search (all statuses are candidates)
- **FR-14:** The system calculates 6 KPI scores deterministically:
  - Material Match
  - Plant Match
  - Quantity Similarity
  - Required Date Similarity
  - Requestor Match
  - Time Gap
- **FR-15:** The LLM generates a human-readable explanation of the duplicate finding
- **FR-16:** Agent 1 produces a structured JSON result stored in `ai_pr_analysis`

### 1.4 Inventory Check

- **FR-17:** After Agent 1, the system performs a deterministic inventory check
- **FR-18:** Inventory check uses: `available_stock`, `safety_stock`, `forecasted_demand` (next period), and PR quantity
- **FR-19:** Inventory check produces one of: `SUFFICIENT`, `INSUFFICIENT`, `AT_RISK`
- **FR-20:** If `SUFFICIENT`, Agent 2 is **NOT** invoked
- **FR-21:** If `INSUFFICIENT` or `AT_RISK`, Agent 2 **IS** invoked

### 1.5 Agent 2 — Vendor Ranking

- **FR-22:** Agent 2 is only triggered when inventory is `INSUFFICIENT` or `AT_RISK`
- **FR-23:** Agent 2 fetches all active vendors that supply the required material
- **FR-24:** Agent 2 scores vendors on:
  - Price
  - Lead Time
  - Location (vs plant)
  - Quality Rating
  - On-Time Delivery
- **FR-25:** Vendor scores are calculated deterministically; LLM explains the recommendation
- **FR-26:** Agent 2 produces a ranked vendor list in structured JSON
- **FR-27:** Agent 2 estimates potential savings where comparison data exists

### 1.6 Agent 3 — Decision

- **FR-28:** Agent 3 consumes outputs of Agent 1, Inventory Check, and Agent 2 (if run)
- **FR-29:** Agent 3 applies documented business rules to produce `APPROVE`, `REVIEW`, or `REJECT`
- **FR-30:** Decision includes:
  - `decision`
  - `reason`
  - `risk_level`
  - `key_evidence`
  - `recommended_next_step`
- **FR-31:** If `APPROVED` and sourcing is needed, a PO is created

### 1.7 Agent 4 — Notification

- **FR-32:** Agent 4 creates an in-app notification record in the `notifications` table
- **FR-33:** Notification is visible on the dashboard immediately after processing
- **FR-34:** If Resend is configured, Agent 4 sends an email notification
- **FR-35:** Email failure never fails the PR pipeline
- **FR-36:** Agent 4 does **NOT** modify the decision

### 1.8 PO Creation

- **FR-37:** When a PR is `APPROVED` with a recommended vendor, a PO record is created
- **FR-38:** PO includes vendor, quantity, unit price, order date, expected delivery date
- **FR-39:** PO is visible on the dashboard

## 2. Non-Functional Requirements

### 2.1 Performance

- **NFR-01:** PR pipeline should complete within 30 seconds (acceptable for hackathon demo)
- **NFR-02:** Dashboard should load within 3 seconds

### 2.2 Reliability

- **NFR-03:** AI API failure must be handled gracefully with a meaningful error message
- **NFR-04:** Email failure must not block PR processing
- **NFR-05:** Supabase connectivity errors must return meaningful UI feedback

### 2.3 Security

- **NFR-06:** AI API keys must never be exposed to the browser
- **NFR-07:** All secrets stored as environment variables
- **NFR-08:** User input must be validated server-side
- **NFR-09:** LLM structured outputs must be validated before storing
- **NFR-10:** Supabase Row Level Security enabled on core tables

### 2.4 Maintainability

- **NFR-11:** Each agent has a single, clearly defined responsibility
- **NFR-12:** Scoring logic is isolated in testable utility functions
- **NFR-13:** Agent prompts are centralized in a prompts file

### 2.5 Demonstrability

- **NFR-14:** System can demo all 4 scenarios with seeded data
- **NFR-15:** AI reasoning is always visible to the requestor in the UI
- **NFR-16:** KPI scores are shown visually (score breakdown per factor)

## 3. Out of Scope for v1

- RAG over procurement policies
- Multi-user authentication with roles
- Real-time streaming updates
- External ERP integration
- Automated PO sending to vendor systems
- SMS or Teams notifications
- Historical analytics dashboard
- Advanced demand forecasting
- Kafka, Redis, or message queues
- Kubernetes or microservices
