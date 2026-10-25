/**
 * SaaS Tier Gating & Quota Guard
 * Authoritative Source: docs/PRD.md §5, docs/HLD.md §2 & PROJECT.md §1
 */

import { SubscriptionTier } from './types/multiverse';

export interface TierLimits {
  maxSimulations: number;
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

export function canCreateSimulation(
  currentCount: number,
  tier: SubscriptionTier
): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (currentCount < limits.maxSimulations) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Observer tier is limited to ${limits.maxSimulations} active simulations. Upgrade to Strategist for unlimited canvases.`,
  };
}

export function canExpandPossibilities(
  currentCount: number,
  tier: SubscriptionTier
): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (currentCount < limits.maxPossibilitiesPerNode) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Observer tier is capped at ${limits.maxPossibilitiesPerNode} outcomes per node. Upgrade to Strategist to expand to 25+ possibilities.`,
  };
}

export function canRecurseDepth(
  currentDepth: number,
  tier: SubscriptionTier
): { allowed: boolean; upgradeMessage?: string } {
  const limits = getTierLimits(tier);
  if (currentDepth < limits.maxRecursiveDepth) {
    return { allowed: true };
  }
  return {
    allowed: false,
    upgradeMessage: `Observer tier allows recursion up to Depth ${limits.maxRecursiveDepth}. Upgrade to Strategist for infinite causal trees.`,
  };
}
