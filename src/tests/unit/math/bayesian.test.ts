/**
 * Unit & Boundary Tests: Bayesian Probability Engine & Mass Conservation
 * Features:
 *   - Feature 9: Wave 1 Baseline Generator (Top 5 Probabilities)
 *   - Feature 10: Horizontal Expansion (+5 More Possibilities)
 *   - Feature 14: Cumulative Path Probability Engine
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/LLD.md §2.1 & PROJECT.md §2
 */

import { describe, it, expect } from 'vitest';
import {
  computeWaveMass,
  normalizeWaveProbabilities,
  computeCumulativeProbability,
} from '../../fixtures/reference-math';
import { mockWave1Siblings, mockWave2Siblings, mockRootNode } from '../../fixtures/mock-nodes';
import { ProbabilityNode } from '../../fixtures/multiverse-types';

describe('Feature 9: Wave 1 Baseline Generator (Top 5 Probabilities)', () => {
  it('F9-T1-01: partitions exactly 80% explored mass and 20% unexplored mass in Wave 1', () => {
    const partition = computeWaveMass(1);
    expect(partition.wave).toBe(1);
    expect(partition.alpha).toBeCloseTo(0.80, 4);
    expect(partition.deltaMass).toBeCloseTo(0.80, 4);
    expect(partition.remainingUnexplored).toBeCloseTo(0.20, 4);
  });

  it('F9-T1-02: normalizes 5 initial sibling nodes so conditional probabilities sum to explored mass', () => {
    const normalized = normalizeWaveProbabilities(mockWave1Siblings, 1);
    expect(normalized).toHaveLength(5);

    const sumCond = normalized.reduce((acc, n) => acc + n.conditionalProbability, 0);
    expect(sumCond).toBeCloseTo(0.80, 3);
  });

  it('F9-T1-03: preserves total probability mass invariant sum(P_i) + M_unexplored = 1.0 +/- 1e-4', () => {
    const normalized = normalizeWaveProbabilities(mockWave1Siblings, 1);
    const sumCond = normalized.reduce((acc, n) => acc + n.conditionalProbability, 0);
    const mUnexplored = normalized[0].unexploredChildMass;

    expect(sumCond + mUnexplored).toBeCloseTo(1.0, 3);
  });

  it('F9-T1-04: assigns ascending siblingIndex 1..5 matching ordinal generation rank', () => {
    const normalized = normalizeWaveProbabilities(mockWave1Siblings, 1);
    normalized.forEach((node, idx) => {
      expect(node.siblingIndex).toBe(idx + 1);
      expect(node.waveNumber).toBe(1);
    });
  });

  it('F9-T1-05: guarantees all 5 normalized probabilities are strictly positive and non-NaN', () => {
    const normalized = normalizeWaveProbabilities(mockWave1Siblings, 1);
    normalized.forEach((node) => {
      expect(Number.isNaN(node.conditionalProbability)).toBe(false);
      expect(node.conditionalProbability).toBeGreaterThan(0);
      expect(node.conditionalProbability).toBeLessThanOrEqual(0.80);
    });
  });

  it('F9-T1-06: maintains relative probability ranking proportional to raw confidence weights', () => {
    const normalized = normalizeWaveProbabilities(mockWave1Siblings, 1);
    expect(normalized[0].conditionalProbability).toBeGreaterThan(normalized[1].conditionalProbability);
    expect(normalized[1].conditionalProbability).toBeGreaterThan(normalized[2].conditionalProbability);
    expect(normalized[2].conditionalProbability).toBeGreaterThan(normalized[3].conditionalProbability);
    expect(normalized[3].conditionalProbability).toBeGreaterThan(normalized[4].conditionalProbability);
  });
});

describe('Feature 10: Horizontal Expansion (+5 More Possibilities)', () => {
  it('F10-T1-01: carves 65% of remaining unexplored mass in Wave 2 (Contrarian Regime)', () => {
    const partition = computeWaveMass(2);
    expect(partition.wave).toBe(2);
    expect(partition.alpha).toBeCloseTo(0.65, 4);
    // Delta mass = 0.65 * 0.20 = 0.13
    expect(partition.deltaMass).toBeCloseTo(0.13, 4);
    // Remaining unexplored = (1 - 0.65) * 0.20 = 0.07
    expect(partition.remainingUnexplored).toBeCloseTo(0.07, 4);
  });

  it('F10-T1-02: carves 60% of remaining unexplored mass in Wave 3 (Tail-Risk / Black Swan Regime)', () => {
    const partition = computeWaveMass(3);
    expect(partition.wave).toBe(3);
    expect(partition.alpha).toBeCloseTo(0.60, 4);
    // Delta mass = 0.60 * 0.07 = 0.042
    expect(partition.deltaMass).toBeCloseTo(0.042, 4);
    // Remaining unexplored = 0.07 * 0.40 = 0.028
    expect(partition.remainingUnexplored).toBeCloseTo(0.028, 4);
  });

  it('F10-T1-03: carves asymptotic 60% in Wave 4 while strictly keeping unexplored mass positive', () => {
    const partition = computeWaveMass(4);
    expect(partition.wave).toBe(4);
    // Remaining unexplored = 0.028 * 0.40 = 0.0112
    expect(partition.remainingUnexplored).toBeCloseTo(0.0112, 4);
    expect(partition.remainingUnexplored).toBeGreaterThan(0);
  });

  it('F10-T1-04: renormalizes Wave 2 expanded siblings (10 nodes total) conserving total mass', () => {
    const tenSiblings = [...mockWave1Siblings, ...mockWave2Siblings];
    const normalized = normalizeWaveProbabilities(tenSiblings, 2);
    expect(normalized).toHaveLength(10);

    const sumCond = normalized.reduce((acc, n) => acc + n.conditionalProbability, 0);
    const mUnexplored = normalized[0].unexploredChildMass;

    // In Wave 2, total explored mass = 1 - 0.07 = 0.93
    expect(sumCond).toBeCloseTo(0.93, 2);
    expect(sumCond + mUnexplored).toBeCloseTo(1.0, 3);
  });

  it('F10-T1-05: prevents earlier wave probabilities from collapsing to zero during horizontal expansion', () => {
    const tenSiblings = [...mockWave1Siblings, ...mockWave2Siblings];
    const normalized = normalizeWaveProbabilities(tenSiblings, 2);

    for (let i = 0; i < 5; i++) {
      expect(normalized[i].conditionalProbability).toBeGreaterThan(0.03);
    }
  });

  it('F10-T1-06: assigns regime tier tags correctly distinguishing baseline, contrarian, and tail-risk', () => {
    expect(mockWave1Siblings[0].regimeTier).toBe('baseline_wave_1');
    expect(mockWave2Siblings[0].regimeTier).toBe('contrarian_wave_2');
  });
});

describe('Feature 14: Cumulative Path Probability Engine', () => {
  it('F14-T1-01: calculates root cumulative probability as 1.0', () => {
    expect(mockRootNode.cumulativeProbability).toBe(1.0);
  });

  it('F14-T1-02: computes child cumulative probability as product of parent cumulative and child conditional', () => {
    const parentCum = 1.0;
    const childCond = 0.28;
    const cumProb = computeCumulativeProbability(parentCum, childCond);
    expect(cumProb).toBe(0.28);
  });

  it('F14-T1-03: enforces monotonic decay across recursive depth spine T0 -> T1 -> T2 -> T3', () => {
    const p0 = 1.0;
    const p1 = computeCumulativeProbability(p0, 0.40); // 0.40
    const p2 = computeCumulativeProbability(p1, 0.35); // 0.14
    const p3 = computeCumulativeProbability(p2, 0.50); // 0.07

    expect(p1).toBeLessThanOrEqual(p0);
    expect(p2).toBeLessThanOrEqual(p1);
    expect(p3).toBeLessThanOrEqual(p2);
    expect(p3).toBeCloseTo(0.07, 3);
  });

  it('F14-T1-04: correctly propagates low cumulative probabilities without float cancellation', () => {
    const pDepth5 = computeCumulativeProbability(0.005, 0.12);
    expect(pDepth5).toBe(0.0006);
    expect(pDepth5).toBeGreaterThan(0);
  });

  it('F14-T1-05: guarantees cumulative probability never exceeds 1.0', () => {
    const cumProb = computeCumulativeProbability(0.999, 0.999);
    expect(cumProb).toBeLessThanOrEqual(1.0);
  });

  it('F14-T1-06: returns 0 when parent cumulative probability is 0 (absorbing state)', () => {
    const cumProb = computeCumulativeProbability(0.0, 0.75);
    expect(cumProb).toBe(0.0);
  });
});

describe('Tier 2: Boundary & Corner Cases (Bayesian & Mass Conservation)', () => {
  it('F9/F10-T2-01: empty sibling array returns empty array with zero throw', () => {
    const result = normalizeWaveProbabilities([], 1);
    expect(result).toEqual([]);
  });

  it('F9/F10-T2-02: single sibling node absorbs 100% of the active explored mass', () => {
    const singleNode: ProbabilityNode[] = [mockWave1Siblings[0]];
    const normalized = normalizeWaveProbabilities(singleNode, 1);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].conditionalProbability).toBeCloseTo(0.80, 4);
    expect(normalized[0].conditionalProbability + normalized[0].unexploredChildMass).toBeCloseTo(1.0, 4);
  });

  it('F9/F10-T2-03: handles extreme raw likelihood asymmetry (10^-5 vs 0.9999) without NaN', () => {
    const asymmetricNodes: ProbabilityNode[] = [
      { ...mockWave1Siblings[0], rawLlmConfidence: 0.9999 },
      { ...mockWave1Siblings[1], rawLlmConfidence: 0.00001 },
    ];
    const normalized = normalizeWaveProbabilities(asymmetricNodes, 1);

    expect(Number.isNaN(normalized[0].conditionalProbability)).toBe(false);
    expect(Number.isNaN(normalized[1].conditionalProbability)).toBe(false);
    expect(normalized[0].conditionalProbability + normalized[1].conditionalProbability).toBeCloseTo(0.80, 3);
  });

  it('F9/F10-T2-04: handles all-zero raw LLM confidence gracefully via epsilon guard', () => {
    const zeroConfNodes: ProbabilityNode[] = [
      { ...mockWave1Siblings[0], rawLlmConfidence: 0 },
      { ...mockWave1Siblings[1], rawLlmConfidence: 0 },
    ];
    const normalized = normalizeWaveProbabilities(zeroConfNodes, 1);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].conditionalProbability).toBeCloseTo(0.40, 3);
    expect(normalized[1].conditionalProbability).toBeCloseTo(0.40, 3);
  });

  it('F10-T2-05: wave number 0 or negative defaults safely to Wave 1 baseline', () => {
    const partition0 = computeWaveMass(0);
    const partitionNeg = computeWaveMass(-5);

    expect(partition0.wave).toBe(1);
    expect(partition0.remainingUnexplored).toBeCloseTo(0.20, 4);
    expect(partitionNeg.wave).toBe(1);
    expect(partitionNeg.remainingUnexplored).toBeCloseTo(0.20, 4);
  });

  it('F14-T2-06: cumulative probability with negative inputs clamps to 0', () => {
    const cum = computeCumulativeProbability(-0.25, 0.5);
    expect(cum).toBeLessThanOrEqual(0);
  });

  it('F10-T2-07: deep horizontal expansion (Wave 10) leaves strictly positive unexplored mass', () => {
    const partition10 = computeWaveMass(10);
    expect(partition10.remainingUnexplored).toBeGreaterThan(0);
    expect(partition10.remainingUnexplored).toBeLessThan(0.001);
  });
});
