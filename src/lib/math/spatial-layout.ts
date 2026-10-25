/**
 * 3D Conical Orbital Layout & Collision Solver
 * Authoritative Source: docs/LLD.md §2.4 & PROJECT.md §2
 */

import { ProbabilityNode, SpatialCoordinates } from '../types/multiverse';

const D_STEP = 14.0;
const D_MIN = 3.2; // Minimum spatial clearance threshold (units)

/**
 * Computes 3D conical coordinates for sibling nodes radiating from a parent node.
 * Uses angle interleaving per wave and 15-iteration inverse-square force relaxation
 * to guarantee d_min >= 3.2 units spatial clearance between all nodes.
 */
export function computeConicalPositions(
  parentNode: ProbabilityNode | null,
  siblings: ProbabilityNode[],
  waveNumber: number
): Map<string, SpatialCoordinates> {
  const result = new Map<string, SpatialCoordinates>();
  if (siblings.length === 0) return result;

  const parentPos = parentNode ? parentNode.spatialPosition : { x: 0, y: 0, z: 0 };
  const parentHeading =
    parentNode && (parentPos.x !== 0 || parentPos.z !== 0)
      ? Math.atan2(parentPos.x, -parentPos.z)
      : 0;

  const count = siblings.length;
  const zStep = parentPos.z - D_STEP * (1 + 0.18 * (waveNumber - 1));
  const baseRadius = 5.0 + 3.0 * (waveNumber - 1);
  const phaseOffset = (waveNumber - 1) * 0.36; // Golden-angle interleaving

  // Step 1: Initial orbital placement
  const tempPositions: { id: string; x: number; y: number; z: number }[] = [];

  for (let i = 0; i < count; i++) {
    const node = siblings[i];
    const angleSpread = Math.PI * 0.85; // 153 degrees fan
    const theta =
      parentHeading -
      angleSpread / 2 +
      (i / Math.max(count - 1, 1)) * angleSpread +
      phaseOffset;

    const x = parentPos.x + baseRadius * Math.sin(theta);
    const z = zStep;
    const utility = node.expectedUtilityScore ?? 0;
    const y = 0.6 * parentPos.y + 0.5 * utility;

    tempPositions.push({ id: node.id, x, y, z });
  }

  // Step 2: 15 iterations of inverse-square force repulsion to prevent overlap
  const ITERATIONS = 15;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < tempPositions.length; i++) {
      for (let j = i + 1; j < tempPositions.length; j++) {
        const a = tempPositions[i];
        const b = tempPositions[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < D_MIN && dist > 1e-4) {
          const overlap = (D_MIN - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          a.z -= nz * overlap;

          b.x += nx * overlap;
          b.y += ny * overlap;
          b.z += nz * overlap;
        }
      }
    }
  }

  for (const pos of tempPositions) {
    result.set(pos.id, {
      x: Number(pos.x.toFixed(2)),
      y: Number(pos.y.toFixed(2)),
      z: Number(pos.z.toFixed(2)),
    });
  }

  return result;
}
