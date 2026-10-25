/**
 * Executive Decision Dossier Export Generator
 * Authoritative Source: docs/PRD.md §5, docs/ROADMAP.md Phase 5 & PROJECT.md §1
 */

import { ProbabilityNode, UserContextTwin } from './types/multiverse';

export interface MentorSynthesisData {
  executiveVerdict?: string;
  whyThisPathWins?: string;
  blindspotsDetected?: string[];
  preMortemHedgePlan?: string;
  actionPlaybook?: Array<{
    dayWindow: string;
    actionTitle: string;
    concreteSteps: string;
    expectedOddsShiftPct: number;
  }>;
}

export function generateExecutiveDossierMarkdown(params: {
  situation: string;
  twin: UserContextTwin;
  goldenPathNodes: ProbabilityNode[];
  mentorSynthesis?: MentorSynthesisData;
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
