'use client';

import React, { useState } from 'react';
import { Compass, Sparkles, FastForward, Check, HelpCircle } from 'lucide-react';

interface ClarifyingPulseModalProps {
  situation: string;
  isOpen: boolean;
  onProceed: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

export default function ClarifyingPulseModal({
  situation,
  isOpen,
  onProceed,
  onSkip,
}: ClarifyingPulseModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    runway: '12-18 months',
    validation: 'Strong qualitative discovery interviews',
    constraint: 'Capital & runway buffer',
  });

  if (!isOpen) return null;

  const questions = [
    {
      id: 'runway',
      title: 'Current Financial Runway',
      description: 'How many months of liquid burn buffer remain?',
      options: ['< 6 Months (Urgent)', '6-12 Months', '12-18 Months', '24+ Months / Cashflow Positive'],
    },
    {
      id: 'validation',
      title: 'Market Validation & Traction',
      description: 'What level of empirical evidence has been verified?',
      options: ['Idea stage only', 'Qualitative customer interviews', 'Active unpaid LOIs / Waitlist', 'Paying customers / Proven MRR'],
    },
    {
      id: 'constraint',
      title: 'Primary Operational Constraint',
      description: 'Which factor constitutes your primary decision bottleneck?',
      options: ['Capital & runway', 'Engineering / Technical execution', 'Market timing & tailwinds', 'Personal energy & wellbeing'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#09090F] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37]/50 bg-[#16130B] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Compass className="w-5 h-5 text-[#D4AF37] animate-chronometer-tick" />
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#D4AF37] block">
                The Clarifying Pulse • Adaptive Calibration
              </span>
              <h2 className="font-serif text-2xl text-white font-medium">Calibrate Decision Space</h2>
            </div>
          </div>

          {/* 1-Click Fast-Track "Skip" */}
          <button
            onClick={onSkip}
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs font-mono text-[#94A3B8] hover:text-[#F3E5AB] hover:border-[#D4AF37]/40 transition-all flex items-center gap-2 group"
          >
            <span>Skip &amp; Simulate Immediately</span>
            <FastForward className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Situation Preview */}
        <div className="my-5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] font-sans text-xs text-[#94A3B8]">
          <span className="font-mono text-[10px] text-[#64748B] block mb-1 uppercase">Stated Dilemma:</span>
          <p className="text-white italic line-clamp-2">&ldquo;{situation}&rdquo;</p>
        </div>

        {/* Questions Grid */}
        <div className="space-y-4 my-2">
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-[#0F0F16] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-xs font-medium text-white">{q.title}</span>
                <span className="text-[10px] font-mono text-[#64748B]">{q.description}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-sans transition-all border ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#F3E5AB]'
                          : 'bg-white/[0.02] border-white/[0.06] text-[#94A3B8] hover:border-white/[0.15] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#64748B]">
            Calibrated inputs will refine the Bellman Utility weights
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 text-xs font-mono text-[#94A3B8] hover:text-white"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => onProceed(answers)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-black font-semibold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Simulate Multiverse Wave 1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
