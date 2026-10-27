'use client';

import React from 'react';
import Link from 'next/link';
import { ProbabilityNode } from '@/lib/types/multiverse';

export interface ObservatoryHeaderProps {
  rootNodeTitle?: string;
  activeDepth: number;
  maxWaveNumber: number;
  activeViewMode: '3d' | '2d';
  onToggleViewMode: (mode: '3d' | '2d') => void;
  isMentorOpen: boolean;
  onToggleMentor: () => void;
  isSensitivityOpen: boolean;
  onToggleSensitivity: () => void;
  branchNodes: ProbabilityNode[];
  selectedNodeId?: string | null;
  onFocusPortal: (id: string) => void;
  onResetCamera: () => void;
  goldenPathNodeIds: string[];
}

export default function ObservatoryHeader({
  rootNodeTitle = 'Alabaster Decision Sanctuary',
  activeDepth,
  maxWaveNumber,
  activeViewMode,
  onToggleViewMode,
  isMentorOpen,
  onToggleMentor,
  isSensitivityOpen,
  onToggleSensitivity,
  branchNodes,
  selectedNodeId,
  onFocusPortal,
  onResetCamera,
  goldenPathNodeIds,
}: ObservatoryHeaderProps) {
  return (
    <header
      data-testid="top-chronometer-bar"
      className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#E5E1D8] border-b border-[#DCD8CE]"
    >
      {/* Left: Brand wordmark & dilemma identity */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="text-base sm:text-lg font-semibold tracking-tight text-[#161615] hover:opacity-80 transition-opacity"
        >
          HOROVEX
        </Link>
        <span className="text-[#DCD8CE] hidden sm:inline">|</span>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-[#161615] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {rootNodeTitle}
          </h1>
          <span className="text-[13px] text-[#4A4844] tabular-nums block">
            Depth {activeDepth || 1} · Wave {maxWaveNumber || 1}
          </span>
        </div>
      </div>

      {/* Center: Quick camera fly steles (desktop) */}
      <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
        {branchNodes.slice(0, 5).map((node) => {
          const isRec =
            goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
          const isSel = selectedNodeId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onFocusPortal(node.id)}
              className="px-2 py-0.5 text-[13px] font-medium tabular-nums rounded transition-colors whitespace-nowrap"
              style={{
                backgroundColor: isRec
                  ? '#163A50'
                  : isSel
                  ? '#161615'
                  : '#F4F2ED',
                color: isRec || isSel ? '#FFFFFF' : '#161615',
              }}
              title={node.title}
            >
              {Math.round(node.conditionalProbability * 100)}% ·{' '}
              {node.title.length > 14 ? `${node.title.slice(0, 12)}…` : node.title}
            </button>
          );
        })}
      </div>

      {/* Right: Drawer toggles & View mode switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onResetCamera}
          className="hidden md:inline-flex px-2.5 py-1.5 text-[13px] font-medium text-[#161615] bg-[#F4F2ED] rounded hover:bg-[#DCD8CE] transition-colors"
          title="Reset 3D camera to wide overview"
        >
          Reset Camera
        </button>

        <button
          type="button"
          onClick={onToggleSensitivity}
          className="px-3 py-1.5 text-[13px] font-semibold rounded transition-colors"
          style={{
            backgroundColor: isSensitivityOpen ? '#163A50' : '#F4F2ED',
            color: isSensitivityOpen ? '#FFFFFF' : '#161615',
          }}
          aria-label="Toggle sensitivity sliders"
        >
          Sensitivity Sliders
        </button>

        <button
          type="button"
          onClick={onToggleMentor}
          className="px-3 py-1.5 text-[13px] font-semibold rounded transition-colors"
          style={{
            backgroundColor: isMentorOpen ? '#163A50' : '#F4F2ED',
            color: isMentorOpen ? '#FFFFFF' : '#161615',
          }}
          aria-label="Golden Path Guidance (Strategic Mentor Advisory)"
        >
          Mentor Guidance
        </button>

        <div className="flex items-center rounded overflow-hidden border border-[#DCD8CE]">
          <button
            type="button"
            onClick={() => onToggleViewMode('3d')}
            className="px-2.5 py-1.5 text-[13px] font-semibold transition-colors"
            style={{
              backgroundColor: activeViewMode === '3d' ? '#163A50' : '#F4F2ED',
              color: activeViewMode === '3d' ? '#FFFFFF' : '#161615',
            }}
          >
            3D Sanctuary
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('2d')}
            className="px-2.5 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: activeViewMode === '2d' ? '#163A50' : '#F4F2ED',
              color: activeViewMode === '2d' ? '#FFFFFF' : '#161615',
            }}
            aria-label="Compare in Table (2D Chronicle Matrix)"
          >
            Compare in Table
          </button>
        </div>
      </div>
    </header>
  );
}
