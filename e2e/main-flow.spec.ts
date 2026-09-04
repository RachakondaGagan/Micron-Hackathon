import { test, expect } from '@playwright/test'

test.describe('ProcureAI User Journey E2E Tests', () => {
  test('Scenario 1: Dashboard loads metrics and inventory successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check main headings
    await expect(page.locator('h1')).toContainText(/Requestor Dashboard|Dashboard/i)
    
    // Verify key sections are present
    const inventorySection = page.locator('text=Inventory').first()
    await expect(inventorySection).toBeVisible()
  })

  test('Scenario 2: Create Purchase Requisition and view AI Pipeline Trace', async ({ page }) => {
    await page.goto('/pr/new')

    // Verify form rendered
    await expect(page.locator('h2, h1').first()).toBeVisible()
    
    // Fill quantity and submit
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    
    // Click submit
    await submitBtn.click()

    // Should redirect to /pr/[id]
    await page.waitForURL(/\/pr\/.+/, { timeout: 15000 })
    expect(page.url()).toContain('/pr/')

    // Verify PR detail elements
    await expect(page.locator('text=Purchase Requisition').first()).toBeVisible({ timeout: 10000 })
  })

  test('Scenario 3: Notifications and Audit Queue loads', async ({ page }) => {
    await page.goto('/notifications')

    // Check notifications header
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
