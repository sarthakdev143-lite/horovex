/**
 * Unit Tests: Synchronized 2D Chronicle Matrix View
 * Features:
 *   - Feature 5: Synchronized 2D Chronicle Matrix View
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 * Authoritative Source: docs/PRD.md §2.1, docs/HLD.md §5 & PROJECT.md §1
 */

import { describe, it, expect } from 'vitest';
import { ProbabilityNode } from '../../fixtures/multiverse-types';
import { mockWave1Siblings } from '../../fixtures/mock-nodes';

export interface MatrixRowData {
  id: string;
  title: string;
  probabilityFormatted: string; // e.g. "28.0%"
  timeHorizon: string;
  reversibilityBadge: 'Type 1 (Irreversible)' | 'Type 2 (Reversible)';
  utilityScoreFormatted: string;
  isGoldenPath: boolean;
  status: string;
}

export function formatChronicleMatrixRows(nodes: ProbabilityNode[]): MatrixRowData[] {
  return nodes.map(node => ({
    id: node.id,
    title: node.title,
    probabilityFormatted: `${(node.conditionalProbability * 100).toFixed(1)}%`,
    timeHorizon: node.timeHorizon,
    reversibilityBadge: node.reversibilityType === 'type_1_irreversible'
      ? 'Type 1 (Irreversible)'
      : 'Type 2 (Reversible)',
    utilityScoreFormatted: node.expectedUtilityScore !== undefined
      ? (node.expectedUtilityScore > 0 ? `+${node.expectedUtilityScore.toFixed(1)}` : node.expectedUtilityScore.toFixed(1))
      : 'N/A',
    isGoldenPath: node.isGoldenPath,
    status: node.status,
  }));
}

export function sortMatrixRows(
  rows: MatrixRowData[],
  sortBy: 'probability' | 'title'
): MatrixRowData[] {
  const sorted = [...rows];
  if (sortBy === 'probability') {
    sorted.sort((a, b) => parseFloat(b.probabilityFormatted) - parseFloat(a.probabilityFormatted));
  } else if (sortBy === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  }
  return sorted;
}

describe('Feature 5: Synchronized 2D Chronicle Matrix View', () => {
  it('F5-T1-01: transforms active 3D probability nodes into structured 2D tabular rows', () => {
    const rows = formatChronicleMatrixRows(mockWave1Siblings);
    expect(rows).toHaveLength(5);
    expect(rows[0].title).toBe('Self-Funded Enterprise Micro-Pivot');
  });

  it('F5-T1-02: formats conditional probability as precision percentage string (e.g. 28.0%)', () => {
    const rows = formatChronicleMatrixRows(mockWave1Siblings);
    expect(rows[0].probabilityFormatted).toBe('28.0%');
    expect(rows[1].probabilityFormatted).toBe('22.0%');
  });

  it('F5-T1-03: maps reversibility door types to clear human-readable badges', () => {
    const rows = formatChronicleMatrixRows(mockWave1Siblings);
    expect(rows[0].reversibilityBadge).toBe('Type 2 (Reversible)');
    expect(rows[1].reversibilityBadge).toBe('Type 1 (Irreversible)');
  });

  it('F5-T1-04: identifies and flags Golden Path row for champagne gold highlighting', () => {
    const rows = formatChronicleMatrixRows(mockWave1Siblings);
    const goldenRow = rows.find(r => r.isGoldenPath);

    expect(goldenRow).toBeDefined();
    expect(goldenRow!.id).toBe('node-w1-01');
  });

  it('F5-T1-05: sorts matrix rows descending by probability percentage', () => {
    const rows = formatChronicleMatrixRows(mockWave1Siblings);
    const sorted = sortMatrixRows(rows, 'probability');

    expect(parseFloat(sorted[0].probabilityFormatted)).toBeGreaterThanOrEqual(
      parseFloat(sorted[1].probabilityFormatted)
    );
    expect(parseFloat(sorted[1].probabilityFormatted)).toBeGreaterThanOrEqual(
      parseFloat(sorted[2].probabilityFormatted)
    );
  });
});
