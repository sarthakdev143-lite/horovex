'use client';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ProbabilityNode } from '@/lib/types/multiverse';
import AlabasterLightTree3D, {
  LightTreeCameraState,
} from './directions/AlabasterLightTree3D';

const FOG = '#F0EFEC';

export interface LightTreeCanvasProps {
  nodes: ProbabilityNode[];
  goldenPathIds: string[];
  cameraStateRef: { current: LightTreeCameraState };
}

export default function LightTreeCanvas({
  nodes,
  goldenPathIds,
  cameraStateRef,
}: LightTreeCanvasProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', onChange);

      const probe = document.createElement('canvas');
      const gl =
        probe.getContext('webgl2') ||
        probe.getContext('webgl') ||
        probe.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);

      return () => mql.removeEventListener('change', onChange);
    } catch {
      setWebglSupported(false);
      return undefined;
    }
  }, []);

  if (!webglSupported) {
    return <div className="h-full w-full" style={{ backgroundColor: FOG }} />;
  }

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      camera={{ position: [0, 1.78, 10.4], fov: 42, near: 0.1, far: 140 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(FOG), 1);
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          setWebglSupported(false);
        });
      }}
    >
      <AlabasterLightTree3D
        nodes={nodes}
        goldenPathIds={goldenPathIds}
        cameraStateRef={cameraStateRef}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

