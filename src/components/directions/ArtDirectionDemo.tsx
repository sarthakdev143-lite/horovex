'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
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

  const theme = DIRECTION_THEMES[direction] || DIRECTION_THEMES.sanctuary;

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
  const selectNode = useMultiverseStore((state) => state.selectNode);
  const setGoldenPath = useMultiverseStore((state) => state.setGoldenPath);
  const setUserContextTwin = useMultiverseStore((state) => state.setUserContextTwin);
  const setSensitivityLevers = useMultiverseStore((state) => state.setSensitivityLevers);
  const collapseWavefunction = useMultiverseStore((state) => state.collapseWavefunction);

  const baselineProbsRef = useRef<Record<string, number>>({});

  const [dilemmaInput, setDilemmaInput] = useState('');
  const [interventionInput, setInterventionInput] = useState('');
  const [showInterventionBox, setShowInterventionBox] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenarioSlug, setActiveScenarioSlug] = useState<string>('saas-pivot');
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Scroll-driven 3D camera state & Fly-to-monolith focus mode
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

  const handleSwitchDirection = (nextDir: ArtDirectionId) => {
    setDirection(nextDir);
    try {
      router.replace(`/?direction=${nextDir}`, { scroll: false });
    } catch {
      // ignore router errors in isolated test contexts
    }
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
      className="min-h-[100dvh] w-full relative"
      style={{ backgroundColor: theme.ground, color: theme.ink }}
    >
      {/* FULL-SCREEN FIXED 3D SANCTUARY STAGE (100vw x 100dvh, z-index 1) */}
      <div
        className="fixed inset-0 w-full h-[100dvh] z-[1]"
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

      {/* STICKY ARCHITECTURAL HEADER BAR (z-index 30, never overlaps mobile or desktop h1) */}
      <header
        className="sticky top-0 z-30 w-full hv-motion-item"
        style={{ backgroundColor: theme.ground, color: theme.ink }}
      >
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 py-2.5 min-h-[60px] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`${theme.displayFontClass} text-xl font-semibold tracking-tight`}
              style={{ color: theme.ink }}
            >
              HOROVEX
            </Link>
            <div className="hidden xl:flex items-center gap-3 text-sm">
              <a
                href="#origin-threshold"
                className="font-medium"
                style={{ color: theme.mutedInk }}
              >
                Origin
              </a>
              <a
                href="#bifurcation-basin"
                className="font-medium"
                style={{ color: theme.mutedInk }}
              >
                Watershed
              </a>
              <a
                href="#golden-path-sanctuary"
                className="font-medium"
                style={{ color: theme.mutedInk }}
              >
                Recommended
              </a>
              <a
                href="#flagship-demos"
                className="font-medium"
                style={{ color: theme.mutedInk }}
              >
                Currents
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:order-3">
            <button
              type="button"
              onClick={() => setCameraMode('overview')}
              className="hidden sm:inline-block px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
              style={{ backgroundColor: theme.surface, color: theme.ink }}
            >
              Full garden
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
              {pureGardenView ? 'Show guide' : 'Pure 3D view'}
            </button>
            <Link
              href={`/observatory?demo=${
                activeScenarioSlug === 'custom' ? 'saas-pivot' : activeScenarioSlug
              }&direction=${direction}`}
              data-testid="launch-observatory-btn"
              className="px-3.5 py-1.5 text-sm font-semibold transition-transform active:scale-95"
              style={{
                backgroundColor: theme.accent,
                color: theme.accentFg,
              }}
            >
              Enter Sanctuary
            </Link>
          </div>

          <nav
            aria-label="Sanctuary camera and scene controls"
            className="w-full sm:w-auto sm:order-2 flex items-center justify-between sm:justify-start gap-1 p-1"
            style={{ backgroundColor: theme.surface }}
          >
            {(
              [
                { id: 'sanctuary', label: 'Sanctuary' },
                { id: 'landscape', label: 'Landscape' },
                { id: 'instrument', label: 'Instrument' },
                { id: 'darkroom', label: 'Dark Room' },
              ] as { id: ArtDirectionId; label: string }[]
            ).map((item) => {
              const isActive = direction === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSwitchDirection(item.id)}
                  data-testid={`switch-direction-${item.id}`}
                  className="flex-1 sm:flex-initial px-2 py-1.5 text-sm font-medium text-center transition-transform active:scale-95"
                  style={{
                    backgroundColor: isActive ? theme.accent : 'transparent',
                    color: isActive ? theme.accentFg : theme.ink,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* FLOATING CONTROL STRIP WHEN IN PURE 3D GARDEN VIEW */}
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
                Reset camera
              </button>
              <button
                type="button"
                onClick={() => setPureGardenView(false)}
                className="px-3 py-1 text-sm font-semibold"
                style={{ backgroundColor: theme.accent, color: theme.accentFg }}
              >
                Show guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCROLL-DRIVEN 3D JOURNEY OVERLAYS (z-index 10, pointer-events-none on wrappers so 3D garden is clickable everywhere in open space) */}
      <div
        className={`relative z-10 w-full pointer-events-none transition-opacity duration-300 ${
          pureGardenView
            ? 'opacity-0 invisible [&_*]:!pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {/* SECTION 1 (SCROLL 0.00): THE ORIGIN THRESHOLD — Open top sanctuary vista on desktop so all 5 3D portals tower above */}
        <section
          id="origin-threshold"
          className="w-full pt-4 lg:pt-[220px] pb-14 md:pb-20 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Left Column (Cols 1-5): Headline, Supporting Line, and Live Dilemma Bar */}
              <div
                className="lg:col-span-5 p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-1"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div className="space-y-2.5">
                  <h1
                    className={`${theme.displayFontClass} tracking-tight leading-[1.06] hv-motion-item hv-delay-1`}
                    style={{
                      fontSize: 'clamp(28px, 4.4vw, 41px)',
                      color: theme.ink,
                    }}
                  >
                    {theme.headline}
                  </h1>
                  <p
                    className="text-base leading-relaxed hv-motion-item hv-delay-2"
                    style={{ color: theme.ink, maxWidth: '54ch' }}
                  >
                    {theme.lead}
                  </p>
                </div>

                <form
                  onSubmit={handleSimulateDilemma}
                  className="p-3.5 space-y-2.5 hv-motion-item hv-delay-3"
                  style={{ backgroundColor: theme.surface }}
                >
                  <label
                    htmlFor="dilemma-input"
                    className="block text-base font-medium"
                    style={{ color: theme.ink }}
                  >
                    Type a dilemma to carve across the sanctuary
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="dilemma-input"
                      type="text"
                      name="prompt"
                      value={dilemmaInput}
                      onChange={(e) => setDilemmaInput(e.target.value)}
                      placeholder="e.g. Pivot to enterprise contracts or raise seed?"
                      className="flex-1 px-3 py-2 text-base focus:outline-none"
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
                      className="px-4 py-2 text-base font-semibold whitespace-nowrap transition-transform active:scale-95"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentFg,
                      }}
                    >
                      {isSimulating ? 'Carving...' : theme.ctaLabel}
                    </button>
                  </div>
                </form>

                <div className="space-y-1.5 hv-motion-item hv-delay-4">
                  <p className="text-sm font-medium" style={{ color: theme.mutedInk }}>
                    Or walk a studied crossroads:
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
                      SaaS enterprise pivot
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
                      Leave big tech for solo AI
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
                      San Francisco vs. Dubai base
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column (Cols 7-12): Low-Profile Interactive Monolith Flight Strip */}
              <div
                data-ui="true"
                className="lg:col-span-6 lg:col-start-7 p-6 space-y-3.5 pointer-events-auto hv-motion-item hv-delay-2"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 hv-motion-item hv-delay-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: theme.ink }}>
                      {rootNode?.title || 'Founder Pivot Dilemma'}
                    </p>
                    <p className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                      Click any portal in the 3D garden or below to fly the camera into its basin
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraMode('overview')}
                    className="px-3 py-1.5 text-sm font-medium transition-transform active:scale-95"
                    style={{ backgroundColor: theme.surface, color: theme.ink }}
                  >
                    Reset camera
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 hv-motion-item hv-delay-4">
                  {branchNodes.slice(0, 10).map((node) => {
                    const isRec =
                      goldenPathNodeIds.includes(node.id) || Boolean(node.isGoldenPath);
                    const isSel = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => handleFocusNode(node.id)}
                        className="p-2.5 text-left transition-transform active:scale-95 flex items-center justify-between gap-3"
                        style={{
                          backgroundColor: isRec
                            ? theme.accent
                            : isSel
                            ? theme.ink
                            : theme.surface,
                          color: isRec
                            ? theme.accentFg
                            : isSel
                            ? theme.ground
                            : theme.ink,
                        }}
                      >
                        <span className="text-sm font-medium truncate">
                          {node.title}
                        </span>
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                          {Math.round(node.conditionalProbability * 100)}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedNode && (
                  <div
                    className="p-3 flex flex-wrap items-center justify-between gap-3 hv-motion-item hv-delay-5"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold" style={{ color: theme.ink }}>
                        Focused portal: {selectedNode.title}
                      </p>
                      <p className="text-sm tabular-nums" style={{ color: theme.mutedInk }}>
                        Likelihood {(selectedNode.conditionalProbability * 100).toFixed(1)}% ·
                        Cumulative {(selectedNode.cumulativeProbability * 100).toFixed(1)}% ·{' '}
                        {selectedNode.timeHorizon}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFocusNode(selectedNode.id)}
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Fly to portal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 (SCROLL ~0.33): THE BIFURCATION BASIN */}
        <section
          id="bifurcation-basin"
          className="w-full py-14 md:py-20 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Left Column (Cols 1-5): Watershed Prose & Wave Expansion Control */}
              <div
                className="lg:col-span-5 p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-3"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <h2
                  className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-4`}
                  style={{ fontSize: 'clamp(24px, 2.3vw, 32px)', color: theme.ink }}
                >
                  Five paths carved by likelihood.
                </h2>
                <p
                  className="text-base leading-relaxed hv-motion-item hv-delay-5"
                  style={{ color: theme.ink, maxWidth: '54ch' }}
                >
                  From the origin threshold, water divides into five carved travertine valleys
                  holding eighty percent of baseline likelihood. Twenty percent stays in reserve
                  so you can raise contrarian and tail-risk portals out of the mist.
                </p>

                <div
                  className="p-4 space-y-3 hv-motion-item hv-delay-6"
                  style={{ backgroundColor: theme.surface }}
                >
                  <div className="flex items-center justify-between text-sm tabular-nums">
                    <span className="font-semibold" style={{ color: theme.ink }}>
                      Active portals: {branchNodes.length} · Wave {maxWaveNumber || 1}
                    </span>
                    <span style={{ color: theme.mutedInk }}>
                      Reserve mass: {Math.round(unexploredMass * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={handleExpandFiveMore}
                      disabled={isSimulating}
                      data-testid="expand-five-more-btn"
                      className="px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95"
                      style={{
                        backgroundColor: theme.accent,
                        color: theme.accentFg,
                      }}
                    >
                      +5 more futures
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraMode('overview')}
                      className="px-4 py-2.5 text-sm font-medium transition-transform active:scale-95"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      View full watershed
                    </button>
                  </div>

                  {branchNodes.filter((n) => n.waveNumber > 1).length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-sm font-medium" style={{ color: theme.mutedInk }}>
                        Outer wave portals raised from reserve (click to fly):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {branchNodes
                          .filter((n) => n.waveNumber > 1)
                          .map((node) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => handleFocusNode(node.id)}
                              className="px-2.5 py-1 text-sm font-medium tabular-nums"
                              style={{
                                backgroundColor:
                                  selectedNode?.id === node.id
                                    ? theme.accent
                                    : theme.ground,
                                color:
                                  selectedNode?.id === node.id
                                    ? theme.accentFg
                                    : theme.ink,
                              }}
                            >
                              {Math.round(node.conditionalProbability * 100)}% ·{' '}
                              {node.title.length > 20
                                ? `${node.title.slice(0, 18)}…`
                                : node.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (Cols 7-12): Alabaster Relief Plate 1 */}
              <figure
                className="lg:col-span-6 lg:col-start-7 p-6 space-y-3 pointer-events-auto hv-motion-item hv-delay-4"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <img
                  src={theme.plates[0].src}
                  alt={theme.plates[0].alt}
                  width={800}
                  height={500}
                  className="w-full h-52 sm:h-60 object-cover block hv-motion-item hv-delay-5"
                />
                <figcaption className="space-y-1 hv-motion-item hv-delay-6">
                  <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                    {theme.plates[0].title}
                  </p>
                  <p
                    className="text-base leading-relaxed"
                    style={{ color: theme.ink, maxWidth: '56ch' }}
                  >
                    {theme.plates[0].caption}
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* SECTION 3 (SCROLL ~0.66): THE GOLDEN PATH SANCTUARY */}
        <section
          id="golden-path-sanctuary"
          className="w-full py-14 md:py-20 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Left Column (Cols 1-5): Strategic Mentor Verdict & Fourteen-Day Plan */}
              <div
                className="lg:col-span-5 p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-5"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <h2
                  className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-6`}
                  style={{ fontSize: 'clamp(24px, 2.3vw, 32px)', color: theme.ink }}
                >
                  Follow the calmest water.
                </h2>
                <p
                  className="text-base leading-relaxed hv-motion-item hv-delay-7"
                  style={{ color: theme.ink, maxWidth: '54ch' }}
                >
                  Backward induction isolates the trajectory that maximizes long-term utility
                  while guarding against irreversible ruin. A glacial mineral channel and overhead
                  skylight beam illuminate this recommended portal.
                </p>

                {recommendedNode && (
                  <div
                    className="p-4 space-y-2.5 hv-motion-item hv-delay-8"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <p className="text-base font-semibold" style={{ color: theme.ink }}>
                      Recommended path: {recommendedNode.title} (
                      {Math.round(recommendedNode.conditionalProbability * 100)}%)
                    </p>
                    <p className="text-base leading-relaxed" style={{ color: theme.ink }}>
                      First week move: Lock a 50% annual prepayment pilot before expanding burn.
                      Checkpoint: {recommendedNode.tripwires?.[0] || 'Signed pilot within 45 days'}.
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleFocusNode(recommendedNode.id)}
                        className="px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
                        style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                      >
                        Fly to recommended portal
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyBrief}
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      >
                        {copiedBrief ? 'Brief copied' : 'Copy decision brief'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Cols 7-12): Downstream Depth Recursion & Alabaster Relief Plate 2 */}
              <div
                className="lg:col-span-6 lg:col-start-7 p-6 space-y-4 pointer-events-auto hv-motion-item hv-delay-6"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div
                  className="p-4 space-y-3 hv-motion-item hv-delay-7"
                  style={{ backgroundColor: theme.surface }}
                >
                  <p className="text-base font-semibold" style={{ color: theme.ink }}>
                    Step deeper into {selectedNode?.title || 'the focused portal'} (Depth{' '}
                    {activeDepth || 1})
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleStepIntoFuture()}
                      disabled={isSimulating}
                      data-testid="step-into-future-btn"
                      className="px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Show what happens next
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInterventionBox((prev) => !prev)}
                      className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      What if I…
                    </button>
                    {selectedNode && selectedNode.parentId && (
                      <button
                        type="button"
                        onClick={() => collapseWavefunction(selectedNode.id)}
                        className="px-3.5 py-2 text-sm font-medium transition-transform active:scale-95"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      >
                        Mark what actually happened
                      </button>
                    )}
                  </div>

                  {showInterventionBox && (
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={interventionInput}
                        onChange={(e) => setInterventionInput(e.target.value)}
                        placeholder="Describe your move (e.g. require 50% upfront payment)..."
                        className="flex-1 px-3 py-2 text-sm"
                        style={{ backgroundColor: theme.ground, color: theme.ink }}
                      />
                      <button
                        type="button"
                        onClick={() => handleStepIntoFuture(interventionInput)}
                        className="px-4 py-2 text-sm font-semibold"
                        style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                      >
                        Branch with this move
                      </button>
                    </div>
                  )}

                  {branchNodes.filter((n) => n.depth > 1).length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <p className="text-sm font-medium" style={{ color: theme.mutedInk }}>
                        Downstream Depth {activeDepth} portals (click to fly into canyon):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {branchNodes
                          .filter((n) => n.depth > 1)
                          .slice(0, 6)
                          .map((node) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => handleFocusNode(node.id)}
                              className="px-2.5 py-1 text-sm font-medium tabular-nums"
                              style={{
                                backgroundColor:
                                  selectedNode?.id === node.id
                                    ? theme.accent
                                    : theme.ground,
                                color:
                                  selectedNode?.id === node.id
                                    ? theme.accentFg
                                    : theme.ink,
                              }}
                            >
                              D{node.depth} · {Math.round(node.conditionalProbability * 100)}% ·{' '}
                              {node.title.length > 18
                                ? `${node.title.slice(0, 16)}…`
                                : node.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <figure className="space-y-2.5 hv-motion-item hv-delay-8">
                  <img
                    src={theme.plates[1].src}
                    alt={theme.plates[1].alt}
                    width={800}
                    height={500}
                    className="w-full h-48 sm:h-52 object-cover block"
                  />
                  <figcaption className="space-y-1">
                    <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                      {theme.plates[1].title}
                    </p>
                    <p
                      className="text-base leading-relaxed"
                      style={{ color: theme.ink, maxWidth: '56ch' }}
                    >
                      {theme.plates[1].caption}
                    </p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 (SCROLL 1.00): SENSITIVITY CURRENTS & ARCHITECTURAL PLATES */}
        <section
          id="flagship-demos"
          className="w-full py-14 md:py-20 pointer-events-none"
        >
          <div className="max-w-[1320px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (Cols 1-5): Live Sensitivity Levers */}
              <div
                className="lg:col-span-5 p-6 space-y-5 pointer-events-auto hv-motion-item hv-delay-7"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <h2
                  className={`${theme.displayFontClass} tracking-tight leading-tight hv-motion-item hv-delay-8`}
                  style={{ fontSize: 'clamp(24px, 2.3vw, 32px)', color: theme.ink }}
                >
                  Test the currents before you step.
                </h2>
                <p
                  className="text-base leading-relaxed hv-motion-item hv-delay-8"
                  style={{ color: theme.ink, maxWidth: '54ch' }}
                >
                  Drag any lever to test how faster shipping, extra capital runway, or customer
                  demand reshapes the water channels and portal heights across the garden in real
                  time.
                </p>

                <div data-ui="true" className="space-y-3.5">
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
                      <div key={lever.key} className="space-y-1">
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

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleResetLevers}
                      className="px-4 py-2 text-sm font-medium"
                      style={{ backgroundColor: theme.surface, color: theme.ink }}
                    >
                      Reset levers to baseline
                    </button>
                    <Link
                      href={`/observatory?demo=${
                        activeScenarioSlug === 'custom' ? 'saas-pivot' : activeScenarioSlug
                      }&direction=${direction}`}
                      className="px-4 py-2 text-sm font-semibold"
                      style={{ backgroundColor: theme.accent, color: theme.accentFg }}
                    >
                      Open full-screen sanctuary
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column (Cols 7-12): Alabaster Relief Plates 3 & 4 + Studied Crossroads Links */}
              <div
                className="lg:col-span-6 lg:col-start-7 p-6 space-y-5 pointer-events-auto hv-motion-item hv-delay-8"
                style={{ backgroundColor: theme.ground, color: theme.ink }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {theme.plates.slice(2, 4).map((plate) => (
                    <figure key={plate.src} className="space-y-2.5 hv-motion-item hv-delay-8">
                      <img
                        src={plate.src}
                        alt={plate.alt}
                        width={800}
                        height={500}
                        className="w-full h-44 object-cover block"
                      />
                      <figcaption className="space-y-1">
                        <p className="text-xl font-semibold" style={{ color: theme.ink }}>
                          {plate.title}
                        </p>
                        <p
                          className="text-base leading-relaxed"
                          style={{ color: theme.ink }}
                        >
                          {plate.caption}
                        </p>
                      </figcaption>
                    </figure>
                  ))}
                </div>

                <div
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hv-motion-item hv-delay-8"
                  style={{ backgroundColor: theme.surface }}
                >
                  <span className="text-base font-semibold" style={{ color: theme.ink }}>
                    Explore studied crossroads in the full sanctuary:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/observatory?demo=saas-pivot&direction=${direction}`}
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      SaaS pivot
                    </Link>
                    <Link
                      href={`/observatory?demo=solo-ai&direction=${direction}`}
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      Solo AI leap
                    </Link>
                    <Link
                      href={`/observatory?demo=relocation&direction=${direction}`}
                      className="px-3 py-1.5 text-sm font-medium"
                      style={{ backgroundColor: theme.ground, color: theme.ink }}
                    >
                      SF vs. Dubai
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
