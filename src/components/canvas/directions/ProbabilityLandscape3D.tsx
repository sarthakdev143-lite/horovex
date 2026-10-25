'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

interface LandscapeSceneProps {
  nodes: ProbabilityNode[];
  selectedNodeId: string | null;
  goldenPathIds: string[];
  onSelectNode: (id: string) => void;
  reducedMotion?: boolean;
}

interface ValleySpec {
  id: string;
  node: ProbabilityNode;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  depth: number;
  width: number;
  isRecommended: boolean;
  isSelected: boolean;
}

export default function ProbabilityLandscape3D({
  nodes,
  selectedNodeId,
  goldenPathIds,
  onSelectNode,
  reducedMotion = false,
}: LandscapeSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  const activeBranches = useMemo(() => {
    const branches = nodes.filter((n) => n.parentId !== null && n.status !== 'pruned');
    return branches.sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (a.waveNumber !== b.waveNumber) return a.waveNumber - b.waveNumber;
      return a.siblingIndex - b.siblingIndex;
    });
  }, [nodes]);

  const hasDeepBranches = useMemo(
    () => activeBranches.some((n) => n.depth > 1),
    [activeBranches]
  );

  // Build hierarchical Waddington valleys (Depth 1 from origin ridge; Depth 2+ forking from parent valley)
  const valleys: ValleySpec[] = useMemo(() => {
    const depth1 = activeBranches.filter((n) => n.depth === 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);
    const specMap = new Map<string, ValleySpec>();

    const d1Count = Math.max(1, depth1.length);
    const d1EndZ = hasDeepBranches ? 1.2 : 5.4;

    depth1.forEach((node, idx) => {
      const spread = d1Count === 1 ? 0 : (idx / (d1Count - 1)) * 2 - 1; // [-1, 1]
      const maxSpreadX = d1Count > 5 ? 7.8 : 6.8;
      const endX = spread * maxSpreadX;
      const endZ = d1EndZ + (node.waveNumber - 1) * 1.4 - Math.abs(spread) * 0.6;
      const prob = Math.max(0.03, Math.min(0.95, node.conditionalProbability));

      const spec: ValleySpec = {
        id: node.id,
        node,
        startX: 0,
        startZ: -8.2,
        endX,
        endZ,
        depth: 0.85 + prob * 5.4,
        width: 1.05 + prob * 2.1,
        isRecommended: goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath),
        isSelected: node.id === selectedNodeId,
      };
      specMap.set(node.id, spec);
    });

    // Group deeper branches by parentId so they fork cleanly from their parent's valley
    const byParent = new Map<string, ProbabilityNode[]>();
    deeper.forEach((node) => {
      const pid = node.parentId || '';
      const list = byParent.get(pid) || [];
      list.push(node);
      byParent.set(pid, list);
    });

    byParent.forEach((children, pid) => {
      const parentSpec = specMap.get(pid);
      const startX = parentSpec ? parentSpec.endX : 0;
      const startZ = parentSpec ? parentSpec.endZ : 1.2;
      const cCount = Math.max(1, children.length);

      children.forEach((child, cIdx) => {
        const localSpread = cCount === 1 ? 0 : (cIdx / (cCount - 1)) * 2 - 1;
        const rawEndX = startX + localSpread * 4.2;
        const endX = Math.max(-8.2, Math.min(8.2, rawEndX));
        const endZ = Math.min(8.0, startZ + 4.8 + (child.depth - 2) * 2.4);
        const prob = Math.max(0.03, Math.min(0.95, child.conditionalProbability));

        const spec: ValleySpec = {
          id: child.id,
          node: child,
          startX,
          startZ,
          endX,
          endZ,
          depth: 0.65 + prob * 4.2,
          width: 0.85 + prob * 1.6,
          isRecommended: goldenPathIds.includes(child.id) || Boolean(child.isGoldenPath),
          isSelected: child.id === selectedNodeId,
        };
        specMap.set(child.id, spec);
      });
    });

    return Array.from(specMap.values());
  }, [activeBranches, goldenPathIds, selectedNodeId, hasDeepBranches]);

  const gridSegs = 84;
  const planeWidth = 44;
  const planeDepth = 34;

  // Evaluate terrain height at any (x, z) coordinate
  const evalTerrainHeight = useMemo(() => {
    return (x: number, z: number) => {
      const globalT = Math.max(0, Math.min(1, (z + 10.0) / 20.0));
      // Gently sloped limestone plateau from high ridge (z = -10) down to foreground basin (z = +10)
      let h = (1 - globalT) * 3.6 + Math.cos(x * 0.24) * 0.22;

      for (const v of valleys) {
        const spanZ = Math.max(1.5, v.endZ - v.startZ);
        if (z < v.startZ - 1.2 || z > v.endZ + 2.4) continue;
        const localT = Math.max(0, Math.min(1, (z - v.startZ) / spanZ));
        // Smooth S-curve valley centerline with gentle natural meander
        const easeT = localT * localT * (3 - 2 * localT);
        const meander = Math.sin(localT * Math.PI) * (v.endX - v.startX) * 0.08;
        const vx = v.startX + (v.endX - v.startX) * easeT + meander;
        const w = 0.6 + localT * v.width;
        const dx = x - vx;
        // Longitudinal envelope so valley starts smoothly and basins out past endZ
        const zEnv =
          z <= v.endZ
            ? Math.pow(localT, 0.55)
            : Math.exp(-Math.pow((z - v.endZ) / 1.8, 2));
        const carve = v.depth * Math.exp(-(dx * dx) / (2 * w * w)) * zEnv;
        h -= carve;
      }
      return h;
    };
  }, [valleys]);

  const { geometry, targetHeights } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeWidth, planeDepth, gridSegs, gridSegs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const heights = new Float32Array(pos.count);
    const colors = new Float32Array(pos.count * 3);

    const highStone = new THREE.Color('#E8E4DA');
    const lowStone = new THREE.Color('#CFC9BC');
    const contourInk = new THREE.Color('#A6A092');
    const tempColor = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = evalTerrainHeight(x, z);

      heights[i] = h;
      pos.setY(i, h);

      // Topographic elevation shading + subtle cartographic contour strata lines
      const elevNorm = Math.max(0, Math.min(1, (h + 2.2) / 5.8));
      tempColor.lerpColors(lowStone, highStone, elevNorm);
      const contourPhase = Math.abs(((h + 10) * 2.4) % 1 - 0.5);
      if (contourPhase < 0.065) {
        tempColor.lerp(contourInk, 0.42);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo, targetHeights: heights };
  }, [evalTerrainHeight]);

  // Helper to build a river curve for any valley from its startZ to its endZ
  const buildValleyCurve = useMemo(() => {
    return (v: ValleySpec, yOffset: number) => {
      const points: THREE.Vector3[] = [];
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const localT = s / steps;
        const z = v.startZ + localT * (v.endZ - v.startZ);
        const easeT = localT * localT * (3 - 2 * localT);
        const meander = Math.sin(localT * Math.PI) * (v.endX - v.startX) * 0.08;
        const x = v.startX + (v.endX - v.startX) * easeT + meander;
        const h = evalTerrainHeight(x, z);
        points.push(new THREE.Vector3(x, h + yOffset, z));
      }
      return new THREE.CatmullRomCurve3(points);
    };
  }, [evalTerrainHeight]);

  // Recommended path cobalt river segments (supports Depth 1 + Depth 2 golden path)
  const recommendedRiverCurves = useMemo(() => {
    const recs = valleys.filter((v) => v.isRecommended);
    const list = recs.length > 0 ? recs : valleys.slice(0, 1);
    return list.map((v) => ({
      id: v.id,
      curve: buildValleyCurve(v, 0.14),
    }));
  }, [valleys, buildValleyCurve]);

  // Counterfactual valley channels in muted stone ink
  const tributaryCurves = useMemo(() => {
    return valleys
      .filter((v) => !v.isRecommended)
      .map((v) => ({
        id: v.id,
        isSelected: v.isSelected,
        curve: buildValleyCurve(v, 0.09),
      }));
  }, [valleys, buildValleyCurve]);

  const targetCamPos = useRef(new THREE.Vector3(0, 15.2, 16.0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.2, 0.2));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.2, 0.2));

  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.25 ? 1.25 / Math.max(0.68, aspect) : 1.0;
    const selectedValley = valleys.find((v) => v.isSelected);
    // Keep camera nearly centered so all 5+ valleys remain framed inside the viewport
    if (selectedValley && !selectedValley.isRecommended) {
      targetCamPos.current.set(selectedValley.endX * 0.14, 14.6 * pullback, 15.6 * pullback);
      targetLookAt.current.set(selectedValley.endX * 0.18, -0.2, 0.4);
    } else {
      targetCamPos.current.set(0, 15.2 * pullback, 16.0 * pullback);
      targetLookAt.current.set(0, 0.2, 0.2);
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.08;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);

    if (meshRef.current) {
      const pos = meshRef.current.geometry.attributes.position;
      let changed = false;
      for (let i = 0; i < pos.count; i++) {
        const curY = pos.getY(i);
        const tgtY = targetHeights[i] ?? curY;
        if (Math.abs(curY - tgtY) > 0.005) {
          pos.setY(i, curY + (tgtY - curY) * (reducedMotion ? 1.0 : 0.14));
          changed = true;
        }
      }
      if (changed) {
        pos.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
      }
    }
  });

  const originHeight = evalTerrainHeight(0, -8.2);

  return (
    <group>
      <color attach="background" args={['#E6E2D8']} />
      <fog attach="fog" args={['#E6E2D8', 22, 44]} />

      <ambientLight intensity={0.82} color="#FAF7F0" />
      <directionalLight position={[14, 24, 12]} intensity={1.35} color="#FFFDF8" />
      <directionalLight position={[-14, 12, -8]} intensity={0.45} color="#D5CFC2" />

      {/* Sculpted Limestone Waddington Terrain with Topographic Contour Bands */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.04}
          flatShading={false}
        />
      </mesh>

      {/* Origin Watershed Pass Cairn (Root Decision Node) */}
      <mesh position={[0, originHeight + 0.28, -8.2]}>
        <cylinderGeometry args={[0.42, 0.52, 0.36, 24]} />
        <meshStandardMaterial color="#141413" roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Recommended Path River Line in Single Cartographic Cobalt Accent (#1456C8) */}
      {recommendedRiverCurves.map((r) => (
        <mesh key={`rec-${r.id}`}>
          <tubeGeometry args={[r.curve, 56, 0.22, 12, false]} />
          <meshStandardMaterial
            color="#1456C8"
            roughness={0.22}
            metalness={0.18}
          />
        </mesh>
      ))}

      {/* Counterfactual Valley Channels in Muted Stone Ink */}
      {tributaryCurves.map((t) => (
        <mesh key={t.id}>
          <tubeGeometry args={[t.curve, 40, t.isSelected ? 0.15 : 0.08, 8, false]} />
          <meshStandardMaterial
            color={t.isSelected ? '#141413' : '#6E6A61'}
            roughness={0.58}
            metalness={0.08}
          />
        </mesh>
      ))}

      {/* Interactive Valley Terminus Stones */}
      {valleys.map((v) => {
        const x = v.endX;
        const z = v.endZ;
        const h = evalTerrainHeight(x, z);

        return (
          <group
            key={v.id}
            position={[x, h + 0.28, z]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectNode(v.id);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            {/* Outer Survey Ring for Selected or Recommended Terminus */}
            {(v.isRecommended || v.isSelected) && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <ringGeometry
                  args={[
                    v.isRecommended ? 0.66 : 0.54,
                    v.isRecommended ? 0.82 : 0.68,
                    32,
                  ]}
                />
                <meshBasicMaterial
                  color={v.isRecommended ? '#1456C8' : '#141413'}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            <mesh>
              <cylinderGeometry
                args={[
                  v.isRecommended ? 0.5 : 0.36,
                  v.isRecommended ? 0.54 : 0.4,
                  v.isSelected ? 0.52 : 0.34,
                  28,
                ]}
              />
              <meshStandardMaterial
                color={v.isRecommended ? '#1456C8' : v.isSelected ? '#141413' : '#4A4740'}
                roughness={0.32}
                metalness={0.18}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
