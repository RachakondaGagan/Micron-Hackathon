# AGENTS.md — Agent Specifications ## Overview | Agent | Trigger | LLM? | Responsibility |
|---|---|---|---| | Agent 1 | Always, on PR creation | Yes | Duplicate/similarity detection | | Inventory Check | Always, after Agent 1 | No | Stock sufficiency determination | | Agent 2 | Only if inventory insufficient/at risk | Yes | Vendor ranking and sourcing | | Agent 3 | Always, after inventory + optional Agent 2 | Yes | Final APPROVE/REVIEW/REJECT | | Agent 4 | Always, after Agent 3 | Optional | Notification delivery
| ---

## AGENT 1 — PR Matching / Validation Agent

### Purpose Detect whether a newly created PR is a duplicate or highly similar to any PR created in the previous 7 days, regardless of that PR's status.

### Input Schema

```

typescript interface Agent1Input { newPR: { pr_id: string pr_number: string material_id: string material_name: string plant_id: string plant_name: string quantity: number required_date: string       // ISO date requestor_name: string requestor_email: string created_at: string          // ISO datetime } historicalPRs: Array<{ pr_id: string pr_number: string material_id: string material_name: string plant_id: string plant_name: string quantity: number required_date: string requestor_name: string requestor_email: string status: string created_at: string // Pre-computed KPI scores (added by application layer): kpi: { material_match: number        // 0 or 100 plant_match: number           // 0 or 100 quantity_similarity: number   // 0-100 date_similarity: number       // 0-100 requestor_match: number       // 0 or 100 time_gap_score: number        // 0-100 overall_similarity: number    // 0-100 weighted } }> }

```

### KPI Formulas (Application Layer — Deterministic) **1. Material Match (weight: 5/23 = 21.7%)**

```

material_match = (newPR.material_id === hist.material_id) ? 100 : 0

```

Binary. Same material = 100, different = 0. **2. Plant Match (weight: 4/23 = 17.4%)**

```

plant_match = (newPR.plant_id === hist.plant_id) ? 100 : 0

```

Binary. Same plant = 100, different = 0. **3. Quantity Similarity (weight: 3/23 = 13.0%)**

```

qty_diff_pct = abs(newPR.quantity
- hist.quantity) / max(newPR.quantity, hist.quantity) quantity_similarity = max(0, round((1
- qty_diff_pct) * 100))

```

Example: new=100, hist=90 → diff=10%, score=90 Example: new=100, hist=200 → diff=50%, score=50 **4. Date Similarity (weight: 4/23 = 17.4%)**

```

date_diff_days = abs(daysBetween(newPR.required_date, hist.required_date)) date_similarity = max(0, round((1
- min(date_diff_days, 30) / 30) * 100))

```

Same date = 100. 15 days apart = 50. ≥30 days apart = 0. **5. Requestor Match (weight: 2/23 = 8.7%)**

```

requestor_match = (newPR.requestor_email === hist.requestor_email) ? 100 : 0

```

Binary. Same email = 100. **6. Time Gap Score (weight: 5/23 = 21.7%)**

```

hours_since = hoursBetween(hist.created_at, newPR.created_at) time_gap_score = max(0, round((1
- min(hours_since, 168) / 168) * 100))

```

Created in the same hour = 100. Created 7 days ago = 0. **7. Overall Similarity Score (derived output)**

```

overall_similarity = round( (material_match * 5 + plant_match * 4 + quantity_similarity * 3 + date_similarity * 4 + requestor_match * 2 + time_gap_score * 5) / 23 )

```

Total weight = 5+4+3+4+2+5 = 23

### Similarity Thresholds
| Score | Label | Meaning | Recommended Action |
|---|---|---|---| | ≥ 75 | HIGH | Very likely duplicate | Flag for review; include in decision as high risk |
| 50–74 | MEDIUM | Possibly related | Note as potential duplicate; Agent 3 considers | | < 50 | LOW | Likely unrelated | Proceed normally | **Justification:**
- A score of 75+ requires at minimum: same material (21.7%) + same plant (17.4%) + similar quantity + recent creation. This combination strongly indicates a duplicate procurement event.
- A score of 50–74 captures partial matches (different requestor, slightly different quantity, or older PR) worth noting but not blocking.
- Below 50 almost always means different material, different plant, or very old PR — normal variance.

### Best Match Selection When multiple historical PRs exist, calculate overall_similarity for each and select the one with the **highest** overall_similarity as the `best_match`. Report top 3 matches if multiple exceed 40.

### LLM Prompt (Agent 1)

```

System: You are a procurement duplicate detection assistant. You receive pre-calculated similarity scores and PR data. Your job is to explain WHY the PRs are similar or different and identify the most important evidence. You must respond ONLY with valid JSON matching the required schema. Do not invent any data values — all scores are provided to you. User: [JSON of newPR, best_match historical PR, and all KPI scores] Produce a JSON response with: { "duplicate_detected": boolean, "overall_similarity_score": number,  // use the provided score "confidence": "HIGH" | "MEDIUM" | "LOW", "matched_pr_id": string | null, "matched_pr_number": string | null, "material_match_score": number, "plant_match_score": number, "quantity_similarity_score": number, "required_date_similarity_score": number, "requestor_match_score": number, "time_gap_score": number, "explanation": string,         // 2-3 sentences explaining the finding "evidence": string[],          // bullet-point evidence list (max 5 items) "recommended_action": string   // one sentence recommendation }

```

### Output Schema (DuplicateResult)

```

typescript interface DuplicateResult { duplicate_detected: boolean overall_similarity_score: number        // 0-100 confidence: 'HIGH' | 'MEDIUM' | 'LOW' matched_pr_id: string | null matched_pr_number: string | null material_match_score: number plant_match_score: number quantity_similarity_score: number required_date_similarity_score: number requestor_match_score: number time_gap_score: number explanation: string evidence: string[] recommended_action: string }

```

### Edge Cases | Scenario | Handling |
|---|---| | No historical PRs in last 7 days | Return duplicate_detected=false, score=0, explanation="No recent PRs to compare" | | Multiple PRs with same high score | Report all matches ≥50; use highest as primary match | | Inactive material | Validation at API layer rejects PR before pipeline runs | | Material not mapped to plant | Validation at API layer rejects PR before pipeline runs | | LLM returns invalid JSON | Zod validation fails → use deterministic fallback: set explanation to "Analysis unavailable — scores calculated deterministically" and populate from computed scores
| ---

## INVENTORY CHECK — Deterministic Business Logic

### Purpose Determine whether existing internal stock can satisfy the PR quantity without falling below safety stock.

### Formula

```

// Step 1: Get the nearest future forecast period next_period_forecast = demand_forecast WHERE material_id = pr.material_id AND plant_id = pr.plant_id AND forecast_period >= today ORDER BY forecast_period ASC LIMIT 1 // If no forecast exists, use 0 (conservative) forecasted_demand = next_period_forecast?.forecast_quantity ?? 0 // Step 2: Calculate usable stock usable_stock = inventory.available_stock
- forecasted_demand // Step 3: Determine remaining after PR remaining_after_pr = usable_stock
- pr.quantity // Step 4: Classify if remaining_after_pr >= safety_stock: status = "SUFFICIENT" elif remaining_after_pr >= 0: status = "AT_RISK" else: status = "INSUFFICIENT"

```

### Output Schema (InventoryResult)

```

typescript interface InventoryResult { status: 'SUFFICIENT' | 'AT_RISK' | 'INSUFFICIENT' available_stock: number safety_stock: number forecasted_demand: number usable_stock: number pr_quantity: number remaining_after_pr: number explanation: string   // generated by application, e.g. "Available stock of 500 minus forecast of 100 leaves 400. After PR of 350, remaining is 50 which is below safety stock of 100." invoke_agent2: boolean }

```

### Edge Cases | Scenario | Handling |
|---|---| | No inventory record for material/plant | status=INSUFFICIENT, explanation notes missing record | | No forecast record | forecasted_demand=0, note logged | | PR quantity = 0 | Validation at API layer rejects this | | available_stock < 0 | Treat as 0
| ---

## AGENT 2 — Procurement / Sourcing Analysis Agent

### Purpose Rank available vendors for the required material and recommend the best sourcing option when inventory is insufficient or at risk.

### Trigger Condition `inventoryResult.invoke_agent2 === true`

### Input Schema

```

typescript interface Agent2Input { pr: { material_id: string material_name: string plant_id: string plant_name: string plant_location: string    // from plant_master.location quantity: number required_date: string } eligibleVendors: Array<{ vendor_id: string vendor_name: string vendor_location: string   // from vendor_master.location unit_price: number lead_time_days: number quality_rating: number    // 1-5 scale on_time_delivery: number  // 0-100 percentage is_active: boolean // Pre-computed scores (added by application layer): scores: { price_score: number           // 0-100 lead_time_score: number       // 0-100 location_score: number        // 0, 50, or 100 quality_score: number         // 0-100 on_time_delivery_score: number // 0-100 total_score: number           // weighted 0-100 } }> inventory: InventoryResult }

```

### Vendor Scoring Model (Application Layer — Deterministic) **Weights Justification:**
| Factor | Weight | Rationale |
|---|---|---| | Price
| 30% | Most direct cost impact; primary procurement KPI | | Lead Time
| 25% | Operational urgency; required_date determines feasibility | | Location
| 20% | Logistics cost and risk; regional suppliers preferred | | Quality
| 15% | Product fit and rework risk; important but secondary to cost/time | | On-Time Delivery
| 10% | Reliability signal; less weight since quality_rating overlaps | **Total: 100%** **Price Score (higher score = cheaper)**

```

min_price = min(all vendor unit_prices) max_price = max(all vendor unit_prices) if min_price === max_price: price_score = 100 for all vendors else: price_score = round((max_price
- vendor.unit_price) / (max_price
- min_price) * 100)

```

**Lead Time Score (higher score = faster)**

```

min_lead = min(all vendor lead_time_days) max_lead = max(all vendor lead_time_days) if min_lead === max_lead: lead_time_score = 100 for all vendors else: lead_time_score = round((max_lead
- vendor.lead_time_days) / (max_lead
- min_lead) * 100)

```

**Location Score (higher score = closer)**

```

// Simple region matching — vendor.location and plant.location contain city/region strings if sameCity(vendor.location, plant.location): location_score = 100 elif sameRegion(vendor.location, plant.location): location_score = 50 else: location_score = 0 // sameCity: string includes comparison (case-insensitive) // sameRegion: first word / comma-separated region comparison

```

**Quality Score (higher score = better quality)**

```

// quality_rating is 1-5 scale quality_score = round((vendor.quality_rating - 1) / 4 * 100) // Rating 1 → 0, Rating 5 → 100

```

**On-Time Delivery Score (higher score = more reliable)**

```

// on_time_delivery is already 0-100 percentage on_time_delivery_score = vendor.on_time_delivery

```

**Total Weighted Score**

```

total_score = round( price_score * 0.30 + lead_time_score * 0.25 + location_score * 0.20 + quality_score * 0.15 + on_time_delivery_score * 0.10 )

```

**Estimated Savings**

```

// Compare best vendor vs second-best vendor price if ranked_vendors.length >= 2: savings_per_unit = ranked_vendors[1].unit_price
- ranked_vendors[0].unit_price estimated_savings = savings_per_unit * pr.quantity // Only report if savings > 0

```

### LLM Prompt (Agent 2)

```

System: You are a procurement sourcing analyst. You receive pre-ranked vendor data with calculated scores. Your job is to explain the sourcing recommendation, identify trade-offs, and highlight any risks. All numerical values are provided — do not invent prices, lead times, or ratings. Respond ONLY with valid JSON. User: [JSON of PR, ranked vendors with scores, inventory situation] Produce: { "recommended_vendor_id": string, "recommended_vendor_name": string, "ranked_vendors": [...], "estimated_savings": number | null, "sourcing_risks": string[], "explanation": string, "trade_off_summary": string }

```

### Output Schema (SourcingResult)

```

typescript interface SourcingResult { recommended_vendor_id: string recommended_vendor_name: string ranked_vendors: Array<{ rank: number vendor_id: string vendor_name: string unit_price: number lead_time_days: number vendor_location: string quality_rating: number on_time_delivery: number price_score: number lead_time_score: number location_score: number quality_score: number on_time_delivery_score: number total_score: number }> estimated_savings: number | null sourcing_risks: string[] explanation: string trade_off_summary: string no_vendors_found: boolean }

```

### Edge Cases | Scenario | Handling |
|---|---| | No active vendors for material | no_vendors_found=true; Agent 3 defaults to REVIEW | | Only one vendor | No ranking needed; return single vendor with note "sole source" | | All vendors same price | price_score=100 for all; differentiate by lead time | | Vendor location data missing | location_score=0 for that vendor; note in risks
| ---

## AGENT 3 — Decision Agent

### Purpose Consume all prior analysis results and make the final APPROVE / REVIEW / REJECT decision.

### Input

```

typescript interface Agent3Input { pr: PR duplicateResult: DuplicateResult inventoryResult: InventoryResult sourcingResult: SourcingResult | null }

```

### Decision Rules (Application Layer — Deterministic Signal) The application computes a preliminary decision signal before the LLM call. The LLM confirms and explains. **REJECT conditions (any of):**
- duplicateResult.overall_similarity_score ≥ 75 AND duplicateResult.duplicate_detected = true AND the matched PR is APPROVED, PO_CREATED, or COMPLETED
- PR quantity is 0 or negative (should be caught at validation, but defensive check)
- material_id not in plant_material_mapping for that plant **REVIEW conditions (any of, not already REJECT):**
- duplicateResult.overall_similarity_score ≥ 75 AND matched PR is CREATED, UNDER_REVIEW (possible duplicate, but not yet confirmed purchase)
- duplicateResult.overall_similarity_score 50–74 AND inventoryResult.status = INSUFFICIENT
- sourcingResult.no_vendors_found = true
- inventoryResult.status = INSUFFICIENT AND no_vendors_found
- Any Groq API error occurred during pipeline (uncertainty) **APPROVE conditions (default if neither REJECT nor REVIEW):**
- Low duplicate risk (score < 50) AND inventory SUFFICIENT → APPROVE directly
- Low duplicate risk AND inventory INSUFFICIENT but vendor found → APPROVE with PO recommendation
- Medium duplicate risk (50–74) AND inventory SUFFICIENT → APPROVE with note **Risk Level Assignment:**

```

risk_level = "HIGH"   if decision === REJECT risk_level = "MEDIUM" if decision === REVIEW risk_level = "LOW"    if decision === APPROVE

```

### LLM Prompt (Agent 3)

```

System: You are a procurement decision officer. You receive structured analysis data. Apply the documented business rules and produce the final decision. The preliminary decision signal is provided — you should confirm it or escalate it (never downgrade a REJECT to APPROVE). Explain the decision clearly for the requestor. Respond ONLY with valid JSON. User: [JSON of all inputs, preliminary_decision signal, business rules summary] Produce: { "decision": "APPROVE" | "REVIEW" | "REJECT", "reason": string, "risk_level": "LOW" | "MEDIUM" | "HIGH", "key_evidence": string[], "recommended_next_step": string }

```

**Important:** LLM cannot downgrade a REJECT to APPROVE. Zod validation enforces this — if LLM returns APPROVE but application computed REJECT, the application's REJECT overrides and an error is logged.

### Output Schema (DecisionResult)

```

typescript interface DecisionResult { decision: 'APPROVE' | 'REVIEW' | 'REJECT' reason: string risk_level: 'LOW' | 'MEDIUM' | 'HIGH' key_evidence: string[] recommended_next_step: string }

```

### Thresholds Summary
| Condition | Decision |
|---|---| | Similarity ≥ 75 + matched PR completed/approved | REJECT | | Similarity ≥ 75 + matched PR pending | REVIEW | | Similarity 50–74 + inventory insufficient | REVIEW | | No vendors found + inventory insufficient | REVIEW | | Similarity < 50 + inventory sufficient | APPROVE | | Similarity < 50 + inventory insufficient + vendor found | APPROVE + PO
| ---

## AGENT 4 — Notification Agent

### Purpose Communicate the final decision to the appropriate recipient via in-app notification and optionally via email (Resend).

### This Agent Does NOT:
- Modify decisions
- Perform business logic
- Re-analyze the PR

### Recipient Logic (Deterministic)

```

if decision === APPROVE: recipient = pr.requestor_email recipient_type = REQUESTOR message = "Your PR {pr_number} has been APPROVED. {recommended_next_step}" if decision === REVIEW: primary = pr.planner_email (or pr.requestor_email if planner not assigned) recipient_type = PLANNER message = "PR {pr_number} requires review. {reason}" if decision === REJECT: recipient = pr.requestor_email recipient_type = REQUESTOR message = "Your PR {pr_number} has been rejected. {reason}"

```

### Database Insert

```

sql INSERT INTO notifications ( notification_id, pr_id, recipient_name, recipient_email, recipient_type, notification_type, message, status, sent_at ) VALUES ( uuid_generate_v4(), {pr_id}, {recipient_name}, {recipient_email}, {recipient_type}, {decision}_NOTIFICATION, {message}, 'PENDING', NOW() )

```

### Optional Resend Email

```

typescript // Only if process.env.RESEND_API_KEY is defined try { const resend = new Resend(process.env.RESEND_API_KEY) await resend.emails.send({ from: 'procurement@yourdomain.com', to: recipientEmail, subject: `PR ${prNumber} — ${decision}`, html: generateEmailHTML(decision, reason, prNumber, recommendedNextStep) }) await db.update notifications SET status='SENT', sent_at=NOW() WHERE notification_id=... } catch (err) { console.error('Resend email failed:', err) await db.update notifications SET status='EMAIL_FAILED' WHERE notification_id=... // Pipeline continues — no throw }

```

### Output Schema

```

typescript interface NotificationResult { notification_id: string recipient_email: string recipient_type: 'REQUESTOR' | 'PLANNER' | 'BUYER' | 'SYSTEM' message: string in_app_created: boolean email_sent: boolean email_error: string | null }

```
