import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";

// ============================================================================
// NODE BOUNDS CONTEXT - Shares node positions with edge components
// ============================================================================

export interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NodeBoundsContextType {
  nodeBounds: Map<string, NodeBounds>;
  registerNode: (id: string, bounds: NodeBounds) => void;
  unregisterNode: (id: string) => void;
  updateNodeBounds: (nodes: NodeBounds[]) => void;
  getNodeBounds: (id: string) => NodeBounds | undefined;
  getAllNodeBounds: () => NodeBounds[];
}

const NodeBoundsContext = createContext<NodeBoundsContextType | null>(null);

/**
 * Check if two bounds are equal
 */
function boundsEqual(a: NodeBounds, b: NodeBounds): boolean {
  return (
    a.id === b.id &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}

/**
 * Check if bounds arrays are equal
 */
function boundsArraysEqual(a: NodeBounds[], b: NodeBounds[]): boolean {
  if (a.length !== b.length) return false;

  // Create maps for comparison
  const mapA = new Map(a.map(n => [n.id, n]));
  const mapB = new Map(b.map(n => [n.id, n]));

  if (mapA.size !== mapB.size) return false;

  for (const [id, boundsA] of mapA) {
    const boundsB = mapB.get(id);
    if (!boundsB || !boundsEqual(boundsA, boundsB)) {
      return false;
    }
  }

  return true;
}

export const NodeBoundsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nodeBounds, setNodeBounds] = useState<Map<string, NodeBounds>>(
    new Map()
  );

  // Keep track of the last bounds to avoid unnecessary updates
  const lastBoundsRef = useRef<NodeBounds[]>([]);

  const registerNode = useCallback((id: string, bounds: NodeBounds) => {
    setNodeBounds((prev) => {
      const existing = prev.get(id);
      if (existing && boundsEqual(existing, bounds)) {
        return prev; // No change
      }
      const next = new Map(prev);
      next.set(id, bounds);
      return next;
    });
  }, []);

  const unregisterNode = useCallback((id: string) => {
    setNodeBounds((prev) => {
      if (!prev.has(id)) return prev; // No change
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateNodeBounds = useCallback((nodes: NodeBounds[]) => {
    // Check if bounds actually changed
    if (boundsArraysEqual(nodes, lastBoundsRef.current)) {
      return; // No change, skip update
    }

    lastBoundsRef.current = nodes;
    setNodeBounds(new Map(nodes.map((n) => [n.id, n])));
  }, []);

  const getNodeBounds = useCallback(
    (id: string) => nodeBounds.get(id),
    [nodeBounds]
  );

  const getAllNodeBounds = useCallback(
    () => Array.from(nodeBounds.values()),
    [nodeBounds]
  );

  const value = useMemo(
    () => ({
      nodeBounds,
      registerNode,
      unregisterNode,
      updateNodeBounds,
      getNodeBounds,
      getAllNodeBounds,
    }),
    [nodeBounds, registerNode, unregisterNode, updateNodeBounds, getNodeBounds, getAllNodeBounds]
  );

  return (
    <NodeBoundsContext.Provider value={value}>
      {children}
    </NodeBoundsContext.Provider>
  );
};

export const useNodeBoundsContext = () => {
  const context = useContext(NodeBoundsContext);
  if (!context) {
    throw new Error(
      "useNodeBoundsContext must be used within a NodeBoundsProvider"
    );
  }
  return context;
};

export const useNodeBoundsContextOptional = () => {
  return useContext(NodeBoundsContext);
};
