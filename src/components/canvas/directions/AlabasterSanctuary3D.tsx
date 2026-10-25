'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

export interface AlabasterSanctuarySceneProps {
  nodes: ProbabilityNode[];
  selectedNodeId: string | null;
  goldenPathIds: string[];
  onSelectNode: (id: string) => void;
  reducedMotion?: boolean;
  scrollProgress?: number;
  cameraMode?: 'scroll' | 'focus' | 'overview';
}

interface MonolithSpec {
  id: string;
  node: ProbabilityNode;
  startX: number;
  startZ: number;
  x: number;
  z: number;
  prob: number;
  height: number;
  width: number;
  valleyDepth: number;
  valleyWidth: number;
  isRecommended: boolean;
  isSelected: boolean;
}

const ORIGIN_Z = 6.5;
const WATER_Y = -0.35;

function MonolithSculpture({
  spec,
  onSelect,
  reducedMotion,
}: {
  spec: MonolithSpec;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ripple1Ref = useRef<THREE.Mesh>(null);
  const ripple2Ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const phaseOffset = useMemo(() => {
    let h = 0;
    for (let i = 0; i < spec.id.length; i++) {
      h = (h * 31 + spec.id.charCodeAt(i)) & 0xffff;
    }
    return (h / 0xffff) * Math.PI * 2;
  }, [spec.id]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + phaseOffset;

    if (groupRef.current) {
      const targetScaleY = 1.0;
      groupRef.current.scale.y = reducedMotion
        ? targetScaleY
        : THREE.MathUtils.damp(groupRef.current.scale.y, targetScaleY, 6, delta);
    }

    if (!reducedMotion && sphereRef.current) {
      sphereRef.current.position.y =
        0.38 + spec.height * 0.52 + Math.sin(t * 1.45) * 0.11;
      sphereRef.current.rotation.y = t * 0.5;
      sphereRef.current.rotation.x = Math.sin(t * 0.7) * 0.22;
    }

    if (!reducedMotion && ripple1Ref.current && ripple2Ref.current) {
      const cycle1 = (t * 0.32) % 1;
      const cycle2 = (t * 0.32 + 0.5) % 1;
      const s1 = 1.0 + cycle1 * 0.95;
      const s2 = 1.0 + cycle2 * 0.95;
      ripple1Ref.current.scale.set(s1, s1, 1);
      ripple2Ref.current.scale.set(s2, s2, 1);

      const mat1 = ripple1Ref.current.material as THREE.MeshBasicMaterial;
      const mat2 = ripple2Ref.current.material as THREE.MeshBasicMaterial;
      if (mat1) mat1.opacity = (1 - cycle1) * (spec.isRecommended ? 0.42 : 0.24);
      if (mat2) mat2.opacity = (1 - cycle2) * (spec.isRecommended ? 0.42 : 0.24);
    }
  });

  const bladeW = spec.width * 0.34;
  const slitGap = spec.width * 0.32;
  const bladeDepth = spec.width * 0.64;
  const rightBladeH = spec.height * 0.92;

  const mainStoneColor = spec.isRecommended
    ? '#F7F5F0'
    : spec.isSelected
    ? '#F5F3EE'
    : '#E6E1D5';

  const innerPortalColor = spec.isRecommended
    ? '#1E4D6B'
    : spec.isSelected
    ? '#161615'
    : '#7E796E';

  const lintelColor = spec.isRecommended
    ? '#C49A45'
    : spec.isSelected
    ? '#1E4D6B'
    : '#C8C1B2';

  const plinthColor = spec.isRecommended
    ? '#1E4D6B'
    : spec.isSelected
    ? '#26292C'
    : '#CFC9BC';

  const sphereColor = spec.isRecommended
    ? '#C49A45'
    : spec.isSelected
    ? '#1E4D6B'
    : '#2C5975';

  const sphereRadius = Math.max(0.16, spec.width * 0.2);

  return (
    <group
      position={[spec.x, WATER_Y, spec.z]}
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
      {/* Concentric Animated Water Ripples on Reflective Basin Surface */}
      <mesh
        ref={ripple1Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <ringGeometry args={[spec.width * 1.15, spec.width * 1.24, 48]} />
        <meshBasicMaterial
          color={spec.isRecommended ? '#1E4D6B' : '#8A98A0'}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={ripple2Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.025, 0]}
      >
        <ringGeometry args={[spec.width * 1.15, spec.width * 1.24, 48]} />
        <meshBasicMaterial
          color={spec.isRecommended ? '#C49A45' : '#8A98A0'}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Volumetric Overhead Skylight Shaft (God-Ray in Diffused Daylight) for Recommended or Selected Path */}
      {(spec.isRecommended || spec.isSelected) && (
        <group position={[0, 0, 0]}>
          <mesh
            position={[0.85, spec.height * 0.5 + 5.8, 0.45]}
            rotation={[0.06, 0, -0.12]}
          >
            <cylinderGeometry
              args={[
                spec.width * 0.55,
                spec.width * 2.15,
                14.5,
                32,
                1,
                true,
              ]}
            />
            <meshBasicMaterial
              color={spec.isRecommended ? '#FFFDF6' : '#F4F7F9'}
              transparent
              opacity={spec.isRecommended ? 0.15 : 0.11}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Soft Skylight Reflection Pool on Water Surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <circleGeometry args={[spec.width * 1.85, 40]} />
            <meshBasicMaterial
              color={spec.isRecommended ? '#C49A45' : '#1E4D6B'}
              transparent
              opacity={spec.isRecommended ? 0.22 : 0.16}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <group ref={groupRef}>
        {/* Stepped Octagonal Travertine Plinth Submerged in Water */}
        <mesh position={[0, 0.11, 0]} receiveShadow castShadow>
          <cylinderGeometry
            args={[spec.width * 1.26, spec.width * 1.42, 0.22, 8]}
          />
          <meshPhysicalMaterial
            color={plinthColor}
            roughness={0.46}
            metalness={0.12}
            clearcoat={0.2}
          />
        </mesh>

        <mesh position={[0, 0.29, 0]} receiveShadow castShadow>
          <cylinderGeometry
            args={[spec.width * 0.96, spec.width * 1.08, 0.18, 8]}
          />
          <meshPhysicalMaterial
            color={mainStoneColor}
            roughness={0.52}
            metalness={0.04}
            clearcoat={0.15}
          />
        </mesh>

        {/* Left Alabaster Portal Blade */}
        <mesh
          position={[-(slitGap * 0.5 + bladeW * 0.5), 0.38 + spec.height * 0.5, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[bladeW, spec.height, bladeDepth]} />
          <meshPhysicalMaterial
            color={mainStoneColor}
            roughness={0.5}
            metalness={0.03}
            clearcoat={0.18}
          />
        </mesh>

        {/* Left Blade Inner Mineral Portal Facing */}
        <mesh
          position={[-(slitGap * 0.5 + 0.025), 0.38 + spec.height * 0.5, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.05, spec.height * 0.98, bladeDepth * 0.92]} />
          <meshStandardMaterial
            color={innerPortalColor}
            roughness={0.35}
            metalness={0.22}
          />
        </mesh>

        {/* Right Alabaster Portal Blade (Asymmetric Chillida/Ando Proportion) */}
        <mesh
          position={[slitGap * 0.5 + bladeW * 0.5, 0.38 + rightBladeH * 0.5, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[bladeW, rightBladeH, bladeDepth]} />
          <meshPhysicalMaterial
            color={mainStoneColor}
            roughness={0.5}
            metalness={0.03}
            clearcoat={0.18}
          />
        </mesh>

        {/* Right Blade Inner Mineral Portal Facing */}
        <mesh
          position={[slitGap * 0.5 + 0.025, 0.38 + rightBladeH * 0.5, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.05, rightBladeH * 0.98, bladeDepth * 0.92]} />
          <meshStandardMaterial
            color={innerPortalColor}
            roughness={0.35}
            metalness={0.22}
          />
        </mesh>

        {/* Cantilevered Upper Stone / Bronze Lintel Bridge */}
        <mesh
          position={[0.04, 0.38 + spec.height * 0.77, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[
              spec.width * 1.48,
              Math.max(0.18, spec.height * 0.065),
              bladeDepth * 1.16,
            ]}
          />
          <meshStandardMaterial
            color={lintelColor}
            roughness={spec.isRecommended ? 0.26 : 0.48}
            metalness={spec.isRecommended ? 0.52 : 0.12}
          />
        </mesh>

        {/* Lower Architectural Threshold Sill */}
        <mesh
          position={[0, 0.38 + spec.height * 0.16, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[spec.width * 1.12, 0.12, bladeDepth * 0.86]}
          />
          <meshStandardMaterial
            color={innerPortalColor}
            roughness={0.42}
            metalness={0.18}
          />
        </mesh>

        {/* Levitating Mineral / Champagne Bronze Sphere Suspended in Portal Slit */}
        <mesh
          ref={sphereRef}
          position={[0, 0.38 + spec.height * 0.52, 0]}
          castShadow
        >
          <sphereGeometry args={[sphereRadius, 32, 32]} />
          <meshPhysicalMaterial
            color={sphereColor}
            roughness={0.16}
            metalness={spec.isRecommended ? 0.68 : 0.38}
            clearcoat={0.85}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function AlabasterSanctuary3D({
  nodes,
  selectedNodeId,
  goldenPathIds,
  onSelectNode,
  reducedMotion = false,
  scrollProgress = 0,
  cameraMode = 'scroll',
}: AlabasterSanctuarySceneProps) {
  const terrainRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const mistGroupRef = useRef<THREE.Group>(null);
  const originOrbRef = useRef<THREE.Mesh>(null);
  const { camera, size } = useThree();

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        if (a.waveNumber !== b.waveNumber) return a.waveNumber - b.waveNumber;
        return a.siblingIndex - b.siblingIndex;
      });
  }, [nodes]);

  // Build spatial coordinates for all Depth 1 (Wave 1 + Wave 2+) and Depth 2+ monoliths
  const monoliths: MonolithSpec[] = useMemo(() => {
    const specMap = new Map<string, MonolithSpec>();
    const depth1 = activeBranches.filter((n) => n.depth === 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);

    const d1Count = Math.max(1, depth1.length);
    depth1.forEach((node, idx) => {
      const spread = d1Count === 1 ? 0 : (idx / (d1Count - 1)) * 2 - 1; // [-1, 1]
      const maxSpreadX = d1Count > 5 ? 7.6 : 6.4;
      const x = spread * maxSpreadX;
      // Amphitheater arc from z = -0.8 out into the mist at z = -4.2
      const z =
        -1.0 -
        (node.waveNumber - 1) * 2.4 -
        Math.abs(spread) * 1.35;
      const prob = Math.max(0.04, Math.min(0.92, node.conditionalProbability));

      const spec: MonolithSpec = {
        id: node.id,
        node,
        startX: 0,
        startZ: ORIGIN_Z,
        x,
        z,
        prob,
        height: 1.75 + prob * 6.4,
        width: 0.72 + prob * 1.05,
        valleyDepth: 0.95 + prob * 2.4,
        valleyWidth: 1.15 + prob * 1.65,
        isRecommended:
          goldenPathIds.includes(node.id) || Boolean(node.isGoldenPath),
        isSelected: node.id === selectedNodeId,
      };
      specMap.set(node.id, spec);
    });

    // Group Depth 2+ downstream branches by parentId so they rise further down the canyon
    const byParent = new Map<string, ProbabilityNode[]>();
    deeper.forEach((node) => {
      const pid = node.parentId || '';
      const list = byParent.get(pid) || [];
      list.push(node);
      byParent.set(pid, list);
    });

    byParent.forEach((children, pid) => {
      const parentSpec = specMap.get(pid);
      const startX = parentSpec ? parentSpec.x : 0;
      const startZ = parentSpec ? parentSpec.z : -1.2;
      const cCount = Math.max(1, children.length);

      children.forEach((child, cIdx) => {
        const localSpread = cCount === 1 ? 0 : (cIdx / (cCount - 1)) * 2 - 1;
        const rawX = startX + localSpread * 4.0;
        const x = Math.max(-8.8, Math.min(8.8, rawX));
        const z =
          startZ -
          4.5 -
          (child.depth - 2) * 3.4 -
          Math.abs(localSpread) * 0.7;
        const prob = Math.max(
          0.04,
          Math.min(0.92, child.conditionalProbability)
        );

        const spec: MonolithSpec = {
          id: child.id,
          node: child,
          startX,
          startZ,
          x,
          z,
          prob,
          height: 1.45 + prob * 5.2,
          width: 0.62 + prob * 0.85,
          valleyDepth: 0.8 + prob * 1.8,
          valleyWidth: 0.95 + prob * 1.3,
          isRecommended:
            goldenPathIds.includes(child.id) || Boolean(child.isGoldenPath),
          isSelected: child.id === selectedNodeId,
        };
        specMap.set(child.id, spec);
      });
    });

    return Array.from(specMap.values());
  }, [activeBranches, goldenPathIds, selectedNodeId]);

  const recommendedMonolith = useMemo(
    () => monoliths.find((m) => m.isRecommended) || monoliths[0] || null,
    [monoliths]
  );

  const selectedMonolith = useMemo(
    () => monoliths.find((m) => m.isSelected) || recommendedMonolith,
    [monoliths, recommendedMonolith]
  );

  // Sculpted Alabaster Marble & Stepped Travertine Terrain Evaluator
  const evalTerrainHeight = useMemo(() => {
    return (x: number, z: number) => {
      // Base amphitheater bowl: high flanking ridges on left/right and far horizon, sloping from Origin Sanctuary Pass
      const distFromOriginPass = Math.hypot(x * 0.75, z - ORIGIN_Z);
      const originMound = Math.exp(-(distFromOriginPass * distFromOriginPass) / 9.5) * 1.25;

      // Flanking marble ridges on outer perimeter
      const lateralRidge = Math.pow(Math.max(0, (Math.abs(x) - 3.2) / 14.0), 1.45) * 3.8;
      const horizonRidge =
        z < -6.5 ? Math.pow(Math.min(1, (-6.5 - z) / 16.0), 1.6) * 3.2 : 0;
      const foregroundSlope =
        z > ORIGIN_Z ? Math.min(1.4, (z - ORIGIN_Z) * 0.18) : 0;

      let h =
        0.18 +
        originMound +
        lateralRidge +
        horizonRidge +
        foregroundSlope +
        Math.cos(x * 0.35 + z * 0.22) * 0.14;

      // Carve smooth radiating valleys from Origin Pass to each monolith's water basin
      for (const m of monoliths) {
        const zMin = Math.min(m.startZ, m.z);
        const zMax = Math.max(m.startZ, m.z);
        const spanZ = Math.max(1.5, zMax - zMin);
        if (z > zMax + 1.6 || z < zMin - 2.8) continue;

        // Progress from startZ (6.5) down to m.z (-1..-10)
        const localT = Math.max(0, Math.min(1, (m.startZ - z) / spanZ));
        const easeT = localT * localT * (3 - 2 * localT);
        const meander = Math.sin(localT * Math.PI) * (m.x - m.startX) * 0.08;
        const vx = m.startX + (m.x - m.startX) * easeT + meander;
        const vw = 0.65 + localT * m.valleyWidth;
        const dx = x - vx;

        const zEnv =
          z >= m.z
            ? Math.pow(localT, 0.48)
            : Math.exp(-Math.pow((m.z - z) / 2.2, 2));

        const carve = m.valleyDepth * Math.exp(-(dx * dx) / (2 * vw * vw)) * zEnv;
        h -= carve;
      }

      // Subtle architectural stepped travertine terraces on positive elevations
      if (h > -0.15) {
        const terraceFreq = 3.2;
        const stepped = Math.floor(h * terraceFreq) / terraceFreq;
        const frac = h * terraceFreq - Math.floor(h * terraceFreq);
        const smoothStep = stepped + Math.pow(frac, 1.85) / terraceFreq;
        h = h * 0.52 + smoothStep * 0.48;
      }

      return Math.max(-0.85, h);
    };
  }, [monoliths]);

  const gridSegs = 148;
  const planeW = 68;
  const planeD = 54;

  const { terrainGeometry, targetTerrainHeights } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeW, planeD, gridSegs, gridSegs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const heights = new Float32Array(pos.count);
    const colors = new Float32Array(pos.count * 3);

    const highMarble = new THREE.Color('#F5F3EE');
    const midTravertine = new THREE.Color('#EAE6DC');
    const valleyStone = new THREE.Color('#D5CFC1');
    const riserInk = new THREE.Color('#B5AEA0');
    const veinColor = new THREE.Color('#DFDBD0');
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = evalTerrainHeight(x, z);
      heights[i] = h;
      pos.setY(i, h);

      const elevNorm = Math.max(0, Math.min(1, (h + 0.6) / 3.8));
      if (elevNorm < 0.45) {
        tmp.lerpColors(valleyStone, midTravertine, elevNorm / 0.45);
      } else {
        tmp.lerpColors(midTravertine, highMarble, (elevNorm - 0.45) / 0.55);
      }

      // Subtle Carrara marble veining
      const vein = Math.sin(x * 0.85 + Math.cos(z * 0.65) * 2.2 + h * 1.8);
      if (vein > 0.78) {
        tmp.lerp(veinColor, 0.35);
      }

      // Travertine contour step riser lines
      const terracePhase = Math.abs(((h + 4.0) * 3.2) % 1 - 0.5);
      if (h > -0.2 && terracePhase < 0.065) {
        tmp.lerp(riserInk, 0.42);
      }

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { terrainGeometry: geo, targetTerrainHeights: heights };
  }, [evalTerrainHeight]);

  // Specular Reflective Water Basin Geometry
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 50, 72, 72);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Luminous Water-Stream Ribbons Flowing from Origin Sanctuary into Each Monolith's Basin
  const streamCurves = useMemo(() => {
    return monoliths.map((m) => {
      const pts: THREE.Vector3[] = [];
      const steps = 32;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const z = m.startZ + t * (m.z - m.startZ);
        const easeT = t * t * (3 - 2 * t);
        const meander = Math.sin(t * Math.PI) * (m.x - m.startX) * 0.08;
        const x = m.startX + (m.x - m.startX) * easeT + meander;
        const terrainY = evalTerrainHeight(x, z);
        const y = Math.max(WATER_Y + 0.04, terrainY + 0.06);
        pts.push(new THREE.Vector3(x, y, z));
      }
      return {
        id: m.id,
        isRecommended: m.isRecommended,
        isSelected: m.isSelected,
        curve: new THREE.CatmullRomCurve3(pts),
      };
    });
  }, [monoliths, evalTerrainHeight]);

  // Soft Procedural Radial Cloud Alpha Texture for Drifting Mist Veils
  const mistTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(246, 244, 239, 0.55)');
      grad.addColorStop(0.5, 'rgba(243, 241, 236, 0.24)');
      grad.addColorStop(1, 'rgba(243, 241, 236, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const mistVeils = useMemo(
    () => [
      { x: -4.2, y: 0.12, z: 1.8, sx: 11, sy: 4.5, speed: 0.18, phase: 0.2 },
      { x: 3.6, y: 0.18, z: 0.4, sx: 12, sy: 5.0, speed: -0.15, phase: 1.4 },
      { x: -1.5, y: 0.15, z: -2.4, sx: 14, sy: 5.5, speed: 0.12, phase: 2.7 },
      { x: 4.8, y: 0.22, z: -4.2, sx: 13, sy: 4.8, speed: -0.16, phase: 3.9 },
      { x: -5.4, y: 0.25, z: -5.6, sx: 15, sy: 6.0, speed: 0.14, phase: 5.1 },
      { x: 0.8, y: 0.28, z: -7.5, sx: 18, sy: 6.5, speed: -0.11, phase: 0.9 },
    ],
    []
  );

  // Camera Choreography State (Scroll Spline + Fly-To-Monolith Mode)
  const targetCamPos = useRef(new THREE.Vector3(0, 5.2, 12.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.7, -2.0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.7, -2.0));

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.2 ? 1.22 / Math.max(0.68, aspect) : 1.0;

    // 1. Determine Target Camera Position & LookAt from Camera Mode
    if (cameraMode === 'focus' && selectedMonolith) {
      // Fly-To-Monolith Mode: physically glide down over the water pool to frame the selected portal
      const sideOffset = selectedMonolith.x >= 0 ? -1.9 : 1.9;
      targetCamPos.current.set(
        selectedMonolith.x * 0.78 + sideOffset,
        WATER_Y + 2.15 * pullback,
        selectedMonolith.z + 4.6 * pullback
      );
      targetLookAt.current.set(
        selectedMonolith.x,
        WATER_Y + Math.min(2.1, selectedMonolith.height * 0.46),
        selectedMonolith.z
      );
    } else if (cameraMode === 'overview') {
      // Panoramic Sanctuary Overview
      const hasDeep = monoliths.some((m) => m.node.depth > 1);
      targetCamPos.current.set(
        0,
        (hasDeep ? 5.2 : 4.3) * pullback,
        (hasDeep ? 10.2 : 11.2) * pullback
      );
      targetLookAt.current.set(0, hasDeep ? 0.2 : -0.45, hasDeep ? -3.2 : -1.5);
    } else {
      // Scroll Journey Mode: 4-stage cinematic spline across [0..1]
      const s = Math.max(0, Math.min(1, scrollProgress));
      const rec = recommendedMonolith || {
        x: -1.6,
        z: -1.6,
        height: 3.8,
      };

      // Stage 0 (scroll 0.00): High sanctuary vista with the 5 portals framed in the upper half of the viewport
      const p0 = new THREE.Vector3(0, 4.35 * pullback, 11.4 * pullback);
      const l0 = new THREE.Vector3(0, -0.55, -1.4);

      // Stage 1 (scroll 0.33): Gliding over the bifurcation water basin
      const p1 = new THREE.Vector3(-2.4, 3.2 * pullback, 7.2 * pullback);
      const l1 = new THREE.Vector3(0.3, 0.35, -1.8);

      // Stage 2 (scroll 0.66): Low sweep up to the Recommended Path portal & skylight shaft
      const p2 = new THREE.Vector3(
        rec.x * 0.65 + 1.7,
        2.05 * pullback,
        rec.z + 4.6 * pullback
      );
      const l2 = new THREE.Vector3(rec.x, 1.25, rec.z);

      // Stage 3 (scroll 1.00): Interactive sanctuary amphitheater vantage
      const p3 = new THREE.Vector3(0, 4.1 * pullback, 9.6 * pullback);
      const l3 = new THREE.Vector3(0, 0.45, -2.0);

      if (s < 0.333) {
        const u = s / 0.333;
        const ease = u * u * (3 - 2 * u);
        targetCamPos.current.lerpVectors(p0, p1, ease);
        targetLookAt.current.lerpVectors(l0, l1, ease);
      } else if (s < 0.666) {
        const u = (s - 0.333) / 0.333;
        const ease = u * u * (3 - 2 * u);
        targetCamPos.current.lerpVectors(p1, p2, ease);
        targetLookAt.current.lerpVectors(l1, l2, ease);
      } else {
        const u = (s - 0.666) / 0.334;
        const ease = u * u * (3 - 2 * u);
        targetCamPos.current.lerpVectors(p2, p3, ease);
        targetLookAt.current.lerpVectors(l2, l3, ease);
      }
    }

    if (reducedMotion) {
      camera.position.copy(targetCamPos.current);
      currentLookAt.current.copy(targetLookAt.current);
    } else {
      const dampLambda = 4.2;
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        targetCamPos.current.x,
        dampLambda,
        delta
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        targetCamPos.current.y,
        dampLambda,
        delta
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetCamPos.current.z,
        dampLambda,
        delta
      );

      currentLookAt.current.x = THREE.MathUtils.damp(
        currentLookAt.current.x,
        targetLookAt.current.x,
        dampLambda,
        delta
      );
      currentLookAt.current.y = THREE.MathUtils.damp(
        currentLookAt.current.y,
        targetLookAt.current.y,
        dampLambda,
        delta
      );
      currentLookAt.current.z = THREE.MathUtils.damp(
        currentLookAt.current.z,
        targetLookAt.current.z,
        dampLambda,
        delta
      );
    }
    camera.lookAt(currentLookAt.current);

    // 2. Smoothly morph terrain heights when probabilities or waves change
    if (terrainRef.current) {
      const pos = terrainRef.current.geometry.attributes.position;
      let changed = false;
      for (let i = 0; i < pos.count; i++) {
        const curY = pos.getY(i);
        const tgtY = targetTerrainHeights[i] ?? curY;
        if (Math.abs(curY - tgtY) > 0.004) {
          pos.setY(i, curY + (tgtY - curY) * (reducedMotion ? 1.0 : 0.14));
          changed = true;
        }
      }
      if (changed) {
        pos.needsUpdate = true;
        terrainRef.current.geometry.computeVertexNormals();
      }
    }

    // 3. Subtle harmonic water surface ripples around monolith basins
    if (!reducedMotion && waterRef.current) {
      const wPos = waterRef.current.geometry.attributes.position;
      for (let i = 0; i < wPos.count; i++) {
        const wx = wPos.getX(i);
        const wz = wPos.getZ(i);
        const wave =
          Math.sin(wx * 1.35 + t * 1.6) * 0.014 +
          Math.cos(wz * 1.65 - t * 1.3) * 0.012;
        wPos.setY(i, wave);
      }
      wPos.needsUpdate = true;
    }

    // 4. Drift atmospheric mist veils slowly across the water basin
    if (!reducedMotion && mistGroupRef.current) {
      mistGroupRef.current.children.forEach((child, idx) => {
        const spec = mistVeils[idx];
        if (spec) {
          child.position.x =
            spec.x + Math.sin(t * spec.speed + spec.phase) * 1.45;
        }
      });
    }

    // 5. Gently levitate Origin Sanctuary Ocular Sphere
    if (!reducedMotion && originOrbRef.current) {
      originOrbRef.current.position.y = 1.05 + Math.sin(t * 1.4) * 0.07;
      originOrbRef.current.rotation.y = t * 0.45;
    }
  });

  const originTerrainY = evalTerrainHeight(0, ORIGIN_Z);

  return (
    <group>
      {/* Luminous Diffused Alabaster Daylight Sky & Mist Horizon */}
      <color attach="background" args={['#ECEBE6']} />
      <fogExp2 attach="fog" args={['#ECEBE6', 0.022]} />

      {/* Diffused Zenith Skylight + Warm Architectural Sun Shaft Key Light */}
      <hemisphereLight
        color="#FAF8F4"
        groundColor="#C9C2B4"
        intensity={0.68}
      />
      <directionalLight
        position={[15, 25, 11]}
        intensity={1.85}
        color="#FFF9EB"
        castShadow
      />
      <directionalLight
        position={[-14, 12, -10]}
        intensity={0.55}
        color="#C9D8E2"
      />

      {/* Sculpted Alabaster & Stepped Travertine Marble Topography */}
      <mesh ref={terrainRef} geometry={terrainGeometry} receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.58}
          metalness={0.02}
          clearcoat={0.15}
          clearcoatRoughness={0.38}
        />
      </mesh>

      {/* Specular Reflective Water Basin at Valley Floor */}
      <mesh
        ref={waterRef}
        geometry={waterGeometry}
        position={[0, WATER_Y, -2.0]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#DCE3E6"
          roughness={0.05}
          metalness={0.14}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          reflectivity={0.95}
        />
      </mesh>

      {/* Origin Sanctuary Threshold Pass (Present Decision Ocular Gate at [0, y, 6.5]) */}
      <group position={[0, originTerrainY, ORIGIN_Z]}>
        {/* Stepped Octagonal Travertine Sanctuary Terrace */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.45, 1.65, 0.2, 8]} />
          <meshPhysicalMaterial
            color="#EAE6DC"
            roughness={0.5}
            metalness={0.04}
            clearcoat={0.16}
          />
        </mesh>
        <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.05, 1.18, 0.16, 8]} />
          <meshStandardMaterial
            color="#1E4D6B"
            roughness={0.35}
            metalness={0.22}
          />
        </mesh>

        {/* Sculpted Origin Ocular Arch Ring */}
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <torusGeometry args={[0.64, 0.085, 24, 64]} />
          <meshPhysicalMaterial
            color="#F5F3EE"
            roughness={0.42}
            metalness={0.06}
            clearcoat={0.25}
          />
        </mesh>

        {/* Suspended Champagne Bronze Origin Decision Sphere */}
        <mesh ref={originOrbRef} position={[0, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.21, 32, 32]} />
          <meshPhysicalMaterial
            color="#C49A45"
            roughness={0.18}
            metalness={0.68}
            clearcoat={0.85}
          />
        </mesh>

        {/* Overhead Skylight Shaft on Origin Sanctuary */}
        <mesh position={[0.4, 5.8, 0.2]} rotation={[0.05, 0, -0.08]}>
          <cylinderGeometry args={[0.42, 1.85, 12, 32, 1, true]} />
          <meshBasicMaterial
            color="#FFFDF7"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Flowing Water-Stream Ribbons from Origin Pass into Each Monolith Basin */}
      {streamCurves.map((s) => (
        <group key={`stream-${s.id}`}>
          <mesh scale={[1.6, 0.22, 1]}>
            <tubeGeometry
              args={[
                s.curve,
                56,
                s.isRecommended ? 0.24 : s.isSelected ? 0.16 : 0.1,
                12,
                false,
              ]}
            />
            <meshPhysicalMaterial
              color={
                s.isRecommended
                  ? '#1E4D6B'
                  : s.isSelected
                  ? '#2B3E4C'
                  : '#8B99A1'
              }
              roughness={0.08}
              metalness={0.22}
              clearcoat={1.0}
              clearcoatRoughness={0.06}
            />
          </mesh>

          {/* Champagne Bronze Aqueduct Rim Along Recommended Path Stream */}
          {s.isRecommended && (
            <mesh position={[0, 0.015, 0]} scale={[1.95, 0.12, 1]}>
              <tubeGeometry args={[s.curve, 56, 0.27, 10, false]} />
              <meshStandardMaterial
                color="#C49A45"
                roughness={0.28}
                metalness={0.55}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Architectural Twin-Blade Portal Monoliths Rising from Water Basins */}
      {monoliths.map((spec) => (
        <MonolithSculpture
          key={spec.id}
          spec={spec}
          onSelect={() => onSelectNode(spec.id)}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Drifting Atmospheric Mist Veils Across the Water Basins */}
      {mistTexture && (
        <group ref={mistGroupRef}>
          {mistVeils.map((m, idx) => (
            <mesh
              key={idx}
              position={[m.x, m.y, m.z]}
              rotation={[-Math.PI / 2 + 0.12, 0, 0]}
            >
              <planeGeometry args={[m.sx, m.sy]} />
              <meshBasicMaterial
                map={mistTexture}
                transparent
                opacity={0.42}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
