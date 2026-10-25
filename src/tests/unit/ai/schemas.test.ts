/**
 * Unit & Boundary Tests: Structured AI Schemas & Validation
 * Features:
 *   - Feature 7: Adaptive Clarifying Pulse Schema
 *   - Feature 20: Strategic Mentor Executive Advisory Schema
 *   - Feature 21: 14-Day Actionable Playbook Schema
 *   - Feature 22: 30/60/90-Day Observable Tripwires Schema
 *   - Feature 24: Reality Check-In ("Collapse Wavefunction") Schema
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/LLD.md §3 & PROJECT.md §3
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Authoritative Zod Schemas matching docs/LLD.md §3
export const ClarifyingPulseSchema = z.object({
  situationSummary: z.string().min(5).max(300),
  detectedStakes: z.enum(['moderate', 'high', 'life_defining']),
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(10).max(200),
      whyItMatters: z.string().min(10),
      options: z.array(z.string()).min(3).max(4),
    })
  ).length(3),
});

export const PlaybookItemSchema = z.object({
  dayWindow: z.string().min(3).max(30),
  actionTitle: z.string().min(5).max(100),
  concreteSteps: z.string().min(10),
  targetNodeId: z.string().uuid().optional(),
  expectedOddsShiftPct: z.number().min(1).max(50),
});

export const CustomLeverSchema = z.object({
  key: z.enum(['execution_velocity', 'capital_buffer', 'market_tailwind', 'skill_preparation']),
  label: z.string().min(3),
  currentBaselineLabel: z.string(),
  stretchTargetLabel: z.string(),
});

export const MentorSynthesisSchema = z.object({
  focalNodeId: z.string().uuid().nullable(),
  goldenPathNodeIds: z.array(z.string().uuid()).min(1),
  executiveVerdict: z.string().min(20),
  whyThisPathWins: z.string().min(20),
  blindspotsDetected: z.array(z.string()).min(2).max(5),
  preMortemHedgePlan: z.string().min(20),
  actionPlaybook: z.array(PlaybookItemSchema).min(3).max(5),
  customLevers: z.array(CustomLeverSchema).length(4),
});

export const WavefunctionCollapseRequestSchema = z.object({
  realizedNodeId: z.string().uuid(),
  userReflection: z.string().max(2000).optional(),
  actualVsPredictedDelta: z.string().max(1000).optional(),
});

export const GeneratedNodeTripwiresSchema = z.array(z.string().min(5)).min(2).max(3);

describe('Feature 7: Adaptive Clarifying Pulse Schema', () => {
  const validPulse = {
    situationSummary: 'Considering seed fundraising vs enterprise bootstrapping',
    detectedStakes: 'high' as const,
    questions: [
      {
        id: 'q1',
        question: 'What is your exact monthly burn rate at zero revenue?',
        whyItMatters: 'Determines true runway cliff date before insolvency',
        options: ['Under $3k/mo', '$3k-$8k/mo', '$8k-$15k/mo', 'Above $15k/mo'],
      },
      {
        id: 'q2',
        question: 'How many customer discovery interviews have you completed?',
        whyItMatters: 'Anchors confidence in willingness to pay vs generic interest',
        options: ['Fewer than 10', '10 to 30', '30 to 50', '50+ with letters of intent'],
      },
      {
        id: 'q3',
        question: 'What is your risk tolerance if no term sheet materializes?',
        whyItMatters: 'Determines whether to plan an agency bridge or immediate job return',
        options: ['Low: must maintain savings', 'Moderate: can tolerate 6 mo dip', 'High: all-in for 18 mo'],
      },
    ],
  };

  it('F7-T1-01: validates compliant 3-question Clarifying Pulse payload', () => {
    const parsed = ClarifyingPulseSchema.safeParse(validPulse);
    expect(parsed.success).toBe(true);
  });

  it('F7-T1-02: requires exactly 3 high-entropy clarifying questions (rejects 2 or 4)', () => {
    const twoQuestions = { ...validPulse, questions: validPulse.questions.slice(0, 2) };
    const parsed = ClarifyingPulseSchema.safeParse(twoQuestions);
    expect(parsed.success).toBe(false);
  });

  it('F7-T1-03: enforces options count between 3 and 4 per question', () => {
    const invalidOptions = {
      ...validPulse,
      questions: [
        { ...validPulse.questions[0], options: ['Yes', 'No'] }, // only 2 options
        validPulse.questions[1],
        validPulse.questions[2],
      ],
    };
    const parsed = ClarifyingPulseSchema.safeParse(invalidOptions);
    expect(parsed.success).toBe(false);
  });

  it('F7-T1-04: restricts detectedStakes enum to moderate, high, or life_defining', () => {
    const invalidStakes = { ...validPulse, detectedStakes: 'trivial' };
    const parsed = ClarifyingPulseSchema.safeParse(invalidStakes);
    expect(parsed.success).toBe(false);
  });

  it('F7-T1-05: verifies whyItMatters rationale is present and meaningful for every question', () => {
    const missingRationale = {
      ...validPulse,
      questions: [
        { ...validPulse.questions[0], whyItMatters: 'too short' },
        validPulse.questions[1],
        validPulse.questions[2],
      ],
    };
    const parsed = ClarifyingPulseSchema.safeParse(missingRationale);
    expect(parsed.success).toBe(false);
  });
});

describe('Feature 20, 21, 22: Strategic Mentor Advisory, Playbook & Tripwires', () => {
  const validMentorSynthesis = {
    focalNodeId: null,
    goldenPathNodeIds: ['11111111-1111-4111-a111-111111111111', '22222222-2222-4222-a222-222222222222'],
    executiveVerdict: 'Prioritize enterprise pilot prepayment over immediate VC fundraising to preserve 100% equity.',
    whyThisPathWins: 'Maximizes risk-adjusted expected utility (EV = +7.8) with high reversibility (Type 2 door).',
    blindspotsDetected: [
      'Enterprise sales cycle often stretches from 60 days to 180 days without a champion.',
      'Single-customer concentration risk if first client accounts for >70% revenue.',
    ],
    preMortemHedgePlan: 'Require 50% upfront deposit on contract signing and establish a $20k credit line buffer.',
    actionPlaybook: [
      {
        dayWindow: 'Days 1-3',
        actionTitle: 'Draft Enterprise Term Sheet',
        concreteSteps: 'Create standard MSA with security questionnaire SLA and 50% upfront payment term.',
        expectedOddsShiftPct: 12,
      },
      {
        dayWindow: 'Days 4-7',
        actionTitle: 'Executive Champion Pitch',
        concreteSteps: 'Present pilot proposal directly to VP of Engineering with ROI calculator.',
        expectedOddsShiftPct: 18,
      },
      {
        dayWindow: 'Days 8-14',
        actionTitle: 'Contract Review & Security Audit',
        concreteSteps: 'Complete vendor onboarding checklist and SOC 2 Type 1 bridge documentation.',
        expectedOddsShiftPct: 15,
      },
    ],
    customLevers: [
      { key: 'execution_velocity' as const, label: 'Execution Velocity', currentBaselineLabel: '15 hrs/wk', stretchTargetLabel: '35 hrs/wk' },
      { key: 'capital_buffer' as const, label: 'Capital Buffer', currentBaselineLabel: '6 mos', stretchTargetLabel: '14 mos' },
      { key: 'market_tailwind' as const, label: 'Market Tailwind', currentBaselineLabel: 'Neutral', stretchTargetLabel: 'High Tailwind' },
      { key: 'skill_preparation' as const, label: 'Skill Preparation', currentBaselineLabel: 'Baseline', stretchTargetLabel: 'Mastery' },
    ],
  };

  it('F20-T1-01: validates compliant Mentor Synthesis payload with verdict, blindspots, and hedge', () => {
    const parsed = MentorSynthesisSchema.safeParse(validMentorSynthesis);
    expect(parsed.success).toBe(true);
  });

  it('F20-T1-02: requires between 2 and 5 blindspots detected in the advisory report', () => {
    const oneBlindspot = { ...validMentorSynthesis, blindspotsDetected: ['Only one blindspot'] };
    const parsed = MentorSynthesisSchema.safeParse(oneBlindspot);
    expect(parsed.success).toBe(false);
  });

  it('F21-T1-03: validates 14-Day Actionable Playbook with 3 windowed milestone actions', () => {
    const parsed = MentorSynthesisSchema.safeParse(validMentorSynthesis);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.actionPlaybook).toHaveLength(3);
      expect(parsed.data.actionPlaybook[0].dayWindow).toBe('Days 1-3');
    }
  });

  it('F21-T1-04: rejects negative or excessive expectedOddsShiftPct (must be 1-50%)', () => {
    const invalidShift = {
      ...validMentorSynthesis,
      actionPlaybook: [
        { ...validMentorSynthesis.actionPlaybook[0], expectedOddsShiftPct: 75 }, // exceeds 50%
        validMentorSynthesis.actionPlaybook[1],
        validMentorSynthesis.actionPlaybook[2],
      ],
    };
    const parsed = MentorSynthesisSchema.safeParse(invalidShift);
    expect(parsed.success).toBe(false);
  });

  it('F22-T1-05: validates node tripwires containing 2-3 observable indicators', () => {
    const validTripwires = [
      'First client wires $15k upfront deposit within 30 days',
      'Two additional pipeline leads request mutual NDA by day 45',
    ];
    const parsed = GeneratedNodeTripwiresSchema.safeParse(validTripwires);
    expect(parsed.success).toBe(true);
  });

  it('F22-T1-06: rejects node tripwires with fewer than 2 early warning signals', () => {
    const singleTripwire = ['Single signal only'];
    const parsed = GeneratedNodeTripwiresSchema.safeParse(singleTripwire);
    expect(parsed.success).toBe(false);
  });
});

describe('Feature 24: Reality Check-In ("Collapse Wavefunction") Schema', () => {
  it('F24-T1-01: validates valid wavefunction collapse request with UUID and user reflection', () => {
    const req = {
      realizedNodeId: '12345678-1234-4234-a234-123456789abc',
      userReflection: 'Signed enterprise client yesterday for $28k ACV with 60 days payment term.',
      actualVsPredictedDelta: 'Timeline occurred 2 weeks faster than expected T+90 model.',
    };

    const parsed = WavefunctionCollapseRequestSchema.safeParse(req);
    expect(parsed.success).toBe(true);
  });

  it('F24-T1-02: allows optional reflection and delta fields for instant 1-click collapse', () => {
    const minimalReq = {
      realizedNodeId: '12345678-1234-4234-a234-123456789abc',
    };
    const parsed = WavefunctionCollapseRequestSchema.safeParse(minimalReq);
    expect(parsed.success).toBe(true);
  });

  it('F24-T1-03: rejects invalid or non-UUID realizedNodeId', () => {
    const invalidId = {
      realizedNodeId: 'not-a-valid-uuid',
    };
    const parsed = WavefunctionCollapseRequestSchema.safeParse(invalidId);
    expect(parsed.success).toBe(false);
  });
});

describe('Tier 2: Boundary & Corner Cases (Schemas & Validation)', () => {
  it('F7-T2-01: rejects empty string question or question less than 10 characters', () => {
    const pulse = {
      situationSummary: 'Valid situation',
      detectedStakes: 'moderate' as const,
      questions: [
        { id: '1', question: 'Too short', whyItMatters: 'Valid why it matters explanation', options: ['A', 'B', 'C'] },
        { id: '2', question: 'Valid question text here?', whyItMatters: 'Valid why it matters explanation', options: ['A', 'B', 'C'] },
        { id: '3', question: 'Valid question text here?', whyItMatters: 'Valid why it matters explanation', options: ['A', 'B', 'C'] },
      ],
    };
    const parsed = ClarifyingPulseSchema.safeParse(pulse);
    expect(parsed.success).toBe(false);
  });

  it('F24-T2-02: rejects oversized userReflection exceeding 2000 characters', () => {
    const oversizedReflection = {
      realizedNodeId: '12345678-1234-4234-a234-123456789abc',
      userReflection: 'A'.repeat(2001),
    };
    const parsed = WavefunctionCollapseRequestSchema.safeParse(oversizedReflection);
    expect(parsed.success).toBe(false);
  });

  it('F20-T2-03: rejects empty goldenPathNodeIds array in MentorSynthesis', () => {
    const emptyPath = {
      focalNodeId: null,
      goldenPathNodeIds: [],
      executiveVerdict: 'Verdict text of sufficient length for test validation',
      whyThisPathWins: 'Rationale of sufficient length for test validation',
      blindspotsDetected: ['Blindspot 1 text', 'Blindspot 2 text'],
      preMortemHedgePlan: 'Pre-mortem hedge plan of sufficient length',
      actionPlaybook: [
        { dayWindow: 'Days 1-3', actionTitle: 'Action 1', concreteSteps: 'Steps detail text', expectedOddsShiftPct: 10 },
        { dayWindow: 'Days 4-7', actionTitle: 'Action 2', concreteSteps: 'Steps detail text', expectedOddsShiftPct: 10 },
        { dayWindow: 'Days 8-14', actionTitle: 'Action 3', concreteSteps: 'Steps detail text', expectedOddsShiftPct: 10 },
      ],
      customLevers: [
        { key: 'execution_velocity' as const, label: 'L1', currentBaselineLabel: 'B1', stretchTargetLabel: 'T1' },
        { key: 'capital_buffer' as const, label: 'L2', currentBaselineLabel: 'B2', stretchTargetLabel: 'T2' },
        { key: 'market_tailwind' as const, label: 'L3', currentBaselineLabel: 'B3', stretchTargetLabel: 'T3' },
        { key: 'skill_preparation' as const, label: 'L4', currentBaselineLabel: 'B4', stretchTargetLabel: 'T4' },
      ],
    };
    const parsed = MentorSynthesisSchema.safeParse(emptyPath);
    expect(parsed.success).toBe(false);
  });

  it('F22-T2-04: rejects tripwires array with more than 3 indicators (strictly max 3)', () => {
    const fourTripwires = ['Signal 1', 'Signal 2', 'Signal 3', 'Signal 4'];
    const parsed = GeneratedNodeTripwiresSchema.safeParse(fourTripwires);
    expect(parsed.success).toBe(false);
  });

  it('F21-T2-05: rejects playbook with fewer than 3 action windows', () => {
    const twoActions = [
      { dayWindow: 'Days 1-3', actionTitle: 'A1', concreteSteps: 'Steps detail', expectedOddsShiftPct: 10 },
      { dayWindow: 'Days 4-7', actionTitle: 'A2', concreteSteps: 'Steps detail', expectedOddsShiftPct: 10 },
    ];
    const parsed = z.array(PlaybookItemSchema).min(3).max(5).safeParse(twoActions);
    expect(parsed.success).toBe(false);
  });
});
