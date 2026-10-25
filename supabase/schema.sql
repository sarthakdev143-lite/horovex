-- ============================================================================
-- HOROVEX PRODUCTION DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Authoritative Source: docs/LLD.md §1
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE subscription_tier AS ENUM ('observer', 'strategist', 'oracle');
CREATE TYPE risk_appetite_level AS ENUM ('conservative', 'measured', 'aggressive', 'asymmetric');
CREATE TYPE node_regime_tier AS ENUM ('root', 'baseline_wave_1', 'contrarian_wave_2', 'tail_risk_wave_3_plus');
CREATE TYPE reversibility_door_type AS ENUM ('type_1_irreversible', 'type_2_reversible', 'hybrid');
CREATE TYPE node_lifecycle_status AS ENUM ('active', 'realized', 'pruned', 'archived');

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier subscription_tier NOT NULL DEFAULT 'observer',
    simulations_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Personal Context Digital Twin
CREATE TABLE IF NOT EXISTS public.user_context_twins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    risk_appetite risk_appetite_level NOT NULL DEFAULT 'measured',
    runway_months NUMERIC(5, 1) DEFAULT 12.0,
    primary_domain TEXT DEFAULT 'Founder / Career Strategy',
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

-- 3. Multiverse Simulations (Canvases)
CREATE TABLE IF NOT EXISTS public.simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    root_situation TEXT NOT NULL,
    domain_category TEXT NOT NULL DEFAULT 'strategic',
    calibration_context JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_value_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    golden_path_node_ids UUID[] DEFAULT '{}',
    total_nodes_count INT NOT NULL DEFAULT 1,
    max_depth_reached INT NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Recursive Probability Nodes (DAG & ltree Lineage)
CREATE TABLE IF NOT EXISTS public.probability_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    tree_path ltree NOT NULL,
    depth INT NOT NULL DEFAULT 0 CHECK (depth >= 0),
    wave_number INT NOT NULL DEFAULT 1 CHECK (wave_number >= 1),
    sibling_index INT NOT NULL DEFAULT 1 CHECK (sibling_index >= 1),
    regime_tier node_regime_tier NOT NULL DEFAULT 'baseline_wave_1',
    user_intervention_prompt TEXT,
    title TEXT NOT NULL,
    summary_headline TEXT NOT NULL,
    narrative_forecast TEXT NOT NULL,
    time_horizon_label TEXT NOT NULL,
    time_horizon_days INT NOT NULL DEFAULT 90,
    raw_llm_confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.2000,
    conditional_probability NUMERIC(5, 4) NOT NULL CHECK (conditional_probability >= 0 AND conditional_probability <= 1),
    cumulative_probability NUMERIC(6, 5) NOT NULL CHECK (cumulative_probability >= 0 AND cumulative_probability <= 1),
    causal_drivers JSONB NOT NULL DEFAULT '[]'::jsonb,
    impact_vector JSONB NOT NULL DEFAULT '{
        "wealth_compounding": 0,
        "autonomy_freedom": 0,
        "mastery_craft": 0,
        "stability_security": 0,
        "impact_legacy": 0,
        "peace_wellbeing": 0
    }'::jsonb,
    reversibility_type reversibility_door_type NOT NULL DEFAULT 'type_2_reversible',
    reversibility_score NUMERIC(4, 2) NOT NULL DEFAULT 7.0,
    regret_minimization_score NUMERIC(4, 2) NOT NULL DEFAULT 5.0,
    expected_utility_score NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
    sensitivity_weights JSONB NOT NULL DEFAULT '{
        "execution_velocity": 0.0,
        "capital_buffer": 0.0,
        "market_tailwind": 0.0,
        "skill_preparation": 0.0
    }'::jsonb,
    tripwire_signals TEXT[] DEFAULT '{}',
    spatial_position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    is_golden_path BOOLEAN NOT NULL DEFAULT FALSE,
    unexplored_child_mass NUMERIC(5, 4) NOT NULL DEFAULT 1.0000,
    status node_lifecycle_status NOT NULL DEFAULT 'active',
    semantic_embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Mentor Synthesis & Golden Path Advisory
CREATE TABLE IF NOT EXISTS public.mentor_syntheses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    focal_node_id UUID REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    golden_path_node_ids UUID[] NOT NULL,
    executive_verdict TEXT NOT NULL,
    why_this_path_wins TEXT NOT NULL,
    blindspots_detected TEXT[] NOT NULL DEFAULT '{}',
    pre_mortem_hedge_plan TEXT NOT NULL,
    action_playbook JSONB NOT NULL DEFAULT '[]'::jsonb,
    custom_levers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Reality Check-Ins ("Collapse the Wavefunction")
CREATE TABLE IF NOT EXISTS public.reality_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    realized_node_id UUID NOT NULL REFERENCES public.probability_nodes(id) ON DELETE CASCADE,
    user_reflection TEXT,
    actual_vs_predicted_delta TEXT,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nodes_simulation_id ON public.probability_nodes(simulation_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON public.probability_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_nodes_tree_path_gist ON public.probability_nodes USING GIST (tree_path);
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.simulations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_syntheses_simulation_id ON public.mentor_syntheses(simulation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reality_checkins_simulation_id ON public.reality_checkins(simulation_id, checked_in_at DESC);

-- Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probability_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_checkins ENABLE ROW LEVEL SECURITY;
