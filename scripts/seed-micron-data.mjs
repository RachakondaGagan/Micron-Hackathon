import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function seed() {
  console.log('🚀 Starting Micron Real-World Semiconductor Data Seeding...')

  // 1. Clean child tables first
  console.log('Cleaning existing dependent records...')
  await supabase.from('ai_pr_analysis').delete().neq('pipeline_stage', 'NON_EXISTENT')
  await supabase.from('notifications').delete().neq('recipient_type', 'NON_EXISTENT')
  await supabase.from('purchase_orders').delete().neq('status', 'CANCELLED')
  await supabase.from('purchase_requisitions').delete().neq('pr_number', 'NON_EXISTENT')
  await supabase.from('demand_forecast').delete().neq('plant_id', 'NON_EXISTENT')
  await supabase.from('inventory').delete().neq('plant_id', 'NON_EXISTENT')
  await supabase.from('vendor_master').delete().neq('vendor_id', 'NON_EXISTENT')
  await supabase.from('plant_material_mapping').delete().neq('plant_id', 'NON_EXISTENT')

  // 2. Upsert Materials
  console.log('Upserting Micron semiconductor materials...')
  const materials = [
    {
      material_id: 'MAT-001',
      material_name: '300mm Prime Silicon Wafers (P-Type <100>)',
      description: 'Ultra-flat prime-grade 300mm single-crystal silicon substrate for high-density 1-beta DRAM and advanced 3D NAND wafer fabrication.',
      material_group: 'RAW_MATERIAL',
      unit_of_measure: 'WAF',
      is_active: true
    },
    {
      material_id: 'MAT-002',
      material_name: 'EUV / ArFi Photoresist Formulation',
      description: 'Extreme Ultraviolet (EUV) and Argon Fluoride immersion lithography photoresist for sub-10nm memory bitlines and vertical gate patterning.',
      material_group: 'CONSUMABLE',
      unit_of_measure: 'LTR',
      is_active: true
    },
    {
      material_id: 'MAT-003',
      material_name: 'Ultra-Pure Electronic Grade IPA (99.999%)',
      description: 'Semiconductor-grade ultra-pure isopropyl alcohol for critical wafer post-etch cleaning, particulate rinse, and cleanroom solvent baths.',
      material_group: 'CONSUMABLE',
      unit_of_measure: 'LTR',
      is_active: true
    },
    {
      material_id: 'MAT-004',
      material_name: 'High-Selectivity Ceria CMP Slurry',
      description: 'Chemical-Mechanical Planarization polishing slurry engineered with ceria nanoparticles for 3D NAND vertical oxide-nitride stack planarization.',
      material_group: 'CONSUMABLE',
      unit_of_measure: 'DRM',
      is_active: true
    },
    {
      material_id: 'MAT-005',
      material_name: 'Class 1 Cleanroom ESD Protective Suits',
      description: 'Particle-free, static-dissipative cleanroom barrier coveralls for fab technicians operating inside ISO Class 1 semiconductor cleanrooms.',
      material_group: 'CONSUMABLE',
      unit_of_measure: 'PKG',
      is_active: true
    },
    {
      material_id: 'MAT-006',
      material_name: 'High-Purity Copper/Gold Wire (0.8 mil)',
      description: 'Semiconductor-grade ultra-fine micro bonding wire for memory die interconnections at Micron ATMP assembly and packaging cleanrooms.',
      material_group: 'RAW_MATERIAL',
      unit_of_measure: 'SPL',
      is_active: true
    },
    {
      material_id: 'MAT-007',
      material_name: 'Capillary Underfill Resin for HBM3E',
      description: 'High thermal conductivity epoxy underfill polymer designed for High Bandwidth Memory (HBM3E / HBM4) 8-Hi and 12-Hi multi-die 3D stacking.',
      material_group: 'RAW_MATERIAL',
      unit_of_measure: 'KG',
      is_active: true
    }
  ]
  const { error: matErr } = await supabase.from('material_master').upsert(materials, { onConflict: 'material_id' })
  if (matErr) throw new Error('Materials upsert failed: ' + matErr.message)

  // 3. Upsert Plants
  console.log('Upserting Micron manufacturing fabs & facilities...')
  const plants = [
    { plant_id: 'PLT-01', plant_name: 'Fab 4 / Technology Center', location: 'Boise, Idaho, USA', is_active: true },
    { plant_id: 'PLT-02', plant_name: 'Fab 15 (Hiroshima Fab)', location: 'Hiroshima, Japan', is_active: true },
    { plant_id: 'PLT-03', plant_name: 'Fab 10 (Singapore Mega-Fab)', location: 'Woodlands, Singapore', is_active: true },
    { plant_id: 'PLT-04', plant_name: 'Fab 11 (Taichung Fab)', location: 'Taichung, Taiwan', is_active: true },
    { plant_id: 'PLT-05', plant_name: 'Sanand ATMP Facility', location: 'Gujarat, India', is_active: true }
  ]
  const { error: pltErr } = await supabase.from('plant_master').upsert(plants, { onConflict: 'plant_id' })
  if (pltErr) throw new Error('Plants upsert failed: ' + pltErr.message)

  // 4. Plant Material Mappings
  console.log('Inserting plant material mappings...')
  const mappings = [
    // PLT-01 (Boise Fab 4)
    { plant_id: 'PLT-01', material_id: 'MAT-001', is_required: true, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-002', is_required: true, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-003', is_required: true, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-004', is_required: true, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-005', is_required: true, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-006', is_required: false, is_active: true },
    { plant_id: 'PLT-01', material_id: 'MAT-007', is_required: true, is_active: true },
    // PLT-02 (Hiroshima Fab 15)
    { plant_id: 'PLT-02', material_id: 'MAT-001', is_required: true, is_active: true },
    { plant_id: 'PLT-02', material_id: 'MAT-002', is_required: true, is_active: true },
    { plant_id: 'PLT-02', material_id: 'MAT-003', is_required: true, is_active: true },
    { plant_id: 'PLT-02', material_id: 'MAT-004', is_required: true, is_active: true },
    { plant_id: 'PLT-02', material_id: 'MAT-005', is_required: true, is_active: true },
    // PLT-03 (Singapore Fab 10)
    { plant_id: 'PLT-03', material_id: 'MAT-001', is_required: true, is_active: true },
    { plant_id: 'PLT-03', material_id: 'MAT-003', is_required: true, is_active: true },
    { plant_id: 'PLT-03', material_id: 'MAT-004', is_required: true, is_active: true },
    { plant_id: 'PLT-03', material_id: 'MAT-005', is_required: true, is_active: true },
    // PLT-04 (Taichung Fab 11)
    { plant_id: 'PLT-04', material_id: 'MAT-001', is_required: true, is_active: true },
    { plant_id: 'PLT-04', material_id: 'MAT-002', is_required: true, is_active: true },
    { plant_id: 'PLT-04', material_id: 'MAT-003', is_required: true, is_active: true },
    // PLT-05 (Sanand ATMP)
    { plant_id: 'PLT-05', material_id: 'MAT-005', is_required: true, is_active: true },
    { plant_id: 'PLT-05', material_id: 'MAT-006', is_required: true, is_active: true },
    { plant_id: 'PLT-05', material_id: 'MAT-007', is_required: true, is_active: true }
  ]
  const { error: mapErr } = await supabase.from('plant_material_mapping').upsert(mappings, { onConflict: 'plant_id,material_id' })
  if (mapErr) throw new Error('Mappings upsert failed: ' + mapErr.message)

  // 5. Insert Real Semiconductor Vendors
  console.log('Upserting real-world semiconductor suppliers...')
  const vendors = [
    // MAT-001 Wafers
    {
      vendor_id: 'VND-001',
      vendor_name: 'Shin-Etsu Handotai (SEH)',
      material_id: 'MAT-001',
      unit_price: 185.00,
      lead_time_days: 12,
      quality_rating: 4.9,
      on_time_delivery: 98.5,
      location: 'Tokyo, Japan',
      is_active: true
    },
    {
      vendor_id: 'VND-002',
      vendor_name: 'SUMCO Corporation',
      material_id: 'MAT-001',
      unit_price: 192.00,
      lead_time_days: 14,
      quality_rating: 4.8,
      on_time_delivery: 96.0,
      location: 'Tokyo, Japan',
      is_active: true
    },
    {
      vendor_id: 'VND-003',
      vendor_name: 'GlobalWafers Co., Ltd.',
      material_id: 'MAT-001',
      unit_price: 178.00,
      lead_time_days: 16,
      quality_rating: 4.6,
      on_time_delivery: 94.0,
      location: 'Hsinchu, Taiwan',
      is_active: true
    },
    // MAT-002 EUV Photoresist
    {
      vendor_id: 'VND-004',
      vendor_name: 'Tokyo Ohka Kogyo (TOK)',
      material_id: 'MAT-002',
      unit_price: 1450.00,
      lead_time_days: 7,
      quality_rating: 4.9,
      on_time_delivery: 97.5,
      location: 'Kawasaki, Japan',
      is_active: true
    },
    {
      vendor_id: 'VND-005',
      vendor_name: 'JSR Corporation',
      material_id: 'MAT-002',
      unit_price: 1520.00,
      lead_time_days: 9,
      quality_rating: 4.8,
      on_time_delivery: 96.0,
      location: 'Tokyo, Japan',
      is_active: true
    },
    {
      vendor_id: 'VND-006',
      vendor_name: 'DuPont Electronic Solutions',
      material_id: 'MAT-002',
      unit_price: 1410.00,
      lead_time_days: 10,
      quality_rating: 4.6,
      on_time_delivery: 93.5,
      location: 'Wilmington, Delaware, USA',
      is_active: true
    },
    // MAT-003 Ultra-Pure IPA
    {
      vendor_id: 'VND-007',
      vendor_name: 'Kanto Chemical Co., Inc.',
      material_id: 'MAT-003',
      unit_price: 28.50,
      lead_time_days: 5,
      quality_rating: 4.7,
      on_time_delivery: 96.0,
      location: 'Tokyo, Japan',
      is_active: true
    },
    {
      vendor_id: 'VND-008',
      vendor_name: 'Entegris, Inc.',
      material_id: 'MAT-003',
      unit_price: 31.00,
      lead_time_days: 6,
      quality_rating: 4.8,
      on_time_delivery: 95.0,
      location: 'Billerica, Massachusetts, USA',
      is_active: true
    },
    // MAT-004 CMP Slurry
    {
      vendor_id: 'VND-009',
      vendor_name: 'Cabot Microelectronics / Entegris',
      material_id: 'MAT-004',
      unit_price: 850.00,
      lead_time_days: 8,
      quality_rating: 4.8,
      on_time_delivery: 95.5,
      location: 'Aurora, Illinois, USA',
      is_active: true
    },
    // MAT-005 Cleanroom ESD Suits
    {
      vendor_id: 'VND-012',
      vendor_name: 'DuPont Cleanroom Solutions',
      material_id: 'MAT-005',
      unit_price: 45.00,
      lead_time_days: 5,
      quality_rating: 4.9,
      on_time_delivery: 98.0,
      location: 'Wilmington, Delaware, USA',
      is_active: true
    },
    {
      vendor_id: 'VND-013',
      vendor_name: 'Kimberly-Clark Professional',
      material_id: 'MAT-005',
      unit_price: 48.50,
      lead_time_days: 4,
      quality_rating: 4.8,
      on_time_delivery: 97.0,
      location: 'Roswell, Georgia, USA',
      is_active: true
    },
    {
      vendor_id: 'VND-014',
      vendor_name: 'Ansell Microflex Protective',
      material_id: 'MAT-005',
      unit_price: 42.00,
      lead_time_days: 7,
      quality_rating: 4.7,
      on_time_delivery: 95.0,
      location: 'Iselin, New Jersey, USA',
      is_active: true
    },
    // MAT-006 Bonding Wire
    {
      vendor_id: 'VND-010',
      vendor_name: 'Tanaka Kikinzoku Kogyo',
      material_id: 'MAT-006',
      unit_price: 120.00,
      lead_time_days: 11,
      quality_rating: 4.7,
      on_time_delivery: 94.5,
      location: 'Tokyo, Japan',
      is_active: true
    },
    // MAT-007 HBM3E Underfill
    {
      vendor_id: 'VND-011',
      vendor_name: 'Namics Corporation',
      material_id: 'MAT-007',
      unit_price: 480.00,
      lead_time_days: 8,
      quality_rating: 4.9,
      on_time_delivery: 98.0,
      location: 'Niigata, Japan',
      is_active: true
    }
  ]
  const { error: vndErr } = await supabase.from('vendor_master').upsert(vendors, { onConflict: 'vendor_id,material_id' })
  if (vndErr) throw new Error('Vendors upsert failed: ' + vndErr.message)

  // 6. Insert Inventory
  console.log('Configuring semiconductor inventory levels...')
  const inventory = [
    // Boise Fab 4
    { material_id: 'MAT-001', plant_id: 'PLT-01', available_stock: 500, safety_stock: 100, maximum_stock: 800 },
    { material_id: 'MAT-002', plant_id: 'PLT-01', available_stock: 20, safety_stock: 80, maximum_stock: 300 }, // INSUFFICIENT
    { material_id: 'MAT-003', plant_id: 'PLT-01', available_stock: 300, safety_stock: 250, maximum_stock: 600 }, // AT_RISK
    { material_id: 'MAT-004', plant_id: 'PLT-01', available_stock: 15, safety_stock: 10, maximum_stock: 50 },
    { material_id: 'MAT-005', plant_id: 'PLT-01', available_stock: 350, safety_stock: 50, maximum_stock: 500 }, // SUFFICIENT
    { material_id: 'MAT-006', plant_id: 'PLT-01', available_stock: 25, safety_stock: 30, maximum_stock: 100 },
    { material_id: 'MAT-007', plant_id: 'PLT-01', available_stock: 60, safety_stock: 40, maximum_stock: 150 },
    // Hiroshima Fab 15
    { material_id: 'MAT-001', plant_id: 'PLT-02', available_stock: 320, safety_stock: 120, maximum_stock: 600 },
    { material_id: 'MAT-002', plant_id: 'PLT-02', available_stock: 45, safety_stock: 40, maximum_stock: 150 },
    { material_id: 'MAT-003', plant_id: 'PLT-02', available_stock: 210, safety_stock: 150, maximum_stock: 500 },
    { material_id: 'MAT-004', plant_id: 'PLT-02', available_stock: 20, safety_stock: 15, maximum_stock: 60 },
    { material_id: 'MAT-005', plant_id: 'PLT-02', available_stock: 180, safety_stock: 40, maximum_stock: 300 },
    // Singapore Fab 10
    { material_id: 'MAT-001', plant_id: 'PLT-03', available_stock: 450, safety_stock: 150, maximum_stock: 900 },
    { material_id: 'MAT-003', plant_id: 'PLT-03', available_stock: 380, safety_stock: 200, maximum_stock: 700 },
    { material_id: 'MAT-004', plant_id: 'PLT-03', available_stock: 35, safety_stock: 20, maximum_stock: 80 },
    { material_id: 'MAT-005', plant_id: 'PLT-03', available_stock: 250, safety_stock: 60, maximum_stock: 500 },
    // Sanand ATMP
    { material_id: 'MAT-005', plant_id: 'PLT-05', available_stock: 200, safety_stock: 50, maximum_stock: 400 },
    { material_id: 'MAT-006', plant_id: 'PLT-05', available_stock: 85, safety_stock: 40, maximum_stock: 200 },
    { material_id: 'MAT-007', plant_id: 'PLT-05', available_stock: 90, safety_stock: 30, maximum_stock: 250 }
  ]
  const { error: invErr } = await supabase.from('inventory').upsert(inventory, { onConflict: 'material_id,plant_id' })
  if (invErr) throw new Error('Inventory upsert failed: ' + invErr.message)

  // 7. Insert Demand Forecasts
  console.log('Inserting demand forecasts...')
  const forecasts = [
    { material_id: 'MAT-001', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 120 },
    { material_id: 'MAT-001', plant_id: 'PLT-01', forecast_period: '2026-11-01', forecast_quantity: 140 },
    { material_id: 'MAT-002', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 30 },
    { material_id: 'MAT-002', plant_id: 'PLT-01', forecast_period: '2026-11-01', forecast_quantity: 35 },
    { material_id: 'MAT-003', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 60 },
    { material_id: 'MAT-003', plant_id: 'PLT-01', forecast_period: '2026-11-01', forecast_quantity: 75 },
    { material_id: 'MAT-004', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 5 },
    { material_id: 'MAT-005', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 30 },
    { material_id: 'MAT-006', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 10 },
    { material_id: 'MAT-007', plant_id: 'PLT-01', forecast_period: '2026-10-01', forecast_quantity: 15 },
    { material_id: 'MAT-001', plant_id: 'PLT-02', forecast_period: '2026-10-01', forecast_quantity: 90 },
    { material_id: 'MAT-002', plant_id: 'PLT-02', forecast_period: '2026-10-01', forecast_quantity: 40 },
    { material_id: 'MAT-001', plant_id: 'PLT-03', forecast_period: '2026-10-01', forecast_quantity: 150 },
    { material_id: 'MAT-006', plant_id: 'PLT-05', forecast_period: '2026-10-01', forecast_quantity: 25 },
    { material_id: 'MAT-007', plant_id: 'PLT-05', forecast_period: '2026-10-01', forecast_quantity: 20 }
  ]
  const { error: fctErr } = await supabase.from('demand_forecast').upsert(forecasts, { onConflict: 'material_id,plant_id,forecast_period' })
  if (fctErr) throw new Error('Forecasts upsert failed: ' + fctErr.message)

  // 8. Insert Historical PRs for duplicate detection
  console.log('Inserting historical requisitions for duplicate detection...')
  const historicalPRs = [
    {
      pr_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      pr_number: 'PR-2026-00001',
      material_id: 'MAT-001',
      plant_id: 'PLT-01',
      quantity: 200,
      required_date: '2026-09-20',
      requestor_name: 'Gagan Rachakonda',
      requestor_email: 'gaganrachakonda.work@gmail.com',
      status: 'APPROVED',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      pr_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      pr_number: 'PR-2026-00002',
      material_id: 'MAT-003',
      plant_id: 'PLT-01',
      quantity: 150,
      required_date: '2026-09-18',
      requestor_name: 'Bhargav Teja',
      requestor_email: 'bhargav.teja@micron.demo',
      status: 'CREATED',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      pr_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
      pr_number: 'PR-2026-00003',
      material_id: 'MAT-002',
      plant_id: 'PLT-02',
      quantity: 50,
      required_date: '2026-09-25',
      requestor_name: 'Nikitha Rao',
      requestor_email: 'nikitha.rao@micron.demo',
      status: 'COMPLETED',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      pr_id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
      pr_number: 'PR-2026-00004',
      material_id: 'MAT-006',
      plant_id: 'PLT-05',
      quantity: 30,
      required_date: '2026-09-22',
      requestor_name: 'Ruthvik Reddy',
      requestor_email: 'ruthvik.reddy@micron.demo',
      status: 'UNDER_REVIEW',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
  const { error: prErr } = await supabase.from('purchase_requisitions').upsert(historicalPRs, { onConflict: 'pr_id' })
  if (prErr) throw new Error('Historical PRs upsert failed: ' + prErr.message)

  console.log('✅ Micron semiconductor data successfully seeded into live Supabase database!')
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
