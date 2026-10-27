"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowUpRight, Compass, Sparkles, Orbit, Sliders, Shield, ChevronRight } from "lucide-react";
import { useMultiverseStore } from "@/lib/state/useMultiverseStore";
import { flagshipFounderSaaSPivot } from "@/tests/fixtures/mock-scenarios";
import { ProbabilityNode } from "@/lib/types/multiverse";

const MultiverseCanvas = dynamic(
  () => import("@/components/canvas/MultiverseCanvas"),
  { ssr: false }
);

export default function LandingPage() {
  useEffect(() => {
    const scenario = flagshipFounderSaaSPivot;
    const demoNodes: Record<string, ProbabilityNode> = {};
    demoNodes[scenario.rootNode.id] = scenario.rootNode;
    scenario.initialWave1.forEach((n) => {
      demoNodes[n.id] = n;
    });
    useMultiverseStore.getState().setNodes(demoNodes);
    useMultiverseStore.getState().setGoldenPath(scenario.expectedGoldenPathIds);
  }, []);
  // Commit the decorative hero canvas teardown synchronously on navigation
  // intent, before the route transition starts. Unmounting the R3F root
  // inside the transition races React 19 concurrent rendering (removeChild
  // crash, dropped client nav).
  const [heroAlive, setHeroAlive] = useState(true);
  useEffect(() => {
    const disarmHero = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest?.('a[href^="/observatory"]');
      if (anchor) flushSync(() => setHeroAlive(false));
    };
    document.addEventListener("click", disarmHero, true);
    return () => document.removeEventListener("click", disarmHero, true);
  }, []);
  const flagshipDemos = [
    {
      id: "saas-pivot",
      tag: "Founder Crossroads",
      title: "SaaS Enterprise Pivot vs. Self-Serve Bootstrap",
      context: "Founder with 14 months runway evaluating pivoting existing product to enterprise contracts vs. staying lean downmarket.",
      goldenPath: "Strategic Enterprise Pivot (28% Prob)",
      utilityScore: "+8.42 E[U]",
      branchesCount: 15,
      depth: "T+18mo",
      accent: "cyan",
    },
    {
      id: "solo-ai",
      tag: "Executive Career",
      title: "Senior Tech Lead to Solo AI Specialist",
      context: "Senior Staff Engineer with $350k liquid buffer deciding between staying for equity vesting vs. launching high-ticket advisory.",
      goldenPath: "High-Leverage Fractional CTO (38% Prob)",
      utilityScore: "+9.15 E[U]",
      branchesCount: 12,
      depth: "T+12mo",
      accent: "gold",
    },
    {
      id: "relocation",
      tag: "Sovereign Lifestyle",
      title: "Global Relocation & Sovereign Tax Optimization",
      context: "High-net-worth operator weighing UAE/Singapore relocation against distributed European tax residency.",
      goldenPath: "Dubai Sovereign Residency (46% Prob)",
      utilityScore: "+7.88 E[U]",
      branchesCount: 10,
      depth: "T+24mo",
      accent: "emerald",
    },
  ];

  return (
    <div className="relative min-h-screen bg-obsidian-vignette flex flex-col justify-between overflow-hidden">
      {/* 3D WebGL Background Canvas in Hero */}
      <div className="absolute inset-x-0 top-0 h-[800px] z-0 opacity-40 pointer-events-none overflow-hidden">
        {heroAlive ? (
          <MultiverseCanvas interactive={false} className="w-full h-full relative min-h-[600px] pointer-events-none" />
        ) : (
          <div className="w-full h-full relative min-h-[600px] bg-[#050507]" aria-hidden="true" />
        )}
      </div>
      {/* 1. Precision Luxury Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#050507]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-[#D4AF37]/40 bg-[#12100A] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              <Compass className="w-5 h-5 text-[#D4AF37] animate-chronometer-tick" />
            </div>
            <div>
              <span className="font-serif text-2xl tracking-wider text-white font-medium">HOROVEX</span>
              <span className="block font-mono text-[9px] tracking-widest text-[#94A3B8] uppercase">
                Precision Chronometric Decision Engine
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#94A3B8]">
            <a href="#observatory-preview" className="hover:text-white transition-colors">Observatory</a>
            <a href="#flagship-demos" className="hover:text-white transition-colors">Flagship Showcases</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.07] bg-white/[0.03] font-mono text-xs text-[#94A3B8]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>SYS NOMINAL • 60 FPS</span>
            </div>
            <Link
              href="/observatory"
              data-testid="launch-observatory-btn"
              className="px-5 py-2.5 rounded-xl border border-[#D4AF37]/50 bg-[#18150D] text-[#F3E5AB] text-sm font-medium hover:border-[#D4AF37] hover:bg-[#221D12] transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center gap-2 group"
            >
              <span>Launch Observatory</span>
              <ArrowUpRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Editorial Elegance & Spatial Intent */}
      <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#14120B] text-[#D4AF37] font-mono text-xs uppercase tracking-widest mb-8 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Obsidian Chronometry & Probability Phase Space</span>
        </div>

        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl tracking-tight text-white max-w-5xl leading-[1.08] mb-8">
          Precision Chronometric <br />
          <span className="text-gold-gradient italic">Multiverse Decision Engine</span>
        </h1>

        <p className="font-sans text-lg sm:text-xl text-[#94A3B8] max-w-3xl leading-relaxed mb-12">
          Model high-stakes crossroads across diverging probability trajectories. Simulate the 5 most probable futures,
          expand horizontally to 20+ possibilities across baseline, contrarian, and tail-risk regimes, and illuminate
          the <strong className="text-[#F3E5AB] font-medium">Golden Path</strong> with the AI Strategic Mentor.
        </p>

        {/* Quick Situation Command Console */}
        <div className="w-full max-w-3xl p-2 rounded-2xl glass-panel-elevated mb-6">
          <form
            action="/observatory"
            method="GET"
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <input
              type="text"
              name="prompt"
              placeholder="Enter a high-stakes dilemma (e.g. Pivot to enterprise vs. stay self-serve?)..."
              className="w-full px-5 py-4 rounded-xl bg-[#08080C] border border-white/[0.08] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#D4AF37]/60 focus:ring-1 focus:ring-[#D4AF37]/60 transition-all font-sans"
            />
            <button
              type="submit"
              className="w-full sm:w-auto whitespace-nowrap px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-black font-semibold text-sm hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2"
            >
              <span>Simulate Futures</span>
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </form>
        </div>

        {/* Suggested Crossroads Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-[#94A3B8]">
          <span className="text-[#64748B]">Quick Previews:</span>
          <Link
            href="/observatory?demo=saas-pivot"
            className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors"
          >
            Founder SaaS Pivot
          </Link>
          <Link
            href="/observatory?demo=solo-ai"
            className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors"
          >
            Senior Tech to Solo AI
          </Link>
          <Link
            href="/observatory?demo=relocation"
            className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] hover:border-[#10B981]/40 hover:text-[#10B981] transition-colors"
          >
            Global Relocation
          </Link>
        </div>
      </section>

      {/* 3. Flagship Multiverse Showcases */}
      <section id="flagship-demos" className="px-6 py-20 max-w-7xl mx-auto w-full border-t border-white/[0.07]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="font-mono text-xs tracking-widest uppercase text-[#D4AF37] block mb-2">Curated Trajectories</span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white">Flagship Multiverse Showcases</h2>
          </div>
          <p className="text-sm text-[#94A3B8] max-w-md mt-4 md:mt-0">
            Explore complete recursive probability trees generated with Bellman Expected Utility and the Golden Path solver.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {flagshipDemos.map((demo) => (
            <div
              key={demo.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between border border-white/[0.07] hover:border-[#D4AF37]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-[10px] uppercase text-[#94A3B8]">
                    {demo.tag}
                  </span>
                  <span className="font-mono text-xs text-[#D4AF37] font-semibold">{demo.utilityScore}</span>
                </div>
                <h3 className="font-sans text-lg font-semibold text-white mb-2 leading-snug">{demo.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">{demo.context}</p>
                <div className="p-3 rounded-xl bg-[#08080C] border border-[#D4AF37]/20 mb-6">
                  <span className="font-mono text-[10px] uppercase text-[#94A3B8] block mb-1">Golden Path Trajectory</span>
                  <span className="font-sans text-xs font-medium text-[#F3E5AB] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {demo.goldenPath}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#64748B]">
                  {demo.branchesCount} Branches • {demo.depth}
                </span>
                <Link
                  href={`/observatory?demo=${demo.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#D4AF37] hover:underline"
                >
                  <span>Explore Canvas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Architectural Feature Grid */}
      <section id="architecture" className="px-6 py-20 max-w-7xl mx-auto w-full border-t border-white/[0.07]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs tracking-widest uppercase text-[#00F0FF] block mb-2">Engine Architecture</span>
          <h2 className="font-serif text-3xl sm:text-5xl text-white mb-4">Rigorous Probabilistic Foundation</h2>
          <p className="text-sm text-[#94A3B8]">
            Zero generic chatbot advice. Built on Bayesian mass reservation, Bellman expected utility dynamic programming, and 60 FPS WebGL phase space.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl">
            <Orbit className="w-8 h-8 text-[#00F0FF] mb-4" />
            <h3 className="font-sans text-base font-semibold text-white mb-2">Recursive Branching</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              5 initial outcomes expanding to 10, 15, 20+ possibilities across Baseline, Contrarian, and Tail-Risk regimes, with infinite vertical recursion.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <Compass className="w-8 h-8 text-[#D4AF37] mb-4" />
            <h3 className="font-sans text-base font-semibold text-white mb-2">Golden Path Solver</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Dynamic programming Bellman backup computing risk-adjusted expected utility, reversibility scores, and 10-year regret minimization.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <Sliders className="w-8 h-8 text-[#8B5CF6] mb-4" />
            <h3 className="font-sans text-base font-semibold text-white mb-2">60 FPS Sensitivity Levers</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Client-side Softmax logit perturbation equations shifting sibling branch probabilities synchronously in &lt;16ms without LLM latency.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <Shield className="w-8 h-8 text-[#10B981] mb-4" />
            <h3 className="font-sans text-base font-semibold text-white mb-2">Wavefunction Collapse</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Reality Check-In marks realized real-world branches, prunes counterfactuals, and keeps your multiverses active over weeks and months.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Luxury Footer */}
      <footer className="border-t border-white/[0.07] bg-[#050507] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="text-[#94A3B8]">HOROVEX CHRONOMETRIC DECISION ENGINE v1.0</span>
          </div>
          <div>Next.js 15 • React Three Fiber • Supabase • Tailwind CSS</div>
          <div>© {new Date().getFullYear()} HOROVEX Labs. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
