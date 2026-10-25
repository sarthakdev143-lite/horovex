'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function VoidBackground() {
  const pointsRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);

  const particleCount = 3000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color('#D4AF37');
    const cyanColor = new THREE.Color('#00F0FF');
    const dustColor = new THREE.Color('#2A2A38');
    const whiteColor = new THREE.Color('#E0E0EC');

    for (let i = 0; i < particleCount; i++) {
      const radius = 80 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(phi) * Math.sin(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.cos(theta) - 50;

      const rand = Math.random();
      let chosenColor = dustColor;
      if (rand > 0.85) chosenColor = goldColor;
      else if (rand > 0.75) chosenColor = cyanColor;
      else if (rand > 0.50) chosenColor = whiteColor;

      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }

    return [pos, col];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.006;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.04) * 0.02;
    }
    // Horological Tourbillon counter-rotation
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.015;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.009;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.004;
  });

  return (
    <group name="void-background">
      {/* 3000-Point Obsidian Starfield */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Chronometric Rings around origin in XZ plane */}
      <group position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Ring 1: Inner Escapement Ring */}
        <group ref={ring1Ref}>
          <mesh>
            <ringGeometry args={[8.0, 8.08, 64]} />
            <meshBasicMaterial color="#D4AF37" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>

        {/* Ring 2: Intermediate Orbital Meridian */}
        <group ref={ring2Ref}>
          <mesh>
            <ringGeometry args={[18.0, 18.12, 64]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>

        {/* Ring 3: Outer Celestial Horizon */}
        <group ref={ring3Ref}>
          <mesh>
            <ringGeometry args={[32.0, 32.18, 96]} />
            <meshBasicMaterial color="#D4AF37" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
