/**
 * Unified Multi-Provider AI Adapter & Deterministic Simulation Fallback Engine
 * Authoritative Source: docs/HLD.md §3.1, docs/LLD.md §5 & ORIGINAL_REQUEST.md R4
 */

import { ProbabilityNode } from '../types/multiverse';
import { normalizeWaveProbabilities, computeCumulativeProbability } from '../math/bayesian';
import { computeConicalPositions } from '../math/spatial-layout';

export interface AIProviderConfig {
  openaiApiKey?: string;
  geminiApiKey?: string;
  anthropicApiKey?: string;
  fallbackEnabled: boolean;
}

export type ProviderType = 'openai' | 'gemini' | 'anthropic' | 'deterministic_fallback';

export function resolveAIProvider(config: AIProviderConfig): ProviderType {
  if (config.openaiApiKey && config.openaiApiKey.startsWith('sk-')) {
    return 'openai';
  }
  if (config.geminiApiKey && config.geminiApiKey.length > 10) {
    return 'gemini';
  }
  if (config.anthropicApiKey && config.anthropicApiKey.startsWith('sk-ant-')) {
    return 'anthropic';
  }
  if (config.fallbackEnabled) {
    return 'deterministic_fallback';
  }
  throw new Error('No valid AI provider configured and fallback is disabled');
}

export function generateDeterministicWave(
  situation: string,
  waveNumber: number,
  depth: number,
  parentId: string | null = null,
  parentCumProb: number = 1.0,
  userInterventionPrompt?: string
): ProbabilityNode[] {
  const isContrarian = waveNumber === 2;
  const isTailRisk = waveNumber >= 3;
  const prefix = isTailRisk ? 'Tail-Risk' : isContrarian ? 'Contrarian' : 'Baseline';

  const rawNodes: ProbabilityNode[] = Array.from({ length: 5 }, (_, idx) => {
    const siblingIndex = (waveNumber - 1) * 5 + idx + 1;
    const parentPath = parentId ? `root.n${depth}_${siblingIndex}` : 'root';
    const regimeTier =
      waveNumber === 1
        ? 'baseline_wave_1'
        : waveNumber === 2
        ? 'contrarian_wave_2'
        : 'tail_risk_wave_3_plus';

    const title =
      depth > 1
        ? `Depth ${depth} Trajectory ${siblingIndex}: ${situation.slice(0, 25)}...`
        : `${prefix} Trajectory ${siblingIndex}: ${situation.slice(0, 25)}...`;

    return {
      id: `fallback-d${depth}-w${waveNumber}-n${siblingIndex}`,
      simulationId: 'sim-deterministic',
      parentId,
      treePath: parentPath,
      depth,
      waveNumber,
      siblingIndex,
      regimeTier,
      title,
      summaryHeadline: `Plausible ${prefix.toLowerCase()} projection at depth ${depth}`,
      narrativeSummary: `Context-aware deterministic simulation projection for: ${situation}`,
      timeHorizon: `${3 * depth}-${6 * depth} Months`,
      conditionalProbability: 0.16,
      cumulativeProbability: 0.16,
      rawLlmConfidence: Number((0.85 - idx * 0.12).toFixed(2)),
      unexploredChildMass: 0.20,
      causalDrivers: ['Market adoption rate', 'Execution velocity', 'Capital buffer'],
      reversibilityType: idx % 2 === 0 ? 'type_2_reversible' : 'type_1_irreversible',
      reversibilityScore: 5.0 + idx * 0.7,
      regretMinimizationScore: 6.0 + idx * 0.5,
      impactVector: {
        wealth: 4.0 + idx * 1.0,
        autonomy: 5.0 - idx * 0.5,
        mastery: 6.0 + idx * 0.5,
        stability: 7.0 - idx * 0.8,
        impact: 5.5 + idx * 0.6,
        peace: 6.0 - idx * 0.4,
      },
      expectedUtilityScore: 6.5 + idx * 0.4,
      isGoldenPath: siblingIndex === 1,
      status: 'active',
      userInterventionPrompt,
      spatialPosition: { x: 0, y: 0, z: 0 },
      sensitivityWeights: {
        executionVelocity: 0.35,
        capitalBuffer: 0.25,
        marketTailwind: 0.2,
        skillPreparation: 0.2,
      },
      tripwires: [`Checkpoint milestone ${siblingIndex} verified in 60 days`],
      createdAt: new Date().toISOString(),
    };
  });

  const normalized = normalizeWaveProbabilities(rawNodes, waveNumber);
  const withCum = normalized.map((n) => ({
    ...n,
    cumulativeProbability: computeCumulativeProbability(parentCumProb, n.conditionalProbability),
  }));

  const parentPos = parentId ? { x: 0, y: 0, z: -14 * (depth - 1) } : { x: 0, y: 0, z: 0 };
  const dummyParent = parentId ? ({ spatialPosition: parentPos } as ProbabilityNode) : null;
  const spatialMap = computeConicalPositions(dummyParent, withCum, waveNumber);

  return withCum.map((n) => ({
    ...n,
    spatialPosition: spatialMap.get(n.id) || { x: 0, y: 0, z: -14 * depth },
  }));
}
