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
        conditionalProbability: 0.16,
        cumulativeProbability: 0.16,
        rawLlmConfidence: 0.65 + idx * 0.05,
        unexploredChildMass: 0.20,
        causalDrivers: ['Market velocity', 'Capital runway', 'Execution efficiency'],
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
          executionVelocity: 0.3,
          capitalBuffer: 0.2,
          marketTailwind: 0.25,
          skillPreparation: 0.25,
        },
        tripwires: [`Milestone checkpoint ${siblingIndex} reached within 60 days`],
        createdAt: new Date().toISOString(),
      };
    });

    // 1. Normalize probabilities to conserve Bayesian mass
    const normalizedNodes = normalizeWaveProbabilities(rawNodes, waveNumber);

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
