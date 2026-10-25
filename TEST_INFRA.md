# TEST_INFRA — Test Infrastructure Specification
## Project: HOROVEX (Precision Chronometric Decision Engine)

| Metadata | Details |
| :--- | :--- |
| **Track** | E2E Testing Track (Dual Track Architecture) |
| **Status** | Active / Specified |
| **Test Frameworks** | Vitest 5.x (Unit, Math Invariants, Integration) + Playwright 1.64.x (Browser E2E, WebGL Canvas) |
| **Environment** | Node.js v24.14.1, JSDOM 30.x, Headless Chromium / WebGL Canvas |
| **Target Codebase** | Next.js 15 (App Router), React 19, Three.js 0.186, React Three Fiber 9.8, Tailwind CSS, Supabase |
| **Memory Budget** | < 250 MB RAM for Vitest suite execution |

---

## 1. Overview & Test Architecture

HOROVEX requires high precision: it combines qualitative LLM scenario divergence with quantitative Bayesian mass conservation, Bellman optimal dynamic programming, 60 FPS Softmax logit shifts, and 3D conical collision avoidance.

The testing infrastructure enforces an **opaque-box, requirement-driven testing paradigm** across 4 primary tiers:
- **Tier 1: Feature Coverage** — Verifies every one of the 32 inventoried features in `PROJECT.md` has $\ge 5$ deterministic tests validating primary behavior, inputs, and outputs.
- **Tier 2: Boundary & Corner Cases** — Stresses extreme values, zero inputs, mass limits, floating-point probability conservation ($\sum P_i + M_{\text{unexplored}} = 1.0 \pm 10^{-4}$), monotonic cumulative probability decay, Softmax epsilon clamping ($\epsilon = 10^{-6}$), and spatial collision clearance ($d_{\min} \ge 3.2$ units).
- **Tier 3: Cross-Feature Interactions** — Tests pairwise and sequential transitions between features (e.g., Clarifying Pulse $\to$ Wave 1 $\to$ Horizontal Expansion; Sensitivity Levers $\to$ Softmax Logits $\to$ Golden Path Recompute; Reality Check-In $\to$ Pruning $\to$ Downstream Recalibration).
- **Tier 4: Real-World Scenarios** — Validates multi-step, complex user journeys modeled after the 3 Flagship Multiverse Showcases: Founder SaaS Pivot, Senior Tech to Solo AI Venture, and Global Relocation & Capital Allocation.

---

## 2. Directory Structure & Layout

All tests reside under `src/tests/` co-located with dedicated fixtures and mock helpers:

```text
src/tests/
├── unit/
│   ├── math/
│   │   ├── bayesian.test.ts          # Tier 1 & 2: Features 9, 10, 14 (Mass conservation, alpha regimes, cumulative decay)
│   │   ├── bellman.test.ts           # Tier 1 & 2: Features 17, 18 (Expected utility, value backup, Golden Path optimality)
│   │   ├── sensitivity.test.ts       # Tier 1 & 2: Feature 23 (Softmax logit perturbation, epsilon guards, <16ms latency)
│   │   └── spatial-layout.test.ts    # Tier 1 & 2: Feature 15 (Conical 3D layout, collision solver, d_min >= 3.2 invariant)
│   ├── ai/
│   │   ├── adapter.test.ts           # Tier 1 & 2: Features 25, 26 (Multi-provider routing, intelligent fallback engine)
│   │   └── schemas.test.ts           # Tier 1 & 2: Features 7, 20, 21, 22, 24 (Zod schemas, validation, edge payloads)
│   ├── state/
│   │   ├── store.test.ts             # Tier 1 & 2: Features 16, 29 (Context Twin vault, guest sandbox, Zustand store)
│   │   └── quota.test.ts             # Tier 1 & 2: Feature 31 (SaaS tier gating, quota guards, limits)
│   └── components/
│       ├── design-tokens.test.ts     # Tier 1: Feature 1 (Obsidian Chronometry tokens, typography, CSS vars)
│       ├── matrix-view.test.ts       # Tier 1: Feature 5 (Chronicle 2D Matrix view, column mapping, comparison)
│       ├── a11y.test.ts              # Tier 1: Feature 6 (WCAG AA keyboard tree navigation, prefers-reduced-motion)
│       └── dossier-export.test.ts    # Tier 1: Feature 30 (Executive Decision Dossier export, Markdown/JSON format)
├── integration/
│   ├── api-routes.test.ts            # Tier 1 & 3: Features 7, 8, 9, 10, 11, 27, 28 (API routes, streaming, Supabase ltree)
│   ├── pairwise-interactions.test.ts # Tier 3: Cross-feature integrations & state cascades
│   └── test-suite-integrity.test.ts  # Tier 1: Feature 32 (Test suite discovery, tier coverage, invariant verification)
├── scenarios/
│   └── flagship-multiverses.test.ts  # Tier 1 & 4: Feature 19 (Founder SaaS Pivot, Senior Tech Solo, Global Relocation)
├── e2e/
│   └── multiverse-observatory.spec.ts# Tier 1, 3, 4: Features 2, 3, 4, 12, 13 (Playwright browser E2E, WebGL canvas, HUDs)
└── fixtures/
    ├── mock-nodes.ts                 # Standard synthetic node trees across waves 1-3
    ├── mock-twins.ts                 # Standard UserContextTwin profiles (conservative, measured, aggressive)
    └── mock-scenarios.ts             # Complete multi-depth flagship scenario datasets
```

---

## 3. Test Runner Configurations

### 3.1 Vitest Configuration (`vitest.config.ts`)
- **Environment**: `jsdom` for component and DOM testing; Node native ESM for mathematical solvers.
- **Path Aliases**: `@/*` mapped to `./src/*`.
- **Globals**: `describe`, `it`, `test`, `expect`, `beforeEach`, `afterEach`, `vi`.
- **Performance**: Thread pool isolation with maximum memory cap (< 250 MB).

### 3.2 Playwright Configuration (`playwright.config.ts`)
- **Browsers**: Chromium (Desktop Chrome), WebGL enabled via `--use-gl=angle` or SwiftShader in headless mode.
- **Base URL**: `http://localhost:3000`.
- **Timeouts**: Action timeout 10s, navigation timeout 15s, assertion timeout 5s.
- **Trace & Artifacts**: Retain on failure (`test-results/`).

---

## 4. Test Tier Hierarchy & Feature Coverage Matrix

| Feature # | Feature Name | Tier 1 (Coverage >=5) | Tier 2 (Boundary >=5) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) | Test File Location |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **F1** | Obsidian Chronometry Design System | 5 | 2 | 1 | 1 | `src/tests/unit/components/design-tokens.test.ts` |
| **F2** | Luxury 3D Hero Landing Experience | 5 | 1 | 2 | 2 | `src/tests/e2e/multiverse-observatory.spec.ts` |
| **F3** | 3D WebGL Causal Observatory Core | 5 | 2 | 2 | 2 | `src/tests/e2e/multiverse-observatory.spec.ts` |
| **F4** | Bioluminescent Probability Filaments | 5 | 2 | 2 | 1 | `src/tests/e2e/multiverse-observatory.spec.ts` |
| **F5** | Synchronized 2D Chronicle Matrix View | 5 | 2 | 2 | 1 | `src/tests/unit/components/matrix-view.test.ts` |
| **F6** | WCAG AA Accessibility & Reduced Motion | 5 | 3 | 1 | 1 | `src/tests/unit/components/a11y.test.ts` |
| **F7** | Adaptive Clarifying Pulse | 5 | 5 | 3 | 2 | `src/tests/integration/api-routes.test.ts`, `src/tests/unit/ai/schemas.test.ts` |
| **F8** | 1-Click Calibration Fast-Track ("Skip") | 5 | 3 | 3 | 1 | `src/tests/integration/api-routes.test.ts` |
| **F9** | Wave 1 Baseline Generator (Top 5) | 6 | 5 | 3 | 3 | `src/tests/unit/math/bayesian.test.ts` |
| **F10** | Horizontal Expansion (`+5 More`) | 6 | 5 | 3 | 3 | `src/tests/unit/math/bayesian.test.ts` |
| **F11** | Infinite Vertical Recursion | 6 | 5 | 3 | 3 | `src/tests/integration/api-routes.test.ts` |
| **F12** | Passive Auto-Projection Mode | 5 | 2 | 2 | 2 | `src/tests/e2e/multiverse-observatory.spec.ts` |
| **F13** | Active Action Injection Mode | 5 | 2 | 2 | 2 | `src/tests/e2e/multiverse-observatory.spec.ts` |
| **F14** | Cumulative Path Probability Engine | 6 | 5 | 2 | 3 | `src/tests/unit/math/bayesian.test.ts` |
| **F15** | 3D Conical Orbital Layout & Collision | 6 | 6 | 2 | 2 | `src/tests/unit/math/spatial-layout.test.ts` |
| **F16** | Personal Context Digital Twin ("The Vault") | 6 | 5 | 3 | 3 | `src/tests/unit/state/store.test.ts` |
| **F17** | Multi-Objective Node Utility Scorer | 6 | 5 | 3 | 3 | `src/tests/unit/math/bellman.test.ts` |
| **F18** | Bellman Expected Utility Golden Path | 7 | 5 | 4 | 3 | `src/tests/unit/math/bellman.test.ts` |
| **F19** | Curated Flagship Multiverse Showcases | 6 | 3 | 3 | 6 | `src/tests/scenarios/flagship-multiverses.test.ts` |
| **F20** | Strategic Mentor Executive Advisory | 5 | 3 | 3 | 2 | `src/tests/unit/ai/schemas.test.ts` |
| **F21** | 14-Day Actionable Playbook | 5 | 3 | 2 | 2 | `src/tests/unit/ai/schemas.test.ts` |
| **F22** | 30/60/90-Day Observable Tripwires | 5 | 3 | 2 | 2 | `src/tests/unit/ai/schemas.test.ts` |
| **F23** | Real-Time 60 FPS Sensitivity Levers | 6 | 6 | 4 | 2 | `src/tests/unit/math/sensitivity.test.ts` |
| **F24** | Reality Check-In ("Collapse Wavefunction") | 6 | 5 | 4 | 2 | `src/tests/integration/pairwise-interactions.test.ts` |
| **F25** | Unified Multi-Provider AI Adapter | 5 | 3 | 2 | 2 | `src/tests/unit/ai/adapter.test.ts` |
| **F26** | Intelligent Deterministic Fallback Engine | 6 | 5 | 3 | 3 | `src/tests/unit/ai/adapter.test.ts` |
| **F27** | Progressive Streaming Materialization | 5 | 4 | 2 | 2 | `src/tests/integration/api-routes.test.ts` |
| **F28** | Supabase Relational & `ltree` Persistence | 5 | 4 | 2 | 2 | `src/tests/integration/api-routes.test.ts` |
| **F29** | Instant Guest Sandbox Mode | 5 | 4 | 2 | 2 | `src/tests/unit/state/store.test.ts` |
| **F30** | Executive Decision Dossier Export | 5 | 3 | 2 | 2 | `src/tests/unit/components/dossier-export.test.ts` |
| **F31** | SaaS Tier Gating & Quota Guard | 6 | 5 | 2 | 1 | `src/tests/unit/state/quota.test.ts` |
| **F32** | Full E2E Test Suite & Test Integrity | 5 | 3 | 3 | 3 | `src/tests/integration/test-suite-integrity.test.ts` |
| **Total**| **All 32 Features Covered** | **175+** | **120+** | **80+** | **70+** | **445+ Total Assertions** |

---

## 5. Mathematical Invariants & Verification Oracle

All tests enforce exact mathematical formulas derived from `docs/LLD.md`:

1. **Probability Mass Conservation Invariant**:
   $$\forall w \ge 1: \quad \left| \sum_{k=1}^{5w} P^{(w)}(n_k \mid \text{parent}) + M_{\text{unexplored}}^{(w)} - 1.0 \right| < 10^{-4}$$
   with $\alpha_1 = 0.80$, $\alpha_2 = 0.65$, and $\alpha_w = 0.60$ for $w \ge 3$.
2. **Cumulative Probability Monotonic Decay**:
   $$P_{\text{cum}}(n_d) = \prod_{k=1}^{d} P(n_k \mid n_{k-1}) \implies P_{\text{cum}}(n_d) \le P_{\text{cum}}(n_{d-1}), \quad \forall d \ge 1$$
3. **Softmax Logit Perturbation Conservation**:
   $$P_{\text{new}}(n_i \mid \text{parent}) = (1 - M_{\text{unexplored}}) \cdot \frac{\exp(z_i(\Delta \vec{x}))}{\sum_{j} \exp(z_j(\Delta \vec{x}))}$$
   Guaranteed $\sum P_{\text{new}} + M_{\text{unexplored}} = 1.0 \pm 10^{-4}$ under any $\Delta \vec{x} \in [-1, 1]^4$, with logit clamping $\epsilon = 10^{-6}$ avoiding `NaN` or $-\infty$.
4. **Spatial Clearance Invariant**:
   $$\forall a \neq b: \quad \|\vec{P}_a - \vec{P}_b\| \ge 3.2 \text{ units}$$
   Guaranteed by 15-iteration force-relaxation.
5. **Bellman Optimality**:
   Golden Path strictly follows $n_d^* = \arg\max_{c \in \mathcal{C}(n_{d-1}^*)} Q(n_{d-1}^*, c)$ forming an unbroken contiguous ancestral spine from root to leaf.

---

## 6. Test Execution Commands

```bash
# Run all unit, mathematical, and integration tests
npm test

# Run tests with live watch mode
npm run test:watch

# Run test coverage report
npm run test:coverage

# Run Playwright browser E2E tests (including 3D WebGL Canvas)
npm run test:e2e
```
