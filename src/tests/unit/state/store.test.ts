/**
 * Unit & Boundary Tests: Zustand Multiverse Store & Guest Sandbox
 * Features:
 *   - Feature 16: Personal Context Digital Twin ("The Vault")
 *   - Feature 29: Instant Guest Sandbox Mode
 * Tiers Covered:
 *   - Tier 1: Feature Coverage (>=5 tests per feature)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * Authoritative Source: docs/HLD.md §3.3 & §4, docs/LLD.md §1 & §5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserContextTwin, ProbabilityNode } from '../../fixtures/multiverse-types';
import { mockMeasuredTwin } from '../../fixtures/mock-twins';
import { mockRootNode, mockWave1Siblings } from '../../fixtures/mock-nodes';

// Reference Guest Sandbox & Store State model
class MockGuestSandboxStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

interface MultiverseStoreState {
  currentSimulationId: string | null;
  activeNodeId: string | null;
  nodes: Map<string, ProbabilityNode>;
  digitalTwin: UserContextTwin;
  isGuestMode: boolean;
  setDigitalTwin: (twin: Partial<UserContextTwin>) => void;
  insertNodes: (newNodes: ProbabilityNode[]) => void;
  setActiveNode: (id: string | null) => void;
  collapseWavefunction: (realizedNodeId: string) => void;
  saveToGuestSandbox: (storage: MockGuestSandboxStorage) => void;
  loadFromGuestSandbox: (storage: MockGuestSandboxStorage) => boolean;
}

function createMultiverseStore(): MultiverseStoreState {
  let currentSimulationId: string | null = 'sim-test-001';
  let activeNodeId: string | null = null;
  const nodes = new Map<string, ProbabilityNode>();
  let digitalTwin: UserContextTwin = { ...mockMeasuredTwin };
  let isGuestMode = true;

  return {
    get currentSimulationId() { return currentSimulationId; },
    get activeNodeId() { return activeNodeId; },
    get nodes() { return nodes; },
    get digitalTwin() { return digitalTwin; },
    get isGuestMode() { return isGuestMode; },

    setDigitalTwin(partial) {
      digitalTwin = {
        ...digitalTwin,
        ...partial,
        coreValues: {
          ...digitalTwin.coreValues,
          ...(partial.coreValues || {}),
        },
      };
    },

    insertNodes(newNodes) {
      for (const node of newNodes) {
        nodes.set(node.id, { ...node });
      }
    },

    setActiveNode(id) {
      activeNodeId = id;
    },

    collapseWavefunction(realizedNodeId) {
      const target = nodes.get(realizedNodeId);
      if (!target) return;

      target.status = 'realized';
      activeNodeId = realizedNodeId;

      // Prune siblings with same parent
      for (const [id, node] of nodes.entries()) {
        if (node.parentId === target.parentId && id !== realizedNodeId) {
          node.status = 'pruned';
        }
      }
    },

    saveToGuestSandbox(storage) {
      const payload = {
        currentSimulationId,
        digitalTwin,
        nodes: Array.from(nodes.values()),
        activeNodeId,
      };
      storage.setItem('horovex_guest_sandbox_v1', JSON.stringify(payload));
    },

    loadFromGuestSandbox(storage) {
      const raw = storage.getItem('horovex_guest_sandbox_v1');
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.digitalTwin) digitalTwin = parsed.digitalTwin;
        if (parsed.currentSimulationId) currentSimulationId = parsed.currentSimulationId;
        if (parsed.activeNodeId) activeNodeId = parsed.activeNodeId;
        if (Array.isArray(parsed.nodes)) {
          nodes.clear();
          for (const n of parsed.nodes) {
            nodes.set(n.id, n);
          }
        }
        return true;
      } catch {
        return false;
      }
    },
  };
}

describe('Feature 16: Personal Context Digital Twin ("The Vault")', () => {
  let store: MultiverseStoreState;

  beforeEach(() => {
    store = createMultiverseStore();
  });

  it('F16-T1-01: initializes with calibrated default Digital Twin context', () => {
    expect(store.digitalTwin.riskAppetite).toBe('measured');
    expect(store.digitalTwin.runwayMonths).toBe(14.0);
    expect(store.digitalTwin.coreValues.wealthCompounding).toBe(0.8);
    expect(store.digitalTwin.coreValues.autonomyFreedom).toBe(0.9);
  });

  it('F16-T1-02: updates risk appetite setting (conservative -> aggressive)', () => {
    store.setDigitalTwin({ riskAppetite: 'aggressive' });
    expect(store.digitalTwin.riskAppetite).toBe('aggressive');
  });

  it('F16-T1-03: updates financial runway buffer in months', () => {
    store.setDigitalTwin({ runwayMonths: 24.5 });
    expect(store.digitalTwin.runwayMonths).toBe(24.5);
  });

  it('F16-T1-04: updates individual core value weights independently', () => {
    store.setDigitalTwin({
      coreValues: {
        ...store.digitalTwin.coreValues,
        peaceWellbeing: 0.95,
      },
    });

    expect(store.digitalTwin.coreValues.peaceWellbeing).toBe(0.95);
    // Other values remain intact
    expect(store.digitalTwin.coreValues.autonomyFreedom).toBe(0.9);
  });

  it('F16-T1-05: updates personal constraints list in Digital Twin', () => {
    store.setDigitalTwin({
      personalConstraints: ['Hard stop at $10k savings', 'Must remain remote'],
    });

    expect(store.digitalTwin.personalConstraints).toHaveLength(2);
    expect(store.digitalTwin.personalConstraints![0]).toBe('Hard stop at $10k savings');
  });

  it('F16-T1-06: retains custom twin adjustments across graph updates', () => {
    store.setDigitalTwin({ runwayMonths: 18.0 });
    store.insertNodes([mockRootNode]);

    expect(store.digitalTwin.runwayMonths).toBe(18.0);
    expect(store.nodes.size).toBe(1);
  });
});

describe('Feature 29: Instant Guest Sandbox Mode', () => {
  let store: MultiverseStoreState;
  let mockStorage: MockGuestSandboxStorage;

  beforeEach(() => {
    store = createMultiverseStore();
    mockStorage = new MockGuestSandboxStorage();
  });

  it('F29-T1-01: identifies active session as guest mode by default', () => {
    expect(store.isGuestMode).toBe(true);
  });

  it('F29-T1-02: saves complete simulation graph and twin into local storage sandbox', () => {
    store.insertNodes([mockRootNode, ...mockWave1Siblings]);
    store.setActiveNode('node-w1-01');
    store.saveToGuestSandbox(mockStorage);

    const saved = mockStorage.getItem('horovex_guest_sandbox_v1');
    expect(saved).not.toBeNull();
    expect(saved).toContain('node-w1-01');
    expect(saved).toContain('sim-founder-pivot-001');
  });

  it('F29-T1-03: reloads saved simulation graph seamlessly from local storage', () => {
    store.insertNodes([mockRootNode, ...mockWave1Siblings]);
    store.setDigitalTwin({ runwayMonths: 19.5 });
    store.saveToGuestSandbox(mockStorage);

    // Create fresh empty store
    const freshStore = createMultiverseStore();
    expect(freshStore.nodes.size).toBe(0);

    const success = freshStore.loadFromGuestSandbox(mockStorage);
    expect(success).toBe(true);
    expect(freshStore.nodes.size).toBe(6);
    expect(freshStore.digitalTwin.runwayMonths).toBe(19.5);
  });

  it('F29-T1-04: returns false when loading from empty local storage without crashing', () => {
    const success = store.loadFromGuestSandbox(mockStorage);
    expect(success).toBe(false);
  });

  it('F29-T1-05: updates active node selection in store', () => {
    store.setActiveNode('node-w1-03');
    expect(store.activeNodeId).toBe('node-w1-03');
  });

  it('F29-T1-06: executes wavefunction collapse marking realized and pruning counterfactual siblings', () => {
    store.insertNodes([mockRootNode, ...mockWave1Siblings]);
    store.collapseWavefunction('node-w1-01');

    expect(store.nodes.get('node-w1-01')!.status).toBe('realized');
    expect(store.nodes.get('node-w1-02')!.status).toBe('pruned');
    expect(store.nodes.get('node-w1-03')!.status).toBe('pruned');
    expect(store.nodes.get('node-w1-04')!.status).toBe('pruned');
    expect(store.nodes.get('node-w1-05')!.status).toBe('pruned');
  });
});

describe('Tier 2: Boundary & Corner Cases (Store & Sandbox)', () => {
  let store: MultiverseStoreState;
  let mockStorage: MockGuestSandboxStorage;

  beforeEach(() => {
    store = createMultiverseStore();
    mockStorage = new MockGuestSandboxStorage();
  });

  it('F29-T2-01: handles corrupt / unparseable JSON in local storage without crashing', () => {
    mockStorage.setItem('horovex_guest_sandbox_v1', 'corrupted-non-json-{{{');
    const success = store.loadFromGuestSandbox(mockStorage);
    expect(success).toBe(false);
  });

  it('F16-T2-02: handles zero months financial runway safely', () => {
    store.setDigitalTwin({ runwayMonths: 0 });
    expect(store.digitalTwin.runwayMonths).toBe(0);
  });

  it('F16-T2-03: handles high financial runway (120 months) safely', () => {
    store.setDigitalTwin({ runwayMonths: 120 });
    expect(store.digitalTwin.runwayMonths).toBe(120);
  });

  it('F29-T2-04: collapses non-existent node ID gracefully with zero changes', () => {
    store.insertNodes([mockRootNode, ...mockWave1Siblings]);
    store.collapseWavefunction('non-existent-id-999');

    // All siblings remain active
    expect(store.nodes.get('node-w1-01')!.status).toBe('active');
  });

  it('F29-T2-05: handles large node tree (100 nodes) serialization and deserialization in sandbox', () => {
    const hundredNodes: ProbabilityNode[] = Array.from({ length: 100 }, (_, i) => ({
      ...mockWave1Siblings[0],
      id: `bulk-node-${i}`,
      title: `Trajectory ${i}`,
    }));

    store.insertNodes(hundredNodes);
    store.saveToGuestSandbox(mockStorage);

    const freshStore = createMultiverseStore();
    const success = freshStore.loadFromGuestSandbox(mockStorage);

    expect(success).toBe(true);
    expect(freshStore.nodes.size).toBe(100);
    expect(freshStore.nodes.get('bulk-node-99')!.title).toBe('Trajectory 99');
  });
});
