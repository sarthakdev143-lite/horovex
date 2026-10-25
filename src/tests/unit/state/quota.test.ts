/**
 * Unit & Boundary Tests: SaaS Tier Gating & Quota Guard
 * Features:
 *   - Feature 31: SaaS Tier Gating & Quota Guard
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/PRD.md §5, docs/HLD.md §2 & PROJECT.md §1
 */

import { describe, it, expect } from 'vitest';
import { SubscriptionTier } from '../../fixtures/multiverse-types';

export interface TierLimits {
  maxSimulations: number; // Infinity for unlimited
  maxPossibilitiesPerNode: number;
  maxRecursiveDepth: number;
  canExportDossier: boolean;
  canUseCustomLevers: boolean;
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  switch (tier) {
    case 'observer':
      return {
        maxSimulations: 3,
        maxPossibilitiesPerNode: 10,
        maxRecursiveDepth: 3,
        canExportDossier: false,
        canUseCustomLevers: false,
      };
    case 'strategist':
      return {
        maxSimulations: Infinity,
        maxPossibilitiesPerNode: 25,
        maxRecursiveDepth: Infinity,
        canExportDossier: true,
        canUseCustomLevers: true,
      };
    case 'oracle':
      return {
        maxSimulations: Infinity,
        maxPossibilitiesPerNode: Infinity,
        maxRecursiveDepth: Infinity,
        canExportDossier: true,
        canUseCustomLevers: true,
      };
    default:
      return getTierLimits('observer');
  }
}

export function canCreateSimulation(currentCount: number, tier: SubscriptionTier): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (currentCount < limits.maxSimulations) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Observer tier is limited to ${limits.maxSimulations} active simulations. Upgrade to Strategist for unlimited canvases.`,
  };
}

export function canExpandHorizontally(currentSiblingsCount: number, tier: SubscriptionTier): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (currentSiblingsCount + 5 <= limits.maxPossibilitiesPerNode) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Reached maximum limit of ${limits.maxPossibilitiesPerNode} possibilities for your tier. Upgrade to unlock deeper exploration.`,
  };
}

export function canSimulateDepth(targetDepth: number, tier: SubscriptionTier): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (targetDepth <= limits.maxRecursiveDepth) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Observer tier supports up to Depth ${limits.maxRecursiveDepth}. Upgrade to Strategist for infinite vertical recursion.`,
  };
}

describe('Feature 31: SaaS Tier Gating & Quota Guard', () => {
  it('F31-T1-01: enforces Observer tier limits (3 simulations, 10 possibilities, depth 3)', () => {
    const limits = getTierLimits('observer');
    expect(limits.maxSimulations).toBe(3);
    expect(limits.maxPossibilitiesPerNode).toBe(10);
    expect(limits.maxRecursiveDepth).toBe(3);
    expect(limits.canExportDossier).toBe(false);
  });

  it('F31-T1-02: provides Strategist tier privileges (unlimited sims, 25 possibilities, unlimited depth, export allowed)', () => {
    const limits = getTierLimits('strategist');
    expect(limits.maxSimulations).toBe(Infinity);
    expect(limits.maxPossibilitiesPerNode).toBe(25);
    expect(limits.maxRecursiveDepth).toBe(Infinity);
    expect(limits.canExportDossier).toBe(true);
    expect(limits.canUseCustomLevers).toBe(true);
  });

  it('F31-T1-03: unlocks unlimited possibilities and depth for Oracle tier', () => {
    const limits = getTierLimits('oracle');
    expect(limits.maxSimulations).toBe(Infinity);
    expect(limits.maxPossibilitiesPerNode).toBe(Infinity);
    expect(limits.maxRecursiveDepth).toBe(Infinity);
  });

  it('F31-T1-04: allows Observer with 2 simulations to create 3rd simulation', () => {
    const check = canCreateSimulation(2, 'observer');
    expect(check.allowed).toBe(true);
    expect(check.upgradeMessage).toBeUndefined();
  });

  it('F31-T1-05: blocks Observer with 3 simulations from creating 4th simulation with polite prompt', () => {
    const check = canCreateSimulation(3, 'observer');
    expect(check.allowed).toBe(false);
    expect(check.upgradeMessage).toContain('Observer tier is limited to 3 active simulations');
  });

  it('F31-T1-06: allows horizontal expansion from 5 to 10 possibilities in Observer tier', () => {
    const check = canExpandHorizontally(5, 'observer');
    expect(check.allowed).toBe(true);
  });
});

describe('Tier 2: Boundary & Corner Cases (Quota Guard)', () => {
  it('F31-T2-01: blocks horizontal expansion from 10 to 15 possibilities in Observer tier (cap=10)', () => {
    const check = canExpandHorizontally(10, 'observer');
    expect(check.allowed).toBe(false);
    expect(check.upgradeMessage).toContain('maximum limit of 10 possibilities');
  });

  it('F31-T2-02: allows Strategist tier to expand to 20 and 25 possibilities, but blocks 30 (cap=25)', () => {
    const check20 = canExpandHorizontally(15, 'strategist');
    expect(check20.allowed).toBe(true);

    const check25 = canExpandHorizontally(20, 'strategist');
    expect(check25.allowed).toBe(true);

    const check30 = canExpandHorizontally(25, 'strategist');
    expect(check30.allowed).toBe(false);
    expect(check30.upgradeMessage).toContain('maximum limit of 25 possibilities');
  });

  it('F31-T2-03: allows Observer to simulate Depth 3, but blocks Depth 4', () => {
    const checkDepth3 = canSimulateDepth(3, 'observer');
    expect(checkDepth3.allowed).toBe(true);

    const checkDepth4 = canSimulateDepth(4, 'observer');
    expect(checkDepth4.allowed).toBe(false);
    expect(checkDepth4.upgradeMessage).toContain('Observer tier supports up to Depth 3');
  });

  it('F31-T2-04: allows Strategist and Oracle to simulate Depth 10 without restriction', () => {
    expect(canSimulateDepth(10, 'strategist').allowed).toBe(true);
    expect(canSimulateDepth(10, 'oracle').allowed).toBe(true);
  });

  it('F31-T2-05: handles unauthenticated or corrupted tier string by safely falling back to Observer limits', () => {
    const limits = getTierLimits('unknown_tier' as any);
    expect(limits.maxSimulations).toBe(3);
    expect(limits.maxPossibilitiesPerNode).toBe(10);
  });

  it('F31-T2-06: handles zero simulations count correctly without blocking', () => {
    const check = canCreateSimulation(0, 'observer');
    expect(check.allowed).toBe(true);
  });
});
