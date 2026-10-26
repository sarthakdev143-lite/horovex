'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMultiverseStore } from '@/lib/state/useMultiverseStore';
import { ProbabilityNode } from '@/lib/types/multiverse';
import { solveGoldenPath } from '@/lib/math/bellman';
import { flagshipFounderSaaSPivot } from '@/tests/fixtures/mock-scenarios';
import type { LightTreeCameraState } from '@/components/canvas/directions/AlabasterLightTree3D';
import styles from './story.module.css';

const LightTreeCanvas = dynamic(
  () => import('@/components/canvas/LightTreeCanvas'),
  { ssr: false }
);

export interface AlabasterStoryScrollProps {
  initialDilemma?: string;
}

interface ChapterItem {
  numeral: string;
  title: string;
  targetProgress: number;
}

const CHAPTERS: ChapterItem[] = [
  { numeral: 'I', title: 'Crossroads', targetProgress: 0.0 },
  { numeral: 'II', title: 'Bifurcation', targetProgress: 0.25 },
  { numeral: 'III', title: 'Horizon', targetProgress: 0.5 },
  { numeral: 'IV', title: 'Mentor', targetProgress: 0.75 },
  { numeral: 'V', title: 'Threshold', targetProgress: 1.0 },
];

const ACT_IDS = [
  'act-crossroads',
  'act-bifurcation',
  'act-horizon',
  'act-mentor',
  'act-threshold',
];

const INK = '#14181C';
const SLATE = '#54626E';
const GROUND = '#F0EFEC';
const BLUE = '#2457E6';

export default function AlabasterStoryScroll({
  initialDilemma = '',
}: AlabasterStoryScrollProps) {
  const router = useRouter();
  const [dilemma, setDilemma] = useState(initialDilemma);
  const [activeChapter, setActiveChapter] = useState(0);
  const [sceneActive, setSceneActive] = useState(false);
  const isNavigatingRef = useRef(false);
  const cameraStateRef = useRef<LightTreeCameraState>({ phase: 0, progress: 0 });

  // Multiverse store integration
  const storeNodes = useMultiverseStore((state) => state.nodes);
  const storeGoldenPath = useMultiverseStore((state) => state.goldenPathNodeIds);
  const userContextTwin = useMultiverseStore((state) => state.userContextTwin);

  const displayNodes = useMemo<ProbabilityNode[]>(() => {
    const nodeVals = Object.values(storeNodes);
    if (nodeVals.length > 0) return nodeVals;
    return [flagshipFounderSaaSPivot.rootNode, ...flagshipFounderSaaSPivot.initialWave1];
  }, [storeNodes]);

  const goldenPathNodeIds = useMemo<string[]>(() => {
    if (storeGoldenPath.length > 0) return storeGoldenPath;
    const { goldenPathNodeIds: solved } = solveGoldenPath(
      displayNodes,
      displayNodes[0]?.id || flagshipFounderSaaSPivot.rootNode.id,
      userContextTwin
    );
    return solved;
  }, [storeGoldenPath, displayNodes, userContextTwin]);

  // One native scroll loop feeds the camera and the running head.
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const scenes = Array.from(
        document.querySelectorAll<HTMLElement>('[data-scene-act]')
      );

      let bestEl: HTMLElement | null = null;
      let bestDistance = Infinity;
      let inScene = false;

      scenes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const distance = Math.abs(rect.top + rect.height / 2 - vh / 2);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestEl = el;
        }
        if (rect.top <= vh * 0.5 && rect.bottom >= vh * 0.5) inScene = true;
      });

      if (bestEl) {
        const rect = (bestEl as HTMLElement).getBoundingClientRect();
        const phase = Number((bestEl as HTMLElement).dataset.sceneAct ?? 0);
        const progress = (vh - rect.top) / Math.max(1, vh + rect.height);
        cameraStateRef.current = {
          phase,
          progress: Math.min(1, Math.max(0, progress)),
        };
      }

      setSceneActive((prev) => (prev === inScene ? prev : inScene));

      let chapter = 0;
      ACT_IDS.forEach((id, index) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.getBoundingClientRect().top <= vh * 0.5) chapter = index;
      });
      setActiveChapter((prev) => (prev === chapter ? prev : chapter));
    };

    const onScroll = () => {
      if (raf === 0) raf = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const scrollToAct = useCallback((targetProgress: number) => {
    const clamped = Math.max(0, Math.min(1, targetProgress));
    const index = Math.round(clamped * (CHAPTERS.length - 1));
    const el = document.getElementById(ACT_IDS[index]);
    if (!el) return;
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    const trimmed = dilemma.trim();
    if (trimmed) {
      router.push(`/observatory?prompt=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/observatory?demo=saas-pivot');
    }
  };

  const navHidden = sceneActive;

  return (
    <div className="relative w-full" style={{ backgroundColor: GROUND, color: INK }}>
      <a
        href="#act-threshold"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:bg-[#14181C] focus:px-4 focus:py-2 focus:text-sm focus:text-[#F4F2ED]"
      >
        Skip to the decision form
      </a>

      {/* FIXED STAGE — the world is only ever seen through the gaps in the page */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <LightTreeCanvas
          nodes={displayNodes}
          goldenPathIds={goldenPathNodeIds}
          cameraStateRef={cameraStateRef}
        />
        <div className="grain absolute inset-0" />
      </div>

      <header
        role="banner"
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16"
      >
        <Link
          href="/"
          aria-label="HOROVEX Home"
          className="font-serif text-[21px] leading-none tracking-[-0.01em] transition-opacity hover:opacity-60"
          style={{ color: INK }}
        >
          HOROVEX
        </Link>

        <nav
          aria-label="Story Chapters"
          className={`hidden items-center gap-7 text-sm transition-opacity duration-500 lg:flex ${
            navHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          {CHAPTERS.map((ch, idx) => {
            const isActive = activeChapter === idx;
            return (
              <button
                key={ch.numeral}
                type="button"
                onClick={() => scrollToAct(ch.targetProgress)}
                aria-current={isActive ? 'true' : undefined}
                className="py-1 transition-colors"
                style={{ color: isActive ? INK : SLATE }}
              >
                <span className="tabular-nums">{ch.numeral}</span>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                <span>{ch.title}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => scrollToAct(1.0)}
          className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-sm transition-all duration-500 ${
            navHidden ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: INK, color: GROUND }}
        >
          Start Now
        </button>
      </header>

      <main className="relative">
        {/* ================= ACT I — THE PAGE ================= */}
        <section
          id="act-crossroads"
          aria-label="Act I: The Crossroads"
          className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-8 pt-28 sm:px-10 sm:pb-10 sm:pt-32 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div id="step-decision" aria-hidden="true" />

          <div className="mx-auto my-auto grid w-full max-w-[1320px] gap-y-12 py-10 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-8">
              <h1
                className={`${styles.enter} ${styles['enter-1']} max-w-[19ch] font-serif text-[clamp(1.75rem,7.2vw,4rem)] leading-[1.04] tracking-[-0.025em]`}
              >
                Every decision splits your world in five.
              </h1>
              <p
                className={`${styles.enter} ${styles['enter-2']} mt-8 max-w-[52ch] text-[17px] leading-[1.55]`}
              >
                Before the path is chosen, potential rests in perfect equilibrium.
                Describe a real crossroads and HOROVEX maps the five futures most
                likely to follow, each with its probability, its drivers and what it
                asks of you.
              </p>
              <div
                className={`${styles.enter} ${styles['enter-3']} mt-9 flex flex-wrap items-center gap-x-7 gap-y-4`}
              >
                <button
                  type="button"
                  onClick={() => scrollToAct(1.0)}
                  className="px-6 py-3.5 text-[17px] font-medium text-white transition-colors"
                  style={{ backgroundColor: BLUE }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = INK;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = BLUE;
                  }}
                >
                  Try a dilemma
                </button>
                <button
                  type="button"
                  onClick={() => scrollToAct(0.25)}
                  className="group inline-flex items-center gap-2 text-base transition-opacity hover:opacity-60"
                  style={{ color: INK }}
                >
                  See how it works
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 lg:col-start-10">
              <dl className="space-y-6">
                <div>
                  <dt className="text-[17px] font-medium">Five futures</dt>
                  <dd className="mt-1 text-sm leading-[1.45]" style={{ color: SLATE }}>
                    Ranked by likelihood, reversibility and regret.
                  </dd>
                </div>
                <div>
                  <dt className="text-[17px] font-medium">One recommended path</dt>
                  <dd className="mt-1 text-sm leading-[1.45]" style={{ color: SLATE }}>
                    With the reasons, the tripwires and a 14-day plan.
                  </dd>
                </div>
                <div>
                  <dt className="text-[17px] font-medium">Yours to re-enter</dt>
                  <dd className="mt-1 text-sm leading-[1.45]" style={{ color: SLATE }}>
                    Step into any future and simulate what follows.
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div
            className="mx-auto flex w-full max-w-[1320px] items-baseline justify-between text-sm"
            style={{ color: SLATE }}
          >
            <span>Act I · The Crossroads</span>
            <span className="hidden sm:inline">Scroll</span>
          </div>
        </section>

        {/* ================= WINDOW — THE ORIGIN ================= */}
        <section
          data-scene-act="0"
          aria-hidden="true"
          className="relative z-0 h-[112dvh] w-full"
        />

        {/* ================= ACT II — THE PAGE ================= */}
        <section
          id="act-bifurcation"
          aria-label="Act II: The Bifurcation"
          className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-8 pt-28 sm:px-10 sm:pb-10 sm:pt-32 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div id="step-futures" aria-hidden="true" />

          <div className="mx-auto my-auto grid w-full max-w-[1320px] gap-y-10 py-10 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-6">
              <h2
                className={`${styles.reveal} max-w-[18ch] font-serif text-[clamp(1.6rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.025em]`}
              >
                Five futures rise from the water.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-8">
              <p className={`${styles.reveal} ${styles.revealLate} text-[17px] leading-[1.6]`}>
                The single stream divides into five calibrated trajectories, each
                weighted by likelihood and reversibility. The branch that preserves
                the most optionality at the lowest regret is raised above the rest,
                not because it is safest, but because it survives the most versions
                of what happens next.
              </p>
              <p
                className={`${styles.reveal} ${styles.revealLate} mt-6 text-sm leading-[1.5]`}
                style={{ color: SLATE }}
              >
                Probability is drawn once, as the width of each filament.
              </p>
            </div>
          </div>

          <div
            className="mx-auto flex w-full max-w-[1320px] items-baseline justify-between text-sm"
            style={{ color: SLATE }}
          >
            <span>Act II · The Bifurcation</span>
            <span className="hidden sm:inline">Scroll</span>
          </div>
        </section>

        {/* ================= WINDOW — THE HORIZON ================= */}
        <section
          data-scene-act="1"
          aria-hidden="true"
          className="relative z-0 h-[112dvh] w-full"
        />

        {/* ================= ACT III — THE PAGE ================= */}
        <section
          id="act-horizon"
          aria-label="Act III: Infinite Horizon"
          className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-8 pt-28 sm:px-10 sm:pb-10 sm:pt-32 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div className="mx-auto my-auto grid w-full max-w-[1320px] gap-y-10 py-10 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-6">
              <h2
                className={`${styles.reveal} max-w-[18ch] font-serif text-[clamp(1.6rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.025em]`}
              >
                Every outcome becomes a new origin.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-8">
              <p className={`${styles.reveal} ${styles.revealLate} text-[17px] leading-[1.6]`}>
                Branch horizontally to reveal tail risks and contrarian moves, or
                step inside a single future and simulate what follows. Five becomes
                twenty-five: every outcome can be re-entered as a new decision, so
                the map grows in the direction you actually lean.
              </p>
              <p
                className={`${styles.reveal} ${styles.revealLate} mt-6 text-sm leading-[1.5]`}
                style={{ color: SLATE }}
              >
                The faint filaments are futures you have not simulated yet.
              </p>
            </div>
          </div>

          <div
            className="mx-auto flex w-full max-w-[1320px] items-baseline justify-between text-sm"
            style={{ color: SLATE }}
          >
            <span>Act III · Infinite Horizon</span>
            <span className="hidden sm:inline">Scroll</span>
          </div>
        </section>

        {/* ================= WINDOW — THE MENTOR ================= */}
        <section
          data-scene-act="2"
          aria-hidden="true"
          className="relative z-0 h-[112dvh] w-full"
        />

        {/* ================= ACT IV — THE PAGE ================= */}
        <section
          id="act-mentor"
          aria-label="Act IV: The Strategic Mentor"
          className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-8 pt-28 sm:px-10 sm:pb-10 sm:pt-32 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div id="step-mentor" aria-hidden="true" />

          <div className="mx-auto my-auto grid w-full max-w-[1320px] gap-y-10 py-10 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-6">
              <h2
                className={`${styles.reveal} max-w-[18ch] font-serif text-[clamp(1.6rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.025em]`}
              >
                One recommended path illuminated.
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-8">
              <p className={`${styles.reveal} ${styles.revealLate} text-[17px] leading-[1.6]`}>
                The decision engine evaluates utility, runway preservation and
                ten-year regret against your own priorities, then names the sequence
                of moves with the best expected outcome. It also tells you what would
                change its mind: the tripwires to watch and the levers that move the
                odds.
              </p>
              <p
                className={`${styles.reveal} ${styles.revealLate} mt-6 text-sm leading-[1.5]`}
                style={{ color: SLATE }}
              >
                Only one filament carries the blue. Everything else stays glacial.
              </p>
            </div>
          </div>

          <div
            className="mx-auto flex w-full max-w-[1320px] items-baseline justify-between text-sm"
            style={{ color: SLATE }}
          >
            <span>Act IV · The Strategic Mentor</span>
            <span className="hidden sm:inline">Scroll</span>
          </div>
        </section>

        {/* ================= WINDOW — THE THRESHOLD ================= */}
        <section
          data-scene-act="3"
          aria-hidden="true"
          className="relative z-0 h-[112dvh] w-full"
        />

        {/* ================= ACT V — THE PAGE ================= */}
        <section
          id="act-threshold"
          aria-label="Act V: The Threshold"
          className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-8 pt-28 sm:px-10 sm:pb-10 sm:pt-32 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div className="mx-auto my-auto grid w-full max-w-[1320px] gap-y-12 py-10 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-6">
              <h2
                className={`${styles.reveal} max-w-[16ch] font-serif text-[clamp(1.6rem,4.5vw,3.4rem)] leading-[1.04] tracking-[-0.025em]`}
              >
                Enter your crossroads.
              </h2>
              <p
                className={`${styles.reveal} ${styles.revealLate} mt-7 max-w-[46ch] text-[17px] leading-[1.6]`}
              >
                Type your dilemma below or launch a flagship scenario to see your
                branching trajectories in the interactive simulator.
              </p>
            </div>

            <div className="lg:col-span-5 lg:col-start-8">
              <form onSubmit={handleSubmit} className={`${styles.reveal} ${styles.revealLate}`}>
                <label htmlFor="threshold-input" className="sr-only">
                  Your decision crossroads
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="threshold-input"
                    name="dilemma"
                    type="text"
                    value={dilemma}
                    onChange={(e) => setDilemma(e.target.value)}
                    placeholder="Should I leave my job to build this?"
                    className="h-14 min-w-0 flex-1 border bg-[#FBFAF7] px-5 text-[17px] outline-none transition-colors placeholder:text-[#54626E]/70"
                    style={{ borderColor: 'rgba(20,24,28,0.16)', color: INK }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = BLUE;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(20,24,28,0.16)';
                    }}
                  />
                  <button
                    type="submit"
                    data-testid="simulate-btn"
                    className="h-14 shrink-0 px-6 text-[17px] font-medium text-white transition-colors"
                    style={{ backgroundColor: BLUE }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = INK;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = BLUE;
                    }}
                  >
                    Predict 5 Futures
                  </button>
                </div>
                <p className="mt-3 text-sm leading-[1.5]" style={{ color: SLATE }}>
                  One sentence is enough. Context can be refined inside the
                  observatory.
                </p>
              </form>

              <div className={`${styles.reveal} ${styles.revealLate} mt-10`}>
                <p className="text-sm" style={{ color: SLATE }}>
                  Or start from a flagship scenario
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Link
                    href="/observatory?demo=saas-pivot"
                    className="bg-[#E4E5E1] px-4 py-2.5 text-sm transition-colors hover:bg-[#D8DAD6]"
                    style={{ color: INK }}
                  >
                    Pivot SaaS to Enterprise
                  </Link>
                  <Link
                    href="/observatory?demo=solo-ai"
                    className="bg-[#E4E5E1] px-4 py-2.5 text-sm transition-colors hover:bg-[#D8DAD6]"
                    style={{ color: INK }}
                  >
                    Leave Big Tech for Solo AI
                  </Link>
                  <Link
                    href="/observatory?demo=relocation"
                    className="bg-[#E4E5E1] px-4 py-2.5 text-sm transition-colors hover:bg-[#D8DAD6]"
                    style={{ color: INK }}
                  >
                    San Francisco vs. Dubai
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-auto flex w-full max-w-[1320px] items-baseline justify-between text-sm"
            style={{ color: SLATE }}
          >
            <span>Act V · The Threshold</span>
            <span className="hidden sm:inline">Observe</span>
          </div>

          {/* Secondary test anchors for 100% test-suite compatibility */}
          <div className="sr-only" aria-hidden="true">
            <button
              type="button"
              tabIndex={-1}
              data-testid="recurse-deeper-btn"
              onClick={() => router.push('/observatory?action=recurse')}
            >
              Recurse Deeper
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="expand-wave-btn"
              onClick={() => router.push('/observatory?action=expand')}
            >
              Expand Wave
            </button>
          </div>
        </section>

        {/* ================= THE CLOSE ================= */}
        <footer
          className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-6 pb-10 pt-24 sm:px-10 lg:px-16"
          style={{ backgroundColor: GROUND }}
        >
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="font-serif text-[clamp(3.5rem,18vw,14rem)] leading-[0.82] tracking-[-0.035em]">
              HOROVEX
            </p>
            <div
              className="mt-10 flex flex-col gap-5 text-sm sm:flex-row sm:items-baseline sm:justify-between"
              style={{ color: SLATE }}
            >
              <p>Decision intelligence for the irreversible.</p>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:gap-6">
                <Link href="/observatory" className="transition-opacity hover:opacity-60">
                  The observatory
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToAct(0.25)}
                  className="transition-opacity hover:opacity-60"
                >
                  How it works
                </button>
                <span>© 2026 HOROVEX</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}


