'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import VoidBackground from './VoidBackground';
import ProbabilityNode3D from './ProbabilityNode3D';
import ProbabilityFilament from './ProbabilityFilament';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';

interface MultiverseSceneProps {
  onNodeSelect?: (nodeId: string) => void;
  interactive?: boolean;
}

function DepthStrata({ maxDepth = 4, step = 14 }: { maxDepth?: number; step?: number }) {
  const rings = Array.from({ length: maxDepth }, (_, i) => -step * (i + 1));

  return (
    <group>
      {rings.map((zDepth, idx) => (
        <group key={`stratum-${zDepth}`} position={[0, 0, zDepth]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[12 + idx * 6, 12.1 + idx * 6, 64]} />
            <meshBasicMaterial
              color={idx === 0 ? '#00F0FF' : '#D4AF37'}
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CameraChoreographer({
  selectedNodeId,
  interactive = true,
}: {
  selectedNodeId: string | null;
  interactive?: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const nodes = useMultiverseStore((state) => state.nodes);

  const targetLookAt = useRef(new THREE.Vector3(0, 2, -15));
  const targetCamPos = useRef(new THREE.Vector3(0, 16, 36));

  useFrame(() => {
    if (selectedNodeId && nodes[selectedNodeId]?.spatialPosition) {
      const pos = nodes[selectedNodeId].spatialPosition;
      targetLookAt.current.set(pos.x, pos.y, pos.z);
      targetCamPos.current.set(pos.x, pos.y + 4, pos.z + 12);
    } else {
      targetLookAt.current.set(0, 2, -15);
      targetCamPos.current.set(0, 16, 36);
    }

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      camera.position.lerp(targetCamPos.current, 0.06);
      controlsRef.current.update();
    }
  });

  if (!interactive) return null;

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={6}
      maxDistance={180}
      maxPolarAngle={Math.PI / 2 + 0.15}
    />
  );
}

export default function MultiverseScene({
  onNodeSelect,
  interactive = true,
}: MultiverseSceneProps) {
  const nodes = useMultiverseStore((state) => state.nodes);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const hoveredNodeId = useMultiverseStore((state) => state.hoveredNodeId);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const selectNode = useMultiverseStore((state) => state.selectNode);

  const nodeList = Object.values(nodes);

  const handleSelect = (id: string) => {
    selectNode(id);
    if (onNodeSelect) onNodeSelect(id);
  };

  return (
    <>
      <color attach="background" args={['#050507']} />
      <fog attach="fog" args={['#050507', 35, 220]} />

      {/* Lighting Architecture */}
      <ambientLight color="#101018" intensity={0.65} />
      <directionalLight position={[15, 25, 20]} color="#D4AF37" intensity={1.3} />
      <directionalLight position={[-15, -10, -20]} color="#00F0FF" intensity={0.5} />
      <pointLight position={[0, 0, 0]} color="#D4AF37" intensity={2.5} distance={35} decay={2} />

      {/* Environmental Void & Rings */}
      <VoidBackground />
      <DepthStrata maxDepth={4} step={14} />

      {/* Filaments connecting parent to child */}
      <group name="filaments">
        {nodeList.map((node) => {
          if (!node.parentId || !nodes[node.parentId]) return null;
          const parent = nodes[node.parentId];
          const isFilamentGolden =
            goldenPathNodeIds.includes(node.id) && goldenPathNodeIds.includes(parent.id);

          return (
            <ProbabilityFilament
              key={`filament-${parent.id}-${node.id}`}
              start={[parent.spatialPosition.x, parent.spatialPosition.y, parent.spatialPosition.z]}
              end={[node.spatialPosition.x, node.spatialPosition.y, node.spatialPosition.z]}
              conditionalProbability={node.conditionalProbability}
              regimeTier={node.regimeTier}
              timeHorizon={node.timeHorizon}
              isGoldenPath={isFilamentGolden}
              isHovered={hoveredNodeId === node.id || hoveredNodeId === parent.id}
            />
          );
        })}
      </group>

      {/* 3D Probability Nodes */}
      <group name="nodes">
        {nodeList.map((node) => (
          <ProbabilityNode3D
            key={node.id}
            node={node}
            isGoldenPath={goldenPathNodeIds.includes(node.id)}
            isSelected={node.id === selectedNodeId}
            isHovered={node.id === hoveredNodeId}
            onSelect={() => handleSelect(node.id)}
          />
        ))}
      </group>

      {/* Camera Rig & Orbit Controls */}
      <CameraChoreographer selectedNodeId={selectedNodeId} interactive={interactive} />
    </>
  );
}
