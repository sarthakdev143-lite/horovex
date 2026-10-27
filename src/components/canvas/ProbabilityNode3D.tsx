'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

export interface ProbabilityNode3DProps {
  node: ProbabilityNode;
  isGoldenPath: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
}

export default function ProbabilityNode3D({
  node,
  isGoldenPath,
  isSelected,
  isHovered,
  onSelect,
}: ProbabilityNode3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  // Single visual channel: scale encodes conditional probability; accent color marks recommended path only
  const nodeColor = isGoldenPath ? '#D4AF37' : isSelected ? '#F2F0EA' : '#64748B';
  const radius = 0.65 + Math.max(0.05, Math.min(0.95, node.conditionalProbability)) * 1.4;
  const isPruned = node.status === 'pruned';

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isGoldenPath ? 0.25 : 0.08);
    }
  });

  return (
    <group
      ref={groupRef}
      position={[node.spatialPosition.x, node.spatialPosition.y, node.spatialPosition.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          roughness={isGoldenPath ? 0.25 : 0.55}
          metalness={isGoldenPath ? 0.65 : 0.25}
          opacity={isPruned ? 0.25 : 1.0}
          transparent={isPruned}
        />
      </mesh>

      {(isGoldenPath || isSelected || isHovered) && (
        <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[radius + 0.35, radius + 0.45, 48]} />
            <meshBasicMaterial
              color={isGoldenPath ? '#D4AF37' : '#F2F0EA'}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
