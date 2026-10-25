import { z } from 'zod';

export const ImpactVectorSchema = z.object({
  wealth: z.number().min(-10).max(10),
  autonomy: z.number().min(-10).max(10),
  mastery: z.number().min(-10).max(10),
  stability: z.number().min(-10).max(10),
  impact: z.number().min(-10).max(10),
  peace: z.number().min(-10).max(10),
});

export const SpatialCoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const SensitivityWeightsSchema = z.object({
  executionVelocity: z.number().min(-2).max(2),
  capitalBuffer: z.number().min(-2).max(2),
  marketTailwind: z.number().min(-2).max(2),
  skillPreparation: z.number().min(-2).max(2),
});

export const UserCoreValuesSchema = z.object({
  wealthCompounding: z.number(),
  autonomyFreedom: z.number(),
  masteryCraft: z.number(),
  stabilitySecurity: z.number(),
  impactLegacy: z.number(),
  peaceWellbeing: z.number(),
});

export const UserContextTwinSchema = z.object({
  riskAppetite: z.enum(['conservative', 'measured', 'aggressive', 'asymmetric']),
  runwayMonths: z.number().min(0).max(120),
  primaryDomain: z.string().min(1),
  coreValues: UserCoreValuesSchema,
  personalConstraints: z.array(z.string()).optional(),
});

export const ClarifyingPulseRequestSchema = z.object({
  situationPrompt: z.string().min(1),
  userContextTwin: UserContextTwinSchema.optional(),
});

export const ClarifyingPulseResponseSchema = z.object({
  needsClarification: z.boolean(),
  entropyScore: z.number().optional(),
  questions: z.array(z.string()).optional(),
});

export const GenerateWaveRequestSchema = z.object({
  simulationId: z.string(),
  parentId: z.string().nullable(),
  depth: z.number().int().min(0),
  waveNumber: z.number().int().min(1),
  userInterventionPrompt: z.string().optional(),
  userContextTwin: UserContextTwinSchema.optional(),
});

export const RealityCheckInRequestSchema = z.object({
  simulationId: z.string(),
  realizedNodeId: z.string(),
  reflectionNotes: z.string().optional(),
});
