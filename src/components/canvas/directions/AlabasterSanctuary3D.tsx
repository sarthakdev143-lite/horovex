'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { SliderDeltas } from '@/lib/math/sensitivity';

export interface AlabasterSanctuaryProps {
  nodes?: ProbabilityNode[];
  selectedNodeId?: string | null;
  focusedNodeId?: string | null;
  hoveredNodeId?: string | null;
  goldenPathIds?: string[];
  recommendedPathNodeIds?: string[];
  onSelectNode?: (id: string) => void;
  onNodeSelect?: (node: ProbabilityNode) => void;
  onHoverNode?: (id: string | null) => void;
  levers?: SliderDeltas;
  scrollProgress?: number;
  cameraMode?: 'scroll' | 'focus' | 'overview' | 'fly';
  reducedMotion?: boolean;
}

const DEFAULT_LEVERS: SliderDeltas = {
  executionVelocity: 0,
  capitalBuffer: 0,
  marketTailwind: 0,
  skillPreparation: 0,
};

function getNodeProb(node: ProbabilityNode): number {
  return (
    (node as unknown as { probability?: number }).probability ??
    node.conditionalProbability ??
    0.2
  );
}

interface MonolithPoint {
  id: string;
  node: ProbabilityNode;
  x: number;
  y: number;
  z: number;
  height: number;
  width: number;
  depth: number;
  strataCount: number;
  isRecommended: boolean;
  isSelected: boolean;
  isHovered: boolean;
  parentX: number;
  parentZ: number;
  rankIndex: number;
}

const ORIGIN_GATE_Z = 9.0;
const WATER_Y = -0.38;
const GRID_SEGMENTS = 140;
const TERRAIN_WIDTH = 44;
const TERRAIN_DEPTH = 56;

let cachedSkylightTex: THREE.CanvasTexture | null = null;
function getSkylightTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (cachedSkylightTex) return cachedSkylightTex;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 256);
    const img = ctx.createImageData(128, 256);
    for (let y = 0; y < 256; y++) {
      const v = y / 255;
      const vFade = Math.sin(v * Math.PI) * Math.pow(1 - v * 0.65, 1.3);
      for (let x = 0; x < 128; x++) {
        const u = (x - 63.5) / 63.5;
        const hFade = Math.pow(Math.max(0, 1 - Math.abs(u)), 2.2);
        const a = Math.round(255 * Math.min(1, vFade * hFade));
        const idx = (y * 128 + x) * 4;
        img.data[idx] = 248;
        img.data[idx + 1] = 250;
        img.data[idx + 2] = 252;
        img.data[idx + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  cachedSkylightTex = new THREE.CanvasTexture(canvas);
  cachedSkylightTex.needsUpdate = true;
  return cachedSkylightTex;
}

/**
 * Architectural Stepped Stone Stele (Tadao Ando / Peter Zumthor inspired):
 * Precision-carved horizontal travertine strata plates, vertical honed-alabaster split fins,
 * a recessed glacial-ink or platinum light channel, and a levitating faceted octahedral core.
 * Zero bent tubes, zero muddy gold, zero floating HTML boxes.
 */
function ArchitecturalStoneMonolith({
  m,
  onSelect,
  onHover,
}: {
  m: MonolithPoint;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const outerFrameRef = useRef<THREE.Mesh>(null);
  const innerFrameRef = useRef<THREE.Mesh>(null);
  const rippleOuterRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const skylightTexture = useMemo(() => getSkylightTexture(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const speed = 0.35 + getNodeProb(m.node) * 1.1;

    if (coreRef.current) {
      coreRef.current.position.y =
        m.height * 0.56 + Math.sin(t * 1.4 + m.x * 0.7) * 0.08;
      coreRef.current.rotation.y += delta * speed * 0.7;
      coreRef.current.rotation.x = Math.sin(t * 0.6 + m.rankIndex) * 0.18;
    }

    if (outerFrameRef.current) {
      outerFrameRef.current.position.y =
        m.height * 0.56 + Math.sin(t * 1.4 + m.x * 0.7) * 0.08;
      outerFrameRef.current.rotation.y -= delta * speed * 0.45;
      outerFrameRef.current.rotation.z = Math.PI / 4 + Math.sin(t * 0.4) * 0.12;
    }

    if (innerFrameRef.current) {
      innerFrameRef.current.position.y =
        m.height * 0.56 + Math.sin(t * 1.4 + m.x * 0.7) * 0.08;
      innerFrameRef.current.rotation.x += delta * speed * 0.55;
    }

    if (rippleOuterRef.current) {
      const phase = (t * 0.38 + m.rankIndex * 0.21) % 1;
      const s = 1.0 + phase * 0.55;
      rippleOuterRef.current.scale.set(s, s, 1);
      const mat = rippleOuterRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - phase) * (m.isRecommended ? 0.42 : 0.22);
      }
    }

    if (groupRef.current) {
      const targetScaleY = m.isSelected ? 1.06 : m.isHovered ? 1.03 : 1.0;
      groupRef.current.scale.y = THREE.MathUtils.damp(
        groupRef.current.scale.y,
        targetScaleY,
        5,
        delta
      );
    }
  });

  const finWidth = m.width * 0.34;
  const slitGap = m.width * 0.32;
  const finOffset = (slitGap + finWidth) * 0.5;
  const primaryAccent = m.isRecommended
    ? '#163A50'
    : m.isSelected
    ? '#1E4D6B'
    : '#5C6F7C';
  const stoneColor = m.isRecommended
    ? '#F8F7F4'
    : m.isSelected
    ? '#F3F1EC'
    : '#EAE7E0';
  const plinthColor = m.isRecommended ? '#E5E2DA' : '#DEDAD0';

  // Horizontal architectural louvers / strata plates locking the two vertical stone fins together
  const strataHeights = useMemo(() => {
    const arr: number[] = [];
    const count = m.strataCount;
    for (let i = 0; i < count; i++) {
      const frac = (i + 1) / (count + 1);
      // Leave an open architectural sanctuary chamber around 0.42..0.70 for the levitating core
      if (frac > 0.38 && frac < 0.72) continue;
      arr.push(frac * m.height);
    }
    return arr;
  }, [m.height, m.strataCount]);

  return (
    <group
      ref={groupRef}
      position={[m.x, m.y, m.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(m.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(m.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
    >
      {/* Stepped Rectangular Architectural Water Plinth (3 Crisp Terraced Stone Slabs) */}
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[m.width * 2.1, 0.12, m.depth * 2.1]} />
        <meshStandardMaterial color={plinthColor} roughness={0.62} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[m.width * 1.65, 0.12, m.depth * 1.65]} />
        <meshStandardMaterial color={stoneColor} roughness={0.5} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.26, 0]} receiveShadow castShadow>
        <boxGeometry args={[m.width * 1.28, 0.09, m.depth * 1.28]} />
        <meshStandardMaterial
          color={m.isRecommended ? '#163A50' : '#C9D1D6'}
          roughness={0.24}
          metalness={0.28}
        />
      </mesh>

      {/* Subtle Water Ripple Perimeter Ring */}
      <mesh
        ref={rippleOuterRef}
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
      >
        <ringGeometry args={[m.width * 1.15, m.width * 1.21, 4]} />
        <meshBasicMaterial
          color={m.isRecommended ? '#163A50' : '#7C8E99'}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left & Right Precision-Carved Honed Alabaster Vertical Fins */}
      <mesh
        position={[-finOffset, 0.3 + m.height * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[finWidth, m.height, m.depth]} />
        <meshPhysicalMaterial
          color={stoneColor}
          roughness={0.38}
          metalness={0.03}
          clearcoat={0.2}
          clearcoatRoughness={0.35}
        />
      </mesh>
      <mesh
        position={[finOffset, 0.3 + m.height * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[finWidth, m.height, m.depth]} />
        <meshPhysicalMaterial
          color={stoneColor}
          roughness={0.38}
          metalness={0.03}
          clearcoat={0.2}
          clearcoatRoughness={0.35}
        />
      </mesh>

      {/* Recessed Inner Glacial / Platinum Light Spine */}
      <mesh position={[0, 0.3 + m.height * 0.5, -m.depth * 0.18]}>
        <boxGeometry args={[slitGap * 0.42, m.height * 0.94, m.depth * 0.22]} />
        <meshPhysicalMaterial
          color={primaryAccent}
          roughness={0.15}
          metalness={0.35}
          clearcoat={0.9}
        />
      </mesh>

      {/* Cantilevered Horizontal Travertine Strata Plates */}
      {strataHeights.map((sy, idx) => (
        <mesh
          key={idx}
          position={[0, 0.3 + sy, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[m.width * 1.18, 0.075, m.depth * 1.14]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? stoneColor : plinthColor}
            roughness={0.45}
            metalness={0.06}
          />
        </mesh>
      ))}

      {/* Crown Architectural Lintel Cap */}
      <mesh position={[0, 0.34 + m.height, 0]} castShadow receiveShadow>
        <boxGeometry args={[m.width * 1.32, 0.11, m.depth * 1.24]} />
        <meshPhysicalMaterial
          color={m.isRecommended ? '#163A50' : stoneColor}
          roughness={0.28}
          metalness={m.isRecommended ? 0.32 : 0.06}
          clearcoat={0.4}
        />
      </mesh>
      {m.isRecommended && (
        <mesh position={[0, 0.44 + m.height, 0]} castShadow>
          <boxGeometry args={[m.width * 0.92, 0.06, m.depth * 0.92]} />
          <meshStandardMaterial color="#F8F7F4" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* Levitating Faceted Octahedral Core + Brushed Platinum Gimbal Frame inside the Chamber */}
      <mesh ref={coreRef} position={[0, m.height * 0.56, 0]} castShadow>
        <octahedronGeometry args={[Math.min(0.32, m.width * 0.24), 0]} />
        <meshPhysicalMaterial
          color={m.isRecommended ? '#163A50' : '#2C4A5E'}
          roughness={0.1}
          metalness={0.45}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>
      <mesh ref={outerFrameRef} position={[0, m.height * 0.56, 0]}>
        <torusGeometry args={[Math.min(0.46, m.width * 0.34), 0.016, 12, 4]} />
        <meshStandardMaterial
          color="#D0D7DD"
          roughness={0.2}
          metalness={0.78}
        />
      </mesh>
      <mesh ref={innerFrameRef} position={[0, m.height * 0.56, 0]}>
        <torusGeometry args={[Math.min(0.38, m.width * 0.28), 0.012, 12, 4]} />
        <meshStandardMaterial
          color={m.isRecommended ? '#163A50' : '#8FA0AC'}
          roughness={0.22}
          metalness={0.65}
        />
      </mesh>

      {/* Soft Volumetric Daylight Shaft on Recommended or Selected Monolith */}
      {(m.isRecommended || m.isSelected) && skylightTexture && (
        <mesh position={[0.4, 5.8, 0.2]} rotation={[0.04, 0, -0.07]}>
          <cylinderGeometry args={[0.45, 1.85, 11.5, 28, 1, true]} />
          <meshBasicMaterial
            map={skylightTexture}
            color={m.isRecommended ? '#E8F1F5' : '#F5F7F8'}
            transparent
            opacity={m.isRecommended ? 0.34 : 0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export function AlabasterSanctuary3D({
  nodes = [],
  selectedNodeId,
  focusedNodeId,
  hoveredNodeId = null,
  goldenPathIds = [],
  recommendedPathNodeIds,
  onSelectNode,
  onNodeSelect,
  onHoverNode,
  levers = DEFAULT_LEVERS,
  scrollProgress = 0,
  cameraMode = 'scroll',
  reducedMotion = false,
}: AlabasterSanctuaryProps) {
  const { camera } = useThree();
  const originCoreRef = useRef<THREE.Mesh>(null);
  const originFrameRef = useRef<THREE.Mesh>(null);
  const streamParticlesRef = useRef<THREE.Points>(null);
  const mistMotesRef = useRef<THREE.Points>(null);

  const activeSelectedId =
    focusedNodeId !== undefined ? focusedNodeId : selectedNodeId ?? null;
  const activeGoldenPath =
    recommendedPathNodeIds !== undefined
      ? recommendedPathNodeIds
      : goldenPathIds ?? [];

  const handleSelectNode = (id: string) => {
    if (onSelectNode) onSelectNode(id);
    if (onNodeSelect) {
      const found = nodes.find((n) => n.id === id);
      if (found) onNodeSelect(found);
    }
  };

  const handleHoverNode = (id: string | null) => {
    if (onHoverNode) onHoverNode(id);
  };

  const leverBoost = useMemo(() => {
    const l = levers || DEFAULT_LEVERS;
    const avg =
      (l.executionVelocity +
        l.capitalBuffer +
        l.marketTailwind +
        l.skillPreparation) /
      4;
    return Math.max(-0.2, Math.min(0.3, avg * 0.25));
  }, [levers]);

  // Position the 5 primary futures across the Sanctuary Basin at z = -4.5..-6.2,
  // Wave 2 at z = -9.2..-11.0, and Depth 2+ downstream at z = -13.5..-19.0
  const monoliths = useMemo<MonolithPoint[]>(() => {
    if (!nodes || nodes.length === 0) return [];

    const depth1 = nodes
      .filter((n) => n.depth === 1)
      .sort(
        (a, b) =>
          (a.waveNumber - b.waveNumber) ||
          getNodeProb(b) - getNodeProb(a)
      );

    const wave1 = depth1.filter((n) => n.waveNumber === 1);
    const wave2Plus = depth1.filter((n) => n.waveNumber >= 2);
    const points: MonolithPoint[] = [];

    const w1Count = Math.max(1, wave1.length);
    const recIdx = wave1.findIndex(
      (n) => activeGoldenPath.includes(n.id) || n.isGoldenPath
    );
    const orderedW1 = [...wave1];
    if (recIdx !== -1 && orderedW1.length >= 3) {
      const [recNode] = orderedW1.splice(recIdx, 1);
      const mid = Math.floor(orderedW1.length / 2);
      orderedW1.splice(mid, 0, recNode);
    }

    orderedW1.forEach((node, idx) => {
      const spread = w1Count === 1 ? 0 : (idx / (w1Count - 1)) * 2 - 1;
      const x = spread * 6.8;
      const z = -4.2 - (1 - Math.abs(spread)) * 1.6;
      const isRecommended =
        activeGoldenPath.includes(node.id) || Boolean(node.isGoldenPath);
      const prob = getNodeProb(node);
      const height = Math.max(
        2.4,
        Math.min(
          5.6,
          2.5 +
            prob * 6.2 +
            (isRecommended ? 0.65 : 0) +
            leverBoost * 1.1
        )
      );
      const width = Math.max(
        1.1,
        Math.min(1.85, 1.12 + prob * 1.35)
      );
      const depth = Math.max(0.68, width * 0.56);

      points.push({
        id: node.id,
        node,
        x,
        y: WATER_Y,
        z,
        height,
        width,
        depth,
        strataCount: isRecommended ? 7 : 5,
        isRecommended,
        isSelected: false,
        isHovered: false,
        parentX: 0,
        parentZ: ORIGIN_GATE_Z,
        rankIndex: idx,
      });
    });

    if (wave2Plus.length > 0) {
      const w2Count = wave2Plus.length;
      wave2Plus.forEach((node, idx) => {
        const spread = w2Count === 1 ? 0 : (idx / (w2Count - 1)) * 2 - 1;
        const x = spread * 8.4;
        const z = -8.6 - (1 - Math.abs(spread)) * 1.5;
        const isRecommended =
          activeGoldenPath.includes(node.id) || Boolean(node.isGoldenPath);
        const prob = getNodeProb(node);
        const height = Math.max(
          2.1,
          Math.min(4.6, 2.2 + prob * 5.2 + leverBoost * 0.8)
        );
        const width = Math.max(1.0, Math.min(1.55, 1.0 + prob * 1.1));
        points.push({
          id: node.id,
          node,
          x,
          y: WATER_Y,
          z,
          height,
          width,
          depth: width * 0.55,
          strataCount: 5,
          isRecommended,
          isSelected: false,
          isHovered: false,
          parentX: 0,
          parentZ: ORIGIN_GATE_Z,
          rankIndex: idx + orderedW1.length,
        });
      });
    }

    const deeper = nodes
      .filter((n) => n.depth >= 2)
      .sort((a, b) => a.depth - b.depth || getNodeProb(b) - getNodeProb(a));
    const byParent = new Map<string, ProbabilityNode[]>();
    deeper.forEach((n) => {
      const pid = n.parentId || 'root';
      const group = byParent.get(pid) || [];
      group.push(n);
      byParent.set(pid, group);
    });

    byParent.forEach((children, pid) => {
      const parent = points.find((p) => p.id === pid) || points[0];
      const px = parent ? parent.x : 0;
      const pz = parent ? parent.z : -5.0;
      const count = children.length;

      children.forEach((node, idx) => {
        const fan = count === 1 ? 0 : (idx / (count - 1)) * 2 - 1;
        const x = px + fan * 3.8;
        const z = pz - 5.2 - Math.abs(fan) * 0.9;
        const isRecommended =
          activeGoldenPath.includes(node.id) || Boolean(node.isGoldenPath);
        const prob = getNodeProb(node);
        const height = Math.max(
          2.0,
          Math.min(4.2, 2.0 + prob * 4.5)
        );
        const width = Math.max(0.95, Math.min(1.4, 0.95 + prob));

        points.push({
          id: node.id,
          node,
          x,
          y: WATER_Y,
          z,
          height,
          width,
          depth: width * 0.54,
          strataCount: 4,
          isRecommended,
          isSelected: false,
          isHovered: false,
          parentX: px,
          parentZ: pz,
          rankIndex: points.length,
        });
      });
    });

    return points;
  }, [nodes, activeGoldenPath, leverBoost]);

  const activeMonoliths = useMemo<MonolithPoint[]>(
    () =>
      monoliths.map((m) => ({
        ...m,
        isSelected: m.id === activeSelectedId,
        isHovered: m.id === hoveredNodeId,
      })),
    [monoliths, activeSelectedId, hoveredNodeId]
  );

  // Carved Alabaster Canyon & Reflective Basin Terrain
  const evalTerrainHeight = useMemo(() => {
    return (x: number, z: number) => {
      // Central Sanctuary Basin stays submerged below WATER_Y (-0.38) from z = +11 to z = -20
      const radialX = Math.abs(x);
      let h = -0.78;

      // Soft sculpted side canyon walls rising outside the water channel
      const channelHalfWidth =
        z > 2 ? 4.2 + (11 - Math.min(11, z)) * 0.45 : 9.8;
      if (radialX > channelHalfWidth) {
        const excess = radialX - channelHalfWidth;
        h += Math.min(4.2, Math.pow(excess * 0.18, 1.55));
      }

      // Gentle distant horizon amphitheater rise behind z = -19
      if (z < -18.5) {
        const backDist = -18.5 - z;
        h += Math.min(3.6, Math.pow(backDist * 0.16, 1.5));
      }

      // Stepped architectural contour terraces on the side slopes
      if (h > -0.25) {
        const step = 0.32;
        const idx = Math.floor(h / step);
        const frac = h / step - idx;
        const smooth = frac < 0.7 ? frac * 0.35 : 0.245 + (frac - 0.7) * 2.51;
        h = (idx + smooth) * step;
      }

      return Math.max(-0.92, Math.min(4.6, h));
    };
  }, []);

  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_DEPTH,
      GRID_SEGMENTS,
      GRID_SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const lowCol = new THREE.Color('#DCE3E8');
    const midCol = new THREE.Color('#EAE7DF');
    const highCol = new THREE.Color('#F5F3EE');
    const ridgeCol = new THREE.Color('#DEDAD0');
    const temp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i) - 4.0;
      pos.setZ(i, vz);
      const vy = evalTerrainHeight(vx, vz);
      pos.setY(i, vy);

      const norm = Math.max(0, Math.min(1, (vy + 0.9) / 4.5));
      if (norm < 0.22) {
        temp.copy(lowCol).lerp(midCol, norm / 0.22);
      } else {
        temp.copy(midCol).lerp(highCol, (norm - 0.22) / 0.78);
      }
      const band = Math.pow(0.5 + 0.5 * Math.cos((vy / 0.32) * Math.PI * 2), 6);
      if (vy > -0.2) {
        temp.lerp(ridgeCol, band * 0.22);
      }
      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [evalTerrainHeight]);

  useEffect(() => {
    return () => {
      terrainGeometry.dispose();
    };
  }, [terrainGeometry]);

  // 5 Branching Aqueduct Stream Curves + Flowing Light Particles
  const streamData = useMemo(() => {
    const curves = monoliths.map((m) => {
      const start = new THREE.Vector3(m.parentX, WATER_Y + 0.015, m.parentZ);
      const mid1 = new THREE.Vector3(
        THREE.MathUtils.lerp(m.parentX, m.x, 0.32),
        WATER_Y + 0.015,
        THREE.MathUtils.lerp(m.parentZ, m.z, 0.38)
      );
      const mid2 = new THREE.Vector3(
        THREE.MathUtils.lerp(m.parentX, m.x, 0.74),
        WATER_Y + 0.015,
        THREE.MathUtils.lerp(m.parentZ, m.z, 0.72)
      );
      const end = new THREE.Vector3(m.x, WATER_Y + 0.015, m.z);
      return {
        id: m.id,
        isRecommended: m.isRecommended,
        probability: getNodeProb(m.node),
        curve: new THREE.CatmullRomCurve3([start, mid1, mid2, end]),
      };
    });

    const particlesPerCurve = 56;
    const total = Math.max(1, curves.length * particlesPerCurve);
    const positions = new Float32Array(total * 3);
    const meta: { curveIdx: number; offset: number; speed: number }[] = [];

    curves.forEach((c, cIdx) => {
      for (let i = 0; i < particlesPerCurve; i++) {
        const offset = i / particlesPerCurve;
        const pt = c.curve.getPointAt(offset);
        const idx = (cIdx * particlesPerCurve + i) * 3;
        positions[idx] = pt.x;
        positions[idx + 1] = pt.y + 0.03;
        positions[idx + 2] = pt.z;
        meta.push({
          curveIdx: cIdx,
          offset,
          speed: c.isRecommended ? 0.24 : 0.12 + c.probability * 0.2,
        });
      }
    });

    return { curves, positions, meta };
  }, [monoliths]);

  // Subtle Floating Atmospheric Light Motes in the Sunlit Sanctuary Air
  const mistMotes = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = ((i * 37) % 26) - 13;
      positions[i * 3 + 1] = 0.4 + ((i * 19) % 60) * 0.09;
      positions[i * 3 + 2] = 11 - ((i * 53) % 30);
    }
    return positions;
  }, []);

  // Architectural Colonnade Fins along the Sanctuary Corridor (z = +7 to z = -15)
  const colonnadeFins = useMemo(() => {
    const fins: { x: number; z: number; h: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const z = 6.5 - i * 2.8;
      const spread = 10.2 + (i > 2 ? (i - 2) * 0.55 : 0);
      const h = 4.2 - i * 0.15;
      fins.push({ x: -spread, z, h });
      fins.push({ x: spread, z, h });
    }
    return fins;
  }, []);

  // 5-Act Z-Axis Storytelling Camera Choreography + Click-to-Fly Rig
  // Initialized at the overview framing so the first frame (and headless
  // screenshots) already show the composed sanctuary, not a mid-sweep sky.
  const lookAtRef = useRef(new THREE.Vector3(0, 1.1, -5.2));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (originCoreRef.current) {
      originCoreRef.current.position.y = 1.45 + Math.sin(t * 1.5) * 0.08;
      originCoreRef.current.rotation.y += delta * 0.55;
      originCoreRef.current.rotation.x = Math.sin(t * 0.7) * 0.22;
    }
    if (originFrameRef.current) {
      originFrameRef.current.position.y = 1.45 + Math.sin(t * 1.5) * 0.08;
      originFrameRef.current.rotation.y -= delta * 0.38;
      originFrameRef.current.rotation.z = Math.PI / 4 + Math.cos(t * 0.5) * 0.1;
    }

    // Animate Flowing River Particles from Origin Gate into Each Monolith Pool
    if (streamParticlesRef.current && streamData.curves.length > 0) {
      const posAttr = streamParticlesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < streamData.meta.length; i++) {
        const m = streamData.meta[i];
        const curveObj = streamData.curves[m.curveIdx];
        if (!curveObj) continue;
        const u = (m.offset + t * m.speed) % 1;
        const pt = curveObj.curve.getPointAt(u);
        posAttr.setXYZ(i, pt.x, pt.y + 0.03, pt.z);
      }
      posAttr.needsUpdate = true;
    }

    // Animate Subtle Floating Atmospheric Light Motes
    if (mistMotesRef.current) {
      const posAttr = mistMotesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i) + delta * 0.08;
        posAttr.setY(i, y > 6.0 ? 0.4 : y);
      }
      posAttr.needsUpdate = true;
    }

    // Determine Target Camera Position & LookAt
    const selectedMonolith = monoliths.find((m) => m.id === activeSelectedId);
    const recommendedMonolith =
      monoliths.find((m) => m.isRecommended) || monoliths[0];

    let targetPos = new THREE.Vector3(0, 2.3, 15.6);
    let targetLook = new THREE.Vector3(0, 1.15, 6.0);

    if ((cameraMode === 'fly' || cameraMode === 'focus') && selectedMonolith) {
      const sideOffset = selectedMonolith.x >= 0 ? -1.8 : 1.8;
      targetPos.set(
        selectedMonolith.x * 0.82 + sideOffset,
        selectedMonolith.y + selectedMonolith.height * 0.58 + 0.9,
        selectedMonolith.z + 5.2
      );
      targetLook.set(
        selectedMonolith.x,
        selectedMonolith.y + selectedMonolith.height * 0.48,
        selectedMonolith.z
      );
    } else if (cameraMode === 'overview') {
      targetPos.set(0, 4.8, 9.8);
      targetLook.set(0, 1.1, -5.2);
    } else {
      // 5-Act Scroll-Driven Z-Axis Journey (0.00 -> 0.25 -> 0.50 -> 0.75 -> 1.00)
      const p = Math.max(0, Math.min(1, scrollProgress));
      const recX = recommendedMonolith ? recommendedMonolith.x : 0;
      const recZ = recommendedMonolith ? recommendedMonolith.z : -5.6;
      const recH = recommendedMonolith ? recommendedMonolith.height : 4.2;

      // Keyframe 0 (Act I - The Crossroads): Solitary Origin Gate in front of camera
      const pos0 = new THREE.Vector3(0.0, 2.15, 15.4);
      const look0 = new THREE.Vector3(0.0, 1.25, 7.5);

      // Keyframe 1 (Act II - The Bifurcation): Gliding through the Origin Gate over the 5 branching channels
      const pos1 = new THREE.Vector3(-1.6, 3.1, 7.4);
      const look1 = new THREE.Vector3(0.2, 0.6, -2.5);

      // Keyframe 2 (Act III - The Sanctuary of Futures): Wide architectural panorama of the 5 stone steles
      const pos2 = new THREE.Vector3(1.8, 2.6, 2.2);
      const look2 = new THREE.Vector3(0.0, 1.45, -6.2);

      // Keyframe 3 (Act IV - The Mentor's Compass): Close cinematic orbit on the Glacial-Blue Recommended Stele
      const pos3 = new THREE.Vector3(recX + 1.65, 1.95, recZ + 4.4);
      const look3 = new THREE.Vector3(recX, WATER_Y + recH * 0.52, recZ);

      // Keyframe 4 (Act V - The Threshold): Elevated serene sanctuary vista
      const pos4 = new THREE.Vector3(0.0, 4.2, 6.6);
      const look4 = new THREE.Vector3(0.0, 1.2, -5.5);

      if (p < 0.25) {
        const u = THREE.MathUtils.smoothstep(p / 0.25, 0, 1);
        targetPos.lerpVectors(pos0, pos1, u);
        targetLook.lerpVectors(look0, look1, u);
      } else if (p < 0.5) {
        const u = THREE.MathUtils.smoothstep((p - 0.25) / 0.25, 0, 1);
        targetPos.lerpVectors(pos1, pos2, u);
        targetLook.lerpVectors(look1, look2, u);
      } else if (p < 0.75) {
        const u = THREE.MathUtils.smoothstep((p - 0.5) / 0.25, 0, 1);
        targetPos.lerpVectors(pos2, pos3, u);
        targetLook.lerpVectors(look2, look3, u);
      } else {
        const u = THREE.MathUtils.smoothstep((p - 0.75) / 0.25, 0, 1);
        targetPos.lerpVectors(pos3, pos4, u);
        targetLook.lerpVectors(look3, look4, u);
      }
    }

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetPos.x,
      3.8,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetPos.y,
      3.8,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetPos.z,
      3.8,
      delta
    );

    lookAtRef.current.x = THREE.MathUtils.damp(
      lookAtRef.current.x,
      targetLook.x,
      4.2,
      delta
    );
    lookAtRef.current.y = THREE.MathUtils.damp(
      lookAtRef.current.y,
      targetLook.y,
      4.2,
      delta
    );
    lookAtRef.current.z = THREE.MathUtils.damp(
      lookAtRef.current.z,
      targetLook.z,
      4.2,
      delta
    );
    camera.lookAt(lookAtRef.current);
  });

  return (
    <group>
      {/* Luminous Diffused Alabaster Daylight Sky & Mist Horizon */}
      <color attach="background" args={['#F3F1EC']} />
      <fogExp2 attach="fog" args={['#F3F1EC', 0.02]} />

      {/* Diffused Zenith Skylight + Warm Architectural Sun Shaft Key Light */}
      <ambientLight color="#FAF9F5" intensity={0.78} />
      <directionalLight
        position={[15, 25, 11]}
        intensity={1.75}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={65}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      <directionalLight
        position={[-14, 12, -10]}
        intensity={0.52}
        color="#D2DCE2"
      />

      {/* Sculpted Honed Alabaster Terrain */}
      <mesh geometry={terrainGeometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>

      {/* Mirror-Smooth Glacial Reflection Basin Floor */}
      <mesh
        position={[0, WATER_Y, -4.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[28, 38]} />
        <meshPhysicalMaterial
          color="#D5E0E6"
          roughness={0.06}
          metalness={0.18}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* Perimeter Architectural Colonnade Fins Receding into the Mist */}
      {colonnadeFins.map((fin, idx) => (
        <mesh
          key={`colonnade-${idx}`}
          position={[fin.x, WATER_Y + fin.h * 0.5, fin.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.26, fin.h, 0.95]} />
          <meshStandardMaterial
            color="#EAE7DF"
            roughness={0.55}
            metalness={0.03}
          />
        </mesh>
      ))}

      {/* ACT I FOREGROUND STATION: The Solitary Origin Threshold Sanctuary at z = +9.0 */}
      <group position={[0, WATER_Y, ORIGIN_GATE_Z]}>
        {/* Stepped Square Travertine Origin Plinth */}
        <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.4, 0.12, 3.2]} />
          <meshStandardMaterial color="#DFDCD3" roughness={0.58} metalness={0.04} />
        </mesh>
        <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.5, 0.1, 2.4]} />
          <meshStandardMaterial color="#F4F2ED" roughness={0.46} metalness={0.05} />
        </mesh>
        {/* Inner Glacial Pool */}
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[2.5, 0.04, 1.6]} />
          <meshPhysicalMaterial
            color="#163A50"
            roughness={0.08}
            metalness={0.32}
            clearcoat={1.0}
          />
        </mesh>

        {/* Twin Tall Carved Alabaster Threshold Pylons Framing the Origin Gate */}
        <mesh position={[-1.42, 1.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.9, 0.78]} />
          <meshPhysicalMaterial
            color="#F7F6F2"
            roughness={0.36}
            metalness={0.03}
            clearcoat={0.2}
          />
        </mesh>
        <mesh position={[1.42, 1.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 2.9, 0.78]} />
          <meshPhysicalMaterial
            color="#F7F6F2"
            roughness={0.36}
            metalness={0.03}
            clearcoat={0.2}
          />
        </mesh>
        {/* Cantilevered Horizon Bridge Beam */}
        <mesh position={[0, 3.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.64, 0.14, 0.92]} />
          <meshStandardMaterial color="#EAE7DF" roughness={0.42} metalness={0.05} />
        </mesh>

        {/* Levitating Glacial-Ink Octahedral Origin Core & Brushed Platinum Gimbal */}
        <mesh ref={originCoreRef} position={[0, 1.45, 0]} castShadow>
          <octahedronGeometry args={[0.34, 0]} />
          <meshPhysicalMaterial
            color="#163A50"
            roughness={0.08}
            metalness={0.48}
            clearcoat={1.0}
          />
        </mesh>
        <mesh ref={originFrameRef} position={[0, 1.45, 0]}>
          <torusGeometry args={[0.54, 0.018, 12, 4]} />
          <meshStandardMaterial
            color="#D0D7DD"
            roughness={0.18}
            metalness={0.82}
          />
        </mesh>
      </group>

      {/* ACT II AQUEDUCT CHANNELS: Precision Recessed Water Channels + Flowing Light Particles */}
      {streamData.curves.map((s) => (
        <mesh key={`channel-${s.id}`} scale={[1, 0.08, 1]}>
          <tubeGeometry
            args={[
              s.curve,
              44,
              s.isRecommended ? 0.24 : 0.12,
              8,
              false,
            ]}
          />
          <meshPhysicalMaterial
            color={s.isRecommended ? '#163A50' : '#8FA2AE'}
            roughness={0.08}
            metalness={0.28}
            clearcoat={1.0}
          />
        </mesh>
      ))}

      <points ref={streamParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[streamData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#163A50"
          size={0.09}
          transparent
          opacity={0.75}
          sizeAttenuation
        />
      </points>

      {/* Atmospheric Light Motes Drifting in the Sunbeams */}
      <points ref={mistMotesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[mistMotes, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#FFFFFF"
          size={0.06}
          transparent
          opacity={0.45}
          sizeAttenuation
        />
      </points>

      {/* ACT III & IV SANCTUARY MONOLITHS: Carved Stone Steles Rising from the Basin */}
      {activeMonoliths.map((m) => (
        <ArchitecturalStoneMonolith
          key={m.id}
          m={m}
          onSelect={handleSelectNode}
          onHover={handleHoverNode}
        />
      ))}
    </group>
  );
}

export default AlabasterSanctuary3D;
