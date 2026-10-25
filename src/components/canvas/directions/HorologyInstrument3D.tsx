'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

interface InstrumentSceneProps {
  nodes: ProbabilityNode[];
  selectedNodeId: string | null;
  goldenPathIds: string[];
  onSelectNode: (id: string) => void;
  reducedMotion?: boolean;
}

interface WheelSpec {
  id: string;
  node: ProbabilityNode;
  x: number;
  y: number;
  z: number;
  radius: number;
  teeth: number;
  speed: number;
  isRecommended: boolean;
  isSelected: boolean;
}

function MachinedGearWheel({
  spec,
  onSelect,
  reducedMotion,
}: {
  spec: WheelSpec;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const wheelGroupRef = useRef<THREE.Group>(null);

  const toothAngles = useMemo(() => {
    return Array.from({ length: spec.teeth }, (_, i) => (i / spec.teeth) * Math.PI * 2);
  }, [spec.teeth]);

  useFrame((_, delta) => {
    if (!reducedMotion && wheelGroupRef.current) {
      wheelGroupRef.current.rotation.z += delta * spec.speed;
    }
  });

  const rimColor = spec.isRecommended
    ? '#111317'
    : spec.isSelected
    ? '#252932'
    : '#5C616B';

  const plateColor = spec.isRecommended ? '#DCDCD4' : '#E6E6E0';

  return (
    <group
      position={[spec.x, spec.y, spec.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <group ref={wheelGroupRef}>
        {/* Outer Machined Rim */}
        <mesh>
          <ringGeometry args={[spec.radius * 0.78, spec.radius, 48]} />
          <meshStandardMaterial
            color={rimColor}
            metalness={0.78}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner Brushed Dial Plate */}
        <mesh position={[0, 0, -0.04]}>
          <circleGeometry args={[spec.radius * 0.78, 48]} />
          <meshStandardMaterial
            color={plateColor}
            metalness={0.35}
            roughness={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 5 Precision Spokes */}
        {[0, 1, 2, 3, 4].map((sIdx) => (
          <mesh
            key={sIdx}
            rotation={[0, 0, (sIdx * Math.PI * 2) / 5]}
            position={[0, 0, 0.02]}
          >
            <boxGeometry args={[spec.radius * 1.54, 0.11, 0.08]} />
            <meshStandardMaterial color={rimColor} metalness={0.75} roughness={0.3} />
          </mesh>
        ))}

        {/* Gear Teeth around Perimeter */}
        {toothAngles.map((ang, idx) => (
          <mesh
            key={idx}
            position={[
              Math.cos(ang) * (spec.radius + 0.09),
              Math.sin(ang) * (spec.radius + 0.09),
              0,
            ]}
            rotation={[0, 0, ang]}
          >
            <boxGeometry args={[0.2, 0.12, 0.14]} />
            <meshStandardMaterial color={rimColor} metalness={0.82} roughness={0.22} />
          </mesh>
        ))}
      </group>

      {/* Central Jewel Bearing (Horological Ruby #B81D33 on Recommended Path ONLY) */}
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[
            spec.isRecommended ? 0.36 : 0.24,
            spec.isRecommended ? 0.36 : 0.24,
            0.22,
            24,
          ]}
        />
        <meshStandardMaterial
          color={spec.isRecommended ? '#B81D33' : '#111317'}
          metalness={spec.isRecommended ? 0.25 : 0.85}
          roughness={spec.isRecommended ? 0.15 : 0.25}
        />
      </mesh>
    </group>
  );
}

export default function HorologyInstrument3D({
  nodes,
  selectedNodeId,
  goldenPathIds,
  onSelectNode,
  reducedMotion = false,
}: InstrumentSceneProps) {
  const { camera } = useThree();
  const handRef = useRef<THREE.Group>(null);

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => a.siblingIndex - b.siblingIndex);
  }, [nodes]);

  // Build interlocking gear train layout where probability = wheel radius
  const wheels: WheelSpec[] = useMemo(() => {
    const count = Math.max(1, activeBranches.length);
    let currentX = -6.2;
    let currentY = 0.6;

    return activeBranches.map((node, idx) => {
      const prob = Math.max(0.04, Math.min(0.9, node.conditionalProbability));
      const radius = 1.05 + prob * 3.6;
      const teeth = Math.max(14, Math.round(14 + prob * 38));
      const isRecommended = goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath);
      const isSelected = node.id === selectedNodeId;

      if (idx === 0) {
        currentX = -5.2;
        currentY = 0.8;
      } else {
        const prevProb = Math.max(
          0.04,
          Math.min(0.9, activeBranches[idx - 1].conditionalProbability)
        );
        const prevRadius = 1.05 + prevProb * 3.6;
        const stepDist = prevRadius + radius + 0.22;
        const angle = (idx % 2 === 1 ? -0.32 : 0.36) + (node.depth > 1 ? 0.45 : 0);
        currentX += Math.cos(angle) * stepDist * 0.86;
        currentY += Math.sin(angle) * stepDist * 0.72;
      }

      const zOffset = (node.depth - 1) * -0.55 + (node.waveNumber - 1) * -0.35;
      const dir = idx % 2 === 0 ? 1 : -1;
      const speed = (dir * 0.55) / radius;

      return {
        id: node.id,
        node,
        x: currentX - (count > 5 ? 1.8 : 0),
        y: currentY,
        z: zOffset,
        radius,
        teeth,
        speed,
        isRecommended,
        isSelected,
      };
    });
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const targetCamPos = useRef(new THREE.Vector3(0, 0, 15.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const selected = wheels.find((w) => w.isSelected);
    if (selected) {
      targetCamPos.current.set(selected.x * 0.35, selected.y * 0.35, 14.5);
      targetLookAt.current.set(selected.x * 0.45, selected.y * 0.45, 0);
    } else {
      targetCamPos.current.set(0, 0, 15.5);
      targetLookAt.current.set(0, 0, 0);
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.08;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);

    // Point the chronometric hand toward the recommended wheel
    const rec = wheels.find((w) => w.isRecommended) || wheels[0];
    if (rec && handRef.current) {
      const targetAngle = Math.atan2(rec.y, rec.x);
      const diff = targetAngle - handRef.current.rotation.z;
      handRef.current.rotation.z += diff * (reducedMotion ? 1.0 : 0.08);
    }
  });

  const recWheel = wheels.find((w) => w.isRecommended) || wheels[0];

  return (
    <group>
      <color attach="background" args={['#EAEAE4']} />
      <fog attach="fog" args={['#EAEAE4', 20, 48]} />

      <ambientLight intensity={0.85} color="#FFFFFF" />
      <directionalLight position={[10, 16, 18]} intensity={1.4} color="#FFFDF9" />
      <directionalLight position={[-12, -10, 10]} intensity={0.5} color="#D8DCE3" />

      {/* Outer Calibre Dial Ring */}
      <mesh position={[0, 0, -0.8]}>
        <ringGeometry args={[8.6, 8.72, 96]} />
        <meshBasicMaterial color="#9A9E98" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.8]}>
        <ringGeometry args={[5.2, 5.26, 72]} />
        <meshBasicMaterial color="#B5B8B0" side={THREE.DoubleSide} />
      </mesh>

      {/* Jeweled Transmission Bridge linking Origin to Recommended Wheel */}
      {recWheel && (
        <group position={[0, 0, 0.16]} ref={handRef}>
          <mesh position={[2.2, 0, 0]}>
            <boxGeometry args={[4.4, 0.12, 0.06]} />
            <meshStandardMaterial color="#B81D33" metalness={0.35} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Interlocking Decision Gear Wheels */}
      {wheels.map((w) => (
        <MachinedGearWheel
          key={w.id}
          spec={w}
          onSelect={() => onSelectNode(w.id)}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
