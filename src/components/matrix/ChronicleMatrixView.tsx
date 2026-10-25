'use client';

import React, { useState } from 'react';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { Sparkles, ArrowUpDown, Shield, CheckCircle2, Scissors, Compass } from 'lucide-react';

interface ChronicleMatrixViewProps {
  onClose: () => void;
}

export default function ChronicleMatrixView({ onClose }: ChronicleMatrixViewProps) {
  const nodes = useMultiverseStore((state) => state.nodes);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const selectNode = useMultiverseStore((state) => state.selectNode);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const collapseWavefunction = useMultiverseStore((state) => state.collapseWavefunction);

  const [sortBy, setSortBy] = useState<'probability' | 'title' | 'utility'>('probability');
  const [filterRegime, setFilterRegime] = useState<string>('all');

  const nodeList = Object.values(nodes);

  const filteredNodes = nodeList.filter((node) => {
    if (filterRegime === 'all') return true;
    return node.regimeTier === filterRegime;
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === 'probability') {
      return b.conditionalProbability - a.conditionalProbability;
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'utility') {
      return (b.expectedUtilityScore ?? 0) - (a.expectedUtilityScore ?? 0);
    }
    return 0;
  });

  return (
    <div className="w-full h-full p-6 md:p-8 flex flex-col justify-between bg-[#050507]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse" />
            <h2 className="font-serif text-2xl text-white font-medium tracking-wide">
              2D Chronicle Matrix
            </h2>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#94A3B8]">
              Probability Matrix
            </span>
          </div>
          <p className="font-sans text-xs text-[#94A3B8]">
            Tabular synchronicity with 3D Causal Observatory • High-density cross-outcome inspection
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Regime Filter */}
          <select
            value={filterRegime}
            onChange={(e) => setFilterRegime(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0F0F14] border border-white/[0.08] text-xs font-mono text-[#94A3B8] focus:outline-none focus:border-[#00F0FF]/50"
          >
            <option value="all">All Regimes</option>
            <option value="baseline_wave_1">Wave 1 Baseline</option>
            <option value="contrarian_wave_2">Wave 2 Contrarian</option>
            <option value="tail_risk_wave_3_plus">Wave 3+ Tail-Risk</option>
          </select>

          {/* Sort Control */}
          <div className="flex items-center gap-1 bg-[#0F0F14] p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setSortBy('probability')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'probability' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-[#64748B] hover:text-white'
              }`}
            >
              Prob %
            </button>
            <button
              onClick={() => setSortBy('utility')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'utility' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-[#64748B] hover:text-white'
              }`}
            >
              Utility
            </button>
            <button
              onClick={() => setSortBy('title')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                sortBy === 'title' ? 'bg-white/10 text-white' : 'text-[#64748B] hover:text-white'
              }`}
            >
              Title
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-white hover:bg-white/[0.12] transition-colors"
          >
            Back to 3D View
          </button>
        </div>
      </div>

      {/* Table Data Matrix */}
      <div className="flex-1 overflow-auto my-4 rounded-2xl border border-white/[0.06] bg-[#0A0A10]/60">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-[#0E0E16] border-b border-white/[0.08] text-[#94A3B8] z-10">
            <tr>
              <th className="py-3 px-4 font-normal">Trajectory / Outcome</th>
              <th className="py-3 px-4 font-normal text-right">Cond. Prob</th>
              <th className="py-3 px-4 font-normal text-right">Path Prob</th>
              <th className="py-3 px-4 font-normal">Horizon</th>
              <th className="py-3 px-4 font-normal">Reversibility</th>
              <th className="py-3 px-4 font-normal text-right">Expected Utility</th>
              <th className="py-3 px-4 font-normal text-center">Status</th>
              <th className="py-3 px-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sortedNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const isGolden = goldenPathNodeIds.includes(node.id);

              return (
                <tr
                  key={node.id}
                  onClick={() => selectNode(node.id)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#00F0FF]/10'
                      : isGolden
                      ? 'bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Title & Regime */}
                  <td className="py-3.5 px-4 font-sans text-sm">
                    <div className="flex items-center gap-2">
                      {isGolden && <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />}
                      <span className={`font-medium ${isGolden ? 'text-[#F3E5AB]' : 'text-white'}`}>
                        {node.title}
                      </span>
                    </div>
                    {node.narrativeSummary && (
                      <p className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5 font-sans">
                        {node.narrativeSummary}
                      </p>
                    )}
                  </td>

                  {/* Conditional Probability */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-semibold text-white">
                      {(node.conditionalProbability * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Cumulative Path Probability */}
                  <td className="py-3.5 px-4 text-right text-[#94A3B8]">
                    {(node.cumulativeProbability * 100).toFixed(1)}%
                  </td>

                  {/* Horizon */}
                  <td className="py-3.5 px-4 text-[#94A3B8]">
                    <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px]">
                      {node.timeHorizon}
                    </span>
                  </td>

                  {/* Reversibility */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        node.reversibilityType === 'type_2_reversible'
                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                          : 'bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30'
                      }`}
                    >
                      {node.reversibilityType === 'type_2_reversible'
                        ? 'Type 2 (Reversible)'
                        : 'Type 1 (Irreversible)'}
                    </span>
                  </td>

                  {/* Expected Utility */}
                  <td className="py-3.5 px-4 text-right font-medium">
                    <span className={node.expectedUtilityScore && node.expectedUtilityScore > 0 ? 'text-[#D4AF37]' : 'text-[#94A3B8]'}>
                      {node.expectedUtilityScore !== undefined
                        ? node.expectedUtilityScore > 0
                          ? `+${node.expectedUtilityScore.toFixed(2)}`
                          : node.expectedUtilityScore.toFixed(2)
                        : 'N/A'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono ${
                        node.status === 'realized'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : node.status === 'pruned'
                          ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                          : 'bg-white/[0.05] text-[#94A3B8]'
                      }`}
                    >
                      {node.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    {node.parentId && node.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          collapseWavefunction(node.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-[#10B981]/20 hover:text-[#10B981] text-[#94A3B8] transition-colors text-[10px] inline-flex items-center gap-1"
                        title="Collapse Wavefunction: Realize this timeline branch"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Realize</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#64748B]">
        <div>
          Showing {sortedNodes.length} of {nodeList.length} outcomes • Golden Path nodes illuminated in Gold
        </div>
        <div>Total mass conserved: 100.0%</div>
      </div>
    </div>
  );
}
