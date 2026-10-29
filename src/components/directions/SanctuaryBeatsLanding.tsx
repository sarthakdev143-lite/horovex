'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { generateDeterministicWave } from '@/lib/ai/adapter';
import {
  flagshipFounderSaaSPivot,
  flagshipSeniorTechSoloAI,
  flagshipGlobalRelocation,
  FlagshipScenario,
} from '@/tests/fixtures/mock-scenarios';
import { DIRECTION_THEMES } from '@/lib/directions/themes';

const DirectionCanvas = dynamic(
  () => import('@/components/canvas/DirectionCanvas'),
  { ssr: false }
);

const theme = DIRECTION_THEMES.sanctuary;
const GROUND = theme.ground;
const INK = theme.ink;
const SLATE = theme.mutedInk;
const BLUE = theme.accent;

const CUSTOM_ARCHETYPES = [
  'Direct High-Conviction Commit',
  'Staged Validation & Cushion',
  'Hybrid Partnered Transition',
  'Lean Asymmetric Experiment',
  'Status-Quo Downside Trap',
];

type BeatId = 'decision' | 'rise' | 'futures' | 'vista';

const BEAT_CAMERA: Record<BeatId, 'overview' | 'focus'> = {
  decision: 'overview',
  rise: 'focus',
  futures: 'overview',
  vista: 'overview',
};

export default function SanctuaryBeatsLanding() {
  const nodes = useMultiverseStore((s) => s.nodes);
  const selectedNodeId = useMultiverseStore((s) => s.selectedNodeId);
  const goldenPathNodeIds = useMultiverseStore((s) => s.goldenPathNodeIds);
  const userContextTwin = useMultiverseStore((s) => s.userContextTwin);
  const setNodes = useMultiverseStore((s) => s.setNodes);
  const selectNode = useMultiverseStore((s) => s.selectNode);
  const setGoldenPath = useMultiverseStore((s) => s.setGoldenPath);
  const setUserContextTwin = useMultiverseStore((s) => s.setUserContextTwin);

  const [gardenAlive, setGardenAlive] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const [beatsAlive, setBeatsAlive] = useState<Record<BeatId, boolean>>({
    decision: true,
    rise: false,
    futures: false,
    vista: false,
  });
  const [activeBeat, setActiveBeat] = useState<BeatId>('decision');
  const [dilemmaInput, setDilemmaInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Commit the garden canvas teardown synchronously on navigation intent,
  // before the route transition starts (R3F unmount race guard).
  useEffect(() => {
    const disarm = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.('a[href^="/observatory"]');
      if (anchor) flushSync(() => setGardenAlive(false));
    };
    document.addEventListener('click', disarm, true);
    return () => document.removeEventListener('click', disarm, true);
  }, []);

  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
    } catch {
      /* noop */
    }
  }, []);

  // Seed the garden so the towers stand on first paint.
  useEffect(() => {
    const map: Record<string, ProbabilityNode> = {};
    map[flagshipFounderSaaSPivot.rootNode.id] = flagshipFounderSaaSPivot.rootNode;
    flagshipFounderSaaSPivot.initialWave1.forEach((n) => {
      map[n.id] = n;
    });
    setNodes(map);
    useMultiverseStore.setState({
      rootNodeId: flagshipFounderSaaSPivot.rootNode.id,
      activeDepth: 1,
      maxWaveNumber: 1,
      exploredMass: 0.8,
      unexploredMass: 0.2,
    });
    selectNode(
      flagshipFounderSaaSPivot.initialWave1[0]?.id || flagshipFounderSaaSPivot.rootNode.id
    );
    setUserContextTwin(flagshipFounderSaaSPivot.recommendedTwin);
    setGoldenPath(flagshipFounderSaaSPivot.expectedGoldenPathIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One beat in focus at a time: opaque beats occlude the canvas entirely.
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-beat]')
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-beat') as BeatId | null;
          if (!id) return;
          if (entry.isIntersecting) {
            setActiveBeat(id);
            setBeatsAlive((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
          }
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const nodeList = useMemo(() => Object.values(nodes), [nodes]);
  const futures = useMemo(
    () =>
      nodeList
        .filter((n) => n.parentId !== null)
        .sort((a, b) => b.conditionalProbability - a.conditionalProbability),
    [nodeList]
  );
  const selectedNode = useMemo(
    () =>
      (selectedNodeId && nodes[selectedNodeId]) ||
      futures[0] ||
      nodeList.find((n) => !n.parentId) ||
      null,
    [nodes, selectedNodeId, futures, nodeList]
  );
  const recommendedNode = useMemo(
    () =>
      futures.find(
        (n) => goldenPathNodeIds.includes(n.id) || Boolean(n.isGoldenPath)
      ) || futures[0],
    [futures, goldenPathNodeIds]
  );

  const loadScenario = (scenario: FlagshipScenario) => {
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
    document
      .querySelector('[data-beat="rise"]')
      ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = dilemmaInput.trim();
    if (!clean || isSimulating) return;
    setIsSimulating(true);
    try {
      const rootId = `root-${Date.now()}`;
      const simId = `sim-${Date.now()}`;
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
      const apiNodes: ProbabilityNode[] =
        data.nodes && data.nodes.length > 0
          ? data.nodes.map((n: ProbabilityNode, idx: number) => ({
              ...n,
              title: CUSTOM_ARCHETYPES[idx] || n.title,
            }))
          : [];
      const waveNodes =
        apiNodes.length > 0
          ? apiNodes
          : generateDeterministicWave(clean, 1, 1, rootId, 1.0).map((n, idx) => ({
              ...n,
              title: CUSTOM_ARCHETYPES[idx] || n.title,
              narrativeSummary: `Projected outcome for "${clean}" under ${
                CUSTOM_ARCHETYPES[idx] || n.title
              }.`,
            }));
      const rootNode: ProbabilityNode = {
        id: rootId,
        simulationId: simId,
        parentId: null,
        treePath: 'root',
        depth: 0,
        waveNumber: 1,
        siblingIndex: 1,
        regimeTier: 'root',
        title: clean.length > 56 ? `${clean.slice(0, 53)}...` : clean,
        narrativeSummary: clean,
        timeHorizon: 'Present',
        conditionalProbability: 1.0,
        cumulativeProbability: 1.0,
        rawLlmConfidence: 1.0,
        unexploredChildMass: 0.2,
        causalDrivers: ['Present decision crossroads'],
        reversibilityType: 'hybrid',
        reversibilityScore: 7.5,
        regretMinimizationScore: 8.0,
        impactVector: {
          wealth: 0,
          autonomy: 0,
          mastery: 0,
          stability: 0,
          impact: 0,
          peace: 0,
        },
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
      const map: Record<string, ProbabilityNode> = { [rootId]: rootNode };
      waveNodes.forEach((n) => {
        map[n.id] = n;
      });
      setNodes(map);
      useMultiverseStore.setState({
        rootNodeId: rootId,
        activeDepth: 1,
        maxWaveNumber: 1,
        exploredMass: 0.8,
        unexploredMass: 0.2,
      });
      const { goldenPathNodeIds: solved } = solveGoldenPath(
        Object.values(map),
        rootId,
        userContextTwin
      );
      setGoldenPath(solved);
      const first =
        waveNodes.find((n) => solved.includes(n.id)) || waveNodes[0];
      selectNode(first?.id || rootId);
    } finally {
      setIsSimulating(false);
      document
        .querySelector('[data-beat="rise"]')
        ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const cameraMode = reducedMotion ? 'overview' : BEAT_CAMERA[activeBeat];
  const simHref = '/observatory?demo=saas-pivot';
  const revealed = (b: BeatId) =>
    `motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
      beatsAlive[b] ? 'motion-safe:opacity-100 motion-safe:translate-y-0' : 'motion-safe:opacity-0 motion-safe:translate-y-8'
    }`;

  return (
    <div className="relative w-full" style={{ backgroundColor: GROUND, color: INK }}>
      {/* Fixed garden stage; opaque beats occlude it, transparent beats reveal it.
          A painted poster holds the frame until the WebGL canvas is ready. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src="/assets/alabaster-sanctuary.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
          style={{ opacity: canvasReady ? 0 : 1 }}
        />
        {gardenAlive ? (
          <DirectionCanvas
            direction="sanctuary"
            nodes={nodeList}
            selectedNodeId={selectedNode?.id || null}
            goldenPathIds={goldenPathNodeIds}
            cameraMode={cameraMode}
            onReady={() => setCanvasReady(true)}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: GROUND }} />
        )}
      </div>

      <a
        href="#step-decision"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:bg-[#14181C] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to the decision form
      </a>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Link
          href="/"
          className={`font-serif text-[21px] font-semibold leading-none tracking-[-0.01em] motion-safe:transition-all motion-safe:duration-700 ${mounted ? 'motion-safe:opacity-100' : 'motion-safe:opacity-0 motion-safe:-translate-y-2'}`}
          style={{ color: INK }}
        >
          HOROVEX
        </Link>
        <nav aria-label="Page sections" className={`hidden items-center gap-7 text-sm md:flex motion-safe:transition-all motion-safe:duration-700 ${mounted ? 'motion-safe:opacity-100' : 'motion-safe:opacity-0 motion-safe:-translate-y-2'}`} style={{ transitionDelay: '90ms' }}>
          <a href="#step-decision" className="transition-opacity hover:opacity-60" style={{ color: SLATE }}>
            Your Decision
          </a>
          <a href="#step-rise" className="transition-opacity hover:opacity-60" style={{ color: SLATE }}>
            The Garden
          </a>
          <a href="#step-futures" className="transition-opacity hover:opacity-60" style={{ color: SLATE }}>
            Five Futures
          </a>
        </nav>
        <Link
          href={simHref}
          className={`px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95 motion-safe:transition-all motion-safe:duration-700 ${mounted ? 'motion-safe:opacity-100' : 'motion-safe:opacity-0 motion-safe:-translate-y-2'}`}
          style={{ backgroundColor: INK, transitionDelay: '180ms' }}
        >
          Open Full Simulator
        </Link>
      </header>

      <main className="relative">
        {/* BEAT 1 — content: the dilemma */}
        <section
          data-beat="decision"
          id="step-decision"
          aria-label="Enter your decision"
          className="relative z-10 px-6 pb-24 pt-32 sm:px-10 sm:pt-36 lg:px-16"
          style={{ backgroundColor: GROUND, minHeight: '100dvh' }}
        >
          <div className={`mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-[1320px] flex-col justify-center ${revealed('decision')}`}>
            <h1 className="max-w-[16ch] font-serif text-[clamp(2.5rem,7vw,4rem)] leading-[1.02] tracking-[-0.025em]">
              See where your next decision leads.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.55]" style={{ color: SLATE }}>
              Name the crossroads. The garden grows around it.
            </p>
            <form onSubmit={handleSimulate} className={`mt-8 max-w-2xl ${revealed('decision')}`} style={{ transitionDelay: '120ms' }}>
              <label htmlFor="dilemma-input" className="mb-2 block text-base font-semibold">
                1. Enter your decision crossroads
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="dilemma-input"
                  type="text"
                  name="prompt"
                  value={dilemmaInput}
                  onChange={(e) => setDilemmaInput(e.target.value)}
                  placeholder="e.g., Should I leave my job to build an AI product?"
                  className="h-14 min-w-0 flex-1 border bg-[#FBFAF7] px-5 text-[17px] outline-none placeholder:text-[#54626E]/70"
                  style={{ borderColor: 'rgba(20,24,28,0.16)', color: INK }}
                />
                <button
                  type="submit"
                  disabled={isSimulating}
                  data-testid="simulate-btn"
                  className="h-14 shrink-0 px-6 text-[17px] font-medium text-white transition-transform active:scale-95 disabled:opacity-60"
                  style={{ backgroundColor: BLUE }}
                >
                  {isSimulating ? 'Simulating...' : 'Predict 5 Futures'}
                </button>
              </div>
            </form>
            <div className={`mt-6 ${revealed('decision')}`} style={{ transitionDelay: '240ms' }}>
              <p className="text-sm" style={{ color: SLATE }}>
                Or test a live scenario:
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipFounderSaaSPivot)}
                  className="w-full px-4 py-2.5 text-sm font-medium sm:w-auto"
                  style={{ backgroundColor: '#E4E5E1', color: INK }}
                >
                  Pivot SaaS to Enterprise
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipSeniorTechSoloAI)}
                  className="w-full px-4 py-2.5 text-sm font-medium sm:w-auto"
                  style={{ backgroundColor: '#E4E5E1', color: INK }}
                >
                  Leave Big Tech for Solo AI
                </button>
                <button
                  type="button"
                  onClick={() => loadScenario(flagshipGlobalRelocation)}
                  className="w-full px-4 py-2.5 text-sm font-medium sm:w-auto"
                  style={{ backgroundColor: '#E4E5E1', color: INK }}
                >
                  San Francisco vs. Dubai
                </button>
              </div>
              <p className="mt-4 text-[14px]" style={{ color: SLATE }}>
                Probabilities always sum to 100% — the recommended path is Bellman-optimal against your values.
              </p>
              <a href="#step-rise" className="mt-6 inline-block text-[14px] font-medium transition-opacity hover:opacity-60" style={{ color: BLUE }}>
                Scroll to watch them rise ↓
              </a>
            </div>
          </div>
        </section>

        {/* BEAT 3 — pure 3D breather */}
        <section
          data-beat="rise"
          id="step-rise"
          aria-label="Watch the futures rise"
          className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-6 pb-16 sm:px-10 lg:px-16"
        >
          <div className={`mx-auto w-full max-w-[1320px] text-center ${revealed('rise')}`}>
            <p
              className={`inline-block max-w-[34ch] px-5 py-4 font-serif text-[clamp(1.5rem,3.5vw,2.25rem)] leading-[1.08] ${revealed('rise')}`}
              style={{ backgroundColor: GROUND }}
            >
              Five towers. One recommended path in blue.
            </p>
          </div>
        </section>
        {/* BEAT 4 — content: the futures */}
        <section
          data-beat="futures"
          id="step-futures"
          aria-label="Your five futures"
          className="relative z-10 px-6 py-24 sm:px-10 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div className={`mx-auto w-full max-w-[1320px] ${revealed('futures')}`}>
            <h2 className={`max-w-[20ch] font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] tracking-[-0.02em] ${revealed('futures')}`}>
              Ranked by likelihood. One recommended.
            </h2>
            <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {futures.map((n, idx) => {
                const isRec =
                  goldenPathNodeIds.includes(n.id) || Boolean(n.isGoldenPath);
                return (
                  <li
                    key={n.id}
                    className={`p-5 ${revealed('futures')}`}
                    style={{
                      backgroundColor: isRec ? '#EAF1F5' : '#FBFAF7',
                      transitionDelay: `${idx * 90}ms`,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{ color: isRec ? BLUE : INK }}
                      >
                        {Math.round(n.conditionalProbability * 100)}%
                      </span>
                      <span className="text-[13px]" style={{ color: SLATE }}>
                        {n.timeHorizon}
                      </span>
                    </div>
                    <p className="mt-2 text-[17px] font-medium leading-snug">{n.title}</p>
                    {(n.narrativeSummary || n.tripwires[0]) && (
                      <p className="mt-2 text-[16px] leading-relaxed line-clamp-3" style={{ color: SLATE }}>
                        {n.narrativeSummary || `Watch for: ${n.tripwires[0]}`}
                      </p>
                    )}
                    {n.causalDrivers.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {n.causalDrivers.slice(0, 2).map((d, di) => {
                          const label = typeof d === 'string' ? d : d.factor;
                          return (
                            <span
                              key={`${n.id}-driver-${di}`}
                              className="px-2 py-1 text-[13px] leading-none"
                              style={{ backgroundColor: '#E4E5E1', color: INK }}
                            >
                              {label.length > 42 ? `${label.slice(0, 40)}…` : label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {isRec && (
                      <p className="mt-2 text-sm font-semibold" style={{ color: BLUE }}>
                        Recommended path
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className={`mt-8 flex flex-wrap gap-3 ${revealed('futures')}`} style={{ transitionDelay: '450ms' }}>
              <button
                type="button"
                data-testid="recurse-deeper-btn"
                onClick={() => document.querySelector('[data-beat="vista"]')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}
                className="px-5 py-3 text-[15px] font-medium"
                style={{ backgroundColor: '#E4E5E1', color: INK }}
              >
                Show what happens next
              </button>
              <button
                type="button"
                data-testid="expand-wave-btn"
                onClick={() => document.querySelector('[data-beat="vista"]')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })}
                className="px-5 py-3 text-[15px] font-medium"
                style={{ backgroundColor: '#E4E5E1', color: INK }}
              >
                Reveal more possibilities
              </button>
            </div>
          </div>
        </section>

        {/* BEAT 5 — pure 3D vista + single CTA */}
        <section
          data-beat="vista"
          id="step-cta"
          aria-label="Enter the full simulator"
          className="relative z-10 flex min-h-[100dvh] flex-col items-start justify-end px-6 pb-20 sm:px-10 lg:px-16"
        >
          <div className={`mx-auto w-full max-w-[1320px] text-center ${revealed('vista')}`}>
            <p className={`mx-auto max-w-[24ch] font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] ${revealed('vista')}`}>
              Step inside. Bend the odds.
            </p>
            <Link
              href={simHref}
              data-testid="launch-observatory-btn"
              className={`mt-6 inline-block px-7 py-3.5 text-[17px] font-medium text-white ${revealed('vista')}`}
              style={{ backgroundColor: BLUE, transitionDelay: '150ms' }}
            >
              Open Full Simulator
            </Link>
          </div>
        </section>
      </main>

      <footer
        className="relative z-10 px-6 pb-10 pt-20 sm:px-10 lg:px-16"
        style={{ backgroundColor: GROUND }}
      >
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="grid grid-cols-2 gap-10 pt-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <p className="font-serif text-[21px] font-semibold leading-none tracking-[-0.01em]">HOROVEX</p>
              <p className="mt-3 max-w-[28ch] text-[13px] leading-relaxed" style={{ color: SLATE }}>
                Decision intelligence for the irreversible.
              </p>
            </div>
            <nav aria-label="Product">
              <p className="text-[13px] font-semibold" style={{ color: SLATE }}>Product</p>
              <ul className="mt-3 space-y-2 text-[14px]">
                <li><Link href="/observatory?demo=saas-pivot" className="transition-opacity hover:opacity-60">Causal Observatory</Link></li>
                <li><Link href="/demos/landscape" className="transition-opacity hover:opacity-60">Probability Landscape</Link></li>
                <li><Link href="/demos/instrument" className="transition-opacity hover:opacity-60">Horology Instrument</Link></li>
                <li><Link href="/demos/darkroom" className="transition-opacity hover:opacity-60">Dark Room Exhibit</Link></li>
              </ul>
            </nav>
            <nav aria-label="Flagship scenarios">
              <p className="text-[13px] font-semibold" style={{ color: SLATE }}>Scenarios</p>
              <ul className="mt-3 space-y-2 text-[14px]">
                <li><Link href="/observatory?demo=saas-pivot" className="transition-opacity hover:opacity-60">SaaS Enterprise Pivot</Link></li>
                <li><Link href="/observatory?demo=solo-ai" className="transition-opacity hover:opacity-60">Senior Tech to Solo AI</Link></li>
                <li><Link href="/observatory?demo=relocation" className="transition-opacity hover:opacity-60">Global Relocation</Link></li>
              </ul>
            </nav>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: SLATE }}>Method</p>
              <ul className="mt-3 space-y-2 text-[14px]" style={{ color: SLATE }}>
                <li>Bayesian mass conservation</li>
                <li>Bellman Golden Path solver</li>
                <li>60 FPS sensitivity levers</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 pt-6 text-[13px] tabular-nums sm:flex-row sm:items-center sm:justify-between" style={{ color: SLATE }}>
            <p>© {new Date().getFullYear()} HOROVEX Labs. All rights reserved.</p>
            <p>HOROVEX · Alabaster Sanctuary</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
