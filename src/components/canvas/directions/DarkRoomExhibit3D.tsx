'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

interface DarkRoomSceneProps {
  nodes: ProbabilityNode[];
  selectedNodeId: string | null;
  goldenPathIds: string[];
  onSelectNode: (id: string) => void;
  reducedMotion?: boolean;
}

interface ExhibitSpec {
  id: string;
  node: ProbabilityNode;
  parentX: number;
  parentZ: number;
  x: number;
  z: number;
  height: number;
  width: number;
  isRecommended: boolean;
  isSelected: boolean;
}

export default function DarkRoomExhibit3D({
  nodes,
  selectedNodeId,
  goldenPathIds,
  onSelectNode,
  reducedMotion = false,
}: DarkRoomSceneProps) {
  const { camera, size } = useThree();

  const originZ = 3.2;

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        if (a.waveNumber !== b.waveNumber) return a.waveNumber - b.waveNumber;
        return a.siblingIndex - b.siblingIndex;
      });
  }, [nodes]);

  const exhibits: ExhibitSpec[] = useMemo(() => {
    const specMap = new Map<string, ExhibitSpec>();
    const depth1 = activeBranches.filter((n) => n.depth === 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);

    const d1Count = Math.max(1, depth1.length);
    depth1.forEach((node, idx) => {
      const spread = d1Count === 1 ? 0 : (idx / (d1Count - 1)) * 2 - 1; // [-1, 1]
      const prob = Math.max(0.04, Math.min(0.92, node.conditionalProbability));
      const maxX = d1Count > 5 ? 6.6 : 5.6;
      const x = spread * maxX;
      const z = -1.0 - (node.waveNumber - 1) * 2.2 - Math.abs(spread) * 1.1;
      const height = 1.5 + prob * 7.8;
      const width = 0.72 + prob * 0.95;

      const spec: ExhibitSpec = {
        id: node.id,
        node,
        parentX: 0,
        parentZ: originZ,
        x,
        z,
        height,
        width,
        isRecommended: goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath),
        isSelected: node.id === selectedNodeId,
      };
      specMap.set(node.id, spec);
    });

    const byParent = new Map<string, ProbabilityNode[]>();
    deeper.forEach((node) => {
      const pid = node.parentId || '';
      const list = byParent.get(pid) || [];
      list.push(node);
      byParent.set(pid, list);
    });

    byParent.forEach((children, pid) => {
      const parentSpec = specMap.get(pid);
      const px = parentSpec ? parentSpec.x : 0;
      const pz = parentSpec ? parentSpec.z : -1.0;
      const cCount = Math.max(1, children.length);

      children.forEach((child, cIdx) => {
        const localSpread = cCount === 1 ? 0 : (cIdx / (cCount - 1)) * 2 - 1;
        const prob = Math.max(0.04, Math.min(0.92, child.conditionalProbability));
        const rawX = px + localSpread * 3.6;
        const x = Math.max(-7.2, Math.min(7.2, rawX));
        const z = pz - 3.6 - (child.depth - 2) * 2.8 - Math.abs(localSpread) * 0.6;
        const height = 1.2 + prob * 6.2;
        const width = 0.62 + prob * 0.8;

        const spec: ExhibitSpec = {
          id: child.id,
          node: child,
          parentX: px,
          parentZ: pz,
          x,
          z,
          height,
          width,
          isRecommended: goldenPathIds.includes(child.id) || Boolean(child.isGoldenPath),
          isSelected: child.id === selectedNodeId,
        };
        specMap.set(child.id, spec);
      });
    });

    return Array.from(specMap.values());
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const targetCamPos = useRef(new THREE.Vector3(0, 5.2, 12.6));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.8, -0.8));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.8, -0.8));

  useFrame(() => {
    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.25 ? 1.25 / Math.max(0.68, aspect) : 1.0;
    const focused = exhibits.find((e) => e.isSelected);
    // Keep gallery room balanced in frame; subtle shift when inspecting a side stele
    if (focused && !focused.isRecommended) {
      targetCamPos.current.set(focused.x * 0.16, 5.0 * pullback, 12.4 * pullback);
      targetLookAt.current.set(focused.x * 0.22, 1.7, focused.z * 0.35 - 0.5);
    } else {
      targetCamPos.current.set(0, 5.2 * pullback, 12.6 * pullback);
      targetLookAt.current.set(0, 1.8, -0.8);
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.08;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  const recExhibits = exhibits.filter((e) => e.isRecommended);
  const leadExhibit = recExhibits[0] || exhibits[0];

  return (
    <group>
      <color attach="background" args={['#0E1013']} />
      <fog attach="fog" args={['#0E1013', 13, 34]} />

      {/* Quiet Museum Ambient Fill */}
      <ambientLight intensity={0.34} color="#D8D5CC" />

      {/* Overhead Architectural Key Light Casting Real Shadows */}
      <directionalLight
        position={[7, 16, 9]}
        intensity={1.85}
        color="#F5EFE0"
        castShadow
      />
      <directionalLight position={[-9, 10, 8]} intensity={0.65} color="#9BA8BE" />

      {/* Focused Warm Tungsten Gallery Light on Recommended Path Exhibit */}
      {leadExhibit && (
        <pointLight
          position={[leadExhibit.x, leadExhibit.height + 3.2, leadExhibit.z + 1.8]}
          intensity={11.0}
          distance={18}
          decay={1.5}
          color="#E0A838"
        />
      )}

      {/* Matte Basalt Gallery Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color="#151920" roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Origin Decision Plinth in Gallery Foreground */}
      <group position={[0, 0, originZ]}>
        <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.25, 0.28, 1.25]} />
          <meshStandardMaterial color="#272D38" roughness={0.75} metalness={0.14} />
        </mesh>
        <mesh position={[0, 0.34, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.85, 0.16, 0.85]} />
          <meshStandardMaterial color="#E0A838" roughness={0.35} metalness={0.42} />
        </mesh>
      </group>

      {/* Architectural Exhibits (Height & Mass = Probability) */}
      {exhibits.map((ex) => {
        const materialColor = ex.isRecommended
          ? '#E0A838'
          : ex.isSelected
          ? '#F1F0EC'
          : '#5C6577';

        const dx = ex.x - ex.parentX;
        const dz = ex.z - ex.parentZ;
        const runnerLen = Math.hypot(dx, dz);
        const runnerAng = Math.atan2(dx, dz);
        const midX = (ex.parentX + ex.x) * 0.5;
        const midZ = (ex.parentZ + ex.z) * 0.5;

        return (
          <group key={ex.id}>
            {/* World-Space Floor Causal Runner from Parent Plinth to Exhibit */}
            <mesh
              position={[midX, 0.02, midZ]}
              rotation={[0, runnerAng, 0]}
            >
              <boxGeometry
                args={[
                  ex.isRecommended ? 0.16 : ex.isSelected ? 0.11 : 0.06,
                  0.02,
                  runnerLen,
                ]}
              />
              <meshStandardMaterial
                color={ex.isRecommended ? '#E0A838' : ex.isSelected ? '#D8D5CC' : '#353C4A'}
                roughness={0.45}
                metalness={0.2}
              />
            </mesh>

            <group
              position={[ex.x, 0, ex.z]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(ex.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              {/* Warm Spotlight Pool on Basalt Floor under Recommended or Selected Stele */}
              {(ex.isRecommended || ex.isSelected) && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
                  <ringGeometry
                    args={[ex.width * 0.85, ex.width * 1.35, 36]}
                  />
                  <meshBasicMaterial
                    color={ex.isRecommended ? '#E0A838' : '#D8D5CC'}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={ex.isRecommended ? 0.42 : 0.25}
                  />
                </mesh>
              )}

              {/* Basalt Plinth Base */}
              <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
                <boxGeometry args={[ex.width * 1.36, 0.3, ex.width * 1.36]} />
                <meshStandardMaterial color="#262C37" roughness={0.78} metalness={0.14} />
              </mesh>

              {/* Monolithic Exhibit Stele */}
              <mesh position={[0, 0.3 + ex.height / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[ex.width, ex.height, ex.width * 0.74]} />
                <meshStandardMaterial
                  color={materialColor}
                  roughness={ex.isRecommended ? 0.28 : 0.56}
                  metalness={ex.isRecommended ? 0.48 : 0.16}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
