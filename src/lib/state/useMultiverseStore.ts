import { create } from 'zustand';
import {
  ProbabilityNode,
  UserContextTwin,
  NodeLifecycleStatus,
} from '@/lib/types/multiverse';

export interface SensitivityLevers {
  executionVelocity: number; // [-1.0, 1.0]
  capitalBuffer: number;     // [-1.0, 1.0]
  marketTailwind: number;    // [-1.0, 1.0]
  skillPreparation: number;  // [-1.0, 1.0]
}

export interface MultiverseState {
  // Reactive Graph Slice
  activeSimulationId: string | null;
  rootNodeId: string | null;
  nodes: Record<string, ProbabilityNode>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  goldenPathNodeIds: string[];
  
  // Exploration Telemetry
  activeDepth: number;
  maxWaveNumber: number;
  exploredMass: number;
  unexploredMass: number;
  viewMode: '3d' | '2d';

  // Digital Twin Context
  userContextTwin: UserContextTwin;

  // Real-Time 60 FPS Sensitivity Levers
  sensitivityLevers: SensitivityLevers;

  // Actions
  setNodes: (nodes: Record<string, ProbabilityNode> | ProbabilityNode[]) => void;
  addNodes: (nodes: ProbabilityNode[]) => void;
  updateNode: (id: string, updates: Partial<ProbabilityNode>) => void;
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setGoldenPath: (pathIds: string[]) => void;
  setSensitivityLevers: (levers: Partial<SensitivityLevers>) => void;
  setUserContextTwin: (twin: Partial<UserContextTwin>) => void;
  setViewMode: (mode: '3d' | '2d') => void;
  collapseWavefunction: (realizedNodeId: string) => void;
  resetSimulation: () => void;
}

const DEFAULT_TWIN: UserContextTwin = {
  riskAppetite: 'measured',
  runwayMonths: 14,
  primaryDomain: 'Technology & Enterprise SaaS',
  coreValues: {
    wealthCompounding: 8.5,
    autonomyFreedom: 9.0,
    masteryCraft: 8.0,
    stabilitySecurity: 6.5,
    impactLegacy: 7.5,
    peaceWellbeing: 7.0,
  },
  personalConstraints: [
    'Minimum 12 months liquid runway required at all times',
    'No high-leverage debt financing',
  ],
};

const DEFAULT_LEVERS: SensitivityLevers = {
  executionVelocity: 0.0,
  capitalBuffer: 0.0,
  marketTailwind: 0.0,
  skillPreparation: 0.0,
};

// Seed dataset for immediate flagship interactive experience
export const SEED_NODES: Record<string, ProbabilityNode> = {
  'root-1': {
    id: 'root-1',
    simulationId: 'sim-founder-pivot',
    parentId: null,
    treePath: 'root-1',
    depth: 0,
    waveNumber: 1,
    siblingIndex: 1,
    regimeTier: 'root',
    title: 'Founder SaaS Dilemma: Enterprise vs. Bootstrap',
    narrativeSummary: 'Evaluating enterprise contract sales expansion vs. remaining lean self-serve.',
    timeHorizon: 'Present (T_0)',
    conditionalProbability: 1.0,
    cumulativeProbability: 1.0,
    rawLlmConfidence: 1.0,
    unexploredChildMass: 0.20,
    causalDrivers: ['Runway limitation', 'Inbound enterprise pilot requests', 'Engineering capacity'],
    reversibilityType: 'hybrid',
    reversibilityScore: 7.5,
    regretMinimizationScore: 8.0,
    impactVector: { wealth: 0, autonomy: 0, mastery: 0, stability: 0, impact: 0, peace: 0 },
    expectedUtilityScore: 0.0,
    isGoldenPath: true,
    status: 'active',
    spatialPosition: { x: 0, y: 0, z: 0 },
    sensitivityWeights: { executionVelocity: 0, capitalBuffer: 0, marketTailwind: 0, skillPreparation: 0 },
    tripwires: ['Cash burn rate > $45k/mo', '3 prospective pilots requesting SOC2'],
    createdAt: new Date().toISOString(),
  },
  'n1-enterprise-pivot': {
    id: 'n1-enterprise-pivot',
    simulationId: 'sim-founder-pivot',
    parentId: 'root-1',
    treePath: 'root-1.n1-enterprise-pivot',
    depth: 1,
    waveNumber: 1,
    siblingIndex: 1,
    regimeTier: 'baseline_wave_1',
    title: 'Strategic Enterprise Pivot',
    narrativeSummary: 'Hire 2 enterprise reps, pursue 6-figure ACV contracts with annual prepay.',
    timeHorizon: '3-6 Months',
    conditionalProbability: 0.28,
    cumulativeProbability: 0.28,
    rawLlmConfidence: 0.88,
    unexploredChildMass: 0.20,
    causalDrivers: ['Enterprise ACV expansion', 'SOC2 compliance gate', 'High customer LTV'],
    reversibilityType: 'type_2_reversible',
    reversibilityScore: 6.8,
    regretMinimizationScore: 9.2,
    impactVector: { wealth: 8.5, autonomy: 6.0, mastery: 8.0, stability: 7.0, impact: 8.5, peace: 5.5 },
    expectedUtilityScore: 8.42,
    isGoldenPath: true,
    status: 'active',
    spatialPosition: { x: -6.5, y: 3.2, z: -14.0 },
    sensitivityWeights: { executionVelocity: 0.45, capitalBuffer: 0.35, marketTailwind: 0.25, skillPreparation: 0.40 },
    tripwires: ['First enterprise LOI signed within 90 days', 'Annual contract value >= $60,000'],
    createdAt: new Date().toISOString(),
  },
  'n1-self-serve-growth': {
    id: 'n1-self-serve-growth',
    simulationId: 'sim-founder-pivot',
    parentId: 'root-1',
    treePath: 'root-1.n1-self-serve-growth',
    depth: 1,
    waveNumber: 1,
    siblingIndex: 2,
    regimeTier: 'baseline_wave_1',
    title: 'Product-Led Self-Serve Blitz',
    narrativeSummary: 'Optimize PLG funnel, lower price point, rely on viral self-service adoption.',
    timeHorizon: '3-6 Months',
    conditionalProbability: 0.22,
    cumulativeProbability: 0.22,
    rawLlmConfidence: 0.72,
    unexploredChildMass: 0.20,
    causalDrivers: ['Viral loops', 'Self-serve conversion friction', 'Low CAC target'],
    reversibilityType: 'type_2_reversible',
    reversibilityScore: 8.5,
    regretMinimizationScore: 6.5,
    impactVector: { wealth: 6.0, autonomy: 9.0, mastery: 6.5, stability: 5.5, impact: 7.0, peace: 7.5 },
    expectedUtilityScore: 6.85,
    isGoldenPath: false,
    status: 'active',
    spatialPosition: { x: -3.2, y: 1.5, z: -14.0 },
    sensitivityWeights: { executionVelocity: 0.60, capitalBuffer: 0.10, marketTailwind: 0.50, skillPreparation: 0.20 },
    tripwires: ['Monthly signups > 2,500', 'Self-serve free-to-paid conversion >= 3.2%'],
    createdAt: new Date().toISOString(),
  },
  'n1-hybrid-licensing': {
    id: 'n1-hybrid-licensing',
    simulationId: 'sim-founder-pivot',
    parentId: 'root-1',
    treePath: 'root-1.n1-hybrid-licensing',
    depth: 1,
    waveNumber: 1,
    siblingIndex: 3,
    regimeTier: 'baseline_wave_1',
    title: 'OEM Platform Licensing',
    narrativeSummary: 'White-label technology engine to incumbent vertical software platforms.',
    timeHorizon: '6-9 Months',
    conditionalProbability: 0.14,
    cumulativeProbability: 0.14,
    rawLlmConfidence: 0.52,
    unexploredChildMass: 0.20,
    causalDrivers: ['Channel partner distribution', 'Integration lock-in', 'Revenue share'],
    reversibilityType: 'type_1_irreversible',
    reversibilityScore: 4.2,
    regretMinimizationScore: 5.8,
    impactVector: { wealth: 7.2, autonomy: 4.5, mastery: 7.0, stability: 8.0, impact: 6.0, peace: 6.0 },
    expectedUtilityScore: 5.92,
    isGoldenPath: false,
    status: 'active',
    spatialPosition: { x: 0.5, y: -0.8, z: -14.0 },
    sensitivityWeights: { executionVelocity: 0.20, capitalBuffer: 0.50, marketTailwind: 0.30, skillPreparation: 0.50 },
    tripwires: ['Channel partner integration milestone within 120 days'],
    createdAt: new Date().toISOString(),
  },
  'n1-agency-cashflow': {
    id: 'n1-agency-cashflow',
    simulationId: 'sim-founder-pivot',
    parentId: 'root-1',
    treePath: 'root-1.n1-agency-cashflow',
    depth: 1,
    waveNumber: 1,
    siblingIndex: 4,
    regimeTier: 'baseline_wave_1',
    title: 'Bespoke Advisory Cashflow Buffer',
    narrativeSummary: 'Take on high-ticket custom engineering retainers to extend runway indefinitely.',
    timeHorizon: '1-3 Months',
    conditionalProbability: 0.10,
    cumulativeProbability: 0.10,
    rawLlmConfidence: 0.40,
    unexploredChildMass: 0.20,
    causalDrivers: ['Services distraction risk', 'Immediate non-dilutive capital', 'Client retainers'],
    reversibilityType: 'type_2_reversible',
    reversibilityScore: 9.0,
    regretMinimizationScore: 4.0,
    impactVector: { wealth: 5.5, autonomy: 5.0, mastery: 6.0, stability: 9.0, impact: 4.0, peace: 4.5 },
    expectedUtilityScore: 5.15,
    isGoldenPath: false,
    status: 'active',
    spatialPosition: { x: 4.2, y: -2.1, z: -14.0 },
    sensitivityWeights: { executionVelocity: -0.20, capitalBuffer: 0.70, marketTailwind: -0.10, skillPreparation: 0.60 },
    tripwires: ['Retainer income > $30k/mo achieved within 45 days'],
    createdAt: new Date().toISOString(),
  },
  'n1-defensive-consolidation': {
    id: 'n1-defensive-consolidation',
    simulationId: 'sim-founder-pivot',
    parentId: 'root-1',
    treePath: 'root-1.n1-defensive-consolidation',
    depth: 1,
    waveNumber: 1,
    siblingIndex: 5,
    regimeTier: 'baseline_wave_1',
    title: 'Defensive Burn Reduction & Maintenance',
    narrativeSummary: 'Slash expenses, pause aggressive customer acquisition, preserve remaining buffer.',
    timeHorizon: 'Immediate',
    conditionalProbability: 0.06,
    cumulativeProbability: 0.06,
    rawLlmConfidence: 0.25,
    unexploredChildMass: 0.20,
    causalDrivers: ['Extreme runway preservation', 'Momentum loss', 'Talent attrition risk'],
    reversibilityType: 'type_2_reversible',
    reversibilityScore: 7.0,
    regretMinimizationScore: 2.5,
    impactVector: { wealth: 2.0, autonomy: 4.0, mastery: 3.5, stability: 8.5, impact: 2.0, peace: 3.5 },
    expectedUtilityScore: 3.40,
    isGoldenPath: false,
    status: 'active',
    spatialPosition: { x: 7.8, y: -4.5, z: -14.0 },
    sensitivityWeights: { executionVelocity: -0.60, capitalBuffer: 0.40, marketTailwind: -0.40, skillPreparation: -0.10 },
    tripwires: ['Burn rate reduced by 50% within 30 days'],
    createdAt: new Date().toISOString(),
  },
};

export const useMultiverseStore = create<MultiverseState>((set, get) => ({
  activeSimulationId: 'sim-founder-pivot',
  rootNodeId: 'root-1',
  nodes: SEED_NODES,
  selectedNodeId: 'n1-enterprise-pivot',
  hoveredNodeId: null,
  goldenPathNodeIds: ['root-1', 'n1-enterprise-pivot'],
  activeDepth: 1,
  maxWaveNumber: 1,
  exploredMass: 0.80,
  unexploredMass: 0.20,
  viewMode: '3d',
  userContextTwin: DEFAULT_TWIN,
  sensitivityLevers: DEFAULT_LEVERS,

  setNodes: (newNodes) => {
    if (Array.isArray(newNodes)) {
      const map: Record<string, ProbabilityNode> = {};
      newNodes.forEach((n) => {
        map[n.id] = n;
      });
      set({ nodes: map });
    } else {
      set({ nodes: newNodes });
    }
  },

  addNodes: (newNodesList) => {
    set((state) => {
      const updated = { ...state.nodes };
      newNodesList.forEach((node) => {
        updated[node.id] = node;
      });
      return { nodes: updated };
    });
  },

  updateNode: (id, updates) => {
    set((state) => {
      if (!state.nodes[id]) return state;
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...state.nodes[id],
            ...updates,
          },
        },
      };
    });
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  setHoveredNode: (nodeId) => {
    set({ hoveredNodeId: nodeId });
  },

  setGoldenPath: (pathIds) => {
    set({ goldenPathNodeIds: pathIds });
  },

  setSensitivityLevers: (levers) => {
    set((state) => ({
      sensitivityLevers: {
        ...state.sensitivityLevers,
        ...levers,
      },
    }));
  },

  setUserContextTwin: (twin) => {
    set((state) => ({
      userContextTwin: {
        ...state.userContextTwin,
        ...twin,
      },
    }));
  },

  setViewMode: (viewMode) => {
    set({ viewMode });
  },

  collapseWavefunction: (realizedNodeId) => {
    set((state) => {
      const target = state.nodes[realizedNodeId];
      if (!target || !target.parentId) return state;

      const updated = { ...state.nodes };
      // Mark realized node
      updated[realizedNodeId] = {
        ...target,
        status: 'realized',
      };

      // Prune siblings of the realized node
      Object.values(updated).forEach((node) => {
        if (node.parentId === target.parentId && node.id !== realizedNodeId) {
          updated[node.id] = {
            ...node,
            status: 'pruned',
          };
        }
      });

      return {
        nodes: updated,
        rootNodeId: realizedNodeId,
      };
    });
  },

  resetSimulation: () => {
    set({
      nodes: SEED_NODES,
      selectedNodeId: 'n1-enterprise-pivot',
      hoveredNodeId: null,
      goldenPathNodeIds: ['root-1', 'n1-enterprise-pivot'],
      sensitivityLevers: DEFAULT_LEVERS,
    });
  },
}));
