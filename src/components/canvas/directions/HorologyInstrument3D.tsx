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
  parentX: number;
  parentY: number;
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
    ? '#141518'
    : spec.isSelected
    ? '#22262E'
    : '#484D56';

  const plateColor = spec.isRecommended
    ? '#DFDDD4'
    : spec.isSelected
    ? '#E5E4DC'
    : '#ECEBE4';

  const dx = spec.x - spec.parentX;
  const dy = spec.y - spec.parentY;
  const bridgeLen = Math.hypot(dx, dy);
  const bridgeAng = Math.atan2(dy, dx);

  return (
    <group>
      {/* Structural Calibre Bridge from Parent Axis to Wheel Axis */}
      {bridgeLen > 0.1 && (
        <group
          position={[
            (spec.parentX + spec.x) * 0.5,
            (spec.parentY + spec.y) * 0.5,
            spec.z + (spec.isRecommended ? 0.14 : -0.12),
          ]}
          rotation={[0, 0, bridgeAng]}
        >
          <mesh>
            <boxGeometry
              args={[
                bridgeLen,
                spec.isRecommended ? 0.16 : 0.09,
                spec.isRecommended ? 0.08 : 0.05,
              ]}
            />
            <meshStandardMaterial
              color={spec.isRecommended ? '#B81D33' : '#9A9D96'}
              metalness={spec.isRecommended ? 0.35 : 0.65}
              roughness={spec.isRecommended ? 0.2 : 0.35}
            />
          </mesh>
        </group>
      )}

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
          {/* Outer Machined Steel Rim */}
          <mesh>
            <ringGeometry args={[spec.radius * 0.76, spec.radius, 56]} />
            <meshStandardMaterial
              color={rimColor}
              metalness={0.78}
              roughness={0.24}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Inner Recessed Dial Ring */}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[spec.radius * 0.34, spec.radius * 0.42, 40]} />
            <meshStandardMaterial
              color={rimColor}
              metalness={0.72}
              roughness={0.28}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Inner Brushed Silver-Rhodium Plate */}
          <mesh position={[0, 0, -0.04]}>
            <circleGeometry args={[spec.radius * 0.76, 48]} />
            <meshStandardMaterial
              color={plateColor}
              metalness={0.32}
              roughness={0.58}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* 5 Precision Beveled Calibre Spokes */}
          {[0, 1, 2, 3, 4].map((sIdx) => (
            <mesh
              key={sIdx}
              rotation={[0, 0, (sIdx * Math.PI * 2) / 5]}
              position={[0, 0, 0.02]}
            >
              <boxGeometry args={[spec.radius * 1.5, 0.09, 0.07]} />
              <meshStandardMaterial color={rimColor} metalness={0.76} roughness={0.28} />
            </mesh>
          ))}

          {/* Involute Gear Teeth around Perimeter */}
          {toothAngles.map((ang, idx) => (
            <mesh
              key={idx}
              position={[
                Math.cos(ang) * (spec.radius + 0.08),
                Math.sin(ang) * (spec.radius + 0.08),
                0,
              ]}
              rotation={[0, 0, ang]}
            >
              <boxGeometry args={[0.18, 0.1, 0.12]} />
              <meshStandardMaterial color={rimColor} metalness={0.82} roughness={0.22} />
            </mesh>
          ))}
        </group>

        {/* Central Jewel Chaton Collar */}
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[
              spec.isRecommended ? 0.38 : 0.24,
              spec.isRecommended ? 0.38 : 0.24,
              0.16,
              28,
            ]}
          />
          <meshStandardMaterial
            color={spec.isRecommended ? '#D4C598' : '#7C8088'}
            metalness={0.75}
            roughness={0.25}
          />
        </mesh>

        {/* Central Jewel Bearing (Horological Ruby #B81D33 on Recommended Path ONLY) */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[
              spec.isRecommended ? 0.27 : 0.15,
              spec.isRecommended ? 0.27 : 0.15,
              0.18,
              24,
            ]}
          />
          <meshStandardMaterial
            color={spec.isRecommended ? '#B81D33' : '#141518'}
            metalness={spec.isRecommended ? 0.22 : 0.85}
            roughness={spec.isRecommended ? 0.14 : 0.25}
          />
        </mesh>
      </group>
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
  const { camera, size } = useThree();
  const barrelGroupRef = useRef<THREE.Group>(null);

  const barrelRadius = 1.38;
  const barrelTeeth = useMemo(
    () => Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2),
    []
  );

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        if (a.waveNumber !== b.waveNumber) return a.waveNumber - b.waveNumber;
        return a.siblingIndex - b.siblingIndex;
      });
  }, [nodes]);

  // Build radial planetary gear train around the central mainspring barrel so zero wheels overlap
  const wheels: WheelSpec[] = useMemo(() => {
    const specMap = new Map<string, WheelSpec>();
    const wave1 = activeBranches.filter((n) => n.depth === 1 && n.waveNumber === 1);
    const outerWaves = activeBranches.filter((n) => n.depth === 1 && n.waveNumber > 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);

    // 5 well-separated radial angles around the central barrel (panoramic watch calibre layout)
    const baseAngles = [-2.58, -1.42, -0.24, 0.86, 2.08];

    wave1.forEach((node, idx) => {
      const prob = Math.max(0.04, Math.min(0.85, node.conditionalProbability));
      const radius = 0.82 + prob * 2.25;
      const teeth = Math.max(14, Math.round(14 + prob * 32));
      const ang =
        idx < baseAngles.length
          ? baseAngles[idx]
          : (idx / Math.max(1, wave1.length)) * Math.PI * 2 - Math.PI;
      const centerDist = barrelRadius + radius + 0.14;
      const x = Math.cos(ang) * centerDist;
      const y = Math.sin(ang) * centerDist * 0.88;
      const isRecommended = goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath);
      const isSelected = node.id === selectedNodeId;
      const speed = -0.42 * (barrelRadius / radius);

      const spec: WheelSpec = {
        id: node.id,
        node,
        parentX: 0,
        parentY: 0,
        x,
        y,
        z: 0,
        radius,
        teeth,
        speed,
        isRecommended,
        isSelected,
      };
      specMap.set(node.id, spec);
    });

    // Outer complication ring for Wave 2+ ("+5 more futures")
    outerWaves.forEach((node, idx) => {
      const prob = Math.max(0.03, Math.min(0.85, node.conditionalProbability));
      const radius = 0.65 + prob * 1.65;
      const teeth = Math.max(12, Math.round(12 + prob * 24));
      const count = Math.max(1, outerWaves.length);
      const ang = (idx / count) * Math.PI * 2 + 0.38;
      const ringDist = 4.9 + (node.waveNumber - 2) * 1.45;
      const x = Math.cos(ang) * ringDist * 1.12;
      const y = Math.sin(ang) * ringDist * 0.78;
      const isRecommended = goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath);
      const isSelected = node.id === selectedNodeId;
      // Connect to nearest wave-1 wheel or central barrel
      const nearestParent = wave1[idx % Math.max(1, wave1.length)];
      const pSpec = nearestParent ? specMap.get(nearestParent.id) : undefined;

      const spec: WheelSpec = {
        id: node.id,
        node,
        parentX: pSpec ? pSpec.x : 0,
        parentY: pSpec ? pSpec.y : 0,
        x,
        y,
        z: -0.24 * (node.waveNumber - 1),
        radius,
        teeth,
        speed: 0.36 / radius,
        isRecommended,
        isSelected,
      };
      specMap.set(node.id, spec);
    });

    // Coaxial stepped complication wheels for Depth 2+ ("Show what happens next")
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
      const py = parentSpec ? parentSpec.y : 0;
      const pr = parentSpec ? parentSpec.radius : barrelRadius;
      const baseRay = Math.atan2(py, px);
      const cCount = Math.max(1, children.length);

      children.forEach((child, cIdx) => {
        const prob = Math.max(0.03, Math.min(0.85, child.conditionalProbability));
        const radius = 0.56 + prob * 1.35;
        const teeth = Math.max(12, Math.round(12 + prob * 20));
        const spread = cCount === 1 ? 0 : (cIdx / (cCount - 1)) * 2 - 1;
        const rayAngle = baseRay + spread * 0.62;
        const stepDist = pr + radius + 0.14;
        const rawX = px + Math.cos(rayAngle) * stepDist;
        const rawY = py + Math.sin(rayAngle) * stepDist;
        const x = Math.max(-7.2, Math.min(7.2, rawX));
        const y = Math.max(-4.1, Math.min(4.1, rawY));
        const isRecommended = goldenPathIds.includes(child.id) || Boolean(child.isGoldenPath);
        const isSelected = child.id === selectedNodeId;

        const spec: WheelSpec = {
          id: child.id,
          node: child,
          parentX: px,
          parentY: py,
          x,
          y,
          z: -0.35 * (child.depth - 1),
          radius,
          teeth,
          speed: (cIdx % 2 === 0 ? 0.5 : -0.5) / radius,
          isRecommended,
          isSelected,
        };
        specMap.set(child.id, spec);
      });
    });

    return Array.from(specMap.values());
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const targetCamPos = useRef(new THREE.Vector3(0, 0, 15.2));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (!reducedMotion && barrelGroupRef.current) {
      barrelGroupRef.current.rotation.z += delta * 0.42;
    }

    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.25 ? 1.25 / Math.max(0.68, aspect) : 1.0;
    const selected = wheels.find((w) => w.isSelected);
    // Keep the movement centered in the calibre frame; subtle parallax when inspecting a secondary wheel
    if (selected && !selected.isRecommended) {
      targetCamPos.current.set(selected.x * 0.12, selected.y * 0.12, 15.0 * pullback);
      targetLookAt.current.set(selected.x * 0.15, selected.y * 0.15, 0);
    } else {
      targetCamPos.current.set(0, 0, 15.2 * pullback);
      targetLookAt.current.set(0, 0, 0);
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.08;
    camera.position.lerp(targetCamPos.current, lerpFactor);
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);
    camera.lookAt(currentLookAt.current);
  });

  return (
    <group>
      <color attach="background" args={['#EAEAE4']} />
      <fog attach="fog" args={['#EAEAE4', 22, 48]} />

      <ambientLight intensity={0.88} color="#FFFFFF" />
      <directionalLight position={[10, 16, 18]} intensity={1.45} color="#FFFDF9" />
      <directionalLight position={[-12, -10, 10]} intensity={0.55} color="#D8DCE3" />

      {/* Outer Calibre Chapter Ring & Index Marks */}
      <mesh position={[0, 0, -0.7]}>
        <ringGeometry args={[6.6, 6.72, 120]} />
        <meshBasicMaterial color="#9E9C93" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.7]}>
        <ringGeometry args={[4.1, 4.16, 96]} />
        <meshBasicMaterial color="#B8B6AD" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.75]}>
        <circleGeometry args={[6.6, 96]} />
        <meshStandardMaterial color="#E2E2DC" roughness={0.75} metalness={0.12} />
      </mesh>

      {/* Central Mainspring Barrel (Present Decision Crossroads at Origin) */}
      <group position={[0, 0, -0.05]}>
        <group ref={barrelGroupRef}>
          <mesh>
            <ringGeometry args={[barrelRadius * 0.72, barrelRadius, 56]} />
            <meshStandardMaterial
              color="#141518"
              metalness={0.82}
              roughness={0.22}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, -0.03]}>
            <circleGeometry args={[barrelRadius * 0.72, 48]} />
            <meshStandardMaterial
              color="#D8D4C8"
              metalness={0.45}
              roughness={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((sIdx) => (
            <mesh
              key={sIdx}
              rotation={[0, 0, (sIdx * Math.PI * 2) / 6]}
              position={[0, 0, 0.01]}
            >
              <boxGeometry args={[barrelRadius * 1.44, 0.08, 0.06]} />
              <meshStandardMaterial color="#141518" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
          {barrelTeeth.map((ang, idx) => (
            <mesh
              key={idx}
              position={[
                Math.cos(ang) * (barrelRadius + 0.07),
                Math.sin(ang) * (barrelRadius + 0.07),
                0,
              ]}
              rotation={[0, 0, ang]}
            >
              <boxGeometry args={[0.16, 0.09, 0.1]} />
              <meshStandardMaterial color="#141518" metalness={0.84} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Central Origin Ruby Cap */}
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.2, 28]} />
          <meshStandardMaterial color="#B81D33" metalness={0.25} roughness={0.14} />
        </mesh>
      </group>

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
