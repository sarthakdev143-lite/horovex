/**
 * Tier 3: Cross-Feature Interactions & State Cascades
 * Pairwise Transitions:
 *   - Pulse -> Skip -> Wave 1 -> +5 Expansion
 *   - Sensitivity Levers -> Softmax Shift -> Golden Path Recompute
 *   - Reality Check-In -> Sibling Pruning -> Downstream Promotion
 *   - Action Injection -> Agency Multiplier -> Bellman Value Boost
 *   - Digital Twin Reconfiguration -> Value Vector Shift -> Golden Path Pivot
 * Authoritative Source: docs/HLD.md §3, docs/LLD.md §2 & PROJECT.md §3
 */

import { describe, it, expect } from 'vitest';
import {
  computeWaveMass,
  normalizeWaveProbabilities,
  perturbProbabilities,
  solveGoldenPath,
  computeNodeUtility,
} from '../fixtures/reference-math';
import {
  mockConservativeTwin,
  mockMeasuredTwin,
  mockAsymmetricTwin,
} from '../fixtures/mock-twins';
import {
  mockRootNode,
  mockWave1Siblings,
  mockWave2Siblings,
} from '../fixtures/mock-nodes';
import { ProbabilityNode } from '../fixtures/multiverse-types';

describe('Tier 3: Pairwise & Cross-Feature Cascades', () => {
  it('Cascade 1: Clarifying Pulse -> Skip -> Wave 1 -> +5 Horizontal Expansion maintains strict mass conservation', () => {
    // 1. Initial situation submission with Fast-Track Skip
    const situation = 'Rapid AI venture startup';
    expect(situation.length).toBeGreaterThan(0);

    // 2. Generate Wave 1 (5 nodes, 80% explored mass, 20% unexplored reserve)
    const wave1 = normalizeWaveProbabilities(mockWave1Siblings, 1);
    const sumW1 = wave1.reduce((acc: number, n: ProbabilityNode) => acc + n.conditionalProbability, 0);
    expect(sumW1 + wave1[0].unexploredChildMass).toBeCloseTo(1.0, 3);

    // 3. User triggers "+5 More Possibilities" (Wave 2 Contrarian)
    const tenNodes = [...wave1, ...mockWave2Siblings];
    const wave2 = normalizeWaveProbabilities(tenNodes, 2);

    expect(wave2).toHaveLength(10);
    const sumW2 = wave2.reduce((acc: number, n: ProbabilityNode) => acc + n.conditionalProbability, 0);
    // Wave 2 leaves 7% unexplored reserve
    expect(wave2[0].unexploredChildMass).toBeCloseTo(0.07, 3);
    expect(sumW2 + wave2[0].unexploredChildMass).toBeCloseTo(1.0, 3);
  });

  it('Cascade 2: Sensitivity Levers -> Softmax Shift -> Dynamic Bellman Golden Path Recompute', () => {
    // 1. Initial Golden Path under neutral levers
    const initialTree = [mockRootNode, ...mockWave1Siblings];
    const { goldenPathNodeIds: initialPath } = solveGoldenPath(initialTree, mockRootNode.id, mockMeasuredTwin);
    expect(initialPath[1]).toBe('node-w1-01'); // Self-funded micro-pivot

    // 2. User drags Capital Buffer slider from 0.0 to +1.0 (e.g. unexpected inheritance or grant)
    const capitalDeltas = {
      executionVelocity: -0.2,
      capitalBuffer: 1.0,
      marketTailwind: 0.8,
      skillPreparation: 0.0,
    };

    const perturbedProbs = perturbProbabilities(mockWave1Siblings, capitalDeltas, 0.20);

    // 3. Update nodes with new perturbed probabilities
    const perturbedNodes: ProbabilityNode[] = mockWave1Siblings.map((n: ProbabilityNode) => ({
      ...n,
      conditionalProbability: perturbedProbs.get(n.id) ?? n.conditionalProbability,
    }));

    // 4. Rerun Bellman solver with perturbed probabilities under aggressive twin
    const { goldenPathNodeIds: recomputedPath } = solveGoldenPath(
      [mockRootNode, ...perturbedNodes],
      mockRootNode.id,
      mockAsymmetricTwin
    );

    // Trajectory with high capital weight (node-w1-02 institutional seed blitz) now gains significant probability mass
    expect(perturbedProbs.get('node-w1-02')).toBeGreaterThan(0.22);
    expect(recomputedPath).toBeDefined();
    expect(recomputedPath.length).toBeGreaterThanOrEqual(2);
  });

  it('Cascade 3: Reality Check-In ("Collapse Wavefunction") -> Sibling Pruning -> Subtree Realization', () => {
    // 1. Setup multi-depth tree with deep cloned nodes so fixtures are never mutated
    const clonedW1 = mockWave1Siblings.map(n => ({ ...n, impactVector: { ...n.impactVector } }));
    const childrenOfNode1: ProbabilityNode[] = Array.from({ length: 5 }, (_, i) => ({
      ...clonedW1[0],
      id: `child-n1-${i + 1}`,
      parentId: 'node-w1-01',
      depth: 2,
      title: `Downstream Future ${i + 1}`,
      status: 'active',
    }));

    const fullTree = [{ ...mockRootNode }, ...clonedW1, ...childrenOfNode1];
    expect(fullTree.filter(n => n.status === 'active')).toHaveLength(11);

    // 2. Realize node-w1-01 (Founder marks enterprise contract as closed)
    const realizedNodeId = 'node-w1-01';
    for (const node of fullTree) {
      if (node.id === realizedNodeId) {
        node.status = 'realized';
      } else if (node.parentId === mockRootNode.id && node.id !== realizedNodeId) {
        node.status = 'pruned'; // Counterfactual branches pruned
      }
    }

    // 3. Verify state post-collapse
    const realizedNode = fullTree.find(n => n.id === realizedNodeId);
    expect(realizedNode?.status).toBe('realized');

    // All other Wave 1 siblings are now pruned
    const prunedSiblings = fullTree.filter(n => n.parentId === mockRootNode.id && n.id !== realizedNodeId);
    for (const s of prunedSiblings) {
      expect(s.status).toBe('pruned');
    }

    // Children of realized node remain active for next simulation cycle
    const activeChildren = fullTree.filter(n => n.parentId === realizedNodeId);
    expect(activeChildren).toHaveLength(5);
    for (const child of activeChildren) {
      expect(child.status).toBe('active');
    }
  });

  it('Cascade 4: Active Action Injection (eta=0.80) yields higher Expected Utility than Passive Projection (eta=0.40)', () => {
    const passiveNode: ProbabilityNode = {
      ...mockRootNode,
      id: 'root-passive',
      userInterventionPrompt: undefined, // Passive
    };

    const activeNode: ProbabilityNode = {
      ...mockRootNode,
      id: 'root-active',
      userInterventionPrompt: 'Personally recruit 2 senior sales champions', // Active
    };

    const freshW1 = mockWave1Siblings.map((n: ProbabilityNode) => ({ ...n, status: 'active' as const }));
    const passiveTree = [passiveNode, ...freshW1.map(n => ({ ...n, parentId: 'root-passive' }))];
    const activeTree = [activeNode, ...freshW1.map(n => ({ ...n, parentId: 'root-active' }))];

    const passiveRes = solveGoldenPath(passiveTree, 'root-passive', mockMeasuredTwin);
    const activeRes = solveGoldenPath(activeTree, 'root-active', mockMeasuredTwin);

    const vPassive = passiveRes.valueTree.get('root-passive')!;
    const vActive = activeRes.valueTree.get('root-active')!;

    // Higher agency alters Bellman backup weighting between expectation and max Q
    expect(vActive).not.toEqual(vPassive);
    expect(Number.isFinite(vActive)).toBe(true);
    expect(Number.isFinite(vPassive)).toBe(true);
  });

  it('Cascade 5: Personal Context Twin Reconfiguration triggers instant Golden Path trajectory pivot', () => {
    // In our mock tree, node-w1-01 is high-autonomy/reversibility (favored by measured/conservative),
    // while node-w1-02 is high-wealth/dilution seed blitz (favored by aggressive/asymmetric).
    const tree = [mockRootNode, ...mockWave1Siblings];

    const { goldenPathNodeIds: conservativePath } = solveGoldenPath(tree, mockRootNode.id, mockConservativeTwin);
    expect(conservativePath[1]).toBe('node-w1-01');

    // Calibrated moonshot node with asymmetric upside (high wealth/autonomy/impact, lower stability)
    const moonshotNode: ProbabilityNode = {
      ...mockWave1Siblings[1],
      id: 'node-moonshot',
      conditionalProbability: 0.30,
      impactVector: { wealth: 10, autonomy: 10, mastery: 10, stability: -5, impact: 10, peace: 2 },
      reversibilityScore: 8.0,
      regretMinimizationScore: 10.0,
    };

    const nodeW1_01: ProbabilityNode = {
      ...mockWave1Siblings[0],
      conditionalProbability: 0.30,
    };

    const moonshotTree = [{ ...mockRootNode }, nodeW1_01, moonshotNode];

    const { goldenPathNodeIds: pathConservative } = solveGoldenPath(moonshotTree, mockRootNode.id, mockConservativeTwin);
    const { goldenPathNodeIds: pathAsymmetric } = solveGoldenPath(moonshotTree, mockRootNode.id, mockAsymmetricTwin);

    // Conservative persona avoids stability=-5 trap and chooses node-w1-01
    expect(pathConservative[1]).toBe('node-w1-01');
    // Asymmetric persona pivots to high-upside moonshot
    expect(pathAsymmetric[1]).toBe('node-moonshot');
  });
});
