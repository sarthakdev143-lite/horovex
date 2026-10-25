'use client';

import React, { useState } from 'react';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { generateExecutiveDossierMarkdown } from '@/lib/dossier';
import {
  Compass,
  Sparkles,
  Download,
  AlertTriangle,
  Calendar,
  Shield,
  CheckCircle,
  X,
} from 'lucide-react';

interface MentorAdvisoryDrawerProps {
  onClose: () => void;
}

export default function MentorAdvisoryDrawer({ onClose }: MentorAdvisoryDrawerProps) {
  const nodes = useMultiverseStore((state) => state.nodes);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);

  const [activeTab, setActiveTab] = useState<'verdict' | 'playbook' | 'tripwires' | 'premortem'>('verdict');
  const [copiedDossier, setCopiedDossier] = useState(false);

  const goldenPathNodes = goldenPathNodeIds.map((id) => nodes[id]).filter(Boolean);
  const rootNode = rootNodeId ? nodes[rootNodeId] : null;

  const playbook = [
    {
      dayWindow: 'Days 1-3',
      actionTitle: 'Lock Down Inbound Term Sheet Boundaries',
      concreteSteps: 'Establish explicit non-negotiable walk-away bounds on dilution (max 15%) and governance control before meeting lead investors.',
      expectedOddsShiftPct: 18,
    },
    {
      dayWindow: 'Days 4-7',
      actionTitle: 'Pilot Contract Security & SLA Scope Definition',
      concreteSteps: 'Draft standard enterprise SLA with 30-day turnaround commitment and SOC2 compliance bridge documentation for prospect.',
      expectedOddsShiftPct: 14,
    },
    {
      dayWindow: 'Days 8-14',
      actionTitle: 'First Annual Prepay LOI Execution',
      concreteSteps: 'Secure executed pilot agreement with 50% upfront payment ($12,500) to confirm willingness-to-pay and extend runway.',
      expectedOddsShiftPct: 22,
    },
  ];

  const tripwires = [
    {
      window: 'Day 30',
      indicator: 'Customer discovery conversion rate falls below 20% on qualified enterprise leads.',
      consequence: 'Trigger pre-mortem hedge: pause outbound hiring; double down on core ICP.',
    },
    {
      window: 'Day 60',
      indicator: 'Liquid burn rate exceeds $35,000/mo without signed pilot contract.',
      consequence: 'Activate defensive consolidation mode; preserve remaining 12-month runway.',
    },
    {
      window: 'Day 90',
      indicator: 'First enterprise customer reaches deployment milestone with zero unresolved tickets.',
      consequence: 'Golden Path confirmed: expand enterprise ACV pricing tier.',
    },
  ];

  const handleExportDossier = () => {
    const markdown = generateExecutiveDossierMarkdown({
      situation: rootNode?.title || 'Crossroads Decision Simulation',
      twin: userContextTwin,
      goldenPathNodes,
      mentorSynthesis: {
        executiveVerdict:
          'Execute the Strategic Enterprise Pivot. Your 14-month liquid buffer minimizes downside risk while maximizing 10-year equity compounding.',
        whyThisPathWins:
          'Preserves founder autonomy, eliminates dilution risk in tight capital markets, and generates durable enterprise pricing power.',
        blindspotsDetected: [
          'Underestimating enterprise sales cycle duration (typically 60-90 days)',
          'Engineering diversion from self-serve product improvements',
        ],
        preMortemHedgePlan:
          'Structure 50% upfront pilot prepayments to eliminate working capital drag and establish hard 60-day customer commitment checkpoints.',
        actionPlaybook: playbook,
      },
    });

    navigator.clipboard.writeText(markdown);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  };

  return (
    <aside className="absolute right-6 top-24 bottom-20 z-20 w-96 md:w-[420px] pointer-events-none animate-slide-up">
      <div className="pointer-events-auto h-full p-5 md:p-6 rounded-3xl bg-[#090806]/95 backdrop-blur-2xl border border-[#D4AF37]/35 flex flex-col justify-between shadow-[0_0_50px_rgba(212,175,55,0.12)]">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D4AF37]/20 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50 bg-[#1A160D] flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.2)]">
                <Compass className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <span className="font-mono text-[9px] tracking-widest uppercase text-[#D4AF37] block">
                  Bellman Expected Utility
                </span>
                <h3 className="font-serif text-lg text-white font-medium">Mentor Executive Advisory</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#F3E5AB] font-mono text-[10px] border border-[#D4AF37]/30">
                E[U] +8.42
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#12100A] rounded-xl border border-white/[0.06] mb-4 text-[10px] font-mono">
            <button
              onClick={() => setActiveTab('verdict')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'verdict'
                  ? 'bg-[#D4AF37]/20 text-[#F3E5AB] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Verdict
            </button>
            <button
              onClick={() => setActiveTab('playbook')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'playbook'
                  ? 'bg-[#D4AF37]/20 text-[#F3E5AB] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              14-Day
            </button>
            <button
              onClick={() => setActiveTab('tripwires')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'tripwires'
                  ? 'bg-[#D4AF37]/20 text-[#F3E5AB] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Tripwires
            </button>
            <button
              onClick={() => setActiveTab('premortem')}
              className={`py-1.5 rounded-lg transition-all ${
                activeTab === 'premortem'
                  ? 'bg-[#D4AF37]/20 text-[#F3E5AB] font-semibold'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Hedge
            </button>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[calc(100vh-380px)] pr-1 space-y-4">
            {activeTab === 'verdict' && (
              <div className="space-y-4">
                {/* Executive Verdict Callout */}
                <div className="p-4 rounded-2xl bg-[#14120A] border border-[#D4AF37]/30">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#D4AF37] block mb-1">
                    Mentor Executive Verdict
                  </span>
                  <p className="font-serif text-sm text-[#F3E5AB] leading-relaxed italic">
                    &ldquo;Execute the Strategic Enterprise Pivot. Your 14-month buffer minimizes downside risk
                    while maximizing 10-year equity compounding and customer LTV.&rdquo;
                  </p>
                </div>

                {/* Golden Path Sequence */}
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#94A3B8] block mb-2">
                    Optimal Golden Path Trajectory ({goldenPathNodes.length} nodes)
                  </span>
                  <div className="space-y-2">
                    {goldenPathNodes.map((node, idx) => (
                      <div
                        key={node.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-[#D4AF37]/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#D4AF37] font-semibold">T+{idx}</span>
                          <span className="font-sans text-white font-medium">{node.title}</span>
                        </div>
                        <span className="font-mono text-[11px] text-[#D4AF37]">
                          {(node.conditionalProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blindspots */}
                <div className="p-3.5 rounded-xl bg-[#181111] border border-[#F43F5E]/20 text-xs">
                  <div className="flex items-center gap-1.5 text-[#F43F5E] font-medium mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Blindspots Detected</span>
                  </div>
                  <ul className="list-disc list-inside text-[#94A3B8] text-[11px] space-y-1">
                    <li>Enterprise sales cycles frequently slip beyond 60 days without dedicated legal review.</li>
                    <li>Founder context switching between coding and closing enterprise pilots.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'playbook' && (
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase text-[#94A3B8] block">
                  14-Day Actionable Tactical Playbook
                </span>
                {playbook.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-[#D4AF37] font-semibold">
                        {item.dayWindow}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">
                        +{item.expectedOddsShiftPct}% Odds
                      </span>
                    </div>
                    <div className="font-sans font-medium text-white mb-1">{item.actionTitle}</div>
                    <p className="font-sans text-[11px] text-[#94A3B8] leading-relaxed">
                      {item.concreteSteps}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tripwires' && (
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase text-[#94A3B8] block">
                  Observable 30/60/90-Day Tripwires
                </span>
                {tripwires.map((wire, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                    <div className="font-mono text-[10px] text-[#00F0FF] font-semibold mb-1">
                      {wire.window} Observable Gate
                    </div>
                    <p className="font-sans text-white text-xs mb-2">{wire.indicator}</p>
                    <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] text-[#F3E5AB]">
                      <span className="font-mono text-[9px] uppercase text-[#64748B] block">Remedial Action:</span>
                      {wire.consequence}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'premortem' && (
              <div className="space-y-3">
                <span className="font-mono text-[10px] uppercase text-[#94A3B8] block">
                  Pre-Mortem Risk &amp; Hedge Architecture
                </span>
                <div className="p-4 rounded-xl bg-[#14120A] border border-[#D4AF37]/25 text-xs text-[#94A3B8] leading-relaxed space-y-3">
                  <p>
                    <strong className="text-white">Failure Mode:</strong> Running out of working capital during a prolonged 5-month enterprise compliance audit before contract invoice prepayment clears.
                  </p>
                  <p>
                    <strong className="text-[#D4AF37]">The Pre-Mortem Hedge:</strong> Contractually mandate 50% non-refundable invoice signing prepayment upon mutual pilot launch. Retain self-serve funnel active to maintain base cashflow.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Dossier Export */}
        <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleExportDossier}
            className="w-full py-2.5 rounded-xl bg-[#18150D] border border-[#D4AF37]/50 text-[#F3E5AB] font-mono text-xs font-medium hover:bg-[#221D12] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            {copiedDossier ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span className="text-[#10B981]">Dossier Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>Export Decision Dossier (MD)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
