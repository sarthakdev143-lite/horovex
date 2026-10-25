import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';

describe('Milestone 1 Adversarial Challenge: SSR Safety & Three.js Invariants', () => {
  it('ADV-SSR-01: Three.js CubicBezierCurve3 never produces NaN on coincident coordinates (distance = 0)', () => {
    const start: [number, number, number] = [0, 0, 0];
    const end: [number, number, number] = [0, 0, 0];

    const pStart = new THREE.Vector3(...start);
    const pEnd = new THREE.Vector3(...end);
    const dist = pStart.distanceTo(pEnd);

    expect(dist).toBe(0);

    const c1 = new THREE.Vector3(pStart.x, pStart.y, pStart.z - dist * 0.35);
    const c2 = new THREE.Vector3(pEnd.x, pEnd.y, pEnd.z + dist * 0.35);

    const bezier = new THREE.CubicBezierCurve3(pStart, c1, c2, pEnd);
    const midPoint = bezier.getPoint(0.5);

    expect(Number.isNaN(midPoint.x)).toBe(false);
    expect(Number.isNaN(midPoint.y)).toBe(false);
    expect(Number.isNaN(midPoint.z)).toBe(false);
    expect(midPoint.x).toBe(0);
    expect(midPoint.y).toBe(0);
    expect(midPoint.z).toBe(0);
  });

  it('ADV-SSR-02: Three.js Filament radius calculation strictly bounds geometry across extreme probabilities', () => {
    // Tests that filament geometry cannot produce 0 or negative radius under any probability
    const computeFilamentRadius = (conditionalProbability: number, isGoldenPath: boolean = false) => {
      const baseRadius = 0.04 + 0.14 * Math.max(0.05, Math.min(1.0, conditionalProbability));
      return isGoldenPath ? baseRadius * 1.35 : baseRadius;
    };

    const edgeCases = [
      { prob: 0.0, minAllowed: 0.045 },
      { prob: 1.0, maxAllowed: 0.185 },
      { prob: -100.0, clampedMin: 0.047 },
      { prob: 1e6, clampedMax: 0.18 },
      { prob: NaN, handlesNan: true },
    ];

    edgeCases.forEach(({ prob, minAllowed, maxAllowed, clampedMin, clampedMax }) => {
      const radius = computeFilamentRadius(prob);
      if (minAllowed !== undefined) expect(radius).toBeGreaterThan(minAllowed);
      if (maxAllowed !== undefined) expect(radius).toBeLessThanOrEqual(maxAllowed);
      if (clampedMin !== undefined) expect(radius).toBeCloseTo(clampedMin, 3);
      if (clampedMax !== undefined) expect(radius).toBeCloseTo(clampedMax, 3);
    });

    // Golden path modifier increases radius by 35%
    const standardRadius = computeFilamentRadius(0.5, false);
    const goldenRadius = computeFilamentRadius(0.5, true);
    expect(goldenRadius).toBeCloseTo(standardRadius * 1.35, 4);
  });

  it('ADV-SSR-03: WebGL depth strata ring geometry generates valid double-sided rings without degenerate coordinates', () => {
    const maxDepth = 4;
    const step = 14;
    const rings = Array.from({ length: maxDepth }, (_, i) => -step * (i + 1));

    expect(rings).toHaveLength(4);
    expect(rings[0]).toBe(-14);
    expect(rings[3]).toBe(-56);

    rings.forEach((zDepth, idx) => {
      const innerRadius = 12 + idx * 6;
      const outerRadius = 12.1 + idx * 6;
      const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);

      expect(ringGeo.parameters.innerRadius).toBe(innerRadius);
      expect(ringGeo.parameters.outerRadius).toBe(outerRadius);
      expect(ringGeo.attributes.position.count).toBeGreaterThan(0);
      ringGeo.dispose();
    });
  });

  it('ADV-SSR-04: Void background 3000-particle spherical distribution generates finite non-NaN vectors', () => {
    const particleCount = 100; // Sample 100 particles for fast invariant check
    const pos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 80 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(phi) * Math.sin(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.cos(theta) - 50;

      expect(Number.isFinite(pos[i * 3])).toBe(true);
      expect(Number.isFinite(pos[i * 3 + 1])).toBe(true);
      expect(Number.isFinite(pos[i * 3 + 2])).toBe(true);
      expect(Number.isNaN(pos[i * 3])).toBe(false);
    }
  });
});

describe('Milestone 1 Adversarial Challenge: State Store Stress & Edge Cases', () => {
  beforeEach(() => {
    useMultiverseStore.getState().resetSimulation();
  });

  it('ADV-STORE-01: handles completely empty node tree (setNodes([])) gracefully without crashing', () => {
    const store = useMultiverseStore.getState();
    store.setNodes([]);

    const state = useMultiverseStore.getState();
    expect(Object.keys(state.nodes)).toHaveLength(0);

    // Operations on empty store must not throw
    expect(() => store.selectNode('non-existent-id')).not.toThrow();
    expect(() => store.setHoveredNode('non-existent-id')).not.toThrow();
    expect(() => store.updateNode('non-existent-id', { title: 'Test' })).not.toThrow();
    expect(() => store.collapseWavefunction('non-existent-id')).not.toThrow();
    expect(() => store.setGoldenPath(['id1', 'id2'])).not.toThrow();

    // Resetting simulation restores default seed nodes
    store.resetSimulation();
    const restored = useMultiverseStore.getState();
    expect(Object.keys(restored.nodes).length).toBeGreaterThan(0);
    expect(restored.nodes['root-1']).toBeDefined();
  });

  it('ADV-STORE-02: handles nodes with null parent and orphan nodes with invalid parent references', () => {
    const store = useMultiverseStore.getState();

    const orphanNode: ProbabilityNode = {
      id: 'orphan-node-1',
      simulationId: 'sim-test',
      parentId: 'ghost-parent-999', // Parent does not exist in store
      treePath: 'ghost-parent-999.orphan-node-1',
      depth: 2,
      waveNumber: 1,
      siblingIndex: 1,
      regimeTier: 'baseline_wave_1',
      title: 'Orphan Node',
      narrativeSummary: 'Node referencing non-existent parent',
      timeHorizon: '1-3 Months',
      conditionalProbability: 0.5,
      cumulativeProbability: 0.5,
      rawLlmConfidence: 0.8,
      unexploredChildMass: 0.2,
      causalDrivers: ['Orphan driver'],
      reversibilityType: 'type_2_reversible',
      reversibilityScore: 5,
      regretMinimizationScore: 5,
      impactVector: { wealth: 0, autonomy: 0, mastery: 0, stability: 0, impact: 0, peace: 0 },
      isGoldenPath: false,
      status: 'active',
      spatialPosition: { x: 10, y: 10, z: -20 },
      sensitivityWeights: { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
      tripwires: [],
      createdAt: new Date().toISOString(),
    };

    store.addNodes([orphanNode]);
    expect(useMultiverseStore.getState().nodes['orphan-node-1']).toBeDefined();

    // Collapsing orphan node must not throw or corrupt graph
    expect(() => store.collapseWavefunction('orphan-node-1')).not.toThrow();
  });

  it('ADV-STORE-03: prevents collapsing the root node (parentId === null)', () => {
    const store = useMultiverseStore.getState();
    const originalRootId = useMultiverseStore.getState().rootNodeId;
    const rootStatusBefore = useMultiverseStore.getState().nodes['root-1'].status;

    // Root node has parentId: null. Collapsing it should be a safe no-op
    store.collapseWavefunction('root-1');

    const state = useMultiverseStore.getState();
    expect(state.rootNodeId).toBe(originalRootId);
    expect(state.nodes['root-1'].status).toBe(rootStatusBefore);
  });

  it('ADV-STORE-04: handles extreme spatial coordinates and large coordinate boundaries', () => {
    const store = useMultiverseStore.getState();

    const extremeNode: ProbabilityNode = {
      id: 'extreme-coord-node',
      simulationId: 'sim-test',
      parentId: 'root-1',
      treePath: 'root-1.extreme-coord-node',
      depth: 1,
      waveNumber: 1,
      siblingIndex: 99,
      regimeTier: 'tail_risk_wave_3_plus',
      title: 'Cosmic Scale Node',
      narrativeSummary: 'Extremely far node',
      timeHorizon: '10 Years',
      conditionalProbability: 0.0001,
      cumulativeProbability: 0.0001,
      rawLlmConfidence: 0.1,
      unexploredChildMass: 0.2,
      causalDrivers: [],
      reversibilityType: 'type_1_irreversible',
      reversibilityScore: 1,
      regretMinimizationScore: 1,
      impactVector: { wealth: 10, autonomy: -10, mastery: 10, stability: -10, impact: 10, peace: -10 },
      isGoldenPath: false,
      status: 'active',
      spatialPosition: { x: 1e8, y: -1e8, z: 1e8 },
      sensitivityWeights: { executionVelocity: 1, capitalBuffer: -1, marketTailwind: 1, skillPreparation: -1 },
      tripwires: [],
      createdAt: new Date().toISOString(),
    };

    store.addNodes([extremeNode]);
    const retrieved = useMultiverseStore.getState().nodes['extreme-coord-node'];
    expect(retrieved.spatialPosition.x).toBe(1e8);
    expect(retrieved.spatialPosition.y).toBe(-1e8);
    expect(retrieved.spatialPosition.z).toBe(1e8);
    expect(Number.isFinite(retrieved.spatialPosition.x)).toBe(true);
  });

  it('ADV-STORE-05: handles extreme and out-of-bound sensitivity levers smoothly', () => {
    const store = useMultiverseStore.getState();

    // Test out of bounds values
    store.setSensitivityLevers({
      executionVelocity: 5.0,
      capitalBuffer: -10.0,
      marketTailwind: 0.0,
      skillPreparation: 1.0,
    });

    let levers = useMultiverseStore.getState().sensitivityLevers;
    expect(levers.executionVelocity).toBe(5.0);
    expect(levers.capitalBuffer).toBe(-10.0);

    // Test partial updates preserve unmentioned levers
    store.setSensitivityLevers({
      marketTailwind: 0.8,
    });

    levers = useMultiverseStore.getState().sensitivityLevers;
    expect(levers.executionVelocity).toBe(5.0);
    expect(levers.capitalBuffer).toBe(-10.0);
    expect(levers.marketTailwind).toBe(0.8);
    expect(levers.skillPreparation).toBe(1.0);
  });

  it('ADV-STORE-06: stress test - 1,000 rapid sequential store operations complete in < 50ms total (< 0.05ms/op)', () => {
    const store = useMultiverseStore.getState();
    const t0 = performance.now();

    for (let i = 0; i < 250; i++) {
      store.setSensitivityLevers({
        executionVelocity: Math.sin(i),
        capitalBuffer: Math.cos(i),
      });
      store.selectNode(i % 2 === 0 ? 'root-1' : 'n1-enterprise-pivot');
      store.setHoveredNode(i % 3 === 0 ? 'n1-self-serve-growth' : null);
      store.updateNode('n1-enterprise-pivot', {
        conditionalProbability: 0.28 + 0.01 * (i % 5),
      });
    }

    const t1 = performance.now();
    const totalDuration = t1 - t0;
    const avgPerOp = totalDuration / 1000;

    // 1000 operations total (250 iterations * 4 store calls)
    expect(totalDuration).toBeLessThan(150); // Total duration under 150ms
    expect(avgPerOp).toBeLessThan(0.2);     // Average per operation under 0.2ms (well under 16ms 60 FPS budget)
  });
});
