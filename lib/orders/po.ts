import { createServerClient } from '@/lib/supabase'

export async function createPurchaseOrder({
  prId,
  vendorId,
  materialId,
  quantity,
  unitPrice,
  expectedDeliveryDate,
  customSupabaseClient,
}: {
  prId: string
  vendorId: string
  materialId: string
  quantity: number
  unitPrice: number
  expectedDeliveryDate: string
  customSupabaseClient?: any
}) {
  const supabase = customSupabaseClient || createServerClient()

  // 1. Generate sequential PO number via database function
  let poNumber = `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  try {
    const { data: generatedNum, error: rpcError } = await supabase.rpc('generate_po_number')
    if (!rpcError && generatedNum) {
      poNumber = generatedNum
    }
  } catch (err) {
    console.warn('RPC generate_po_number failed, using generated format:', err)
  }

  // 2. Insert into purchase_orders
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      pr_id: prId,
      vendor_id: vendorId,
      material_id: materialId,
      quantity,
      unit_price: unitPrice,
      expected_delivery_date: expectedDeliveryDate,
      status: 'CREATED',
    })
    .select('*')
    .single()

  if (poError) {
    console.error('Failed to create purchase order:', poError)
    throw poError
  }

  // 3. Update PR status to PO_CREATED
  await supabase
    .from('purchase_requisitions')
    .update({ status: 'PO_CREATED' })
    .eq('pr_id', prId)

  return po
}
