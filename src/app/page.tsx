'use client';

import React, { Suspense } from 'react';
import SanctuaryBeatsLanding from '@/components/directions/SanctuaryBeatsLanding';

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F4F2ED] text-[#161615] text-base">
          Loading HOROVEX decision sanctuary…
        </div>
      }
    >
      <SanctuaryBeatsLanding />
    </Suspense>
  );
}
