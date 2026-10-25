'use client';

import React from 'react';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { perturbProbabilities, SliderDeltas } from '@/lib/math/sensitivity';
import { solveGoldenPath } from '@/lib/math/bellman';
import { Sliders, RotateCcw, X, Zap } from 'lucide-react';

interface SensitivityLeversPanelProps {
  onClose: () => void;
}

export default function SensitivityLeversPanel({ onClose }: SensitivityLeversPanelProps) {
  const nodes = useMultiverseStore((state) => state.nodes);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const sensitivityLevers = useMultiverseStore((state) => state.sensitivityLevers);
  const setSensitivityLevers = useMultiverseStore((state) => state.setSensitivityLevers);
  const updateNode = useMultiverseStore((state) => state.updateNode);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);
  const unexploredMass = useMultiverseStore((state) => state.unexploredMass);

  const levers = [
    {
      key: 'executionVelocity' as keyof SliderDeltas,
      label: 'Execution Velocity',
      description: 'Speed of product shipping, sales cycle, and go-to-market iterations',
      color: '#00F0FF',
    },
    {
      key: 'capitalBuffer' as keyof SliderDeltas,
      label: 'Capital Buffer',
      description: 'Runway preservation, cash reserves, and non-dilutive capital',
      color: '#D4AF37',
    },
    {
      key: 'marketTailwind' as keyof SliderDeltas,
      label: 'Market Tailwind',
      description: 'Macro environment, sector appetite, and competitive momentum',
      color: '#8B5CF6',
    },
    {
      key: 'skillPreparation' as keyof SliderDeltas,
      label: 'Skill Preparation',
      description: 'Domain mastery, team competency, and operational rigor',
      color: '#10B981',
    },
  ];

  const handleSliderChange = (key: keyof SliderDeltas, value: number) => {
    const newDeltas: SliderDeltas = {
      ...sensitivityLevers,
      [key]: value,
    };
    setSensitivityLevers(newDeltas);

    // Run client-side 60 FPS Softmax logit perturbation
    const nodeList = Object.values(nodes);
    const perturbedProbs = perturbProbabilities(nodeList, newDeltas, unexploredMass);

    // Apply perturbed probabilities to active nodes
    const updatedNodesList = nodeList.map((n) => {
      const newCondProb = perturbedProbs.get(n.id);
      if (newCondProb !== undefined) {
        updateNode(n.id, {
          conditionalProbability: newCondProb,
          cumulativeProbability: Number(
            (n.parentId && nodes[n.parentId]
              ? nodes[n.parentId].cumulativeProbability * newCondProb
              : newCondProb
            ).toFixed(4)
          ),
        });
        return {
          ...n,
          conditionalProbability: newCondProb,
        };
      }
      return n;
    });

    // Dynamically re-solve Golden Path if root exists
    if (rootNodeId) {
      const { goldenPathNodeIds } = solveGoldenPath(updatedNodesList, rootNodeId, userContextTwin);
      setGoldenPath(goldenPathNodeIds);
    }
  };

  const handleReset = () => {
    handleSliderChange('executionVelocity', 0.0);
    handleSliderChange('capitalBuffer', 0.0);
    handleSliderChange('marketTailwind', 0.0);
    handleSliderChange('skillPreparation', 0.0);
  };

  return (
    <aside className="absolute left-6 top-24 bottom-20 z-20 w-88 md:w-96 pointer-events-none animate-slide-up">
      <div className="pointer-events-auto h-full p-5 md:p-6 rounded-3xl bg-[#08080E]/90 backdrop-blur-2xl border border-white/[0.08] flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#8B5CF6]" />
              <span className="font-mono text-xs text-white uppercase tracking-wider font-medium">
                Sensitivity Levers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                60 FPS
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#64748B] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs font-sans text-[#94A3B8] leading-relaxed mb-6">
            Perturb real-world dynamics. Softmax logit shift reallocates probability mass across sibling branches
            in &lt;16ms without LLM round-trips.
          </p>

          {/* Sliders List */}
          <div className="space-y-5">
            {levers.map((lever) => {
              const val = sensitivityLevers[lever.key];
              const displayPct = (val * 100).toFixed(0);

              return (
                <div key={lever.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-sans font-medium text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lever.color }} />
                      {lever.label}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        val > 0 ? 'text-[#00F0FF]' : val < 0 ? 'text-[#F43F5E]' : 'text-[#64748B]'
                      }`}
                    >
                      {val > 0 ? `+${displayPct}%` : `${displayPct}%`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-1.0"
                    max="1.0"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleSliderChange(lever.key, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                  />

                  <div className="flex justify-between font-mono text-[9px] text-[#64748B]">
                    <span>-100% (Severe)</span>
                    <span>Neutral (0%)</span>
                    <span>+100% (Surge)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Levers</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-white hover:bg-white/[0.1] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </aside>
  );
}
