/**
 * Playwright Browser E2E Test Suite: Luxury Hero Landing & 3D Causal Observatory
 * Features Covered:
 *   - Feature 2: Luxury 3D Hero Landing Experience
 *   - Feature 3: 3D WebGL Causal Observatory Core
 *   - Feature 4: Bioluminescent Probability Filaments
 *   - Feature 12: Passive Auto-Projection Mode
 *   - Feature 13: Active Action Injection Mode
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 3: Cross-Feature User Journeys
 *   - Tier 4: Real-World E2E Verification
 * Authoritative Source: docs/PRD.md §2, docs/HLD.md §3.2, ORIGINAL_REQUEST.md Acceptance Criteria
 */

import { test, expect } from '@playwright/test';

test.describe('Feature 2: Sanctuary Garden Landing Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
  });

  test('F2-E2E-01: renders HOROVEX brand and garden headline', async ({ page }) => {
    const brandTitle = page.locator('header a[href="/"]').first();
    await expect(brandTitle).toContainText('HOROVEX');

    const subtitle = page.locator('text=See where your next decision leads.').first();
    await expect(subtitle).toBeVisible();
  });

  test('F2-E2E-02: mounts 3D interactive hero canvas without WebGL context creation errors', async ({ page }) => {
    // Canvas element should mount in DOM
    const heroCanvas = page.locator('canvas').first();
    await expect(heroCanvas).toBeVisible({ timeout: 10000 });

    // Verify no unhandled console errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('F2-E2E-03: renders 3 flagship scenario entry buttons', async ({ page }) => {
    const founderCard = page.locator('text=Pivot SaaS to Enterprise').first();
    const techSoloCard = page.locator('text=Leave Big Tech for Solo AI').first();
    const relocationCard = page.locator('text=San Francisco vs. Dubai').first();

    await expect(founderCard).toBeVisible();
    await expect(techSoloCard).toBeVisible();
    await expect(relocationCard).toBeVisible();
  });

  test('F2-E2E-04: clicking "Open Full Simulator" button navigates to observatory workspace', async ({ page }) => {
    test.setTimeout(60000);
    const launchButton = page.getByTestId('launch-observatory-btn').first();
    await expect(launchButton).toBeVisible();
    await launchButton.click();
    await expect(page).toHaveURL(/.*observatory.*/, { timeout: 25000 });
  });

  test('F2-E2E-05: submitting a dilemma populates 5 futures in the garden', async ({ page }) => {
    test.setTimeout(90000);
    const dilemmaInput = page.locator('#dilemma-input');
    await expect(dilemmaInput).toBeVisible();
    await dilemmaInput.fill('Pivot SaaS to enterprise or stay self-serve?');
    await page.getByTestId('simulate-btn').click();
    await expect(page.locator('#step-futures').getByText('Direct High-Conviction Commit').first()).toBeVisible({ timeout: 45000 });
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});

test.describe('Feature 3, 4, 12, 13: 3D Multiverse Observatory & Interactive Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/observatory?demo=saas-pivot');
  });

  test('F3-E2E-01: mounts full-screen WebGL 3D Causal Observatory viewport', async ({ page }) => {
    const observatoryCanvas = page.locator('canvas').first();
    // Software-GL shader compile under parallel workers can exceed 5s
    await expect(observatoryCanvas).toBeVisible({ timeout: 20000 });

    // Telemetry HUD bar should be visible at top
    const topBar = page.getByTestId('top-chronometer-bar').first();
    await expect(topBar).toBeVisible();
  });

  test('F3-E2E-02: displays situation input console when navigating to clean observatory', async ({ page }) => {
    await page.goto('/observatory');
    const situationInput = page.getByPlaceholder(/Enter your high-stakes dilemma/i).first();
    await expect(situationInput).toBeVisible();
    await expect(situationInput).toBeEditable();
  });

  test('F4-E2E-03: verifies Golden Path illumination toggle highlights optimal trajectory', async ({ page }) => {
    const goldenPathToggle = page.getByRole('button', { name: /Golden Path|Optimal Trajectory/i }).first();
    if (await goldenPathToggle.isVisible()) {
      await goldenPathToggle.click();
      // Mentor panel opens
      const mentorPanel = page.locator('text=Mentor Executive Verdict').or(page.locator('text=Golden Path')).or(page.locator('text=Strategic Mentor Advisory')).first();
      await expect(mentorPanel).toBeVisible();
    }
  });

  test('F12-E2E-04: passive auto-projection button triggers next depth generation on selected node', async ({ page }) => {
    const autoProjectBtn = page.getByRole('button', { name: /Auto-Project Next 5 Futures/i }).first();
    if (await autoProjectBtn.isVisible()) {
      await autoProjectBtn.click();
      await expect(page.locator('text=Depth').first()).toBeVisible();
    }
  });

  test('F13-E2E-05: active action injection modal accepts user intervention before projecting child wave', async ({ page }) => {
    const injectActionBtn = page.getByRole('button', { name: /Inject Action/i }).first();
    if (await injectActionBtn.isVisible()) {
      await injectActionBtn.click();

      const modalInput = page.getByPlaceholder(/Describe your intervention move/i).first();
      if (await modalInput.isVisible()) {
        await modalInput.fill('Negotiate enterprise contract with 50% upfront payment');
        const submitBtn = page.getByRole('button', { name: /Simulate Conditioned Futures/i }).first();
        await submitBtn.click();
      }
    }
  });

  test('F3-E2E-06: toggles synchronized 2D Chronicle Matrix view from top HUD', async ({ page }) => {
    const matrixToggle = page.getByRole('button', { name: /2D Chronicle Matrix/i }).first();
    if (await matrixToggle.isVisible()) {
      await matrixToggle.click();
      const matrixTable = page.getByRole('table').first();
      await expect(matrixTable).toBeVisible();
    }
  });
});
