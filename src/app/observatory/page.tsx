'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
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
import ObservatoryHeader from '@/components/observatory/ObservatoryHeader';
import ObservatoryControls from '@/components/observatory/ObservatoryControls';
import MentorDrawer from '@/components/observatory/MentorDrawer';
import SensitivityDrawer from '@/components/observatory/SensitivityDrawer';
import FocusedStelePanel from '@/components/observatory/FocusedStelePanel';
import ChronicleMatrixOverlay from '@/components/observatory/ChronicleMatrixOverlay';

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
  const demoParam = searchParams.get('demo');
  const promptParam = searchParams.get('prompt');

  // Lock in Alabaster Sanctuary ground and ink colors
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#F4F2ED';
    document.body.style.backgroundColor = '#F4F2ED';
    document.body.style.color = '#161615';
  }, []);

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
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState(false);
  const [isStelePanelDismissed, setIsStelePanelDismissed] = useState(false);
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
    setIsStelePanelDismissed(false);
  };

  // Load initial demo scenario or prompt
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
      const customArchetypes = [
        'Direct High-Conviction Commit',
        'Staged Validation & Cushion',
        'Hybrid Partnered Transition',
        'Lean Asymmetric Experiment',
        'Status-Quo Downside Trap',
      ];
      const waveNodes: ProbabilityNode[] =
        waveData.nodes && waveData.nodes.length > 0
          ? waveData.nodes.map((n: ProbabilityNode, idx: number) => ({
              ...n,
              title: customArchetypes[idx] || n.title,
              narrativeSummary: `Projected outcome for "${situation}" under ${
                customArchetypes[idx] || n.title
              }.`,
            }))
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
      setIsStelePanelDismissed(false);
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
      setIsStelePanelDismissed(false);
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
        setIsStelePanelDismissed(false);
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
        setIsStelePanelDismissed(false);
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
      setIsStelePanelDismissed(false);
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
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#F4F2ED] text-[#161615] select-none"
    >
      {/* 1. FULL-SCREEN 3D SANCTUARY STAGE */}
      <div
        className="fixed inset-0 w-full h-[100dvh] z-0"
        role="region"
        aria-label="3D Sanctuary stage"
      >
        <DirectionCanvas
          direction="sanctuary"
          nodes={nodeList}
          selectedNodeId={selectedNode?.id || null}
          goldenPathIds={goldenPathNodeIds}
          onSelectNode={handleFocusPortal}
          cameraMode={cameraMode}
          levers={sensitivityLevers}
          className="w-full h-full"
        />
      </div>

      {/* 2. MINIMAL TOP APP BAR */}
      <ObservatoryHeader
        rootNodeTitle={rootNode?.title || 'Alabaster Decision Sanctuary'}
        activeDepth={activeDepth || 1}
        maxWaveNumber={maxWaveNumber || 1}
        activeViewMode={activeViewMode}
        onToggleViewMode={(mode) => setActiveViewMode(mode)}
        isMentorOpen={isMentorOpen}
        onToggleMentor={() => setIsMentorOpen((prev) => !prev)}
        isSensitivityOpen={isSensitivityOpen}
        onToggleSensitivity={() => setIsSensitivityOpen((prev) => !prev)}
        branchNodes={branchNodes}
        selectedNodeId={selectedNode?.id}
        onFocusPortal={handleFocusPortal}
        onResetCamera={() => setCameraMode('overview')}
        goldenPathNodeIds={goldenPathNodeIds}
      />

      {/* 3. FLOATING BOTTOM ACTION BAR */}
      {activeViewMode === '3d' && (
        <ObservatoryControls
          isLoadingWave={isLoadingWave}
          unexploredMass={unexploredMass}
          situationInput={situationInput}
          onSituationInputChange={setSituationInput}
          onSubmitSituation={generateInitialWave}
          onExpandWave={handleHorizontalExpand}
          onRecurseDeeper={() => handleVerticalRecursion()}
          hasSelectedNode={Boolean(selectedNodeId)}
          isActionModalOpen={isActionModalOpen}
          onToggleActionModal={() => setIsActionModalOpen((prev) => !prev)}
          interventionMove={interventionMove}
          onInterventionMoveChange={setInterventionMove}
          onSubmitIntervention={handleVerticalRecursion}
        />
      )}

      {/* 4. SLIDE-OVER SENSITIVITY SLIDERS DRAWER (LEFT) */}
      <SensitivityDrawer
        isOpen={isSensitivityOpen}
        onClose={() => setIsSensitivityOpen(false)}
        sensitivityLevers={sensitivityLevers}
        onLeverChange={handleLeverChange}
        onResetLevers={() => applyLeverVector(ZERO_LEVERS)}
      />

      {/* 5. SLIDE-OVER STRATEGIC MENTOR GUIDANCE DRAWER (RIGHT) */}
      <MentorDrawer
        isOpen={isMentorOpen}
        onClose={() => setIsMentorOpen(false)}
        recommendedNode={recommendedNode}
        userContextTwin={userContextTwin}
      />

      {/* 6. FOCUSED STELE FLOATING PANEL */}
      {activeViewMode === '3d' &&
        selectedNode &&
        selectedNode.parentId !== null &&
        !isStelePanelDismissed &&
        !isMentorOpen && (
          <FocusedStelePanel
            node={selectedNode}
            isGoldenPath={
              goldenPathNodeIds.includes(selectedNode.id) || Boolean(selectedNode.isGoldenPath)
            }
            onCollapse={(id) => collapseWavefunction(id)}
            onRecurseDeeper={() => handleVerticalRecursion()}
            onClose={() => setIsStelePanelDismissed(true)}
            isLoading={isLoadingWave}
          />
        )}

      {/* 7. 2D CHRONICLE MATRIX FULL-VIEWPORT OVERLAY */}
      {activeViewMode === '2d' && (
        <div role="region" aria-label="Compare in Table">
          <ChronicleMatrixOverlay
            nodes={nodeList}
            goldenPathNodeIds={goldenPathNodeIds}
            selectedNodeId={selectedNode?.id}
            onSelectNode={handleFocusPortal}
            onCollapse={(id) => collapseWavefunction(id)}
            onClose={() => setActiveViewMode('3d')}
          />
        </div>
      )}
    </main>
  );
}

export default function ObservatoryPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 w-full h-[100dvh] flex items-center justify-center bg-[#F4F2ED] text-[#161615] text-base">
          Loading HOROVEX Sanctuary…
        </div>
      }
    >
      <ObservatoryInner />
    </Suspense>
  );
}
