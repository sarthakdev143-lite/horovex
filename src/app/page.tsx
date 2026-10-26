'use client';

import React, { Suspense } from 'react';
import AlabasterStoryScroll from '@/components/directions/AlabasterStoryScroll';

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F4F2ED] text-[#161615] text-base font-serif"
        >
          Entering HOROVEX decision sanctuary…
        </div>
      }
    >
      <AlabasterStoryScroll />
    </Suspense>
  );
}
