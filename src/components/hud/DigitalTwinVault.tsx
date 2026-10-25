'use client';

import React from 'react';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { UserContextTwin, RiskAppetiteLevel } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { Shield, Sparkles, X, Check } from 'lucide-react';

interface DigitalTwinVaultProps {
  onClose: () => void;
}

export default function DigitalTwinVault({ onClose }: DigitalTwinVaultProps) {
  const nodes = useMultiverseStore((state) => state.nodes);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);
  const setUserContextTwin = useMultiverseStore((state) => state.setUserContextTwin);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);

  const riskLevels: { id: RiskAppetiteLevel; label: string; tau: string }[] = [
    { id: 'conservative', label: 'Conservative', tau: 'τ=0.85' },
    { id: 'measured', label: 'Measured', tau: 'τ=0.55' },
    { id: 'aggressive', label: 'Aggressive', tau: 'τ=0.35' },
    { id: 'asymmetric', label: 'Asymmetric', tau: 'τ=0.25' },
  ];

  const handleRiskChange = (level: RiskAppetiteLevel) => {
    const updatedTwin: UserContextTwin = {
      ...userContextTwin,
      riskAppetite: level,
    };
    setUserContextTwin(updatedTwin);

    // Recompute Golden Path based on updated risk distortion
    if (rootNodeId) {
      const nodeList = Object.values(nodes);
      const { goldenPathNodeIds } = solveGoldenPath(nodeList, rootNodeId, updatedTwin);
      setGoldenPath(goldenPathNodeIds);
    }
  };

  const handleRunwayChange = (months: number) => {
    setUserContextTwin({ runwayMonths: months });
  };

  const handleCoreValueChange = (key: keyof UserContextTwin['coreValues'], value: number) => {
    const updatedTwin: UserContextTwin = {
      ...userContextTwin,
      coreValues: {
        ...userContextTwin.coreValues,
        [key]: value,
      },
    };
    setUserContextTwin(updatedTwin);

    // Dynamic trajectory recalculation
    if (rootNodeId) {
      const nodeList = Object.values(nodes);
      const { goldenPathNodeIds } = solveGoldenPath(nodeList, rootNodeId, updatedTwin);
      setGoldenPath(goldenPathNodeIds);
    }
  };

  return (
    <aside className="absolute right-6 top-24 bottom-20 z-20 w-96 md:w-[400px] pointer-events-none animate-slide-up">
      <div className="pointer-events-auto h-full p-5 md:p-6 rounded-3xl bg-[#090A0E]/95 backdrop-blur-2xl border border-[#10B981]/30 flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#10B981]/40 bg-[#10B981]/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#10B981]" />
              </div>
              <div>
                <span className="font-mono text-[9px] tracking-widest uppercase text-[#10B981] block">
                  The Vault • Decision Twin
                </span>
                <h3 className="font-serif text-lg text-white font-medium">Personal Context Twin</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#64748B] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-sans text-[#94A3B8] leading-relaxed mb-5">
            Calibrate your risk tolerance and utility vector. The Bellman solver aligns with your unique profile.
          </p>

          <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
            {/* Risk Appetite Buttons */}
            <div>
              <span className="font-mono text-[10px] uppercase text-[#94A3B8] block mb-2">
                Risk Appetite Profile
              </span>
              <div className="grid grid-cols-2 gap-2">
                {riskLevels.map((risk) => {
                  const isSelected = userContextTwin.riskAppetite === risk.id;
                  return (
                    <button
                      key={risk.id}
                      type="button"
                      onClick={() => handleRiskChange(risk.id)}
                      className={`px-3 py-2 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#10B981]/15 border-[#10B981]/50 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-[#94A3B8] hover:border-white/[0.15] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-medium">{risk.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                      </div>
                      <span className="font-mono text-[9px] text-[#64748B]">{risk.tau}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Liquid Runway Slider */}
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="font-sans text-[#94A3B8]">Liquid Burn Runway:</span>
                <span className="font-mono text-white font-semibold">{userContextTwin.runwayMonths} Months</span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={userContextTwin.runwayMonths}
                onChange={(e) => handleRunwayChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
              />
            </div>

            {/* 6D Core Values Sliders */}
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              <span className="font-mono text-[10px] uppercase text-[#94A3B8] block">
                6D Core Value Vector Weights (0 - 10)
              </span>

              {[
                { key: 'wealthCompounding' as const, label: 'Wealth Compounding' },
                { key: 'autonomyFreedom' as const, label: 'Autonomy & Freedom' },
                { key: 'masteryCraft' as const, label: 'Mastery & Craft' },
                { key: 'stabilitySecurity' as const, label: 'Stability & Security' },
                { key: 'impactLegacy' as const, label: 'Impact & Legacy' },
                { key: 'peaceWellbeing' as const, label: 'Peace & Wellbeing' },
              ].map((val) => (
                <div key={val.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8] font-sans">{val.label}</span>
                    <span className="font-mono text-white font-medium">
                      {userContextTwin.coreValues[val.key].toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={userContextTwin.coreValues[val.key]}
                    onChange={(e) => handleCoreValueChange(val.key, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-white hover:bg-white/[0.1] transition-colors"
          >
            Apply Context
          </button>
        </div>
      </div>
    </aside>
  );
}
