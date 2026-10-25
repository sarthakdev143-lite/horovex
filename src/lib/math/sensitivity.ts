/**
 * Real-Time 60 FPS Sensitivity Levers & Softmax Logit Perturbation Engine
 * Authoritative Source: docs/LLD.md §2.3 & PROJECT.md §2
 */

import { ProbabilityNode } from '../types/multiverse';

export interface SliderDeltas {
  executionVelocity: number; // [-1.0, 1.0]
  capitalBuffer: number;     // [-1.0, 1.0]
  marketTailwind: number;    // [-1.0, 1.0]
  skillPreparation: number;  // [-1.0, 1.0]
}

/**
 * Computes instantaneous 60 FPS probability shifts across sibling branches
 * in response to sensitivity slider adjustments using Softmax logit perturbation.
 * Preserves strict Bayesian mass conservation: sum(P_new) = 1.0 - unexploredMass.
 */
export function perturbProbabilities(
  nodes: ProbabilityNode[],
  deltas: SliderDeltas,
  unexploredMass: number = 0.20
): Map<string, number> {
  const activeNodes = nodes.filter((n) => n.status === 'active');
  if (activeNodes.length === 0) return new Map();

  const EPSILON = 1e-6;
  const logits = activeNodes.map((node) => {
    const p0 = Math.max(node.conditionalProbability, EPSILON);
    const dotDelta =
      node.sensitivityWeights.executionVelocity * deltas.executionVelocity +
      node.sensitivityWeights.capitalBuffer * deltas.capitalBuffer +
      node.sensitivityWeights.marketTailwind * deltas.marketTailwind +
      node.sensitivityWeights.skillPreparation * deltas.skillPreparation;

    return Math.log(p0) + dotDelta;
  });

  // Numerically stable softmax: subtract max logit
  const maxLogit = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - maxLogit));
  const sumExp = exps.reduce((acc, e) => acc + e, 0);

  const exploredMass = 1 - unexploredMass;
  const resultMap = new Map<string, number>();

  activeNodes.forEach((node, i) => {
    const softmaxVal = exps[i] / sumExp;
    const newProb = Math.max(exploredMass * softmaxVal, 1e-5);
    resultMap.set(node.id, Number(newProb.toFixed(5)));
  });

  return resultMap;
}
