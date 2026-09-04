# API_CONTRACT.md — ProcureAI v1

## Base URL

- Local: `http://localhost:3000/api`
- Production: `https://your-app.vercel.app/api`

## Authentication

MVP uses no token-based auth. Requestor identity is provided in request body.

All routes are server-only (secrets never exposed to client).

Production should add JWT/Supabase Auth.

## Common Response Format

```typescript
// Success
{
  "data": <payload>,
  "error": null
}

// Error
{
  "data": null,
  "error": {
    "code": string,
    "message": string
  }
}
```

---

## 1. Dashboard Data

### GET `/api/dashboard`

**Purpose:** Fetch all data required to render the requestor dashboard.

**Query Parameters:**

```text
requestor_email: string (optional) — filter PRs by requestor
plant_id: string (optional) — filter inventory by plant
```

**Response 200:**

```typescript
{
  data: {
    materials: Array<{
      material_id: string
      material_name: string
      material_group: string
      unit_of_measure: string
    }>
    plants: Array<{
      plant_id: string
      plant_name: string
      location: string
    }>
    inventory: Array<{
      inventory_id: string
      material_id: string
      material_name: string
      plant_id: string
      plant_name: string
      available_stock: number
      safety_stock: number
      maximum_stock: number | null
      forecasted_demand: number       // next period forecast_quantity (or 0)
      usable_stock: number             // computed: available_stock - forecasted_demand
      open_po_quantity: number         // sum of POs in CREATED/SENT/CONFIRMED status
      last_updated: string
    }>
    recent_prs: Array<{
      pr_id: string
      pr_number: string
      material_name: string
      plant_name: string
      quantity: number
      required_date: string
      status: string
      created_at: string
      has_analysis: boolean
    }>
    recent_pos: Array<{
      po_id: string
      po_number: string
      pr_number: string
      vendor_name: string
      quantity: number
      total_amount: number
      expected_delivery_date: string
      status: string
    }>
    unread_notifications: number
  }
}
```

**Errors:**

- `500 SUPABASE_ERROR`: Database unavailable

---

## 2. Create Purchase Requisition

### POST `/api/pr`

**Purpose:** Create a new PR and trigger the AI pipeline.

**Request Body:**

```typescript
{
  material_id: string       // required, must exist in material_master
  plant_id: string          // required, must exist in plant_master
  quantity: number          // required, > 0
  required_date: string     // required, ISO date YYYY-MM-DD, must be future date
  requestor_name: string    // required, max 100 chars
  requestor_email: string   // required, valid email format
  planner_name?: string     // optional
  planner_email?: string    // optional, valid email format if provided
}
```

**Validation Rules:**

- `material_id` must exist and be active in `material_master`
- `plant_id` must exist and be active in `plant_master`
- `(plant_id, material_id)` must exist in `plant_material_mapping` with `is_active = true`
- `quantity` must be > 0
- `required_date` must be >= today + 1 day
- `requestor_email` must match email regex
- All required fields must be non-empty strings

**Response 201:**

```typescript
{
  data: {
    pr_id: string
    pr_number: string
    status: string            // 'CREATED' immediately
    pipeline_status: 'PROCESSING'
    message: "PR created and analysis pipeline started"
  }
}
```

**Response 400 (validation failure):**

```typescript
{
  data: null,
  error: {
    code: "VALIDATION_ERROR",
    message: string,
    fields?: { [field: string]: string }   // per-field error messages
  }
}
```

**Response 400 (business rule failure):**

```typescript
{
  data: null,
  error: {
    code: "MATERIAL_NOT_AT_PLANT" | "INACTIVE_MATERIAL" | "INACTIVE_PLANT",
    message: string
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`
- `400 MATERIAL_NOT_AT_PLANT`
- `500 SUPABASE_ERROR`

**Side Effects:**

- Inserts row in `purchase_requisitions` with status=CREATED
- Immediately triggers `runPRPipeline(prId)` (async, non-blocking for PR creation response)
- PR status is updated to final state by the pipeline

> **Note:** The API returns 201 immediately after PR creation. The pipeline runs asynchronously. The client polls `GET /api/pr/:id` to see results.

---

## 3. Get PR Detail + Analysis

### GET `/api/pr/:id`

**Purpose:** Fetch a single PR with its AI analysis results.

**Path Parameters:**

- `id`: PR UUID

**Response 200:**

```typescript
{
  data: {
    pr: {
      pr_id: string
      pr_number: string
      material_id: string
      material_name: string
      plant_id: string
      plant_name: string
      quantity: number
      required_date: string
      requestor_name: string
      requestor_email: string
      planner_name: string | null
      planner_email: string | null
      status: string
      created_at: string
      updated_at: string
    }
    analysis: {
      analysis_id: string
      duplicate_result: DuplicateResult | null
      inventory_result: InventoryResult | null
      sourcing_result: SourcingResult | null
      decision: 'APPROVE' | 'REVIEW' | 'REJECT' | null
      decision_reason: string | null
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null
      estimated_savings: number | null
      pipeline_error: string | null
      created_at: string
    } | null   // null if pipeline still running
    purchase_order: {
      po_id: string
      po_number: string
      vendor_name: string
      quantity: number
      unit_price: number
      total_amount: number
      order_date: string
      expected_delivery_date: string
      status: string
    } | null
  }
}
```

**Errors:**

- `404 NOT_FOUND`: PR does not exist
- `500 SUPABASE_ERROR`

---

## 4. List PRs

### GET `/api/pr`

**Purpose:** List all PRs, optionally filtered.

**Query Parameters:**

```text
requestor_email: string (optional)
status: string (optional)
limit: number (default: 20)
offset: number (default: 0)
```

**Response 200:**

```typescript
{
  data: {
    prs: Array<{
      pr_id: string
      pr_number: string
      material_name: string
      plant_name: string
      quantity: number
      required_date: string
      status: string
      decision: string | null
      risk_level: string | null
      created_at: string
    }>
    total: number
  }
}
```

---

## 5. Get Notifications

### GET `/api/notifications`

**Purpose:** Fetch notifications for a user.

**Query Parameters:**

```text
recipient_email: string (required)
status: string (optional) — filter by status
limit: number (default: 20)
```

**Response 200:**

```typescript
{
  data: {
    notifications: Array<{
      notification_id: string
      pr_id: string | null
      pr_number: string | null
      notification_type: string
      message: string
      status: string
      sent_at: string
      read_at: string | null
    }>
    unread_count: number
  }
}
```

---

## 6. Mark Notification as Read

### PATCH `/api/notifications/:id`

**Purpose:** Mark a notification as read.

**Path Parameters:**

- `id`: notification UUID

**Request Body:**

```typescript
{
  "status": "READ"
}
```

**Response 200:**

```typescript
{
  data: {
    notification_id: string,
    status: "READ",
    read_at: string
  }
}
```

**Errors:**

- `404 NOT_FOUND`

---

## 7. Create Purchase Order

### POST `/api/po`

**Purpose:** Create a PO from an approved PR (called after APPROVE decision with sourcing needed).

> **Note:** For MVP, this may be triggered automatically by the pipeline on APPROVE. This endpoint exists for manual confirmation if needed.

**Request Body:**

```typescript
{
  pr_id: string                   // required, must be an APPROVED PR
  vendor_id: string               // required, from Agent 2 recommendation
  material_id: string             // required
  quantity: number                // required, > 0
  unit_price: number              // required, from vendor_master
  expected_delivery_date: string  // required, ISO date
}
```

**Validation Rules:**

- `pr_id` must exist with status=APPROVED
- `(vendor_id, material_id)` must exist in vendor_master and be active
- No existing PO for this PR (prevent duplicates)

**Response 201:**

```typescript
{
  data: {
    po_id: string
    po_number: string
    pr_number: string
    vendor_name: string
    quantity: number
    unit_price: number
    total_amount: number
    order_date: string
    expected_delivery_date: string
    status: "CREATED"
  }
}
```

**Errors:**

- `400 VALIDATION_ERROR`
- `400 PR_NOT_APPROVED`
- `400 PO_ALREADY_EXISTS`
- `404 NOT_FOUND`

---

## 8. Get Inventory

### GET `/api/inventory`

**Purpose:** Fetch inventory levels (also available via dashboard endpoint).

**Query Parameters:**

```text
plant_id: string (optional)
material_id: string (optional)
```

**Response 200:**

```typescript
{
  data: {
    inventory: Array<{
      material_id: string
      material_name: string
      plant_id: string
      plant_name: string
      available_stock: number
      safety_stock: number
      maximum_stock: number | null
      forecasted_demand: number
      usable_stock: number
      open_po_quantity: number
      stock_status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL'
    }>
  }
}
```

---

## Pipeline Internal Functions

These are not HTTP endpoints but TypeScript functions called server-side. Documented here for implementation clarity.

### `runPRPipeline(prId: string): Promise<void>`

Orchestrates the full agent pipeline. Called after PR creation.

### `runAgent1(pr, historicalPRs): Promise<DuplicateResult>`

Computes KPI scores, calls Groq, returns `DuplicateResult`.

### `runInventoryCheck(pr): Promise<InventoryResult>`

Pure deterministic calculation. No Groq call.

### `runAgent2(pr, vendors): Promise<SourcingResult>`

Computes vendor scores, calls Groq, returns `SourcingResult`.

### `runAgent3(pr, duplicate, inventory, sourcing?): Promise<DecisionResult>`

Applies business rules, calls Groq for explanation, returns `DecisionResult`.

### `runAgent4(pr, decision): Promise<NotificationResult>`

Creates notification record, optionally sends Resend email.

---

## Error Code Reference

| Code | HTTP Status | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `MATERIAL_NOT_AT_PLANT` | 400 | Material not mapped to plant |
| `INACTIVE_MATERIAL` | 400 | `is_active=false` |
| `INACTIVE_PLANT` | 400 | `is_active=false` |
| `PR_NOT_APPROVED` | 400 | PR not in APPROVED status |
| `PO_ALREADY_EXISTS` | 400 | PO already created for this PR |
| `NOT_FOUND` | 404 | Resource not found |
| `SUPABASE_ERROR` | 500 | Database error |
| `GROQ_ERROR` | 500 | AI API error |
| `PIPELINE_ERROR` | 500 | Agent pipeline failure |
