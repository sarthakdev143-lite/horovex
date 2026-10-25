'use client';

import React, { Suspense, use } from 'react';
import ArtDirectionDemo, { DIRECTION_THEMES } from '@/components/directions/ArtDirectionDemo';
import type { ArtDirectionId } from '@/components/canvas/DirectionCanvas';

export default function DirectionDemoPage({
  params,
}: {
  params: Promise<{ direction: string }>;
}) {
  const resolved = use(params);
  const raw = (resolved?.direction || 'landscape').toLowerCase();
  const initialDirection: ArtDirectionId =
    raw in DIRECTION_THEMES ? (raw as ArtDirectionId) : 'landscape';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F1F0EC] text-[#141413] text-base">
          Loading HOROVEX decision engine…
        </div>
      }
    >
      <ArtDirectionDemo initialDirection={initialDirection} />
    </Suspense>
  );
}
