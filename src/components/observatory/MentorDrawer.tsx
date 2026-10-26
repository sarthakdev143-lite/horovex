'use client';

import React, { useState } from 'react';
import { ProbabilityNode, UserContextTwin } from '@/lib/types/multiverse';

export interface MentorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recommendedNode?: ProbabilityNode | null;
  userContextTwin?: UserContextTwin;
}

export default function MentorDrawer({
  isOpen,
  onClose,
  recommendedNode,
  userContextTwin,
}: MentorDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyBrief = () => {
    if (!recommendedNode) return;
    const brief = `HOROVEX STRATEGIC DECISION BRIEF\n=================================\nTarget Trajectory: ${recommendedNode.title}\nLikelihood: ${Math.round(recommendedNode.conditionalProbability * 100)}%\nCumulative: ${Math.round(recommendedNode.cumulativeProbability * 100)}%\nReversibility: ${recommendedNode.reversibilityScore.toFixed(1)}/10 (${recommendedNode.reversibilityType})\n\n14-DAY ACTION PLAN:\n- Days 1-3: Lock contract or pilot validation terms\n- Days 4-7: Establish cash buffer and threshold reserve\n- Days 8-14: Implement weekly metrics review & tripwire monitor\n\nTRIPWIRES (30/60/90):\n- 30-Day: ${recommendedNode.tripwires?.[0] || 'Signed pilot or commitment'}\n- 60-Day: Margin target or burn cap check\n- 90-Day: Full branch review & reality check-in`;

    navigator.clipboard.writeText(brief).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <aside
      data-ui="true"
      className="fixed top-14 right-0 bottom-0 w-80 sm:w-[420px] z-30 p-5 overflow-y-auto bg-[#F4F2ED] border-l border-[#DCD8CE] flex flex-col justify-between space-y-5"
      aria-label="Strategic Mentor Advisory Panel"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCD8CE]">
          <div>
            <h2 className="text-base font-semibold text-[#161615]">
              Strategic Mentor Advisory
            </h2>
            <p className="text-xs text-[#4A4844]">
              Bellman Expected Utility & 10-Year Regret Minimization
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-xs text-[#4A4844] hover:text-[#161615] rounded"
            aria-label="Close mentor drawer"
          >
            ✕
          </button>
        </div>

        {recommendedNode ? (
          <>
            {/* Executive Verdict */}
            <div className="p-3.5 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#163A50] uppercase tracking-wider">
                  Executive Verdict
                </span>
                <span className="text-xs font-semibold tabular-nums text-[#163A50]">
                  {Math.round(recommendedNode.conditionalProbability * 100)}% Likelihood
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#161615]">
                {recommendedNode.title}
              </h3>
              <p className="text-xs text-[#161615] leading-relaxed">
                {recommendedNode.narrativeSummary ||
                  'The Bellman solver evaluates this path as having the optimal balance of expected upside, reversibility, and capital runway preservation.'}
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-xs tabular-nums text-[#4A4844]">
                <span>Cumulative: {Math.round(recommendedNode.cumulativeProbability * 100)}%</span>
                <span>·</span>
                <span>Reversibility: {recommendedNode.reversibilityScore.toFixed(1)}/10</span>
                <span>·</span>
                <span>Regret Score: {recommendedNode.regretMinimizationScore?.toFixed(1) ?? '8.2'}/10</span>
              </div>
            </div>

            {/* 14-Day Action Playbook */}
            <div className="p-3.5 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-2.5">
              <h4 className="text-xs font-semibold text-[#161615] uppercase tracking-wider">
                14-Day Action Playbook
              </h4>
              <ul className="text-xs text-[#161615] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">Days 1–3:</span>
                  <span>Validate initial counterparty appetite and draft upfront terms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">Days 4–7:</span>
                  <span>Secure 6-month capital runway reserve before irreversible commitments.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">Days 8–14:</span>
                  <span>Establish hard kill-criteria and schedule first wavefunction collapse review.</span>
                </li>
              </ul>
            </div>

            {/* 30/60/90-Day Tripwires */}
            <div className="p-3.5 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-2">
              <h4 className="text-xs font-semibold text-[#161615] uppercase tracking-wider">
                30 / 60 / 90-Day Tripwires
              </h4>
              <div className="space-y-1.5 text-xs text-[#161615]">
                <div className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">30d:</span>
                  <span>
                    {recommendedNode.tripwires?.[0] || 'First signed enterprise pilot agreement.'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">60d:</span>
                  <span>
                    {recommendedNode.tripwires?.[1] || 'Net revenue retention on track; burn under cap.'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold tabular-nums text-[#163A50]">90d:</span>
                  <span>
                    {recommendedNode.tripwires?.[2] || 'Multi-year commitments or clear pivot trigger point.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pre-Mortem & Blindspots */}
            <div className="p-3.5 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-1.5">
              <h4 className="text-xs font-semibold text-[#161615] uppercase tracking-wider">
                Pre-Mortem Hedge
              </h4>
              <p className="text-xs text-[#4A4844] leading-relaxed">
                Key vulnerability: Over-indexing on enterprise customization before standardizing core features. Hedge by enforcing a strict 80/20 product boundary.
              </p>
            </div>
          </>
        ) : (
          <div className="p-4 rounded bg-[#E5E1D8] text-xs text-[#4A4844]">
            Select or generate a future branch to inspect the Mentor recommendations.
          </div>
        )}
      </div>

      {/* Copy / Export CTA */}
      {recommendedNode && (
        <div className="pt-3 border-t border-[#DCD8CE]">
          <button
            type="button"
            onClick={handleCopyBrief}
            className="w-full py-2 px-3 text-xs font-semibold rounded bg-[#163A50] text-white hover:opacity-90 transition-opacity"
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Decision Brief'}
          </button>
        </div>
      )}
    </aside>
  );
}
