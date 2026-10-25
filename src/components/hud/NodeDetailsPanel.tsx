'use client';

import React from 'react';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import {
  Sparkles,
  Layers,
  Zap,
  CheckCircle2,
  X,
  DoorOpen,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface NodeDetailsPanelProps {
  onAutoProject: () => void;
  onOpenInjectAction: () => void;
  onClose: () => void;
}

export default function NodeDetailsPanel({
  onAutoProject,
  onOpenInjectAction,
  onClose,
}: NodeDetailsPanelProps) {
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const nodes = useMultiverseStore((state) => state.nodes);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const collapseWavefunction = useMultiverseStore((state) => state.collapseWavefunction);

  if (!selectedNodeId || !nodes[selectedNodeId]) return null;

  const node = nodes[selectedNodeId];
  const isGolden = goldenPathNodeIds.includes(node.id);
  const isRoot = !node.parentId;

  return (
    <aside className="absolute right-6 bottom-24 z-20 w-88 md:w-96 pointer-events-none animate-slide-up">
      <div className="pointer-events-auto p-5 rounded-3xl bg-[#090910]/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#94A3B8]">
                Depth {node.depth} • Wave {node.waveNumber}
              </span>
              {isGolden && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                  Golden Path
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg text-white font-medium line-clamp-1">{node.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Probabilities & Horizon */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center font-mono">
          <div>
            <span className="text-[9px] text-[#64748B] uppercase block">Cond. Prob</span>
            <span className="text-sm font-semibold text-white">
              {(node.conditionalProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[9px] text-[#64748B] uppercase block">Path Prob</span>
            <span className="text-sm font-semibold text-[#00F0FF]">
              {(node.cumulativeProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[9px] text-[#64748B] uppercase block">Horizon</span>
            <span className="text-xs font-medium text-[#94A3B8]">{node.timeHorizon}</span>
          </div>
        </div>

        {/* Narrative & Reversibility */}
        <div className="space-y-2">
          {node.narrativeSummary && (
            <p className="font-sans text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
              {node.narrativeSummary}
            </p>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-sans text-[#64748B] flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5" />
              Reversibility:
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                node.reversibilityType === 'type_2_reversible'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                  : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
              }`}
            >
              {node.reversibilityType === 'type_2_reversible'
                ? 'Type 2 (Two-Way Door)'
                : 'Type 1 (One-Way Irreversible)'}
            </span>
          </div>
        </div>

        {/* Causal Drivers */}
        {node.causalDrivers && node.causalDrivers.length > 0 && (
          <div>
            <span className="font-mono text-[9px] text-[#64748B] uppercase block mb-1">Causal Drivers</span>
            <div className="flex flex-wrap gap-1.5">
              {node.causalDrivers.map((driver, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-sans text-[#94A3B8]"
                >
                  {typeof driver === 'string' ? driver : driver.factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onAutoProject}
              className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Auto-Project Next 5 Futures</span>
            </button>

            <button
              type="button"
              onClick={onOpenInjectAction}
              className="px-3 py-2 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Inject Action</span>
            </button>
          </div>

          {!isRoot && node.status === 'active' && (
            <button
              type="button"
              onClick={() => collapseWavefunction(node.id)}
              className="w-full py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/25 font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reality Check-In (Collapse Wavefunction)</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
