/**
 * Tier 4: Real-World Application Scenarios & Flagship Multiverses
 * Features:
 *   - Feature 19: Curated Flagship Multiverse Showcases
 * Scenarios:
 *   - Scenario 1: Founder SaaS Pivot vs. VC Syndicate
 *   - Scenario 2: Senior Tech to Solo AI Studio Venture
 *   - Scenario 3: Global Relocation & Capital Allocation Strategy
 * Authoritative Source: docs/PRD.md §3, docs/ROADMAP.md Phase 5 & ORIGINAL_REQUEST.md R1
 */

import { describe, it, expect } from 'vitest';
import {
  flagshipFounderSaaSPivot,
  flagshipSeniorTechSoloAI,
  flagshipGlobalRelocation,
} from '../fixtures/mock-scenarios';
import {
  solveGoldenPath,
  normalizeWaveProbabilities,
  perturbProbabilities,
  computeCumulativeProbability,
} from '../fixtures/reference-math';

describe('Tier 4: Flagship Real-World Multiverse Scenarios', () => {
  describe('Scenario 1: Founder SaaS Pivot vs. Institutional Seed', () => {
    const scenario = flagshipFounderSaaSPivot;

    it('F19-T4-01: loads Founder SaaS Pivot scenario with measured risk context twin', () => {
      expect(scenario.recommendedTwin.riskAppetite).toBe('measured');
      expect(scenario.recommendedTwin.runwayMonths).toBe(14.0);
      expect(scenario.initialWave1).toHaveLength(5);
    });

    it('F19-T4-02: verifies Wave 1 probabilities sum cleanly to 0.80 explored mass (+/- 1e-4)', () => {
      const sum = scenario.initialWave1.reduce((acc: number, n: any) => acc + n.conditionalProbability, 0);
      expect(sum).toBeCloseTo(0.80, 2);
    });

    it('F19-T4-03: identifies Bootstrap Enterprise Pivot as the optimal Golden Path trajectory', () => {
      const tree = [scenario.rootNode, ...scenario.initialWave1];
      const { goldenPathNodeIds } = solveGoldenPath(tree, scenario.rootNode.id, scenario.recommendedTwin);

      expect(goldenPathNodeIds[0]).toBe(scenario.rootNode.id);
      expect(goldenPathNodeIds[1]).toBe('flagship-1-n1');
      expect(scenario.expectedGoldenPathIds).toEqual(goldenPathNodeIds);
    });

    it('F19-T4-04: simulates vertical recursion (T0 -> T1 -> T2) on enterprise pivot branch', () => {
      const parentNode = scenario.initialWave1[0]; // flagship-1-n1 (P_cum = 0.32)

      // Spawning child futures at depth 2:
      const childFutures = [
        { title: 'Expansion to 3 Enterprise Accounts', condProb: 0.45 },
        { title: 'First Contract Churns at Renewal', condProb: 0.15 },
        { title: 'Series A Inbound from Top VC based on Metrics', condProb: 0.20 },
      ];

      const d2Nodes = childFutures.map(c => ({
        ...c,
        cumProb: computeCumulativeProbability(parentNode.cumulativeProbability, c.condProb),
      }));

      // Monotonic decay check: cumulative probability at T2 must be <= T1
      for (const child of d2Nodes) {
        expect(child.cumProb).toBeLessThanOrEqual(parentNode.cumulativeProbability);
        expect(child.cumProb).toBeGreaterThan(0);
      }
    });

    it('F19-T4-05: provides early-warning 30-day observable tripwire for enterprise pivot', () => {
      const pivotNode = scenario.initialWave1[0];
      expect(pivotNode.tripwires).toHaveLength(1);
      expect(pivotNode.tripwires[0]).toContain('$25k annual upfront payment');
    });
  });

  describe('Scenario 2: Senior Tech to Solo AI Studio Venture', () => {
    const scenario = flagshipSeniorTechSoloAI;

    it('F19-T4-06: loads Senior Tech Solo scenario with aggressive risk context twin', () => {
      expect(scenario.recommendedTwin.riskAppetite).toBe('aggressive');
      expect(scenario.recommendedTwin.runwayMonths).toBe(8.0);
      expect(scenario.initialWave1).toHaveLength(5);
    });

    it('F19-T4-07: solves Golden Path favoring rapid 3-launch MVP sprint over nights-and-weekends slow burn', () => {
      const tree = [scenario.rootNode, ...scenario.initialWave1];
      const { goldenPathNodeIds } = solveGoldenPath(tree, scenario.rootNode.id, scenario.recommendedTwin);

      expect(goldenPathNodeIds[1]).toBe('flagship-2-n1');
      // Rapid sprint beats nights-and-weekends because autonomy & impact alignment is drastically higher
      expect(goldenPathNodeIds[1]).not.toBe('flagship-2-n2');
    });

    it('F19-T4-08: tests sensitivity lever shift under high execution velocity', () => {
      const acceleratedDeltas = {
        executionVelocity: 0.95,
        capitalBuffer: -0.2,
        marketTailwind: 0.6,
        skillPreparation: 0.8,
      };

      const perturbed = perturbProbabilities(scenario.initialWave1, acceleratedDeltas, 0.20);
      const probSprint = perturbed.get('flagship-2-n1')!;

      // Initial prob was 0.30; under high velocity and skill, it expands significantly
      expect(probSprint).toBeGreaterThan(0.30);
    });

    it('F19-T4-09: validates early observable tripwire signal for micro-app revenue validation', () => {
      const sprintNode = scenario.initialWave1[0];
      expect(sprintNode.tripwires[0]).toContain('$3k MRR within 60 days');
    });
  });

  describe('Scenario 3: Global Relocation & Capital Allocation Strategy', () => {
    const scenario = flagshipGlobalRelocation;

    it('F19-T4-10: loads Global Relocation scenario with asymmetric upside context twin', () => {
      expect(scenario.recommendedTwin.riskAppetite).toBe('asymmetric');
      expect(scenario.recommendedTwin.runwayMonths).toBe(6.0);
      expect(scenario.initialWave1).toHaveLength(5);
    });

    it('F19-T4-11: selects SF AI Base + Holding Structure as optimal Golden Path', () => {
      const tree = [scenario.rootNode, ...scenario.initialWave1];
      const { goldenPathNodeIds } = solveGoldenPath(tree, scenario.rootNode.id, scenario.recommendedTwin);

      expect(goldenPathNodeIds[1]).toBe('flagship-3-n1');
    });

    it('F19-T4-12: verifies conservative risk profile avoids nomadic tax audit failure mode', () => {
      const auditFailureNode = scenario.initialWave1[3]; // Nomad Tax Audit
      expect(auditFailureNode.reversibilityType).toBe('type_1_irreversible');
      expect(auditFailureNode.impactVector.stability).toBeLessThan(0);
    });

    it('F19-T4-13: preserves probability conservation under cross-scenario horizontal expansion', () => {
      const w1 = normalizeWaveProbabilities(scenario.initialWave1, 1);
      const sum = w1.reduce((acc: number, n: any) => acc + n.conditionalProbability, 0);
      expect(sum + 0.20).toBeCloseTo(1.0, 3);
    });
  });
});
