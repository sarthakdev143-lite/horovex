import { describe, it, expect } from 'vitest';
import { DIRECTION_THEMES } from '@/lib/directions/themes';
import { flagshipFounderSaaSPivot } from '@/tests/fixtures/mock-scenarios';
import { solveGoldenPath } from '@/lib/math/bellman';
import { perturbProbabilities } from '@/lib/math/sensitivity';

describe('HOROVEX 3 Art Direction Demos: Themes & Live Engine Integration', () => {
  it('defines all 3 art directions (landscape, instrument, darkroom) with valid palettes and 4 raster plates each', () => {
    expect(DIRECTION_THEMES.landscape).toBeDefined();
    expect(DIRECTION_THEMES.instrument).toBeDefined();
    expect(DIRECTION_THEMES.darkroom).toBeDefined();

    for (const key of ['landscape', 'instrument', 'darkroom'] as const) {
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
      }
    }
  });

  it('connects flagship scenarios to the Bellman solver and 60 FPS sensitivity perturbation used by all 3 demos', () => {
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
});
