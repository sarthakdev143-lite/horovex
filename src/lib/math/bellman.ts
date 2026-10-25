/**
 * Bellman Expected Utility & Golden Path Dynamic Programming Solver
 * Authoritative Source: docs/LLD.md §2.2 & PROJECT.md §2
 */

import { ProbabilityNode, UserContextTwin, RiskAppetiteLevel } from '../types/multiverse';

const LAMBDA_REV = 0.35;
const LAMBDA_REGRET = 0.45;
const V_MIN = -25.0;
const GAMMA = 0.92;

/**
 * Computes multi-objective node utility U(n) combining:
 * 1. 6D Core Values alignment dot-product
 * 2. Reversibility component (lambda_rev = 0.35)
 * 3. 10-Year Regret minimization component (lambda_regret = 0.45)
 */
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

/**
 * Maps user risk appetite to probability risk distortion exponent tau.
 * Lower tau rewards high-upside asymmetric bets; higher tau emphasizes downside certainty.
 */
export function getTauForRiskAppetite(appetite: RiskAppetiteLevel): number {
  switch (appetite) {
    case 'conservative':
      return 0.85;
    case 'measured':
      return 0.55;
    case 'aggressive':
      return 0.35;
    case 'asymmetric':
      return 0.25;
    default:
      return 0.55;
  }
}

/**
 * Computes risk-adjusted expected value Q(s, a) using distorted probability weighting.
 */
export function computeRiskAdjustedQ(p_norm: number, v_child: number, tau: number): number {
  return Math.pow(Math.max(p_norm, 1e-6), tau) * (v_child - V_MIN) + V_MIN;
}

/**
 * Solves the optimal decision trajectory (Golden Path) across the probability DAG
 * using backward Bellman expected utility induction and greedy forward extraction.
 */
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
      const p_norm =
        totalChildProb > 0 ? child.conditionalProbability / totalChildProb : 1 / children.length;
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
      const p_norm =
        totalChildProb > 0 ? child.conditionalProbability / totalChildProb : 1 / children.length;
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
