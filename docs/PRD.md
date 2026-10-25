# Product Requirements Document (PRD)
## Project Codename: **HOROVEX** — The AI Multiverse Decision & Probability Simulator

| Metadata | Details |
| :--- | :--- |
| **Document Status** | Draft v1.0 (Awaiting Founder Alignment) |
| **Product Category** | B2C / Prosumer / Executive Decision Intelligence SaaS |
| **Core Stack** | Next.js (App Router), Three.js / React Three Fiber, Tailwind CSS, Supabase (PostgreSQL + Auth + pgvector), AI Structured Reasoning Pipeline |
| **Design Mandate** | Ultra-luxury, spatial 3D observatory experience. Zero "AI slop", zero generic templates. |

---

## 1. Executive Vision & Problem Statement

### 1.1 The Problem
Every high-stakes human decision—whether launching a company, pivoting a career, allocating capital, relocating, or navigating complex personal crossroads—is a bet on an uncertain future. Today, people rely on two broken tools:
1. **Intuition clouded by cognitive bias** (recency bias, sunk-cost fallacy, optimism bias, narrow framing).
2. **Generic AI chat wrappers** that output shallow, one-dimensional bullet points without understanding the user's constraints, base rates, second-order consequences, or recursive downstream effects.

### 1.2 The Solution
**HOROVEX** is a **Recursive Multiverse Probability Simulator and Personal Strategic Decision Engine**. 

When a user inputs a real-world situation or crossroads, HOROVEX does not merely reply with text. It constructs an interactive, living **3D Multiverse Probability Tree**:
1. **Initial Wave (Top 5 Probabilities)**: The engine analyzes the user's situation alongside their personal context profile and generates the **5 most probable future trajectories**, complete with calibrated probabilities, time horizons, causal drivers, and risk/reward scores.
2. **Horizontal Expansion ("+5 More Possibilities")**: At any node, the user can trigger deeper exploration to uncover **5 additional possibilities**—progressively expanding from baseline likely outcomes (1–5) into contrarian/second-order shifts (6–10) and high-impact tail risks or asymmetric opportunities (11–15+).
3. **Infinite Vertical Recursion**: Every single predicted outcome can become the **new origin point**. A user can select *Possibility #7*, step inside that timeline, and simulate the *next* 5, 10, or 20 recursive future branches across months or years.
4. **The Personal Mentor & Golden Path Engine**: Acting as a seasoned strategist and personal advisor, HOROVEX evaluates the entire multiverse tree to highlight the **Optimal Trajectory ("The Golden Path")**, explaining *why* it is the highest-utility choice, what actions shift the odds in the user's favor, and what early-warning signals ("tripwires") to watch for in real life.

---

## 2. Anti-Slop Design & Experience Philosophy

> **Core Directive:** HOROVEX must feel like an instrument engineered by a bespoke Swiss horology house combined with a quantum astrophysics observatory—never a generic SaaS dashboard.

### 2.1 Visual & Spatial Identity
- **Aesthetic Archetype**: *Obsidian Chronometry & Bioluminescent Phase Space*.
- **Surface Palette**: Deep void obsidian (`#050507`), brushed tungsten glass, subtle hairline metallic borders (`rgba(255,255,255,0.07)`), warm champagne gold (`#D4AF37`) for the **Golden Path / Mentor Recommendations**, and spectral cyan/emerald/amber filaments encoding probability mass and risk profiles.
- **Typography**: High-contrast editorial serif (e.g., *Instrument Serif* or *Cormorant Garamond*) for narrative insights and mentor wisdom, paired with a precision Neo-Grotesque (*Inter* / *Plus Jakarta Sans*) and technical monospace (*JetBrains Mono*) for probability telemetry (`P = 34.2%`, `EV = +8.4`, `T+180d`).
- **3D Spatial Canvas as the Primary Interface**:
  - No static card grids as the primary view. The user navigates a live **3D Causal Observatory** where nodes float in depth-sorted orbital layers (`T0 -> T1 -> T2 -> Tn`).
  - **Probability Filaments**: Custom GLSL spline shaders where filament thickness, pulse velocity, and luminosity physically represent conditional probability ($P(B \mid A)$).
  - **Camera Choreography**: Cinematic, damped camera transitions when diving into a child branch, expanding "+5 Possibilities," or activating the Mentor's "Golden Path" overview.
  - **Tactile Precision HUD**: Floating glassmorphic telemetry panels with physical backdrop blur, subtle noise grain, and micro-interactive sliders.

---

## 3. Target User Personas

| Persona | Use Case Examples | Why They Pay for HOROVEX |
| :--- | :--- | :--- |
| **1. The Founder / Indie Builder** | Pricing pivots, co-founder splits, fundraising vs. bootstrapping, product positioning, hiring vs. staying lean. | Needs rigorous second- and third-order consequence mapping and pre-mortem risk detection before burning runway. |
| **2. The High-Agency Professional** | Accepting a competing offer, relocating countries, negotiating equity, switching industries, going full-time solo. | Wants an objective advisor that weighs financial runway, career compounding, and personal fulfillment. |
| **3. The Strategic Investor / Operator** | Scenario planning for market shifts, capital allocation, regulatory changes, competitive responses. | Values structured Bayesian probability trees, sensitivity sliders, and persistent scenario tracking. |
| **4. The Life Navigator** | Major personal commitments, lifestyle redesign, high-stakes interpersonal or financial crossroads. | Seeks clarity when emotionally overwhelmed; benefits from Regret Minimization and Mentor guidance. |

---

## 4. Core Product Features & Functional Requirements

### 4.1 Feature Pillar 1: The Personal Context Engine ("Digital Twin")
A prediction is only as dependable as its context. Before or during a simulation, HOROVEX maintains a persistent, evolving **User Context Graph**:
- **Core Baseline**: Risk tolerance (Conservative / Measured / Aggressive), financial runway / buffer, time horizon priority, primary life/career values (Wealth, Autonomy, Mastery, Stability, Impact, Peace).
- **Smart Clarifying Pulse (Pre-Simulation Calibration)**: When a user enters a situation (e.g., *"I'm thinking of leaving my senior engineering job to build an AI agency"*), HOROVEX optionally asks **2–3 surgical, high-entropy clarifying questions** (or auto-infers from their profile) to anchor the simulation in reality rather than generic assumptions.

### 4.2 Feature Pillar 2: The Recursive Multiverse Generator
- **Initial 5 Probable Futures (Tier 1 — Baseline Regime)**:
  - Generates the **5 highest-probability, mutually distinct outcomes** based on real-world base rates and the user's specific constraints.
  - Each node includes:
    - **Title & Narrative Forecast**: Crisp, realistic projection of what happens and why.
    - **Calibrated Probability ($P\%$)**: Conditional probability relative to sibling branches, plus cumulative probability from the root situation.
    - **Time Horizon**: Estimated manifestation window (e.g., `T + 3 Months`, `T + 1 Year`).
    - **Causal Drivers**: The 2–3 key factors (catalysts, bottlenecks, or structural shifts) that cause this timeline to materialize.
    - **Impact Vector (6D Value Alignment)**: Scored in $[-10, +10]$ across the 6 Digital Twin dimensions—*Wealth Compounding (Financial)*, *Autonomy & Freedom (Optionality)*, *Mastery & Craft (Career Leverage)*, *Stability & Security (Downside Buffer)*, *Impact & Legacy*, and *Peace & Wellbeing (Emotional Sustainability)*—plus an explicit *Reversibility Index*.
- **Horizontal Expansion ("+5 More Possibilities")**:
  - Clicking **"Simulate +5 More Possibilities"** on any node instructs the AI engine to look beyond the obvious:
    - **Wave 2 (Nodes 6–10 — Second-Order & Contrarian Regime)**: Uncovers non-obvious bottlenecks, hidden leverage points, market shifts, or psychological burnout/breakthrough paths.
    - **Wave 3+ (Nodes 11–15+ — Tail Risks, Black Swans & Asymmetric Upside)**: Explores low-probability, extreme-impact scenarios (both catastrophic failure modes to hedge against and 10x breakout trajectories).
  - Deduplication guarantee: The engine explicitly conditions on all existing sibling nodes so no two branches overlap in meaning.
- **Infinite Vertical Recursion (Deep Timeline Diving)**:
  - Any node in the tree can be selected as a **New Decision Nexus**.
  - The user can either:
    1. **Auto-Project**: *"Show me the 5 most likely futures if this outcome happens."*
    2. **Inject an Action / Intervention**: *"Assuming Possibility #3 happens, what if I respond by partnering with a distributor?"* -> Generates 5 new child futures conditioned on that intervention.

### 4.3 Feature Pillar 3: The AI Mentor & Decision Intelligence Layer
HOROVEX doesn't leave the user lost in 50 branches. It synthesizes the tree into actionable wisdom:
- **The Golden Path (Optimal Trajectory Highlight)**:
  - Visually illuminates the optimal chain of nodes in warm gold across the 3D space.
  - Computes a composite **Decision Score** combining:
    - **Expected Utility ($E[U]$)**: Probability $\times$ alignment with the user's core values.
    - **Reversibility Index**: Distinguishes *Type 1 (Irreversible / One-Way Door)* from *Type 2 (Reversible / Two-Way Door)* paths.
    - **Regret Minimization Score**: Evaluates long-term 10-year regret vs. short-term discomfort.
- **Probability Lever & Sensitivity Simulator ("How to Bend the Odds")**:
  - Interactive sliders allowing the user to tweak controllable variables (e.g., *Runway Months*, *Weekly Execution Hours*, *Capital Committed*, *Skill Preparation*) and watch the 3D node probabilities dynamically shift in real time.
  - Explicit **Actionable Playbook**: *"To increase Possibility #2 (Breakout Growth) from 18% to 42%, execute these 3 pre-conditions within the next 14 days."*
- **Pre-Mortem & Tripwire System**:
  - Identifies **Early Warning Indicators (Tripwires)**: Observable real-world signals over the next 30/60/90 days that tell the user *which* branch of the multiverse they are actually entering.

### 4.4 Feature Pillar 4: Living Timeline & Reality Check-Ins (Retention Loop)
- Decisions aren't one-off events. Users save their **Multiverse Canvases**.
- **Reality Check-In ("Collapse the Wavefunction")**: Users can return weeks later, mark which branch actually occurred in real life, prune unrealized branches, and continue simulating forward from their new reality—turning HOROVEX into a lifelong strategic companion.

---

## 5. SaaS Business Model & Tier Structure

| Feature / Capability | **Observer (Free Tier)** | **Strategist (Pro — $29/mo)** | **Oracle (Executive — $79/mo)** |
| :--- | :--- | :--- | :--- |
| **Active Multiverse Canvases** | Up to 3 saved simulations | Unlimited simulations | Unlimited + Private Vault Encryption |
| **Horizontal Expansion (`+5 More`)** | Up to 10 possibilities per node | Up to 25 possibilities per node | Unlimited horizontal expansion |
| **Recursive Depth Levels** | Up to Depth 3 (`T0 -> T1 -> T2`) | Unlimited recursive depth | Unlimited recursive depth |
| **AI Reasoning Engine** | Standard Fast Reasoning | Deep Bayesian Multi-Agent Pipeline | Deep Pipeline + Custom Counterfactual Stress-Testing |
| **Personal Context Digital Twin** | Basic Profile | Full Persistent Memory + Past Decision Learning | Multi-Context Profiles (Personal + Company/Venture) |
| **Mentor & Golden Path Suite** | Basic Path Recommendation | Full Golden Path + Sensitivity Sliders + Pre-Mortem | Full Suite + Exportable Executive Decision Dossiers (PDF/Notion) |

---

## 6. Key Performance Indicators (KPIs) & Success Metrics

1. **Depth of Exploration (Engagement)**: Average recursive depth reached per simulation session (Target: $\ge 3.2$ levels) and average `+5 More Possibilities` expansions per session (Target: $\ge 2.5$).
2. **Decision Confidence Delta**: Pre- vs. post-simulation user-reported clarity score.
3. **Return Check-In Rate (Retention)**: % of users returning within 14–30 days to update their timeline ("Collapse the Wavefunction").
4. **Performance Benchmark**: Constant **60 FPS** WebGL rendering with up to 300 visible nodes and zero layout shift during streaming AI generation.
