'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';

/**
 * ALABASTER LIGHT TREE
 *
 * The decision tree as a physical light study: luminous filaments rising from a
 * single point of light above a polished stone floor, into alabaster mist.
 *
 * One visual channel per variable.
 *   probability   -> filament width
 *   time horizon  -> the height at which the filament resolves
 *   recommended   -> the single blue accent (everything else is glacial steel)
 */

export interface LightTreeCameraState {
  /** 0 = origin, 1 = bifurcation, 2 = horizon, 3 = mentor */
  phase: number;
  /** local progress through the current scene act, 0..1 */
  progress: number;
}

export interface AlabasterLightTree3DProps {
  nodes: ProbabilityNode[];
  goldenPathIds: string[];
  cameraStateRef: { current: LightTreeCameraState };
  reducedMotion?: boolean;
}

const FOG = '#F0EFEC';
const BLUE = '#1E4FD8';
const BLUE_LIGHT = '#7FA8FF';
const STEEL_EDGE = '#8D9EAB';
const STEEL_CORE = '#E6EDF3';

/* -------------------------------------------------------------------------- */
/*  Procedural textures                                                       */
/* -------------------------------------------------------------------------- */

let haloTexture: THREE.CanvasTexture | null = null;
function getHaloTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (haloTexture) return haloTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }
  haloTexture = new THREE.CanvasTexture(canvas);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  return haloTexture;
}

/* -------------------------------------------------------------------------- */
/*  Shaders                                                                   */
/* -------------------------------------------------------------------------- */

const RIBBON_VERTEX = /* glsl */ `
  attribute float aSide;
  attribute float aU;
  attribute float aSeed;
  uniform float uWidth;
  varying float vSide;
  varying float vU;
  varying float vSeed;
  varying float vDepth;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Camera-facing ribbon: both vertices share a position, and the width is
    // applied in view space, so it keeps a physical size at any angle.
    float tips = smoothstep(0.0, 0.06, aU) * (1.0 - smoothstep(0.96, 1.0, aU));
    mv.x += aSide * uWidth * (0.15 + 0.85 * tips) * (0.9 + 0.1 * sin(aU * 11.0 + aSeed * 6.2831));
    vSide = aSide;
    vU = aU;
    vSeed = aSeed;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const RIBBON_FRAGMENT = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uEdge;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  uniform float uHalo;
  uniform float uFogNear;
  uniform float uFogFar;
  varying float vSide;
  varying float vU;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = clamp(abs(vSide), 0.0, 1.0);
    float soft = pow(1.0 - d, 1.6);
    float core = pow(1.0 - d, 8.0);

    float fog = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
    float flow = 0.68 + 0.32 * sin(vU * 6.5 - uTime * uPulse + vSeed * 6.2831);
    float breathe = 0.94 + 0.06 * sin(uTime * 0.3 + vSeed * 6.2831);
    float ends = smoothstep(0.0, 0.035, vU) * (1.0 - smoothstep(0.975, 1.0, vU));

    vec3 color;
    float alpha;

    if (uHalo > 0.5) {
      color = uEdge;
      alpha = soft * soft * 0.3 * uOpacity * fog * breathe * ends;
    } else {
      // A crisp, almost opaque centreline carries the drawing; the soft body
      // around it is only atmosphere. Without the hard core these read as
      // airbrushed wires.
      float line = smoothstep(0.2, 0.035, d);
      color = mix(uEdge, uCore, max(line, core));
      alpha = (line * 0.9 + soft * 0.2) * uOpacity * fog * (0.82 + 0.18 * flow) * breathe * ends;
    }

    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const MIST_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MIST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uScale;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    float n = fbm(vUv * uScale + vec2(uTime * 0.005, uTime * 0.0012));
    float edge =
      smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) *
      smoothstep(0.0, 0.38, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
    float alpha = clamp(n * n * 1.9, 0.0, 1.0) * uOpacity * edge;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const FLOOR_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  uniform vec3 uNear;
  uniform vec3 uFar;
  uniform vec3 uGlow;
  uniform vec2 uGlowCenter;
  uniform float uGlowRadius;
  varying vec3 vWorld;

  void main() {
    float gradual = 1.0 - smoothstep(-34.0, 2.0, vWorld.z);
    vec3 color = mix(uNear, uFar, gradual);
    float pool = smoothstep(uGlowRadius, 0.0, length(vWorld.xz - uGlowCenter));
    color = mix(color, uGlow, pool * 0.16);
    float alpha = 0.72 * (1.0 - smoothstep(20.0, 46.0, length(vWorld.xz - vec2(0.0, -9.0))));
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* -------------------------------------------------------------------------- */
/*  The room                                                                  */
/* -------------------------------------------------------------------------- */

const WALL_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WALL_FRAGMENT = /* glsl */ `
  varying vec3 vWorld;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    // Lime plaster: fine tooth, a little unevenness at the trowel scale.
    float tooth = noise(vWorld.xy * 34.0);
    float trowel = noise(vWorld.xy * vec2(1.1, 0.62));
    vec3 top = vec3(0.951, 0.947, 0.934);
    vec3 base = mix(vec3(0.906, 0.902, 0.889), top, smoothstep(0.0, 13.0, vWorld.y));
    base += (tooth - 0.5) * 0.02 + (trowel - 0.5) * 0.016;

    // A recessed niche behind the tree, so pale filaments have something to sit against.
    float niche = exp(-pow(vWorld.x * 0.15, 2.0)) * exp(-pow((vWorld.y - 4.2) * 0.2, 2.0));
    vec3 color = mix(base, vec3(0.838, 0.847, 0.856), niche * 0.46);

    // The blue the tree throws onto the wall.
    float wash = exp(-pow(vWorld.x * 0.11, 2.0)) * exp(-pow((vWorld.y - 4.4) * 0.19, 2.0));
    color = mix(color, vec3(0.70, 0.79, 0.98), wash * 0.55);

    gl_FragColor = vec4(color, 1.0);
  }
`;
/* -------------------------------------------------------------------------- */
/*  Geometry                                                                  */
/* -------------------------------------------------------------------------- */

function buildRibbon(
  curve: THREE.CatmullRomCurve3,
  seed: number,
  segments = 96
): THREE.BufferGeometry {
  const count = (segments + 1) * 2;
  const positions = new Float32Array(count * 3);
  const sides = new Float32Array(count);
  const us = new Float32Array(count);
  const seeds = new Float32Array(count);
  const indices: number[] = [];
  const p = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    curve.getPointAt(u, p);
    for (let s = 0; s < 2; s++) {
      const vi = i * 2 + s;
      positions[vi * 3] = p.x;
      positions[vi * 3 + 1] = p.y;
      positions[vi * 3 + 2] = p.z;
      sides[vi] = s === 0 ? -1 : 1;
      us[vi] = u;
      seeds[vi] = seed;
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
  geo.setAttribute('aU', new THREE.BufferAttribute(us, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geo.setIndex(indices);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, -5), 48);
  return geo;
}

interface RibbonMaterialOptions {
  core: string;
  edge: string;
  opacity: number;
  pulse: number;
  halo?: boolean;
  fogNear?: number;
  fogFar?: number;
}

function makeRibbonMaterial(o: RibbonMaterialOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: RIBBON_VERTEX,
    fragmentShader: RIBBON_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uWidth: { value: 0.08 },
      uCore: { value: new THREE.Color(o.core) },
      uEdge: { value: new THREE.Color(o.edge) },
      uOpacity: { value: o.opacity },
      uTime: { value: 0 },
      uPulse: { value: o.pulse },
      uHalo: { value: o.halo ? 1 : 0 },
      uFogNear: { value: o.fogNear ?? 13 },
      uFogFar: { value: o.fogFar ?? 26 },
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Data -> tree                                                              */
/* -------------------------------------------------------------------------- */

function probabilityOf(node: ProbabilityNode): number {
  const p =
    (node as unknown as { probability?: number }).probability ??
    node.conditionalProbability;
  return Number.isFinite(p) ? Math.max(0.02, Math.min(1, p)) : 0.2;
}

function horizonDays(node: ProbabilityNode): number {
  if (typeof node.timeHorizonDays === 'number') return node.timeHorizonDays;
  const text = (node.timeHorizon ?? '').toLowerCase();
  const match = /(\d+)/.exec(text);
  if (!match) return 180;
  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value)) return 180;
  return text.includes('year') ? value * 365 : value * 30;
}

/** A tall future resolves higher in the hall. */
function horizonHeight(node: ProbabilityNode): number {
  const days = Math.max(30, Math.min(1100, horizonDays(node)));
  const norm =
    (Math.log(days) - Math.log(30)) / (Math.log(1100) - Math.log(30));
  return 3.3 + norm * 1.65;
}

const ORIGIN = new THREE.Vector3(0, 0.55, 1.0);

interface Branch {
  node: ProbabilityNode;
  recommended: boolean;
  probability: number;
  tip: THREE.Vector3;
  geometry: THREE.BufferGeometry;
  haloGeometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  haloMaterial: THREE.ShaderMaterial;
}

interface Tree {
  branches: Branch[];
  unresolved: {
    geometry: THREE.BufferGeometry;
    haloGeometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    haloMaterial: THREE.ShaderMaterial;
  }[];
  downwind: {
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
  }[];
  recommended: THREE.Vector3;
  materials: THREE.ShaderMaterial[];
  unresolvedMaterials: THREE.ShaderMaterial[];
}

function buildTree(nodes: ProbabilityNode[], goldenPathIds: string[]): Tree {
  const isRecommended = (n: ProbabilityNode) =>
    goldenPathIds.includes(n.id) || Boolean(n.isGoldenPath);

  const wave1 = nodes
    .filter((n) => n.depth === 1)
    .sort((a, b) => probabilityOf(b) - probabilityOf(a));

  const materials: THREE.ShaderMaterial[] = [];
  const unresolvedMaterials: THREE.ShaderMaterial[] = [];
  const branches: Branch[] = [];
  const count = Math.max(1, wave1.length);

  wave1.forEach((node, idx) => {
    const spread = count === 1 ? 0 : (idx / (count - 1)) * 2 - 1;
    const recommended = isRecommended(node);
    const prob = probabilityOf(node);
    const tipY = horizonHeight(node);
    const tip = new THREE.Vector3(
      spread * 6.2,
      tipY,
      -9.2 - (1 - Math.abs(spread)) * 0.9
    );

    const curve = new THREE.CatmullRomCurve3(
      [
        ORIGIN.clone(),
        new THREE.Vector3(spread * 1.25, 0.62, -1.35),
        new THREE.Vector3(spread * 4.15, tipY * 0.62, -5.5),
        tip,
      ],
      false,
      'centripetal',
      0.5
    );

    const halfWidth = 0.04 + prob * 0.15;
    const geometry = buildRibbon(curve, idx / count, 160);
    const haloGeometry = buildRibbon(curve, idx / count, 110);

    const material = makeRibbonMaterial({
      core: recommended ? BLUE : STEEL_CORE,
      edge: recommended ? BLUE_LIGHT : STEEL_EDGE,
      opacity: recommended ? 0.82 : 0.62,
      pulse: recommended ? 0.8 : 0.4,
    });
    material.uniforms.uWidth.value = halfWidth * 2.4;

    const haloMaterial = makeRibbonMaterial({
      core: recommended ? BLUE : STEEL_EDGE,
      edge: recommended ? BLUE_LIGHT : STEEL_EDGE,
      opacity: recommended ? 0.9 : 0.42,
      pulse: 0.2,
      halo: true,
    });
    haloMaterial.uniforms.uWidth.value = halfWidth * (recommended ? 4.0 : 3.0) * 2.4;

    materials.push(material, haloMaterial);

    branches.push({
      node,
      recommended,
      probability: prob,
      tip,
      geometry,
      haloGeometry,
      material,
      haloMaterial,
    });
  });

  // Second-order continuations, only when the engine produced them.
  const downwind: Tree['downwind'] = [];
  const deeper = nodes.filter((n) => n.depth >= 2).slice(0, 12);
  if (deeper.length > 0) {
    const byParent = new Map<string, ProbabilityNode[]>();
    deeper.forEach((n) => {
      const key = n.parentId ?? 'root';
      const list = byParent.get(key) ?? [];
      list.push(n);
      byParent.set(key, list);
    });

    byParent.forEach((children, parentId) => {
      const parent = branches.find((b) => b.node.id === parentId);
      if (!parent) return;
      children.slice(0, 4).forEach((child, i) => {
        const fan = children.length === 1 ? 0 : (i / (children.length - 1)) * 2 - 1;
        const tip = new THREE.Vector3(
          parent.tip.x + fan * 1.7,
          parent.tip.y + 0.3 + Math.abs(fan) * 0.22,
          parent.tip.z - 3.0
        );
        const curve = new THREE.CatmullRomCurve3(
          [parent.tip.clone(), parent.tip.clone().lerp(tip, 0.5), tip],
          false,
          'centripetal'
        );
        const geometry = buildRibbon(curve, i / 4, 48);
        const material = makeRibbonMaterial({
          core: STEEL_CORE,
          edge: STEEL_EDGE,
          opacity: 0.3,
          pulse: 0.3,
          fogNear: 12,
          fogFar: 21,
        });
        material.uniforms.uWidth.value = 0.02 + probabilityOf(child) * 0.07;
        materials.push(material);
        downwind.push({ geometry, material });
      });
    });
  }

  // Unresolved future filaments: the recommended node has not been expanded,
  // so these are drawn as light that never resolves into a node.
  const recommendedBranch = branches.find((b) => b.recommended) ?? branches[0];
  const unresolved: Tree['unresolved'] = [];
  if (recommendedBranch) {
    for (let i = 0; i < 5; i++) {
      const fan = (i / 4) * 2 - 1;
      const tip = new THREE.Vector3(
        recommendedBranch.tip.x + fan * 1.9,
        recommendedBranch.tip.y + 0.55 + Math.abs(fan) * 0.3,
        recommendedBranch.tip.z - 3.8 - Math.abs(fan) * 0.6
      );
      const curve = new THREE.CatmullRomCurve3(
        [
          recommendedBranch.tip.clone(),
          recommendedBranch.tip
            .clone()
            .lerp(tip, 0.5)
            .setY(recommendedBranch.tip.y + 0.3),
          tip,
        ],
        false,
        'centripetal'
      );
      const geometry = buildRibbon(curve, i / 5, 40);
      const material = makeRibbonMaterial({
        core: BLUE,
        edge: BLUE_LIGHT,
        opacity: 0.16,
        pulse: 0.35,
        fogNear: 15,
        fogFar: 28,
      });
      material.uniforms.uWidth.value = 0.02;
      const haloGeometry = buildRibbon(curve, i / 5, 32);
      const haloMaterial = makeRibbonMaterial({
        core: BLUE,
        edge: BLUE_LIGHT,
        opacity: 0.3,
        pulse: 0.2,
        halo: true,
        fogNear: 15,
        fogFar: 28,
      });
      haloMaterial.uniforms.uWidth.value = 0.1;
      materials.push(material, haloMaterial);
      unresolvedMaterials.push(material, haloMaterial);
      unresolved.push({ geometry, haloGeometry, material, haloMaterial });
    }
  }

  return {
    branches,
    unresolved,
    downwind,
    recommended: recommendedBranch
      ? recommendedBranch.tip.clone()
      : new THREE.Vector3(0, 3.4, -9.5),
    materials,
    unresolvedMaterials,
  };
}

/* -------------------------------------------------------------------------- */
/*  Camera                                                                    */
/* -------------------------------------------------------------------------- */

interface Pose {
  from: THREE.Vector3;
  to: THREE.Vector3;
  lookFrom: THREE.Vector3;
  lookTo: THREE.Vector3;
}

const HORIZON_BEATS = 4;

function buildPoses(rec: THREE.Vector3): Pose[] {
  return [
    {
      // Low, close to the origin. The five filaments open upward across the hall.
      from: new THREE.Vector3(0, 1.06, 3.6),
      to: new THREE.Vector3(0, 0.94, 2.9),
      lookFrom: new THREE.Vector3(0, 1.34, -2.2),
      lookTo: new THREE.Vector3(0, 1.46, -2.9),
    },
    {
      // Three-quarter view: the whole fan, the floor, the horizon.
      from: new THREE.Vector3(2.6, 2.85, 7.8),
      to: new THREE.Vector3(0.9, 2.35, 6.4),
      lookFrom: new THREE.Vector3(0, 2.4, -4.2),
      lookTo: new THREE.Vector3(0.35, 2.55, -5.0),
    },
    {
      // Low over the waterline: the tree and its reflection, one horizon.
      from: new THREE.Vector3(0, 0.62, 7.4),
      to: new THREE.Vector3(0, 0.52, 6.0),
      lookFrom: new THREE.Vector3(0, 2.05, -6.0),
      lookTo: new THREE.Vector3(0, 2.25, -6.8),
    },
    {
      // The resolved future, seen from its own side of the hall.
      from: new THREE.Vector3(-4.9, 3.35, 9.2),
      to: new THREE.Vector3(-3.9, 3.05, 7.8),
      lookFrom: new THREE.Vector3(0.9, 2.7, -5.4),
      lookTo: new THREE.Vector3(1.0, 2.85, -6.1),
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function AlabasterLightTree3D({
  nodes,
  goldenPathIds,
  cameraStateRef,
  reducedMotion = false,
}: AlabasterLightTree3DProps) {
  const tree = useMemo(() => buildTree(nodes, goldenPathIds), [nodes, goldenPathIds]);
  const poses = useMemo(() => buildPoses(tree.recommended), [tree.recommended]);
  const { camera, size } = useThree();

  const lookRef = useRef(new THREE.Vector3(0, 1.7, -2.5));
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.Vector3());
  const revealRef = useRef(0);

  const halo = useMemo(() => getHaloTexture(), []);

  const floorMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERTEX,
        fragmentShader: FLOOR_FRAGMENT,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uNear: { value: new THREE.Color('#F4F3EF') },
          uFar: { value: new THREE.Color('#E6EBF0') },
          uGlow: { value: new THREE.Color(BLUE_LIGHT) },
          uGlowCenter: { value: new THREE.Vector2(0, 0.6) },
          uGlowRadius: { value: 5 },
        },
      }),
    []
  );

  const mistMaterials = useMemo(
    () =>
      [
        { color: '#FCFBF8', opacity: 0.42, scale: 1.9, z: -4.2, y: 4.4 },
        { color: '#F6F8FA', opacity: 0.5, scale: 2.4, z: -8.0, y: 5.0 },
        { color: '#E4EDFA', opacity: 0.55, scale: 3.0, z: -12.5, y: 5.6 },
      ].map(
        (m) =>
          new THREE.ShaderMaterial({
            vertexShader: MIST_VERTEX,
            fragmentShader: MIST_FRAGMENT,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uColor: { value: new THREE.Color(m.color) },
              uOpacity: { value: m.opacity },
              uTime: { value: 0 },
              uScale: { value: m.scale },
            },
          })
      ),
    []
  );

  const wallMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WALL_VERTEX,
        fragmentShader: WALL_FRAGMENT,
      }),
    []
  );

  // A mirrored, dimmed copy of each filament. Still water keeps the core
  // sharp; the glow is left out so the reflection never smears into a band.
  const reflectionMaterials = useMemo(
    () =>
      tree.branches.map((b) => {
        const core = makeRibbonMaterial({
          core: b.recommended ? BLUE : STEEL_CORE,
          edge: b.recommended ? BLUE_LIGHT : STEEL_EDGE,
          opacity: 0.26,
          pulse: 0.25,
          fogNear: 5,
          fogFar: 16,
        });
        core.uniforms.uWidth.value = b.material.uniforms.uWidth.value * 1.15;
        return core;
      }),
    [tree]
  );

  useEffect(() => {
    return () => {
      tree.branches.forEach((b) => {
        b.geometry.dispose();
        b.haloGeometry.dispose();
        b.material.dispose();
        b.haloMaterial.dispose();
      });
      tree.unresolved.forEach((u) => {
        u.geometry.dispose();
        u.haloGeometry.dispose();
        u.material.dispose();
        u.haloMaterial.dispose();
      });
      tree.downwind.forEach((d) => {
        d.geometry.dispose();
        d.material.dispose();
      });
      floorMaterial.dispose();
      wallMaterial.dispose();
      mistMaterials.forEach((m) => m.dispose());
      reflectionMaterials.forEach((m) => m.dispose());
    };
  }, [tree, floorMaterial, wallMaterial, mistMaterials, reflectionMaterials]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    if (!reducedMotion) {
      tree.materials.forEach((m) => {
        m.uniforms.uTime.value = t;
      });
      mistMaterials.forEach((m) => {
        m.uniforms.uTime.value = t;
      });
    }

    const phase = cameraStateRef.current.phase;
    const revealTarget = phase >= 3 ? 0 : phase >= 2 ? 1 : 0;
    revealRef.current = THREE.MathUtils.damp(
      revealRef.current,
      revealTarget,
      reducedMotion ? 100 : 2.2,
      dt
    );
    tree.unresolvedMaterials.forEach((m) => {
      const base = m.uniforms.uHalo.value > 0.5 ? 0.3 : 0.16;
      m.uniforms.uOpacity.value = base * revealRef.current;
    });

    const poseIndex = Math.max(0, Math.min(HORIZON_BEATS - 1, Math.round(phase)));
    const pose = poses[poseIndex];
    const raw = Math.max(0, Math.min(1, cameraStateRef.current.progress));
    const u = THREE.MathUtils.smoothstep(raw, 0.14, 0.9);

    targetPos.current.lerpVectors(pose.from, pose.to, u);
    targetLook.current.lerpVectors(pose.lookFrom, pose.lookTo, u);

    const aspect = size.width / Math.max(1, size.height);
    const fit = aspect < 0.95 ? 1 + (0.95 - aspect) * 1.55 : 1;
    scratch.current.copy(targetPos.current).sub(targetLook.current).multiplyScalar(fit);
    targetPos.current.copy(targetLook.current).add(scratch.current);

    if (reducedMotion) {
      camera.position.copy(targetPos.current);
      lookRef.current.copy(targetLook.current);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.current.x, 2.4, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.current.y, 2.4, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.current.z, 2.4, dt);
      lookRef.current.x = THREE.MathUtils.damp(lookRef.current.x, targetLook.current.x, 2.8, dt);
      lookRef.current.y = THREE.MathUtils.damp(lookRef.current.y, targetLook.current.y, 2.8, dt);
      lookRef.current.z = THREE.MathUtils.damp(lookRef.current.z, targetLook.current.z, 2.8, dt);
    }
    camera.lookAt(lookRef.current);
  });

  return (
    <group>
      <color attach="background" args={[FOG]} />

      {/* The room: a lime-plaster wall with a recessed niche */} 
      <mesh position={[0, 30, -26]} material={wallMaterial} renderOrder={-1}>
        <planeGeometry args={[220, 60]} />
      </mesh>

      {/* Polished stone floor, dissolving into mist at the horizon */}
      <mesh
        position={[0, 0, -12]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={floorMaterial}
        renderOrder={0}
      >
        <planeGeometry args={[90, 90]} />
      </mesh>

      {/* Reflection in the polished floor: each filament mirrored below the
          stone and read back through its translucent surface. */}
      <group scale={[1, -1, 1]}>
        {tree.branches.map((b, i) => (
          <group key={`reflection-${b.node.id}`}>
            <mesh
              geometry={b.geometry}
              material={reflectionMaterials[i]}
              renderOrder={1}
              frustumCulled={false}
            />
          </group>
        ))}
      </group>

      {/* The pool of light where the futures begin */}
      {halo && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.012, 1.0]}
          renderOrder={3}
        >
          <planeGeometry args={[5.2, 3.2]} />
          <meshBasicMaterial
            map={halo}
            color={BLUE_LIGHT}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Alabaster mist */}
      {mistMaterials.map((material, i) => (
        <mesh
          key={`mist-${i}`}
          position={[0, [4.4, 5.0, 5.6][i], [-4.2, -8.0, -12.5][i]]}
          material={material}
          renderOrder={4 + i}
        >
          <planeGeometry args={[64, 24]} />
        </mesh>
      ))}

      {/* The origin: a single point of light in the floor */}
      {halo && (
        <sprite position={[0, 0.57, 1.0]} scale={[0.62, 0.62, 1]} renderOrder={10}>
          <spriteMaterial
            map={halo}
            color="#D3E2FF"
            transparent
            opacity={0.75}
            depthWrite={false}
          />
        </sprite>
      )}
      <mesh position={[0, 0.57, 1.0]} renderOrder={10}>
        <sphereGeometry args={[0.011, 12, 12]} />
        <meshBasicMaterial color="#3B6BFF" />
      </mesh>

      {/* The five futures */}
      {tree.branches.map((b) => (
        <group key={`branch-${b.node.id}`}>
          <mesh
            geometry={b.haloGeometry}
            material={b.haloMaterial}
            renderOrder={7}
            frustumCulled={false}
          />
          <mesh
            geometry={b.geometry}
            material={b.material}
            renderOrder={8}
            frustumCulled={false}
          />
          <mesh position={b.tip} renderOrder={9}>
            <sphereGeometry args={[b.recommended ? 0.038 : 0.026, 14, 14]} />
            <meshBasicMaterial color={b.recommended ? BLUE : '#93A6B4'} />
          </mesh>
          {halo && (
            <sprite
              position={b.tip}
              scale={[b.recommended ? 1.05 : 0.6, b.recommended ? 1.05 : 0.6, 1]}
              renderOrder={9}
            >
              <spriteMaterial
                map={halo}
                color={b.recommended ? '#6F97FF' : '#C6D3DC'}
                transparent
                opacity={b.recommended ? 0.65 : 0.32}
                depthWrite={false}
              />
            </sprite>
          )}
        </group>
      ))}

      {/* Unresolved continuations of the recommended future */}
      {tree.unresolved.map((u, i) => (
        <group key={`unresolved-${i}`}>
          <mesh
            geometry={u.haloGeometry}
            material={u.haloMaterial}
            renderOrder={7}
            frustumCulled={false}
          />
          <mesh
            geometry={u.geometry}
            material={u.material}
            renderOrder={8}
            frustumCulled={false}
          />
        </group>
      ))}

      {/* Engine-generated downstream branches */}
      {tree.downwind.map((d, i) => (
        <mesh
          key={`downwind-${i}`}
          geometry={d.geometry}
          material={d.material}
          renderOrder={7}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}

export default AlabasterLightTree3D;


















