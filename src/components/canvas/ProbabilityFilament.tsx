'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeRegimeTier } from '@/lib/types/multiverse';

export interface ProbabilityFilamentProps {
  start: [number, number, number];
  end: [number, number, number];
  conditionalProbability: number;
  regimeTier: NodeRegimeTier;
  timeHorizon?: string;
  isGoldenPath?: boolean;
  isHovered?: boolean;
}

export default function ProbabilityFilament({
  start,
  end,
  conditionalProbability,
  regimeTier,
  timeHorizon = '3-6 Months',
  isGoldenPath = false,
  isHovered = false,
}: ProbabilityFilamentProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Compute Cubic Bezier Curve
  const { curve, radius } = useMemo(() => {
    const pStart = new THREE.Vector3(...start);
    const pEnd = new THREE.Vector3(...end);
    const dist = pStart.distanceTo(pEnd);

    // Smooth forward Z-tangent projection
    const c1 = new THREE.Vector3(pStart.x, pStart.y, pStart.z - dist * 0.35);
    const c2 = new THREE.Vector3(pEnd.x, pEnd.y, pEnd.z + dist * 0.35);

    const bezier = new THREE.CubicBezierCurve3(pStart, c1, c2, pEnd);
    const baseRadius = 0.04 + 0.14 * Math.max(0.05, Math.min(1.0, conditionalProbability));
    const finalRadius = isGoldenPath ? baseRadius * 1.35 : baseRadius;

    return { curve: bezier, radius: finalRadius };
  }, [start, end, conditionalProbability, isGoldenPath]);

  // Determine base color based on regime and golden path
  const baseColor = useMemo(() => {
    if (isGoldenPath) return new THREE.Color('#D4AF37'); // Warm Champagne Gold
    switch (regimeTier) {
      case 'baseline_wave_1':
        return new THREE.Color('#00F0FF'); // Spectral Cyan
      case 'contrarian_wave_2':
        return new THREE.Color('#8B5CF6'); // Aether Violet
      case 'tail_risk_wave_3_plus':
        return new THREE.Color('#F43F5E'); // Tail-risk Crimson
      default:
        return new THREE.Color('#10B981'); // Emerald
    }
  }, [isGoldenPath, regimeTier]);

  const pulseColor = useMemo(() => {
    return isGoldenPath ? new THREE.Color('#FFFFFF') : new THREE.Color('#E0F2FE');
  }, [isGoldenPath]);

  // Pulse speed proportional to time horizon urgency
  const pulseSpeed = useMemo(() => {
    if (timeHorizon.toLowerCase().includes('month')) return 3.2;
    if (timeHorizon.toLowerCase().includes('year')) return 1.8;
    return 2.4;
  }, [timeHorizon]);

  // GLSL Shader Definition
  const shaderArgs = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: baseColor },
        uPulseColor: { value: pulseColor },
        uPulseSpeed: { value: pulseSpeed },
        uPulseFreq: { value: 3.0 },
        uOpacity: { value: 0.35 + 0.5 * conditionalProbability },
        uIsGoldenPath: { value: isGoldenPath ? 1.0 : 0.0 },
        uIsHovered: { value: isHovered ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uPulseColor;
        uniform float uPulseSpeed;
        uniform float uPulseFreq;
        uniform float uOpacity;
        uniform float uIsGoldenPath;
        uniform float uIsHovered;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;

        void main() {
          // Soliton traveling pulse flowing from parent (uv.x = 0) to child (uv.x = 1)
          float pulseCycle = fract(vUv.x * uPulseFreq - uTime * uPulseSpeed * 0.15);
          float pulse = smoothstep(0.70, 0.95, pulseCycle) * (1.0 - smoothstep(0.95, 1.0, pulseCycle));
          pulse = pow(pulse, 2.5) * 2.8;

          // Golden Path harmonic shimmer
          float goldShimmer = 0.0;
          if (uIsGoldenPath > 0.5) {
            goldShimmer = sin(vUv.x * 25.0 + uTime * 4.0) * 0.25 + 0.25;
          }

          // Fresnel rim glow
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.2);

          // Final color composite
          vec3 baseCol = uColor + (uIsGoldenPath > 0.5 ? vec3(0.12, 0.09, 0.02) : vec3(0.0));
          vec3 finalColor = mix(baseCol, uPulseColor, clamp(pulse + goldShimmer, 0.0, 1.0));
          finalColor += baseCol * fresnel * 1.4;

          float alpha = clamp(uOpacity * (0.45 + fresnel * 0.7 + pulse * 0.6 + uIsHovered * 0.35), 0.0, 1.0);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    };
  }, [baseColor, pulseColor, pulseSpeed, conditionalProbability, isGoldenPath, isHovered]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      materialRef.current.uniforms.uIsHovered.value = isHovered ? 1.0 : 0.0;
    }
  });

  return (
    <mesh>
      <tubeGeometry args={[curve, 36, radius, 8, false]} />
      <shaderMaterial
        ref={materialRef}
        args={[shaderArgs]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
