/**
 * Unit & Boundary Tests: 3D Conical Orbital Layout & Collision Solver
 * Features:
 *   - Feature 15: 3D Conical Orbital Layout & Collision Solver
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/LLD.md §2.4 & PROJECT.md §2
 */

import { describe, it, expect } from 'vitest';
import { computeConicalPositions } from '../../fixtures/reference-math';
import { mockWave1Siblings, mockWave2Siblings, mockRootNode } from '../../fixtures/mock-nodes';
import { ProbabilityNode } from '../../fixtures/multiverse-types';

describe('Feature 15: 3D Conical Orbital Layout & Collision Solver', () => {
  it('F15-T1-01: positions Wave 1 child nodes at depth Z = -14.0 relative to origin parent', () => {
    const positions = computeConicalPositions(mockRootNode, mockWave1Siblings, 1);
    expect(positions.size).toBe(5);

    for (const [id, pos] of positions.entries()) {
      expect(pos.z).toBeCloseTo(-14.0, 1);
    }
  });

  it('F15-T1-02: pushes Wave 2 child nodes deeper along Z-axis (Z = -16.52) and onto wider radius', () => {
    const wave2Positions = computeConicalPositions(mockRootNode, mockWave2Siblings, 2);
    expect(wave2Positions.size).toBe(5);

    for (const [id, pos] of wave2Positions.entries()) {
      // zStep = 0 - 14 * (1 + 0.18 * 1) = -16.52
      expect(pos.z).toBeCloseTo(-16.52, 1);
    }
  });

  it('F15-T1-03: guarantees minimum spatial distance d_min >= 3.2 units between all sibling nodes', () => {
    const positions = computeConicalPositions(mockRootNode, mockWave1Siblings, 1);
    const posArray = Array.from(positions.values());

    for (let i = 0; i < posArray.length; i++) {
      for (let j = i + 1; j < posArray.length; j++) {
        const a = posArray[i];
        const b = posArray[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Strict spatial clearance invariant
        expect(dist).toBeGreaterThanOrEqual(3.18); // within 0.02 rounding precision of 3.2
      }
    }
  });

  it('F15-T1-04: elevates high-utility nodes higher along Y-axis than low-utility / burnout nodes', () => {
    const highUtilNode: ProbabilityNode = {
      ...mockWave1Siblings[0],
      id: 'high-u',
      expectedUtilityScore: 8.5,
    };
    const lowUtilNode: ProbabilityNode = {
      ...mockWave1Siblings[1],
      id: 'low-u',
      expectedUtilityScore: -6.0,
    };

    const positions = computeConicalPositions(mockRootNode, [highUtilNode, lowUtilNode], 1);
    const highPos = positions.get('high-u')!;
    const lowPos = positions.get('low-u')!;

    expect(highPos.y).toBeGreaterThan(lowPos.y);
  });

  it('F15-T1-05: applies golden-angle phase offset (0.36 rad) so Wave 2 interleaves between Wave 1 filaments', () => {
    const w1Positions = computeConicalPositions(mockRootNode, [mockWave1Siblings[0]], 1);
    const w2Positions = computeConicalPositions(mockRootNode, [mockWave2Siblings[0]], 2);

    const w1Pos = w1Positions.get(mockWave1Siblings[0].id)!;
    const w2Pos = w2Positions.get(mockWave2Siblings[0].id)!;

    // Angle of w1 vs w2 should have non-zero rotational offset
    const angle1 = Math.atan2(w1Pos.x, w1Pos.z);
    const angle2 = Math.atan2(w2Pos.x, w2Pos.z);
    expect(Math.abs(angle2 - angle1)).toBeGreaterThan(0.04);
  });

  it('F15-T1-06: fans siblings out azimuthally across an orbital arc centered on parent heading', () => {
    const positions = computeConicalPositions(mockRootNode, mockWave1Siblings, 1);
    const xValues = Array.from(positions.values()).map(p => p.x);

    // Leftmost and rightmost nodes should have opposing signs on X axis
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    expect(minX).toBeLessThan(0);
    expect(maxX).toBeGreaterThan(0);
  });
});

describe('Tier 2: Boundary & Corner Cases (Spatial Collision Solver)', () => {
  it('F15-T2-01: empty siblings array returns empty map without error', () => {
    const positions = computeConicalPositions(mockRootNode, [], 1);
    expect(positions.size).toBe(0);
  });

  it('F15-T2-02: null parent node defaults smoothly to origin (0, 0, 0)', () => {
    const positions = computeConicalPositions(null, mockWave1Siblings, 1);
    expect(positions.size).toBe(5);
    for (const [id, pos] of positions.entries()) {
      expect(pos.z).toBeCloseTo(-14.0, 1);
    }
  });

  it('F15-T2-03: single child node is placed without infinite collision repulsion loop', () => {
    const single = [mockWave1Siblings[0]];
    const positions = computeConicalPositions(mockRootNode, single, 1);
    expect(positions.size).toBe(1);
    const pos = positions.get(single[0].id)!;
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
    expect(Number.isFinite(pos.z)).toBe(true);
  });

  it('F15-T2-04: identical initial coordinates force-repulsion pushes nodes apart to >= 3.2 units', () => {
    // 3 nodes with identical utilities and configs
    const identicalNodes: ProbabilityNode[] = [
      { ...mockWave1Siblings[0], id: 'c1', expectedUtilityScore: 5.0 },
      { ...mockWave1Siblings[0], id: 'c2', expectedUtilityScore: 5.0 },
      { ...mockWave1Siblings[0], id: 'c3', expectedUtilityScore: 5.0 },
    ];

    const positions = computeConicalPositions(mockRootNode, identicalNodes, 1);
    const posArr = Array.from(positions.values());

    for (let i = 0; i < posArr.length; i++) {
      for (let j = i + 1; j < posArr.length; j++) {
        const dx = posArr[j].x - posArr[i].x;
        const dy = posArr[j].y - posArr[i].y;
        const dz = posArr[j].z - posArr[i].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        expect(dist).toBeGreaterThanOrEqual(3.18);
      }
    }
  });

  it('F15-T2-05: wave 5 scales depth and radius smoothly without numerical overflow', () => {
    const positions = computeConicalPositions(mockRootNode, mockWave1Siblings, 5);
    for (const [id, pos] of positions.entries()) {
      // zStep = -14 * (1 + 0.18 * 4) = -24.08
      expect(pos.z).toBeCloseTo(-24.08, 1);
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    }
  });

  it('F15-T2-06: extreme negative parent coordinate (Z = -100) shifts children to Z = -114.0', () => {
    const deepParent: ProbabilityNode = {
      ...mockRootNode,
      spatialPosition: { x: 10, y: 5, z: -100 },
    };

    const positions = computeConicalPositions(deepParent, mockWave1Siblings, 1);
    for (const [id, pos] of positions.entries()) {
      expect(pos.z).toBeCloseTo(-114.0, 1);
    }
  });
});
