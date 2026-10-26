'use client';

import React from 'react';
import { ProbabilityNode } from '@/lib/types/multiverse';

export interface FocusedStelePanelProps {
  node: ProbabilityNode;
  isGoldenPath: boolean;
  onCollapse: (nodeId: string) => void;
  onRecurseDeeper: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function FocusedStelePanel({
  node,
  isGoldenPath,
  onCollapse,
  onRecurseDeeper,
  onClose,
  isLoading,
}: FocusedStelePanelProps) {
  return (
    <aside
      data-ui="true"
      className="fixed bottom-24 right-4 sm:right-6 z-25 max-w-sm w-[90vw] sm:w-[360px] p-4 rounded-xl bg-[#E5E1D8] space-y-3"
      aria-label="Focused Stele Details"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {isGoldenPath && (
            <span className="inline-block px-2 py-0.5 mb-1 text-[11px] font-semibold text-white bg-[#163A50] rounded">
              Recommended Path
            </span>
          )}
          <h3 className="text-sm font-semibold text-[#161615] leading-snug">
            {node.title}
          </h3>
          <span className="text-xs text-[#4A4844] tabular-nums block">
            Horizon: {node.timeHorizon} · Depth {node.depth}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-0.5 text-xs text-[#4A4844] hover:text-[#161615] rounded bg-[#F4F2ED]"
          aria-label="Close focused stele panel"
        >
          Close
        </button>
      </div>

      <p className="text-xs text-[#161615] leading-relaxed line-clamp-3">
        {node.narrativeSummary || 'Selected future stele in the Alabaster Sanctuary.'}
      </p>

      {/* Metrics Row */}
      <div data-ui="true" className="grid grid-cols-2 gap-2 p-2.5 rounded bg-[#F4F2ED] text-xs">
        <div>
          <span className="text-[#4A4844] block">Conditional Likelihood</span>
          <span className="text-sm font-semibold tabular-nums text-[#163A50]">
            {Math.round(node.conditionalProbability * 100)}%
          </span>
        </div>
        <div>
          <span className="text-[#4A4844] block">Cumulative Probability</span>
          <span className="text-sm font-semibold tabular-nums text-[#161615]">
            {(node.cumulativeProbability * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-[#4A4844] block">Reversibility Score</span>
          <span className="text-xs font-semibold tabular-nums text-[#161615]">
            {node.reversibilityScore.toFixed(1)}/10
          </span>
        </div>
        <div>
          <span className="text-[#4A4844] block">Door Category</span>
          <span className="text-xs font-medium text-[#161615] capitalize">
            {node.reversibilityType.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onCollapse(node.id)}
          className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-white bg-[#163A50] rounded hover:opacity-90 transition-opacity"
        >
          Mark what actually happened
        </button>
        <button
          type="button"
          onClick={onRecurseDeeper}
          disabled={isLoading}
          className="py-1.5 px-2.5 text-xs font-medium text-[#161615] bg-[#F4F2ED] rounded hover:bg-[#DCD8CE] disabled:opacity-50 transition-colors"
        >
          Branch
        </button>
      </div>
    </aside>
  );
}
