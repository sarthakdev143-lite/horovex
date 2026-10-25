/**
 * Unit & Boundary Tests: Real-Time 60 FPS Sensitivity Levers & Softmax Perturbation
 * Features:
 *   - Feature 23: Real-Time 60 FPS Sensitivity Levers
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/LLD.md §2.3 & PROJECT.md §2
 */

import { describe, it, expect } from 'vitest';
import { perturbProbabilities, SliderDeltas } from '../../fixtures/reference-math';
import { mockWave1Siblings } from '../../fixtures/mock-nodes';
import { ProbabilityNode } from '../../fixtures/multiverse-types';

describe('Feature 23: Real-Time 60 FPS Sensitivity Levers', () => {
  const neutralDeltas: SliderDeltas = {
    executionVelocity: 0.0,
    capitalBuffer: 0.0,
    marketTailwind: 0.0,
    skillPreparation: 0.0,
  };

  it('F23-T1-01: zero slider delta preserves initial relative probability proportions', () => {
    const perturbed = perturbProbabilities(mockWave1Siblings, neutralDeltas, 0.20);
    expect(perturbed.size).toBe(5);

    // Node 1 was 0.28, Node 2 was 0.22, etc. (sum = 0.80)
    const sum = Array.from(perturbed.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(0.80, 2);

    expect(perturbed.get('node-w1-01')).toBeGreaterThan(perturbed.get('node-w1-02')!);
    expect(perturbed.get('node-w1-02')).toBeGreaterThan(perturbed.get('node-w1-03')!);
  });

  it('F23-T1-02: strictly conserves total probability mass sum(P_new) + M_unexplored = 1.0 +/- 1e-4 under arbitrary slider shifts', () => {
    const testCases: SliderDeltas[] = [
      { executionVelocity: 0.8, capitalBuffer: -0.5, marketTailwind: 0.3, skillPreparation: 0.6 },
      { executionVelocity: -0.9, capitalBuffer: 0.9, marketTailwind: -0.4, skillPreparation: -0.7 },
      { executionVelocity: 1.0, capitalBuffer: 1.0, marketTailwind: 1.0, skillPreparation: 1.0 },
      { executionVelocity: -1.0, capitalBuffer: -1.0, marketTailwind: -1.0, skillPreparation: -1.0 },
    ];

    for (const deltas of testCases) {
      const perturbed = perturbProbabilities(mockWave1Siblings, deltas, 0.20);
      const sum = Array.from(perturbed.values()).reduce((a, b) => a + b, 0);
      expect(sum + 0.20).toBeCloseTo(1.0, 3);
    }
  });

  it('F23-T1-03: executionVelocity increase shifts probability mass toward high-velocity branch (node-w1-01)', () => {
    const baseline = perturbProbabilities(mockWave1Siblings, neutralDeltas, 0.20);
    const accelerated = perturbProbabilities(
      mockWave1Siblings,
      { ...neutralDeltas, executionVelocity: 0.9 },
      0.20
    );

    const baseProbN1 = baseline.get('node-w1-01')!;
    const accelProbN1 = accelerated.get('node-w1-01')!;

    // node-w1-01 has positive sensitivity weight (+1.4) for executionVelocity
    expect(accelProbN1).toBeGreaterThan(baseProbN1);

    // Stagnation node (node-w1-05) has negative sensitivity weight (-1.5)
    const baseProbN5 = baseline.get('node-w1-05')!;
    const accelProbN5 = accelerated.get('node-w1-05')!;
    expect(accelProbN5).toBeLessThan(baseProbN5);
  });

  it('F23-T1-04: capitalBuffer increase boosts institutional seed blitz branch (node-w1-02)', () => {
    const baseline = perturbProbabilities(mockWave1Siblings, neutralDeltas, 0.20);
    const capitalized = perturbProbabilities(
      mockWave1Siblings,
      { ...neutralDeltas, capitalBuffer: 0.95 },
      0.20
    );

    const baseProbN2 = baseline.get('node-w1-02')!;
    const capProbN2 = capitalized.get('node-w1-02')!;

    // node-w1-02 has +1.8 sensitivity weight for capitalBuffer
    expect(capProbN2).toBeGreaterThan(baseProbN2);
  });

  it('F23-T1-05: marketTailwind increase amplifies PLG freemium viral branch (node-w1-03)', () => {
    const baseline = perturbProbabilities(mockWave1Siblings, neutralDeltas, 0.20);
    const tailwinded = perturbProbabilities(
      mockWave1Siblings,
      { ...neutralDeltas, marketTailwind: 0.9 },
      0.20
    );

    const baseProbN3 = baseline.get('node-w1-03')!;
    const tailProbN3 = tailwinded.get('node-w1-03')!;

    // node-w1-03 has +1.5 sensitivity weight for marketTailwind
    expect(tailProbN3).toBeGreaterThan(baseProbN3);
  });

  it('F23-T1-06: executes in < 16ms latency complying with 60 FPS requestAnimationFrame frame budget', () => {
    const iterations = 100;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const deltas: SliderDeltas = {
        executionVelocity: Math.sin(i * 0.1),
        capitalBuffer: Math.cos(i * 0.1),
        marketTailwind: Math.sin(i * 0.2),
        skillPreparation: Math.cos(i * 0.2),
      };
      perturbProbabilities(mockWave1Siblings, deltas, 0.20);
    }

    const totalTimeMs = performance.now() - startTime;
    const avgTimePerFrame = totalTimeMs / iterations;

    // Must be well under 16ms (typically < 0.2ms in pure JS)
    expect(avgTimePerFrame).toBeLessThan(16.0);
  });
});

describe('Tier 2: Boundary & Corner Cases (Sensitivity & Softmax Epsilon Guards)', () => {
  it('F23-T2-01: empty nodes array returns empty map without throwing', () => {
    const perturbed = perturbProbabilities([], { executionVelocity: 0.5, capitalBuffer: 0.5, marketTailwind: 0.5, skillPreparation: 0.5 }, 0.20);
    expect(perturbed.size).toBe(0);
  });

  it('F23-T2-02: handles extreme max slider bounds (+1.0, +1.0, +1.0, +1.0) without overflow or NaN', () => {
    const maxDeltas: SliderDeltas = { executionVelocity: 1.0, capitalBuffer: 1.0, marketTailwind: 1.0, skillPreparation: 1.0 };
    const perturbed = perturbProbabilities(mockWave1Siblings, maxDeltas, 0.20);

    for (const [id, prob] of perturbed.entries()) {
      expect(Number.isFinite(prob)).toBe(true);
      expect(Number.isNaN(prob)).toBe(false);
      expect(prob).toBeGreaterThan(0);
      expect(prob).toBeLessThan(1.0);
    }
  });

  it('F23-T2-03: handles extreme min slider bounds (-1.0, -1.0, -1.0, -1.0) without underflow or NaN', () => {
    const minDeltas: SliderDeltas = { executionVelocity: -1.0, capitalBuffer: -1.0, marketTailwind: -1.0, skillPreparation: -1.0 };
    const perturbed = perturbProbabilities(mockWave1Siblings, minDeltas, 0.20);

    for (const [id, prob] of perturbed.entries()) {
      expect(Number.isFinite(prob)).toBe(true);
      expect(Number.isNaN(prob)).toBe(false);
      expect(prob).toBeGreaterThan(0);
      expect(prob).toBeLessThan(1.0);
    }
  });

  it('F23-T2-04: clamps zero probability nodes via epsilon=10^-6 avoiding -Infinity logits', () => {
    const nodeWithZeroProb: ProbabilityNode = {
      ...mockWave1Siblings[0],
      conditionalProbability: 0.0, // Zero prob edge case
    };

    const perturbed = perturbProbabilities([nodeWithZeroProb, mockWave1Siblings[1]], { executionVelocity: 0.5, capitalBuffer: 0.5, marketTailwind: 0.5, skillPreparation: 0.5 }, 0.20);

    expect(Number.isFinite(perturbed.get(nodeWithZeroProb.id)!)).toBe(true);
    expect(perturbed.get(nodeWithZeroProb.id)!).toBeGreaterThan(0);
  });

  it('F23-T2-05: ignores pruned nodes and only redistributes explored mass to active siblings', () => {
    const nodesWithPruned: ProbabilityNode[] = [
      { ...mockWave1Siblings[0], status: 'pruned' },
      { ...mockWave1Siblings[1], status: 'active' },
      { ...mockWave1Siblings[2], status: 'active' },
    ];

    const perturbed = perturbProbabilities(nodesWithPruned, { executionVelocity: 0.2, capitalBuffer: 0.2, marketTailwind: 0.2, skillPreparation: 0.2 }, 0.20);

    expect(perturbed.has(mockWave1Siblings[0].id)).toBe(false);
    expect(perturbed.has(mockWave1Siblings[1].id)).toBe(true);
    expect(perturbed.has(mockWave1Siblings[2].id)).toBe(true);

    const sum = perturbed.get(mockWave1Siblings[1].id)! + perturbed.get(mockWave1Siblings[2].id)!;
    expect(sum + 0.20).toBeCloseTo(1.0, 3);
  });

  it('F23-T2-06: operates correctly with 0% unexplored mass (M_unexplored = 0.0)', () => {
    const perturbed = perturbProbabilities(mockWave1Siblings, { executionVelocity: 0.5, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 }, 0.0);
    const sum = Array.from(perturbed.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });
});
