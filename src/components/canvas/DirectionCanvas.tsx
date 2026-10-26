'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { SliderDeltas } from '@/lib/math/sensitivity';
import AlabasterSanctuary3D from './directions/AlabasterSanctuary3D';
import ProbabilityLandscape3D from './directions/ProbabilityLandscape3D';
import HorologyInstrument3D from './directions/HorologyInstrument3D';
import DarkRoomExhibit3D from './directions/DarkRoomExhibit3D';

export type ArtDirectionId = 'sanctuary' | 'landscape' | 'instrument' | 'darkroom';

export interface DirectionCanvasProps {
  direction: ArtDirectionId;
  nodes: ProbabilityNode[];
  selectedNodeId?: string | null;
  focusedNodeId?: string | null;
  goldenPathIds?: string[];
  recommendedPathNodeIds?: string[];
  onSelectNode?: (id: string) => void;
  onNodeSelect?: (node: ProbabilityNode) => void;
  levers?: SliderDeltas;
  className?: string;
  scrollProgress?: number;
  cameraMode?: 'scroll' | 'focus' | 'overview' | 'fly';
}

const DIRECTION_BG: Record<ArtDirectionId, string> = {
  sanctuary: '#ECEBE6',
  landscape: '#ECEBE6',
  instrument: '#EAEAE4',
  darkroom: '#0E1013',
};

export default function DirectionCanvas({
  direction,
  nodes,
  selectedNodeId,
  focusedNodeId,
  goldenPathIds = [],
  recommendedPathNodeIds,
  onSelectNode,
  onNodeSelect,
  levers,
  className = 'w-full h-full relative',
  scrollProgress = 0,
  cameraMode = 'scroll',
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

  const bgHex = DIRECTION_BG[direction] || '#ECEBE6';

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

  const handleNodeSelect = (node: ProbabilityNode) => {
    if (onNodeSelect) onNodeSelect(node);
    if (onSelectNode) onSelectNode(node.id);
  };

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
        shadows={direction === 'sanctuary' || direction === 'darkroom'}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        camera={{
          position:
            direction === 'sanctuary'
              ? [0, 5.2, 12.5]
              : direction === 'landscape'
              ? [0, 15.2, 16.0]
              : direction === 'instrument'
              ? [0, 0, 15.2]
              : [0, 5.2, 12.6],
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
          {direction === 'sanctuary' && (
            <AlabasterSanctuary3D
              nodes={nodes}
              selectedNodeId={activeSelectedId}
              focusedNodeId={activeSelectedId}
              goldenPathIds={activeGoldenPath}
              recommendedPathNodeIds={activeGoldenPath}
              onSelectNode={handleSelectNode}
              onNodeSelect={handleNodeSelect}
              levers={levers}
              reducedMotion={reducedMotion}
              scrollProgress={scrollProgress}
              cameraMode={cameraMode}
            />
          )}
          {direction === 'landscape' && (
            <ProbabilityLandscape3D
              nodes={nodes}
              selectedNodeId={activeSelectedId}
              goldenPathIds={activeGoldenPath}
              onSelectNode={handleSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
          {direction === 'instrument' && (
            <HorologyInstrument3D
              nodes={nodes}
              selectedNodeId={activeSelectedId}
              goldenPathIds={activeGoldenPath}
              onSelectNode={handleSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
          {direction === 'darkroom' && (
            <DarkRoomExhibit3D
              nodes={nodes}
              selectedNodeId={activeSelectedId}
              goldenPathIds={activeGoldenPath}
              onSelectNode={handleSelectNode}
              reducedMotion={reducedMotion}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
