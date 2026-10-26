import { NextResponse } from 'next/server';
import { ProbabilityNode, SpatialCoordinates } from '@/lib/types/multiverse';
import { computeConicalPositions } from '@/lib/math/spatial-layout';
import { computeCumulativeProbability, normalizeWaveProbabilities } from '@/lib/math/bayesian';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      simulationId = 'sim-active',
      parentId = null,
      depth = 1,
      waveNumber = 1,
      userInterventionPrompt,
      parentSpatialPosition = { x: 0, y: 0, z: 0 },
      parentCumProb = 1.0,
    } = body;

    const isHorizontalExpansion = waveNumber > 1;
    const isVertical = depth > 1;
    const count = 5;

    const confidenceProfile = [0.4, 0.3, 0.15, 0.1, 0.05];
    const sensitivityProfiles = [
      { executionVelocity: 0.45, capitalBuffer: 0.15, marketTailwind: 0.3, skillPreparation: 0.25 },
      { executionVelocity: 0.3, capitalBuffer: -0.25, marketTailwind: 0.45, skillPreparation: 0.15 },
      { executionVelocity: 0.1, capitalBuffer: 0.45, marketTailwind: 0.15, skillPreparation: 0.2 },
      { executionVelocity: -0.15, capitalBuffer: 0.3, marketTailwind: -0.1, skillPreparation: 0.35 },
      { executionVelocity: -0.4, capitalBuffer: -0.35, marketTailwind: -0.25, skillPreparation: -0.2 },
    ];

    // Create raw candidates
    const rawNodes: ProbabilityNode[] = Array.from({ length: count }, (_, idx) => {
      const siblingIndex = (waveNumber - 1) * 5 + idx + 1;
      const parentPath = parentId ? `root.n${depth}_${siblingIndex}` : 'root';
      const regimeTier =
        waveNumber === 1
          ? 'baseline_wave_1'
          : waveNumber === 2
          ? 'contrarian_wave_2'
          : 'tail_risk_wave_3_plus';

      const title = isVertical
        ? `Depth ${depth} Trajectory ${siblingIndex}`
        : isHorizontalExpansion
        ? `Wave ${waveNumber} Possibility ${siblingIndex}`
        : `Baseline Trajectory ${siblingIndex}`;

      return {
        id: `api-node-d${depth}-w${waveNumber}-s${siblingIndex}`,
        simulationId,
        parentId,
        treePath: parentPath,
        depth,
        waveNumber,
        siblingIndex,
        regimeTier,
        title,
        narrativeSummary: `Simulated probabilistic trajectory for ${title}`,
        timeHorizon: `${3 * depth}-${6 * depth} Months`,
        conditionalProbability: confidenceProfile[idx] ?? 0.16,
        cumulativeProbability: confidenceProfile[idx] ?? 0.16,
        rawLlmConfidence: confidenceProfile[idx] ?? 0.2,
        unexploredChildMass: 0.2,
        causalDrivers: ['Market velocity', 'Capital runway', 'Execution efficiency'],
        reversibilityType: idx % 2 === 0 ? 'type_2_reversible' : 'type_1_irreversible',
        reversibilityScore: Number((8.2 - idx * 0.9).toFixed(1)),
        regretMinimizationScore: Number((8.5 - idx * 0.8).toFixed(1)),
        impactVector: {
          wealth: Number((7.5 - idx * 0.8).toFixed(1)),
          autonomy: Number((8.0 - idx * 0.9).toFixed(1)),
          mastery: Number((7.2 - idx * 0.4).toFixed(1)),
          stability: Number((7.8 - idx * 1.1).toFixed(1)),
          impact: Number((7.4 - idx * 0.6).toFixed(1)),
          peace: Number((7.6 - idx * 1.0).toFixed(1)),
        },
        expectedUtilityScore: Number((8.2 - idx * 0.6).toFixed(1)),
        isGoldenPath: siblingIndex === 1,
        status: 'active',
        userInterventionPrompt,
        spatialPosition: { x: 0, y: 0, z: 0 },
        sensitivityWeights: sensitivityProfiles[idx] ?? sensitivityProfiles[0],
        tripwires: [`Milestone checkpoint ${siblingIndex} reached within 60 days`],
        createdAt: new Date().toISOString(),
      };
    });

    // 1. Normalize probabilities to conserve Bayesian mass (Wave 1 = 0.80, Wave 2 delta = 0.13, Wave 3 delta = 0.042)
    const normalizedBase = normalizeWaveProbabilities(rawNodes, waveNumber);
    const waveScale =
      waveNumber === 1
        ? 1.0
        : waveNumber === 2
        ? 0.13 / 0.93
        : 0.042 / 0.972;

    const normalizedNodes = normalizedBase.map((n, idx) => ({
      ...n,
      siblingIndex: (waveNumber - 1) * 5 + idx + 1,
      conditionalProbability: Number((n.conditionalProbability * waveScale).toFixed(4)),
    }));

    // 2. Compute cumulative probabilities along path
    const nodesWithCum = normalizedNodes.map((n) => ({
      ...n,
      cumulativeProbability: computeCumulativeProbability(parentCumProb, n.conditionalProbability),
    }));

    // 3. Compute 3D Conical Coordinates with 15-iteration force relaxation (d_min >= 3.2)
    const dummyParent = parentId
      ? ({ spatialPosition: parentSpatialPosition } as ProbabilityNode)
      : null;

    const spatialMap = computeConicalPositions(dummyParent, nodesWithCum, waveNumber);

    const finalNodes = nodesWithCum.map((n) => ({
      ...n,
      spatialPosition: spatialMap.get(n.id) || { x: 0, y: 0, z: -14 * depth },
    }));

    const streamChunks = finalNodes.map((n) => JSON.stringify(n));

    return new NextResponse(
      JSON.stringify({
        status: 200,
        nodes: finalNodes,
        streamChunks,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-NDJSON-Available': 'true',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
