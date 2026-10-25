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
  const { camera } = useThree();
  const spotTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => a.siblingIndex - b.siblingIndex);
  }, [nodes]);

  const exhibits: ExhibitSpec[] = useMemo(() => {
    const count = Math.max(1, activeBranches.length);
    return activeBranches.map((node, idx) => {
      const spread = count === 1 ? 0 : (idx / (count - 1)) * 2 - 1; // [-1, 1]
      const prob = Math.max(0.04, Math.min(0.92, node.conditionalProbability));
      const x = spread * (6.2 + (node.waveNumber - 1) * 2.4);
      const z = -1.5 - (node.depth - 1) * 4.2 - Math.abs(spread) * 2.2;
      const height = 1.6 + prob * 9.2;
      const width = 0.75 + prob * 1.1;

      return {
        id: node.id,
        node,
        x,
        z,
        height,
        width,
        isRecommended: goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath),
        isSelected: node.id === selectedNodeId,
      };
    });
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const targetCamPos = useRef(new THREE.Vector3(0, 4.6, 13.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 2.2, -1.5));
  const currentLookAt = useRef(new THREE.Vector3(0, 2.2, -1.5));

  useFrame(() => {
    const focused =
      exhibits.find((e) => e.isSelected) ||
      exhibits.find((e) => e.isRecommended) ||
      exhibits[0];

    if (focused) {
      targetCamPos.current.set(focused.x * 0.32, 4.6, 13.2);
      targetLookAt.current.set(focused.x * 0.45, focused.height * 0.42, focused.z);
      spotTargetRef.current.position.lerp(
        new THREE.Vector3(focused.x, focused.height * 0.5, focused.z),
        reducedMotion ? 1.0 : 0.1
      );
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.07;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  const recExhibit = exhibits.find((e) => e.isRecommended) || exhibits[0];

  return (
    <group>
      <color attach="background" args={['#0E1013']} />
      <fog attach="fog" args={['#0E1013', 14, 36]} />

      {/* Quiet Museum Ambient Fill */}
      <ambientLight intensity={0.58} color="#D8D5CC" />

      {/* Overhead Architectural Key Light Casting Real Shadows */}
      <directionalLight
        position={[6, 16, 8]}
        intensity={2.2}
        color="#F5EFE0"
        castShadow
      />
      <directionalLight position={[-8, 11, 10]} intensity={0.95} color="#A8B4C8" />

      {/* Focused Gallery Spotlight on Recommended Path Exhibit */}
      {recExhibit && (
        <pointLight
          position={[recExhibit.x, recExhibit.height + 3.5, recExhibit.z + 2.0]}
          intensity={8.0}
          distance={18}
          decay={1.6}
          color="#E0A838"
        />
      )}

      {/* Matte Basalt Gallery Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#171B22" roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Architectural Exhibits (Height & Mass = Probability) */}
      {exhibits.map((ex) => {
        const materialColor = ex.isRecommended
          ? '#E0A838'
          : ex.isSelected
          ? '#F1F0EC'
          : '#636C7E';

        return (
          <group
            key={ex.id}
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
            {/* Basalt Plinth Base */}
            <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
              <boxGeometry args={[ex.width * 1.38, 0.28, ex.width * 1.38]} />
              <meshStandardMaterial color="#2A303C" roughness={0.78} metalness={0.12} />
            </mesh>

            {/* Monolithic Exhibit Stele */}
            <mesh position={[0, 0.28 + ex.height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[ex.width, ex.height, ex.width * 0.72]} />
              <meshStandardMaterial
                color={materialColor}
                roughness={ex.isRecommended ? 0.3 : 0.58}
                metalness={ex.isRecommended ? 0.48 : 0.16}
              />
            </mesh>

            {/* Floor Causal Runner from Origin Plinth */}
            <mesh
              position={[-ex.x * 0.5, 0.02, -ex.z * 0.5 + 2.5]}
              rotation={[
                0,
                Math.atan2(ex.x, ex.z - 5.0),
                0,
              ]}
            >
              <boxGeometry
                args={[
                  ex.isRecommended ? 0.16 : 0.07,
                  0.02,
                  Math.sqrt(ex.x * ex.x + Math.pow(ex.z - 5.0, 2)),
                ]}
              />
              <meshStandardMaterial
                color={ex.isRecommended ? '#E0A838' : '#3E4656'}
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
