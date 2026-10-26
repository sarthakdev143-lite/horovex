import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DIRECTION_THEMES } from '@/lib/directions/themes';
import { flagshipFounderSaaSPivot } from '@/tests/fixtures/mock-scenarios';
import { solveGoldenPath } from '@/lib/math/bellman';
import { computeWaveMass } from '@/lib/math/bayesian';
import { perturbProbabilities, SliderDeltas } from '@/lib/math/sensitivity';
import { generateDeterministicWave } from '@/lib/ai/adapter';

describe('HOROVEX Signature Alabaster Sanctuary & Art Direction Demos: Themes & Live Engine Integration', () => {
  it('defines signature sanctuary and all 3 secondary art directions (sanctuary, landscape, instrument, darkroom) with valid palettes and 4 raster plates on disk each', () => {
    expect(DIRECTION_THEMES.sanctuary).toBeDefined();
    expect(DIRECTION_THEMES.landscape).toBeDefined();
    expect(DIRECTION_THEMES.instrument).toBeDefined();
    expect(DIRECTION_THEMES.darkroom).toBeDefined();

    for (const key of ['sanctuary', 'landscape', 'instrument', 'darkroom'] as const) {
      const theme = DIRECTION_THEMES[key];
      expect(theme.ground).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.surface).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.ink).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.plates).toHaveLength(4);
      for (const plate of theme.plates) {
        expect(plate.src).toMatch(/^\/assets\/.*\.png$/);
        expect(plate.title.length).toBeGreaterThan(3);
        expect(plate.caption.length).toBeGreaterThan(20);
        const absPath = join(process.cwd(), 'public', plate.src);
        expect(existsSync(absPath)).toBe(true);
        expect(statSync(absPath).size).toBeGreaterThan(10000);
      }
    }

    expect(DIRECTION_THEMES.sanctuary.plates.map((p) => p.src)).toEqual([
      '/assets/alabaster-sanctuary.png',
      '/assets/alabaster-watershed.png',
      '/assets/alabaster-monolith.png',
      '/assets/alabaster-horizon.png',
    ]);
  });

  it('connects flagship scenarios to the Bellman solver and 60 FPS sensitivity perturbation used by the sanctuary', () => {
    const scenario = flagshipFounderSaaSPivot;
    const allNodes = [scenario.rootNode, ...scenario.initialWave1];

    const { goldenPathNodeIds } = solveGoldenPath(
      allNodes,
      scenario.rootNode.id,
      scenario.recommendedTwin
    );
    expect(goldenPathNodeIds).toContain(scenario.rootNode.id);
    expect(goldenPathNodeIds.length).toBeGreaterThan(1);

    const perturbed = perturbProbabilities(
      scenario.initialWave1,
      {
        executionVelocity: 0.5,
        capitalBuffer: 0.25,
        marketTailwind: 0,
        skillPreparation: 0,
      },
      0.2
    );

    let sumCond = 0;
    for (const child of scenario.initialWave1) {
      const p = perturbed.get(child.id);
      expect(p).toBeDefined();
      sumCond += p || 0;
    }
    expect(sumCond).toBeCloseTo(0.8, 3);
  });

  it('prevents cumulative slider drift and conserves per-parent mass across Depth 1 and Depth 2 branches', () => {
    const scenario = flagshipFounderSaaSPivot;
    const depth1 = scenario.initialWave1.map((n) => ({ ...n }));
    const baselineMap = new Map(depth1.map((n) => [n.id, n.conditionalProbability]));
    const depth2 = generateDeterministicWave(
      depth1[0].title,
      1,
      2,
      depth1[0].id,
      depth1[0].cumulativeProbability
    );

    const levers: SliderDeltas = {
      executionVelocity: 0.6,
      capitalBuffer: -0.3,
      marketTailwind: 0.4,
      skillPreparation: 0.2,
    };

    const pass1 = perturbProbabilities(
      depth1.map((n) => ({ ...n, conditionalProbability: baselineMap.get(n.id)! })),
      levers,
      0.2
    );
    const pass2 = perturbProbabilities(
      depth1.map((n) => ({ ...n, conditionalProbability: baselineMap.get(n.id)! })),
      levers,
      0.2
    );

    for (const n of depth1) {
      expect(pass1.get(n.id)).toBe(pass2.get(n.id));
    }

    const d2Perturbed = perturbProbabilities(depth2, levers, 0.2);
    const d1Sum = Array.from(pass1.values()).reduce((a, b) => a + b, 0);
    const d2Sum = Array.from(d2Perturbed.values()).reduce((a, b) => a + b, 0);
    expect(d1Sum).toBeCloseTo(0.8, 3);
    expect(d2Sum).toBeCloseTo(0.8, 3);
  });

  it('allocates Wave 2 reserve mass and re-solves the recommended path when expanding +5 more futures', () => {
    const scenario = flagshipFounderSaaSPivot;
    const { deltaMass, remainingUnexplored } = computeWaveMass(2);
    expect(deltaMass).toBeCloseTo(0.13, 4);
    expect(remainingUnexplored).toBeCloseTo(0.07, 4);

    const wave2 = generateDeterministicWave(
      scenario.rootNode.title,
      2,
      1,
      scenario.rootNode.id,
      1.0
    );
    const allNodes = [scenario.rootNode, ...scenario.initialWave1, ...wave2];
    const { goldenPathNodeIds } = solveGoldenPath(
      allNodes,
      scenario.rootNode.id,
      scenario.recommendedTwin
    );
    expect(goldenPathNodeIds).toContain(scenario.rootNode.id);
    expect(goldenPathNodeIds.length).toBe(2);
  });

  it('locks in the Sanctuary identity without theme switchers and enforces the 3-step UX and sculpted parabolic 3D arches', () => {
    const landingSrc = readFileSync(
      join(process.cwd(), 'src/components/directions/ArtDirectionDemo.tsx'),
      'utf8'
    );
    const obsSrc = readFileSync(
      join(process.cwd(), 'src/app/observatory/page.tsx'),
      'utf8'
    );
    const sanctuary3DSrc = readFileSync(
      join(
        process.cwd(),
        'src/components/canvas/directions/AlabasterSanctuary3D.tsx'
      ),
      'utf8'
    );

    // No theme switcher buttons on / or /observatory
    expect(landingSrc).not.toContain('switch-direction-');
    expect(obsSrc).not.toContain('Landscape 3D');
    expect(obsSrc).not.toContain('Instrument 3D');
    expect(obsSrc).not.toContain('Dark Room 3D');
    expect(obsSrc).toContain('3D Sanctuary');
    expect(obsSrc).toContain('Compare in Table');

    // 3-step left-column structure & required testids on /
    expect(landingSrc).toContain('id="step-decision"');
    expect(landingSrc).toContain('id="step-futures"');
    expect(landingSrc).toContain('id="step-mentor"');
    expect(landingSrc).toContain('data-testid="simulate-btn"');
    expect(landingSrc).toContain('data-testid="recurse-deeper-btn"');
    expect(landingSrc).toContain('data-testid="expand-wave-btn"');

    // Sculpted parabolic/catenary marble arches, 3-ring kinetic astrolabes, particle streams & colonnade
    expect(sanctuary3DSrc).toContain('createParabolicArchCurve');
    expect(sanctuary3DSrc).toContain('new THREE.TubeGeometry');
    expect(sanctuary3DSrc).toContain('STREAM_PARTICLE_COUNT');
    expect(sanctuary3DSrc).toContain('MOTE_PARTICLE_COUNT');
    expect(sanctuary3DSrc).toContain('perimeterColonnade');
    expect(sanctuary3DSrc).not.toContain('<boxGeometry');
  });
});

