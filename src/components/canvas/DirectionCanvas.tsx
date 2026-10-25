'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ProbabilityNode } from '@/lib/types/multiverse';
import ProbabilityLandscape3D from './directions/ProbabilityLandscape3D';
import HorologyInstrument3D from './directions/HorologyInstrument3D';
import DarkRoomExhibit3D from './directions/DarkRoomExhibit3D';

export type ArtDirectionId = 'landscape' | 'instrument' | 'darkroom';

export interface DirectionCanvasProps {
  direction: ArtDirectionId;
  nodes: ProbabilityNode[];
  selectedNodeId: string | null;
  goldenPathIds: string[];
  onSelectNode: (id: string) => void;
  className?: string;
}

const DIRECTION_BG: Record<ArtDirectionId, string> = {
  landscape: '#EAE8E3',
  instrument: '#EAEAE4',
  darkroom: '#0E1013',
};

export default function DirectionCanvas({
  direction,
  nodes,
  selectedNodeId,
  goldenPathIds,
  onSelectNode,
  className = 'w-full h-full relative',
}: DirectionCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', onChange);

      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
      return () => mql.removeEventListener('change', onChange);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const bgHex = DIRECTION_BG[direction];

  if (!mounted || !webglSupported) {
    return (
      <div
        className={className}
        style={{ backgroundColor: bgHex, minHeight: '420px' }}
        aria-label={`3D ${direction} simulation viewport`}
      />
    );
  }

  return (
    <div className={className} style={{ backgroundColor: bgHex }}>
      <Canvas
        dpr={[1, 2]}
        shadows={direction === 'darkroom'}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        camera={{
          position:
            direction === 'landscape'
              ? [0, 14.5, 16.5]
              : direction === 'instrument'
              ? [0, 0, 15.5]
              : [0, 4.6, 13.5],
          fov: 42,
          near: 0.1,
          far: 200,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(bgHex, 1);
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setWebglSupported(false);
          });
        }}
      >
        <Suspense fallback={null}>
          {direction === 'landscape' && (
            <ProbabilityLandscape3D
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              goldenPathIds={goldenPathIds}
              onSelectNode={onSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
          {direction === 'instrument' && (
            <HorologyInstrument3D
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              goldenPathIds={goldenPathIds}
              onSelectNode={onSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
          {direction === 'darkroom' && (
            <DarkRoomExhibit3D
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              goldenPathIds={goldenPathIds}
              onSelectNode={onSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
