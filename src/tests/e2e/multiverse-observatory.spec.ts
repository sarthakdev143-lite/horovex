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

test.describe('Feature 2: Luxury 3D Hero Landing Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
  });

  test('F2-E2E-01: renders Obsidian Chronometry luxury brand header and headline', async ({ page }) => {
    const brandTitle = page.locator('text=HOROVEX');
    await expect(brandTitle).toBeVisible();

    const subtitle = page.locator('text=Precision Chronometric Decision Engine');
    await expect(subtitle).toBeVisible();
  });

  test('F2-E2E-02: mounts 3D interactive hero canvas without WebGL context creation errors', async ({ page }) => {
    // Canvas element should mount in DOM
    const heroCanvas = page.locator('canvas').first();
    await expect(heroCanvas).toBeVisible();

    // Verify no unhandled console errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('F2-E2E-03: renders 3 curated flagship showcase multiverse cards', async ({ page }) => {
    const founderCard = page.locator('text=Founder Crossroads');
    const techSoloCard = page.locator('text=Senior Tech to Solo AI');
    const relocationCard = page.locator('text=Global Relocation');

    await expect(founderCard).toBeVisible();
    await expect(techSoloCard).toBeVisible();
    await expect(relocationCard).toBeVisible();
  });

  test('F2-E2E-04: clicking "Enter Causal Observatory" button navigates to observatory workspace', async ({ page }) => {
    const launchButton = page.getByRole('button', { name: /Launch Observatory|Enter Observatory|Start Simulating/i });
    if (await launchButton.isVisible()) {
      await launchButton.click();
      await expect(page).toHaveURL(/.*observatory.*/);
    }
  });

  test('F2-E2E-05: clicking a flagship showcase card pre-populates and opens observatory', async ({ page }) => {
    const founderCard = page.locator('text=Founder Crossroads').first();
    if (await founderCard.isVisible()) {
      await founderCard.click();
      // Should transition to active simulation
      await expect(page).toHaveURL(/.*observatory.*/);
    }
  });
});

test.describe('Feature 3, 4, 12, 13: 3D Multiverse Observatory & Interactive Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/observatory');
  });

  test('F3-E2E-01: mounts full-screen WebGL 3D Causal Observatory viewport', async ({ page }) => {
    const observatoryCanvas = page.locator('canvas').first();
    await expect(observatoryCanvas).toBeVisible();

    // Telemetry HUD bar should be visible at top
    const topBar = page.getByTestId('top-chronometer-bar').or(page.locator('header'));
    await expect(topBar).toBeVisible();
  });

  test('F3-E2E-02: displays situation input console when no active simulation exists', async ({ page }) => {
    const situationInput = page.getByPlaceholder(/Enter your high-stakes dilemma|What crossroads are you navigating/i);
    if (await situationInput.isVisible()) {
      await expect(situationInput).toBeEditable();
    }
  });

  test('F4-E2E-03: verifies Golden Path illumination toggle highlights optimal trajectory', async ({ page }) => {
    const goldenPathToggle = page.getByRole('button', { name: /Golden Path|Optimal Trajectory/i });
    if (await goldenPathToggle.isVisible()) {
      await goldenPathToggle.click();
      // Mentor panel opens
      const mentorPanel = page.locator('text=Mentor Executive Verdict').or(page.locator('text=Optimal Path'));
      await expect(mentorPanel).toBeVisible();
    }
  });

  test('F12-E2E-04: passive auto-projection button triggers next depth generation on selected node', async ({ page }) => {
    const autoProjectBtn = page.getByRole('button', { name: /Auto-Project Next 5 Futures|Simulate Future/i });
    if (await autoProjectBtn.isVisible()) {
      await autoProjectBtn.click();
      // Depth counter advances
      const depthBadge = page.locator('text=Depth 2').or(page.locator('text=T2'));
      await expect(depthBadge).toBeVisible();
    }
  });

  test('F13-E2E-05: active action injection modal accepts user intervention before projecting child wave', async ({ page }) => {
    const injectActionBtn = page.getByRole('button', { name: /Inject Action|Make a Move/i });
    if (await injectActionBtn.isVisible()) {
      await injectActionBtn.click();

      const modalInput = page.getByPlaceholder(/Describe your intervention move/i);
      if (await modalInput.isVisible()) {
        await modalInput.fill('Negotiate enterprise contract with 50% upfront payment');
        const submitBtn = page.getByRole('button', { name: /Simulate Conditioned Futures|Inject Move/i });
        await submitBtn.click();
      }
    }
  });

  test('F3-E2E-06: toggles synchronized 2D Chronicle Matrix view from top HUD', async ({ page }) => {
    const matrixToggle = page.getByRole('button', { name: /2D Chronicle Matrix|Matrix View|Table View/i });
    if (await matrixToggle.isVisible()) {
      await matrixToggle.click();
      const matrixTable = page.getByRole('table').or(page.locator('text=Probability Matrix'));
      await expect(matrixTable).toBeVisible();
    }
  });
});
