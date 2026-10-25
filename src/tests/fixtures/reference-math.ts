/**
 * Authoritative Mathematical Reference Oracle
 * Derived directly from docs/LLD.md §2.1-§2.4
 */

import { ProbabilityNode, UserContextTwin, SpatialCoordinates } from './multiverse-types';

// ============================================================================
// 1. BAYESIAN MASS PARTITIONING & CONSERVATION (LLD.md §2.1)
// ============================================================================

export interface WaveMassPartition {
  wave: number;
  alpha: number;
  deltaMass: number;
  remainingUnexplored: number;
}

export function computeWaveMass(wave: number): WaveMassPartition {
  if (wave <= 1) {
    const alpha = 0.80;
    return {
      wave: 1,
      alpha,
      deltaMass: alpha, // 0.80 carved from initial 1.0
      remainingUnexplored: 1 - alpha, // 0.20
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

export function normalizeWaveProbabilities(
  siblings: ProbabilityNode[],
  waveNumber: number
): ProbabilityNode[] {
  if (siblings.length === 0) return [];

  const partition = computeWaveMass(waveNumber);
  const targetExploredMass = 1 - partition.remainingUnexplored;

  // Sum raw likelihoods
  const rawSum = siblings.reduce((acc, node) => acc + Math.max(node.rawLlmConfidence, 1e-6), 0);

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

export function computeCumulativeProbability(
  parentCumProb: number,
  childCondProb: number
): number {
  return Number((parentCumProb * childCondProb).toFixed(5));
}

// ============================================================================
// 2. MULTI-OBJECTIVE EXPECTED UTILITY & GOLDEN PATH SOLVER (LLD.md §2.2)
// ============================================================================

const LAMBDA_REV = 0.35;
const LAMBDA_REGRET = 0.45;
const V_MIN = -25.0;
const GAMMA = 0.92;

export function computeNodeUtility(node: ProbabilityNode, twin: UserContextTwin): number {
  const userVec = [
    twin.coreValues.wealthCompounding,
    twin.coreValues.autonomyFreedom,
    twin.coreValues.masteryCraft,
    twin.coreValues.stabilitySecurity,
    twin.coreValues.impactLegacy,
    twin.coreValues.peaceWellbeing,
  ];

  const nodeVec = [
    node.impactVector.wealth,
    node.impactVector.autonomy,
    node.impactVector.mastery,
    node.impactVector.stability,
    node.impactVector.impact,
    node.impactVector.peace,
  ];

  const l1Norm = userVec.reduce((sum, v) => sum + Math.abs(v), 0);
  const dotProduct = userVec.reduce((sum, v, i) => sum + v * nodeVec[i], 0);
  const valueAlignment = dotProduct / Math.max(l1Norm, 1e-6);

  const reversibilityComponent = LAMBDA_REV * (node.reversibilityScore - 5.0);
  const regretComponent = LAMBDA_REGRET * (node.regretMinimizationScore - 5.0);

  return Number((valueAlignment + reversibilityComponent + regretComponent).toFixed(4));
}

export function getTauForRiskAppetite(appetite: UserContextTwin['riskAppetite']): number {
  switch (appetite) {
    case 'conservative': return 0.85;
    case 'measured': return 0.55;
    case 'aggressive': return 0.35;
    case 'asymmetric': return 0.25;
    default: return 0.55;
  }
}

export function computeRiskAdjustedQ(
  p_norm: number,
  v_child: number,
  tau: number
): number {
  return Math.pow(Math.max(p_norm, 1e-6), tau) * (v_child - V_MIN) + V_MIN;
}

export function solveGoldenPath(
  nodes: ProbabilityNode[],
  rootId: string,
  twin: UserContextTwin
): { goldenPathNodeIds: string[]; valueTree: Map<string, number> } {
  const nodeMap = new Map<string, ProbabilityNode>();
  const childrenMap = new Map<string, ProbabilityNode[]>();

  for (const node of nodes) {
    if (node.status === 'pruned' || node.status === 'archived') continue;
    nodeMap.set(node.id, node);
    if (node.parentId) {
      const list = childrenMap.get(node.parentId) || [];
      list.push(node);
      childrenMap.set(node.parentId, list);
    }
  }

  const tau = getTauForRiskAppetite(twin.riskAppetite);
  const valueTree = new Map<string, number>();

  // Helper for recursive Bellman backup
  function computeValue(nodeId: string): number {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;

    const u = computeNodeUtility(node, twin);
    const children = childrenMap.get(nodeId) || [];

    if (children.length === 0) {
      valueTree.set(nodeId, u);
      return u;
    }

    const totalChildProb = children.reduce((acc, c) => acc + c.conditionalProbability, 0);
    const agency = node.userInterventionPrompt ? 0.80 : 0.40;

    let expectedChildValue = 0;
    let maxQ = -Infinity;

    for (const child of children) {
      const p_norm = totalChildProb > 0 ? child.conditionalProbability / totalChildProb : 1 / children.length;
      const v_child = computeValue(child.id);
      expectedChildValue += p_norm * v_child;

      const q = computeRiskAdjustedQ(p_norm, v_child, tau);
      if (q > maxQ) maxQ = q;
    }

    const v = u + GAMMA * ((1 - agency) * expectedChildValue + agency * maxQ);
    valueTree.set(nodeId, Number(v.toFixed(4)));
    return v;
  }

  // Run bottom-up value backup
  computeValue(rootId);

  // Greedy trajectory extraction
  const goldenPathNodeIds: string[] = [rootId];
  let currId = rootId;

  while (true) {
    const children = childrenMap.get(currId);
    if (!children || children.length === 0) break;

    const totalChildProb = children.reduce((acc, c) => acc + c.conditionalProbability, 0);
    let bestChildId: string | null = null;
    let bestQ = -Infinity;

    for (const child of children) {
      const p_norm = totalChildProb > 0 ? child.conditionalProbability / totalChildProb : 1 / children.length;
      const v_child = valueTree.get(child.id) ?? 0;
      const q = computeRiskAdjustedQ(p_norm, v_child, tau);
      if (q > bestQ) {
        bestQ = q;
        bestChildId = child.id;
      }
    }

    if (bestChildId) {
      goldenPathNodeIds.push(bestChildId);
      currId = bestChildId;
    } else {
      break;
    }
  }

  return { goldenPathNodeIds, valueTree };
}

// ============================================================================
// 3. REAL-TIME 60 FPS SENSITIVITY SLIDER PERTURBATION (LLD.md §2.3)
// ============================================================================

export interface SliderDeltas {
  executionVelocity: number; // [-1.0, 1.0]
  capitalBuffer: number;     // [-1.0, 1.0]
  marketTailwind: number;    // [-1.0, 1.0]
  skillPreparation: number;  // [-1.0, 1.0]
}

export function perturbProbabilities(
  nodes: ProbabilityNode[],
  deltas: SliderDeltas,
  unexploredMass: number = 0.20
): Map<string, number> {
  const activeNodes = nodes.filter(n => n.status === 'active');
  if (activeNodes.length === 0) return new Map();

  const EPSILON = 1e-6;
  const logits = activeNodes.map(node => {
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
  const exps = logits.map(z => Math.exp(z - maxLogit));
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

// ============================================================================
// 4. 3D CONICAL ORBITAL LAYOUT & COLLISION SOLVER (LLD.md §2.4)
// ============================================================================

const D_STEP = 14.0;
const D_MIN = 3.2; // Minimum distance threshold between any two nodes

export function computeConicalPositions(
  parentNode: ProbabilityNode | null,
  siblings: ProbabilityNode[],
  waveNumber: number
): Map<string, SpatialCoordinates> {
  const result = new Map<string, SpatialCoordinates>();
  if (siblings.length === 0) return result;

  const parentPos = parentNode ? parentNode.spatialPosition : { x: 0, y: 0, z: 0 };
  const parentHeading = parentNode && (parentPos.x !== 0 || parentPos.z !== 0)
    ? Math.atan2(parentPos.x, -parentPos.z)
    : 0;

  const count = siblings.length;
  const zStep = parentPos.z - D_STEP * (1 + 0.18 * (waveNumber - 1));
  const baseRadius = 5.0 + 3.0 * (waveNumber - 1);
  const phaseOffset = (waveNumber - 1) * 0.36; // Golden-angle interleaving

  // Step 1: Initial orbital placement
  const tempPositions: { id: string; x: number; y: number; z: number }[] = [];

  for (let i = 0; i < count; i++) {
    const node = siblings[i];
    const angleSpread = Math.PI * 0.85; // 153 degrees fan
    const theta = parentHeading - (angleSpread / 2) + (i / Math.max(count - 1, 1)) * angleSpread + phaseOffset;

    const x = parentPos.x + baseRadius * Math.sin(theta);
    const z = zStep;
    const utility = node.expectedUtilityScore ?? 0;
    const y = 0.6 * parentPos.y + 0.5 * utility;

    tempPositions.push({ id: node.id, x, y, z });
  }

  // Step 2: 15 iterations of inverse-square force-repulsion
  const ITERATIONS = 15;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < tempPositions.length; i++) {
      for (let j = i + 1; j < tempPositions.length; j++) {
        const a = tempPositions[i];
        const b = tempPositions[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < D_MIN && dist > 1e-4) {
          const overlap = (D_MIN - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          a.z -= nz * overlap;

          b.x += nx * overlap;
          b.y += ny * overlap;
          b.z += nz * overlap;
        }
      }
    }
  }

  for (const pos of tempPositions) {
    result.set(pos.id, {
      x: Number(pos.x.toFixed(2)),
      y: Number(pos.y.toFixed(2)),
      z: Number(pos.z.toFixed(2)),
    });
  }

  return result;
}
