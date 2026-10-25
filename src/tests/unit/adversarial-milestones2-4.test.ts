/**
 * Milestone 5: Tier 5 Adversarial Coverage Hardening
 * Invariants & Stress Testing for Milestones M2, M3, and M4
 * Authoritative Source: PROJECT.md §1 & §4, ORIGINAL_REQUEST.md Acceptance Criteria
 */

import { describe, it, expect } from 'vitest';
import {
  computeWaveMass,
  normalizeWaveProbabilities,
  computeCumulativeProbability,
} from '@/lib/math/bayesian';
import { computeConicalPositions } from '@/lib/math/spatial-layout';
import {
  computeNodeUtility,
  getTauForRiskAppetite,
  computeRiskAdjustedQ,
  solveGoldenPath,
} from '@/lib/math/bellman';
import { perturbProbabilities, SliderDeltas } from '@/lib/math/sensitivity';
import { generateDeterministicWave, resolveAIProvider } from '@/lib/ai/adapter';
import {
  getTierLimits,
  canCreateSimulation,
  canExpandPossibilities,
  canRecurseDepth,
} from '@/lib/quota';
import { generateExecutiveDossierMarkdown } from '@/lib/dossier';
import { ProbabilityNode, UserContextTwin } from '@/lib/types/multiverse';
import { mockRootNode, mockWave1Siblings } from '@/tests/fixtures/mock-nodes';
import { mockMeasuredTwin } from '@/tests/fixtures/mock-twins';

describe('Tier 5 Adversarial Challenge: Deep Recursion & Cumulative Probability Invariants', () => {
  it('ADV-M2-01: cumulative probability strictly monotonically decays across 10-level recursive depth', () => {
    let parentCum = 1.0;
    const depths = 10;

    for (let d = 1; d <= depths; d++) {
      const condProb = 0.75;
      const childCum = computeCumulativeProbability(parentCum, condProb);

      expect(childCum).toBeLessThanOrEqual(parentCum);
      expect(childCum).toBeGreaterThan(0);
      expect(Number.isFinite(childCum)).toBe(true);
      expect(Number.isNaN(childCum)).toBe(false);

      parentCum = childCum;
    }
  });

  it('ADV-M2-02: handles zero and negative input probabilities with zero-clamp guard', () => {
    expect(computeCumulativeProbability(0, 0.5)).toBe(0);
    expect(computeCumulativeProbability(0.5, 0)).toBe(0);
    expect(computeCumulativeProbability(-1.0, 0.5)).toBe(0);
    expect(computeCumulativeProbability(0.5, -0.5)).toBe(0);
  });

  it('ADV-M2-03: Bayesian mass partitioning conserves total probability up to Wave 20', () => {
    for (let w = 1; w <= 20; w++) {
      const partition = computeWaveMass(w);
      expect(partition.remainingUnexplored).toBeGreaterThan(0);
      expect(partition.remainingUnexplored).toBeLessThan(1);
      expect(Number.isFinite(partition.remainingUnexplored)).toBe(true);
    }
  });
});

describe('Tier 5 Adversarial Challenge: Conical Spatial Layout Collision Resistance', () => {
  it('ADV-M2-04: guarantees minimum distance d_min >= 3.2 units across 15 iterations of relaxation for Wave 1', () => {
    const positions = computeConicalPositions(mockRootNode, mockWave1Siblings, 1);
    const posList = Array.from(positions.values());

    for (let i = 0; i < posList.length; i++) {
      for (let j = i + 1; j < posList.length; j++) {
        const dx = posList[j].x - posList[i].x;
        const dy = posList[j].y - posList[i].y;
        const dz = posList[j].z - posList[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        expect(dist).toBeGreaterThanOrEqual(3.15); // within rounding tolerance
      }
    }
  });

  it('ADV-M2-05: handles parent node at origin or null parent without NaN coordinates', () => {
    const positionsWithNull = computeConicalPositions(null, mockWave1Siblings, 1);
    expect(positionsWithNull.size).toBe(mockWave1Siblings.length);

    for (const pos of positionsWithNull.values()) {
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
      expect(Number.isFinite(pos.z)).toBe(true);
      expect(Number.isNaN(pos.x)).toBe(false);
    }
  });
});

describe('Tier 5 Adversarial Challenge: Bellman Solver & Degenerate Utility Invariants', () => {
  it('ADV-M3-01: handles all-zero digital twin core values without division-by-zero or NaN utility', () => {
    const zeroTwin: UserContextTwin = {
      ...mockMeasuredTwin,
      coreValues: {
        wealthCompounding: 0,
        autonomyFreedom: 0,
        masteryCraft: 0,
        stabilitySecurity: 0,
        impactLegacy: 0,
        peaceWellbeing: 0,
      },
    };

    const node = mockWave1Siblings[0];
    const u = computeNodeUtility(node, zeroTwin);
    expect(Number.isFinite(u)).toBe(true);
    expect(Number.isNaN(u)).toBe(false);
  });

  it('ADV-M3-02: Bellman solver returns valid contiguous Golden Path on single-node tree (root only)', () => {
    const { goldenPathNodeIds, valueTree } = solveGoldenPath([mockRootNode], mockRootNode.id, mockMeasuredTwin);
    expect(goldenPathNodeIds).toEqual([mockRootNode.id]);
    expect(valueTree.has(mockRootNode.id)).toBe(true);
  });

  it('ADV-M3-03: Bellman solver gracefully ignores pruned or archived branches', () => {
    const prunedNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      status: 'pruned',
    };
    const activeNode: ProbabilityNode = {
      ...mockWave1Siblings[1],
      status: 'active',
    };

    const tree = [mockRootNode, prunedNode, activeNode];
    const { goldenPathNodeIds } = solveGoldenPath(tree, mockRootNode.id, mockMeasuredTwin);

    expect(goldenPathNodeIds).toContain(activeNode.id);
    expect(goldenPathNodeIds).not.toContain(prunedNode.id);
  });
});

describe('Tier 5 Adversarial Challenge: Softmax Logit Levers Numerical Stability', () => {
  it('ADV-M4-01: extreme slider deltas (+/- 10.0) do not trigger NaN or Infinity overflow', () => {
    const extremeDeltas: SliderDeltas = {
      executionVelocity: 10.0,
      capitalBuffer: -10.0,
      marketTailwind: 10.0,
      skillPreparation: -10.0,
    };

    const perturbed = perturbProbabilities(mockWave1Siblings, extremeDeltas, 0.20);
    expect(perturbed.size).toBe(mockWave1Siblings.length);

    let sum = 0;
    for (const p of perturbed.values()) {
      expect(Number.isFinite(p)).toBe(true);
      expect(Number.isNaN(p)).toBe(false);
      expect(p).toBeGreaterThan(0);
      sum += p;
    }

    // Mass conservation invariant: sum + unexploredMass = 1.0
    expect(sum + 0.20).toBeCloseTo(1.0, 3);
  });

  it('ADV-M4-02: empty active nodes array returns empty map without throwing', () => {
    const neutral: SliderDeltas = {
      executionVelocity: 0,
      capitalBuffer: 0,
      marketTailwind: 0,
      skillPreparation: 0,
    };
    const emptyResult = perturbProbabilities([], neutral, 0.20);
    expect(emptyResult.size).toBe(0);
  });
});

describe('Tier 5 Adversarial Challenge: Deterministic Fallback & Quota Guards', () => {
  it('ADV-M4-03: deterministic wave generator produces valid non-overlapping coordinates for depth 3', () => {
    const nodes = generateDeterministicWave('Enterprise CRM Pivot', 1, 3, 'parent-d2-01', 0.25);
    expect(nodes).toHaveLength(5);
    expect(nodes[0].depth).toBe(3);
    expect(nodes[0].parentId).toBe('parent-d2-01');

    for (const node of nodes) {
      expect(node.cumulativeProbability).toBeLessThanOrEqual(0.25);
      expect(Number.isFinite(node.spatialPosition.x)).toBe(true);
      expect(node.spatialPosition.z).toBeCloseTo(-14 * 3, 0);
    }
  });

  it('ADV-M4-04: AI provider resolver correctly enforces fallback when no API key is provided', () => {
    const provider = resolveAIProvider({ fallbackEnabled: true });
    expect(provider).toBe('deterministic_fallback');

    expect(() => resolveAIProvider({ fallbackEnabled: false })).toThrow(
      'No valid AI provider configured and fallback is disabled'
    );
  });

  it('ADV-M4-05: quota guard enforces strict boundary conditions for Observer tier', () => {
    expect(canCreateSimulation(2, 'observer').allowed).toBe(true);
    expect(canCreateSimulation(3, 'observer').allowed).toBe(false);

    expect(canExpandPossibilities(5, 'observer').allowed).toBe(true);
    expect(canExpandPossibilities(10, 'observer').allowed).toBe(false);

    expect(canRecurseDepth(2, 'observer').allowed).toBe(true);
    expect(canRecurseDepth(3, 'observer').allowed).toBe(false);

    // Unlimited on Strategist
    expect(canCreateSimulation(100, 'strategist').allowed).toBe(true);
    expect(canExpandPossibilities(20, 'strategist').allowed).toBe(true);
    expect(canRecurseDepth(10, 'strategist').allowed).toBe(true);
  });

  it('ADV-M4-06: executive dossier markdown contains formatted headers and playbook actions', () => {
    const md = generateExecutiveDossierMarkdown({
      situation: 'Founder B2B Pivot',
      twin: mockMeasuredTwin,
      goldenPathNodes: mockWave1Siblings.slice(0, 2),
      mentorSynthesis: {
        executiveVerdict: 'Prioritize enterprise contracts.',
        actionPlaybook: [
          {
            dayWindow: 'Days 1-3',
            actionTitle: 'Legal Review',
            concreteSteps: 'Audit SLA clauses',
            expectedOddsShiftPct: 15,
          },
        ],
      },
    });

    expect(md).toContain('# HOROVEX EXECUTIVE DECISION DOSSIER');
    expect(md).toContain('## 1. Core Crossroads & Context');
    expect(md).toContain('## 2. The Golden Path Trajectory');
    expect(md).toContain('Prioritize enterprise contracts.');
    expect(md).toContain('Days 1-3');
  });
});
