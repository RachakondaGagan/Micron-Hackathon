import { NextResponse } from 'next/server'
import { createPurchaseOrder } from '@/lib/orders/po'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pr_id, vendor_id, material_id, quantity, unit_price, expected_delivery_date } = body

    if (!pr_id || !vendor_id || !material_id || !quantity || !unit_price) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_INPUT', message: 'Missing required PO parameters' } },
        { status: 400 }
      )
    }

    const expectedDate =
      expected_delivery_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const po = await createPurchaseOrder({
      prId: pr_id,
      vendorId: vendor_id,
      materialId: material_id,
      quantity: Number(quantity),
      unitPrice: Number(unit_price),
      expectedDeliveryDate: expectedDate,
    })

    return NextResponse.json({ data: po, error: null }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { data: null, error: { code: 'PO_CREATION_FAILED', message: err.message || 'Failed to create PO' } },
      { status: 500 }
    )
  }
}
