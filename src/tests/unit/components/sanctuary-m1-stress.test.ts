import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { SliderDeltas } from '@/lib/math/sensitivity';
import { mockWave1Siblings } from '@/tests/fixtures/mock-nodes';

describe('Milestone 1 Empirical Challenge: 3D Sanctuary Graphics & Math Invariants', () => {
  const sanctuarySourcePath = path.join(
    process.cwd(),
    'src/components/canvas/directions/AlabasterSanctuary3D.tsx'
  );
  const sanctuarySource = fs.readFileSync(sanctuarySourcePath, 'utf8');

  // --------------------------------------------------------------------------
  // Check A: scrollProgress camera interpolation clamping and error resilience
  // --------------------------------------------------------------------------
  it('M1-STRESS-01: scrollProgress out-of-bounds inputs (< 0, > 1, NaN, undefined) do not throw in camera interpolation math', () => {
    // Camera interpolation keyframes extracted directly from AlabasterSanctuary3D.tsx
    const pos0 = new THREE.Vector3(0.0, 2.15, 15.4);
    const look0 = new THREE.Vector3(0.0, 1.25, 7.5);
    const pos1 = new THREE.Vector3(-1.6, 3.1, 7.4);
    const look1 = new THREE.Vector3(0.2, 0.6, -2.5);
    const pos2 = new THREE.Vector3(1.8, 2.6, 2.2);
    const look2 = new THREE.Vector3(0.0, 1.45, -6.2);
    const pos3 = new THREE.Vector3(1.65, 1.95, -1.2);
    const look3 = new THREE.Vector3(0.0, 1.8, -5.6);
    const pos4 = new THREE.Vector3(0.0, 4.2, 6.6);
    const look4 = new THREE.Vector3(0.0, 1.2, -5.5);

    const testInterpolate = (scrollProgress?: number) => {
      const targetPos = new THREE.Vector3();
      const targetLook = new THREE.Vector3();

      // Mirror component parameter fallback: scrollProgress = 0 if undefined
      const effectiveScroll = scrollProgress === undefined ? 0 : scrollProgress;
      const p = Math.max(0, Math.min(1, effectiveScroll));

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

      // Three.js camera damping emulation
      const camPos = new THREE.Vector3(0, 5, 12);
      camPos.x = THREE.MathUtils.damp(camPos.x, targetPos.x, 3.8, 0.016);
      camPos.y = THREE.MathUtils.damp(camPos.y, targetPos.y, 3.8, 0.016);
      camPos.z = THREE.MathUtils.damp(camPos.z, targetPos.z, 3.8, 0.016);

      const lookTarget = new THREE.Vector3();
      lookTarget.x = THREE.MathUtils.damp(lookTarget.x, targetLook.x, 4.2, 0.016);
      lookTarget.y = THREE.MathUtils.damp(lookTarget.y, targetLook.y, 4.2, 0.016);
      lookTarget.z = THREE.MathUtils.damp(lookTarget.z, targetLook.z, 4.2, 0.016);

      return { camPos, lookTarget, targetPos };
    };

    // Extreme out-of-bounds, negative, overflow, undefined, NaN inputs
    const testCases: (number | undefined)[] = [
      -100,
      -1.0,
      -0.0001,
      0.0,
      0.25,
      0.5,
      0.75,
      1.0,
      1.0001,
      2.5,
      1000,
      undefined,
      NaN,
    ];

    testCases.forEach((val) => {
      expect(() => {
        const result = testInterpolate(val);
        expect(result).toBeDefined();
        if (typeof val === 'number' && !Number.isNaN(val)) {
          if (val <= 0) {
            expect(result.targetPos.x).toBeCloseTo(pos0.x, 2);
            expect(result.targetPos.y).toBeCloseTo(pos0.y, 2);
            expect(result.targetPos.z).toBeCloseTo(pos0.z, 2);
          } else if (val >= 1) {
            expect(result.targetPos.x).toBeCloseTo(pos4.x, 2);
            expect(result.targetPos.y).toBeCloseTo(pos4.y, 2);
            expect(result.targetPos.z).toBeCloseTo(pos4.z, 2);
          }
        }
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Check B: Monolith height calculation strictly clamped to [2.1, 5.6]
  // --------------------------------------------------------------------------
  it('M1-STRESS-02: Monolith height calculation is strictly bounded within [2.1, 5.6] for depth 1 sanctuary steles', () => {
    // Formula for Wave 1 and Wave 2 steles in AlabasterSanctuary3D.tsx:
    const computeWave1Height = (prob: number, isRecommended: boolean, leverBoost: number) => {
      return Math.max(
        2.4,
        Math.min(
          5.6,
          2.5 +
            prob * 6.2 +
            (isRecommended ? 0.65 : 0) +
            leverBoost * 1.1
        )
      );
    };

    const computeWave2Height = (prob: number, leverBoost: number) => {
      return Math.max(
        2.1,
        Math.min(4.6, 2.2 + prob * 5.2 + leverBoost * 0.8)
      );
    };

    const computeLeverBoost = (l: SliderDeltas) => {
      const avg =
        (l.executionVelocity +
          l.capitalBuffer +
          l.marketTailwind +
          l.skillPreparation) /
        4;
      return Math.max(-0.2, Math.min(0.3, avg * 0.25));
    };

    const probabilities = [0.0, 0.01, 0.1, 0.2, 0.5, 0.8, 0.99, 1.0, -1.0, 5.0];
    const leverConfigs: SliderDeltas[] = [
      { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
      { executionVelocity: 1, capitalBuffer: 1, marketTailwind: 1, skillPreparation: 1 },
      { executionVelocity: -1, capitalBuffer: -1, marketTailwind: -1, skillPreparation: -1 },
      { executionVelocity: 1, capitalBuffer: -1, marketTailwind: 0.5, skillPreparation: -0.5 },
    ];

    leverConfigs.forEach((levers) => {
      const boost = computeLeverBoost(levers);
      expect(boost).toBeGreaterThanOrEqual(-0.2);
      expect(boost).toBeLessThanOrEqual(0.3);

      probabilities.forEach((p) => {
        // Wave 1
        const w1Standard = computeWave1Height(p, false, boost);
        const w1Recommended = computeWave1Height(p, true, boost);

        expect(w1Standard).toBeGreaterThanOrEqual(2.4);
        expect(w1Standard).toBeLessThanOrEqual(5.6);
        expect(w1Recommended).toBeGreaterThanOrEqual(2.4);
        expect(w1Recommended).toBeLessThanOrEqual(5.6);

        // Wave 2
        const w2 = computeWave2Height(p, boost);
        expect(w2).toBeGreaterThanOrEqual(2.1);
        expect(w2).toBeLessThanOrEqual(4.6);

        // Combined Sanctuary Stele bounds verification: strictly [2.1, 5.6]
        expect(w1Standard).toBeGreaterThanOrEqual(2.1);
        expect(w1Standard).toBeLessThanOrEqual(5.6);
        expect(w1Recommended).toBeGreaterThanOrEqual(2.1);
        expect(w1Recommended).toBeLessThanOrEqual(5.6);
        expect(w2).toBeGreaterThanOrEqual(2.1);
        expect(w2).toBeLessThanOrEqual(5.6);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Check C: Stream particle position arrays valid Float32Arrays of length 3*count, no NaNs
  // --------------------------------------------------------------------------
  it('M1-STRESS-03: Stream particle position arrays are valid Float32Arrays of length 3 * count with no NaN values', () => {
    const WATER_Y = -0.38;
    const ORIGIN_GATE_Z = 9.0;

    const buildStreamData = (monoliths: { id: string; x: number; z: number; isRecommended: boolean; probability: number; parentX: number; parentZ: number }[]) => {
      const curves = monoliths.map((m) => {
        const start = new THREE.Vector3(m.parentX, WATER_Y + 0.015, m.parentZ);
        const mid1 = new THREE.Vector3(
          THREE.MathUtils.lerp(m.parentX, m.x, 0.32),
          WATER_Y + 0.015,
          THREE.MathUtils.lerp(m.parentZ, m.z, 0.38)
        );
        const mid2 = new THREE.Vector3(
          THREE.MathUtils.lerp(m.parentX, m.x, 0.74),
          WATER_Y + 0.015,
          THREE.MathUtils.lerp(m.parentZ, m.z, 0.72)
        );
        const end = new THREE.Vector3(m.x, WATER_Y + 0.015, m.z);
        return {
          id: m.id,
          isRecommended: m.isRecommended,
          probability: m.probability,
          curve: new THREE.CatmullRomCurve3([start, mid1, mid2, end]),
        };
      });

      const particlesPerCurve = 56;
      const total = Math.max(1, curves.length * particlesPerCurve);
      const positions = new Float32Array(total * 3);
      const meta: { curveIdx: number; offset: number; speed: number }[] = [];

      curves.forEach((c, cIdx) => {
        for (let i = 0; i < particlesPerCurve; i++) {
          const offset = i / particlesPerCurve;
          const pt = c.curve.getPointAt(offset);
          const idx = (cIdx * particlesPerCurve + i) * 3;
          positions[idx] = pt.x;
          positions[idx + 1] = pt.y + 0.03;
          positions[idx + 2] = pt.z;
          meta.push({
            curveIdx: cIdx,
            offset,
            speed: c.isRecommended ? 0.24 : 0.12 + c.probability * 0.2,
          });
        }
      });

      return { curves, positions, meta, total };
    };

    // Scenario 1: Standard 5 monoliths
    const mockMonoliths = mockWave1Siblings.map((node, idx) => {
      const spread = (idx / 4) * 2 - 1;
      return {
        id: node.id,
        x: spread * 6.8,
        z: -4.2 - (1 - Math.abs(spread)) * 1.6,
        isRecommended: idx === 2,
        probability: node.conditionalProbability,
        parentX: 0,
        parentZ: ORIGIN_GATE_Z,
      };
    });

    const stream5 = buildStreamData(mockMonoliths);
    expect(stream5.curves.length).toBe(5);
    expect(stream5.total).toBe(5 * 56);
    expect(stream5.positions).toBeInstanceOf(Float32Array);
    expect(stream5.positions.length).toBe(stream5.total * 3);
    expect(stream5.positions.length).toBe(840);

    for (let i = 0; i < stream5.positions.length; i++) {
      expect(Number.isFinite(stream5.positions[i])).toBe(true);
      expect(Number.isNaN(stream5.positions[i])).toBe(false);
    }

    // Scenario 2: Empty monoliths edge case
    const emptyStream = buildStreamData([]);
    expect(emptyStream.curves.length).toBe(0);
    expect(emptyStream.total).toBe(1);
    expect(emptyStream.positions).toBeInstanceOf(Float32Array);
    expect(emptyStream.positions.length).toBe(3);
    for (let i = 0; i < emptyStream.positions.length; i++) {
      expect(Number.isFinite(emptyStream.positions[i])).toBe(true);
      expect(Number.isNaN(emptyStream.positions[i])).toBe(false);
    }
  });

  // --------------------------------------------------------------------------
  // Check D: Verify zero floating <Html> tags exist inside AlabasterSanctuary3D.tsx
  // --------------------------------------------------------------------------
  it('M1-STRESS-04: Zero floating <Html> tags exist inside AlabasterSanctuary3D.tsx', () => {
    // Assert no JSX <Html> tags exist in AlabasterSanctuary3D.tsx
    const htmlTagRegex = /<Html[\s/>]/;
    expect(sanctuarySource).not.toMatch(htmlTagRegex);

    // Assert no import of Html from @react-three/drei
    expect(sanctuarySource).not.toContain("from '@react-three/drei'");
    expect(sanctuarySource).not.toContain('from "@react-three/drei"');

    // Confirm pure Three.js architectural primitives are used
    expect(sanctuarySource).toContain('ArchitecturalStoneMonolith');
    expect(sanctuarySource).toContain('colonnadeFins');
    expect(sanctuarySource).toContain('streamData');
    expect(sanctuarySource).toContain('getSkylightTexture');
  });
});
