/**
 * Multiverse Domain Models & Interface Contracts
 * Authoritative Source: PROJECT.md §1 & docs/LLD.md §1-§3
 */

export type NodeRegimeTier = 'root' | 'baseline_wave_1' | 'contrarian_wave_2' | 'tail_risk_wave_3_plus';
export type ReversibilityDoorType = 'type_1_irreversible' | 'type_2_reversible' | 'hybrid';
export type NodeLifecycleStatus = 'active' | 'realized' | 'pruned' | 'archived';
export type RiskAppetiteLevel = 'conservative' | 'measured' | 'aggressive' | 'asymmetric';
export type SubscriptionTier = 'observer' | 'strategist' | 'oracle';

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

export interface SensitivityWeights {
  executionVelocity: number; // [-2.0, +2.0]
  capitalBuffer: number;     // [-2.0, +2.0]
  marketTailwind: number;    // [-2.0, +2.0]
  skillPreparation: number;  // [-2.0, +2.0]
}

export interface CausalDriver {
  factor: string;
  influence: 'catalyst' | 'bottleneck' | 'structural';
  weight: number; // [0.1, 1.0]
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
  summaryHeadline?: string;
  narrativeForecast?: string;
  narrativeSummary?: string;
  timeHorizon: string; // e.g. "3-6 Months"
  timeHorizonDays?: number;
  conditionalProbability: number; // P(B|A) in [0, 1]
  cumulativeProbability: number;  // P(path) in [0, 1]
  rawLlmConfidence: number;
  unexploredChildMass: number;    // M_unexplored for horizontal expansion
  causalDrivers: (string | CausalDriver)[];
  reversibilityType: ReversibilityDoorType;
  reversibilityScore: number;     // [0.0, 10.0]
  regretMinimizationScore: number;// [0.0, 10.0]
  impactVector: ImpactVector;
  expectedUtilityScore?: number;
  isGoldenPath: boolean;
  status: NodeLifecycleStatus;
  userInterventionPrompt?: string;
  spatialPosition: SpatialCoordinates;
  sensitivityWeights: SensitivityWeights;
  tripwires: string[];
  createdAt: string;
}

export interface UserCoreValues {
  wealthCompounding: number; // [0.0, 1.0]
  autonomyFreedom: number;   // [0.0, 1.0]
  masteryCraft: number;      // [0.0, 1.0]
  stabilitySecurity: number;  // [0.0, 1.0]
  impactLegacy: number;      // [0.0, 1.0]
  peaceWellbeing: number;    // [0.0, 1.0]
}

export interface UserContextTwin {
  riskAppetite: RiskAppetiteLevel;
  runwayMonths: number;
  primaryDomain: string;
  coreValues: UserCoreValues;
  personalConstraints?: string[];
}

export interface MentorSynthesis {
  focalNodeId: string | null;
  goldenPathNodeIds: string[];
  executiveVerdict: string;
  whyThisPathWins: string;
  blindspotsDetected: string[];
  preMortemHedgePlan: string;
  actionPlaybook: {
    dayWindow: string; // e.g., 'Days 1-3'
    actionTitle: string;
    concreteSteps: string;
    expectedOddsShiftPct: number;
  }[];
  customLevers: {
    key: 'execution_velocity' | 'capital_buffer' | 'market_tailwind' | 'skill_preparation';
    label: string;
    currentBaselineLabel: string;
    stretchTargetLabel: string;
  }[];
}
