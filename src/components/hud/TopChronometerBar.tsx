"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Sliders,
  Shield,
  Table,
} from "lucide-react";

interface TopChronometerBarProps {
  activeViewMode: "3d" | "2d";
  onToggleViewMode: () => void;
  onToggleLevers: () => void;
  onToggleMentor: () => void;
  onToggleTwin: () => void;
}

export function TopChronometerBar({
  activeViewMode,
  onToggleViewMode,
  onToggleLevers,
  onToggleMentor,
  onToggleTwin,
}: TopChronometerBarProps) {
  return (
    <div data-testid="top-chronometer-bar" className="pointer-events-auto flex items-center justify-between w-full max-w-7xl mx-auto px-5 py-2.5 rounded-2xl glass-panel hairline-border shadow-glass-depth">
      {/* Left: Brand, Rotating Chronometer & Dilemma Title */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-[#D4AF37]/40 bg-[#12100A] shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <Compass className="w-4 h-4 text-[#D4AF37] animate-chronometer-tick" />
          </div>
          <span className="font-serif text-lg tracking-wider text-white font-medium group-hover:text-[#F3E5AB] transition-colors">
            HOROVEX
          </span>
        </Link>

        <div className="h-5 w-px bg-white/[0.08]" />

        {/* Current Dilemma Headline */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs text-[#E2E8F0] font-normal truncate max-w-xs md:max-w-md">
            Founder Crossroads: Enterprise Pivot vs. Bootstrap
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#94A3B8] border border-white/[0.08]">
            Depth: T+1
          </span>
        </div>
      </div>

      {/* Center: Probability & Golden Path Telemetry Readout */}
      <div className="hidden lg:flex items-center gap-6 font-mono text-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#16130B] border border-[#D4AF37]/40 text-[#F3E5AB]">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Golden Path: Active (E[U] = +8.42)</span>
        </div>

        <div className="flex items-center gap-2 text-[#94A3B8]">
          <span className="text-[#00F0FF]">Explored: 80.0%</span>
          <span className="text-white/[0.2]">/</span>
          <span>Unexplored: 20.0%</span>
        </div>

        <div className="text-[#94A3B8]">
          <span className="text-white font-medium">5</span> / 15 Nodes
        </div>
      </div>

      {/* Right: Tactile HUD Toggles */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleViewMode}
          aria-label="2D Chronicle Matrix View"
          className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-1.5 transition-all ${
            activeViewMode === "2d"
              ? "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]"
              : "bg-white/[0.04] border-white/[0.08] text-[#94A3B8] hover:text-white"
          }`}
          title="Toggle 2D Chronicle Matrix View"
        >
          <Table className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">2D Chronicle Matrix</span>
        </button>

        <button
          type="button"
          onClick={onToggleLevers}
          aria-label="Sensitivity Levers"
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all hover:border-[#8B5CF6]/40"
          title="Adjust Real-Time Sensitivity Levers"
        >
          <Sliders className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="hidden sm:inline">Levers</span>
        </button>

        <button
          type="button"
          onClick={onToggleMentor}
          aria-label="Golden Path & Optimal Trajectory"
          className="px-3 py-1.5 rounded-xl bg-[#14120B] border border-[#D4AF37]/40 text-[#F3E5AB] font-mono text-xs flex items-center gap-1.5 transition-all hover:bg-[#1E190E] shadow-[0_0_10px_rgba(212,175,55,0.15)]"
          title="Golden Path & Optimal Trajectory"
        >
          <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="hidden sm:inline">Golden Path</span>
        </button>

        <button
          type="button"
          onClick={onToggleTwin}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all"
          title="Personal Context Digital Twin"
        >
          <Shield className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="hidden md:inline">Vault</span>
        </button>
      </div>
    </div>
  );
}
