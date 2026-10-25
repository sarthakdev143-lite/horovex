'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { computeWaveMass } from '@/lib/math/bayesian';
import { perturbProbabilities, SliderDeltas } from '@/lib/math/sensitivity';
import { generateDeterministicWave } from '@/lib/ai/adapter';
import {
  flagshipFounderSaaSPivot,
  flagshipSeniorTechSoloAI,
  flagshipGlobalRelocation,
} from '@/tests/fixtures/mock-scenarios';
import { DIRECTION_THEMES } from '@/components/directions/ArtDirectionDemo';
import type { ArtDirectionId } from '@/components/canvas/DirectionCanvas';

const DirectionCanvas = dynamic(
  () => import('@/components/canvas/DirectionCanvas'),
  { ssr: false }
);

const ZERO_LEVERS: SliderDeltas = {
  executionVelocity: 0,
  capitalBuffer: 0,
  marketTailwind: 0,
  skillPreparation: 0,
};

function ObservatoryInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const demoParam = searchParams.get('demo');
  const promptParam = searchParams.get('prompt');
  const dirParam = searchParams.get('direction') as ArtDirectionId | null;

  const [direction, setDirection] = useState<ArtDirectionId>(
    dirParam && DIRECTION_THEMES[dirParam] ? dirParam : 'sanctuary'
  );

  useEffect(() => {
    if (dirParam && DIRECTION_THEMES[dirParam]) {
      setDirection(dirParam);
    }
  }, [dirParam]);

  const theme = DIRECTION_THEMES[direction] || DIRECTION_THEMES.sanctuary;

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.ground;
    document.body.style.backgroundColor = theme.ground;
    document.body.style.color = theme.ink;
  }, [theme]);

  const nodes = useMultiverseStore((state) => state.nodes);
  const selectedNodeId = useMultiverseStore((state) => state.selectedNodeId);
  const rootNodeId = useMultiverseStore((state) => state.rootNodeId);
  const goldenPathNodeIds = useMultiverseStore((state) => state.goldenPathNodeIds);
  const maxWaveNumber = useMultiverseStore((state) => state.maxWaveNumber);
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
  const collapseWavefunction = useMultiverseStore((state) => state.collapseWavefunction);

  const baselineProbsRef = useRef<Record<string, number>>({});

  const [activeViewMode, setActiveViewMode] = useState<'3d' | '2d'>('3d');
  const [cameraMode, setCameraMode] = useState<'scroll' | 'focus' | 'overview'>('overview');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [interventionMove, setInterventionMove] = useState('');
  const [situationInput, setSituationInput] = useState('');
  const [isLoadingWave, setIsLoadingWave] = useState(false);

  const recordBaselineProbs = (nodeList: ProbabilityNode[], resetAll = false) => {
    if (resetAll) {
      baselineProbsRef.current = {};
    }
    nodeList.forEach((n) => {
      baselineProbsRef.current[n.id] = n.conditionalProbability;
    });
  };

  const handleFocusPortal = (id: string) => {
    selectNode(id);
    setCameraMode('focus');
  };

  useEffect(() => {
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

    recordBaselineProbs(Object.values(demoNodes), true);
    setNodes(demoNodes);
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
    setCameraMode('overview');
  }, [demoParam, setNodes, selectNode, setUserContextTwin, setGoldenPath, setSensitivityLevers]);

  useEffect(() => {
    if (promptParam && promptParam.trim().length > 0) {
      generateInitialWave(promptParam.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptParam]);

  const generateInitialWave = async (situation: string) => {
    if (isLoadingWave) return;
    setIsLoadingWave(true);
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
      title: situation.length > 55 ? `${situation.slice(0, 52)}...` : situation,
      narrativeSummary: situation,
      timeHorizon: 'Present',
      conditionalProbability: 1.0,
      cumulativeProbability: 1.0,
      rawLlmConfidence: 1.0,
      unexploredChildMass: 0.2,
      causalDrivers: ['Present decision crossroads'],
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
      const waveRes = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simId,
          parentId: rootId,
          depth: 1,
          waveNumber: 1,
        }),
      });
      const waveData = await waveRes.json();
      const waveNodes: ProbabilityNode[] =
        waveData.nodes && waveData.nodes.length > 0
          ? waveData.nodes
          : generateDeterministicWave(situation, 1, 1, rootId, 1.0);

      const nodeMap: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      waveNodes.forEach((n) => {
        nodeMap[n.id] = n;
      });

      recordBaselineProbs(Object.values(nodeMap), true);
      setNodes(nodeMap);
      setSensitivityLevers(ZERO_LEVERS);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
        exploredMass: 0.8,
        unexploredMass: 0.2,
      });
      selectNode(waveNodes[0]?.id || rootId);
      setCameraMode('focus');

      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(nodeMap),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
    } catch {
      const fallback = generateDeterministicWave(situation, 1, 1, rootId, 1.0);
      const nodeMap: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      fallback.forEach((n) => {
        nodeMap[n.id] = n;
      });
      recordBaselineProbs(Object.values(nodeMap), true);
      setNodes(nodeMap);
      setSensitivityLevers(ZERO_LEVERS);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
        exploredMass: 0.8,
        unexploredMass: 0.2,
      });
      selectNode(fallback[0]?.id || rootId);
      setCameraMode('focus');
    } finally {
      setIsLoadingWave(false);
    }
  };

  const handleHorizontalExpand = async () => {
    if (isLoadingWave) return;
    const currentStore = useMultiverseStore.getState();
    const nextWave = (currentStore.maxWaveNumber || 1) + 1;
    const activeRoot =
      currentStore.rootNodeId ||
      Object.values(currentStore.nodes).find((n) => !n.parentId)?.id ||
      'root-1';
    const parent = currentStore.nodes[activeRoot];
    const { remainingUnexplored: newRemainingMass } = computeWaveMass(nextWave);

    try {
      setIsLoadingWave(true);
      const waveRes = await fetch('/api/simulations/generate-wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: parent?.simulationId || 'sim-active',
          parentId: activeRoot,
          depth: 1,
          waveNumber: nextWave,
        }),
      });
      const waveData = await waveRes.json();
      const added: ProbabilityNode[] =
        waveData.nodes && waveData.nodes.length > 0
          ? waveData.nodes
          : generateDeterministicWave(parent?.title || 'Decision', nextWave, 1, activeRoot, 1.0);
      recordBaselineProbs(added, false);
      addNodes(added);
      useMultiverseStore.setState({
        maxWaveNumber: nextWave,
        unexploredMass: newRemainingMass,
        exploredMass: Number((1 - newRemainingMass).toFixed(4)),
      });
      if (added[0]) {
        selectNode(added[0].id);
        setCameraMode('focus');
      }

      const allNodes = Object.values(useMultiverseStore.getState().nodes);
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        allNodes,
        activeRoot,
        userContextTwin
      );
      setGoldenPath(solved);
    } catch {
      const fallback = generateDeterministicWave(
        parent?.title || 'Decision',
        nextWave,
        1,
        activeRoot,
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
      setIsLoadingWave(false);
    }
  };

  const handleVerticalRecursion = async (interventionPrompt?: string) => {
    if (isLoadingWave) return;
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
      const childNodes: ProbabilityNode[] =
        waveData.nodes && waveData.nodes.length > 0
          ? waveData.nodes
          : generateDeterministicWave(
              interventionPrompt || targetNode.title,
              1,
              nextDepth,
              targetNode.id,
              targetNode.cumulativeProbability,
              interventionPrompt
            );

      recordBaselineProbs(childNodes, false);
      addNodes(childNodes);
      useMultiverseStore.setState({ activeDepth: nextDepth });
      selectNode(childNodes[0]?.id || targetNode.id);
      setCameraMode('focus');

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
    } finally {
      setIsLoadingWave(false);
      setIsActionModalOpen(false);
      setInterventionMove('');
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

  return (
    <main
      className="min-h-[100dvh] w-full tabular-nums"
      style={{ backgroundColor: theme.ground, color: theme.ink }}
    >
      {/* Top App Bar */}
      <header
        data-testid="top-chronometer-bar"
        className="w-full px-6 py-3 flex flex-wrap items-center justify-between gap-4"
        style={{ backgroundColor: theme.surface, color: theme.ink }}
      >
        <div className="flex items-center gap-4">
          <Link
            href={`/?direction=${direction}`}
            className="text-lg font-semibold"
            style={{ color: theme.ink }}
          >
            HOROVEX
          </Link>
          <h1 className="text-xl font-semibold" style={{ color: theme.ink }}>
            {rootNode?.title || 'Alabaster Decision Sanctuary'}
          </h1>
          <span className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
            Depth {activeDepth || 1} · Wave {maxWaveNumber || 1}
          </span>
        </div>

        {/* View Switcher (Sanctuary 3D default + Landscape, Instrument, Dark Room, 2D Table) */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'sanctuary', label: 'Sanctuary 3D' },
              { id: 'landscape', label: 'Landscape 3D' },
              { id: 'instrument', label: 'Instrument 3D' },
              { id: 'darkroom', label: 'Dark Room 3D' },
            ] as { id: ArtDirectionId; label: string }[]
          ).map((dir) => {
            const active = activeViewMode === '3d' && direction === dir.id;
            return (
              <button
                key={dir.id}
                type="button"
                onClick={() => {
                  setActiveViewMode('3d');
                  setDirection(dir.id);
                  try {
                    router.replace(
                      `/observatory?demo=${demoParam || 'saas-pivot'}&direction=${dir.id}`,
                      { scroll: false }
                    );
                  } catch {
                    // ignore router errors in test environments
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: active ? theme.accent : theme.ground,
                  color: active ? theme.accentFg : theme.ink,
                }}
              >
                {dir.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
            className="px-3 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: activeViewMode === '2d' ? theme.accent : theme.ground,
              color: activeViewMode === '2d' ? theme.accentFg : theme.ink,
            }}
          >
            {activeViewMode === '2d' ? '3D View' : '2D Table View'}
          </button>
        </div>
      </header>

      {/* Main Spatial Sanctuary Workspace */}
      <div className="w-full px-6 py-4 space-y-5">
        {/* DOMINANT FULL-WIDTH 3D ALABASTER SANCTUARY HERO STAGE */}
        {activeViewMode === '3d' && (
          <div className="w-full" style={{ backgroundColor: theme.surface }}>
            {/* Stage Camera Header Bar */}
            <div
              className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: theme.ink }}>
                  Fly camera to portal:
                </span>
                {branchNodes.slice(0, 6).map((node) => {
                  const isRec =
                    goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                  const isSel = selectedNode?.id === node.id && cameraMode === 'focus';
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleFocusPortal(node.id)}
                      className="px-2.5 py-1 text-sm font-medium tabular-nums"
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
                      {node.title.length > 22 ? `${node.title.slice(0, 20)}…` : node.title}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCameraMode('overview')}
                  className="px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: theme.ground, color: theme.ink }}
                >
                  Reset camera / Full garden
                </button>
              </div>
            </div>

            {/* Full-Width 3D WebGL Sanctuary Stage */}
            <div className="w-full h-[460px] sm:h-[520px] relative">
              <DirectionCanvas
                direction={direction}
                nodes={nodeList}
                selectedNodeId={selectedNode?.id || null}
                goldenPathIds={goldenPathNodeIds}
                onSelectNode={handleFocusPortal}
                cameraMode={cameraMode}
                className="w-full h-full"
              />
            </div>

            {/* Stage Action & Dilemma Bar */}
            <div
              className="p-3.5 flex flex-wrap items-center justify-between gap-3"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleHorizontalExpand}
                  disabled={isLoadingWave}
                  className="px-3.5 py-2 text-sm font-semibold"
                  style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                >
                  +5 more futures
                </button>
                <button
                  type="button"
                  onClick={() => handleVerticalRecursion()}
                  disabled={isLoadingWave || !selectedNodeId}
                  className="px-3.5 py-2 text-sm font-medium"
                  style={{ backgroundColor: theme.ground, color: theme.ink }}
                >
                  Show what happens next
                </button>
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen((prev) => !prev)}
                  className="px-3.5 py-2 text-sm font-medium"
                  style={{ backgroundColor: theme.ground, color: theme.ink }}
                >
                  What if I…
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (situationInput.trim()) {
                    generateInitialWave(situationInput.trim());
                  }
                }}
                className="flex flex-1 max-w-md items-center gap-2"
              >
                <input
                  type="text"
                  value={situationInput}
                  onChange={(e) => setSituationInput(e.target.value)}
                  placeholder="Simulate another high-stakes dilemma..."
                  className="flex-1 px-3 py-1.5 text-sm focus:outline-none"
                  style={{ backgroundColor: theme.ground, color: theme.ink }}
                />
                <button
                  type="submit"
                  disabled={isLoadingWave}
                  className="px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap"
                  style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                >
                  {isLoadingWave ? 'Simulating…' : 'Simulate'}
                </button>
              </form>

              <span className="text-sm tabular-nums" style={{ color: theme.ink }}>
                Explored: {Math.round((1 - unexploredMass) * 100)}% · Reserve:{' '}
                {Math.round(unexploredMass * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Action Injection Inline Panel */}
        {isActionModalOpen && (
          <div className="p-4 space-y-3" style={{ backgroundColor: theme.surface }}>
            <p className="text-base font-semibold" style={{ color: theme.ink }}>
              Condition next wave on a specific move
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={interventionMove}
                onChange={(e) => setInterventionMove(e.target.value)}
                placeholder="Describe your move (e.g. require 50% upfront payment)..."
                className="flex-1 px-3.5 py-2 text-sm"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              />
              <button
                type="button"
                onClick={() => handleVerticalRecursion(interventionMove)}
                className="px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.accentFg }}
              >
                Branch with this move
              </button>
            </div>
          </div>
        )}

        {/* Synchronized Strategic Mentor, Sensitivity Levers, and Branch Probability Workbench */}
        <div className="w-full p-5 space-y-5" style={{ backgroundColor: theme.surface }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (7 cols): Branch Probability Table & Recommended Path */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold" style={{ color: theme.ink }}>
                  Branch probability table
                </h2>
                <span className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                  {branchNodes.length} branches · Click any row to fly camera
                </span>
              </div>

              <div className="overflow-x-auto" style={{ backgroundColor: theme.ground }}>
                <table className="w-full text-left border-collapse tabular-nums">
                  <thead>
                    <tr style={{ backgroundColor: theme.surfaceAlt }}>
                      <th className="py-2.5 px-3.5 text-sm font-semibold" style={{ color: theme.ink }}>
                        Branch
                      </th>
                      <th className="py-2.5 px-3.5 text-sm font-semibold" style={{ color: theme.ink }}>
                        Horizon
                      </th>
                      <th
                        className="py-2.5 px-3.5 text-sm font-semibold text-right tabular-nums"
                        style={{ color: theme.ink }}
                      >
                        Reversibility
                      </th>
                      <th
                        className="py-2.5 px-3.5 text-sm font-semibold text-right tabular-nums"
                        style={{ color: theme.ink }}
                      >
                        Cumulative
                      </th>
                      <th
                        className="py-2.5 px-3.5 text-sm font-semibold text-right tabular-nums"
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
                          onClick={() => handleFocusPortal(node.id)}
                          className="cursor-pointer"
                          style={{
                            backgroundColor: isSel ? theme.surfaceAlt : theme.ground,
                          }}
                        >
                          <td className="py-2.5 px-3.5 text-sm font-medium" style={{ color: theme.ink }}>
                            {node.title}
                            {isRec ? ' (Recommended)' : ''}
                          </td>
                          <td className="py-2.5 px-3.5 text-sm" style={{ color: theme.mutedInk }}>
                            {node.timeHorizon}
                          </td>
                          <td
                            className="py-2.5 px-3.5 text-sm text-right tabular-nums"
                            style={{ color: theme.ink }}
                          >
                            {node.reversibilityScore.toFixed(1)}
                          </td>
                          <td
                            className="py-2.5 px-3.5 text-sm text-right tabular-nums"
                            style={{ color: theme.ink }}
                          >
                            {(node.cumulativeProbability * 100).toFixed(1)}%
                          </td>
                          <td
                            className="py-2.5 px-3.5 text-sm font-semibold text-right tabular-nums"
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

              {recommendedNode && (
                <div className="p-4 space-y-1.5" style={{ backgroundColor: theme.ground }}>
                  <h2 className="text-base font-semibold" style={{ color: theme.ink }}>
                    Recommended path: {recommendedNode.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: theme.ink }}>
                    Prioritize {recommendedNode.title} at{' '}
                    {Math.round(recommendedNode.conditionalProbability * 100)}% likelihood. Lock
                    annual prepay terms in the first week and monitor checkpoint:{' '}
                    {recommendedNode.tripwires?.[0] || 'Signed pilot within 45 days'}.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column (5 cols): Focused Portal Inspector & Sensitivity Levers */}
            <div className="lg:col-span-5 space-y-4">
              {selectedNode && (
                <div className="p-4 space-y-2.5" style={{ backgroundColor: theme.ground }}>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold" style={{ color: theme.ink }}>
                      {selectedNode.title}
                    </h2>
                    <span
                      className="text-base font-semibold tabular-nums"
                      style={{ color: theme.accent }}
                    >
                      {(selectedNode.conditionalProbability * 100).toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed" style={{ color: theme.ink }}>
                    {selectedNode.narrativeSummary ||
                      'Selected trajectory portal in the sanctuary.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                      Cumulative: {(selectedNode.cumulativeProbability * 100).toFixed(1)}% ·
                      Reversibility: {selectedNode.reversibilityScore.toFixed(1)}/10
                    </span>
                    <button
                      type="button"
                      onClick={() => collapseWavefunction(selectedNode.id)}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Mark what actually happened
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3" style={{ backgroundColor: theme.ground }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold" style={{ color: theme.ink }}>
                    Sensitivity levers
                  </h2>
                  <button
                    type="button"
                    onClick={() => applyLeverVector(ZERO_LEVERS)}
                    className="px-2.5 py-1 text-sm font-medium"
                    style={{ backgroundColor: theme.surface, color: theme.ink }}
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      key: 'executionVelocity' as keyof SliderDeltas,
                      label: 'Shipping speed',
                    },
                    {
                      key: 'capitalBuffer' as keyof SliderDeltas,
                      label: 'Cash runway buffer',
                    },
                    {
                      key: 'marketTailwind' as keyof SliderDeltas,
                      label: 'Demand tailwind',
                    },
                    {
                      key: 'skillPreparation' as keyof SliderDeltas,
                      label: 'Team readiness',
                    },
                  ].map((lever) => {
                    const val = sensitivityLevers[lever.key];
                    const pct = Math.round(val * 100);
                    return (
                      <div key={lever.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <label htmlFor={`obs-${lever.key}`} style={{ color: theme.ink }}>
                            {lever.label}
                          </label>
                          <span className="font-semibold tabular-nums" style={{ color: theme.ink }}>
                            {pct > 0 ? `+${pct}%` : `${pct}%`}
                          </span>
                        </div>
                        <input
                          id={`obs-${lever.key}`}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ObservatoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#F1F0EC] text-[#161615] text-base">
          Loading HOROVEX Sanctuary…
        </div>
      }
    >
      <ObservatoryInner />
    </Suspense>
  );
}
