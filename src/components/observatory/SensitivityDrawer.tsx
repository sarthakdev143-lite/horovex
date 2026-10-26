'use client';

import React from 'react';
import { SliderDeltas } from '@/lib/math/sensitivity';

export interface SensitivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sensitivityLevers: SliderDeltas;
  onLeverChange: (key: keyof SliderDeltas, value: number) => void;
  onResetLevers: () => void;
}

const LEVER_CONFIG: Array<{
  key: keyof SliderDeltas;
  label: string;
  description: string;
}> = [
  {
    key: 'executionVelocity',
    label: 'Execution speed',
    description: 'Velocity of shipping product features and closing deals.',
  },
  {
    key: 'capitalBuffer',
    label: 'Capital buffer',
    description: 'Runway preservation and emergency liquidity reserve.',
  },
  {
    key: 'marketTailwind',
    label: 'Market tailwind',
    description: 'Macro environment, sector sentiment, and buyer readiness.',
  },
  {
    key: 'skillPreparation',
    label: 'Skill preparation',
    description: 'Team domain mastery and operational excellence.',
  },
];

export default function SensitivityDrawer({
  isOpen,
  onClose,
  sensitivityLevers,
  onLeverChange,
  onResetLevers,
}: SensitivityDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside
      data-ui="true"
      className="fixed top-14 left-0 bottom-0 w-80 sm:w-96 z-30 p-5 overflow-y-auto bg-[#F4F2ED] border-r border-[#DCD8CE] flex flex-col justify-between space-y-5"
      aria-label="60 FPS Sensitivity Sliders Panel"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DCD8CE]">
          <div>
            <h2 className="text-base font-semibold text-[#161615]">
              Sensitivity Sliders
            </h2>
            <p className="text-xs text-[#4A4844]">
              60 FPS real-time Bayesian mass perturbation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-xs text-[#4A4844] hover:text-[#161615] rounded"
            aria-label="Close sensitivity drawer"
          >
            ✕
          </button>
        </div>

        {/* Sliders List */}
        <div className="space-y-4">
          {LEVER_CONFIG.map(({ key, label, description }) => {
            const val = sensitivityLevers[key];
            const pct = Math.round(val * 100);
            return (
              <div
                key={key}
                className="p-3 rounded-lg bg-[#E5E1D8] border border-[#DCD8CE] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`slider-${key}`}
                    className="text-xs font-semibold text-[#161615]"
                  >
                    {label}
                  </label>
                  <span className="text-xs font-semibold tabular-nums text-[#163A50]">
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </span>
                </div>
                <input
                  id={`slider-${key}`}
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={val}
                  onChange={(e) => onLeverChange(key, parseFloat(e.target.value))}
                  className="w-full h-1.5 cursor-pointer accent-[#163A50]"
                />
                <p className="text-xs text-[#4A4844] leading-tight">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-[#DCD8CE] space-y-2">
        <button
          type="button"
          onClick={onResetLevers}
          className="w-full py-2 px-3 text-xs font-medium rounded bg-[#E5E1D8] text-[#161615] hover:bg-[#DCD8CE] transition-colors"
        >
          Reset Sliders to Neutral
        </button>
        <p className="text-xs text-[#4A4844] text-center leading-snug">
          Perturbations dynamically reshape 3D stele heights while preserving exact mass conservation.
        </p>
      </div>
    </aside>
  );
}
