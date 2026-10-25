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
  rank: number;
}

const ORIGIN_Z = 6.5;
const WATER_Y = -0.35;
const STREAM_PARTICLE_COUNT = 280;
const MOTE_PARTICLE_COUNT = 120;

function createParabolicArchCurve(
  span: number,
  baseY: number,
  apexHeight: number,
  zSweep: number,
  zOffset = 0,
  exponent = 1.82
): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const segments = 28;
  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * 2 - 1; // [-1, 1]
    const x = u * span;
    const archFactor = Math.max(0, 1 - Math.pow(Math.abs(u), exponent));
    const y = baseY + apexHeight * archFactor;
    const z = zOffset - Math.cos((u * Math.PI) / 2) * zSweep;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function ArchSculpture({
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
  const astrolabeGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const crownHaloRef = useRef<THREE.Mesh>(null);
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

  const archSpan = Math.max(0.62, spec.width * 0.96);
  const archHeight = Math.max(1.85, spec.height * 0.94);
  const baseY = 0.34;
  const archTubeR = Math.max(0.092, spec.width * 0.118);

  // Sculpted Catenary / Parabolic Carrara Marble Arch Geometries
  const { outerArchGeo, crestArchGeo, innerRibGeo } = useMemo(() => {
    const outerCurve = createParabolicArchCurve(
      archSpan,
      baseY,
      archHeight,
      spec.width * 0.15,
      0,
      1.84
    );
    const crestCurve = createParabolicArchCurve(
      archSpan * 1.04,
      baseY + 0.04,
      archHeight + 0.15,
      spec.width * 0.15,
      -0.05,
      1.92
    );
    const innerCurve = createParabolicArchCurve(
      archSpan * 0.85,
      baseY,
      archHeight * 0.88,
      spec.width * 0.11,
      0.02,
      1.76
    );

    return {
      outerArchGeo: new THREE.TubeGeometry(outerCurve, 64, archTubeR, 24, false),
      crestArchGeo: new THREE.TubeGeometry(
        crestCurve,
        64,
        archTubeR * 0.48,
        20,
        false
      ),
      innerRibGeo: new THREE.TubeGeometry(
        innerCurve,
        64,
        archTubeR * 0.44,
        20,
        false
      ),
    };
  }, [archSpan, archHeight, archTubeR, spec.width]);

  useEffect(() => {
    return () => {
      outerArchGeo.dispose();
      crestArchGeo.dispose();
      innerRibGeo.dispose();
    };
  }, [outerArchGeo, crestArchGeo, innerRibGeo]);

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
      groupRef.current.scale.set(
        wRatio,
        Math.max(0.05, riseRef.current * hRatio),
        wRatio
      );
    }

    if (!reducedMotion) {
      if (astrolabeGroupRef.current) {
        astrolabeGroupRef.current.position.y =
          baseY + archHeight * 0.54 + Math.sin(t * 1.35) * 0.08;
      }
      if (ring1Ref.current) {
        ring1Ref.current.rotation.y = t * 0.62;
        ring1Ref.current.rotation.x = Math.PI / 6 + Math.sin(t * 0.45) * 0.22;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.x = -t * 0.78;
        ring2Ref.current.rotation.z = Math.PI / 3 + Math.cos(t * 0.52) * 0.25;
      }
      if (ring3Ref.current) {
        ring3Ref.current.rotation.z = t * 0.95;
        ring3Ref.current.rotation.y = -Math.PI / 5 + Math.sin(t * 0.6) * 0.3;
      }
      if (crownHaloRef.current) {
        crownHaloRef.current.rotation.z = t * 0.4;
        crownHaloRef.current.position.y =
          baseY + archHeight + 0.38 + Math.sin(t * 1.6) * 0.04;
      }
    }

    if (!reducedMotion && ripple1Ref.current && ripple2Ref.current) {
      const cycle1 = (t * 0.28) % 1;
      const cycle2 = (t * 0.28 + 0.5) % 1;
      const baseR = spec.width;
      const s1 = baseR * (1.05 + cycle1 * 0.95);
      const s2 = baseR * (1.05 + cycle2 * 0.95);
      ripple1Ref.current.scale.set(s1, s1, 1);
      ripple2Ref.current.scale.set(s2, s2, 1);

      const mat1 = ripple1Ref.current.material as THREE.MeshBasicMaterial;
      const mat2 = ripple2Ref.current.material as THREE.MeshBasicMaterial;
      if (mat1) mat1.opacity = (1 - cycle1) * (spec.isRecommended ? 0.4 : 0.24);
      if (mat2) mat2.opacity = (1 - cycle2) * (spec.isRecommended ? 0.4 : 0.24);
    }
  });

  const mainMarbleColor = spec.isRecommended
    ? '#FAF8F3'
    : spec.isSelected
    ? '#F6F4EF'
    : '#EAE5D9';

  const crestStoneColor = spec.isRecommended
    ? '#EFECE4'
    : spec.isSelected
    ? '#E8E4DA'
    : '#DED8CA';

  const innerRibColor = spec.isRecommended
    ? '#C49A45'
    : spec.isSelected
    ? '#1E4D6B'
    : '#707C84';

  const pedestalColor = spec.isRecommended
    ? '#1E4D6B'
    : spec.isSelected
    ? '#263540'
    : '#CFC9BC';

  const astrolabeRingColor = spec.isRecommended
    ? '#C49A45'
    : spec.isSelected
    ? '#1E4D6B'
    : '#5C6B73';

  const coreSphereColor = spec.isRecommended
    ? '#D4A94E'
    : spec.isSelected
    ? '#1E4D6B'
    : '#2C5975';

  const pedR = Math.max(0.22, spec.width * 0.28);
  const gimbalR = Math.max(0.24, spec.width * 0.31);
  const gimbalTube = Math.max(0.015, gimbalR * 0.068);

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
        <ringGeometry args={[1.18, 1.26, 48]} />
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
        <ringGeometry args={[1.18, 1.26, 48]} />
        <meshBasicMaterial
          color={spec.isRecommended ? '#C49A45' : '#8A98A0'}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Volumetric Overhead Skylight Shaft for Recommended or Selected Arch */}
      {(spec.isRecommended || spec.isSelected) && (
        <group position={[0, 0, 0]}>
          <mesh
            position={[0.65, spec.height * 0.5 + 5.2, 0.3]}
            rotation={[0.05, 0, -0.1]}
            scale={[spec.width * 3.2, 13.5, 1]}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={skylightTexture ?? undefined}
              color={spec.isRecommended ? '#FFFDF6' : '#F2F6F8'}
              transparent
              opacity={spec.isRecommended ? 0.36 : 0.24}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[0.65, spec.height * 0.5 + 5.2, 0.3]}
            rotation={[0.05, Math.PI / 2, -0.1]}
            scale={[spec.width * 3.2, 13.5, 1]}
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

          {/* Glacial / Golden Reflection Pool on Water Surface */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.015, 0]}
            scale={[spec.width * 1.9, spec.width * 1.9, 1]}
          >
            <circleGeometry args={[1, 48]} />
            <meshBasicMaterial
              color={spec.isRecommended ? '#1E4D6B' : '#2C5975'}
              transparent
              opacity={spec.isRecommended ? 0.26 : 0.16}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <group ref={groupRef}>
        {/* Submerged Circular Travertine Water Foundation Terrace */}
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry
            args={[archSpan * 1.28, archSpan * 1.44, 0.16, 32]}
          />
          <meshPhysicalMaterial
            color={pedestalColor}
            roughness={0.44}
            metalness={0.12}
            clearcoat={0.22}
          />
        </mesh>

        {/* Left & Right Sculpted Stepped Cylindrical Travertine Pedestals + Torus Collars */}
        {[-archSpan, archSpan].map((px, sideIdx) => (
          <group key={sideIdx} position={[px, 0, 0]}>
            <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[pedR * 0.95, pedR * 1.16, 0.18, 32]} />
              <meshPhysicalMaterial
                color={crestStoneColor}
                roughness={0.48}
                metalness={0.05}
                clearcoat={0.16}
              />
            </mesh>
            <mesh position={[0, 0.31, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[pedR * 0.76, pedR * 0.92, 0.14, 32]} />
              <meshPhysicalMaterial
                color={mainMarbleColor}
                roughness={0.42}
                metalness={0.04}
                clearcoat={0.2}
              />
            </mesh>
            {/* Carved Marble & Bronze Torus Collar Where Arch Springs Upward */}
            <mesh
              position={[0, baseY + 0.03, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
              receiveShadow
            >
              <torusGeometry args={[archTubeR * 1.32, archTubeR * 0.36, 20, 36]} />
              <meshStandardMaterial
                color={innerRibColor}
                roughness={spec.isRecommended ? 0.24 : 0.42}
                metalness={spec.isRecommended ? 0.62 : 0.25}
              />
            </mesh>
          </group>
        ))}

        {/* Primary Soaring Parabolic / Catenary Carrara Marble Arch */}
        <mesh geometry={outerArchGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={mainMarbleColor}
            roughness={0.42}
            metalness={0.03}
            clearcoat={0.24}
            clearcoatRoughness={0.2}
          />
        </mesh>

        {/* Secondary Fluted Extrados Marble Crest Rib */}
        <mesh geometry={crestArchGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={crestStoneColor}
            roughness={0.5}
            metalness={0.04}
            clearcoat={0.15}
          />
        </mesh>

        {/* Inner Recessed Bronze / Glacial Mineral Arch Rib */}
        <mesh geometry={innerRibGeo} castShadow>
          <meshStandardMaterial
            color={innerRibColor}
            roughness={spec.isRecommended ? 0.22 : 0.36}
            metalness={spec.isRecommended ? 0.68 : 0.32}
          />
        </mesh>

        {/* Vertical Filigree Suspension Rod from Arch Apex to Astrolabe */}
        <mesh
          position={[
            0,
            baseY + archHeight * 0.76,
            -spec.width * 0.11,
          ]}
        >
          <cylinderGeometry
            args={[0.009, 0.009, archHeight * 0.42, 12]}
          />
          <meshStandardMaterial
            color={astrolabeRingColor}
            roughness={0.25}
            metalness={0.65}
          />
        </mesh>

        {/* Multi-Ring Rotating Kinetic Astrolabe / Orbital Gimbal Suspended Inside Arch */}
        <group
          ref={astrolabeGroupRef}
          position={[0, baseY + archHeight * 0.54, -spec.width * 0.11]}
        >
          {/* Outer Gimbal Ring */}
          <mesh
            ref={ring1Ref}
            rotation={[Math.PI / 6, 0, Math.PI / 10]}
            castShadow
          >
            <torusGeometry args={[gimbalR * 1.38, gimbalTube, 20, 64]} />
            <meshStandardMaterial
              color={astrolabeRingColor}
              roughness={0.22}
              metalness={spec.isRecommended ? 0.72 : 0.45}
            />
          </mesh>

          {/* Middle Counter-Rotating Orbital Ring */}
          <mesh
            ref={ring2Ref}
            rotation={[0, Math.PI / 4, Math.PI / 3]}
            castShadow
          >
            <torusGeometry
              args={[gimbalR * 1.08, gimbalTube * 0.88, 20, 64]}
            />
            <meshStandardMaterial
              color={spec.isRecommended ? '#1E4D6B' : '#8A949A'}
              roughness={0.26}
              metalness={0.5}
            />
          </mesh>

          {/* Inner Meridian Ring */}
          <mesh
            ref={ring3Ref}
            rotation={[Math.PI / 3, -Math.PI / 5, 0]}
            castShadow
          >
            <torusGeometry
              args={[gimbalR * 0.8, gimbalTube * 0.76, 20, 64]}
            />
            <meshStandardMaterial
              color={astrolabeRingColor}
              roughness={0.2}
              metalness={0.68}
            />
          </mesh>

          {/* Luminous Alabaster / Mineral Core Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[gimbalR * 0.44, 32, 32]} />
            <meshPhysicalMaterial
              color={coreSphereColor}
              roughness={0.14}
              metalness={spec.isRecommended ? 0.72 : 0.38}
              clearcoat={0.9}
              clearcoatRoughness={0.08}
            />
          </mesh>

          {/* Soft Inner Halo Mesh */}
          <mesh>
            <sphereGeometry args={[gimbalR * 0.64, 24, 24]} />
            <meshBasicMaterial
              color={spec.isRecommended ? '#F5D78E' : '#8FB8D0'}
              transparent
              opacity={spec.isRecommended ? 0.24 : 0.14}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Crown Golden-Bronze Halo Ring Above Recommended Path Arch Apex */}
        {spec.isRecommended && (
          <group>
            <mesh
              ref={crownHaloRef}
              position={[0, baseY + archHeight + 0.38, -spec.width * 0.14]}
              rotation={[Math.PI / 2 - 0.18, 0, 0]}
              castShadow
            >
              <torusGeometry args={[spec.width * 0.44, 0.026, 20, 64]} />
              <meshStandardMaterial
                color="#C49A45"
                roughness={0.18}
                metalness={0.78}
              />
            </mesh>
            <mesh
              position={[0, baseY + archHeight + 0.38, -spec.width * 0.14]}
            >
              <sphereGeometry args={[0.075, 20, 20]} />
              <meshStandardMaterial
                color="#C49A45"
                roughness={0.16}
                metalness={0.8}
              />
            </mesh>
          </group>
        )}
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
  const originAstrolabeRef = useRef<THREE.Group>(null);
  const streamPointsRef = useRef<THREE.Points>(null);
  const motePointsRef = useRef<THREE.Points>(null);
  const labelOverlayRef = useRef<HTMLDivElement | null>(null);
  const labelMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const { camera, size, gl } = useThree();

  const activeBranches = useMemo(() => {
    return nodes
      .filter((n) => n.parentId !== null && n.status !== 'pruned')
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        if (a.waveNumber !== b.waveNumber) return a.waveNumber - b.waveNumber;
        return a.siblingIndex - b.siblingIndex;
      });
  }, [nodes]);

  // 1. Spatial coordinates & valley geometry (independent of selectedNodeId so clicking an arch never recomputes terrain!)
  const monolithCoords: MonolithCoord[] = useMemo(() => {
    const coordMap = new Map<string, MonolithCoord>();
    const depth1 = activeBranches.filter((n) => n.depth === 1);
    const deeper = activeBranches.filter((n) => n.depth > 1);

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

      const crescendoOrder = [2, 1, 3, 0, 4];
      waveNodes.forEach((node, idx) => {
        const slotIdx =
          waveNum === 1 && wCount === 5 ? crescendoOrder[idx] ?? idx : idx;
        const spread = wCount === 1 ? 0 : (slotIdx / (wCount - 1)) * 2 - 1;
        const x = spread * maxSpreadX + waveStaggerX;
        const z =
          -1.15 -
          (waveNum - 1) * 3.1 -
          Math.abs(spread) * (waveNum === 1 ? 1.25 : 1.5);
        const prob = Math.max(0.04, Math.min(0.92, node.conditionalProbability));

        const coord: MonolithCoord = {
          id: node.id,
          node,
          startX: 0,
          startZ: ORIGIN_Z,
          x,
          z,
          prob,
          height: 1.85 + prob * 6.5,
          width: 0.74 + prob * 1.06,
          valleyDepth: 1.05 + prob * 2.3,
          valleyWidth: 1.2 + prob * 1.65,
        };
        coordMap.set(node.id, coord);
      });
    });

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
          height: 1.6 + prob * 5.2,
          width: 0.66 + prob * 0.85,
          valleyDepth: 0.95 + prob * 1.8,
          valleyWidth: 1.05 + prob * 1.3,
        };
        coordMap.set(child.id, coord);
      });
    });

    return Array.from(coordMap.values());
  }, [activeBranches]);

  const monoliths: MonolithSpec[] = useMemo(() => {
    const sortedIds = [...monolithCoords]
      .sort((a, b) => b.prob - a.prob)
      .map((m) => m.id);
    return monolithCoords.map((c) => ({
      ...c,
      isRecommended:
        goldenPathIds.includes(c.id) || Boolean(c.node.isGoldenPath),
      isSelected: c.id === selectedNodeId,
      rank: sortedIds.indexOf(c.id) + 1,
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

        const distToBasin = Math.hypot(x - m.x, z - m.z);
        const basinRadius = m.width * 2.6;
        if (distToBasin < basinRadius * 1.8) {
          const basinWeight = Math.exp(
            -(distToBasin * distToBasin) /
              (2 * basinRadius * basinRadius * 0.45)
          );
          const targetBasinFloor = WATER_Y - 0.34;
          h =
            h * (1 - basinWeight) +
            Math.min(h, targetBasinFloor) * basinWeight;
        }
      }

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

      const veinWave =
        0.5 + 0.5 * Math.sin(x * 0.72 + Math.cos(z * 0.55) * 2.0 + h * 1.4);
      const veinBlend = Math.pow(veinWave, 4.0) * 0.26;
      tmp.lerp(veinColor, veinBlend);

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

  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(64, 52, 72, 72);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Origin Sanctuary Crown Arch Geometry
  const originArchGeo = useMemo(() => {
    const curve = createParabolicArchCurve(1.08, 0.22, 1.58, 0.18, 0, 1.85);
    return new THREE.TubeGeometry(curve, 56, 0.085, 22, false);
  }, []);

  const originInnerArchGeo = useMemo(() => {
    const curve = createParabolicArchCurve(0.92, 0.22, 1.4, 0.14, 0.02, 1.78);
    return new THREE.TubeGeometry(curve, 56, 0.038, 18, false);
  }, []);

  // Perimeter Semicircular Sanctuary Colonnade Arches Around Far Amphitheater Rim
  const perimeterColonnade = useMemo(() => {
    const items: {
      x: number;
      z: number;
      rotY: number;
      geo: THREE.TubeGeometry;
    }[] = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const frac = i / (count - 1) - 0.5; // [-0.5, 0.5]
      const angle = frac * Math.PI * 0.82;
      const radiusX = 16.8;
      const x = Math.sin(angle) * radiusX;
      const z = -3.8 - Math.cos(angle) * 9.6;
      const height = 5.4 + (1 - Math.abs(frac) * 0.5) * 2.2;
      const span = 1.25;
      const curve = createParabolicArchCurve(span, 0, height, 0.22, 0, 1.86);
      const geo = new THREE.TubeGeometry(curve, 48, 0.13, 18, false);
      items.push({
        x,
        z,
        rotY: -angle * 0.85,
        geo,
      });
    }
    return items;
  }, []);

  useEffect(() => {
    return () => {
      terrainGeometry.dispose();
      waterGeometry.dispose();
      originArchGeo.dispose();
      originInnerArchGeo.dispose();
      perimeterColonnade.forEach((c) => c.geo.dispose());
    };
  }, [
    terrainGeometry,
    waterGeometry,
    originArchGeo,
    originInnerArchGeo,
    perimeterColonnade,
  ]);

  // Luminous Water-Stream Curves Flowing from Origin Fountain into Each Arch's Basin
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
        const y = Math.max(WATER_Y + 0.03, terrainY + 0.04);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const isRecommended =
        goldenPathIds.includes(m.id) || Boolean(m.node.isGoldenPath);
      return {
        id: m.id,
        isRecommended,
        curve: new THREE.CatmullRomCurve3(pts),
      };
    });
  }, [monolithCoords, evalTerrainHeight, goldenPathIds]);

  // Flowing Stream Particle System (280 Luminous Particles Drifting Along River Curves)
  const { streamParticleGeo, streamParticleMeta } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(STREAM_PARTICLE_COUNT * 3);
    const colors = new Float32Array(STREAM_PARTICLE_COUNT * 3);
    const meta: {
      curveIdx: number;
      phase: number;
      speed: number;
      lateral: number;
    }[] = [];

    const goldColor = new THREE.Color('#D4A646');
    const glacialColor = new THREE.Color('#1E6B8C');
    const silverBlue = new THREE.Color('#6C8D9E');
    const tmpColor = new THREE.Color();
    const curveCount = Math.max(1, streamCurves.length);

    for (let i = 0; i < STREAM_PARTICLE_COUNT; i++) {
      const curveIdx = i % curveCount;
      const sCurve = streamCurves[curveIdx];
      const isRec = sCurve?.isRecommended ?? false;
      const phase = ((i * 37) % 1000) / 1000;
      const speed = isRec
        ? 0.16 + ((i * 17) % 10) * 0.008
        : 0.09 + ((i * 13) % 10) * 0.006;
      const lateral = (((i * 29) % 100) / 100 - 0.5) * (isRec ? 0.36 : 0.24);
      meta.push({ curveIdx, phase, speed, lateral });

      if (sCurve) {
        const pt = sCurve.curve.getPoint(phase);
        positions[i * 3] = pt.x + lateral;
        positions[i * 3 + 1] = pt.y + 0.05;
        positions[i * 3 + 2] = pt.z;
      }

      if (isRec) {
        tmpColor.lerpColors(goldColor, glacialColor, (i % 5) / 4);
      } else {
        tmpColor.copy(silverBlue);
      }
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { streamParticleGeo: geo, streamParticleMeta: meta };
  }, [streamCurves]);

  // Atmospheric Sunlit Light Motes (120 Floating Particles Above Sanctuary Basin)
  const { moteParticleGeo, moteMeta } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(MOTE_PARTICLE_COUNT * 3);
    const meta: {
      x: number;
      y: number;
      z: number;
      speed: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < MOTE_PARTICLE_COUNT; i++) {
      const x = (((i * 73) % 1000) / 1000 - 0.5) * 24;
      const y = 0.35 + (((i * 41) % 1000) / 1000) * 5.8;
      const z = -9.5 + (((i * 59) % 1000) / 1000) * 16.5;
      const speed = 0.25 + ((i * 19) % 10) * 0.03;
      const phase = ((i * 31) % 100) * 0.0628;
      meta.push({ x, y, z, speed, phase });
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { moteParticleGeo: geo, moteMeta: meta };
  }, []);

  useEffect(() => {
    return () => {
      streamParticleGeo.dispose();
      moteParticleGeo.dispose();
    };
  }, [streamParticleGeo, moteParticleGeo]);

  // Soft Radial Glow Texture for Stream & Atmospheric Particles
  const particleTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.45, 'rgba(255, 252, 242, 0.65)');
      grad.addColorStop(1, 'rgba(255, 252, 242, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Soft Procedural Radial Cloud Alpha Texture for Drifting Mist Veils
  const mistTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(246, 244, 239, 0.48)');
      grad.addColorStop(0.5, 'rgba(243, 241, 236, 0.2)');
      grad.addColorStop(1, 'rgba(243, 241, 236, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // Soft 2D Volumetric Skylight Beam Alpha Texture
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
        const v = y / 255;
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
      particleTexture?.dispose();
      mistTexture?.dispose();
      skylightTexture?.dispose();
    };
  }, [particleTexture, mistTexture, skylightTexture]);

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

  const targetCamPos = useRef(new THREE.Vector3(-1.8, 4.45, 11.6));
  const targetLookAt = useRef(new THREE.Vector3(-2.1, -0.35, -1.5));
  const currentLookAt = useRef(new THREE.Vector3(-2.1, -0.35, -1.5));
  const tmpPoint = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const aspect = size.width / Math.max(1, size.height);
    const pullback = aspect < 1.2 ? 1.22 / Math.max(0.68, aspect) : 1.0;
    // Shift optical center slightly left on desktop scroll mode so all 5 arches frame cleanly in the open right 70% of the screen
    const desktopRightFrameOffset = aspect >= 1.15 ? -2.05 : 0;

    // 1. Determine Target Camera Position & LookAt from Camera Mode
    if (cameraMode === 'focus' && selectedMonolith) {
      const sideOffset = selectedMonolith.x >= 0 ? -1.65 : 1.65;
      const focusShift = aspect >= 1.15 ? -0.95 : 0;
      targetCamPos.current.set(
        selectedMonolith.x * 0.82 + sideOffset + focusShift,
        WATER_Y + 2.18 * pullback,
        selectedMonolith.z + 4.65 * pullback
      );
      targetLookAt.current.set(
        selectedMonolith.x + focusShift,
        WATER_Y + Math.min(2.2, selectedMonolith.height * 0.48),
        selectedMonolith.z
      );
    } else if (cameraMode === 'overview') {
      const hasDeep = monoliths.some((m) => m.node.depth > 1);
      targetCamPos.current.set(
        0,
        (hasDeep ? 5.1 : 4.35) * pullback,
        (hasDeep ? 10.4 : 11.4) * pullback
      );
      targetLookAt.current.set(0, hasDeep ? 0.15 : -0.4, hasDeep ? -3.4 : -1.5);
    } else {
      // Scroll Journey Mode: 3-step cinematic spline across [0..1]
      const s = Math.max(0, Math.min(1, scrollProgress));
      const rec = recommendedMonolith || {
        x: -1.6,
        z: -1.6,
        height: 3.8,
      };

      // Step 1 (scroll 0.00): Panoramic sanctuary vista framing Origin Fountain and all 5 sculpted arches in the open right viewport
      const p0 = new THREE.Vector3(
        desktopRightFrameOffset * 0.85,
        4.45 * pullback,
        11.6 * pullback
      );
      const l0 = new THREE.Vector3(desktopRightFrameOffset, -0.32, -1.5);

      // Step 2 (scroll 0.50): Gliding low over the mirror water basin directly in front of the 5 arches
      const p1 = new THREE.Vector3(
        desktopRightFrameOffset * 0.9 - 1.2,
        2.95 * pullback,
        6.8 * pullback
      );
      const l1 = new THREE.Vector3(desktopRightFrameOffset * 0.85, 0.55, -2.0);

      // Step 3 (scroll 1.00): Sweeping close-up right up to the Golden Recommended Path Arch & rotating kinetic astrolabe
      const p2 = new THREE.Vector3(
        rec.x * 0.75 + 1.35 + desktopRightFrameOffset * 0.55,
        2.05 * pullback,
        rec.z + 4.55 * pullback
      );
      const l2 = new THREE.Vector3(
        rec.x + desktopRightFrameOffset * 0.55,
        1.35,
        rec.z
      );

      if (s < 0.5) {
        const u = s / 0.5;
        const ease = u * u * (3 - 2 * u);
        targetCamPos.current.lerpVectors(p0, p1, ease);
        targetLookAt.current.lerpVectors(l0, l1, ease);
      } else {
        const u = (s - 0.5) / 0.5;
        const ease = u * u * (3 - 2 * u);
        targetCamPos.current.lerpVectors(p1, p2, ease);
        targetLookAt.current.lerpVectors(l1, l2, ease);
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

    // 3. Subtle harmonic water surface ripples around basins
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

    // 4. Advance 280 Flowing Stream Particles Along River Curves
    if (!reducedMotion && streamPointsRef.current && streamCurves.length > 0) {
      const posAttr = streamPointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < STREAM_PARTICLE_COUNT; i++) {
        const m = streamParticleMeta[i];
        const sCurve = streamCurves[m.curveIdx % streamCurves.length];
        if (!sCurve) continue;
        const u = (m.phase + t * m.speed) % 1.0;
        sCurve.curve.getPoint(u, tmpPoint);
        const shimmerX = Math.sin(t * 2.2 + i) * 0.05;
        const shimmerY = Math.cos(t * 2.8 + i * 0.5) * 0.02;
        posAttr.setXYZ(
          i,
          tmpPoint.x + m.lateral + shimmerX,
          tmpPoint.y + 0.06 + shimmerY,
          tmpPoint.z
        );
      }
      posAttr.needsUpdate = true;
    }

    // 5. Gently Float 120 Atmospheric Light Motes in Sunlit Air
    if (!reducedMotion && motePointsRef.current) {
      const moteAttr = motePointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < MOTE_PARTICLE_COUNT; i++) {
        const m = moteMeta[i];
        const mx = m.x + Math.sin(t * m.speed + m.phase) * 0.45;
        const my =
          0.35 + ((m.y + t * m.speed * 0.35) % 5.8);
        const mz = m.z + Math.cos(t * m.speed * 0.8 + m.phase) * 0.35;
        moteAttr.setXYZ(i, mx, my, mz);
      }
      moteAttr.needsUpdate = true;
    }

    // 6. Drift atmospheric mist veils slowly across the water basin
    if (!reducedMotion && mistGroupRef.current) {
      mistGroupRef.current.children.forEach((child, idx) => {
        const spec = mistVeils[idx];
        if (spec) {
          child.position.x =
            spec.x + Math.sin(t * spec.speed + spec.phase) * 1.45;
        }
      });
    }

    // 7. Rotate Origin Sanctuary Kinetic Astrolabe
    if (!reducedMotion && originAstrolabeRef.current) {
      originAstrolabeRef.current.position.y =
        0.92 + Math.sin(t * 1.4) * 0.05;
      originAstrolabeRef.current.rotation.y = t * 0.55;
      originAstrolabeRef.current.rotation.z = Math.sin(t * 0.7) * 0.25;
    }

    // 8. Project 3D Arch Threshold Coordinates to Floating HUD Labels
    if (size.width >= 640 && labelMapRef.current.size > 0) {
      for (const spec of monoliths) {
        const el = labelMapRef.current.get(spec.id);
        if (!el) continue;
        const labelY =
          Math.abs(spec.x) < 0.5
            ? WATER_Y + 0.34 + spec.height * 0.36
            : WATER_Y + 0.62;
        tmpPoint.set(spec.x, labelY, spec.z + spec.width * 0.52);
        tmpPoint.project(camera);
        if (tmpPoint.z > 1) {
          el.style.display = 'none';
        } else {
          const px = (tmpPoint.x * 0.5 + 0.5) * size.width;
          const py = (-tmpPoint.y * 0.5 + 0.5) * size.height;
          el.style.display = 'block';
          el.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(
            1
          )}px,0) translate3d(-50%,-50%,0)`;
        }
      }
    }
  });

  // Deterministic DOM Label Overlay Attached to R3F Canvas Wrapper (Avoids React 19 createRoot Race in @react-three/drei <Html>)
  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;';
    parent.appendChild(overlay);
    labelOverlayRef.current = overlay;
    const mapRef = labelMapRef.current;
    return () => {
      mapRef.clear();
      if (overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
      labelOverlayRef.current = null;
    };
  }, [gl]);

  useEffect(() => {
    const overlay = labelOverlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = '';
    labelMapRef.current.clear();
    if (size.width < 640) return;

    for (const spec of monoliths) {
      if (spec.node.depth !== 1 || spec.node.waveNumber !== 1) continue;
      const pct = Math.round(spec.node.conditionalProbability * 100);
      const shortTitle =
        spec.node.title.length > 22
          ? `${spec.node.title.slice(0, 20)}…`
          : spec.node.title;

      const badge = document.createElement('div');
      badge.setAttribute('data-ui', 'true');
      const bg = spec.isRecommended
        ? '#1E4D6B'
        : spec.isSelected
        ? '#161615'
        : '#F1F0EC';
      const fg =
        spec.isRecommended || spec.isSelected ? '#FFFFFF' : '#161615';
      badge.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;user-select:none;white-space:nowrap;padding:4px 8px;text-align:center;font-variant-numeric:tabular-nums;font-size:13px;line-height:1.25;background-color:${bg};color:${fg};`;

      const line1 = document.createElement('div');
      line1.style.fontWeight = '600';
      line1.textContent = spec.isRecommended
        ? `${pct}% · Recommended`
        : `${pct}% likelihood`;

      const line2 = document.createElement('div');
      line2.style.fontWeight = '500';
      line2.textContent = shortTitle;

      badge.appendChild(line1);
      badge.appendChild(line2);
      overlay.appendChild(badge);
      labelMapRef.current.set(spec.id, badge);

      const labelY =
        Math.abs(spec.x) < 0.5
          ? WATER_Y + 0.34 + spec.height * 0.36
          : WATER_Y + 0.62;
      tmpPoint.set(spec.x, labelY, spec.z + spec.width * 0.52);
      tmpPoint.project(camera);
      const px = (tmpPoint.x * 0.5 + 0.5) * size.width;
      const py = (-tmpPoint.y * 0.5 + 0.5) * size.height;
      badge.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(
        1
      )}px,0) translate3d(-50%,-50%,0)`;
    }
  }, [monoliths, size.width, size.height, camera, tmpPoint]);

  const originTerrainY = evalTerrainHeight(0, ORIGIN_Z);

  return (
    <group>
      {/* Luminous Diffused Alabaster Daylight Sky & Mist Horizon */}
      <color attach="background" args={['#F3F1EC']} />
      <fogExp2 attach="fog" args={['#F3F1EC', 0.02]} />

      {/* Diffused Zenith Skylight + Warm Architectural Sun Shaft Key Light */}
      <hemisphereLight
        color="#FAF8F4"
        groundColor="#C9C2B4"
        intensity={0.75}
      />
      <directionalLight
        position={[15, 25, 11]}
        intensity={1.85}
        color="#FFF9EB"
        castShadow
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-14, 12, -10]}
        intensity={0.58}
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

      {/* Perimeter Sanctuary Colonnade of Slender Curved Alabaster Arches Along Far Amphitheater Rim */}
      <group>
        {perimeterColonnade.map((col, idx) => (
          <group
            key={`colonnade-${idx}`}
            position={[col.x, WATER_Y, col.z]}
            rotation={[0, col.rotY, 0]}
          >
            <mesh geometry={col.geo} receiveShadow castShadow>
              <meshPhysicalMaterial
                color="#ECE8DF"
                roughness={0.52}
                metalness={0.02}
                clearcoat={0.14}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Origin Sanctuary Fountain Shrine (Sculpted Parabolic Marble Crown Arch & Kinetic Origin Astrolabe at [0, y, 6.5]) */}
      <group position={[0, originTerrainY, ORIGIN_Z]}>
        {/* Stepped Circular Travertine Sanctuary Fountain Basin */}
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.48, 1.68, 0.16, 32]} />
          <meshPhysicalMaterial
            color="#EAE6DC"
            roughness={0.48}
            metalness={0.04}
            clearcoat={0.18}
          />
        </mesh>
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.08, 1.22, 0.12, 32]} />
          <meshStandardMaterial
            color="#1E4D6B"
            roughness={0.28}
            metalness={0.24}
          />
        </mesh>

        {/* Sculpted Horizontal Marble Spring Ring */}
        <mesh
          position={[0, 0.28, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry args={[0.78, 0.065, 20, 48]} />
          <meshPhysicalMaterial
            color="#F7F5F0"
            roughness={0.38}
            metalness={0.05}
            clearcoat={0.28}
          />
        </mesh>

        {/* Sculpted Parabolic Marble & Bronze Crown Arch Over Origin Fountain */}
        <mesh geometry={originArchGeo} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#F7F5F0"
            roughness={0.42}
            metalness={0.03}
            clearcoat={0.22}
          />
        </mesh>
        <mesh geometry={originInnerArchGeo} castShadow>
          <meshStandardMaterial
            color="#C49A45"
            roughness={0.22}
            metalness={0.68}
          />
        </mesh>

        {/* Rotating Origin Decision Kinetic Astrolabe */}
        <group ref={originAstrolabeRef} position={[0, 0.92, 0]}>
          <mesh rotation={[Math.PI / 5, 0, Math.PI / 8]} castShadow>
            <torusGeometry args={[0.36, 0.02, 20, 48]} />
            <meshStandardMaterial
              color="#C49A45"
              roughness={0.2}
              metalness={0.72}
            />
          </mesh>
          <mesh rotation={[0, Math.PI / 3, Math.PI / 4]} castShadow>
            <torusGeometry args={[0.27, 0.016, 20, 48]} />
            <meshStandardMaterial
              color="#1E4D6B"
              roughness={0.24}
              metalness={0.52}
            />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 32, 32]} />
            <meshPhysicalMaterial
              color="#C49A45"
              roughness={0.16}
              metalness={0.72}
              clearcoat={0.88}
            />
          </mesh>
        </group>

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

      {/* Low-Profile Translucent Specular Water Ribbons Along Valley Channels */}
      {streamCurves.map((s) => {
        const isSelected = s.id === selectedNodeId;
        return (
          <group key={`stream-${s.id}`}>
            <mesh scale={[1, 0.07, 1]}>
              <tubeGeometry
                args={[
                  s.curve,
                  48,
                  s.isRecommended ? 0.36 : isSelected ? 0.25 : 0.16,
                  12,
                  false,
                ]}
              />
              <meshPhysicalMaterial
                color={
                  s.isRecommended
                    ? '#1E4D6B'
                    : isSelected
                    ? '#2B4C63'
                    : '#9BB0BD'
                }
                transparent
                opacity={s.isRecommended ? 0.68 : isSelected ? 0.52 : 0.36}
                roughness={0.06}
                metalness={0.18}
                clearcoat={1.0}
                clearcoatRoughness={0.05}
              />
            </mesh>
          </group>
        );
      })}

      {/* 280 Luminous Flowing Particles Drifting Along River Channels from Origin Fountain to Arches */}
      <points ref={streamPointsRef} geometry={streamParticleGeo}>
        <pointsMaterial
          map={particleTexture ?? undefined}
          size={0.24}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 120 Sunlit Atmospheric Light Motes Gently Floating Above the Sanctuary Basin */}
      <points ref={motePointsRef} geometry={moteParticleGeo}>
        <pointsMaterial
          map={particleTexture ?? undefined}
          color="#FFFDF6"
          size={0.16}
          transparent
          opacity={0.58}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Sculpted Parabolic Carrara Marble Arches & Rotating Kinetic Astrolabes */}
      {monoliths.map((spec) => (
        <ArchSculpture
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
                opacity={0.4}
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
