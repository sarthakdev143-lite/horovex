'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import MultiverseScene from './MultiverseScene';

export interface MultiverseCanvasProps {
  className?: string;
  cameraFov?: number;
  onNodeSelect?: (nodeId: string) => void;
  children?: React.ReactNode;
}

export default function MultiverseCanvas({
  className = 'w-full h-full relative',
  cameraFov = 48,
  onNodeSelect,
  children,
}: MultiverseCanvasProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasContextError, setHasContextError] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR Loading Placeholder
  if (!isMounted) {
    return (
      <div className={`${className} min-h-[600px] flex flex-col items-center justify-center bg-[#050507] text-[#D4AF37]`}>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border border-[#D4AF37]/20 rounded-full animate-ping" />
          <div className="absolute inset-2 border border-[#D4AF37]/50 border-t-transparent rounded-full animate-spin" />
          <div className="w-3 h-3 bg-[#D4AF37] rounded-full shadow-[0_0_12px_#D4AF37]" />
        </div>
        <p className="mt-5 font-mono text-xs tracking-widest text-[#D4AF37]/80 uppercase">
          Calibrating Quantum Phase Space...
        </p>
      </div>
    );
  }

  if (hasContextError) {
    return (
      <div className={`${className} min-h-[600px] flex flex-col items-center justify-center bg-[#050507] text-white/80 p-6 text-center`}>
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 max-w-md">
          <p className="font-mono text-xs text-red-400 mb-2 uppercase tracking-wider">WebGL Context Suspended</p>
          <p className="text-sm text-white/70 mb-4">
            Hardware acceleration is unavailable. You can continue exploring in the 2D Chronicle Matrix view.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-mono transition-colors"
          >
            Retry WebGL Context
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        camera={{
          position: [0, 16, 36],
          fov: cameraFov,
          near: 0.1,
          far: 2000,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050507', 1);
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setHasContextError(true);
          });
        }}
      >
        <Suspense fallback={null}>
          <MultiverseScene onNodeSelect={onNodeSelect} />
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
