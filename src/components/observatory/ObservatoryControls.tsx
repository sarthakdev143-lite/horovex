'use client';

import React from 'react';

export interface ObservatoryControlsProps {
  isLoadingWave: boolean;
  unexploredMass: number;
  situationInput: string;
  onSituationInputChange: (val: string) => void;
  onSubmitSituation: (situation: string) => void;
  onExpandWave: () => void;
  onRecurseDeeper: () => void;
  hasSelectedNode: boolean;
  isActionModalOpen: boolean;
  onToggleActionModal: () => void;
  interventionMove: string;
  onInterventionMoveChange: (val: string) => void;
  onSubmitIntervention: (move: string) => void;
}

export default function ObservatoryControls({
  isLoadingWave,
  unexploredMass,
  situationInput,
  onSituationInputChange,
  onSubmitSituation,
  onExpandWave,
  onRecurseDeeper,
  hasSelectedNode,
  isActionModalOpen,
  onToggleActionModal,
  interventionMove,
  onInterventionMoveChange,
  onSubmitIntervention,
}: ObservatoryControlsProps) {
  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (situationInput.trim()) {
      onSubmitSituation(situationInput.trim());
    }
  };

  const handleInterventionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interventionMove.trim()) {
      onSubmitIntervention(interventionMove.trim());
    }
  };

  return (
    <>
      {/* Action Injection Floating Panel */}
      {isActionModalOpen && (
        <div
          data-ui="true"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-35 max-w-xl w-[92vw] p-4 rounded-xl bg-[#F4F2ED] border border-[#DCD8CE] space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#161615]">
              Condition next wave on a specific move
            </p>
            <button
              type="button"
              onClick={onToggleActionModal}
              className="text-[13px] text-[#4A4844] hover:text-[#161615]"
            >
              Close
            </button>
          </div>
          <form onSubmit={handleInterventionSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={interventionMove}
              onChange={(e) => onInterventionMoveChange(e.target.value)}
              placeholder="Describe your intervention move (e.g. require 50% upfront payment)..."
              className="flex-1 px-3 py-1.5 text-[13px] text-[#161615] bg-[#E5E1D8] border border-[#DCD8CE] rounded focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoadingWave || !interventionMove.trim()}
              className="px-3.5 py-1.5 text-[13px] font-semibold text-white bg-[#163A50] rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
              aria-label="Simulate Conditioned Futures"
            >
              Branch with this move
            </button>
          </form>
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div
        data-ui="true"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-4xl w-[94vw] sm:w-auto px-4 py-2.5 rounded-2xl bg-[#E5E1D8] border border-[#DCD8CE] flex flex-wrap items-center justify-between gap-3"
      >
        {/* Plain-English action suite */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="expand-wave-btn"
            onClick={onExpandWave}
            disabled={isLoadingWave}
            className="px-3 py-1.5 text-[13px] font-semibold text-white bg-[#163A50] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            +5 more possibilities
          </button>

          <button
            type="button"
            data-testid="recurse-deeper-btn"
            onClick={onRecurseDeeper}
            disabled={isLoadingWave || !hasSelectedNode}
            className="px-3 py-1.5 text-[13px] font-medium text-[#161615] bg-[#F4F2ED] rounded-lg hover:bg-[#DCD8CE] disabled:opacity-50 transition-colors whitespace-nowrap"
            aria-label="See what happens next (Auto-Project Next 5 Futures)"
          >
            See what happens next
          </button>

          <button
            type="button"
            onClick={onToggleActionModal}
            className="px-3 py-1.5 text-[13px] font-medium text-[#161615] bg-[#F4F2ED] rounded-lg hover:bg-[#DCD8CE] transition-colors whitespace-nowrap"
            aria-label="What if I… (Inject Action)"
          >
            What if I…
          </button>
        </div>

        {/* Input & Simulation Trigger */}
        <form onSubmit={handleSimulateSubmit} className="flex items-center gap-1.5 flex-1 max-w-sm min-w-[240px]">
          <input
            type="text"
            value={situationInput}
            onChange={(e) => onSituationInputChange(e.target.value)}
            placeholder="Enter your high-stakes dilemma or crossroads..."
            className="flex-1 px-3 py-1.5 text-[13px] text-[#161615] bg-[#F4F2ED] border border-[#DCD8CE] rounded-lg focus:outline-none placeholder:text-[#4A4844]"
          />
          <button
            type="submit"
            data-testid="simulate-btn"
            disabled={isLoadingWave}
            className="px-3 py-1.5 text-[13px] font-semibold text-white bg-[#163A50] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
          >
            {isLoadingWave ? 'Simulating…' : 'Predict 5 Futures'}
          </button>
        </form>

        {/* Mass conservation indicator */}
        <div className="hidden lg:flex items-center text-[13px] tabular-nums text-[#4A4844] whitespace-nowrap pl-2 border-l border-[#DCD8CE]">
          <span>Explored: {Math.round((1 - unexploredMass) * 100)}%</span>
          <span className="mx-1">·</span>
          <span>Unexplored: {Math.round(unexploredMass * 100)}%</span>
        </div>
      </div>
    </>
  );
}
