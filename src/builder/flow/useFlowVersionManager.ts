import { useState, useCallback, useRef, useEffect } from 'react';
import { FlowNode, FlowEdge } from './types';

export type FlowActionType = 
  | 'NODE_CREATE'
  | 'NODE_DELETE'
  | 'NODE_UPDATE'
  | 'NODE_POSITION_UPDATE'
  | 'NODE_POSITION_BATCH_UPDATE'
  | 'EDGE_CREATE'
  | 'EDGE_DELETE'
  | 'EDGE_UPDATE'
  | 'CONNECTION_CREATE'
  | 'INITIAL_STATE'
  | 'BATCH_UPDATE';

export interface FlowVersionState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface FlowVersionEntry {
  id: string;
  state: FlowVersionState;
  action: FlowActionType;
  actionDescription: string;
  timestamp: number;
  affectedNodeIds?: string[];
  affectedEdgeIds?: string[];
}

export interface FlowVersionHistory {
  entries: FlowVersionEntry[];
  currentIndex: number;
  maxSize: number;
}

export interface FlowVersionManager {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => FlowVersionState | null;
  redo: () => FlowVersionState | null;
  pushVersion: (state: FlowVersionState, action: FlowActionType, description: string, affectedNodes?: string[], affectedEdges?: string[]) => void;
  startBatch: (description: string) => void;
  endBatch: () => void;
  clearHistory: () => void;
  getHistoryInfo: () => { currentIndex: number; totalEntries: number; currentEntry?: FlowVersionEntry };
  getVersionHistory: () => FlowVersionEntry[];
}

const MAX_HISTORY_SIZE = 50;
const POSITION_UPDATE_DEBOUNCE_MS = 500;

export const useFlowVersionManager = (
  initialState: FlowVersionState,
  enableDebug: boolean = false
): FlowVersionManager => {
  const [history, setHistory] = useState<FlowVersionHistory>(() => ({
    entries: [{
      id: `initial-${Date.now()}`,
      state: deepClone(initialState),
      action: 'INITIAL_STATE',
      actionDescription: 'Initial state',
      timestamp: Date.now()
    }],
    currentIndex: 0,
    maxSize: MAX_HISTORY_SIZE
  }));

  // Batch operation state
  const batchRef = useRef<{
    isActive: boolean;
    description: string;
    startState: FlowVersionState | null;
    affectedNodes: Set<string>;
    affectedEdges: Set<string>;
  }>({
    isActive: false,
    description: '',
    startState: null,
    affectedNodes: new Set(),
    affectedEdges: new Set()
  });

  // Debounce state for position updates
  const positionUpdateRef = useRef<{
    timeoutId: NodeJS.Timeout | null;
    pendingState: FlowVersionState | null;
    affectedNodes: Set<string>;
  }>({
    timeoutId: null,
    pendingState: null,
    affectedNodes: new Set()
  });

  // Prevent infinite loops during undo/redo
  const isUndoRedoOperation = useRef(false);

  // Deep clone utility
  function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Debug logging
  const debugLog = useCallback((message: string, data?: any) => {
    if (enableDebug) {
      console.log(`[FlowVersionManager] ${message}`, data);
    }
  }, [enableDebug]);

  // Computed properties
  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.entries.length - 1;

  // Generate a unique ID for each entry
  const generateEntryId = useCallback((action: FlowActionType): string => {
    return `${action.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Compare states to avoid duplicate entries
  const statesEqual = useCallback((state1: FlowVersionState, state2: FlowVersionState): boolean => {
    return JSON.stringify(state1) === JSON.stringify(state2);
  }, []);

  // Start batch operation
  const startBatch = useCallback((description: string) => {
    if (batchRef.current.isActive) {
      debugLog('Warning: Starting batch while another batch is active');
      return;
    }

    batchRef.current = {
      isActive: true,
      description,
      startState: deepClone(initialState),
      affectedNodes: new Set(),
      affectedEdges: new Set()
    };

    debugLog(`Started batch operation: ${description}`);
  }, [initialState, debugLog]);

  // End batch operation
  const endBatch = useCallback(() => {
    if (!batchRef.current.isActive) {
      debugLog('Warning: Ending batch when no batch is active');
      return;
    }

    const { description, startState, affectedNodes, affectedEdges } = batchRef.current;

    if (startState && !statesEqual(startState, initialState)) {
      pushVersion(
        initialState,
        'BATCH_UPDATE',
        description,
        Array.from(affectedNodes),
        Array.from(affectedEdges)
      );
    }

    batchRef.current = {
      isActive: false,
      description: '',
      startState: null,
      affectedNodes: new Set(),
      affectedEdges: new Set()
    };

    debugLog(`Ended batch operation: ${description}`);
  }, [initialState, debugLog, statesEqual]);

  // Push a new version to history
  const pushVersion = useCallback((
    state: FlowVersionState,
    action: FlowActionType,
    description: string,
    affectedNodes?: string[],
    affectedEdges?: string[]
  ) => {
    // Skip if in undo/redo operation
    if (isUndoRedoOperation.current) {
      debugLog('Skipping pushVersion during undo/redo operation');
      return;
    }

    // Handle batch operations
    if (batchRef.current.isActive) {
      if (affectedNodes) {
        affectedNodes.forEach(nodeId => batchRef.current.affectedNodes.add(nodeId));
      }
      if (affectedEdges) {
        affectedEdges.forEach(edgeId => batchRef.current.affectedEdges.add(edgeId));
      }
      return; // Don't push individual operations during batch
    }

    // Handle position update debouncing
    if (action === 'NODE_POSITION_UPDATE' || action === 'NODE_POSITION_BATCH_UPDATE') {
      if (positionUpdateRef.current.timeoutId) {
        clearTimeout(positionUpdateRef.current.timeoutId);
      }

      positionUpdateRef.current.pendingState = deepClone(state);
      if (affectedNodes) {
        affectedNodes.forEach(nodeId => positionUpdateRef.current.affectedNodes.add(nodeId));
      }

      positionUpdateRef.current.timeoutId = setTimeout(() => {
        const finalState = positionUpdateRef.current.pendingState;
        const finalAffectedNodes = Array.from(positionUpdateRef.current.affectedNodes);

        if (finalState) {
          pushVersionImmediate(
            finalState,
            action,
            description,
            finalAffectedNodes,
            affectedEdges
          );
        }

        // Reset debounce state
        positionUpdateRef.current = {
          timeoutId: null,
          pendingState: null,
          affectedNodes: new Set()
        };
      }, POSITION_UPDATE_DEBOUNCE_MS);

      return;
    }

    // Push immediately for non-position updates
    pushVersionImmediate(state, action, description, affectedNodes, affectedEdges);
  }, [debugLog]);

  // Immediately push version (used internally)
  const pushVersionImmediate = useCallback((
    state: FlowVersionState,
    action: FlowActionType,
    description: string,
    affectedNodes?: string[],
    affectedEdges?: string[]
  ) => {
    setHistory(prev => {
      // Skip if state hasn't changed
      if (prev.entries.length > 0 && statesEqual(prev.entries[prev.currentIndex].state, state)) {
        debugLog('Skipping duplicate state push');
        return prev;
      }

      const newEntry: FlowVersionEntry = {
        id: generateEntryId(action),
        state: deepClone(state),
        action,
        actionDescription: description,
        timestamp: Date.now(),
        affectedNodeIds: affectedNodes,
        affectedEdgeIds: affectedEdges
      };

      // Remove any entries after current index (when user made changes after undo)
      const newEntries = prev.entries.slice(0, prev.currentIndex + 1);
      newEntries.push(newEntry);

      // Limit history size
      if (newEntries.length > prev.maxSize) {
        newEntries.shift();
      }

      const newHistory = {
        ...prev,
        entries: newEntries,
        currentIndex: newEntries.length - 1
      };

      debugLog(`Pushed version: ${description}`, {
        action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        positions: Object.keys(state.nodePositions).length,
        totalEntries: newHistory.entries.length,
        currentIndex: newHistory.currentIndex
      });

      return newHistory;
    });
  }, [generateEntryId, debugLog, statesEqual]);

  // Undo operation
  const undo = useCallback((): FlowVersionState | null => {
    if (!canUndo) {
      debugLog('Cannot undo - no previous state');
      return null;
    }

    isUndoRedoOperation.current = true;

    const newIndex = history.currentIndex - 1;
    const previousEntry = history.entries[newIndex];
    const previousState = previousEntry.state;

    debugLog(`Undoing: ${previousEntry.actionDescription}`, {
      fromIndex: history.currentIndex,
      toIndex: newIndex,
      action: previousEntry.action,
      nodes: previousState.nodes.length,
      edges: previousState.edges.length,
      positions: Object.keys(previousState.nodePositions).length
    });

    setHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));

    // Reset flag after a brief delay
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);

    return deepClone(previousState);
  }, [canUndo, history, debugLog]);

  // Redo operation
  const redo = useCallback((): FlowVersionState | null => {
    if (!canRedo) {
      debugLog('Cannot redo - no next state');
      return null;
    }

    isUndoRedoOperation.current = true;

    const newIndex = history.currentIndex + 1;
    const nextEntry = history.entries[newIndex];
    const nextState = nextEntry.state;

    debugLog(`Redoing: ${nextEntry.actionDescription}`, {
      fromIndex: history.currentIndex,
      toIndex: newIndex,
      action: nextEntry.action,
      nodes: nextState.nodes.length,
      edges: nextState.edges.length,
      positions: Object.keys(nextState.nodePositions).length
    });

    setHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));

    // Reset flag after a brief delay
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);

    return deepClone(nextState);
  }, [canRedo, history, debugLog]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      ...prev,
      entries: [],
      currentIndex: -1
    }));
    debugLog('Cleared history');
  }, [debugLog]);

  // Get history info
  const getHistoryInfo = useCallback(() => ({
    currentIndex: history.currentIndex,
    totalEntries: history.entries.length,
    currentEntry: history.entries[history.currentIndex]
  }), [history]);

  // Get version history
  const getVersionHistory = useCallback(() => {
    return history.entries.map(entry => ({
      ...entry,
      state: { ...entry.state } // Shallow clone for safety
    }));
  }, [history]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (positionUpdateRef.current.timeoutId) {
        clearTimeout(positionUpdateRef.current.timeoutId);
      }
    };
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushVersion,
    startBatch,
    endBatch,
    clearHistory,
    getHistoryInfo,
    getVersionHistory
  };
};