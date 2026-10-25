'use client';

import React, { Suspense } from 'react';
import ArtDirectionDemo from '@/components/directions/ArtDirectionDemo';

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen w-full flex items-center justify-center bg-[#F1F0EC] text-[#141413] text-base"
        >
          Loading HOROVEX decision engine…
        </div>
      }
    >
      <ArtDirectionDemo initialDirection="landscape" />
    </Suspense>
  );
}
