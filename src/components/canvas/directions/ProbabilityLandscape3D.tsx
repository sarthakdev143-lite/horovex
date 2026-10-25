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
  angle: number;
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
  const { camera } = useThree();

  const activeBranches = useMemo(() => {
    const branches = nodes.filter((n) => n.parentId !== null && n.status !== 'pruned');
    return branches.sort((a, b) => a.siblingIndex - b.siblingIndex);
  }, [nodes]);

  const valleys: ValleySpec[] = useMemo(() => {
    const count = Math.max(1, activeBranches.length);
    return activeBranches.map((node, idx) => {
      const spread = count === 1 ? 0 : (idx / (count - 1)) * 2 - 1; // [-1, 1]
      const depthFactor = Math.max(1, node.depth);
      const angle = spread * 0.72;
      const dist = 11 + (depthFactor - 1) * 5.5 + (node.waveNumber - 1) * 2.2;
      const endX = Math.sin(angle) * dist * 1.15;
      const endZ = Math.cos(angle) * dist - 5.5;
      const prob = Math.max(0.03, Math.min(0.95, node.conditionalProbability));
      return {
        id: node.id,
        node,
        angle,
        endX,
        endZ,
        depth: 0.75 + prob * 6.2,
        width: 1.15 + prob * 2.6,
        isRecommended: goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath),
        isSelected: node.id === selectedNodeId,
      };
    });
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const gridSegs = 64;
  const planeWidth = 28;
  const planeDepth = 22;

  const { geometry, targetHeights } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeWidth, planeDepth, gridSegs, gridSegs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const heights = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Normalized progress from top ridge (z = -9) down to basin (z = +9)
      const t = Math.max(0, Math.min(1, (z + 9.5) / 19.0));
      // Base watershed slope: high pass at z = -9, gently sloping down
      let h = (1 - t) * 3.4 + Math.cos(x * 0.22) * 0.35;

      // Carve valleys for each branch
      for (const v of valleys) {
        const vx = v.endX * Math.pow(t, 0.88);
        const w = 0.55 + t * v.width;
        const dx = x - vx;
        const carve = v.depth * Math.exp(-(dx * dx) / (2 * w * w)) * Math.pow(t, 0.55);
        h -= carve;
      }

      heights[i] = h;
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    return { geometry: geo, targetHeights: heights };
  }, [valleys]);

  // Compute river spline along the recommended valley
  const riverCurve = useMemo(() => {
    const rec = valleys.find((v) => v.isRecommended) || valleys[0];
    if (!rec) return null;

    const points: THREE.Vector3[] = [];
    const steps = 28;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const z = -9.0 + t * 17.5;
      const x = rec.endX * Math.pow(t, 0.88);
      // Calculate exact terrain height at (x, z)
      let h = (1 - t) * 3.4 + Math.cos(x * 0.22) * 0.35;
      for (const v of valleys) {
        const vx = v.endX * Math.pow(t, 0.88);
        const w = 0.55 + t * v.width;
        const dx = x - vx;
        h -= v.depth * Math.exp(-(dx * dx) / (2 * w * w)) * Math.pow(t, 0.55);
      }
      points.push(new THREE.Vector3(x, h + 0.14, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, [valleys]);

  // Tributary curves for all other valleys
  const tributaryCurves = useMemo(() => {
    return valleys
      .filter((v) => !v.isRecommended)
      .map((v) => {
        const pts: THREE.Vector3[] = [];
        const steps = 20;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const z = -9.0 + t * 16.5;
          const x = v.endX * Math.pow(t, 0.88);
          let h = (1 - t) * 3.4 + Math.cos(x * 0.22) * 0.35;
          for (const other of valleys) {
            const vx = other.endX * Math.pow(t, 0.88);
            const w = 0.55 + t * other.width;
            const dx = x - vx;
            h -= other.depth * Math.exp(-(dx * dx) / (2 * w * w)) * Math.pow(t, 0.55);
          }
          pts.push(new THREE.Vector3(x, h + 0.08, z));
        }
        return { id: v.id, isSelected: v.isSelected, curve: new THREE.CatmullRomCurve3(pts) };
      });
  }, [valleys]);

  const targetCamPos = useRef(new THREE.Vector3(0, 14.5, 16.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.2, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.2, 0));

  useFrame(() => {
    const selectedValley = valleys.find((v) => v.isSelected);
    if (selectedValley) {
      targetCamPos.current.set(selectedValley.endX * 0.38, 12.8, 15.2);
      targetLookAt.current.set(selectedValley.endX * 0.45, -0.4, 1.2);
    } else {
      targetCamPos.current.set(0, 14.5, 16.5);
      targetLookAt.current.set(0, 0.2, 0);
    }

    const lerpFactor = reducedMotion ? 1.0 : 0.07;
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
          pos.setY(i, curY + (tgtY - curY) * (reducedMotion ? 1.0 : 0.12));
          changed = true;
        }
      }
      if (changed) {
        pos.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();
      }
    }
  });

  return (
    <group>
      <color attach="background" args={['#EAE8E3']} />
      <fog attach="fog" args={['#EAE8E3', 18, 42]} />

      <ambientLight intensity={0.78} color="#FAF7F0" />
      <directionalLight position={[12, 22, 10]} intensity={1.35} color="#FFFDF8" />
      <directionalLight position={[-14, 10, -8]} intensity={0.45} color="#D5CFC2" />

      {/* Main Sculpted Limestone Waddington Terrain */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#DDD7CA"
          roughness={0.88}
          metalness={0.04}
          flatShading={false}
        />
      </mesh>

      {/* Topographical Wireframe Overlay for Cartographic Contour Precision */}
      <mesh geometry={geometry} position={[0, 0.02, 0]}>
        <meshBasicMaterial
          color="#8C867A"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* Recommended Path River Line in Single Cartographic Cobalt Accent (#1456C8) */}
      {riverCurve && (
        <mesh>
          <tubeGeometry args={[riverCurve, 64, 0.24, 12, false]} />
          <meshStandardMaterial
            color="#1456C8"
            roughness={0.25}
            metalness={0.15}
          />
        </mesh>
      )}

      {/* Counterfactual Valley Channels in Muted Stone Ink */}
      {tributaryCurves.map((t) => (
        <mesh key={t.id}>
          <tubeGeometry args={[t.curve, 44, t.isSelected ? 0.16 : 0.09, 8, false]} />
          <meshStandardMaterial
            color={t.isSelected ? '#141413' : '#6E6A61'}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Interactive Valley Terminus Stones */}
      {valleys.map((v) => {
        const t = 0.82;
        const z = -9.0 + t * 17.5;
        const x = v.endX * Math.pow(t, 0.88);
        let h = (1 - t) * 3.4 + Math.cos(x * 0.22) * 0.35;
        for (const other of valleys) {
          const vx = other.endX * Math.pow(t, 0.88);
          const w = 0.55 + t * other.width;
          const dx = x - vx;
          h -= other.depth * Math.exp(-(dx * dx) / (2 * w * w)) * Math.pow(t, 0.55);
        }

        return (
          <group
            key={v.id}
            position={[x, h + 0.35, z]}
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
            <mesh>
              <cylinderGeometry
                args={[
                  v.isRecommended ? 0.52 : 0.38,
                  v.isRecommended ? 0.52 : 0.38,
                  v.isSelected ? 0.55 : 0.32,
                  24,
                ]}
              />
              <meshStandardMaterial
                color={v.isRecommended ? '#1456C8' : v.isSelected ? '#141413' : '#57534C'}
                roughness={0.35}
                metalness={0.15}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
