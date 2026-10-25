/**
 * Bayesian Probability Mass Partitioning & Conservation Engine
 * Authoritative Source: docs/LLD.md §2.1 & PROJECT.md §2
 */

import { ProbabilityNode } from '../types/multiverse';

export interface WaveMassPartition {
  wave: number;
  alpha: number;
  deltaMass: number;
  remainingUnexplored: number;
}

/**
 * Computes the reserved explored mass (alpha) and remaining unexplored mass for a given wave.
 * Invariant: Wave 1 = 80% explored, 20% unexplored.
 * Wave 2 = carves 65% of remaining unexplored (0.13), leaving 0.07.
 * Wave 3+ = carves 60% of remaining unexplored (0.042), leaving 0.028.
 */
export function computeWaveMass(wave: number): WaveMassPartition {
  if (wave <= 1) {
    const alpha = 0.80;
    return {
      wave: 1,
      alpha,
      deltaMass: alpha,
      remainingUnexplored: 1 - alpha,
    };
  }

  let remaining = 1.0;
  let currentDelta = 0;
  let currentAlpha = 0;

  for (let w = 1; w <= wave; w++) {
    const alpha_w = w === 1 ? 0.80 : w === 2 ? 0.65 : 0.60;
    currentAlpha = alpha_w;
    currentDelta = alpha_w * remaining;
    remaining = (1 - alpha_w) * remaining;
  }

  return {
    wave,
    alpha: currentAlpha,
    deltaMass: currentDelta,
    remainingUnexplored: remaining,
  };
}

/**
 * Normalizes sibling node probabilities so they strictly conserve total probability mass:
 * sum(P_cond(n_i)) + M_unexplored = 1.0 +/- 1e-4
 */
export function normalizeWaveProbabilities(
  siblings: ProbabilityNode[],
  waveNumber: number
): ProbabilityNode[] {
  if (siblings.length === 0) return [];

  const partition = computeWaveMass(waveNumber);
  const targetExploredMass = 1 - partition.remainingUnexplored;

  // Sum raw likelihoods safely with epsilon guard
  const rawSum = siblings.reduce(
    (acc, node) => acc + Math.max(node.rawLlmConfidence, 1e-6),
    0
  );

  return siblings.map((node, index) => {
    const rawNormalized = Math.max(node.rawLlmConfidence, 1e-6) / rawSum;
    const conditional = targetExploredMass * rawNormalized;

    return {
      ...node,
      waveNumber,
      siblingIndex: index + 1,
      conditionalProbability: Number(conditional.toFixed(4)),
      unexploredChildMass: Number(partition.remainingUnexplored.toFixed(4)),
    };
  });
}

/**
 * Multiplies parent cumulative probability by child conditional probability:
 * P_cum(child) = P_cum(parent) * P_cond(child | parent)
 */
export function computeCumulativeProbability(
  parentCumProb: number,
  childCondProb: number
): number {
  if (parentCumProb <= 0 || childCondProb <= 0) return 0;
  return Number(Math.min(1.0, parentCumProb * childCondProb).toFixed(5));
}
