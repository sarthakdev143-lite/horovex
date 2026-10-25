# Low-Level Design (LLD)
## Project Codename: **KAIROS** — The AI Multiverse Decision & Probability Simulator

| Metadata | Details |
| :--- | :--- |
| **Document Version** | v1.0 |
| **Status** | Detailed Engineering Specification |
| **Related Docs** | [PRD.md](./PRD.md) · [HLD.md](./HLD.md) · [ROADMAP.md](./ROADMAP.md) |

---

## 1. Database Schema & SQL DDL (Supabase PostgreSQL)

KAIROS uses PostgreSQL with `ltree` (for infinite recursive tree lineage queries) and `vector` (`pgvector` for semantic deduplication and Digital Twin memory).

```sql
-- ============================================================================
-- 1. EXTENSIONS & CUSTOM ENUMS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE subscription_tier AS ENUM ('observer', 'strategist', 'oracle');
CREATE TYPE risk_appetite_level AS ENUM ('conservative', 'measured', 'aggressive', 'asymmetric');
CREATE TYPE node_regime_tier AS ENUM ('root', 'baseline_wave_1', 'contrarian_wave_2', 'tail_risk_wave_3_plus');
CREATE TYPE reversibility_door_type AS ENUM ('type_1_irreversible', 'type_2_reversible', 'hybrid');
CREATE TYPE node_lifecycle_status AS ENUM ('active', 'realized', 'pruned', 'archived');

-- ============================================================================
-- 2. USER PROFILES & PERSONAL CONTEXT DIGITAL TWIN
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier subscription_tier NOT NULL DEFAULT 'observer',
    simulations_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_context_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    risk_appetite risk_appetite_level NOT NULL DEFAULT 'measured',
    runway_months NUMERIC(5, 1) DEFAULT 12.0,
    primary_domain TEXT DEFAULT 'Founder / Career Strategy',
    -- Normalized weights (0.0 to 1.0) across core decision dimensions
    core_values JSONB NOT NULL DEFAULT '{
        "wealth_compounding": 0.8,
        "autonomy_freedom": 0.9,
        "mastery_craft": 0.75,
        "stability_security": 0.5,
        "impact_legacy": 0.7,
        "peace_wellbeing": 0.65
    }'::jsonb,
    personal_constraints TEXT[] DEFAULT '{}',
    decision_history_summary TEXT,
    context_embedding vector(1536),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. MULTIVERSE SIMULATIONS (CANVASES)
-- ============================================================================
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    root_situation TEXT NOT NULL,
    domain_category TEXT NOT NULL DEFAULT 'strategic',
    -- Pre-simulation clarifying Q&A pairs captured before Wave 1
    calibration_context JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Snapshot of user values at simulation time
    active_value_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Ordered array of node UUIDs forming the Mentor's Golden Path
    golden_path_node_ids UUID[] DEFAULT '{}',
    total_nodes_count INT NOT NULL DEFAULT 1,
    max_depth_reached INT NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. RECURSIVE PROBABILITY NODES (THE MULTIVERSE TREE / DAG)
-- ============================================================================
CREATE TABLE public.probability_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    
    -- Hierarchical lineage path using ltree (e.g., 'root.n1_2.n2_6')
    tree_path ltree NOT NULL,
    depth INT NOT NULL DEFAULT 0 CHECK (depth >= 0),
    wave_number INT NOT NULL DEFAULT 1 CHECK (wave_number >= 1), -- 1 = Initial 5, 2 = +5 More (6-10), 3 = (11-15)...
    sibling_index INT NOT NULL DEFAULT 1 CHECK (sibling_index >= 1), -- 1..N under same parent
    regime_tier node_regime_tier NOT NULL DEFAULT 'baseline_wave_1',
    
    -- Optional user intervention that triggered this branch
    user_intervention_prompt TEXT,
    
    -- Core Prediction Content
    title TEXT NOT NULL,
    summary_headline TEXT NOT NULL,
    narrative_forecast TEXT NOT NULL,
    time_horizon_label TEXT NOT NULL, -- e.g., 'T + 90 Days', 'T + 18 Months'
    time_horizon_days INT NOT NULL DEFAULT 90,
    
    -- Calibrated Probability Math
    raw_llm_confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.2000,
    conditional_probability NUMERIC(5, 4) NOT NULL CHECK (conditional_probability >= 0 AND conditional_probability <= 1),
    cumulative_probability NUMERIC(6, 5) NOT NULL CHECK (cumulative_probability >= 0 AND cumulative_probability <= 1),
    
    -- Structured Causal & Multi-Objective Scoring (6D Aligned with user_context_twins.core_values)
    causal_drivers JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{factor, influence, weight}]
    impact_vector JSONB NOT NULL DEFAULT '{
        "wealth_compounding": 0,
        "autonomy_freedom": 0,
        "mastery_craft": 0,
        "stability_security": 0,
        "impact_legacy": 0,
        "peace_wellbeing": 0
    }'::jsonb, -- Scored -10.0 to +10.0 across the 6 Digital Twin dimensions
    reversibility_type reversibility_door_type NOT NULL DEFAULT 'type_2_reversible',
    reversibility_score NUMERIC(4, 2) NOT NULL DEFAULT 7.0, -- 0.0 (Irreversible) to 10.0 (Fully Reversible)
    regret_minimization_score NUMERIC(4, 2) NOT NULL DEFAULT 5.0, -- 0.0 to 10.0
    expected_utility_score NUMERIC(6, 2) NOT NULL DEFAULT 0.0, -- Composite score
    
    -- Sensitivity Elasticities (used for real-time 60fps client slider math)
    sensitivity_weights JSONB NOT NULL DEFAULT '{
        "execution_velocity": 0.0,
        "capital_buffer": 0.0,
        "market_tailwind": 0.0,
        "skill_preparation": 0.0
    }'::jsonb,
    
    -- Early-warning signals that indicate this branch is materializing
    tripwire_signals TEXT[] DEFAULT '{}',
    
    -- Spatial 3D Coordinates & State
    spatial_position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    is_golden_path BOOLEAN NOT NULL DEFAULT FALSE,
    unexplored_child_mass NUMERIC(5, 4) NOT NULL DEFAULT 1.0000, -- Starts at 1.0, decreases as waves 1, 2, 3 are generated
    status node_lifecycle_status NOT NULL DEFAULT 'active',
    
    semantic_embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. MENTOR SYNTHESIS & GOLDEN PATH ADVISORY
-- ============================================================================
CREATE TABLE public.mentor_syntheses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    focal_node_id UUID REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    golden_path_node_ids UUID[] NOT NULL,
    executive_verdict TEXT NOT NULL,
    why_this_path_wins TEXT NOT NULL,
    blindspots_detected TEXT[] NOT NULL DEFAULT '{}',
    pre_mortem_hedge_plan TEXT NOT NULL,
    -- 14-Day Actionable Playbook to increase odds of Golden Path
    action_playbook JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Controllable variables for the Sensitivity Lever simulator
    custom_levers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. REALITY CHECK-INS ("COLLAPSE THE WAVEFUNCTION")
-- ============================================================================
CREATE TABLE public.reality_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    realized_node_id UUID NOT NULL REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    user_reflection TEXT,
    actual_vs_predicted_delta TEXT,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. PERFORMANCE INDEXES, TRIGGERS & ROW-LEVEL SECURITY (RLS)
-- ============================================================================
CREATE INDEX idx_nodes_simulation_id ON public.probability_nodes(simulation_id);
CREATE INDEX idx_nodes_parent_id ON public.probability_nodes(parent_node_id);
CREATE INDEX idx_nodes_tree_path_gist ON public.probability_nodes USING GIST (tree_path);
CREATE INDEX idx_nodes_embedding_hnsw ON public.probability_nodes USING hnsw (semantic_embedding vector_cosine_ops);
CREATE INDEX idx_twins_embedding_hnsw ON public.user_context_twins USING hnsw (context_embedding vector_cosine_ops);
CREATE INDEX idx_simulations_user_id ON public.simulations(user_id, created_at DESC);
CREATE INDEX idx_mentor_syntheses_simulation_id ON public.mentor_syntheses(simulation_id, created_at DESC);
CREATE INDEX idx_reality_checkins_simulation_id ON public.reality_checkins(simulation_id, checked_in_at DESC);

-- Auto-provision profile and Digital Twin on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    INSERT INTO public.user_context_twins (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probability_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own context twin" ON public.user_context_twins
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own simulations" ON public.simulations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own probability nodes" ON public.probability_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = probability_nodes.simulation_id AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = probability_nodes.simulation_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own mentor syntheses" ON public.mentor_syntheses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = mentor_syntheses.simulation_id AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = mentor_syntheses.simulation_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users manage own reality checkins" ON public.reality_checkins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = reality_checkins.simulation_id AND s.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.simulations s
            WHERE s.id = reality_checkins.simulation_id AND s.user_id = auth.uid()
        )
    );
```

---

## 2. Mathematical & Algorithmic Specifications

### 2.1 Progressive Probability Partitioning (`5 -> +5 -> +5` Normalization)
A critical flaw in naive probability apps is that generating 5 outcomes summing to $100\%$ leaves $0\%$ probability mass when the user clicks **"Simulate +5 More Possibilities"**.

KAIROS solves this with **Reserved Unexplored Phase-Space Mass ($M_{\text{unexplored}}^{(w)}$)**:

1. **Wave 1 (Initial 5 Baseline Nodes, $w = 1$)**:
   - Represents the primary canonical cluster, allocated $\alpha_1 = 0.80$ ($80\%$) of total conditional probability mass, while reserving $M_{\text{unexplored}}^{(1)} = 1 - \alpha_1 = 0.20$ ($20\%$) for future waves:
   $$P^{(1)}(n_i \mid \text{parent}) = \alpha_1 \cdot \frac{\hat{p}_i}{\sum_{j=1}^{5} \hat{p}_j}, \quad i \in \{1..5\}$$
2. **General Horizontal Expansion Wave $w \ge 2$ (`+5 More Possibilities`)**:
   - Let $M_{\text{unexplored}}^{(0)} = 1.0$, with regime carving coefficients $\alpha_1 = 0.80$ (Wave 1 Baseline), $\alpha_2 = 0.65$ (Wave 2 Contrarian/Second-Order), and $\alpha_w = 0.60$ for $w \ge 3$ (Wave 3+ Tail-Risk/Asymmetric).
   - Upon generating Wave $w$ (nodes $i \in \{5(w-1)+1 \dots 5w\}$), the newly carved probability mass is:
     $$\Delta M_w = \alpha_w \cdot M_{\text{unexplored}}^{(w-1)}, \quad M_{\text{unexplored}}^{(w)} = (1 - \alpha_w) \cdot M_{\text{unexplored}}^{(w-1)}$$
   - The 5 new nodes in Wave $w$ receive raw conditional mass from $\Delta M_w$:
     $$\tilde{P}(n_i \mid \text{parent}) = \Delta M_w \cdot \frac{\hat{p}_i}{\sum_{j=5(w-1)+1}^{5w} \hat{p}_j}, \quad i \in \{5(w-1)+1 \dots 5w\}$$
   - **Cross-Wave Bayesian Calibration**: To allow a particularly high-likelihood discovery in Wave $w$ to slightly temper earlier waves without violating the unexplored reserve $M_{\text{unexplored}}^{(w)}$, all explored sibling nodes $k \in \{1 \dots 5w\}$ are normalized across total explored mass $(1 - M_{\text{unexplored}}^{(w)})$:
     $$P^{(w)}(n_k \mid \text{parent}) = \left(1 - M_{\text{unexplored}}^{(w)}\right) \cdot \frac{\tilde{P}(n_k \mid \text{parent})}{\sum_{m=1}^{5w} \tilde{P}(n_m \mid \text{parent})}$$
   - **Strict Conservation Invariant**: For every wave $w \ge 1$:
     $$\sum_{k=1}^{5w} P^{(w)}(n_k \mid \text{parent}) + M_{\text{unexplored}}^{(w)} = 1.0$$
3. **Cumulative Path Probability ($P_{\text{cum}}$)**:
   - For any node at depth $d$ along ancestral spine $(n_0, n_1, \dots, n_d)$:
   $$P_{\text{cum}}(n_d) = \prod_{k=1}^{d} P(n_k \mid n_{k-1})$$

---

### 2.2 Multi-Objective Expected Utility & Golden Path Solver

Every node $n$ is scored against the user's 6-dimensional Personal Context Digital Twin vector $\vec{W}_{\text{user}} \in [0, 1]^6$:

1. **Instantaneous Node Utility $U(n)$**:
   $$U(n) = \underbrace{\frac{\vec{W}_{\text{user}} \cdot \vec{I}(n)}{\max\left(\|\vec{W}_{\text{user}}\|_1, \epsilon\right)}}_{\text{Normalized 6D Value Alignment } \in [-10, +10]} + \lambda_{\text{rev}} \cdot \left(R_{\text{rev}}(n) - 5.0\right) + \lambda_{\text{regret}} \cdot \left(\text{RMS}(n) - 5.0\right)$$
   Where:
   - $\vec{W}_{\text{user}}, \vec{I}(n) \in \mathbb{R}^6$: Aligned 6D vectors across `(wealth_compounding, autonomy_freedom, mastery_craft, stability_security, impact_legacy, peace_wellbeing)`, with $\vec{I}(n) \in [-10, +10]^6$.
   - $R_{\text{rev}}(n) \in [0, 10]$: Reversibility score ($\lambda_{\text{rev}} = 0.35$, penalizing irreversible Type 1 traps unless upside is asymmetric).
   - $\text{RMS}(n) \in [0, 10]$: 10-Year Regret Minimization Score ($\lambda_{\text{regret}} = 0.45$).

2. **Explored Conditional Probability Normalization**:
   Let $\mathcal{C}(n)$ be the set of active (`status = 'active'`) child nodes of $n$. Because $\sum_{c \in \mathcal{C}(n)} P(c \mid n) = 1 - M_{\text{unexplored}}(n) < 1$, we define the normalized explored branch weight:
   $$\hat{P}(c \mid n) = \frac{P(c \mid n)}{\sum_{j \in \mathcal{C}(n)} P(j \mid n)}$$
   so that nodes with 1 expanded wave ($80\%$ explored mass) and nodes with 3 expanded waves ($97.2\%$ explored mass) are evaluated on an equal footing.

3. **Risk-Adjusted Trajectory Score $Q(n, c)$ & Recursive Bellman Backup $V^*(n)$**:
   To avoid sign-inversion when $V^*(c) < 0$, let $V_{\min} = -25.0$ be the lower utility floor so that $V^*(c) - V_{\min} > 0$. The risk-adjusted trajectory score of child $c$ from parent $n$ is:
   $$Q(n, c) = \hat{P}(c \mid n)^{\tau} \cdot \left(V^*(c) - V_{\min}\right) + V_{\min}$$
   where $\tau \in [0.25, 0.85]$ is the **Realism vs. Asymmetric Ambition Exponent** mapped from the user's `risk_appetite` (`conservative`: $\tau = 0.85$ favoring high-probability paths; `measured`: $\tau = 0.55$; `aggressive`: $\tau = 0.35$; `asymmetric`: $\tau = 0.25$).
   The recursive Bellman value $V^*(n)$ is computed bottom-up from leaf nodes to the root:
   $$V^*(n) = \begin{cases} U(n) & \text{if } \mathcal{C}(n) = \emptyset \\ U(n) + \gamma \left[ (1 - \eta) \sum_{c \in \mathcal{C}(n)} \hat{P}(c \mid n) V^*(c) + \eta \max_{c \in \mathcal{C}(n)} Q(n, c) \right] & \text{otherwise} \end{cases}$$
   where $\gamma = 0.92$ is the temporal discount factor and $\eta \in [0, 1]$ is the agency coefficient ($\eta = 0.40$ for passive projection branches; $\eta = 0.80$ for active user-intervention branches).

4. **Deterministic Golden Path Spine Extraction (`golden_path_node_ids`)**:
   Starting at root $n_0^* = n_{\text{root}}$, the Mentor Engine traces the optimal trajectory $(n_0^*, n_1^*, \dots, n_D^*)$ down the active tree via greedy policy extraction:
   $$n_d^* = \arg\max_{c \in \mathcal{C}(n_{d-1}^*)} Q(n_{d-1}^*, c), \quad d = 1, 2, \dots, D$$
   All nodes in $\{n_0^*, n_1^*, \dots, n_D^*\}$ are marked `is_golden_path = true` and illuminated in `#D4AF37` champagne gold.

---

### 2.3 Real-Time 60 FPS Sensitivity Slider Perturbation

When the user drags a **Sensitivity Lever** in the HUD (e.g., increasing *"Financial Runway"* from $6 \to 18$ months or *"Weekly Deep-Work Execution"* from $10 \to 35$ hrs), active sibling probabilities shift **instantly at 60 FPS** via an $\epsilon$-guarded client-side **Softmax Logit Shift**:

$$z_i(\Delta \vec{x}) = \ln\left(\max\left(P_0(n_i \mid \text{parent}), \epsilon\right)\right) + \sum_{k=1}^{K} \beta_{i,k} \cdot \Delta x_k, \quad \epsilon = 10^{-6}$$

$$P_{\text{new}}(n_i \mid \text{parent}) = \left(1 - M_{\text{unexplored}}\right) \cdot \frac{\exp\left(z_i(\Delta \vec{x})\right)}{\sum_{j \in \mathcal{C}(\text{parent})} \exp\left(z_j(\Delta \vec{x})\right)}, \quad \forall i \in \mathcal{C}(\text{parent})$$

Where $\mathcal{C}(\text{parent})$ is the set of active (`status = 'active'`) children, $\beta_{i,k} \in [-2.0, +2.0]$ is the sensitivity elasticity weight pre-computed for node $i$ with respect to lever $k$, and $\Delta x_k \in [-1, +1]$ is the normalized slider delta. Clamping by $\epsilon = 10^{-6}$ guarantees that zero-probability or pruned nodes never produce $-\infty$ or `NaN` in WebGL shader attributes.

---

### 2.4 3D Conical Orbital Layout Algorithm

To position nodes in 3D space without visual clutter or overlap:

- **Root Node ($d = 0$)**: Positioned at origin $\vec{P}_0 = (0, 0, 0)$.
- **Child Node $i$ of Parent $p$ at Depth $d$ and Wave $w$**:
  - **Axial Depth ($Z$)**:
    $$z_i = z_p - D_{\text{step}} \cdot \left(1 + 0.18 \cdot (w - 1)\right), \quad D_{\text{step}} = 14.0 \text{ units}$$
  - **Orbital Radius ($R$)**:
    $$r_i = R_{\text{base}}(d) + R_{\text{wave}} \cdot (w - 1)$$
  - **Azimuthal Angle ($\theta_i$)**:
    Distributes the 5 nodes of wave $w$ across an angular sector centered on the parent's outward radial heading $\theta_p$, with golden-angle phase offset $\phi_w = (w - 1) \cdot 0.36\text{ rad}$ so Wave 2 nodes interleave cleanly between Wave 1 filaments.
  - **Utility Elevation ($Y$)**:
    $$y_i = 0.6 \cdot y_p + k_u \cdot \left(U(n_i) - \bar{U}_{\text{siblings}}\right)$$
  - **Force-Directed Collision Relaxation**: Runs 15 synchronous iterations of inverse-square repulsion ($F_{\text{rep}} \propto 1 / \|\vec{P}_a - \vec{P}_b\|^2$) before committing coordinates to the store, guaranteeing minimum separation distance $d_{\text{min}} \ge 3.2$ units.

---

## 3. Structured AI Schemas (TypeScript + Zod)

```typescript
import { z } from "zod";

// 1. Pre-Simulation Clarifying Pulse Schema (/api/simulations/calibrate)
export const ClarifyingPulseSchema = z.object({
  situationSummary: z.string().describe("Crisp 1-sentence synthesis of the user's crossroads"),
  detectedStakes: z.enum(["moderate", "high", "life_defining"]),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().describe("High-entropy question that meaningfully alters branch probabilities"),
      whyItMatters: z.string(),
      options: z.array(z.string()).min(3).max(4),
    })
  ).length(3),
});

// 2. Single Probability Node Schema (Generated in Waves of 5)
export const GeneratedNodeSchema = z.object({
  title: z.string().max(60).describe("Evocative, precise title of this future timeline"),
  summaryHeadline: z.string().max(140).describe("One-sentence outcome summary"),
  narrativeForecast: z.string().describe("Detailed, realistic 2-paragraph causal trajectory"),
  timeHorizonLabel: z.string().describe("e.g., 'T + 4 Months', 'T + 1.5 Years'"),
  timeHorizonDays: z.number().int().min(7).max(3650),
  rawRelativeLikelihood: z.number().min(0.01).max(0.95),
  reversibilityType: z.enum(["type_1_irreversible", "type_2_reversible", "hybrid"]),
  reversibilityScore: z.number().min(0).max(10),
  regretMinimizationScore: z.number().min(0).max(10),
  causalDrivers: z.array(
    z.object({
      factor: z.string(),
      influence: z.enum(["catalyst", "bottleneck", "structural"]),
      weight: z.number().min(0.1).max(1.0),
    })
  ).min(2).max(4),
  // 6D Impact Vector aligned 1:1 with user_context_twins.core_values
  impactVector: z.object({
    wealth_compounding: z.number().min(-10).max(10),
    autonomy_freedom: z.number().min(-10).max(10),
    mastery_craft: z.number().min(-10).max(10),
    stability_security: z.number().min(-10).max(10),
    impact_legacy: z.number().min(-10).max(10),
    peace_wellbeing: z.number().min(-10).max(10),
  }),
  sensitivityWeights: z.object({
    execution_velocity: z.number().min(-2).max(2),
    capital_buffer: z.number().min(-2).max(2),
    market_tailwind: z.number().min(-2).max(2),
    skill_preparation: z.number().min(-2).max(2),
  }),
  tripwireSignals: z.array(z.string()).min(2).max(3).describe(
    "Observable real-world early indicators within 30-90 days that signal this branch is occurring"
  ),
});

// 3. Wave of 5 Possibilities Response Schema (/api/simulations/generate-wave)
export const ProbabilityWaveResponseSchema = z.object({
  regimeTier: z.enum(["baseline_wave_1", "contrarian_wave_2", "tail_risk_wave_3_plus"]),
  parentContextSynthesis: z.string(),
  nodes: z.array(GeneratedNodeSchema).length(5),
  mentorQuickInsight: z.string().describe("Immediate strategic observation across these 5 branches"),
});

// 4. Mentor & Golden Path Synthesis Schema (/api/simulations/[id]/mentor)
export const MentorSynthesisSchema = z.object({
  focalNodeId: z.string().uuid().nullable(),
  goldenPathNodeIds: z.array(z.string().uuid()).min(1),
  executiveVerdict: z.string().describe("Authoritative strategic recommendation from the KAIROS Mentor"),
  whyThisPathWins: z.string().describe("Expected utility, reversibility, and regret-minimization rationale"),
  blindspotsDetected: z.array(z.string()).min(2).max(5),
  preMortemHedgePlan: z.string().describe("Concrete mitigation protocol against tail-risk failure modes"),
  actionPlaybook: z.array(
    z.object({
      dayWindow: z.string().describe("e.g., 'Days 1-3', 'Days 4-7', 'Days 8-14'"),
      actionTitle: z.string(),
      concreteSteps: z.string(),
      targetNodeId: z.string().uuid().optional(),
      expectedOddsShiftPct: z.number().min(1).max(50),
    })
  ).min(3).max(5),
  customLevers: z.array(
    z.object({
      key: z.enum(["execution_velocity", "capital_buffer", "market_tailwind", "skill_preparation"]),
      label: z.string(),
      currentBaselineLabel: z.string(),
      stretchTargetLabel: z.string(),
    })
  ).length(4),
});

// 5. Reality Check-In / Wavefunction Collapse Schema (/api/simulations/[id]/collapse)
export const WavefunctionCollapseRequestSchema = z.object({
  realizedNodeId: z.string().uuid(),
  userReflection: z.string().max(2000).optional(),
  actualVsPredictedDelta: z.string().max(1000).optional(),
});
```

---

## 4. API Route Specifications

| Endpoint | Method | Purpose | Request Payload | Streaming / Response |
| :--- | :--- | :--- | :--- | :--- |
| `/api/simulations/calibrate` | `POST` | Generates 3 high-entropy clarifying questions before Wave 1 | `{ situation: string, userTwin?: UserContextTwin }` | JSON (`ClarifyingPulseSchema`) |
| `/api/simulations/generate-wave` | `POST` | Generates initial 5 futures, `+5 More` horizontal wave, or 5 child futures on a recursive node | `{ simulationId: string, parentNodeId: string \| null, waveNumber: number, userIntervention?: string }` | **SSE / NDJSON Stream** yielding normalized `ProbabilityNode` objects one by one + updated `GoldenPath` |
| `/api/simulations/[id]/mentor` | `POST` | Deep Mentor synthesis, 14-day Action Playbook, Pre-Mortem & custom Sensitivity Levers | `{ focalNodeId?: string }` | Streaming JSON (`MentorSynthesis`) |
| `/api/simulations/[id]/collapse` | `POST` | "Collapse the Wavefunction" — marks a real-world branch as realized and prunes counterfactual siblings | `{ realizedNodeId: string, reflection?: string }` | JSON (`{ updatedRootNodeId, recalibratedNodes }`) |

---

## 5. Frontend Source Tree & Component Architecture

```text
src/
├── app/
│   ├── layout.tsx                      # Obsidian dark theme root, fonts (Instrument Serif, Plus Jakarta, JetBrains Mono)
│   ├── page.tsx                        # Main KAIROS Spatial Observatory & Command Nexus
│   ├── (auth)/                         # Supabase Auth routes (Login, Callback)
│   └── api/
│       └── simulations/
│           ├── calibrate/route.ts      # Stage A: Pre-simulation clarifying pulse
│           ├── generate-wave/route.ts  # Stage B & C: 5 / +5 horizontal & vertical recursive generator
│           └── [id]/
│               ├── mentor/route.ts     # Stage D: Golden Path & Playbook synthesizer
│               └── collapse/route.ts   # Reality Check-In wavefunction collapse
├── components/
│   ├── canvas/                         # React Three Fiber 3D Scene Components
│   │   ├── MultiverseCanvas.tsx        # Root WebGL2 Canvas, Postprocessing (Bloom, Vignette, Noise)
│   │   ├── CameraChoreographer.tsx     # Damped spherical camera transitions & focus lock
│   │   ├── ProbabilityNodeMesh.tsx     # Fresnel glass spheres, orbital rings, LOD HTML badges
│   │   ├── ProbabilityFilaments.tsx    # Custom GLSL Bezier spline tubes with animated flow pulses
│   │   ├── GoldenPathAether.tsx        # Champagne gold (#D4AF37) particle & filament highlight
│   │   └── PhaseSpaceEnvironment.tsx   # Deep obsidian void, volumetric grid rings, starfield dust
│   ├── hud/                            # Luxury Glassmorphic 2D Tactical Overlay
│   │   ├── TopChronometerBar.tsx       # Simulation title, depth breadcrumb, Reality Check-In, Context Twin trigger
│   │   ├── OriginCommandPrompt.tsx     # Situation input console + 3-question Calibration Pulse modal
│   │   ├── NodeTelemetryDrawer.tsx     # Right-hand deep inspection HUD (Narrative, Drivers, Tripwires)
│   │   ├── WaveExpansionBar.tsx        # "+5 More Possibilities" (Wave 2 Contrarian / Wave 3 Tail-Risk) + "Dive Deeper"
│   │   ├── MentorGoldenPathPanel.tsx   # Strategic Advisor synthesis, Expected Utility & 14-Day Playbook
│   │   ├── SensitivityLeverDeck.tsx    # Real-time 60fps interactive sliders ("How to Bend the Odds")
│   │   └── ChronicleMatrixModal.tsx    # Synchronized 2D accessible decision matrix & comparison view
│   └── twin/
│       └── ContextTwinVault.tsx        # Personal Context Digital Twin editor (Risk, Runway, Core Values)
├── lib/
│   ├── ai/
│   │   ├── provider.ts                 # Multi-provider LLM client (OpenAI / Anthropic / Gemini + Structured Fallback)
│   │   ├── prompts.ts                  # Regime-aware system prompts & anti-slop causal directives
│   │   └── schemas.ts                  # Zod validation schemas
│   ├── math/
│   │   ├── bayesian.ts                 # Unexplored mass partitioning & sibling renormalization
│   │   ├── utility.ts                  # Bellman Expected Utility solver & Golden Path finder
│   │   ├── sensitivity.ts              # 60fps Softmax logit perturbation engine
│   │   └── spatialLayout.ts            # Conical orbital 3D layout + force relaxation solver
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       └── server.ts                   # Server-side Supabase SSR client
├── shaders/
│   ├── filament.vert.glsl              # Tube spline vertex displacement
│   ├── filament.frag.glsl              # Probability pulse velocity, Fresnel glow, Golden Path shader
│   ├── nodeCore.vert.glsl              # Breathing harmonic sphere vertex shader
│   └── nodeCore.frag.glsl              # Obsidian glass + internal bioluminescent caustic core
└── store/
    └── useMultiverseStore.ts           # Zustand store (Graph state, active path, sensitivity deltas, camera mode)
```
