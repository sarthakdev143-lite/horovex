'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { TopChronometerBar } from '@/components/hud/TopChronometerBar';
import SensitivityLeversPanel from '@/components/hud/SensitivityLeversPanel';
import MentorAdvisoryDrawer from '@/components/hud/MentorAdvisoryDrawer';
import DigitalTwinVault from '@/components/hud/DigitalTwinVault';
import NodeDetailsPanel from '@/components/hud/NodeDetailsPanel';
import ChronicleMatrixView from '@/components/matrix/ChronicleMatrixView';
import ClarifyingPulseModal from '@/components/dialogs/ClarifyingPulseModal';
import ActionInjectionModal from '@/components/dialogs/ActionInjectionModal';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { computeWaveMass } from '@/lib/math/bayesian';
import {
  flagshipFounderSaaSPivot,
  flagshipSeniorTechSoloAI,
  flagshipGlobalRelocation,
} from '@/tests/fixtures/mock-scenarios';
import { Compass, Sparkles, Layers, ChevronRight, Send, Search } from 'lucide-react';

// Client-only dynamic loading for 3D R3F Canvas to prevent Next.js SSR hydration errors
const MultiverseCanvas = dynamic(
  () => import('@/components/canvas/MultiverseCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050507] text-[#94A3B8] font-mono text-xs">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          <Compass className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <span className="tracking-widest uppercase text-[#E2E8F0] mb-1">INITIALIZING CHRONOMETRIC PHASE SPACE</span>
        <span className="text-[10px] text-[#64748B]">CALIBRATING CONICAL ORBITAL RINGS...</span>
      </div>
    ),
  }
);

function ObservatoryInner() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get('demo');
  const promptParam = searchParams.get('prompt');

  const nodes = useMultiverseStore((state) => state.nodes);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const maxWaveNumber = useMultiverseStore((state) => state.maxWaveNumber);
  const activeDepth = useMultiverseStore((state) => state.activeDepth);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);
  const setNodes = useMultiverseStore((state) => state.setNodes);
  const addNodes = useMultiverseStore((state) => state.addNodes);
  const selectNode = useMultiverseStore((state) => state.selectNode);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);
  const setUserContextTwin = useMultiverseStore((state) => state.setUserContextTwin);

  const [activeViewMode, setActiveViewMode] = useState<'3d' | '2d'>('3d');
  const [isLeversOpen, setIsLeversOpen] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isTwinOpen, setIsTwinOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isPulseModalOpen, setIsPulseModalOpen] = useState(false);
  const [pulseSituation, setPulseSituation] = useState('');

  const [situationInput, setSituationInput] = useState('');
  const [isLoadingWave, setIsLoadingWave] = useState(false);

  // Handle Flagship Demo Pre-population
  useEffect(() => {
    if (!demoParam) return;

    let scenario = flagshipFounderSaaSPivot;
    if (demoParam === 'solo-ai' || demoParam === 'senior-tech-solo-ai') {
      scenario = flagshipSeniorTechSoloAI;
    } else if (demoParam === 'relocation' || demoParam === 'global-relocation') {
      scenario = flagshipGlobalRelocation;
    }

    const demoNodes: Record<string, ProbabilityNode> = {};
    demoNodes[scenario.rootNode.id] = scenario.rootNode;
    scenario.initialWave1.forEach((n) => {
      demoNodes[n.id] = n;
    });

    setNodes(demoNodes);
    selectNode(scenario.initialWave1[0].id);
    setUserContextTwin(scenario.recommendedTwin);
    setGoldenPath(scenario.expectedGoldenPathIds);
  }, [demoParam, setNodes, selectNode, setUserContextTwin, setGoldenPath]);

  // Handle initial prompt from landing page
  useEffect(() => {
    if (promptParam && promptParam.trim().length > 0) {
      handleInitiateSituation(promptParam.trim());
    }
  }, [promptParam]);

  const handleInitiateSituation = async (situation: string) => {
    try {
      setIsLoadingWave(true);
      // 1. Run adaptive clarifying pulse calibration check
      const calRes = await fetch('/api/simulations/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      const calData = await calRes.json();

      if (calData.needsClarification) {
        setPulseSituation(situation);
        setIsPulseModalOpen(true);
        setIsLoadingWave(false);
        return;
      }

      await generateInitialWave(situation);
    } catch {
      await generateInitialWave(situation);
    } finally {
      setIsLoadingWave(false);
    }
  };

  const generateInitialWave = async (situation: string) => {
    try {
      setIsLoadingWave(true);
      const rootId = `root-${Date.now()}`;
      const rootNode: ProbabilityNode = {
        id: rootId,
        simulationId: `sim-${Date.now()}`,
        parentId: null,
        treePath: 'root',
        depth: 0,
        waveNumber: 1,
        siblingIndex: 1,
        regimeTier: 'root',
        title: situation.length > 55 ? `${situation.slice(0, 52)}...` : situation,
        narrativeSummary: situation,
        timeHorizon: 'Present (T_0)',
        conditionalProbability: 1.0,
        cumulativeProbability: 1.0,
        rawLlmConfidence: 1.0,
        unexploredChildMass: 0.20,
        causalDrivers: ['Present decision crossroads'],
        reversibilityType: 'hybrid',
        reversibilityScore: 7.5,
        regretMinimizationScore: 8.0,
        impactVector: { wealth: 0, autonomy: 0, mastery: 0, stability: 0, impact: 0, peace: 0 },
        isGoldenPath: true,
        status: 'active',
        spatialPosition: { x: 0, y: 0, z: 0 },
        sensitivityWeights: { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
        tripwires: ['Initial trajectory baseline'],
        createdAt: new Date().toISOString(),
      };

      const waveRes = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: rootNode.simulationId,
          parentId: rootId,
          depth: 1,
          waveNumber: 1,
        }),
      });

      const waveData = await waveRes.json();
      const waveNodes: ProbabilityNode[] = waveData.nodes || [];

      const nodeMap: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      waveNodes.forEach((n) => {
        nodeMap[n.id] = n;
      });

      setNodes(nodeMap);
      selectNode(waveNodes[0]?.id || rootId);

      const allNodes = Object.values(nodeMap);
      const { goldenPathNodeIds } = solveGoldenPath(allNodes, rootId, userContextTwin);
      setGoldenPath(goldenPathNodeIds);
    } finally {
      setIsLoadingWave(false);
      setIsPulseModalOpen(false);
    }
  };

  // Horizontal Expansion (+5 More Possibilities)
  const handleHorizontalExpand = async () => {
    const nextWave = (maxWaveNumber || 1) + 1;
    const parent = rootNodeId ? nodes[rootNodeId] : null;

    try {
      setIsLoadingWave(true);
      const waveRes = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: parent?.simulationId || 'sim-active',
          parentId: rootNodeId,
          depth: 1,
          waveNumber: nextWave,
        }),
      });

      const waveData = await waveRes.json();
      if (waveData.nodes && waveData.nodes.length > 0) {
        addNodes(waveData.nodes);
        useMultiverseStore.setState({ maxWaveNumber: nextWave });
      }
    } finally {
      setIsLoadingWave(false);
    }
  };

  // Vertical Recursion (Auto-Project or Dive Deeper)
  const handleVerticalRecursion = async (interventionPrompt?: string) => {
    const targetNode = selectedNodeId ? nodes[selectedNodeId] : null;
    if (!targetNode) return;

    const nextDepth = targetNode.depth + 1;

    try {
      setIsLoadingWave(true);
      const waveRes = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: targetNode.simulationId,
          parentId: targetNode.id,
          depth: nextDepth,
          waveNumber: 1,
          userInterventionPrompt: interventionPrompt,
          parentSpatialPosition: targetNode.spatialPosition,
          parentCumProb: targetNode.cumulativeProbability,
        }),
      });

      const waveData = await waveRes.json();
      if (waveData.nodes && waveData.nodes.length > 0) {
        addNodes(waveData.nodes);
        useMultiverseStore.setState({ activeDepth: nextDepth });
        selectNode(waveData.nodes[0].id);

        // Update Golden Path
        if (rootNodeId) {
          const allNodes = Object.values(useMultiverseStore.getState().nodes);
          const { goldenPathNodeIds } = solveGoldenPath(allNodes, rootNodeId, userContextTwin);
          setGoldenPath(goldenPathNodeIds);
        }
      }
    } finally {
      setIsLoadingWave(false);
      setIsActionModalOpen(false);
    }
  };

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050507] select-none">
      {/* 1. Spatial WebGL Canvas (Full-Screen Viewport) */}
      <div className="absolute inset-0 z-0">
        <MultiverseCanvas />
      </div>

      {/* 2. Top Chronometer Telemetry Flight Deck */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4">
        <TopChronometerBar
          activeViewMode={activeViewMode}
          onToggleViewMode={() => setActiveViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
          onToggleLevers={() => setIsLeversOpen((prev) => !prev)}
          onToggleMentor={() => setIsMentorOpen((prev) => !prev)}
          onToggleTwin={() => setIsTwinOpen((prev) => !prev)}
        />
      </header>

      {/* 3. Top Floating Dilemma Quick-Input Console */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-xl px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (situationInput.trim()) {
              handleInitiateSituation(situationInput.trim());
            }
          }}
          className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl glass-panel-elevated"
        >
          <div className="pl-3 text-[#64748B]">
            <Search className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <input
            type="text"
            value={situationInput}
            onChange={(e) => setSituationInput(e.target.value)}
            placeholder="Enter your high-stakes dilemma (e.g. Pivot to enterprise vs. stay self-serve?)..."
            className="w-full bg-transparent border-none text-xs text-white placeholder-[#64748B] focus:outline-none font-sans px-2"
          />
          <button
            type="submit"
            disabled={isLoadingWave || !situationInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Simulate</span>
            <Send className="w-3 h-3 text-black" />
          </button>
        </form>
      </div>

      {/* 4. Bottom HUD Navigation: Depth Breadcrumbs & Wave Expansion Trigger */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl glass-panel hairline-border font-mono text-xs text-[#94A3B8]">
          <span className="text-[#64748B]">Timeline Depth:</span>
          <span className="text-white font-medium">Depth {activeDepth || 1}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[#D4AF37] font-medium">T{activeDepth || 1} (Wave {maxWaveNumber || 1})</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 p-1.5 rounded-2xl glass-panel-elevated">
          {/* Horizontal Expansion Button */}
          <button
            type="button"
            onClick={handleHorizontalExpand}
            disabled={isLoadingWave}
            className="px-5 py-2.5 rounded-xl bg-[#14120B] border border-[#D4AF37]/50 text-[#F3E5AB] font-mono text-xs font-medium hover:bg-[#1E190E] active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.15)] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>+5 More Possibilities (Wave {(maxWaveNumber || 1) + 1})</span>
          </button>

          {/* Vertical Recursion / Auto-Project Button */}
          <button
            type="button"
            onClick={() => handleVerticalRecursion()}
            disabled={isLoadingWave || !selectedNodeId}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#94A3B8] font-mono text-xs hover:text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Auto-Project Next 5 Futures</span>
          </button>
        </div>
      </div>

      {/* 5. 2D Chronicle Matrix Overlay View */}
      {activeViewMode === '2d' && (
        <div className="absolute inset-x-6 top-24 bottom-6 z-30 animate-fade-in">
          <ChronicleMatrixView onClose={() => setActiveViewMode('3d')} />
        </div>
      )}

      {/* 6. Left Sensitivity Levers Overlay */}
      {isLeversOpen && <SensitivityLeversPanel onClose={() => setIsLeversOpen(false)} />}

      {/* 7. Right Mentor Advisory Drawer */}
      {isMentorOpen && <MentorAdvisoryDrawer onClose={() => setIsMentorOpen(false)} />}

      {/* 8. Right Digital Twin Vault Drawer */}
      {isTwinOpen && <DigitalTwinVault onClose={() => setIsTwinOpen(false)} />}

      {/* 9. Selected Node Details Panel */}
      {selectedNode && activeViewMode === '3d' && !isMentorOpen && (
        <NodeDetailsPanel
          onAutoProject={() => handleVerticalRecursion()}
          onOpenInjectAction={() => setIsActionModalOpen(true)}
          onClose={() => selectNode(null)}
        />
      )}

      {/* 10. Modals */}
      <ClarifyingPulseModal
        situation={pulseSituation}
        isOpen={isPulseModalOpen}
        onSkip={() => generateInitialWave(pulseSituation)}
        onProceed={() => generateInitialWave(pulseSituation)}
      />

      <ActionInjectionModal
        parentNode={selectedNode}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSubmit={(move) => handleVerticalRecursion(move)}
      />
    </main>
  );
}

export default function ObservatoryPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#050507] text-[#94A3B8] font-mono text-xs">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
            <Compass className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <span className="tracking-widest uppercase text-[#E2E8F0] mb-1">INITIALIZING HOROVEX OBSERVATORY</span>
          <span className="text-[10px] text-[#64748B]">CALIBRATING TELEMETRY...</span>
        </div>
      }
    >
      <ObservatoryInner />
    </Suspense>
  );
}
