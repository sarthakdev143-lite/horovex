/**
 * Unit Tests: Executive Decision Dossier Export
 * Features:
 *   - Feature 30: Executive Decision Dossier Export
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 * Authoritative Source: docs/PRD.md §5, docs/ROADMAP.md Phase 5 & PROJECT.md §1
 */

import { describe, it, expect } from 'vitest';
import { ProbabilityNode, UserContextTwin, MentorSynthesis } from '../../fixtures/multiverse-types';
import { mockMeasuredTwin } from '../../fixtures/mock-twins';
import { mockRootNode, mockWave1Siblings } from '../../fixtures/mock-nodes';

export function generateExecutiveDossierMarkdown(params: {
  situation: string;
  twin: UserContextTwin;
  goldenPathNodes: ProbabilityNode[];
  mentorSynthesis?: Partial<MentorSynthesis>;
}): string {
  const { situation, twin, goldenPathNodes, mentorSynthesis } = params;

  let md = `# HOROVEX EXECUTIVE DECISION DOSSIER\n\n`;
  md += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Domain**: ${twin.primaryDomain}\n`;
  md += `**Risk Profile**: ${twin.riskAppetite.toUpperCase()} (Runway: ${twin.runwayMonths} months)\n\n`;

  md += `## 1. Core Crossroads & Context\n`;
  md += `${situation}\n\n`;

  md += `## 2. The Golden Path Trajectory\n`;
  for (const node of goldenPathNodes) {
    md += `- **[${node.timeHorizon}] ${node.title}** (P = ${(node.conditionalProbability * 100).toFixed(1)}%, Reversibility: ${node.reversibilityType})\n`;
    if (node.tripwires && node.tripwires.length > 0) {
      md += `  - *Tripwire*: ${node.tripwires[0]}\n`;
    }
  }
  md += `\n`;

  if (mentorSynthesis) {
    if (mentorSynthesis.executiveVerdict) {
      md += `## 3. Mentor Executive Verdict\n`;
      md += `${mentorSynthesis.executiveVerdict}\n\n`;
    }
    if (mentorSynthesis.preMortemHedgePlan) {
      md += `## 4. Pre-Mortem Risk & Hedge Plan\n`;
      md += `${mentorSynthesis.preMortemHedgePlan}\n\n`;
    }
    if (mentorSynthesis.actionPlaybook && mentorSynthesis.actionPlaybook.length > 0) {
      md += `## 5. 14-Day Action Playbook\n`;
      for (const action of mentorSynthesis.actionPlaybook) {
        md += `- **${action.dayWindow}**: ${action.actionTitle} (+${action.expectedOddsShiftPct}% odds shift)\n`;
        md += `  - ${action.concreteSteps}\n`;
      }
    }
  }

  return md;
}

describe('Feature 30: Executive Decision Dossier Export', () => {
  const sampleParams = {
    situation: 'Founder crossroads: Enterprise bootstrapping vs. Institutional Seed',
    twin: mockMeasuredTwin,
    goldenPathNodes: [mockRootNode, mockWave1Siblings[0]],
    mentorSynthesis: {
      executiveVerdict: 'Prioritize self-funded enterprise customer prepayment to retain 100% equity.',
      preMortemHedgePlan: 'Require 50% upfront deposit on contract signing and establish a $20k credit line buffer.',
      actionPlaybook: [
        { dayWindow: 'Days 1-3', actionTitle: 'Draft Enterprise MSA', concreteSteps: 'Draft standard SLA with 50% upfront payment term.', expectedOddsShiftPct: 15 },
      ],
    },
  };

  it('F30-T1-01: compiles complete formatted Markdown decision brief', () => {
    const md = generateExecutiveDossierMarkdown(sampleParams);
    expect(md).toContain('# HOROVEX EXECUTIVE DECISION DOSSIER');
    expect(md).toContain('## 1. Core Crossroads & Context');
    expect(md).toContain('## 2. The Golden Path Trajectory');
  });

  it('F30-T1-02: includes Digital Twin risk profile and runway metrics in header', () => {
    const md = generateExecutiveDossierMarkdown(sampleParams);
    expect(md).toContain('MEASURED');
    expect(md).toContain('14 months');
  });

  it('F30-T1-03: formats Golden Path milestones with probability percentage and reversibility classification', () => {
    const md = generateExecutiveDossierMarkdown(sampleParams);
    expect(md).toContain('Self-Funded Enterprise Micro-Pivot');
    expect(md).toContain('P = 28.0%');
    expect(md).toContain('Reversibility: type_2_reversible');
  });

  it('F30-T1-04: includes Mentor Executive Verdict and Pre-Mortem Hedge Plan sections', () => {
    const md = generateExecutiveDossierMarkdown(sampleParams);
    expect(md).toContain('## 3. Mentor Executive Verdict');
    expect(md).toContain('Prioritize self-funded enterprise customer prepayment');
    expect(md).toContain('## 4. Pre-Mortem Risk & Hedge Plan');
  });

  it('F30-T1-05: incorporates windowed 14-Day Action Playbook with odds shift percentages', () => {
    const md = generateExecutiveDossierMarkdown(sampleParams);
    expect(md).toContain('## 5. 14-Day Action Playbook');
    expect(md).toContain('Days 1-3');
    expect(md).toContain('+15% odds shift');
  });
});
