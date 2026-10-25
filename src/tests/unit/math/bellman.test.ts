/**
 * Unit & Boundary Tests: Bellman Expected Utility & Golden Path Solver
 * Features:
 *   - Feature 17: Multi-Objective Node Utility Scorer
 *   - Feature 18: Bellman Expected Utility Golden Path Solver
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/LLD.md §2.2 & PROJECT.md §2
 */

import { describe, it, expect } from 'vitest';
import {
  computeNodeUtility,
  getTauForRiskAppetite,
  computeRiskAdjustedQ,
  solveGoldenPath,
} from '../../fixtures/reference-math';
import {
  mockConservativeTwin,
  mockMeasuredTwin,
  mockAggressiveTwin,
  mockAsymmetricTwin,
} from '../../fixtures/mock-twins';
import { mockWave1Siblings, mockRootNode } from '../../fixtures/mock-nodes';
import { ProbabilityNode, UserContextTwin } from '../../fixtures/multiverse-types';

describe('Feature 17: Multi-Objective Node Utility Scorer', () => {
  it('F17-T1-01: scores utility combining 6D alignment, reversibility (lambda=0.35), and regret (lambda=0.45)', () => {
    const node = mockWave1Siblings[0]; // Self-Funded Micro-Pivot
    const u = computeNodeUtility(node, mockMeasuredTwin);

    // Should produce positive utility for aligned bootstrap path
    expect(u).toBeGreaterThan(0);
    expect(Number.isFinite(u)).toBe(true);
  });

  it('F17-T1-02: heavily penalizes low-reversibility Type 1 trap nodes unless offset by massive alignment', () => {
    const irreversibleNode: ProbabilityNode = {
      ...mockWave1Siblings[1],
      reversibilityType: 'type_1_irreversible',
      reversibilityScore: 1.0, // Severe irreversible trap
      regretMinimizationScore: 3.0,
    };

    const reversibleNode: ProbabilityNode = {
      ...mockWave1Siblings[1],
      reversibilityType: 'type_2_reversible',
      reversibilityScore: 9.0, // Highly reversible two-way door
      regretMinimizationScore: 3.0,
    };

    const uIrreversible = computeNodeUtility(irreversibleNode, mockMeasuredTwin);
    const uReversible = computeNodeUtility(reversibleNode, mockMeasuredTwin);

    expect(uReversible - uIrreversible).toBeCloseTo(0.35 * (9.0 - 1.0), 2);
    expect(uReversible).toBeGreaterThan(uIrreversible);
  });

  it('F17-T1-03: scores catastrophic burnout node as negative utility', () => {
    const burnoutNode = mockWave1Siblings[4]; // Graceful Stagnation & Burnout
    const u = computeNodeUtility(burnoutNode, mockMeasuredTwin);

    expect(u).toBeLessThan(0);
  });

  it('F17-T1-04: weights stability heavily for conservative profile vs. aggressive profile', () => {
    const stableCorporateNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      impactVector: { wealth: 3.0, autonomy: -2.0, mastery: 3.0, stability: 9.0, impact: 2.0, peace: 7.0 },
      reversibilityScore: 7.0,
      regretMinimizationScore: 5.0,
    };

    const uConservative = computeNodeUtility(stableCorporateNode, mockConservativeTwin);
    const uAggressive = computeNodeUtility(stableCorporateNode, mockAggressiveTwin);

    // Conservative profile (stability weight 0.95) should value this significantly higher than aggressive (stability 0.35)
    expect(uConservative).toBeGreaterThan(uAggressive);
  });

  it('F17-T1-05: correctly normalizes alignment by L1-norm of twin weights', () => {
    const dummyNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      impactVector: { wealth: 5, autonomy: 5, mastery: 5, stability: 5, impact: 5, peace: 5 },
      reversibilityScore: 5.0, // delta = 0
      regretMinimizationScore: 5.0, // delta = 0
    };

    const u = computeNodeUtility(dummyNode, mockMeasuredTwin);
    // Since all impacts are 5 and deltas are 0, normalized alignment must be exactly 5.0
    expect(u).toBeCloseTo(5.0, 3);
  });

  it('F17-T1-06: 10-year regret minimization component shifts score by lambda=0.45 * (RMS - 5.0)', () => {
    const highRegretNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      regretMinimizationScore: 9.0,
    };
    const lowRegretNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      regretMinimizationScore: 2.0,
    };

    const uHigh = computeNodeUtility(highRegretNode, mockMeasuredTwin);
    const uLow = computeNodeUtility(lowRegretNode, mockMeasuredTwin);

    expect(uHigh - uLow).toBeCloseTo(0.45 * (9.0 - 2.0), 2);
  });
});

describe('Feature 18: Bellman Expected Utility Golden Path Solver', () => {
  it('F18-T1-01: maps risk appetite levels to calibrated tau exponent (conservative=0.85 to asymmetric=0.25)', () => {
    expect(getTauForRiskAppetite('conservative')).toBe(0.85);
    expect(getTauForRiskAppetite('measured')).toBe(0.55);
    expect(getTauForRiskAppetite('aggressive')).toBe(0.35);
    expect(getTauForRiskAppetite('asymmetric')).toBe(0.25);
  });

  it('F18-T1-02: computes risk-adjusted trajectory score Q using lower utility floor V_min=-25.0', () => {
    const p_norm = 0.30;
    const v_child = 8.5;
    const tau = 0.55;

    const q = computeRiskAdjustedQ(p_norm, v_child, tau);
    const expectedQ = Math.pow(p_norm, tau) * (8.5 - (-25.0)) + (-25.0);

    expect(q).toBeCloseTo(expectedQ, 4);
    expect(q).toBeGreaterThan(-25.0);
  });

  it('F18-T1-03: identifies contiguous Golden Path from root to optimal leaf node', () => {
    const tree: ProbabilityNode[] = [mockRootNode, ...mockWave1Siblings];
    const { goldenPathNodeIds } = solveGoldenPath(tree, mockRootNode.id, mockMeasuredTwin);

    expect(goldenPathNodeIds.length).toBeGreaterThanOrEqual(2);
    expect(goldenPathNodeIds[0]).toBe(mockRootNode.id);
    // Should select node-w1-01 (Bootstrap Enterprise Micro-Pivot) as the highest utility child
    expect(goldenPathNodeIds[1]).toBe('node-w1-01');
  });

  it('F18-T1-04: stores Bellman values in valueTree for all evaluated nodes', () => {
    const tree: ProbabilityNode[] = [mockRootNode, ...mockWave1Siblings];
    const { valueTree } = solveGoldenPath(tree, mockRootNode.id, mockMeasuredTwin);

    expect(valueTree.has(mockRootNode.id)).toBe(true);
    for (const sibling of mockWave1Siblings) {
      expect(valueTree.has(sibling.id)).toBe(true);
    }
  });

  it('F18-T1-05: factors higher agency (eta=0.80) for active action-injection branches', () => {
    const passiveRoot: ProbabilityNode = { ...mockRootNode, userInterventionPrompt: undefined };
    const activeRoot: ProbabilityNode = { ...mockRootNode, userInterventionPrompt: 'Secure LOI within 30 days' };

    const treePassive = [passiveRoot, ...mockWave1Siblings];
    const treeActive = [activeRoot, ...mockWave1Siblings];

    const resultPassive = solveGoldenPath(treePassive, passiveRoot.id, mockMeasuredTwin);
    const resultActive = solveGoldenPath(treeActive, activeRoot.id, mockMeasuredTwin);

    const vPassive = resultPassive.valueTree.get(passiveRoot.id)!;
    const vActive = resultActive.valueTree.get(activeRoot.id)!;
    expect(vActive).not.toEqual(vPassive);
    expect(Number.isFinite(vActive)).toBe(true);
    expect(Number.isFinite(vPassive)).toBe(true);
  });

  it('F18-T1-06: conservative persona favors high-probability paths over low-probability speculative upside', () => {
    const highProbModestReward: ProbabilityNode = {
      ...mockWave1Siblings[0],
      id: 'node-high-prob',
      conditionalProbability: 0.70,
      impactVector: { wealth: 4, autonomy: 4, mastery: 4, stability: 5, impact: 4, peace: 5 },
      reversibilityScore: 8.0,
      regretMinimizationScore: 6.0,
    };

    const lowProbHugeReward: ProbabilityNode = {
      ...mockWave1Siblings[1],
      id: 'node-low-prob',
      conditionalProbability: 0.10,
      impactVector: { wealth: 10, autonomy: 10, mastery: 10, stability: 1, impact: 10, peace: 2 },
      reversibilityScore: 3.0,
      regretMinimizationScore: 7.0,
    };

    const customTree = [mockRootNode, highProbModestReward, lowProbHugeReward];
    const { goldenPathNodeIds } = solveGoldenPath(customTree, mockRootNode.id, mockConservativeTwin);

    expect(goldenPathNodeIds[1]).toBe('node-high-prob');
  });

  it('F18-T1-07: asymmetric persona tolerates lower probabilities to capture 10x upside', () => {
    const highProbModestReward: ProbabilityNode = {
      ...mockWave1Siblings[0],
      id: 'node-high-prob-2',
      conditionalProbability: 0.50,
      impactVector: { wealth: 2, autonomy: 2, mastery: 2, stability: 4, impact: 2, peace: 4 },
      reversibilityScore: 7.0,
      regretMinimizationScore: 5.0,
    };

    const speculativeBreakout: ProbabilityNode = {
      ...mockWave1Siblings[1],
      id: 'node-breakout',
      conditionalProbability: 0.30,
      impactVector: { wealth: 10, autonomy: 10, mastery: 9, stability: 3, impact: 9, peace: 6 },
      reversibilityScore: 6.0,
      regretMinimizationScore: 9.0,
    };

    const customTree = [mockRootNode, highProbModestReward, speculativeBreakout];
    const { goldenPathNodeIds } = solveGoldenPath(customTree, mockRootNode.id, mockAsymmetricTwin);

    expect(goldenPathNodeIds[1]).toBe('node-breakout');
  });
});

describe('Tier 2: Boundary & Corner Cases (Utility & Golden Path)', () => {
  it('F17-T2-01: handles all-zero user core values without division by zero via epsilon guard', () => {
    const zeroTwin: UserContextTwin = {
      ...mockMeasuredTwin,
      coreValues: { wealthCompounding: 0, autonomyFreedom: 0, masteryCraft: 0, stabilitySecurity: 0, impactLegacy: 0, peaceWellbeing: 0 },
    };

    const u = computeNodeUtility(mockWave1Siblings[0], zeroTwin);
    expect(Number.isFinite(u)).toBe(true);
    expect(Number.isNaN(u)).toBe(false);
  });

  it('F17-T2-02: handles maximum extreme impacts (+10 across all 6 dimensions) safely', () => {
    const maxNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      impactVector: { wealth: 10, autonomy: 10, mastery: 10, stability: 10, impact: 10, peace: 10 },
      reversibilityScore: 10.0,
      regretMinimizationScore: 10.0,
    };

    const u = computeNodeUtility(maxNode, mockMeasuredTwin);
    expect(u).toBeGreaterThan(10);
    expect(Number.isFinite(u)).toBe(true);
  });

  it('F17-T2-03: handles minimum extreme impacts (-10 across all 6 dimensions) safely', () => {
    const minNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      impactVector: { wealth: -10, autonomy: -10, mastery: -10, stability: -10, impact: -10, peace: -10 },
      reversibilityScore: 0.0,
      regretMinimizationScore: 0.0,
    };

    const u = computeNodeUtility(minNode, mockMeasuredTwin);
    expect(u).toBeLessThan(-10);
    expect(Number.isFinite(u)).toBe(true);
  });

  it('F18-T2-04: single isolated root node with no children returns only the root ID', () => {
    const isolatedRoot: ProbabilityNode[] = [mockRootNode];
    const { goldenPathNodeIds, valueTree } = solveGoldenPath(isolatedRoot, mockRootNode.id, mockMeasuredTwin);

    expect(goldenPathNodeIds).toEqual([mockRootNode.id]);
    expect(valueTree.has(mockRootNode.id)).toBe(true);
  });

  it('F18-T2-05: ignores pruned and archived nodes during Golden Path solver traversal', () => {
    const prunedSibling: ProbabilityNode = {
      ...mockWave1Siblings[0],
      id: 'node-pruned-best',
      status: 'pruned', // Marked pruned after reality check-in
      impactVector: { wealth: 10, autonomy: 10, mastery: 10, stability: 10, impact: 10, peace: 10 },
    };

    const activeSecondBest: ProbabilityNode = {
      ...mockWave1Siblings[1],
      id: 'node-active-second',
      status: 'active',
    };

    const tree = [mockRootNode, prunedSibling, activeSecondBest];
    const { goldenPathNodeIds } = solveGoldenPath(tree, mockRootNode.id, mockMeasuredTwin);

    // Pruned node must not be selected despite higher impact
    expect(goldenPathNodeIds).not.toContain('node-pruned-best');
    expect(goldenPathNodeIds[1]).toBe('node-active-second');
  });

  it('F18-T2-06: deep 4-level chain executes without stack overflow or performance degradation', () => {
    const deepChain: ProbabilityNode[] = [
      mockRootNode,
      { ...mockWave1Siblings[0], id: 'd1', parentId: mockRootNode.id, depth: 1 },
      { ...mockWave1Siblings[0], id: 'd2', parentId: 'd1', depth: 2 },
      { ...mockWave1Siblings[0], id: 'd3', parentId: 'd2', depth: 3 },
      { ...mockWave1Siblings[0], id: 'd4', parentId: 'd3', depth: 4 },
    ];

    const { goldenPathNodeIds } = solveGoldenPath(deepChain, mockRootNode.id, mockMeasuredTwin);
    expect(goldenPathNodeIds).toEqual([mockRootNode.id, 'd1', 'd2', 'd3', 'd4']);
  });
});
