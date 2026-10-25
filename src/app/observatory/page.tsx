"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { TopChronometerBar } from "@/components/hud/TopChronometerBar";
import { Compass, Sparkles, Sliders, Layers, ChevronRight } from "lucide-react";

// Client-only dynamic loading for 3D R3F Canvas to prevent Next.js SSR hydration errors
const MultiverseCanvas = dynamic(
  () => import("@/components/canvas/MultiverseCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050507] text-[#94A3B8] font-mono text-xs">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <Compass className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <span className="tracking-widest uppercase text-[#E2E8F0] mb-1">INITIALIZING CHRONOMETRIC PHASE SPACE</span>
        <span className="text-[10px] text-[#64748B]">CALIBRATING CONICAL ORBITAL RINGS...</span>
      </div>
    ),
  }
);

export default function ObservatoryPage() {
  const [activeViewMode, setActiveViewMode] = useState<"3d" | "2d">("3d");
  const [isLeversOpen, setIsLeversOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isTwinOpen, setIsTwinOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050507] select-none">
      {/* 1. Spatial WebGL Canvas (Full-Screen Viewport) */}
      <div className="absolute inset-0 z-0">
        <MultiverseCanvas />
      </div>

      {/* 2. Top Chronometer Telemetry Flight Deck */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4">
        <TopChronometerBar
          activeViewMode={activeViewMode}
          onToggleViewMode={() => setActiveViewMode((prev) => (prev === "3d" ? "2d" : "3d"))}
          onToggleLevers={() => setIsLeversOpen((prev) => !prev)}
          onToggleMentor={() => setIsMentorOpen((prev) => !prev)}
          onToggleTwin={() => setIsTwinOpen((prev) => !prev)}
        />
      </header>

      {/* 3. Bottom HUD Navigation: Depth Breadcrumbs & Wave Expansion Trigger */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hairline-border font-mono text-xs text-[#94A3B8]">
          <span className="text-[#64748B]">Active Timeline:</span>
          <span className="text-white font-medium">T_0 (Root Crossroads)</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[#D4AF37] font-medium">T_1 (Wave 1: Top 5)</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-2xl glass-panel-elevated">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-[#14120B] border border-[#D4AF37]/50 text-[#F3E5AB] font-mono text-xs font-medium hover:bg-[#1E190E] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>+5 More Possibilities (Wave 2 Contrarian)</span>
          </button>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] font-mono text-xs hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dive Deeper (Vertical T+2)</span>
          </button>
        </div>
      </div>

      {/* 4. Left Sensitivity Levers Overlay (Collapsible) */}
      {isLeversOpen && (
        <aside className="absolute left-6 top-24 bottom-20 z-20 w-80 pointer-events-none animate-slide-up">
          <div className="pointer-events-auto h-full p-5 rounded-2xl glass-panel-elevated flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
                <span className="font-mono text-xs text-[#8B5CF6] uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" />
                  Sensitivity Levers
                </span>
                <span className="font-mono text-[10px] text-[#64748B]">60 FPS MATH</span>
              </div>
              <p className="text-xs text-[#94A3B8] mb-6">
                Perturb real-world variables to observe instantaneous shifts in branch probabilities.
              </p>
            </div>
            <button
              onClick={() => setIsLeversOpen(false)}
              className="w-full py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-[#94A3B8] hover:text-white"
            >
              Close Panel
            </button>
          </div>
        </aside>
      )}

      {/* 5. Right Mentor Advisory Drawer (Collapsible) */}
      {isMentorOpen && (
        <aside className="absolute right-6 top-24 bottom-20 z-20 w-96 pointer-events-none animate-slide-up">
          <div className="pointer-events-auto h-full p-6 rounded-2xl glass-panel-gold flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30 mb-4">
                <span className="font-mono text-xs text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#D4AF37]" />
                  Mentor Strategic Advisory
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#F3E5AB] font-mono text-[10px]">
                  E[U] +8.42
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#94A3B8] block mb-1">Executive Verdict</span>
                  <p className="font-serif text-sm text-[#F3E5AB] leading-relaxed italic">
                    &ldquo;Execute the Strategic Enterprise Pivot. Your 14-month buffer minimizes downside risk while maximizing 10-year equity compounding.&rdquo;
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsMentorOpen(false)}
              className="w-full py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs text-[#94A3B8] hover:text-white"
            >
              Close Advisory
            </button>
          </div>
        </aside>
      )}
    </main>
  );
}
