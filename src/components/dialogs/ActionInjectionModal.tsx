'use client';

import React, { useState } from 'react';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { Zap, Layers, X, Sparkles } from 'lucide-react';

interface ActionInjectionModalProps {
  parentNode: ProbabilityNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (intervention: string) => void;
}

export default function ActionInjectionModal({
  parentNode,
  isOpen,
  onClose,
  onSubmit,
}: ActionInjectionModalProps) {
  const [intervention, setIntervention] = useState('');

  if (!isOpen || !parentNode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intervention.trim()) return;
    onSubmit(intervention.trim());
    setIntervention('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#09090F] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#00F0FF] block">
                Active Action Injection • Agency $\eta = 0.80$
              </span>
              <h3 className="font-serif text-xl text-white font-medium">Inject Counter-Move</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Parent Trajectory Context */}
        <div className="my-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="font-mono text-[10px] text-[#64748B] block mb-1 uppercase">
            Branching From (Depth {parentNode.depth}):
          </span>
          <div className="font-sans text-xs font-medium text-white">{parentNode.title}</div>
          <div className="font-mono text-[11px] text-[#00F0FF] mt-1">
            P(path) = {(parentNode.cumulativeProbability * 100).toFixed(1)}% • Horizon: {parentNode.timeHorizon}
          </div>
        </div>

        {/* Intervention Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] text-[#94A3B8] mb-2">
              Describe your intervention move assuming this state arrives:
            </label>
            <textarea
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              placeholder="Describe your intervention move (e.g. Negotiate enterprise contract with 50% upfront payment)..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[#0D0D14] border border-white/[0.1] text-white text-xs font-sans placeholder-[#64748B] focus:outline-none focus:border-[#00F0FF]/60 focus:ring-1 focus:ring-[#00F0FF]/60 transition-all resize-none"
              autoFocus
            />
          </div>

          <p className="font-sans text-[11px] text-[#64748B] leading-relaxed">
            Active intervention conditions downstream branch probabilities and boosts optimal policy weight from
            passive $\eta=0.40$ to active $\eta=0.80$ agency in the Bellman equation.
          </p>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-[#94A3B8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!intervention.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] text-black font-semibold text-xs hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Simulate Conditioned Futures</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
