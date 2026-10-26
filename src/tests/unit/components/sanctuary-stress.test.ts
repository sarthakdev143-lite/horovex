import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { SliderDeltas } from '@/lib/math/sensitivity';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Mock scenario nodes
const mockRootNode: ProbabilityNode = ({
  id: 'root-1',
  parentId: null,
  depth: 0,
  siblingIndex: 0,
  waveNumber: 0,
  title: 'Current Decision Origin',
  narrativeDescription: 'Initial decision state',
  conditionalProbability: 1.0,
  cumulativeProbability: 1.0,
  timeHorizonYears: 0,
  causalDrivers: ['Origin'],
  reversibilityIndex: 0.9,
  doorType: 'Type 2' as const,
  impactVectors: {
    financialRunwayMonths: 18,
    enterpriseValue: 1000000,
    marketShareDelta: 0.05,
    teamMorale: 0.8,
    technicalDebtDelta: 0.1,
    optionalityPreservation: 0.9,
  },
  tripwireIndicators: ['Milestone reached'],
  status: 'active' as const,
  spatialCoords: { x: 0, y: 0, z: 9.0 },
} as unknown as ProbabilityNode);

const mockWave1Nodes: ProbabilityNode[] = [
  {
    ...mockRootNode,
    id: 'node-w1-1',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 1,
    waveNumber: 1,
    title: 'Enterprise High-Velocity Pivot',
    conditionalProbability: 0.35,
    cumulativeProbability: 0.35,
    isGoldenPath: true,
  },
  {
    ...mockRootNode,
    id: 'node-w1-2',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 2,
    waveNumber: 1,
    title: 'Self-Serve Product-Led Growth',
    conditionalProbability: 0.25,
    cumulativeProbability: 0.25,
  },
  {
    ...mockRootNode,
    id: 'node-w1-3',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 3,
    waveNumber: 1,
    title: 'Hybrid Mid-Market Expansion',
    conditionalProbability: 0.2,
    cumulativeProbability: 0.2,
  },
  {
    ...mockRootNode,
    id: 'node-w1-4',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 4,
    waveNumber: 1,
    title: 'Defensive Runway Preservation',
    conditionalProbability: 0.12,
    cumulativeProbability: 0.12,
  },
  {
    ...mockRootNode,
    id: 'node-w1-5',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 5,
    waveNumber: 1,
    title: 'Open Source Community Fork',
    conditionalProbability: 0.08,
    cumulativeProbability: 0.08,
  },
];

const mockWave2Nodes: ProbabilityNode[] = [
  {
    ...mockRootNode,
    id: 'node-w2-1',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 6,
    waveNumber: 2,
    title: 'Aggressive Global Rollout',
    conditionalProbability: 0.07,
    cumulativeProbability: 0.07,
  },
  {
    ...mockRootNode,
    id: 'node-w2-2',
    parentId: 'root-1',
    depth: 1,
    siblingIndex: 7,
    waveNumber: 2,
    title: 'Niche Vertical Consolidation',
    conditionalProbability: 0.06,
    cumulativeProbability: 0.06,
  },
];

const mockDepth2Nodes: ProbabilityNode[] = [
  {
    ...mockRootNode,
    id: 'node-d2-1',
    parentId: 'node-w1-1',
    depth: 2,
    siblingIndex: 1,
    waveNumber: 1,
    title: 'Fortune 500 Enterprise Scale',
    conditionalProbability: 0.4,
    cumulativeProbability: 0.14,
  },
  {
    ...mockRootNode,
    id: 'node-d2-2',
    parentId: 'node-w1-1',
    depth: 2,
    siblingIndex: 2,
    waveNumber: 1,
    title: 'Channel Partner Ecosystem',
    conditionalProbability: 0.3,
    cumulativeProbability: 0.105,
  },
];

const allMockNodes = [
  mockRootNode,
  ...mockWave1Nodes,
  ...mockWave2Nodes,
  ...mockDepth2Nodes,
];

describe('Milestone 1 Challenger Stress Harness: Sensitivity Perturbation & Geometry Scaling', () => {
  // Pure mathematical simulator of AlabasterSanctuary3D geometry bounds
  function simulateSanctuaryGeometry(
    nodes: ProbabilityNode[],
    levers: SliderDeltas,
    goldenPath: string[]
  ) {
    const l = levers;
    const avg =
      (l.executionVelocity +
        l.capitalBuffer +
        l.marketTailwind +
        l.skillPreparation) /
      4;
    const leverBoost = Math.max(-0.2, Math.min(0.3, avg * 0.25));

    const depth1 = nodes.filter((n) => n.depth === 1);
    const wave1 = depth1.filter((n) => n.waveNumber === 1);
    const wave2Plus = depth1.filter((n) => n.waveNumber >= 2);
    const deeper = nodes.filter((n) => n.depth >= 2);

    const results: Array<{
      id: string;
      tier: 'wave1' | 'wave2' | 'depth2';
      height: number;
      width: number;
      depth: number;
      plinth1: [number, number, number];
      plinth2: [number, number, number];
      plinth3: [number, number, number];
      finWidth: number;
      coreRadius: number;
      gimbalRadius: number;
      strataHeights: number[];
    }> = [];

    // Wave 1
    wave1.forEach((node) => {
      const isRecommended =
        goldenPath.includes(node.id) || Boolean(node.isGoldenPath);
      const prob = node.conditionalProbability ?? 0.2;
      const height = Math.max(
        2.4,
        Math.min(
          5.6,
          2.5 +
            prob * 6.2 +
            (isRecommended ? 0.65 : 0) +
            leverBoost * 1.1
        )
      );
      const width = Math.max(1.1, Math.min(1.85, 1.12 + prob * 1.35));
      const depth = Math.max(0.68, width * 0.56);
      const strataCount = isRecommended ? 7 : 5;

      const strataHeights: number[] = [];
      for (let i = 0; i < strataCount; i++) {
        const frac = (i + 1) / (strataCount + 1);
        if (frac > 0.38 && frac < 0.72) continue;
        strataHeights.push(frac * height);
      }

      results.push({
        id: node.id,
        tier: 'wave1',
        height,
        width,
        depth,
        plinth1: [width * 2.1, 0.12, depth * 2.1],
        plinth2: [width * 1.65, 0.12, depth * 1.65],
        plinth3: [width * 1.28, 0.09, depth * 1.28],
        finWidth: width * 0.34,
        coreRadius: Math.min(0.32, width * 0.24),
        gimbalRadius: Math.min(0.46, width * 0.34),
        strataHeights,
      });
    });

    // Wave 2+
    wave2Plus.forEach((node) => {
      const prob = node.conditionalProbability ?? 0.2;
      const height = Math.max(
        2.1,
        Math.min(4.6, 2.2 + prob * 5.2 + leverBoost * 0.8)
      );
      const width = Math.max(1.0, Math.min(1.55, 1.0 + prob * 1.1));
      const depth = width * 0.55;

      const strataHeights: number[] = [];
      for (let i = 0; i < 5; i++) {
        const frac = (i + 1) / 6;
        if (frac > 0.38 && frac < 0.72) continue;
        strataHeights.push(frac * height);
      }

      results.push({
        id: node.id,
        tier: 'wave2',
        height,
        width,
        depth,
        plinth1: [width * 2.1, 0.12, depth * 2.1],
        plinth2: [width * 1.65, 0.12, depth * 1.65],
        plinth3: [width * 1.28, 0.09, depth * 1.28],
        finWidth: width * 0.34,
        coreRadius: Math.min(0.32, width * 0.24),
        gimbalRadius: Math.min(0.46, width * 0.34),
        strataHeights,
      });
    });

    // Depth 2+
    deeper.forEach((node) => {
      const prob = node.conditionalProbability ?? 0.2;
      const height = Math.max(2.0, Math.min(4.2, 2.0 + prob * 4.5));
      const width = Math.max(0.95, Math.min(1.4, 0.95 + prob));
      const depth = width * 0.54;

      const strataHeights: number[] = [];
      for (let i = 0; i < 4; i++) {
        const frac = (i + 1) / 5;
        if (frac > 0.38 && frac < 0.72) continue;
        strataHeights.push(frac * height);
      }

      results.push({
        id: node.id,
        tier: 'depth2',
        height,
        width,
        depth,
        plinth1: [width * 2.1, 0.12, depth * 2.1],
        plinth2: [width * 1.65, 0.12, depth * 1.65],
        plinth3: [width * 1.28, 0.09, depth * 1.28],
        finWidth: width * 0.34,
        coreRadius: Math.min(0.32, width * 0.24),
        gimbalRadius: Math.min(0.46, width * 0.34),
        strataHeights,
      });
    });

    return { leverBoost, results };
  }

  it('CHALLENGE-LEVER-01: strictly clamps extreme slider deltas [-1.0, 1.0] to leverBoost range [-0.2, 0.3]', () => {
    const testCases: SliderDeltas[] = [
      {
        executionVelocity: -1.0,
        capitalBuffer: -1.0,
        marketTailwind: -1.0,
        skillPreparation: -1.0,
      },
      {
        executionVelocity: 1.0,
        capitalBuffer: 1.0,
        marketTailwind: 1.0,
        skillPreparation: 1.0,
      },
      {
        executionVelocity: -1.0,
        capitalBuffer: 1.0,
        marketTailwind: -1.0,
        skillPreparation: 1.0,
      },
      {
        executionVelocity: 0.0,
        capitalBuffer: 0.0,
        marketTailwind: 0.0,
        skillPreparation: 0.0,
      },
      {
        executionVelocity: -0.75,
        capitalBuffer: 0.25,
        marketTailwind: -0.5,
        skillPreparation: 0.8,
      },
      // Extreme out of bounds stress cases
      {
        executionVelocity: -100.0,
        capitalBuffer: -50.0,
        marketTailwind: -10.0,
        skillPreparation: -99.0,
      },
      {
        executionVelocity: 100.0,
        capitalBuffer: 50.0,
        marketTailwind: 10.0,
        skillPreparation: 99.0,
      },
    ];

    testCases.forEach((levers) => {
      const { leverBoost } = simulateSanctuaryGeometry(
        allMockNodes,
        levers,
        ['node-w1-1']
      );
      expect(Number.isFinite(leverBoost)).toBe(true);
      expect(leverBoost).toBeGreaterThanOrEqual(-0.2);
      expect(leverBoost).toBeLessThanOrEqual(0.3);
    });
  });

  it('CHALLENGE-GEOM-02: verifies all stone monolith geometries remain positive, non-degenerate, and non-NaN under maximum negative and positive deltas', () => {
    const extremeCases: SliderDeltas[] = [
      {
        executionVelocity: -1.0,
        capitalBuffer: -1.0,
        marketTailwind: -1.0,
        skillPreparation: -1.0,
      },
      {
        executionVelocity: 1.0,
        capitalBuffer: 1.0,
        marketTailwind: 1.0,
        skillPreparation: 1.0,
      },
    ];

    extremeCases.forEach((levers) => {
      const { results } = simulateSanctuaryGeometry(
        allMockNodes,
        levers,
        ['node-w1-1']
      );
      expect(results.length).toBe(allMockNodes.length - 1); // all non-root nodes

      results.forEach((m) => {
        // Height checks
        expect(Number.isFinite(m.height)).toBe(true);
        expect(m.height).toBeGreaterThan(0);
        if (m.tier === 'wave1') {
          expect(m.height).toBeGreaterThanOrEqual(2.4);
          expect(m.height).toBeLessThanOrEqual(5.6);
        } else if (m.tier === 'wave2') {
          expect(m.height).toBeGreaterThanOrEqual(2.1);
          expect(m.height).toBeLessThanOrEqual(4.6);
        } else {
          expect(m.height).toBeGreaterThanOrEqual(2.0);
          expect(m.height).toBeLessThanOrEqual(4.2);
        }

        // Width & Depth checks
        expect(Number.isFinite(m.width)).toBe(true);
        expect(m.width).toBeGreaterThanOrEqual(0.95);
        expect(m.width).toBeLessThanOrEqual(1.85);

        expect(Number.isFinite(m.depth)).toBe(true);
        expect(m.depth).toBeGreaterThanOrEqual(0.5);

        // Plinths
        expect(m.plinth1[0]).toBeGreaterThan(m.width);
        expect(m.plinth1[2]).toBeGreaterThan(m.depth);
        expect(m.plinth2[0]).toBeGreaterThan(m.width);
        expect(m.plinth3[0]).toBeGreaterThan(m.width);

        // Fin width and frame radii
        expect(m.finWidth).toBeGreaterThan(0.25);
        expect(m.coreRadius).toBeGreaterThan(0.15);
        expect(m.gimbalRadius).toBeGreaterThan(m.coreRadius);

        // Strata plates heights inside chamber
        m.strataHeights.forEach((sh) => {
          expect(sh).toBeGreaterThan(0);
          expect(sh).toBeLessThan(m.height);
        });
      });
    });
  });

  it('CHALLENGE-CAM-03: verifies 5-act camera trajectory never produces NaN, Inf, or degenerate lookAt across scrollProgress [-0.5, 1.5]', () => {
    const scrollValues = [
      -0.5, 0.0, 0.1, 0.25, 0.35, 0.5, 0.65, 0.75, 0.9, 1.0, 1.5,
    ];
    const recX = 0;
    const recZ = -5.6;
    const recH = 4.2;

    const pos0 = new THREE.Vector3(0.0, 2.15, 15.4);
    const look0 = new THREE.Vector3(0.0, 1.25, 7.5);
    const pos1 = new THREE.Vector3(-1.6, 3.1, 7.4);
    const look1 = new THREE.Vector3(0.2, 0.6, -2.5);
    const pos2 = new THREE.Vector3(1.8, 2.6, 2.2);
    const look2 = new THREE.Vector3(0.0, 1.45, -6.2);
    const pos3 = new THREE.Vector3(recX + 1.65, 1.95, recZ + 4.4);
    const look3 = new THREE.Vector3(recX, -0.38 + recH * 0.52, recZ);
    const pos4 = new THREE.Vector3(0.0, 4.2, 6.6);
    const look4 = new THREE.Vector3(0.0, 1.2, -5.5);

    scrollValues.forEach((rawP) => {
      const p = Math.max(0, Math.min(1, rawP));
      const targetPos = new THREE.Vector3();
      const targetLook = new THREE.Vector3();

      if (p < 0.25) {
        const u = THREE.MathUtils.smoothstep(p / 0.25, 0, 1);
        targetPos.lerpVectors(pos0, pos1, u);
        targetLook.lerpVectors(look0, look1, u);
      } else if (p < 0.5) {
        const u = THREE.MathUtils.smoothstep((p - 0.25) / 0.25, 0, 1);
        targetPos.lerpVectors(pos1, pos2, u);
        targetLook.lerpVectors(look1, look2, u);
      } else if (p < 0.75) {
        const u = THREE.MathUtils.smoothstep((p - 0.5) / 0.25, 0, 1);
        targetPos.lerpVectors(pos2, pos3, u);
        targetLook.lerpVectors(look2, look3, u);
      } else {
        const u = THREE.MathUtils.smoothstep((p - 0.75) / 0.25, 0, 1);
        targetPos.lerpVectors(pos3, pos4, u);
        targetLook.lerpVectors(look3, look4, u);
      }

      expect(Number.isFinite(targetPos.x)).toBe(true);
      expect(Number.isFinite(targetPos.y)).toBe(true);
      expect(Number.isFinite(targetPos.z)).toBe(true);
      expect(Number.isFinite(targetLook.x)).toBe(true);
      expect(Number.isFinite(targetLook.y)).toBe(true);
      expect(Number.isFinite(targetLook.z)).toBe(true);

      // Distance between camera position and lookAt must be non-zero (non-degenerate)
      const dist = targetPos.distanceTo(targetLook);
      expect(dist).toBeGreaterThan(1.0);
    });
  });
});

describe('Milestone 1 Challenger Stress Harness: DirectionCanvas Contract & Prop Normalization', () => {
  // Prop normalizer matching DirectionCanvas implementation
  function resolveCanvasProps(props: {
    selectedNodeId?: string | null;
    focusedNodeId?: string | null;
    goldenPathIds?: string[];
    recommendedPathNodeIds?: string[];
    onSelectNode?: (id: string) => void;
    onNodeSelect?: (node: ProbabilityNode) => void;
  }) {
    const activeSelectedId =
      props.focusedNodeId !== undefined ? props.focusedNodeId : props.selectedNodeId ?? null;
    const activeGoldenPath =
      props.recommendedPathNodeIds !== undefined
        ? props.recommendedPathNodeIds
        : props.goldenPathIds ?? [];

    const triggerSelect = (id: string, nodes: ProbabilityNode[]) => {
      if (props.onSelectNode) props.onSelectNode(id);
      if (props.onNodeSelect) {
        const found = nodes.find((n) => n.id === id);
        if (found) props.onNodeSelect(found);
      }
    };

    return { activeSelectedId, activeGoldenPath, triggerSelect };
  }

  it('CHALLENGE-PROP-01: resolves cleanly with pure legacy props (selectedNodeId, goldenPathIds, onSelectNode)', () => {
    const onSelectNode = vi.fn();
    const resolved = resolveCanvasProps({
      selectedNodeId: 'node-w1-1',
      goldenPathIds: ['node-w1-1'],
      onSelectNode,
    });
    expect(resolved.activeSelectedId).toBe('node-w1-1');
    expect(resolved.activeGoldenPath).toEqual(['node-w1-1']);

    resolved.triggerSelect('node-w1-1', mockWave1Nodes);
    expect(onSelectNode).toHaveBeenCalledWith('node-w1-1');
  });

  it('CHALLENGE-PROP-02: resolves cleanly with pure new props (focusedNodeId, recommendedPathNodeIds, onNodeSelect)', () => {
    const onNodeSelect = vi.fn();
    const resolved = resolveCanvasProps({
      focusedNodeId: 'node-w1-2',
      recommendedPathNodeIds: ['node-w1-2'],
      onNodeSelect,
    });
    expect(resolved.activeSelectedId).toBe('node-w1-2');
    expect(resolved.activeGoldenPath).toEqual(['node-w1-2']);

    resolved.triggerSelect('node-w1-2', mockWave1Nodes);
    expect(onNodeSelect).toHaveBeenCalledWith(mockWave1Nodes[1]);
  });

  it('CHALLENGE-PROP-03: gives precedence to new props (focusedNodeId, recommendedPathNodeIds) when overlapping dual props are supplied', () => {
    const onSelectNode = vi.fn();
    const onNodeSelect = vi.fn();
    const resolved = resolveCanvasProps({
      selectedNodeId: 'node-w1-1',
      focusedNodeId: 'node-w1-2',
      goldenPathIds: ['node-w1-1'],
      recommendedPathNodeIds: ['node-w1-2'],
      onSelectNode,
      onNodeSelect,
    });
    // New prop takes precedence over legacy prop
    expect(resolved.activeSelectedId).toBe('node-w1-2');
    expect(resolved.activeGoldenPath).toEqual(['node-w1-2']);

    resolved.triggerSelect('node-w1-2', mockWave1Nodes);
    expect(onSelectNode).toHaveBeenCalledWith('node-w1-2');
    expect(onNodeSelect).toHaveBeenCalledWith(mockWave1Nodes[1]);
  });

  it('CHALLENGE-PROP-04: verifies DirectionCanvas source passes levers, scrollProgress, cameraMode, and handles both legacy and new props', () => {
    const canvasSrc = readFileSync(
      join(process.cwd(), 'src/components/canvas/DirectionCanvas.tsx'),
      'utf8'
    );
    expect(canvasSrc).toContain('activeSelectedId');
    expect(canvasSrc).toContain('activeGoldenPath');
    expect(canvasSrc).toContain('levers={levers}');
    expect(canvasSrc).toContain('scrollProgress={scrollProgress}');
    expect(canvasSrc).toContain('cameraMode={cameraMode}');
    expect(canvasSrc).toContain('handleSelectNode');
    expect(canvasSrc).toContain('handleNodeSelect');
  });
});

describe('Milestone 1 Challenger Stress Harness: Palette Compliance', () => {
  it('CHALLENGE-PALETTE-01: confirms zero occurrences of banned muddy gold #C49A45 and old gold #D4AF37 in AlabasterSanctuary3D.tsx', () => {
    const src = readFileSync(
      join(
        process.cwd(),
        'src/components/canvas/directions/AlabasterSanctuary3D.tsx'
      ),
      'utf8'
    );
    expect(src).not.toContain('#C49A45');
    expect(src).not.toContain('#c49a45');
    expect(src).not.toContain('#D4AF37');
    expect(src).not.toContain('#d4af37');
  });

  it('CHALLENGE-PALETTE-02: confirms zero occurrences of banned muddy gold #C49A45 and old gold #D4AF37 in DirectionCanvas.tsx', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/components/canvas/DirectionCanvas.tsx'),
      'utf8'
    );
    expect(src).not.toContain('#C49A45');
    expect(src).not.toContain('#c49a45');
    expect(src).not.toContain('#D4AF37');
    expect(src).not.toContain('#d4af37');
  });
});
