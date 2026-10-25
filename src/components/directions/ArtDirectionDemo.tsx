'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { computeWaveMass } from '@/lib/math/bayesian';
import { perturbProbabilities, SliderDeltas } from '@/lib/math/sensitivity';
import { generateDeterministicWave } from '@/lib/ai/adapter';
import { generateExecutiveDossierMarkdown } from '@/lib/dossier';
import {
  flagshipFounderSaaSPivot,
  flagshipSeniorTechSoloAI,
  flagshipGlobalRelocation,
  FlagshipScenario,
} from '@/tests/fixtures/mock-scenarios';
import type { ArtDirectionId } from '@/components/canvas/DirectionCanvas';
import { DIRECTION_THEMES, DirectionTheme } from '@/lib/directions/themes';

export { DIRECTION_THEMES };
export type { DirectionTheme };

const DirectionCanvas = dynamic(
  () => import('@/components/canvas/DirectionCanvas'),
  { ssr: false }
);

export interface ArtDirectionDemoProps {
  initialDirection?: ArtDirectionId;
}

const ZERO_LEVERS: SliderDeltas = {
  executionVelocity: 0,
  capitalBuffer: 0,
  marketTailwind: 0,
  skillPreparation: 0,
};

export default function ArtDirectionDemo({
  initialDirection = 'sanctuary',
}: ArtDirectionDemoProps) {
  const direction: ArtDirectionId = initialDirection ? 'sanctuary' : 'sanctuary';
  const theme = DIRECTION_THEMES.sanctuary;

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.ground;
    document.body.style.backgroundColor = theme.ground;
    document.body.style.color = theme.ink;
  }, [theme]);

  const nodes = useMultiverseStore((state) => state.nodes);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const activeDepth = useMultiverseStore((state) => state.activeDepth);
  const unexploredMass = useMultiverseStore((state) => state.unexploredMass);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);
  const sensitivityLevers = useMultiverseStore((state) => state.sensitivityLevers);

  const setNodes = useMultiverseStore((state) => state.setNodes);
  const addNodes = useMultiverseStore((state) => state.addNodes);
  const selectNode = useMultiverseStore((state) => state.selectNode);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);
  const setUserContextTwin = useMultiverseStore((state) => state.setUserContextTwin);
  const setSensitivityLevers = useMultiverseStore((state) => state.setSensitivityLevers);

  const baselineProbsRef = useRef<Record<string, number>>({});

  const [dilemmaInput, setDilemmaInput] = useState('');
  const [interventionInput, setInterventionInput] = useState('');
  const [showInterventionBox, setShowInterventionBox] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenarioSlug, setActiveScenarioSlug] = useState<string>('saas-pivot');
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Scroll-driven 3D camera state & Fly-to-arch focus mode
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cameraMode, setCameraMode] = useState<'scroll' | 'focus' | 'overview'>('scroll');
  const [pureGardenView, setPureGardenView] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    loadScenario(flagshipFounderSaaSPivot, 'saas-pivot');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const sy = window.scrollY || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, sy / maxScroll));
      setScrollProgress(progress);

      if (Math.abs(sy - lastScrollYRef.current) > 28) {
        lastScrollYRef.current = sy;
        setCameraMode('scroll');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const recordBaselineProbs = (nodeList: ProbabilityNode[], resetAll = false) => {
    if (resetAll) {
      baselineProbsRef.current = {};
    }
    nodeList.forEach((n) => {
      baselineProbsRef.current[n.id] = n.conditionalProbability;
    });
  };

  const loadScenario = (scenario: FlagshipScenario, slug: string) => {
    const map: Record<string, ProbabilityNode> = {};
    map[scenario.rootNode.id] = scenario.rootNode;
    scenario.initialWave1.forEach((n) => {
      map[n.id] = n;
    });
    recordBaselineProbs(Object.values(map), true);
    setNodes(map);
    setSensitivityLevers(ZERO_LEVERS);
    useMultiverseStore.setState({
      rootNodeId: scenario.rootNode.id,
      activeDepth: 1,
      maxWaveNumber: 1,
      exploredMass: 0.8,
      unexploredMass: 0.2,
    });
    selectNode(scenario.initialWave1[0]?.id || scenario.rootNode.id);
    setUserContextTwin(scenario.recommendedTwin);
    setGoldenPath(scenario.expectedGoldenPathIds);
    setActiveScenarioSlug(slug);
    setCameraMode('scroll');
  };

  const handleFocusNode = (id: string) => {
    selectNode(id);
    setCameraMode('focus');
  };

  const handleSimulateDilemma = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = dilemmaInput.trim();
    if (!cleanPrompt || isSimulating) return;

    setIsSimulating(true);
    const rootId = `root-${Date.now()}`;
    const simId = `sim-${Date.now()}`;
    const rootNode: ProbabilityNode = {
      id: rootId,
      simulationId: simId,
      parentId: null,
      treePath: 'root',
      depth: 0,
      waveNumber: 1,
      siblingIndex: 1,
      regimeTier: 'root',
      title: cleanPrompt.length > 56 ? `${cleanPrompt.slice(0, 53)}...` : cleanPrompt,
      narrativeSummary: cleanPrompt,
      timeHorizon: 'Present',
      conditionalProbability: 1.0,
      cumulativeProbability: 1.0,
      rawLlmConfidence: 1.0,
      unexploredChildMass: 0.2,
      causalDrivers: ['Decision crossroads'],
      reversibilityType: 'hybrid',
      reversibilityScore: 7.5,
      regretMinimizationScore: 8.0,
      impactVector: { wealth: 0, autonomy: 0, mastery: 0, stability: 0, impact: 0, peace: 0 },
      isGoldenPath: true,
      status: 'active',
      spatialPosition: { x: 0, y: 0, z: 0 },
      sensitivityWeights: {
        executionVelocity: 0,
        capitalBuffer: 0,
        marketTailwind: 0,
        skillPreparation: 0,
      },
      tripwires: ['Initial baseline'],
      createdAt: '2026-10-25T00:00:00.000Z',
    };

    try {
      const res = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simId,
          parentId: rootId,
          depth: 1,
          waveNumber: 1,
        }),
      });
      const data = await res.json();
      const waveNodes: ProbabilityNode[] =
        data.nodes && data.nodes.length > 0
          ? data.nodes.map((n: ProbabilityNode, idx: number) => ({
              ...n,
              title: `${cleanPrompt.slice(0, 28)} · Path ${idx + 1}`,
            }))
          : generateDeterministicWave(cleanPrompt, 1, 1, rootId, 1.0);

      const map: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      waveNodes.forEach((n) => {
        map[n.id] = n;
      });
      recordBaselineProbs(Object.values(map), true);
      setNodes(map);
      setSensitivityLevers(ZERO_LEVERS);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
        exploredMass: 0.8,
        unexploredMass: 0.2,
      });
      selectNode(waveNodes[0]?.id || rootId);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(map),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
      setActiveScenarioSlug('custom');
      setCameraMode('focus');
    } catch {
      const fallbackNodes = generateDeterministicWave(cleanPrompt, 1, 1, rootId, 1.0);
      const map: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      fallbackNodes.forEach((n) => {
        map[n.id] = n;
      });
      recordBaselineProbs(Object.values(map), true);
      setNodes(map);
      setSensitivityLevers(ZERO_LEVERS);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
        exploredMass: 0.8,
        unexploredMass: 0.2,
      });
      selectNode(fallbackNodes[0]?.id || rootId);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(map),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
      setCameraMode('focus');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExpandFiveMore = async () => {
    if (isSimulating) return;
    const currentStore = useMultiverseStore.getState();
    const nextWave = (currentStore.maxWaveNumber || 1) + 1;
    const activeRootId =
      currentStore.rootNodeId ||
      Object.values(currentStore.nodes).find((n) => !n.parentId)?.id ||
      'root-1';
    const rootNode = currentStore.nodes[activeRootId];
    const { remainingUnexplored: newRemainingMass } = computeWaveMass(nextWave);
    setIsSimulating(true);

    try {
      const res = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: rootNode?.simulationId || 'sim-active',
          parentId: activeRootId,
          depth: 1,
          waveNumber: nextWave,
        }),
      });
      const data = await res.json();
      const newNodes: ProbabilityNode[] =
        data.nodes && data.nodes.length > 0
          ? data.nodes
          : generateDeterministicWave(
              rootNode?.title || 'Decision expansion',
              nextWave,
              1,
              activeRootId,
              1.0
            );
      recordBaselineProbs(newNodes, false);
      addNodes(newNodes);
      useMultiverseStore.setState({
        maxWaveNumber: nextWave,
        unexploredMass: newRemainingMass,
        exploredMass: Number((1 - newRemainingMass).toFixed(4)),
      });
      if (newNodes[0]) {
        selectNode(newNodes[0].id);
        setCameraMode('focus');
      }

      const allNodes = Object.values(useMultiverseStore.getState().nodes);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        allNodes,
        activeRootId,
        userContextTwin
      );
      setGoldenPath(solved);
    } catch {
      const fallback = generateDeterministicWave(
        rootNode?.title || 'Decision expansion',
        nextWave,
        1,
        activeRootId,
        1.0
      );
      recordBaselineProbs(fallback, false);
      addNodes(fallback);
      useMultiverseStore.setState({
        maxWaveNumber: nextWave,
        unexploredMass: newRemainingMass,
        exploredMass: Number((1 - newRemainingMass).toFixed(4)),
      });
      if (fallback[0]) {
        selectNode(fallback[0].id);
        setCameraMode('focus');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleStepIntoFuture = async (customMove?: string) => {
    if (isSimulating) return;
    const target = selectedNodeId ? nodes[selectedNodeId] : null;
    if (!target) return;

    const nextDepth = target.depth + 1;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: target.simulationId,
          parentId: target.id,
          depth: nextDepth,
          waveNumber: 1,
          userInterventionPrompt: customMove,
          parentSpatialPosition: target.spatialPosition,
          parentCumProb: target.cumulativeProbability,
        }),
      });
      const data = await res.json();
      const childNodes: ProbabilityNode[] =
        data.nodes && data.nodes.length > 0
          ? data.nodes
          : generateDeterministicWave(
              customMove || target.title,
              1,
              nextDepth,
              target.id,
              target.cumulativeProbability,
              customMove
            );

      recordBaselineProbs(childNodes, false);
      addNodes(childNodes);
      useMultiverseStore.setState({ activeDepth: nextDepth });
      if (childNodes[0]) {
        selectNode(childNodes[0].id);
        setCameraMode('focus');
      }

      const allNodes = Object.values(useMultiverseStore.getState().nodes);
      const activeRoot = rootNodeId || allNodes.find((n) => !n.parentId)?.id;
      if (activeRoot) {
        const { goldenPathNodeIds: solved } = solveGoldenPath(
          allNodes,
          activeRoot,
          userContextTwin
        );
        setGoldenPath(solved);
      }
    } catch {
      const fallback = generateDeterministicWave(
        customMove || target.title,
        1,
        nextDepth,
        target.id,
        target.cumulativeProbability,
        customMove
      );
      recordBaselineProbs(fallback, false);
      addNodes(fallback);
      useMultiverseStore.setState({ activeDepth: nextDepth });
      if (fallback[0]) {
        selectNode(fallback[0].id);
        setCameraMode('focus');
      }
    } finally {
      setIsSimulating(false);
      setShowInterventionBox(false);
      setInterventionInput('');
    }
  };

  const applyLeverVector = (nextLevers: SliderDeltas) => {
    setSensitivityLevers(nextLevers);
    const currentNodes = useMultiverseStore.getState().nodes;
    const nodeList = Object.values(currentNodes);
    const isZero =
      nextLevers.executionVelocity === 0 &&
      nextLevers.capitalBuffer === 0 &&
      nextLevers.marketTailwind === 0 &&
      nextLevers.skillPreparation === 0;

    const byParent = new Map<string, ProbabilityNode[]>();
    nodeList.forEach((n) => {
      if (!n.parentId) return;
      const list = byParent.get(n.parentId) || [];
      list.push(n);
      byParent.set(n.parentId, list);
    });

    const newCondMap = new Map<string, number>();
    byParent.forEach((siblings, pid) => {
      const baselineSiblings = siblings.map((s) => ({
        ...s,
        conditionalProbability:
          baselineProbsRef.current[s.id] ?? s.conditionalProbability,
      }));
      if (isZero) {
        baselineSiblings.forEach((s) => newCondMap.set(s.id, s.conditionalProbability));
      } else {
        const parentUnexplored =
          pid === rootNodeId ? unexploredMass : currentNodes[pid]?.unexploredChildMass ?? 0.2;
        const perturbed = perturbProbabilities(baselineSiblings, nextLevers, parentUnexplored);
        perturbed.forEach((val, id) => newCondMap.set(id, val));
      }
    });

    const sortedByDepth = [...nodeList].sort((a, b) => a.depth - b.depth);
    const nextNodeMap: Record<string, ProbabilityNode> = {};
    sortedByDepth.forEach((n) => {
      if (!n.parentId) {
        nextNodeMap[n.id] = n;
        return;
      }
      const cond = newCondMap.get(n.id) ?? n.conditionalProbability;
      const parentCum = nextNodeMap[n.parentId]?.cumulativeProbability ?? 1.0;
      const cum = Number((parentCum * cond).toFixed(4));
      nextNodeMap[n.id] = {
        ...n,
        conditionalProbability: cond,
        cumulativeProbability: cum,
      };
    });

    setNodes(nextNodeMap);
    const updatedList = Object.values(nextNodeMap);
    const activeRoot = rootNodeId || updatedList.find((n) => !n.parentId)?.id;
    if (activeRoot) {
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        updatedList,
        activeRoot,
        userContextTwin
      );
      setGoldenPath(solved);
    }
  };

  const handleLeverChange = (key: keyof SliderDeltas, value: number) => {
    applyLeverVector({
      ...sensitivityLevers,
      [key]: value,
    });
  };

  const handleResetLevers = () => {
    applyLeverVector(ZERO_LEVERS);
  };

  const nodeList = useMemo(() => Object.values(nodes), [nodes]);
  const branchNodes = useMemo(
    () =>
      nodeList
        .filter((n) => n.parentId !== null)
        .sort((a, b) => b.conditionalProbability - a.conditionalProbability),
    [nodeList]
  );
  const rootNode = useMemo(
    () => (rootNodeId && nodes[rootNodeId]) || nodeList.find((n) => !n.parentId) || null,
    [nodes, rootNodeId, nodeList]
  );
  const selectedNode = useMemo(
    () => (selectedNodeId && nodes[selectedNodeId]) || branchNodes[0] || rootNode,
    [nodes, selectedNodeId, branchNodes, rootNode]
  );
  const recommendedNode = useMemo(
    () =>
      branchNodes.find((n) => goldenPathNodeIds.includes(n.id) || n.isGoldenPath) ||
      branchNodes[0],
    [branchNodes, goldenPathNodeIds]
  );

  const handleCopyBrief = () => {
    const md = generateExecutiveDossierMarkdown({
      situation: rootNode?.title || 'Decision Simulation',
      twin: userContextTwin,
      goldenPathNodes: branchNodes.filter((n) => goldenPathNodeIds.includes(n.id)),
      mentorSynthesis: {
        executiveVerdict: `Follow ${recommendedNode?.title || 'the recommended path'} (${Math.round(
          (recommendedNode?.conditionalProbability || 0.32) * 100
        )}% likelihood).`,
        actionPlaybook: [
          {
            dayWindow: 'Next 14 days',
            actionTitle: 'Lock pilot terms before raising burn',
            concreteSteps: 'Secure 50% annual prepayment from the first enterprise customer.',
            expectedOddsShiftPct: 18,
          },
        ],
      },
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(md);
    }
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const simHref = `/observatory?demo=${
    activeScenarioSlug === 'custom' ? 'saas-pivot' : activeScenarioSlug
  }`;

  return (
    <div
      className="min-h-[100dvh] w-full relative"
      style={{ backgroundColor: theme.ground, color: theme.ink }}
    >
      {/* FULL-SCREEN FIXED 3D SANCTUARY STAGE (100vw x 100dvh, z-index 1) */}
      <div
        className="fixed inset-0 w-full h-[100dvh] z-[1] overflow-hidden"
        style={{ backgroundColor: theme.ground }}
      >
        <DirectionCanvas
          direction={direction}
          nodes={nodeList}
          selectedNodeId={selectedNode?.id || null}
          goldenPathIds={goldenPathNodeIds}
          onSelectNode={handleFocusNode}
          scrollProgress={scrollProgress}
          cameraMode={cameraMode}
          className="w-full h-full"
        />
        <noscript>
          <img
            src={theme.plates[0].src}
            alt={theme.plates[0].alt}
            width={800}
            height={500}
            className="w-full h-full object-cover"
          />
        </noscript>
      </div>

      {/* ULTRA-CLEAN MINIMAL HEADER BAR (z-index 30) */}
      <header
        className="sticky top-0 z-30 w-full hv-motion-item"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 py-3 min-h-[60px] flex flex-wrap items-center justify-between gap-3">
          {/* Left: Wordmark + Plain-English Descriptor */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`${theme.displayFontClass} text-xl font-semibold tracking-tight`}
              style={{ color: theme.ink }}
            >
              HOROVEX
            </Link>
            <span
              className="hidden sm:inline-block text-sm font-medium"
              style={{ color: theme.mutedInk }}
            >
              AI Decision &amp; Future Simulator
            </span>
          </div>

          {/* Center (Desktop): 3-Step Journey Anchors */}
          <nav
            aria-label="Three-step decision flow"
            className="hidden lg:flex items-center gap-5 text-sm font-medium"
          >
            <a
              href="#step-decision"
              className="transition-opacity hover:opacity-80"
              style={{ color: theme.ink }}
            >
              1. Your Decision
            </a>
            <a
              href="#step-futures"
              className="transition-opacity hover:opacity-80"
              style={{ color: theme.mutedInk }}
            >
              2. Explore 5 Futures
            </a>
            <a
              href="#step-mentor"
              className="transition-opacity hover:opacity-80"
              style={{ color: theme.mutedInk }}
            >
              3. Recommended Path
            </a>
          </nav>

          {/* Right: Camera & Full Simulator Actions */}
          <div className="flex items-center gap-2 lg:pr-6">
            <button
              type="button"
              onClick={() => setCameraMode('overview')}
              className="hidden sm:inline-block px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
              style={{ backgroundColor: theme.surface, color: theme.ink }}
            >
              Reset Camera
            </button>
            <button
              type="button"
              onClick={() => setPureGardenView((prev) => !prev)}
              className="hidden sm:inline-block px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
              style={{
                backgroundColor: pureGardenView ? theme.ink : theme.surface,
                color: pureGardenView ? theme.ground : theme.ink,
              }}
            >
              {pureGardenView ? 'Show UI' : 'Hide UI'}
            </button>
            <Link
              href={simHref}
              role="button"
              data-testid="launch-observatory-btn"
              className="px-3.5 py-1.5 text-sm font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: theme.accent,
                color: theme.accentFg,
              }}
            >
              Open Full Simulator
            </Link>
          </div>
        </div>
      </header>

      {/* FLOATING CONTROL STRIP WHEN IN PURE 3D VIEW (HIDE UI ACTIVE) */}
      {pureGardenView && (
        <div className="fixed bottom-5 inset-x-0 z-20 pointer-events-none">
          <div className="max-w-[1320px] mx-auto px-6 md:px-10 flex justify-center">
            <div
              data-ui="true"
              className="p-3 flex flex-wrap items-center gap-3 pointer-events-auto"
              style={{ backgroundColor: theme.ground, color: theme.ink }}
            >
              <span className="text-sm font-semibold" style={{ color: theme.ink }}>
                {selectedNode ? `Focused: ${selectedNode.title}` : 'Alabaster Sanctuary 3D'}
              </span>
              {branchNodes.slice(0, 5).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleFocusNode(node.id)}
                  className="px-2.5 py-1 text-sm font-medium tabular-nums"
                  style={{
                    backgroundColor:
                      selectedNode?.id === node.id ? theme.accent : theme.surface,
                    color:
                      selectedNode?.id === node.id ? theme.accentFg : theme.ink,
                  }}
                >
                  {Math.round(node.conditionalProbability * 100)}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCameraMode('overview')}
                className="px-3 py-1 text-sm font-medium"
                style={{ backgroundColor: theme.surface, color: theme.ink }}
              >
                Reset Camera
              </button>
              <button
                type="button"
                onClick={() => setPureGardenView(false)}
                className="px-3 py-1 text-sm font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.accentFg }}
              >
                Show UI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-STEP LEFT-COLUMN JOURNEY (70%+ of Desktop Viewport Open to the 3D Sanctuary) */}
      <div
        className={`relative z-10 w-full pointer-events-none transition-opacity duration-300 ${
          pureGardenView
            ? 'opacity-0 invisible [&_*]:!pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {/* STEP 1 (FIRST SCREEN): ENTER YOUR DECISION */}
        <section
          id="step-decision"
          className="w-full pt-5 lg:pt-12 pb-40 md:pb-52 lg:pb-64 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div
                className="lg:col-span-5 lg:max-w-[500px] p-5 sm:p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-1"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div className="space-y-2.5">
                  <h1
                    className={`${theme.displayFontClass} tracking-tight leading-[1.08] hv-motion-item hv-delay-1`}
                    style={{
                      fontSize: 'clamp(28px, 4.3vw, 42px)',
                      color: theme.ink,
                    }}
                  >
                    See where your next decision leads.
                  </h1>
                  <p
                    className="text-base leading-relaxed hv-motion-item hv-delay-2"
                    style={{ color: theme.ink, maxWidth: '52ch' }}
                  >
                    Type any real-life crossroads below. HOROVEX simulates your 5
                    most likely futures in 3D, highlights the best path to take,
                    and lets you branch deeper into what happens next.
                  </p>
                </div>

                <form
                  onSubmit={handleSimulateDilemma}
                  className="p-3.5 space-y-2.5 hv-motion-item hv-delay-3"
                  style={{ backgroundColor: theme.surface }}
                >
                  <label
                    htmlFor="dilemma-input"
                    className="block text-base font-semibold"
                    style={{ color: theme.ink }}
                  >
                    1. Enter your decision crossroads
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="dilemma-input"
                      type="text"
                      name="prompt"
                      value={dilemmaInput}
                      onChange={(e) => setDilemmaInput(e.target.value)}
                      placeholder="e.g., Should I leave my job to build an AI product?"
                      className="flex-1 px-3 py-2 text-base focus:outline-none"
                      style={{
                        backgroundColor: theme.ground,
                        color: theme.ink,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSimulating}
                      data-testid="simulate-btn"
                      className="px-4 py-2 text-base font-semibold whitespace-nowrap transition-transform active:scale-95"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentFg,
                      }}
                    >
                      {isSimulating ? 'Simulating...' : 'Predict 5 Futures'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2 hv-motion-item hv-delay-4">
                  <p className="text-sm font-medium" style={{ color: theme.mutedInk }}>
                    Or test a live scenario:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadScenario(flagshipFounderSaaSPivot, 'saas-pivot')}
                      className="px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
                      style={{
                        backgroundColor:
                          activeScenarioSlug === 'saas-pivot' ? theme.accent : theme.surface,
                        color:
                          activeScenarioSlug === 'saas-pivot' ? theme.accentFg : theme.ink,
                      }}
                    >
                      Pivot SaaS to Enterprise
                    </button>
                    <button
                      type="button"
                      onClick={() => loadScenario(flagshipSeniorTechSoloAI, 'solo-ai')}
                      className="px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
                      style={{
                        backgroundColor:
                          activeScenarioSlug === 'solo-ai' ? theme.accent : theme.surface,
                        color:
                          activeScenarioSlug === 'solo-ai' ? theme.accentFg : theme.ink,
                      }}
                    >
                      Leave Big Tech for Solo AI
                    </button>
                    <button
                      type="button"
                      onClick={() => loadScenario(flagshipGlobalRelocation, 'relocation')}
                      className="px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
                      style={{
                        backgroundColor:
                          activeScenarioSlug === 'relocation' ? theme.accent : theme.surface,
                        color:
                          activeScenarioSlug === 'relocation' ? theme.accentFg : theme.ink,
                      }}
                    >
                      San Francisco vs. Dubai
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2 (SCROLL MID-PAGE): EXPLORE YOUR 5 FUTURES & BRANCH DEEPER */}
        <section
          id="step-futures"
          className="w-full py-16 md:py-24 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div
                className="lg:col-span-5 lg:max-w-[500px] p-5 sm:p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-3"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div className="space-y-2">
                  <h2
                    className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-4`}
                    style={{ fontSize: 'clamp(24px, 2.4vw, 32px)', color: theme.ink }}
                  >
                    Five futures ranked by likelihood.
                  </h2>
                  <p
                    className="text-base leading-relaxed hv-motion-item hv-delay-5"
                    style={{ color: theme.ink, maxWidth: '52ch' }}
                  >
                    Click any arch in the 3D sanctuary, or select an outcome
                    below, to fly the camera inside it and see what happens next.
                  </p>
                </div>

                {/* Clean Interactive List of Active Futures */}
                <div data-ui="true" className="space-y-1.5 hv-motion-item hv-delay-5">
                  {branchNodes.slice(0, 8).map((node) => {
                    const isRec =
                      goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                    const isSel = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleFocusNode(node.id)}
                        className="w-full p-2.5 text-left transition-transform active:scale-95 flex items-center justify-between gap-3"
                        style={{
                          backgroundColor: isSel
                            ? theme.ink
                            : isRec
                            ? theme.surfaceAlt
                            : theme.surface,
                          color: isSel ? theme.ground : theme.ink,
                        }}
                      >
                        <span className="text-sm font-medium truncate">
                          {node.depth > 1 ? `Depth ${node.depth} · ` : ''}
                          {node.title}
                        </span>
                        <span className="flex items-center gap-2 shrink-0 tabular-nums">
                          {isRec && (
                            <span
                              className="px-2 py-0.5 text-sm font-semibold"
                              style={{
                                backgroundColor: theme.accent,
                                color: theme.accentFg,
                              }}
                            >
                              Recommended
                            </span>
                          )}
                          <span className="text-sm font-semibold">
                            {Math.round(node.conditionalProbability * 100)}%
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Focused Future Summary & Branching Actions */}
                {selectedNode && (
                  <div
                    className="p-4 space-y-3 hv-motion-item hv-delay-6"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold" style={{ color: theme.ink }}>
                        {selectedNode.title} (
                        {Math.round(selectedNode.conditionalProbability * 100)}%
                        likelihood)
                      </p>
                      <p className="text-base leading-relaxed" style={{ color: theme.ink }}>
                        {selectedNode.narrativeSummary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleStepIntoFuture()}
                        disabled={isSimulating}
                        data-testid="recurse-deeper-btn"
                        className="px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
                        style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                      >
                        See what happens next (+5 deeper branches)
                      </button>
                      <button
                        type="button"
                        onClick={handleExpandFiveMore}
                        disabled={isSimulating}
                        data-testid="expand-wave-btn"
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      >
                        +5 more possibilities
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInterventionBox((prev) => !prev)}
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      >
                        What if I change my move...
                      </button>
                    </div>

                    {showInterventionBox && (
                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={interventionInput}
                          onChange={(e) => setInterventionInput(e.target.value)}
                          placeholder="Describe your custom move (e.g., require 50% upfront)..."
                          className="flex-1 px-3 py-2 text-sm focus:outline-none"
                          style={{ backgroundColor: theme.ground, color: theme.ink }}
                        />
                        <button
                          type="button"
                          onClick={() => handleStepIntoFuture(interventionInput)}
                          className="px-3.5 py-2 text-sm font-semibold whitespace-nowrap"
                          style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                        >
                          Simulate move
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 (SCROLL BOTTOM): YOUR RECOMMENDED PATH & "WHAT-IF" SLIDERS */}
        <section
          id="step-mentor"
          className="w-full py-16 md:py-24 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div
                className="lg:col-span-5 lg:max-w-[500px] p-5 sm:p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-6"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <h2
                  className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-7`}
                  style={{ fontSize: 'clamp(24px, 2.4vw, 32px)', color: theme.ink }}
                >
                  Your recommended path forward.
                </h2>

                {recommendedNode && (
                  <div
                    className="p-4 space-y-2.5 hv-motion-item hv-delay-7"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <p className="text-base font-semibold" style={{ color: theme.ink }}>
                      Best Path: {recommendedNode.title} (
                      {Math.round(recommendedNode.conditionalProbability * 100)}%)
                    </p>
                    <p className="text-base leading-relaxed" style={{ color: theme.ink }}>
                      Gives the highest expected upside with the lowest risk of
                      irreversible ruin across your simulated branches.
                    </p>
                    <p className="text-base leading-relaxed" style={{ color: theme.ink }}>
                      <strong className="font-semibold">Your 14-Day Action Plan:</strong>{' '}
                      Lock a 50% annual prepayment pilot with your first target
                      customer before increasing monthly burn.
                    </p>
                    <p className="text-base leading-relaxed" style={{ color: theme.ink }}>
                      <strong className="font-semibold">Warning Sign:</strong>{' '}
                      {recommendedNode.tripwires?.[0] ||
                        'Fewer than 2 signed pilot commitments within 45 days.'}
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleFocusNode(recommendedNode.id)}
                        className="px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
                        style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                      >
                        Focus recommended arch
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyBrief}
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      >
                        {copiedBrief ? 'Action plan copied' : 'Copy action plan'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive "What-If" Sliders */}
                <div
                  data-ui="true"
                  className="p-4 space-y-3 hv-motion-item hv-delay-8"
                  style={{ backgroundColor: theme.surface }}
                >
                  <p className="text-base font-semibold" style={{ color: theme.ink }}>
                    Test what-if sliders (reshapes 3D arches live)
                  </p>
                  {[
                    {
                      key: 'executionVelocity' as keyof SliderDeltas,
                      label: 'Execution & shipping speed',
                    },
                    {
                      key: 'capitalBuffer' as keyof SliderDeltas,
                      label: 'Cash runway buffer',
                    },
                    {
                      key: 'marketTailwind' as keyof SliderDeltas,
                      label: 'Market demand tailwinds',
                    },
                  ].map((lever) => {
                    const val = sensitivityLevers[lever.key];
                    const pct = Math.round(val * 100);
                    return (
                      <div key={lever.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <label
                            htmlFor={`lever-${lever.key}`}
                            className="font-medium"
                            style={{ color: theme.ink }}
                          >
                            {lever.label}
                          </label>
                          <span
                            className="font-semibold tabular-nums"
                            style={{ color: theme.ink }}
                          >
                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                          </span>
                        </div>
                        <input
                          id={`lever-${lever.key}`}
                          type="range"
                          min="-1"
                          max="1"
                          step="0.05"
                          value={val}
                          onChange={(e) =>
                            handleLeverChange(lever.key, parseFloat(e.target.value))
                          }
                          className="w-full h-2 cursor-pointer"
                          style={{ accentColor: theme.accent }}
                        />
                      </div>
                    );
                  })}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={handleResetLevers}
                      className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      Reset sliders
                    </button>
                    <Link
                      href={simHref}
                      role="button"
                      className="px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Open Full-Screen Simulator
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right-Edge Frame Closure Anchor (Keeps right 7 columns completely open to 3D while closing the page frame margin) */}
              <div className="hidden lg:flex lg:col-span-3 lg:col-start-10 flex-col items-end lg:pr-6 gap-2 pointer-events-auto hv-motion-item hv-delay-8">
                <button
                  type="button"
                  onClick={() => setCameraMode('overview')}
                  className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                  style={{ backgroundColor: theme.ground, color: theme.ink }}
                >
                  View all 5 arches
                </button>
                <Link
                  href={simHref}
                  role="button"
                  className="px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
                  style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                >
                  Open Full-Screen Simulator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
