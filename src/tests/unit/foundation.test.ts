import { describe, it, expect, beforeEach } from 'vitest';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { computeWaveMass, normalizeWaveProbabilities, computeCumulativeProbability } from '@/lib/math/bayesian';
import { ProbabilityNode } from '@/lib/types/multiverse';

describe('Milestone 1 Foundation: Domain & Store Verification', () => {
  beforeEach(() => {
    useMultiverseStore.getState().resetSimulation();
  });

  it('initializes the multiverse store with default seed nodes and Golden Path', () => {
    const state = useMultiverseStore.getState();
    expect(state.rootNodeId).toBe('root-1');
    expect(state.nodes['root-1']).toBeDefined();
    expect(state.selectedNodeId).toBe('n1-enterprise-pivot');
    expect(state.goldenPathNodeIds).toContain('root-1');
    expect(state.goldenPathNodeIds).toContain('n1-enterprise-pivot');
    expect(state.activeDepth).toBe(1);
    expect(state.exploredMass).toBe(0.80);
    expect(state.unexploredMass).toBe(0.20);
  });

  it('selects and hovers nodes properly in reactive state', () => {
    const store = useMultiverseStore.getState();
    store.selectNode('n1-self-serve-growth');
    expect(useMultiverseStore.getState().selectedNodeId).toBe('n1-self-serve-growth');

    store.setHoveredNode('n1-hybrid-licensing');
    expect(useMultiverseStore.getState().hoveredNodeId).toBe('n1-hybrid-licensing');

    store.setHoveredNode(null);
    expect(useMultiverseStore.getState().hoveredNodeId).toBeNull();
  });

  it('updates node fields without mutating other nodes', () => {
    const store = useMultiverseStore.getState();
    store.updateNode('n1-enterprise-pivot', {
      conditionalProbability: 0.35,
      isGoldenPath: true,
    });

    const updatedNode = useMultiverseStore.getState().nodes['n1-enterprise-pivot'];
    expect(updatedNode.conditionalProbability).toBe(0.35);

    // Verify other nodes remain untouched
    const untouchedNode = useMultiverseStore.getState().nodes['n1-self-serve-growth'];
    expect(untouchedNode.conditionalProbability).toBe(0.22);
  });

  it('executes wavefunction collapse marking target as realized and siblings as pruned', () => {
    const store = useMultiverseStore.getState();
    store.collapseWavefunction('n1-enterprise-pivot');

    const state = useMultiverseStore.getState();
    expect(state.nodes['n1-enterprise-pivot'].status).toBe('realized');
    expect(state.nodes['n1-self-serve-growth'].status).toBe('pruned');
    expect(state.nodes['n1-hybrid-licensing'].status).toBe('pruned');
    expect(state.rootNodeId).toBe('n1-enterprise-pivot');
  });

  it('perturbs sensitivity levers within bounded state', () => {
    const store = useMultiverseStore.getState();
    store.setSensitivityLevers({
      executionVelocity: 0.5,
      capitalBuffer: -0.25,
    });

    const levers = useMultiverseStore.getState().sensitivityLevers;
    expect(levers.executionVelocity).toBe(0.5);
    expect(levers.capitalBuffer).toBe(-0.25);
    expect(levers.marketTailwind).toBe(0.0);
    expect(levers.skillPreparation).toBe(0.0);
  });
});

describe('Milestone 1 Foundation: Bayesian Math & Invariants', () => {
  it('partitions 80% explored / 20% unexplored in Wave 1', () => {
    const partition = computeWaveMass(1);
    expect(partition.wave).toBe(1);
    expect(partition.alpha).toBeCloseTo(0.80, 4);
    expect(partition.deltaMass).toBeCloseTo(0.80, 4);
    expect(partition.remainingUnexplored).toBeCloseTo(0.20, 4);
  });

  it('carves 65% of remaining unexplored mass in Wave 2 (Contrarian)', () => {
    const partition = computeWaveMass(2);
    expect(partition.wave).toBe(2);
    expect(partition.alpha).toBeCloseTo(0.65, 4);
    expect(partition.deltaMass).toBeCloseTo(0.13, 4);
    expect(partition.remainingUnexplored).toBeCloseTo(0.07, 4);
  });

  it('carves 60% of remaining unexplored mass in Wave 3 (Tail-Risk)', () => {
    const partition = computeWaveMass(3);
    expect(partition.wave).toBe(3);
    expect(partition.alpha).toBeCloseTo(0.60, 4);
    expect(partition.deltaMass).toBeCloseTo(0.042, 4);
    expect(partition.remainingUnexplored).toBeCloseTo(0.028, 4);
  });

  it('normalizes sibling nodes strictly conserving mass invariant sum(P_i) + M_unexplored = 1.0', () => {
    const mockNodes: ProbabilityNode[] = [
      {
        id: 'n-test-1',
        simulationId: 'sim-1',
        parentId: 'root-1',
        treePath: 'root-1.n-test-1',
        depth: 1,
        waveNumber: 1,
        siblingIndex: 1,
        regimeTier: 'baseline_wave_1',
        title: 'Outcome 1',
        timeHorizon: '3-6 Months',
        conditionalProbability: 0,
        cumulativeProbability: 0,
        rawLlmConfidence: 0.85,
        unexploredChildMass: 0.20,
        causalDrivers: ['Driver A'],
        reversibilityType: 'type_2_reversible',
        reversibilityScore: 7,
        regretMinimizationScore: 8,
        impactVector: { wealth: 5, autonomy: 5, mastery: 5, stability: 5, impact: 5, peace: 5 },
        isGoldenPath: false,
        status: 'active',
        spatialPosition: { x: 0, y: 0, z: -14 },
        sensitivityWeights: { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
        tripwires: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'n-test-2',
        simulationId: 'sim-1',
        parentId: 'root-1',
        treePath: 'root-1.n-test-2',
        depth: 1,
        waveNumber: 1,
        siblingIndex: 2,
        regimeTier: 'baseline_wave_1',
        title: 'Outcome 2',
        timeHorizon: '3-6 Months',
        conditionalProbability: 0,
        cumulativeProbability: 0,
        rawLlmConfidence: 0.45,
        unexploredChildMass: 0.20,
        causalDrivers: ['Driver B'],
        reversibilityType: 'type_2_reversible',
        reversibilityScore: 6,
        regretMinimizationScore: 7,
        impactVector: { wealth: 4, autonomy: 4, mastery: 4, stability: 4, impact: 4, peace: 4 },
        isGoldenPath: false,
        status: 'active',
        spatialPosition: { x: 4, y: 0, z: -14 },
        sensitivityWeights: { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
        tripwires: [],
        createdAt: new Date().toISOString(),
      },
    ];

    const normalized = normalizeWaveProbabilities(mockNodes, 1);
    expect(normalized).toHaveLength(2);
    const sumCond = normalized.reduce((acc, n) => acc + n.conditionalProbability, 0);
    const mUnexp = normalized[0].unexploredChildMass;

    expect(sumCond + mUnexp).toBeCloseTo(1.0, 3);
  });

  it('computes cumulative path multiplication with monotonic decay', () => {
    const pRoot = 1.0;
    const p1 = computeCumulativeProbability(pRoot, 0.45);
    const p2 = computeCumulativeProbability(p1, 0.50);

    expect(p1).toBe(0.45);
    expect(p2).toBe(0.225);
    expect(p2).toBeLessThan(p1);
    expect(p1).toBeLessThan(pRoot);
  });
});

describe('Milestone 1 Foundation: WebGL Context Mocking', () => {
  it('provides a functioning mock WebGL context on canvas elements in JSDOM', () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    expect(gl).not.toBeNull();
    expect(gl?.clearColor).toBeDefined();
    expect(gl?.viewport).toBeDefined();
    expect(gl?.createShader).toBeDefined();
  });
});
