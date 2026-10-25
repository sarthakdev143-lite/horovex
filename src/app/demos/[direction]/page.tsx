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
  const raw = (resolved?.direction || 'sanctuary').toLowerCase();
  const initialDirection: ArtDirectionId =
    raw in DIRECTION_THEMES ? (raw as ArtDirectionId) : 'sanctuary';

  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F1F0EC] text-[#161615] text-base">
          Loading HOROVEX decision sanctuary…
        </div>
      }
    >
      <ArtDirectionDemo initialDirection={initialDirection} />
    </Suspense>
  );
}
