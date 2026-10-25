/**
 * Authoritative User Context Digital Twin Fixtures
 * Derived from docs/PRD.md §3, docs/LLD.md §1 & §2.2
 */

import { UserContextTwin } from './multiverse-types';

export const mockConservativeTwin: UserContextTwin = {
  riskAppetite: 'conservative',
  runwayMonths: 24.0,
  primaryDomain: 'Executive Career Transition',
  coreValues: {
    wealthCompounding: 0.6,
    autonomyFreedom: 0.5,
    masteryCraft: 0.7,
    stabilitySecurity: 0.95,
    impactLegacy: 0.5,
    peaceWellbeing: 0.85,
  },
  personalConstraints: [
    'Mortgage obligation of $4,500/month',
    'Cannot relocate outside North America',
    'Minimum 18 months emergency buffer',
  ],
};

export const mockMeasuredTwin: UserContextTwin = {
  riskAppetite: 'measured',
  runwayMonths: 14.0,
  primaryDomain: 'Founder / SaaS Pivot',
  coreValues: {
    wealthCompounding: 0.8,
    autonomyFreedom: 0.9,
    masteryCraft: 0.85,
    stabilitySecurity: 0.6,
    impactLegacy: 0.75,
    peaceWellbeing: 0.7,
  },
  personalConstraints: [
    'Solo founder seeking profitability before hiring',
    'Targeting $20k MRR before external capital',
  ],
};

export const mockAggressiveTwin: UserContextTwin = {
  riskAppetite: 'aggressive',
  runwayMonths: 8.0,
  primaryDomain: 'Senior Tech to Solo AI Studio',
  coreValues: {
    wealthCompounding: 0.9,
    autonomyFreedom: 0.95,
    masteryCraft: 0.9,
    stabilitySecurity: 0.35,
    impactLegacy: 0.85,
    peaceWellbeing: 0.5,
  },
  personalConstraints: [
    'Willing to work 70 hours/week for first 6 months',
    'Must launch 3 rapid MVPs within 90 days',
  ],
};

export const mockAsymmetricTwin: UserContextTwin = {
  riskAppetite: 'asymmetric',
  runwayMonths: 6.0,
  primaryDomain: 'Global Relocation & High-Beta AI Venture',
  coreValues: {
    wealthCompounding: 0.95,
    autonomyFreedom: 1.0,
    masteryCraft: 0.9,
    stabilitySecurity: 0.2,
    impactLegacy: 0.9,
    peaceWellbeing: 0.4,
  },
  personalConstraints: [
    'Zero local geographic attachment',
    'Maximum upside optimization with strict stop-loss at 3 months runway',
  ],
};
