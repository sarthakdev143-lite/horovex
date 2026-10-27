# Project: HOROVEX (Precision Chronometric Multiverse Decision Engine)

## Architecture
HOROVEX is an ultra-luxury 3D AI Multiverse Probability Simulator and Strategic Decision Engine SaaS built with Next.js 15 (App Router, TypeScript), React 19, Three.js / React Three Fiber, Tailwind CSS, Framer Motion, and Supabase.

### System Layering
1. **Presentation & Spatial 3D Layer**:
   - Next.js 15 App Router (`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/observatory/page.tsx`).
   - Obsidian Chronometry aesthetic: `#050507` obsidian void, `#D4AF37` champagne gold, spectral probability filaments (`#00F0FF`, `#10B981`, `#8B5CF6`, `#F43F5E`), glassmorphism, hairline metallic borders, and typography (*Instrument Serif*, *Plus Jakarta Sans*, *JetBrains Mono*).
   - React Three Fiber / Three.js 3D Causal Observatory: dynamic particle void, glowing orbital rings, depth strata, bioluminescent spline filaments, and conical coordinate layout with collision solver ($d_{\min} \ge 3.2$).
   - Synchronized 2D Chronicle Matrix view + WCAG AA keyboard accessibility.
2. **State & Real-Time Physics Layer**:
   - Hybrid Zustand store (`useMultiverseStore`): decoupled reactive state slice (for React DOM HUDs, telemetry panels, modals) and transient 3D physics refs (for 60 FPS WebGL frame loop and GLSL uniforms).
   - 60 FPS client-side Softmax logit perturbation engine for the 4 Sensitivity Levers (`Execution Velocity`, `Capital Buffer`, `Market Tailwind`, `Skill Preparation`) running with $<16$ms latency.
3. **Simulation & Probability Engine Layer**:
   - Adaptive Pre-Simulation Calibration ("The Clarifying Pulse"): 3 questions for low-entropy/ambiguous inputs with 1-click "Skip & Fast-Track" bypass.
   - Wave 1 Baseline Generator (Top 5 outcomes, ~80% mass, $\alpha_1 = 0.80$, $M_{\text{unexplored}}^{(1)} = 0.20$).
   - Horizontal Expansion Engine (`+5 More Possibilities`): Waves 2 (Contrarian) and 3+ (Tail-Risk / Black Swan) strictly conserving total probability mass ($\sum P_i + M_{\text{unexplored}} = 1.0$).
   - Infinite Vertical Recursion: Ancestral `ltree` conditioning supporting Passive Auto-Projection ($\eta = 0.40$) and Active Action Injection ($\eta = 0.80$) with path multiplication $P_{\text{cum}} = \prod P_i$.
   - Conical Orbital Layout solver with 15-iteration force-repulsion collision solver guaranteeing $d_{\min} \ge 3.2$.
4. **Decision Intelligence & Strategic Mentor Layer**:
   - Personal Context Digital Twin ("The Vault"): risk appetite, runway months, 6D core values.
   - Multi-Objective Node Utility Scorer $U(n)$ combining 6D value alignment, Reversibility Score ($\lambda_{\text{rev}} = 0.35$), and Regret Minimization ($\lambda_{\text{regret}} = 0.45$).
   - Bellman Expected Utility Golden Path Solver: recursive value backup $V^*(n)$ with risk-adjusted $Q(n, c)$ and greedy policy extraction illuminating the optimal path in `#D4AF37` gold.
   - Strategic Advisory Engine: Executive Verdict, Why This Path Wins, Blindspots Detected, Pre-Mortem Hedge Plan, 14-Day Actionable Playbook, and 30/60/90-Day Observable Tripwires.
5. **Living Timeline & Reality Calibration**:
   - Reality Check-In ("Collapse the Wavefunction"): marks realized nodes, prunes counterfactual branches, and advances active root origin.
6. **Multi-Provider AI & Dual Persistence Layer**:
   - Unified AI Adapter supporting OpenAI, Gemini, and Anthropic APIs.
   - Built-in intelligent, context-aware deterministic simulation fallback engine so every feature functions 100% reliably out of the box with zero external API keys.
   - Supabase PostgreSQL schema with `ltree`, `pgvector`, and strict RLS, paired with instant Guest Sandbox localStorage mode.

---

## Code Layout
```
future-predictor/
├── src/
│   ├── app/
│   │   ├── globals.css                # Obsidian Chronometry styling, CSS variables, typography
│   │   ├── layout.tsx                 # Root layout with fonts, metadata, providers
│   │   ├── page.tsx                   # Luxury 3D Hero Landing & Curated Flagship Showcases
│   │   ├── observatory/
│   │   │   └── page.tsx               # Full-screen 3D Alabaster Sanctuary workspace
│   │   ├── demos/
│   │   │   └── [direction]/page.tsx   # Interactive art-direction demo route
│   │   └── api/
│   │       └── simulations/
│   │           ├── calibrate/route.ts       # Adaptive Clarifying Pulse API
│   │           ├── generate-wave/route.ts   # Streaming Wave Generator (+5 & Vertical)
│   │           ├── [id]/mentor/route.ts     # Bellman Golden Path & Strategic Synthesis API
│   │           └── [id]/collapse/route.ts   # Wavefunction Collapse API
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── DirectionCanvas.tsx    # Art-direction router (sanctuary/landscape/instrument/darkroom)
│   │   │   ├── LightTreeCanvas.tsx    # Landing scroll-story filament canvas
│   │   │   ├── directions/            # Per-direction 3D scenes (AlabasterSanctuary3D, …)
│   │   │   ├── MultiverseCanvas.tsx   # R3F Canvas wrapper with client-only dynamic loading
│   │   │   ├── MultiverseScene.tsx    # Scene manager, lights, environment, camera controls
│   │   │   ├── ProbabilityFilament.tsx# Custom spline filaments with bioluminescent pulses
│   │   │   ├── ProbabilityNode3D.tsx  # 3D Node sphere, holographic ring, status halos
│   │   │   └── VoidBackground.tsx     # Obsidian particle starfield and chronometric rings
│   │   ├── hud/
│   │   │   ├── TopChronometerBar.tsx  # Telemetry bar, zoom controls, 2D matrix toggle
│   │   │   ├── NodeInspectionHUD.tsx  # Slide-over telemetry panel for selected nexus
│   │   │   ├── SensitivityLeversHUD.tsx # 4 real-time 60 FPS probability sliders
│   │   │   ├── MentorAdvisoryHUD.tsx  # Golden Path verdict, blindspots, hedge, playbook
│   │   │   ├── ClarifyingPulseModal.tsx # 3-question adaptive calibration modal
│   │   │   ├── DigitalTwinModal.tsx   # Personal Context Twin vault editor
│   │   │   ├── RealityCheckInModal.tsx# Wavefunction collapse dialogue
│   │   │   └── ChronicleMatrixView.tsx# Synchronized 2D matrix comparison overlay
│   │   ├── observatory/               # Sanctuary HUD (header, controls, drawers, matrix overlay)
│   │   │   ├── directions/                # Landing story scroll + art-direction demos
│   │   ├── landing/
│   │   │   ├── LuxuryHeroSection.tsx  # 3D orbital chronometry hero
│   │   │   ├── FlagshipDemoShowcase.tsx # 3 curated showcase multiverse cards
│   │   │   └── LuxuryFeatureGrid.tsx  # Architectural capabilities breakdown
│   │   └── ui/                        # Reusable luxury UI primitives (buttons, sliders, cards)
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── adapter.ts             # Multi-provider AI router (Gemini, OpenAI, Anthropic)
│   │   │   └── deterministic-fallback.ts # Intelligent context-aware simulation engine
│   │   ├── math/
│   │   │   ├── bayesian.ts            # Mass reservation (alpha_w) and conservation engine
│   │   │   ├── bellman.ts             # Expected utility, value backup & Golden Path solver
│   │   │   ├── sensitivity.ts         # Softmax logit perturbation equations (<16ms)
│   │   │   └── spatial-layout.ts      # Conical 3D coordinate solver with relaxation (d_min >= 3.2)
│   │   ├── state/
│   │   │   ├── useMultiverseStore.ts  # Hybrid Zustand store (reactive graph + transient refs)
│   │   │   └── guest-sandbox.ts       # Local storage persistence for Guest Sandbox mode
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server Supabase client
│   │   │   └── schema.sql             # Complete DDL with ltree, RLS, functions, triggers
│   │   └── types/
│   │       ├── database.ts            # Database entity definitions
│   │       ├── multiverse.ts          # Core domain models (nodes, waves, vectors, status)
│   │       └── schemas.ts             # Zod validation schemas
│   └── tests/
│       ├── unit/                      # Fast Vitest unit tests (< 250 MB RAM)
│       │   ├── bayesian.test.ts       # Probability mass conservation invariants
│       │   ├── bellman.test.ts        # Golden Path Bellman optimality & monotonicity
│       │   ├── sensitivity.test.ts    # Softmax logit shifts & epsilon guards
│       │   └── spatial-layout.test.ts # 3D collision solver & d_min >= 3.2 invariant
│       ├── integration/               # Integration tests for store, fallback AI, API routes
│       └── e2e/                       # Playwright browser E2E test suite (Tiers 1-5)
├── docs/                              # Architecture documentation (PRD, HLD, LLD, ROADMAP)
├── package.json                       # Next.js 15, React 19, Three.js 0.186, R3F 9.8, Vitest, Playwright
├── tsconfig.json                      # Strict TypeScript configuration
├── vitest.config.ts                   # Vitest config with JSDOM
├── playwright.config.ts               # Playwright config for WebGL & browser tests
└── tailwind.config.ts                 # Obsidian Chronometry color palette & fonts
```

---

## Feature Inventory
Every feature identified during the authoritative survey is cataloged and assigned to a specific milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Obsidian Chronometry Design System | Color palette (`#050507`, `#D4AF37`, spectrals), glassmorphism, *Instrument Serif*, *Plus Jakarta Sans*, *JetBrains Mono* | M1 | `PRD.md` §2.1, `ORIGINAL_REQUEST.md` R1 |
| 2 | Luxury 3D Hero Landing Experience | 3D chronometric hero canvas with interactive orbital particle animation and seamless transition into Observatory | M1 | `ORIGINAL_REQUEST.md` R1, `docs/README.md` |
| 3 | 3D WebGL Causal Observatory Core | Full-screen React Three Fiber viewport with orbital rings, depth strata, and responsive camera navigation | M1 | `HLD.md` §3.2, `PRD.md` §2.1 |
| 4 | Bioluminescent Probability Filaments | Bezier spline tubes in 3D connecting parent to child with thickness/opacity proportional to $P(B \mid A)$ | M1 | `HLD.md` §3.2, `LLD.md` §5 |
| 5 | Synchronized 2D Chronicle Matrix View | High-contrast accessible tabular matrix comparison overlay for side-by-side branch evaluation | M4 | `HLD.md` §5, `PRD.md` §2.1 |
| 6 | WCAG AA Accessibility & Reduced Motion Mode | Keyboard tree traversal via `Arrow` keys and instant camera framing for users with `prefers-reduced-motion` | M1 | `HLD.md` §5 |
| 7 | Adaptive Clarifying Pulse | Evaluates situation input entropy; prompts 3 clarifying questions for ambiguous inputs with 1-click Skip button | M2 | `PRD.md` §4.1, `LLD.md` §3 |
| 8 | 1-Click Calibration Fast-Track ("Skip") | Allows users to bypass clarifying questions and launch Wave 1 generation immediately | M2 | `ORIGINAL_REQUEST.md` R2.1 |
| 9 | Wave 1 Baseline Generator (Top 5 Probabilities) | Generates top 5 mutually distinct future outcomes with 80% explored mass ($\alpha_1 = 0.80$) and causal drivers | M2 | `PRD.md` §4.2, `LLD.md` §2.1 |
| 10 | Horizontal Expansion (`+5 More Possibilities`) | Expands node horizontally by 5 sibling outcomes across Waves 2 (Contrarian) and 3+ (Tail-Risk) with mass conservation | M2 | `PRD.md` §4.2, `LLD.md` §2.1 |
| 11 | Infinite Vertical Recursion | Deep-dives into any node at depth $d$ to project 5 child futures at depth $d+1$ ($T_0 \to T_1 \to \dots \to T_n$) | M2 | `PRD.md` §4.2, `LLD.md` §1 |
| 12 | Passive Auto-Projection Mode | Automatically projects natural child futures under selected outcome with agency $\eta = 0.40$ | M2 | `PRD.md` §4.2, `ORIGINAL_REQUEST.md` R2.4 |
| 13 | Active Action Injection Mode | Injects user-specified intervention move before generating child futures with agency $\eta = 0.80$ | M2 | `PRD.md` §4.2, `ORIGINAL_REQUEST.md` R2.4 |
| 14 | Cumulative Path Probability Engine | Computes $P_{\text{cum}}(n_d) = \prod_{k=1}^d P(n_k \mid n_{k-1})$ along ancestral spine with monotonic decrease | M2 | `LLD.md` §2.1, `ORIGINAL_REQUEST.md` Criterion 4 |
| 15 | 3D Conical Orbital Layout & Collision Solver | Computes 3D coordinates ($Z$ = depth, $\theta$ = sibling fanning, $Y$ = utility elevation, $R$ = wave radius) with $d_{\min} \ge 3.2$ | M2 | `LLD.md` §2.4, `ORIGINAL_REQUEST.md` Criterion 2 |
| 16 | Personal Context Digital Twin ("The Vault") | User profile configuring risk appetite, financial runway, and 6 core value weights in $[-10, +10]$ | M3 | `PRD.md` §4.1, `LLD.md` §1 |
| 17 | Multi-Objective Node Utility Scorer | Calculates utility $U(n)$ combining 6D alignment, Reversibility Score ($\lambda_{\text{rev}}=0.35$), and Regret Minimization ($\lambda_{\text{regret}}=0.45$) | M3 | `LLD.md` §2.2 |
| 18 | Bellman Expected Utility Golden Path Solver | Dynamic programming solver computing risk-adjusted $Q(n, c)$ and illuminating contiguous path in `#D4AF37` gold | M3 | `LLD.md` §2.2, `ORIGINAL_REQUEST.md` Criterion 1 |
| 19 | Curated Flagship Multiverse Showcases | 3 instant pre-populated multiverse showcases: Founder SaaS Pivot, Senior Tech to Solo AI, Global Relocation | M3 | `ROADMAP.md` Phase 5, `ORIGINAL_REQUEST.md` R1 |
| 20 | Strategic Mentor Executive Advisory | Provides Executive Verdict, Why This Path Wins, Blindspots Detected (2-5), and Pre-Mortem Hedge Plan | M3 | `PRD.md` §4.3, `LLD.md` §3 |
| 21 | 14-Day Actionable Playbook | Windowed execution plan (Days 1-3, 4-7, 8-14) with concrete milestones and odds shift percentages | M3 | `PRD.md` §4.3, `LLD.md` §3 |
| 22 | 30/60/90-Day Observable Tripwires | Measurable real-world sensory tripwires signaling which future branch is unfolding | M3 | `PRD.md` §4.3, `LLD.md` §3 |
| 23 | Real-Time 60 FPS Sensitivity Levers | 4 interactive sliders (`Execution Velocity`, `Capital Buffer`, `Market Tailwind`, `Skill Preparation`) with Softmax logit shift (<16ms) | M4 | `LLD.md` §2.3, `ORIGINAL_REQUEST.md` Criterion 2 |
| 24 | Reality Check-In ("Collapse Wavefunction") | Marks realized real-world node, prunes counterfactual sibling branches, and advances active root origin | M4 | `PRD.md` §4.4, `LLD.md` §1 & §4 |
| 25 | Unified Multi-Provider AI Adapter | AI router supporting Gemini, OpenAI, and Anthropic API keys with auto-selection and streaming | M4 | `docs/README.md`, `LLD.md` §5 |
| 26 | Intelligent Deterministic Fallback Engine | Context-aware simulation engine generating high-quality waves and Golden Path with zero API keys | M4 | `ORIGINAL_REQUEST.md` R4, `docs/README.md` |
| 27 | Progressive Streaming Materialization | SSE / NDJSON streaming of node waves so Node 1 crystallizes in 3D in $< 1.8$s | M4 | `HLD.md` §1 & §3.3 |
| 28 | Supabase Relational & `ltree` Persistence | Persists profiles, context twins, simulations, nodes, mentor syntheses, and check-ins with RLS | M4 | `LLD.md` §1, `ORIGINAL_REQUEST.md` R4 |
| 29 | Instant Guest Sandbox Mode | Allows immediate exploration and simulation without authentication using local storage sync | M4 | `docs/README.md`, `HLD.md` §4 |
| 30 | Executive Decision Dossier Export | Generates formatted Markdown / PDF / Notion executive brief summarizing the dilemma, Golden Path, and playbook | M4 | `PRD.md` §5, `ROADMAP.md` Phase 5 |
| 31 | SaaS Tier Gating & Quota Guard | Enforces tier boundaries (Observer, Strategist, Oracle) with polite upgrade prompts | M4 | `PRD.md` §5 |
| 32 | Full E2E Test Suite (Tiers 1-4) & Adversarial Hardening (Tier 5) | Comprehensive requirement-driven opaque-box test suite + white-box adversarial testing verifying all invariants | M5 | `ORIGINAL_REQUEST.md` Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation & Obsidian Chronometry 3D Observatory | Bootstrap Next.js 15, React 19, Three.js, R3F, Tailwind CSS, Obsidian theme, R3F Canvas, bioluminescent filaments, camera controller, Vitest test harness, and Git workflow setup | none | DONE |
| M2 | Multiverse Recursion Engine & 3D Conical Layout | Implement Clarifying Pulse, Wave 1 generator, Horizontal Expansion `+5 More`, Infinite Vertical Recursion, cumulative probability engine, and 3D conical layout with collision solver ($d_{\min} \ge 3.2$) | M1 | DONE |
| M3 | Strategic Mentor Engine & Golden Path Solver | Implement Digital Twin vault, Multi-Objective Utility $U(n)$, Bellman Expected Utility solver, Golden Path tracer in `#D4AF37`, Strategic Advisory HUD, 14-Day Playbook, Tripwires, and 3 Flagship Demos | M2 | DONE |
| M4 | Sensitivity Levers, Wavefunction Collapse & Dual Persistence | Implement 60 FPS Softmax logit levers, Reality Check-In wavefunction collapse, Multi-Provider AI adapter + deterministic fallback engine, Supabase SQL schema + Guest Sandbox, 2D Chronicle Matrix, and Dossier Export | M3 | DONE |
| M5 | Final Milestone: Full E2E Test Pass & Adversarial Hardening | Phase 1: Pass 100% of E2E Test Suite (Tiers 1-4). Phase 2: Tier 5 Adversarial Coverage Hardening with Challenger -> Worker -> Reviewer loop | M4, TEST_READY.md | DONE |
| M6 | Alabaster Sanctuary live | White/blue tower sanctuary + light-tree scroll story on `/` + `/observatory` (user-confirmed look); obsidian files kept dormant, E2E re-aimed at sanctuary CTAs | M5 | DONE |

---

## Interface Contracts

### 1. Multiverse Data Models & Types (`src/lib/types/multiverse.ts`)
```typescript
export type NodeRegimeTier = 'root' | 'baseline_wave_1' | 'contrarian_wave_2' | 'tail_risk_wave_3_plus';
export type ReversibilityDoorType = 'type_1_irreversible' | 'type_2_reversible' | 'hybrid';
export type NodeLifecycleStatus = 'active' | 'realized' | 'pruned' | 'archived';

export interface ImpactVector {
  wealth: number;     // [-10.0, +10.0]
  autonomy: number;   // [-10.0, +10.0]
  mastery: number;    // [-10.0, +10.0]
  stability: number;  // [-10.0, +10.0]
  impact: number;     // [-10.0, +10.0]
  peace: number;      // [-10.0, +10.0]
}

export interface SpatialCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface ProbabilityNode {
  id: string;
  simulationId: string;
  parentId: string | null;
  treePath: string; // e.g. "root.n1_2.n2_4"
  depth: number;
  waveNumber: number;
  siblingIndex: number;
  regimeTier: NodeRegimeTier;
  title: string;
  narrativeSummary: string;
  timeHorizon: string; // e.g. "3-6 Months"
  conditionalProbability: number; // P(B|A) in [0, 1]
  cumulativeProbability: number;  // P(path) in [0, 1]
  rawLlmConfidence: number;
  unexploredChildMass: number;    // M_unexplored for horizontal expansion
  causalDrivers: string[];
  reversibilityType: ReversibilityDoorType;
  reversibilityScore: number;     // [1.0, 10.0]
  regretMinimizationScore: number;// [1.0, 10.0]
  impactVector: ImpactVector;
  expectedUtilityScore?: number;
  isGoldenPath: boolean;
  status: NodeLifecycleStatus;
  userInterventionPrompt?: string;
  spatialPosition: SpatialCoordinates;
  sensitivityWeights: {
    executionVelocity: number;
    capitalBuffer: number;
    marketTailwind: number;
    skillPreparation: number;
  };
  tripwires: string[];
  createdAt: string;
}

export interface UserContextTwin {
  riskAppetite: 'conservative' | 'measured' | 'aggressive' | 'asymmetric';
  runwayMonths: number;
  primaryDomain: string;
  coreValues: {
    wealthCompounding: number;
    autonomyFreedom: number;
    masteryCraft: number;
    stabilitySecurity: number;
    impactLegacy: number;
    peaceWellbeing: number;
  };
}
```

### 2. Mathematical Engine Contracts (`src/lib/math/`)
- **Bayesian Normalization (`src/lib/math/bayesian.ts`)**:
  - `computeWaveMass(wave: number): { exploredAlpha: number, deltaMass: number, remainingUnexplored: number }`
  - `normalizeWaveProbabilities(siblings: ProbabilityNode[], targetExploredMass: number): ProbabilityNode[]`
  - Invariant: $\sum_{i} P_{\text{cond}}(n_i) + M_{\text{unexp}} = 1.0 \pm 10^{-4}$ with zero `NaN` or negative values.
  - Cumulative calculation: $P_{\text{cum}}(\text{child}) = P_{\text{cum}}(\text{parent}) \times P_{\text{cond}}(\text{child} \mid \text{parent})$.
- **Bellman Golden Path Solver (`src/lib/math/bellman.ts`)**:
  - `computeNodeUtility(node: ProbabilityNode, twin: UserContextTwin): number`
  - `solveGoldenPath(nodes: ProbabilityNode[], rootId: string, twin: UserContextTwin): { goldenPathNodeIds: string[], valueTree: Map<string, number> }`
- **Sensitivity Perturbation (`src/lib/math/sensitivity.ts`)**:
  - `perturbProbabilities(nodes: ProbabilityNode[], deltas: { executionVelocity: number, capitalBuffer: number, marketTailwind: number, skillPreparation: number }, unexploredMass: number): Map<string, number>`
  - Uses client Softmax logit shifts with $\epsilon = 10^{-6}$ clamping, $<16$ms latency.
- **3D Conical Layout Solver (`src/lib/math/spatial-layout.ts`)**:
  - `computeConicalPositions(parentNode: ProbabilityNode | null, siblings: ProbabilityNode[], waveNumber: number): Map<string, SpatialCoordinates>`
  - Guarantees $d_{\min} \ge 3.2$ units between all node centers via 15-iteration force-relaxation.

### 3. API Route Specifications (`src/app/api/simulations/`)
- `POST /api/simulations/calibrate`: Receives situation text + context twin. Returns `{ needsClarification: boolean, questions?: string[] }`.
- `POST /api/simulations/generate-wave`: Receives situation, parentId, depth, waveNumber, userInterventionPrompt. Streams or returns `ProbabilityWaveResponse`.
- `POST /api/simulations/[id]/mentor`: Receives active node tree + twin. Returns `MentorSynthesisResponse` (verdict, golden path, blindspots, hedge, 14-day playbook, tripwires).
- `POST /api/simulations/[id]/collapse`: Receives realizedNodeId, reflectionText. Prunes sibling branches, marks realized node, and recalibrates downstream probabilities.

---

## Mandatory Git Practices & Branching Strategy
All workers and sub-orchestrators must adhere to:
1. **Conventional Commits**: Commit messages must follow format `<type>(<scope>): <subject>` (e.g., `feat(foundation): initialize Next.js 15, R3F and Obsidian theme`, `test(bayesian): verify probability mass conservation invariants`).
2. **Clean Atomic Commits**: One logical change per commit. Zero uncommitted files, zero temporary `.log` or `.tmp` artifacts left behind in the workspace.
3. **Structured Feature Branches**: Feature branches (e.g. `feat/m1-foundation`, `feat/m2-multiverse-engine`, `feat/m3-strategic-mentor`, `feat/m4-sensitivity-persistence`) merged cleanly into `main` after verification.
