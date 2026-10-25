import {
  NodeRegimeTier,
  ReversibilityDoorType,
  NodeLifecycleStatus,
  RiskAppetiteLevel,
  SubscriptionTier,
  ImpactVector,
  SpatialCoordinates,
  SensitivityWeights,
} from './multiverse';

export interface DbProfile {
  id: string;
  email: string;
  fullName?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface DbSimulation {
  id: string;
  userId?: string | null;
  title: string;
  situationPrompt: string;
  rootNodeId?: string | null;
  activeDepth: number;
  maxWaveNumber: number;
  totalMassExplored: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbProbabilityNode {
  id: string;
  simulationId: string;
  parentId: string | null;
  treePath: string;
  depth: number;
  waveNumber: number;
  siblingIndex: number;
  regimeTier: NodeRegimeTier;
  title: string;
  narrativeSummary?: string;
  timeHorizon: string;
  conditionalProbability: number;
  cumulativeProbability: number;
  rawLlmConfidence: number;
  unexploredChildMass: number;
  causalDrivers: any;
  reversibilityType: ReversibilityDoorType;
  reversibilityScore: number;
  regretMinimizationScore: number;
  impactVector: ImpactVector;
  expectedUtilityScore?: number;
  isGoldenPath: boolean;
  status: NodeLifecycleStatus;
  spatialPosition: SpatialCoordinates;
  sensitivityWeights: SensitivityWeights;
  tripwires: string[];
  createdAt: string;
}

export interface DbRealityCheckIn {
  id: string;
  simulationId: string;
  realizedNodeId: string;
  notes?: string;
  createdAt: string;
}
