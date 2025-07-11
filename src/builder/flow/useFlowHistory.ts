import React, { useState, useCallback, useRef } from 'react';
import { FlowNode, FlowEdge } from './types';

export interface FlowHistoryState {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowHistoryEntry {
  state: FlowHistoryState;
  action: string;
  timestamp: number;
}

export interface FlowHistory {
  entries: FlowHistoryEntry[];
  currentIndex: number;
}

export interface UseFlowHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => FlowHistoryState | null;
  redo: () => FlowHistoryState | null;
  pushState: (state: FlowHistoryState, action: string) => void;
  clearHistory: () => void;
  getHistoryInfo: () => { currentIndex: number; totalEntries: number };
}

const MAX_HISTORY_SIZE = 50;

export const useFlowHistory = (initialState: FlowHistoryState): UseFlowHistoryReturn => {
  const [history, setHistory] = useState<FlowHistory>(() => ({
    entries: [{
      state: JSON.parse(JSON.stringify(initialState)), // Deep clone
      action: 'Initial state',
      timestamp: Date.now()
    }],
    currentIndex: 0
  }));

  // Use ref to track if we're in the middle of an undo/redo operation
  const isUndoRedoOperation = useRef(false);
  
  // Track the initial state to detect changes
  const prevInitialState = useRef(initialState);
  
  // Update the initial state when nodes/edges change externally (not from undo/redo)
  React.useEffect(() => {
    if (!isUndoRedoOperation.current) {
      const currentState = JSON.stringify(initialState);
      const prevState = JSON.stringify(prevInitialState.current);
      
      if (currentState !== prevState) {
        prevInitialState.current = initialState;
        // Only update if this is a genuine external change, not from our own operations
        if (history.entries.length === 1 && history.entries[0].action === 'Initial state') {
          // Update the initial state if we haven't started tracking yet
          setHistory(prev => ({
            ...prev,
            entries: [{
              state: JSON.parse(JSON.stringify(initialState)),
              action: 'Initial state',
              timestamp: Date.now()
            }]
          }));
        }
      }
    }
  }, [initialState, history.entries]);

  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.entries.length - 1;

  const pushState = useCallback((state: FlowHistoryState, action: string) => {
    // Don't push state if we're in the middle of an undo/redo operation
    if (isUndoRedoOperation.current) {
      console.log('Skipping pushState due to undo/redo operation');
      return;
    }

    console.log('Pushing state to history:', { action, nodes: state.nodes.length, edges: state.edges.length });
    
    setHistory(prev => {
      const newEntry: FlowHistoryEntry = {
        state: JSON.parse(JSON.stringify(state)), // Deep clone
        action,
        timestamp: Date.now()
      };

      // Remove any entries after current index (when user made changes after undo)
      const newEntries = prev.entries.slice(0, prev.currentIndex + 1);
      
      // Add new entry
      newEntries.push(newEntry);
      
      // Limit history size
      if (newEntries.length > MAX_HISTORY_SIZE) {
        newEntries.shift(); // Remove oldest entry
      }

      const newHistory = {
        entries: newEntries,
        currentIndex: newEntries.length - 1
      };
      
      console.log('Updated history:', { totalEntries: newHistory.entries.length, currentIndex: newHistory.currentIndex });
      
      return newHistory;
    });
  }, []);

  const undo = useCallback((): FlowHistoryState | null => {
    console.log('Undo called:', { canUndo, currentIndex: history.currentIndex, totalEntries: history.entries.length });
    if (!canUndo) {
      console.log('Cannot undo - no previous state');
      return null;
    }

    isUndoRedoOperation.current = true;
    
    const newIndex = history.currentIndex - 1;
    const previousState = history.entries[newIndex].state;
    
    console.log('Undoing to index:', newIndex, 'with state:', { nodes: previousState.nodes.length, edges: previousState.edges.length });
    
    setHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));

    // Reset flag after a brief delay to allow state updates to complete
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);

    return JSON.parse(JSON.stringify(previousState)); // Deep clone
  }, [canUndo, history.currentIndex, history.entries]);

  const redo = useCallback((): FlowHistoryState | null => {
    console.log('Redo called:', { canRedo, currentIndex: history.currentIndex, totalEntries: history.entries.length });
    if (!canRedo) {
      console.log('Cannot redo - no next state');
      return null;
    }

    isUndoRedoOperation.current = true;
    
    const newIndex = history.currentIndex + 1;
    const nextState = history.entries[newIndex].state;
    
    console.log('Redoing to index:', newIndex, 'with state:', { nodes: nextState.nodes.length, edges: nextState.edges.length });
    
    setHistory(prev => ({
      ...prev,
      currentIndex: newIndex
    }));

    // Reset flag after a brief delay to allow state updates to complete
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 0);

    return JSON.parse(JSON.stringify(nextState)); // Deep clone
  }, [canRedo, history.currentIndex, history.entries]);

  const clearHistory = useCallback(() => {
    setHistory({
      entries: [],
      currentIndex: -1
    });
  }, []);

  const getHistoryInfo = useCallback(() => ({
    currentIndex: history.currentIndex,
    totalEntries: history.entries.length
  }), [history.currentIndex, history.entries.length]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    clearHistory,
    getHistoryInfo
  };
};