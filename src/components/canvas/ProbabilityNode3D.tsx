'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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
  const auraRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Group>(null);

  // Derive chromatic palette
  const regimeColor = React.useMemo(() => {
    if (isGoldenPath) return '#D4AF37';
    switch (node.regimeTier) {
      case 'baseline_wave_1':
        return '#00F0FF';
      case 'contrarian_wave_2':
        return '#8B5CF6';
      case 'tail_risk_wave_3_plus':
        return '#F43F5E';
      default:
        return '#10B981';
    }
  }, [isGoldenPath, node.regimeTier]);

  // Status-dependent opacity / scale
  const isPruned = node.status === 'pruned';
  const isRealized = node.status === 'realized';

  useFrame((state, delta) => {
    // Breathing aura pulsation
    if (auraRef.current) {
      const baseScale = 1.0 + node.conditionalProbability * 0.45;
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2.8) * 0.06;
      auraRef.current.scale.setScalar(baseScale * pulse);
    }
    // Halo rotation
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * (isGoldenPath ? 0.35 : 0.15);
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
      {/* Layer 1: Obsidian Crystalline Glass Core */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhysicalMaterial
          color="#0A0A12"
          emissive={regimeColor}
          emissiveIntensity={isGoldenPath ? 1.4 : isSelected ? 1.0 : isHovered ? 0.8 : 0.35}
          roughness={0.18}
          metalness={0.75}
          transmission={0.35}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          opacity={isPruned ? 0.3 : 1.0}
          transparent={isPruned}
        />
      </mesh>

      {/* Layer 2: Bioluminescent Probability Aura */}
      {!isPruned && (
        <mesh ref={auraRef}>
          <sphereGeometry args={[1.35, 24, 24]} />
          <meshBasicMaterial
            color={regimeColor}
            transparent
            opacity={isGoldenPath ? 0.28 : isSelected ? 0.22 : 0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Layer 3: Status Halo Ring in XZ Plane */}
      <group ref={haloRef} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.6, isGoldenPath ? 1.85 : 1.72, 48]} />
          <meshBasicMaterial
            color={isRealized ? '#FFFFFF' : isPruned ? '#444455' : regimeColor}
            transparent
            opacity={isGoldenPath ? 0.75 : isSelected ? 0.6 : 0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Spatial HTML Micro-Badge (LOD presentation) */}
      <Html center distanceFactor={22} position={[0, 1.8, 0]}>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-mono backdrop-blur-md border pointer-events-none transition-all duration-200 select-none whitespace-nowrap shadow-lg flex items-center gap-1.5 ${
            isGoldenPath
              ? 'bg-[#12121A]/90 border-[#D4AF37]/80 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : isSelected
              ? 'bg-[#12121A]/90 border-cyan-400/70 text-cyan-300'
              : isHovered
              ? 'bg-[#0D0D14]/90 border-white/30 text-white'
              : 'bg-[#050507]/80 border-white/10 text-white/70'
          }`}
        >
          {isGoldenPath && <span className="text-[#D4AF37]">✦</span>}
          <span className="font-semibold">{Math.round(node.conditionalProbability * 100)}%</span>
          <span className="opacity-30">|</span>
          <span className="max-w-[140px] truncate">{node.title}</span>
          <span className="text-[10px] opacity-50 px-1 py-0.5 rounded bg-white/5 border border-white/5">
            {node.timeHorizon}
          </span>
        </div>
      </Html>
    </group>
  );
}
