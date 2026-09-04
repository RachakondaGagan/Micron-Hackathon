// PR Input Validation — Zod Schemas
// Implemented in Module 4

import { z } from 'zod'

export const CreatePRSchema = z.object({
  material_id: z.string().min(1, 'Material is required'),
  plant_id: z.string().min(1, 'Plant is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  required_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  requestor_name: z.string().min(1, 'Requestor name is required').max(100),
  requestor_email: z.string().email('Valid email is required'),
  planner_name: z.string().max(100).optional(),
  planner_email: z.string().email().optional(),
})

export type CreatePRInput = z.infer<typeof CreatePRSchema>
