'use client';

import React, { useState } from 'react';
import { ProbabilityNode } from '@/lib/types/multiverse';

export interface ChronicleMatrixOverlayProps {
  nodes: ProbabilityNode[];
  goldenPathNodeIds: string[];
  selectedNodeId?: string | null;
  onSelectNode: (id: string) => void;
  onCollapse: (nodeId: string) => void;
  onClose: () => void;
}

export default function ChronicleMatrixOverlay({
  nodes,
  goldenPathNodeIds,
  selectedNodeId,
  onSelectNode,
  onCollapse,
  onClose,
}: ChronicleMatrixOverlayProps) {
  const [filterRegime, setFilterRegime] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'probability' | 'title' | 'reversibility'>('probability');

  const branchNodes = nodes.filter((n) => n.parentId !== null);

  const filteredNodes = branchNodes.filter((node) => {
    if (filterRegime === 'all') return true;
    if (filterRegime === 'wave1') return node.waveNumber === 1;
    if (filterRegime === 'wave2') return node.waveNumber === 2;
    if (filterRegime === 'wave3') return (node.waveNumber || 1) >= 3;
    return true;
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === 'probability') {
      return b.conditionalProbability - a.conditionalProbability;
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'reversibility') {
      return b.reversibilityScore - a.reversibilityScore;
    }
    return 0;
  });

  const recommendedNode = branchNodes.find(
    (n) => goldenPathNodeIds.includes(n.id) || n.isGoldenPath
  );

  return (
    <div
      data-ui="true"
      className="fixed inset-0 z-40 p-4 sm:p-8 md:p-12 overflow-y-auto bg-[#F4F2ED] text-[#161615] flex flex-col justify-between"
      aria-label="2D Chronicle Matrix Overlay"
    >
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#DCD8CE] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#163A50]" />
              <h2 className="text-xl sm:text-2xl font-semibold text-[#161615]">
                2D Chronicle Matrix
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#E5E1D8] text-[#4A4844] tabular-nums">
                {branchNodes.length} Futures Synchronized
              </span>
            </div>
            <p className="text-xs text-[#4A4844] mt-1">
              Synchronized cross-outcome comparison · Total probability mass conserved (\sum P_i = 1 - M_unexplored)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by wave */}
            <select
              value={filterRegime}
              onChange={(e) => setFilterRegime(e.target.value)}
              className="px-2.5 py-1.5 text-xs text-[#161615] bg-[#E5E1D8] border border-[#DCD8CE] rounded focus:outline-none"
            >
              <option value="all">All Waves</option>
              <option value="wave1">Wave 1 Baseline</option>
              <option value="wave2">Wave 2 Contrarian</option>
              <option value="wave3">Wave 3+ Tail-Risk</option>
            </select>

            {/* Sort buttons */}
            <div className="flex items-center rounded overflow-hidden border border-[#DCD8CE] bg-[#E5E1D8]">
              <button
                type="button"
                onClick={() => setSortBy('probability')}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: sortBy === 'probability' ? '#163A50' : 'transparent',
                  color: sortBy === 'probability' ? '#FFFFFF' : '#161615',
                }}
              >
                Likelihood
              </button>
              <button
                type="button"
                onClick={() => setSortBy('reversibility')}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: sortBy === 'reversibility' ? '#163A50' : 'transparent',
                  color: sortBy === 'reversibility' ? '#FFFFFF' : '#161615',
                }}
              >
                Reversibility
              </button>
              <button
                type="button"
                onClick={() => setSortBy('title')}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: sortBy === 'title' ? '#163A50' : 'transparent',
                  color: sortBy === 'title' ? '#FFFFFF' : '#161615',
                }}
              >
                Title
              </button>
            </div>

            {/* Return to 3D Sanctuary */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#163A50] text-white hover:opacity-90 transition-opacity"
            >
              Return to 3D Sanctuary
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-lg bg-[#E5E1D8] border border-[#DCD8CE]">
          <table className="w-full text-left border-collapse tabular-nums text-xs">
            <thead>
              <tr className="bg-[#DCD8CE] text-[#161615]">
                <th className="py-2.5 px-3.5 font-semibold">Future Trajectory</th>
                <th className="py-2.5 px-3.5 font-semibold">Regime / Horizon</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Reversibility</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Cumulative</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Likelihood</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD8CE]">
              {sortedNodes.map((node) => {
                const isRec =
                  goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                const isSel = selectedNodeId === node.id;
                return (
                  <tr
                    key={node.id}
                    className="hover:bg-[#DCD8CE]/50 transition-colors"
                    style={{
                      backgroundColor: isSel ? '#DCD8CE' : 'transparent',
                    }}
                  >
                    <td className="py-2.5 px-3.5 font-medium text-[#161615]">
                      <div className="flex items-center gap-1.5">
                        {isRec && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold text-white bg-[#163A50] rounded">
                            Recommended
                          </span>
                        )}
                        <span>{node.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-[#4A4844]">
                      Wave {node.waveNumber || 1} · {node.timeHorizon}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-medium text-[#161615]">
                      {node.reversibilityScore.toFixed(1)}/10
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#161615]">
                      {(node.cumulativeProbability * 100).toFixed(1)}%
                    </td>
                    <td
                      className="py-2.5 px-3.5 text-right font-semibold"
                      style={{ color: isRec ? '#163A50' : '#161615' }}
                    >
                      {(node.conditionalProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectNode(node.id);
                            onClose();
                          }}
                          className="px-2 py-0.5 text-[11px] font-medium rounded bg-[#F4F2ED] text-[#161615] hover:bg-[#DCD8CE]"
                        >
                          Focus in 3D
                        </button>
                        <button
                          type="button"
                          onClick={() => onCollapse(node.id)}
                          className="px-2 py-0.5 text-[11px] font-medium rounded bg-[#163A50] text-white hover:opacity-90"
                        >
                          Mark Realized
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recommended Path Summary Box */}
        {recommendedNode && (
          <div className="p-4 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-1.5">
            <h3 className="text-sm font-semibold text-[#161615]">
              Recommended Trajectory: {recommendedNode.title}
            </h3>
            <p className="text-xs text-[#161615] leading-relaxed">
              Prioritize {recommendedNode.title} at{' '}
              {Math.round(recommendedNode.conditionalProbability * 100)}% likelihood. Key sentinel metric:{' '}
              {recommendedNode.tripwires?.[0] || 'Signed pilot or validation within 45 days'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
