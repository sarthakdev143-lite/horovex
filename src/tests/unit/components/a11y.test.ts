/**
 * Unit Tests: WCAG AA Accessibility & Reduced Motion Mode
 * Features:
 *   - Feature 6: WCAG AA Accessibility & Reduced Motion Mode
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 * Authoritative Source: docs/PRD.md §2.1, docs/HLD.md §5 & PROJECT.md §1
 */

import { describe, it, expect } from 'vitest';
import { mockWave1Siblings, mockRootNode } from '../../fixtures/mock-nodes';
import { ProbabilityNode } from '../../fixtures/multiverse-types';

export interface KeyboardNavigationResult {
  nextActiveNodeId: string | null;
  direction: 'parent' | 'child' | 'next_sibling' | 'prev_sibling';
}

export function handleTreeKeyboardNavigation(
  key: string,
  currentNodeId: string,
  nodes: ProbabilityNode[]
): KeyboardNavigationResult | null {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const current = nodeMap.get(currentNodeId);
  if (!current) return null;

  if (key === 'ArrowUp') {
    return {
      nextActiveNodeId: current.parentId,
      direction: 'parent',
    };
  }

  if (key === 'ArrowDown') {
    const children = nodes.filter(n => n.parentId === currentNodeId && n.status === 'active');
    return {
      nextActiveNodeId: children.length > 0 ? children[0].id : null,
      direction: 'child',
    };
  }

  if (key === 'ArrowRight') {
    const siblings = nodes.filter(n => n.parentId === current.parentId && n.status === 'active');
    const idx = siblings.findIndex(s => s.id === currentNodeId);
    if (idx >= 0 && idx < siblings.length - 1) {
      return {
        nextActiveNodeId: siblings[idx + 1].id,
        direction: 'next_sibling',
      };
    }
  }

  if (key === 'ArrowLeft') {
    const siblings = nodes.filter(n => n.parentId === current.parentId && n.status === 'active');
    const idx = siblings.findIndex(s => s.id === currentNodeId);
    if (idx > 0) {
      return {
        nextActiveNodeId: siblings[idx - 1].id,
        direction: 'prev_sibling',
      };
    }
  }

  return null;
}

export function getCameraDampingFactor(prefersReducedMotion: boolean): number {
  // If reduced motion is preferred, damping is 1.0 (instant snap without smooth spring animation)
  return prefersReducedMotion ? 1.0 : 0.08;
}

describe('Feature 6: WCAG AA Accessibility & Reduced Motion Mode', () => {
  const treeNodes = [mockRootNode, ...mockWave1Siblings];

  it('F6-T1-01: navigates to parent node via ArrowUp key', () => {
    const nav = handleTreeKeyboardNavigation('ArrowUp', 'node-w1-01', treeNodes);
    expect(nav).not.toBeNull();
    expect(nav?.nextActiveNodeId).toBe(mockRootNode.id);
    expect(nav?.direction).toBe('parent');
  });

  it('F6-T1-02: navigates to first child node via ArrowDown key', () => {
    const nav = handleTreeKeyboardNavigation('ArrowDown', mockRootNode.id, treeNodes);
    expect(nav).not.toBeNull();
    expect(nav?.nextActiveNodeId).toBe('node-w1-01');
    expect(nav?.direction).toBe('child');
  });

  it('F6-T1-03: navigates to next sibling node via ArrowRight key', () => {
    const nav = handleTreeKeyboardNavigation('ArrowRight', 'node-w1-01', treeNodes);
    expect(nav).not.toBeNull();
    expect(nav?.nextActiveNodeId).toBe('node-w1-02');
    expect(nav?.direction).toBe('next_sibling');
  });

  it('F6-T1-04: navigates to previous sibling node via ArrowLeft key', () => {
    const nav = handleTreeKeyboardNavigation('ArrowLeft', 'node-w1-02', treeNodes);
    expect(nav).not.toBeNull();
    expect(nav?.nextActiveNodeId).toBe('node-w1-01');
    expect(nav?.direction).toBe('prev_sibling');
  });

  it('F6-T1-05: applies instant camera transition (damping=1.0) when prefers-reduced-motion is true', () => {
    const reducedMotionDamping = getCameraDampingFactor(true);
    const standardDamping = getCameraDampingFactor(false);

    expect(reducedMotionDamping).toBe(1.0);
    expect(standardDamping).toBe(0.08);
  });
});
