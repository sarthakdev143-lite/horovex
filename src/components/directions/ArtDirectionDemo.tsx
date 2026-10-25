'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
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

export default function ArtDirectionDemo({
  initialDirection = 'landscape',
}: ArtDirectionDemoProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryDir = searchParams.get('direction') as ArtDirectionId | null;
  const [direction, setDirection] = useState<ArtDirectionId>(
    queryDir && DIRECTION_THEMES[queryDir] ? queryDir : initialDirection
  );

  useEffect(() => {
    if (queryDir && DIRECTION_THEMES[queryDir]) {
      setDirection(queryDir);
    }
  }, [queryDir]);

  const theme = DIRECTION_THEMES[direction];

  // Sync document body background and text color with active direction so browser inspector sees exact ground
  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.ground;
    document.body.style.backgroundColor = theme.ground;
    document.body.style.color = theme.ink;
  }, [theme]);

  const nodes = useMultiverseStore((state) => state.nodes);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const maxWaveNumber = useMultiverseStore((state) => state.maxWaveNumber);
  const activeDepth = useMultiverseStore((state) => state.activeDepth);
  const unexploredMass = useMultiverseStore((state) => state.unexploredMass);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);
  const sensitivityLevers = useMultiverseStore((state) => state.sensitivityLevers);

  const setNodes = useMultiverseStore((state) => state.setNodes);
  const addNodes = useMultiverseStore((state) => state.addNodes);
  const updateNode = useMultiverseStore((state) => state.updateNode);
  const selectNode = useMultiverseStore((state) => state.selectNode);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);
  const setUserContextTwin = useMultiverseStore((state) => state.setUserContextTwin);
  const setSensitivityLevers = useMultiverseStore((state) => state.setSensitivityLevers);
  const collapseWavefunction = useMultiverseStore((state) => state.collapseWavefunction);

  const [dilemmaInput, setDilemmaInput] = useState('');
  const [interventionInput, setInterventionInput] = useState('');
  const [showInterventionBox, setShowInterventionBox] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenarioSlug, setActiveScenarioSlug] = useState<string>('saas-pivot');
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Initialize default flagship scenario on first mount
  useEffect(() => {
    loadScenario(flagshipFounderSaaSPivot, 'saas-pivot');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScenario = (scenario: FlagshipScenario, slug: string) => {
    const map: Record<string, ProbabilityNode> = {};
    map[scenario.rootNode.id] = scenario.rootNode;
    scenario.initialWave1.forEach((n) => {
      map[n.id] = n;
    });
    setNodes(map);
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
  };

  const handleSwitchDirection = (nextDir: ArtDirectionId) => {
    setDirection(nextDir);
    try {
      router.replace(`/?direction=${nextDir}`, { scroll: false });
    } catch {
      // ignore router errors in isolated test contexts
    }
  };

  // Live Dilemma Simulation
  const handleSimulateDilemma = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = dilemmaInput.trim();
    if (!cleanPrompt) return;

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
              title: `${cleanPrompt.slice(0, 28)} — Path ${idx + 1}`,
            }))
          : generateDeterministicWave(cleanPrompt, 1, 1, rootId, 1.0);

      const map: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      waveNodes.forEach((n) => {
        map[n.id] = n;
      });
      setNodes(map);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
      });
      selectNode(waveNodes[0]?.id || rootId);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(map),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
      setActiveScenarioSlug('custom');
    } catch {
      const fallbackNodes = generateDeterministicWave(cleanPrompt, 1, 1, rootId, 1.0);
      const map: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      fallbackNodes.forEach((n) => {
        map[n.id] = n;
      });
      setNodes(map);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
      });
      selectNode(fallbackNodes[0]?.id || rootId);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(map),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
    } finally {
      setIsSimulating(false);
    }
  };

  // Live "+5 more futures" Horizontal Expansion
  const handleExpandFiveMore = async () => {
    const nextWave = (maxWaveNumber || 1) + 1;
    const activeRootId = rootNodeId || Object.values(nodes).find((n) => !n.parentId)?.id || 'root-1';
    const rootNode = nodes[activeRootId];
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
      addNodes(newNodes);
      useMultiverseStore.setState({ maxWaveNumber: nextWave });
      selectNode(newNodes[0]?.id || selectedNodeId);
    } catch {
      const fallback = generateDeterministicWave(
        rootNode?.title || 'Decision expansion',
        nextWave,
        1,
        activeRootId,
        1.0
      );
      addNodes(fallback);
      useMultiverseStore.setState({ maxWaveNumber: nextWave });
      selectNode(fallback[0]?.id || selectedNodeId);
    } finally {
      setIsSimulating(false);
    }
  };

  // Live "Show what happens next" Vertical Recursion
  const handleStepIntoFuture = async (customMove?: string) => {
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

      addNodes(childNodes);
      useMultiverseStore.setState({ activeDepth: nextDepth });
      selectNode(childNodes[0]?.id || target.id);

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
      addNodes(fallback);
      useMultiverseStore.setState({ activeDepth: nextDepth });
      selectNode(fallback[0]?.id || target.id);
    } finally {
      setIsSimulating(false);
      setShowInterventionBox(false);
      setInterventionInput('');
    }
  };

  // Real-time 60 FPS Sensitivity Slider handler
  const handleLeverChange = (key: keyof SliderDeltas, value: number) => {
    const nextLevers: SliderDeltas = {
      ...sensitivityLevers,
      [key]: value,
    };
    setSensitivityLevers(nextLevers);

    const nodeList = Object.values(nodes);
    const siblingNodes = nodeList.filter((n) => n.parentId !== null);
    const perturbed = perturbProbabilities(siblingNodes, nextLevers, unexploredMass);

    const updatedList = nodeList.map((n) => {
      const nextProb = perturbed.get(n.id);
      if (nextProb !== undefined) {
        const nextCum = Number(
          (n.parentId && nodes[n.parentId]
            ? nodes[n.parentId].cumulativeProbability * nextProb
            : nextProb
          ).toFixed(4)
        );
        updateNode(n.id, {
          conditionalProbability: nextProb,
          cumulativeProbability: nextCum,
        });
        return { ...n, conditionalProbability: nextProb, cumulativeProbability: nextCum };
      }
      return n;
    });

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
            dayWindow: 'First week',
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

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300"
      style={{ backgroundColor: theme.ground, color: theme.ink }}
    >
      {/* Top Bar: Wordmark, Live 3-Direction Switcher, and Observatory Action */}
      <header
        className="w-full hv-motion-item"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 py-3 min-h-[72px] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`${theme.displayFontClass} text-2xl tracking-tight`}
              style={{ color: theme.ink }}
            >
              HOROVEX
            </Link>
            <span
              className="hidden lg:inline text-base"
              style={{ color: theme.mutedInk }}
            >
              {theme.subtitle}
            </span>
          </div>

          <nav
            aria-label="Art direction demos"
            className="flex items-center gap-1 p-1"
            style={{ backgroundColor: theme.surface }}
          >
            {(['landscape', 'instrument', 'darkroom'] as ArtDirectionId[]).map((dirId) => {
              const item = DIRECTION_THEMES[dirId];
              const isActive = direction === dirId;
              return (
                <button
                  key={dirId}
                  type="button"
                  onClick={() => handleSwitchDirection(dirId)}
                  data-testid={`switch-direction-${dirId}`}
                  className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                  style={{
                    backgroundColor: isActive ? theme.accent : 'transparent',
                    color: isActive ? theme.accentFg : theme.ink,
                  }}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-5">
            <a
              href="#branch-table"
              className="text-base hover:underline"
              style={{ color: theme.ink }}
            >
              All futures
            </a>
            <a
              href="#flagship-demos"
              className="text-base hover:underline"
              style={{ color: theme.ink }}
            >
              Scenarios
            </a>
            <Link
              href={`/observatory?demo=${activeScenarioSlug === 'custom' ? 'saas-pivot' : activeScenarioSlug}&direction=${direction}`}
              data-testid="launch-observatory-btn"
              className="px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: theme.accent,
                color: theme.accentFg,
              }}
            >
              Open full observatory
            </Link>
          </div>
        </div>
      </header>

      {/* Section 1: Hero with Live Dilemma Input and Full-Strength 3D WebGL Scene */}
      <section
        className="w-full pt-6 pb-16 md:pt-10 md:pb-24"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Headline, Plain Supporting Copy, Live Dilemma Form, Scenario Switcher */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <h1
                className={`${theme.displayFontClass} tracking-tight leading-[1.04] hv-motion-item hv-delay-1`}
                style={{
                  fontSize: 'clamp(32px, 3.6vw, 52px)',
                  color: theme.ink,
                }}
              >
                {theme.headline}
              </h1>

              <p
                className="text-base md:text-lg leading-relaxed hv-motion-item hv-delay-2"
                style={{ color: theme.ink, maxWidth: '54ch' }}
              >
                {theme.lead}
              </p>
            </div>

            {/* Live Dilemma Form */}
            <form
              onSubmit={handleSimulateDilemma}
              className="p-4 space-y-3 hv-motion-item hv-delay-3"
              style={{ backgroundColor: theme.surface }}
            >
              <label
                htmlFor="dilemma-input"
                className="block text-base font-medium"
                style={{ color: theme.ink }}
              >
                Type a dilemma to branch in real time
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="dilemma-input"
                  type="text"
                  name="prompt"
                  value={dilemmaInput}
                  onChange={(e) => setDilemmaInput(e.target.value)}
                  placeholder="e.g. Pivot to enterprise contracts or raise seed?"
                  className="flex-1 px-3.5 py-3 text-base focus:outline-none"
                  style={{
                    backgroundColor: theme.ground,
                    color: theme.ink,
                    border: `1px solid ${theme.mutedInk}`,
                  }}
                />
                <button
                  type="submit"
                  disabled={isSimulating}
                  data-testid="simulate-dilemma-btn"
                  className="px-5 py-3 text-base font-semibold whitespace-nowrap transition-transform active:scale-95"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.accentFg,
                  }}
                >
                  {isSimulating ? 'Mapping...' : theme.ctaLabel}
                </button>
              </div>
            </form>

            {/* Curated Dilemma Presets */}
            <div
              className="p-4 space-y-2.5 hv-motion-item hv-delay-4"
              style={{ backgroundColor: theme.surface }}
            >
              <p className="text-base font-medium" style={{ color: theme.ink }}>
                Or load a studied crossroads:
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipFounderSaaSPivot, 'saas-pivot')}
                  className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                  style={{
                    backgroundColor:
                      activeScenarioSlug === 'saas-pivot' ? theme.accent : theme.ground,
                    color:
                      activeScenarioSlug === 'saas-pivot' ? theme.accentFg : theme.ink,
                  }}
                >
                  SaaS enterprise pivot
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipSeniorTechSoloAI, 'solo-ai')}
                  className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                  style={{
                    backgroundColor:
                      activeScenarioSlug === 'solo-ai' ? theme.accent : theme.ground,
                    color:
                      activeScenarioSlug === 'solo-ai' ? theme.accentFg : theme.ink,
                  }}
                >
                  Leave big tech for solo AI
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipGlobalRelocation, 'relocation')}
                  className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                  style={{
                    backgroundColor:
                      activeScenarioSlug === 'relocation' ? theme.accent : theme.ground,
                    color:
                      activeScenarioSlug === 'relocation' ? theme.accentFg : theme.ink,
                  }}
                >
                  San Francisco vs. Dubai base
                </button>
              </div>
            </div>

            {/* Recommended Path Callout */}
            {recommendedNode && (
              <div
                className="p-4 space-y-1.5 hv-motion-item hv-delay-5"
                style={{ backgroundColor: theme.surface }}
              >
                <p className="text-base font-semibold" style={{ color: theme.ink }}>
                  Recommended path: {recommendedNode.title}
                </p>
                <p className="text-base tabular-nums" style={{ color: theme.mutedInk }}>
                  {Math.round(recommendedNode.conditionalProbability * 100)}% likelihood over{' '}
                  {recommendedNode.timeHorizon} —{' '}
                  {recommendedNode.reversibilityType === 'type_2_reversible'
                    ? 'two-way reversible door'
                    : 'one-way commitment'}
                  .
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Full-Strength 3D WebGL Viewport + Live DOM Inspector */}
          <div className="lg:col-span-7 space-y-4 hv-motion-item hv-delay-2">
            <div
              data-ui="true"
              className="w-full overflow-hidden"
              style={{ backgroundColor: theme.surface }}
            >
              {/* Top Bar of the 3D Stage */}
              <div
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-3"
                style={{ backgroundColor: theme.surfaceAlt }}
              >
                <span className="text-sm font-semibold" style={{ color: theme.ink }}>
                  {rootNode?.title || 'Founder Pivot Dilemma'}
                </span>
                <span className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                  {branchNodes.length} active futures · Depth {activeDepth || 1} · Wave{' '}
                  {maxWaveNumber || 1}
                </span>
              </div>

              {/* 100% Full-Strength 3D WebGL Scene */}
              <div className="w-full h-[380px] sm:h-[420px] relative">
                <DirectionCanvas
                  direction={direction}
                  nodes={nodeList}
                  selectedNodeId={selectedNode?.id || null}
                  goldenPathIds={goldenPathNodeIds}
                  onSelectNode={(id) => selectNode(id)}
                  className="w-full h-full"
                />
                <noscript>
                  <img
                    src={theme.plates[0].src}
                    alt={theme.plates[0].alt}
                    width={640}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </noscript>
              </div>

              {/* Real HTML DOM Branch Selector Pills (Focused node + direct children, no 3D pill cloud) */}
              <div className="p-4 space-y-3" style={{ backgroundColor: theme.surface }}>
                <div className="flex flex-wrap gap-2">
                  {branchNodes.slice(0, 8).map((node) => {
                    const isRec =
                      goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                    const isSel = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectNode(node.id)}
                        className="px-3 py-1.5 text-sm font-medium tabular-nums transition-transform active:scale-95"
                        style={{
                          backgroundColor: isRec
                            ? theme.accent
                            : isSel
                            ? theme.ink
                            : theme.ground,
                          color: isRec
                            ? theme.accentFg
                            : isSel
                            ? theme.ground
                            : theme.ink,
                        }}
                      >
                        {Math.round(node.conditionalProbability * 100)}% ·{' '}
                        {node.title.length > 26
                          ? `${node.title.slice(0, 24)}…`
                          : node.title}
                      </button>
                    );
                  })}
                </div>

                {/* Focused Branch Details & Live Engine Controls */}
                {selectedNode && (
                  <div
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    style={{ backgroundColor: theme.ground }}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold" style={{ color: theme.ink }}>
                        {selectedNode.title}
                      </p>
                      <p className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                        Likelihood: {(selectedNode.conditionalProbability * 100).toFixed(1)}% ·
                        Cumulative path: {(selectedNode.cumulativeProbability * 100).toFixed(1)}% ·
                        Horizon: {selectedNode.timeHorizon}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExpandFiveMore}
                        disabled={isSimulating}
                        data-testid="expand-five-more-btn"
                        className="px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
                        style={{
                          backgroundColor: theme.accent,
                          color: theme.accentFg,
                        }}
                      >
                        +5 more futures
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStepIntoFuture()}
                        disabled={isSimulating}
                        data-testid="step-into-future-btn"
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{
                          backgroundColor: theme.surfaceAlt,
                          color: theme.ink,
                        }}
                      >
                        Show what happens next
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInterventionBox((prev) => !prev)}
                        className="px-3 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{
                          backgroundColor: theme.surface,
                          color: theme.ink,
                        }}
                      >
                        What if I…
                      </button>
                    </div>
                  </div>
                )}

                {showInterventionBox && (
                  <div
                    className="p-3 flex flex-col sm:flex-row gap-2"
                    style={{ backgroundColor: theme.ground }}
                  >
                    <input
                      type="text"
                      value={interventionInput}
                      onChange={(e) => setInterventionInput(e.target.value)}
                      placeholder="Describe your move (e.g. require 50% upfront payment)..."
                      className="flex-1 px-3 py-2 text-sm"
                      style={{
                        backgroundColor: theme.surface,
                        color: theme.ink,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleStepIntoFuture(interventionInput)}
                      className="px-4 py-2 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentFg,
                      }}
                    >
                      Branch with this move
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Branch Probability Table & Live Sensitivity Levers */}
      <section
        id="branch-table"
        className="w-full py-16 md:py-24"
        style={{ backgroundColor: theme.surface, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Semantic Table of Futures */}
          <div className="lg:col-span-7 space-y-5 hv-motion-item hv-delay-3">
            <h2
              className={`${theme.displayFontClass} tracking-tight leading-tight`}
              style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: theme.ink }}
            >
              How the paths divide
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: theme.ink, maxWidth: '60ch' }}
            >
              The first wave maps five baseline outcomes covering 80% of likelihood, while holding
              20% in reserve for contrarian and tail-risk waves. Click any row to focus the 3D
              model.
            </p>

            <div
              data-ui="true"
              className="overflow-x-auto"
              style={{ backgroundColor: theme.ground }}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: theme.surfaceAlt }}>
                    <th className="py-3 px-4 text-sm font-semibold" style={{ color: theme.ink }}>
                      Future branch
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold" style={{ color: theme.ink }}>
                      Horizon
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold" style={{ color: theme.ink }}>
                      Door type
                    </th>
                    <th
                      className="py-3 px-4 text-sm font-semibold text-right tabular-nums"
                      style={{ color: theme.ink }}
                    >
                      Likelihood
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchNodes.map((node) => {
                    const isRec =
                      goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                    const isSel = selectedNode?.id === node.id;
                    return (
                      <tr
                        key={node.id}
                        onClick={() => selectNode(node.id)}
                        className="cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSel ? theme.surfaceAlt : theme.ground,
                        }}
                      >
                        <td className="py-3.5 px-4 text-base font-medium" style={{ color: theme.ink }}>
                          {node.title}
                          {isRec ? ' (Recommended)' : ''}
                        </td>
                        <td
                          className="py-3.5 px-4 text-sm tabular-nums"
                          style={{ color: theme.mutedInk }}
                        >
                          {node.timeHorizon}
                        </td>
                        <td className="py-3.5 px-4 text-sm" style={{ color: theme.mutedInk }}>
                          {node.reversibilityType === 'type_2_reversible'
                            ? 'Two-way reversible'
                            : 'One-way commitment'}
                        </td>
                        <td
                          className="py-3.5 px-4 text-base font-semibold text-right tabular-nums"
                          style={{ color: isRec ? theme.accent : theme.ink }}
                        >
                          {(node.conditionalProbability * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Live 60 FPS Sensitivity Levers */}
          <div
            className="lg:col-span-5 p-6 space-y-5 hv-motion-item hv-delay-4"
            style={{ backgroundColor: theme.ground }}
          >
            <h2
              className={`${theme.displayFontClass} tracking-tight leading-tight`}
              style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: theme.ink }}
            >
              Shift the odds live
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: theme.ink, maxWidth: '54ch' }}
            >
              Drag any lever to test how faster shipping, extra runway, or market demand shifts
              the probabilities across all branches in real time.
            </p>

            <div data-ui="true" className="space-y-4">
              {[
                {
                  key: 'executionVelocity' as keyof SliderDeltas,
                  label: 'Shipping and sales speed',
                },
                {
                  key: 'capitalBuffer' as keyof SliderDeltas,
                  label: 'Liquid cash runway buffer',
                },
                {
                  key: 'marketTailwind' as keyof SliderDeltas,
                  label: 'Customer demand tailwind',
                },
                {
                  key: 'skillPreparation' as keyof SliderDeltas,
                  label: 'Team technical readiness',
                },
              ].map((lever) => {
                const val = sensitivityLevers[lever.key];
                const pct = Math.round(val * 100);
                return (
                  <div key={lever.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-base">
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

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleLeverChange('executionVelocity', 0);
                    handleLeverChange('capitalBuffer', 0);
                    handleLeverChange('marketTailwind', 0);
                    handleLeverChange('skillPreparation', 0);
                  }}
                  className="px-4 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: theme.surface, color: theme.ink }}
                >
                  Reset levers to baseline
                </button>

                {selectedNode && selectedNode.parentId && (
                  <button
                    type="button"
                    onClick={() => collapseWavefunction(selectedNode.id)}
                    className="px-4 py-2.5 text-sm font-semibold"
                    style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                  >
                    Mark what actually happened
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Visual Atlas of the Active Direction (4 Raster Plates in 2x2 Grid) */}
      <section
        id="architecture"
        className="w-full py-16 md:py-24"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-6">
              <h2
                className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-5`}
                style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: theme.ink }}
              >
                Four views of the model
              </h2>
            </div>
            <div className="lg:col-span-6">
              <p
                className="text-base md:text-lg leading-relaxed hv-motion-item hv-delay-5"
                style={{ color: theme.ink, maxWidth: '60ch' }}
              >
                {theme.ideaSentence}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {theme.plates.map((plate, idx) => (
              <figure
                key={plate.src}
                className={`space-y-4 hv-motion-item hv-delay-${(idx % 4) + 5}`}
              >
                <img
                  src={plate.src}
                  alt={plate.alt}
                  width={640}
                  height={400}
                  className="w-full h-56 sm:h-64 object-cover block"
                />
                <figcaption className="space-y-1.5">
                  <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                    {plate.title}
                  </p>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: theme.ink, maxWidth: '58ch' }}
                  >
                    {plate.caption}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Flagship Showcases & Fourteen-Day Action Plan */}
      <section
        id="flagship-demos"
        className="w-full py-16 md:py-24"
        style={{ backgroundColor: theme.surface, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: 3 Curated Flagship Crossroads */}
          <div className="lg:col-span-6 space-y-6 hv-motion-item hv-delay-6">
            <h2
              className={`${theme.displayFontClass} tracking-tight leading-tight`}
              style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: theme.ink }}
            >
              Three real decisions
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: theme.ink, maxWidth: '58ch' }}
            >
              Load any of the three complete decision trees into the live 3D stage above, or open
              them inside the full-screen observatory.
            </p>

            <div className="space-y-6">
              {[
                {
                  id: 'saas-pivot',
                  category: 'Founder Crossroads',
                  scenario: flagshipFounderSaaSPivot,
                  summary:
                    'Bootstrap to enterprise cashflow with 14 months runway vs. raising a $1.2M seed round at 20% dilution. Recommended path: Bootstrap Enterprise Pivot (32% likelihood).',
                },
                {
                  id: 'solo-ai',
                  category: 'Executive Career',
                  scenario: flagshipSeniorTechSoloAI,
                  summary:
                    'Staff engineer with $220k savings weighing an immediate leap into solo AI products against slow night-and-weekend incubation. Recommended path: Full Leap 3 Micro-AI Launches (30% likelihood).',
                },
                {
                  id: 'relocation',
                  category: 'Sovereign Lifestyle',
                  scenario: flagshipGlobalRelocation,
                  summary:
                    'Remote founder at $80k monthly profit comparing San Francisco AI network density, Dubai 0% tax residency, and Singapore HQ. Recommended path: SF AI Base + Holding Structure (35% likelihood).',
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="space-y-2.5 hv-motion-item hv-delay-7"
                >
                  <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                    {item.category} — {item.scenario.title}
                  </p>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: theme.ink, maxWidth: '58ch' }}
                  >
                    {item.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        loadScenario(item.scenario, item.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-2 text-sm font-semibold"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Load in 3D stage
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/observatory?demo=${item.id}&direction=${direction}`)
                      }
                      className="px-3.5 py-2 text-sm font-medium"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      Open in observatory
                    </button>
                    <a
                      href={`/observatory?demo=${item.id}&direction=${direction}`}
                      className="sr-only"
                    >
                      Explore {item.category} in observatory
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Fourteen-Day Action Plan & Observable Tripwires */}
          <div
            className="lg:col-span-6 p-6 space-y-6 hv-motion-item hv-delay-8"
            style={{ backgroundColor: theme.ground }}
          >
            <h2
              className={`${theme.displayFontClass} tracking-tight leading-tight`}
              style={{ fontSize: 'clamp(24px, 2.4vw, 34px)', color: theme.ink }}
            >
              Fourteen-day plan
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: theme.ink, maxWidth: '58ch' }}
            >
              Once the Bellman solver isolates the recommended path, it pairs the choice with concrete
              first-fortnight actions and checkpoints that tell you early if reality is drifting.
            </p>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                  First three days — Lock term sheet and pilot bounds
                </p>
                <p className="text-base leading-relaxed" style={{ color: theme.ink, maxWidth: '58ch' }}>
                  Set a hard walk-away ceiling on equity dilution and deliver a scoped annual prepay
                  pilot agreement to your lead enterprise customer (+18% odds shift).
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                  First week — Ship compliance bridge and SLA
                </p>
                <p className="text-base leading-relaxed" style={{ color: theme.ink, maxWidth: '58ch' }}>
                  Complete the security architecture review and require 50% upfront payment upon
                  pilot kickoff so working capital never dips below 12 months (+14% odds shift).
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                  Second week — Verify the first observable checkpoint
                </p>
                <p className="text-base leading-relaxed" style={{ color: theme.ink, maxWidth: '58ch' }}>
                  Checkpoint: {recommendedNode?.tripwires?.[0] || 'Signed annual pilot within 45 days'}
                  . If missed, pause outbound hiring and revert to lean self-serve cashflow.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleCopyBrief}
                className="px-5 py-3 text-base font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: theme.accent, color: theme.accentFg }}
              >
                {copiedBrief ? 'Decision brief copied' : 'Copy markdown decision brief'}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/observatory?demo=${
                      activeScenarioSlug === 'custom' ? 'saas-pivot' : activeScenarioSlug
                    }&direction=${direction}`
                  )
                }
                className="px-5 py-3 text-base font-medium"
                style={{ backgroundColor: theme.surface, color: theme.ink }}
              >
                Open full workspace
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Full-Width Designed Close & Direction Switcher */}
      <footer
        className="w-full py-12"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className={`${theme.displayFontClass} text-2xl`} style={{ color: theme.ink }}>
              HOROVEX
            </p>
            <p className="text-sm" style={{ color: theme.mutedInk, maxWidth: '58ch' }}>
              HOROVEX Precision Chronometric Decision Engine · Active art direction: {theme.code} —{' '}
              {theme.name}. Diagram plates generated from the Bayesian and Bellman engine (CC0 / Public
              Domain).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleSwitchDirection('landscape')}
              className="px-3.5 py-2 text-sm font-medium"
              style={{
                backgroundColor:
                  direction === 'landscape' ? theme.accent : theme.surface,
                color: direction === 'landscape' ? theme.accentFg : theme.ink,
              }}
            >
              A. Probability Landscape
            </button>
            <button
              type="button"
              onClick={() => handleSwitchDirection('instrument')}
              className="px-3.5 py-2 text-sm font-medium"
              style={{
                backgroundColor:
                  direction === 'instrument' ? theme.accent : theme.surface,
                color: direction === 'instrument' ? theme.accentFg : theme.ink,
              }}
            >
              B. The Instrument
            </button>
            <button
              type="button"
              onClick={() => handleSwitchDirection('darkroom')}
              className="px-3.5 py-2 text-sm font-medium"
              style={{
                backgroundColor:
                  direction === 'darkroom' ? theme.accent : theme.surface,
                color: direction === 'darkroom' ? theme.accentFg : theme.ink,
              }}
            >
              C. The Dark Room
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
