'use client';

import React, { useEffect, useMemo, useRef } from 'react';
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

interface MonolithCoord {
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
}

interface MonolithSpec extends MonolithCoord {
  isRecommended: boolean;
  isSelected: boolean;
}

const ORIGIN_Z = 6.5;
const WATER_Y = -0.35;

function MonolithSculpture({
  spec,
  skylightTexture,
  onSelect,
  reducedMotion,
}: {
  spec: MonolithSpec;
  skylightTexture: THREE.CanvasTexture | null;
  onSelect: () => void;
  reducedMotion: boolean;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ripple1Ref = useRef<THREE.Mesh>(null);
  const ripple2Ref = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const riseRef = useRef<number>(reducedMotion ? 1.0 : 0.08);
  const currentHeightRef = useRef<number>(spec.height);
  const currentWidthRef = useRef<number>(spec.width);

  const phaseOffset = useMemo(() => {
    let h = 0;
    for (let i = 0; i < spec.id.length; i++) {
      h = (h * 31 + spec.id.charCodeAt(i)) & 0xffff;
    }
    return (h / 0xffff) * Math.PI * 2;
  }, [spec.id]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + phaseOffset;

    if (reducedMotion) {
      riseRef.current = 1.0;
      currentHeightRef.current = spec.height;
      currentWidthRef.current = spec.width;
    } else {
      riseRef.current = THREE.MathUtils.damp(riseRef.current, 1.0, 5.2, delta);
      currentHeightRef.current = THREE.MathUtils.damp(
        currentHeightRef.current,
        spec.height,
        6.5,
        delta
      );
      currentWidthRef.current = THREE.MathUtils.damp(
        currentWidthRef.current,
        spec.width,
        6.5,
        delta
      );
    }

    if (groupRef.current) {
      const hRatio = currentHeightRef.current / Math.max(0.5, spec.height);
      const wRatio = currentWidthRef.current / Math.max(0.3, spec.width);
      groupRef.current.scale.set(wRatio, Math.max(0.05, riseRef.current * hRatio), wRatio);
    }

    if (!reducedMotion && sphereRef.current) {
      sphereRef.current.position.y =
        0.38 + spec.height * 0.52 + Math.sin(t * 1.45) * 0.1;
      sphereRef.current.rotation.y = t * 0.5;
      sphereRef.current.rotation.x = Math.sin(t * 0.7) * 0.2;
    }

    if (!reducedMotion && ripple1Ref.current && ripple2Ref.current) {
      const cycle1 = (t * 0.3) % 1;
      const cycle2 = (t * 0.3 + 0.5) % 1;
      const baseR = spec.width;
      const s1 = baseR * (1.0 + cycle1 * 0.92);
      const s2 = baseR * (1.0 + cycle2 * 0.92);
      ripple1Ref.current.scale.set(s1, s1, 1);
      ripple2Ref.current.scale.set(s2, s2, 1);

      const mat1 = ripple1Ref.current.material as THREE.MeshBasicMaterial;
      const mat2 = ripple2Ref.current.material as THREE.MeshBasicMaterial;
      if (mat1) mat1.opacity = (1 - cycle1) * (spec.isRecommended ? 0.38 : 0.22);
      if (mat2) mat2.opacity = (1 - cycle2) * (spec.isRecommended ? 0.38 : 0.22);
    }
  });

  const bladeW = spec.width * 0.33;
  const slitGap = spec.width * 0.34;
  const bladeDepth = spec.width * 0.62;
  const rightBladeH = spec.height * 0.91;

  const mainStoneColor = spec.isRecommended
    ? '#F7F5F0'
    : spec.isSelected
    ? '#F5F3EE'
    : '#E7E2D6';

  const innerPortalColor = spec.isRecommended
    ? '#1E4D6B'
    : spec.isSelected
    ? '#161615'
    : '#787368';

  const lintelColor = spec.isRecommended
    ? '#C49A45'
    : spec.isSelected
    ? '#1E4D6B'
    : '#C7C0B1';

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
        scale={[spec.width, spec.width, 1]}
      >
        <ringGeometry args={[1.15, 1.23, 48]} />
        <meshBasicMaterial
          color={spec.isRecommended ? '#1E4D6B' : '#8A98A0'}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={ripple2Ref}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.025, 0]}
        scale={[spec.width, spec.width, 1]}
      >
        <ringGeometry args={[1.15, 1.23, 48]} />
        <meshBasicMaterial
          color={spec.isRecommended ? '#C49A45' : '#8A98A0'}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Volumetric Overhead Skylight Shaft (Soft Gradient Falloff) for Recommended or Selected Path */}
      {(spec.isRecommended || spec.isSelected) && (
        <group position={[0, 0, 0]}>
          <mesh
            position={[0.65, spec.height * 0.5 + 5.2, 0.3]}
            rotation={[0.05, 0, -0.1]}
            scale={[spec.width * 3.1, 13.5, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={skylightTexture ?? undefined}
              color={spec.isRecommended ? '#FFFDF6' : '#F2F6F8'}
              transparent
              opacity={spec.isRecommended ? 0.34 : 0.24}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[0.65, spec.height * 0.5 + 5.2, 0.3]}
            rotation={[0.05, Math.PI / 2, -0.1]}
            scale={[spec.width * 3.1, 13.5, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={skylightTexture ?? undefined}
              color={spec.isRecommended ? '#FFFDF6' : '#F2F6F8'}
              transparent
              opacity={spec.isRecommended ? 0.28 : 0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Soft Skylight Reflection Pool on Water Surface */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.015, 0]}
            scale={[spec.width * 1.8, spec.width * 1.8, 1]}
          >
            <circleGeometry args={[1, 40]} />
            <meshBasicMaterial
              color={spec.isRecommended ? '#C49A45' : '#1E4D6B'}
              transparent
              opacity={spec.isRecommended ? 0.2 : 0.14}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <group ref={groupRef}>
        {/* Stepped Octagonal Travertine Plinth Submerged in Water */}
        <mesh
          position={[0, 0.11, 0]}
          scale={[spec.width, 1, spec.width]}
          receiveShadow
          castShadow
        >
          <cylinderGeometry args={[1.25, 1.4, 0.22, 8]} />
          <meshPhysicalMaterial
            color={plinthColor}
            roughness={0.46}
            metalness={0.12}
            clearcoat={0.2}
          />
        </mesh>

        <mesh
          position={[0, 0.29, 0]}
          scale={[spec.width, 1, spec.width]}
          receiveShadow
          castShadow
        >
          <cylinderGeometry args={[0.95, 1.07, 0.18, 8]} />
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
          scale={[bladeW, spec.height, bladeDepth]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={mainStoneColor}
            roughness={0.5}
            metalness={0.03}
            clearcoat={0.18}
          />
        </mesh>

        {/* Left Blade Inner Mineral Portal Facing (Offset cleanly inside slit to prevent coplanar z-fighting) */}
        <mesh
          position={[-(slitGap * 0.5 - 0.019), 0.38 + spec.height * 0.5, 0]}
          scale={[0.034, spec.height * 0.96, bladeDepth * 0.86]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={innerPortalColor}
            roughness={0.35}
            metalness={0.22}
          />
        </mesh>

        {/* Right Alabaster Portal Blade (Asymmetric Chillida/Ando Proportion) */}
        <mesh
          position={[slitGap * 0.5 + bladeW * 0.5, 0.38 + rightBladeH * 0.5, 0]}
          scale={[bladeW, rightBladeH, bladeDepth]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={mainStoneColor}
            roughness={0.5}
            metalness={0.03}
            clearcoat={0.18}
          />
        </mesh>

        {/* Right Blade Inner Mineral Portal Facing (Offset cleanly inside slit to prevent coplanar z-fighting) */}
        <mesh
          position={[slitGap * 0.5 - 0.019, 0.38 + rightBladeH * 0.5, 0]}
          scale={[0.034, rightBladeH * 0.96, bladeDepth * 0.86]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={innerPortalColor}
            roughness={0.35}
            metalness={0.22}
          />
        </mesh>

        {/* Cantilevered Upper Stone / Bronze Lintel Bridge */}
        <mesh
          position={[0.04, 0.38 + spec.height * 0.77, 0]}
          scale={[
            spec.width * 1.48,
            Math.max(0.18, spec.height * 0.065),
            bladeDepth * 1.18,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={lintelColor}
            roughness={spec.isRecommended ? 0.26 : 0.48}
            metalness={spec.isRecommended ? 0.52 : 0.12}
          />
        </mesh>

        {/* Lower Architectural Threshold Sill */}
        <mesh
          position={[0, 0.38 + spec.height * 0.16, 0]}
          scale={[spec.width * 1.14, 0.12, bladeDepth * 0.82]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
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
          scale={[sphereRadius, sphereRadius, sphereRadius]}
          castShadow
        >
          <sphereGeometry args={[1, 32, 32]} />
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

  // 1. Spatial coordinates & valley geometry (independent of selectedNodeId so clicking a portal never recomputes terrain!)
  const monolithCoords: MonolithCoord[] = useMemo(() => {
    const coordMap = new Map<string, MonolithCoord>();
    const depth1 = activeBranches.filter((n) => n.depth === 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);

    // Group Depth-1 branches by waveNumber so Wave 1 stays symmetrically anchored while Wave 2+ rises in a wider outer amphitheater arc
    const byWave = new Map<number, ProbabilityNode[]>();
    depth1.forEach((node) => {
      const w = node.waveNumber || 1;
      const list = byWave.get(w) || [];
      list.push(node);
      byWave.set(w, list);
    });

    byWave.forEach((waveNodes, waveNum) => {
      const wCount = Math.max(1, waveNodes.length);
      const maxSpreadX = waveNum === 1 ? 6.3 : 7.6 + (waveNum - 2) * 1.0;
      const waveStaggerX = waveNum > 1 ? (waveNum % 2 === 0 ? 0.38 : -0.38) : 0;

      waveNodes.forEach((node, idx) => {
        const spread = wCount === 1 ? 0 : (idx / (wCount - 1)) * 2 - 1; // [-1, 1] per wave
        const x = spread * maxSpreadX + waveStaggerX;
        const z =
          -1.05 -
          (waveNum - 1) * 3.1 -
          Math.abs(spread) * (waveNum === 1 ? 1.35 : 1.5);
        const prob = Math.max(0.04, Math.min(0.92, node.conditionalProbability));

        const coord: MonolithCoord = {
          id: node.id,
          node,
          startX: 0,
          startZ: ORIGIN_Z,
          x,
          z,
          prob,
          height: 1.75 + prob * 6.4,
          width: 0.72 + prob * 1.05,
          valleyDepth: 1.05 + prob * 2.3,
          valleyWidth: 1.2 + prob * 1.65,
        };
        coordMap.set(node.id, coord);
      });
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
      const parentCoord = coordMap.get(pid);
      const startX = parentCoord ? parentCoord.x : 0;
      const startZ = parentCoord ? parentCoord.z : -1.2;
      const cCount = Math.max(1, children.length);

      children.forEach((child, cIdx) => {
        const localSpread = cCount === 1 ? 0 : (cIdx / (cCount - 1)) * 2 - 1;
        const rawX = startX + localSpread * 4.1;
        const x = Math.max(-8.8, Math.min(8.8, rawX));
        const z =
          startZ -
          4.5 -
          (child.depth - 2) * 3.5 -
          Math.abs(localSpread) * 0.75;
        const prob = Math.max(
          0.04,
          Math.min(0.92, child.conditionalProbability)
        );

        const coord: MonolithCoord = {
          id: child.id,
          node: child,
          startX,
          startZ,
          x,
          z,
          prob,
          height: 1.5 + prob * 5.2,
          width: 0.64 + prob * 0.85,
          valleyDepth: 0.95 + prob * 1.8,
          valleyWidth: 1.05 + prob * 1.3,
        };
        coordMap.set(child.id, coord);
      });
    });

    return Array.from(coordMap.values());
  }, [activeBranches]);

  const monoliths: MonolithSpec[] = useMemo(() => {
    return monolithCoords.map((c) => ({
      ...c,
      isRecommended:
        goldenPathIds.includes(c.id) || Boolean(c.node.isGoldenPath),
      isSelected: c.id === selectedNodeId,
    }));
  }, [monolithCoords, goldenPathIds, selectedNodeId]);

  const recommendedMonolith = useMemo(
    () => monoliths.find((m) => m.isRecommended) || monoliths[0] || null,
    [monoliths]
  );

  const selectedMonolith = useMemo(
    () => monoliths.find((m) => m.isSelected) || recommendedMonolith,
    [monoliths, recommendedMonolith]
  );

  // 2. Sculpted Alabaster Marble & Stepped Travertine Terrain Evaluator
  const evalTerrainHeight = useMemo(() => {
    const minMonolithZ = monolithCoords.reduce(
      (minZ, m) => Math.min(minZ, m.z),
      -3.0
    );
    const horizonStartZ = Math.min(-8.5, minMonolithZ - 4.2);

    return (x: number, z: number) => {
      const distFromOriginPass = Math.hypot(x * 0.82, z - ORIGIN_Z);
      const originMound =
        Math.exp(-(distFromOriginPass * distFromOriginPass) / 8.5) * 0.68;

      // Flanking marble ridges on outer perimeter
      const lateralRidge =
        Math.pow(Math.max(0, (Math.abs(x) - 5.2) / 14.0), 1.45) * 3.4;
      const horizonRidge =
        z < horizonStartZ
          ? Math.pow(Math.min(1, (horizonStartZ - z) / 14.0), 1.55) * 3.0
          : 0;
      const foregroundSlope =
        z > ORIGIN_Z ? Math.min(1.2, (z - ORIGIN_Z) * 0.16) : 0;

      let h =
        0.14 +
        originMound +
        lateralRidge +
        horizonRidge +
        foregroundSlope +
        Math.cos(x * 0.32 + z * 0.2) * 0.11;

      // Carve smooth radiating valleys from Origin Pass to each monolith's water basin
      for (const m of monolithCoords) {
        const zMin = Math.min(m.startZ, m.z);
        const zMax = Math.max(m.startZ, m.z);
        const spanZ = Math.max(1.5, zMax - zMin);
        if (z > zMax + 1.8 || z < zMin - 3.4) continue;

        const localT = Math.max(0, Math.min(1, (m.startZ - z) / spanZ));
        const easeT = localT * localT * (3 - 2 * localT);
        const meander = Math.sin(localT * Math.PI) * (m.x - m.startX) * 0.08;
        const vx = m.startX + (m.x - m.startX) * easeT + meander;
        const vw = 0.72 + localT * m.valleyWidth;
        const dx = x - vx;

        const zEnv =
          z >= m.z
            ? Math.pow(localT, 0.45)
            : Math.exp(-Math.pow((m.z - z) / 2.5, 2));

        const carve =
          m.valleyDepth * Math.exp(-(dx * dx) / (2 * vw * vw)) * zEnv;
        h -= carve;

        // Guarantee an open water basin floor below WATER_Y around every monolith so ridges never clip portals
        const distToBasin = Math.hypot(x - m.x, z - m.z);
        const basinRadius = m.width * 2.5;
        if (distToBasin < basinRadius * 1.8) {
          const basinWeight = Math.exp(
            -(distToBasin * distToBasin) / (2 * basinRadius * basinRadius * 0.45)
          );
          const targetBasinFloor = WATER_Y - 0.34;
          h = h * (1 - basinWeight) + Math.min(h, targetBasinFloor) * basinWeight;
        }
      }

      // Smooth architectural stepped travertine terraces on positive elevations
      if (h > -0.15) {
        const terraceFreq = 3.0;
        const stepped = Math.floor(h * terraceFreq) / terraceFreq;
        const frac = h * terraceFreq - Math.floor(h * terraceFreq);
        const smoothStep = stepped + Math.pow(frac, 1.75) / terraceFreq;
        h = h * 0.56 + smoothStep * 0.44;
      }

      return Math.max(-0.85, h);
    };
  }, [monolithCoords]);

  const gridSegs = 196;
  const planeW = 68;
  const planeD = 56;

  // Allocate the 196x196 PlaneGeometry ONCE and dispose on unmount (zero WebGL buffer leaks on click/drag)
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeW, planeD, gridSegs, gridSegs);
    geo.rotateX(-Math.PI / 2);
    const count = geo.attributes.position.count;
    geo.setAttribute(
      'color',
      new THREE.BufferAttribute(new Float32Array(count * 3), 3)
    );
    return geo;
  }, []);

  const terrainInitializedRef = useRef(false);

  // Compute target heights and smooth continuous vertex colors whenever branch probabilities or waves change
  const targetTerrainHeights = useMemo(() => {
    const pos = terrainGeometry.attributes.position;
    const colorAttr = terrainGeometry.attributes.color as THREE.BufferAttribute;
    const heights = new Float32Array(pos.count);

    const highMarble = new THREE.Color('#F5F3EE');
    const midTravertine = new THREE.Color('#EAE6DC');
    const valleyStone = new THREE.Color('#DED8CA');
    const riserInk = new THREE.Color('#C5BEB0');
    const veinColor = new THREE.Color('#E2DDD2');
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = evalTerrainHeight(x, z);
      heights[i] = h;

      if (!terrainInitializedRef.current) {
        pos.setY(i, h);
      }

      const elevNorm = Math.max(0, Math.min(1, (h + 0.6) / 3.6));
      if (elevNorm < 0.45) {
        tmp.lerpColors(valleyStone, midTravertine, elevNorm / 0.45);
      } else {
        tmp.lerpColors(midTravertine, highMarble, (elevNorm - 0.45) / 0.55);
      }

      // Smooth continuous Carrara marble veining (no hard boolean threshold speckles)
      const veinWave =
        0.5 + 0.5 * Math.sin(x * 0.72 + Math.cos(z * 0.55) * 2.0 + h * 1.4);
      const veinBlend = Math.pow(veinWave, 4.0) * 0.26;
      tmp.lerp(veinColor, veinBlend);

      // Smooth continuous travertine terrace contour shading (eliminates vertex polka-dot artifacts)
      if (h > -0.1) {
        const terraceWave =
          0.5 + 0.5 * Math.cos((h + 4.0) * 3.0 * Math.PI * 2.0);
        const elevFade = Math.min(1, (h + 0.1) * 2.5);
        const terraceBlend = Math.pow(terraceWave, 5.0) * 0.2 * elevFade;
        tmp.lerp(riserInk, terraceBlend);
      }

      colorAttr.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }

    colorAttr.needsUpdate = true;
    if (!terrainInitializedRef.current) {
      pos.needsUpdate = true;
      terrainGeometry.computeVertexNormals();
      terrainInitializedRef.current = true;
    }

    return heights;
  }, [terrainGeometry, evalTerrainHeight]);

  // Specular Reflective Water Basin Geometry
  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 52, 72, 72);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      terrainGeometry.dispose();
      waterGeometry.dispose();
    };
  }, [terrainGeometry, waterGeometry]);

  // Luminous Water-Stream Ribbons Flowing from Origin Sanctuary into Each Monolith's Basin
  const streamCurves = useMemo(() => {
    return monolithCoords.map((m) => {
      const pts: THREE.Vector3[] = [];
      const steps = 32;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const z = m.startZ + t * (m.z - m.startZ);
        const easeT = t * t * (3 - 2 * t);
        const meander = Math.sin(t * Math.PI) * (m.x - m.startX) * 0.08;
        const x = m.startX + (m.x - m.startX) * easeT + meander;
        const terrainY = evalTerrainHeight(x, z);
        const y = Math.max(WATER_Y + 0.04, terrainY + 0.05);
        pts.push(new THREE.Vector3(x, y, z));
      }
      return {
        id: m.id,
        curve: new THREE.CatmullRomCurve3(pts),
      };
    });
  }, [monolithCoords, evalTerrainHeight]);

  // Soft Procedural Radial Cloud Alpha Texture for Drifting Mist Veils
  const mistTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(246, 244, 239, 0.52)');
      grad.addColorStop(0.5, 'rgba(243, 241, 236, 0.22)');
      grad.addColorStop(1, 'rgba(243, 241, 236, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Soft 2D Volumetric Skylight Beam Alpha Texture (feathered horizontal & vertical edges so there is never a hard cut)
  const skylightTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(128, 256);
      const data = imgData.data;
      for (let y = 0; y < 256; y++) {
        const v = y / 255; // 0 = top, 1 = bottom
        const vEnv = Math.sin(v * Math.PI) * Math.pow(1 - v * 0.35, 0.7);
        const halfWidth = 0.26 + v * 0.22;
        for (let x = 0; x < 128; x++) {
          const u = (x / 127 - 0.5) / halfWidth;
          const hEnv = Math.max(0, 1 - u * u);
          const alpha = Math.pow(hEnv, 1.8) * vEnv;
          const idx = (y * 128 + x) * 4;
          data[idx] = 255;
          data[idx + 1] = 253;
          data[idx + 2] = 246;
          data[idx + 3] = Math.round(alpha * 255);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      mistTexture?.dispose();
      skylightTexture?.dispose();
    };
  }, [mistTexture, skylightTexture]);

  const mistVeils = useMemo(
    () => [
      { x: -4.2, y: 0.12, z: 1.8, sx: 11, sy: 4.5, speed: 0.18, phase: 0.2 },
      { x: 3.6, y: 0.18, z: 0.4, sx: 12, sy: 5.0, speed: -0.15, phase: 1.4 },
      { x: -1.5, y: 0.15, z: -2.4, sx: 14, sy: 5.5, speed: 0.12, phase: 2.7 },
      { x: 4.8, y: 0.22, z: -4.2, sx: 13, sy: 4.8, speed: -0.16, phase: 3.9 },
      { x: -5.4, y: 0.25, z: -5.6, sx: 15, sy: 6.0, speed: 0.14, phase: 5.1 },
      { x: 0.8, y: 0.28, z: -7.5, sx: 18, sy: 6.5, speed: -0.11, phase: 0.9 },
      { x: -2.6, y: 0.24, z: -9.6, sx: 16, sy: 5.8, speed: 0.13, phase: 2.1 },
    ],
    []
  );

  // Camera Choreography State (Scroll Spline + Fly-To-Monolith Mode)
  const targetCamPos = useRef(new THREE.Vector3(0, 4.5, 11.6));
  const targetLookAt = useRef(new THREE.Vector3(0, -0.35, -1.5));
  const currentLookAt = useRef(new THREE.Vector3(0, -0.35, -1.5));

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.2 ? 1.22 / Math.max(0.68, aspect) : 1.0;

    // 1. Determine Target Camera Position & LookAt from Camera Mode
    if (cameraMode === 'focus' && selectedMonolith) {
      // Fly-To-Monolith Mode: physically glide down over the water pool to frame the selected portal
      const sideOffset = selectedMonolith.x >= 0 ? -1.85 : 1.85;
      targetCamPos.current.set(
        selectedMonolith.x * 0.82 + sideOffset,
        WATER_Y + 2.15 * pullback,
        selectedMonolith.z + 4.55 * pullback
      );
      targetLookAt.current.set(
        selectedMonolith.x,
        WATER_Y + Math.min(2.15, selectedMonolith.height * 0.46),
        selectedMonolith.z
      );
    } else if (cameraMode === 'overview') {
      // Panoramic Sanctuary Overview
      const hasDeep = monoliths.some((m) => m.node.depth > 1);
      targetCamPos.current.set(
        0,
        (hasDeep ? 5.1 : 4.35) * pullback,
        (hasDeep ? 10.4 : 11.4) * pullback
      );
      targetLookAt.current.set(0, hasDeep ? 0.15 : -0.4, hasDeep ? -3.4 : -1.5);
    } else {
      // Scroll Journey Mode: 4-stage cinematic spline across [0..1]
      const s = Math.max(0, Math.min(1, scrollProgress));
      const rec = recommendedMonolith || {
        x: -1.6,
        z: -1.6,
        height: 3.8,
      };

      // Stage 0 (scroll 0.00): High sanctuary vista behind the Origin Pass with all 5 portals framed in the upper viewport
      const p0 = new THREE.Vector3(0, 4.45 * pullback, 11.6 * pullback);
      const l0 = new THREE.Vector3(0, -0.38, -1.5);

      // Stage 1 (scroll 0.33): Gliding over the bifurcation water watershed
      const p1 = new THREE.Vector3(-2.7, 3.25 * pullback, 7.0 * pullback);
      const l1 = new THREE.Vector3(0.35, 0.35, -1.85);

      // Stage 2 (scroll 0.66): Low sweep across the mirror water pool right up to the Recommended Path portal
      const p2 = new THREE.Vector3(
        rec.x * 0.68 + 1.65,
        1.98 * pullback,
        rec.z + 4.4 * pullback
      );
      const l2 = new THREE.Vector3(rec.x, 1.22, rec.z);

      // Stage 3 (scroll 1.00): Inside the interactive sculpture basin past the Origin Pass
      const p3 = new THREE.Vector3(1.85, 2.95 * pullback, 5.4 * pullback);
      const l3 = new THREE.Vector3(-0.35, 0.85, -2.25);

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
      const dampLambda = 6.2;
      const dt = Math.min(0.1, delta);
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        targetCamPos.current.x,
        dampLambda,
        dt
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        targetCamPos.current.y,
        dampLambda,
        dt
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        targetCamPos.current.z,
        dampLambda,
        dt
      );

      currentLookAt.current.x = THREE.MathUtils.damp(
        currentLookAt.current.x,
        targetLookAt.current.x,
        dampLambda,
        dt
      );
      currentLookAt.current.y = THREE.MathUtils.damp(
        currentLookAt.current.y,
        targetLookAt.current.y,
        dampLambda,
        dt
      );
      currentLookAt.current.z = THREE.MathUtils.damp(
        currentLookAt.current.z,
        targetLookAt.current.z,
        dampLambda,
        dt
      );
    }
    camera.lookAt(currentLookAt.current);

    // 2. Smoothly morph terrain heights when probabilities or waves change
    if (terrainRef.current) {
      const pos = terrainRef.current.geometry.attributes.position;
      let changed = false;
      const step = reducedMotion ? 1.0 : Math.min(1.0, delta * 8.5);
      for (let i = 0; i < pos.count; i++) {
        const curY = pos.getY(i);
        const tgtY = targetTerrainHeights[i] ?? curY;
        if (Math.abs(curY - tgtY) > 0.003) {
          pos.setY(i, curY + (tgtY - curY) * step);
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
          Math.sin(wx * 1.35 + t * 1.6) * 0.012 +
          Math.cos(wz * 1.65 - t * 1.3) * 0.01;
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
      originOrbRef.current.position.y = 0.62 + Math.sin(t * 1.4) * 0.055;
      originOrbRef.current.rotation.y = t * 0.45;
    }
  });

  const originTerrainY = evalTerrainHeight(0, ORIGIN_Z);

  return (
    <group>
      {/* Luminous Diffused Alabaster Daylight Sky & Mist Horizon */}
      <color attach="background" args={['#F3F1EC']} />
      <fogExp2 attach="fog" args={['#F3F1EC', 0.021]} />

      {/* Diffused Zenith Skylight + Warm Architectural Sun Shaft Key Light */}
      <hemisphereLight
        color="#FAF8F4"
        groundColor="#C9C2B4"
        intensity={0.72}
      />
      <directionalLight
        position={[15, 25, 11]}
        intensity={1.8}
        color="#FFF9EB"
        castShadow
        shadow-bias={-0.0005}
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
        position={[0, WATER_Y, -2.5]}
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#DCE3E6"
          roughness={0.05}
          metalness={0.12}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          reflectivity={0.95}
        />
      </mesh>

      {/* Origin Sanctuary Threshold Pass (Low-profile Sculpted Spring & Flanking Threshold Gates at [0, y, 6.5]) */}
      <group position={[0, originTerrainY, ORIGIN_Z]}>
        {/* Stepped Octagonal Travertine Sanctuary Terrace */}
        <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.42, 1.62, 0.18, 8]} />
          <meshPhysicalMaterial
            color="#EAE6DC"
            roughness={0.5}
            metalness={0.04}
            clearcoat={0.16}
          />
        </mesh>
        <mesh position={[0, 0.22, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.02, 1.15, 0.12, 8]} />
          <meshStandardMaterial
            color="#1E4D6B"
            roughness={0.32}
            metalness={0.22}
          />
        </mesh>

        {/* Horizontal Sculpted Ocular Spring Ring */}
        <mesh
          position={[0, 0.3, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[0.72, 0.06, 20, 48]} />
          <meshPhysicalMaterial
            color="#F5F3EE"
            roughness={0.42}
            metalness={0.06}
            clearcoat={0.25}
          />
        </mesh>

        {/* Low Flanking Threshold Gate Wings (Leaves central sightline to Depth-1 portals completely clear) */}
        <mesh position={[-0.86, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.64, 0.44]} />
          <meshPhysicalMaterial
            color="#F5F3EE"
            roughness={0.48}
            metalness={0.04}
            clearcoat={0.18}
          />
        </mesh>
        <mesh position={[0.86, 0.46, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.56, 0.44]} />
          <meshPhysicalMaterial
            color="#F5F3EE"
            roughness={0.48}
            metalness={0.04}
            clearcoat={0.18}
          />
        </mesh>

        {/* Suspended Champagne Bronze Origin Decision Sphere */}
        <mesh ref={originOrbRef} position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.19, 32, 32]} />
          <meshPhysicalMaterial
            color="#C49A45"
            roughness={0.18}
            metalness={0.68}
            clearcoat={0.85}
          />
        </mesh>

        {/* Soft Overhead Skylight Shaft on Origin Sanctuary */}
        {skylightTexture && (
          <mesh
            position={[0.35, 5.2, 0.15]}
            rotation={[0.05, 0, -0.08]}
            scale={[2.6, 11.5, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={skylightTexture}
              color="#FFFDF7"
              transparent
              opacity={0.24}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* Flowing Water-Stream Ribbons from Origin Pass into Each Monolith Basin */}
      {streamCurves.map((s) => {
        const isRecommended =
          goldenPathIds.includes(s.id) ||
          Boolean(nodes.find((n) => n.id === s.id)?.isGoldenPath);
        const isSelected = s.id === selectedNodeId;
        return (
          <group key={`stream-${s.id}`}>
            <mesh scale={[1, 0.18, 1]}>
              <tubeGeometry
                args={[
                  s.curve,
                  48,
                  isRecommended ? 0.34 : isSelected ? 0.24 : 0.16,
                  10,
                  false,
                ]}
              />
              <meshPhysicalMaterial
                color={
                  isRecommended
                    ? '#1E4D6B'
                    : isSelected
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
            {isRecommended && (
              <mesh position={[0, -0.008, 0]} scale={[1, 0.12, 1]}>
                <tubeGeometry args={[s.curve, 48, 0.44, 8, false]} />
                <meshStandardMaterial
                  color="#C49A45"
                  roughness={0.28}
                  metalness={0.55}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Architectural Twin-Blade Portal Monoliths Rising from Water Basins */}
      {monoliths.map((spec) => (
        <MonolithSculpture
          key={spec.id}
          spec={spec}
          skylightTexture={skylightTexture}
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
