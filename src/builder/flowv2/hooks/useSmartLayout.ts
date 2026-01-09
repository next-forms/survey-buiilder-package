import { useCallback, useRef, useEffect } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import type { FlowV2Node, FlowV2Edge, BlockNodeData } from "../types";

// Lazy-loaded dagre instance to avoid SSR issues
let dagreInstance: typeof import("@dagrejs/dagre") | null = null;

async function getDagre() {
  if (!dagreInstance) {
    dagreInstance = await import("@dagrejs/dagre");
  }
  return dagreInstance.default;
}

// ============================================================================
// SMART LAYOUT CONFIGURATION
// ============================================================================

export const SMART_LAYOUT_CONFIG = {
  // Base layout settings
  rankdir: "LR" as const,
  align: "UL" as const,

  // Intelligent spacing based on content density
  spacing: {
    // Minimum and maximum rank separation (horizontal distance between columns)
    minRankSep: 180 as number,
    maxRankSep: 280 as number,
    baseRankSep: 220 as number,

    // Node separation (vertical distance between nodes in same column)
    minNodeSep: 60 as number,
    maxNodeSep: 120 as number,
    baseNodeSep: 80 as number,

    // Margins
    marginX: 80 as number,
    marginY: 60 as number,

    // Padding around nodes for overlap detection
    nodePadding: 16 as number,
  },

  // Node sizing
  nodes: {
    start: { width: 140 as number, height: 48 as number },
    submit: { width: 140 as number, height: 48 as number },
    block: {
      minWidth: 300 as number,
      maxWidth: 420 as number,
      baseHeight: 72 as number,
      collapsedHeight: 52 as number,
    },
  },

  // Visual grouping thresholds
  grouping: {
    // If nodes are within this Y distance, consider them in the same group
    verticalGroupThreshold: 150 as number,
    // Maximum nodes per visual group before adding extra spacing
    maxNodesPerGroup: 5 as number,
    // Extra spacing between groups
    groupSeparation: 40 as number,
  },

  // Animation settings
  animation: {
    layoutDuration: 300 as number,
    focusDuration: 400 as number,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Viewport awareness
  viewport: {
    // Extra area around viewport to pre-render nodes
    buffer: 200 as number,
    // Minimum zoom level for detailed rendering
    detailZoomThreshold: 0.5 as number,
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LayoutMetrics {
  totalNodes: number;
  blockNodes: number;
  maxDepth: number;
  averageNodesPerRank: number;
  hasConditionalFlow: boolean;
  complexity: "simple" | "moderate" | "complex";
}

export interface SmartLayoutOptions {
  // Whether to animate position changes
  animate?: boolean;
  // Whether to fit view after layout
  fitAfterLayout?: boolean;
  // Custom padding for fit view
  fitPadding?: number;
  // Whether to optimize for viewport
  optimizeForViewport?: boolean;
}

export interface NodeCluster {
  id: string;
  nodeIds: string[];
  bounds: { x: number; y: number; width: number; height: number };
  rank: number;
}

// ============================================================================
// LAYOUT ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyze the flow structure to determine optimal layout parameters
 */
export function analyzeFlowStructure(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[]
): LayoutMetrics {
  const blockNodes = nodes.filter((n) => n.type === "block");
  const conditionalEdges = edges.filter(
    (e) => e.data && !e.data.isSequential && !e.data.isDefault
  );

  // Build adjacency list to calculate depth
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  });

  // Calculate max depth using BFS from start
  let maxDepth = 0;
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number }> = [
    { nodeId: "start", depth: 0 },
  ];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, depth: depth + 1 });
      }
    });
  }

  // Calculate average nodes per rank (column)
  const averageNodesPerRank =
    maxDepth > 0 ? blockNodes.length / maxDepth : blockNodes.length;

  // Determine complexity
  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (
    blockNodes.length > 10 ||
    conditionalEdges.length > 5 ||
    averageNodesPerRank > 3
  ) {
    complexity = "complex";
  } else if (
    blockNodes.length > 5 ||
    conditionalEdges.length > 2 ||
    averageNodesPerRank > 2
  ) {
    complexity = "moderate";
  }

  return {
    totalNodes: nodes.length,
    blockNodes: blockNodes.length,
    maxDepth,
    averageNodesPerRank,
    hasConditionalFlow: conditionalEdges.length > 0,
    complexity,
  };
}

/**
 * Calculate adaptive spacing based on flow metrics
 */
export function calculateAdaptiveSpacing(metrics: LayoutMetrics): {
  rankSep: number;
  nodeSep: number;
} {
  const { spacing } = SMART_LAYOUT_CONFIG;

  // Adjust rank separation based on complexity
  let rankSep = spacing.baseRankSep;
  if (metrics.complexity === "complex") {
    // More space for complex flows to reduce visual clutter
    rankSep = spacing.maxRankSep;
  } else if (metrics.complexity === "simple") {
    // Tighter spacing for simple flows
    rankSep = spacing.minRankSep;
  }

  // Adjust node separation based on average nodes per rank
  let nodeSep = spacing.baseNodeSep;
  if (metrics.averageNodesPerRank > 3) {
    // More vertical space when many nodes in same column
    nodeSep = spacing.maxNodeSep;
  } else if (metrics.averageNodesPerRank < 2) {
    // Tighter vertical spacing for linear flows
    nodeSep = spacing.minNodeSep;
  }

  // Add extra spacing if there are conditional flows
  if (metrics.hasConditionalFlow) {
    nodeSep += 20;
    rankSep += 30;
  }

  return { rankSep, nodeSep };
}

// ============================================================================
// SMART NODE SIZING
// ============================================================================

/**
 * Estimate node size with intelligent content-aware calculations
 */
export function estimateSmartNodeSize(node: FlowV2Node): {
  width: number;
  height: number;
} {
  const { nodes } = SMART_LAYOUT_CONFIG;

  if (node.type === "start") {
    return { ...nodes.start };
  }

  if (node.type === "submit") {
    return { ...nodes.submit };
  }

  if (node.type === "block") {
    const blockData = (node.data as BlockNodeData).block;

    // Base dimensions
    let width = nodes.block.minWidth;
    let height = nodes.block.baseHeight;

    // Adjust width based on label length
    const labelLength = blockData.label?.length || 0;
    if (labelLength > 30) {
      width = Math.min(nodes.block.maxWidth, width + (labelLength - 30) * 3);
    }

    // Adjust height based on block type and content
    switch (blockData.type) {
      case "radio":
      case "checkbox":
        const optionCount = blockData.options?.length || 0;
        // Compact rendering: ~28px per option with max
        height += Math.min(optionCount * 28, 200);
        break;

      case "matrix":
        const rows = (blockData as any).rows?.length || 3;
        height += Math.min(rows * 32 + 40, 280);
        break;

      case "textarea":
        height += 80;
        break;

      case "range":
      case "slider":
        height += 56;
        break;

      case "select":
        height += 40;
        break;

      default:
        height += 44;
    }

    // Add space for description
    if (blockData.description) {
      const descLines = Math.ceil(blockData.description.length / 45);
      height += Math.min(descLines * 16, 48);
    }

    // Add space for navigation rules indicator
    if (blockData.navigationRules && blockData.navigationRules.length > 0) {
      height += 24;
    }

    return { width, height };
  }

  return { width: 200, height: 80 };
}

// ============================================================================
// HIERARCHICAL CLUSTERING
// ============================================================================

/**
 * Group nodes into visual clusters based on their positions and connections
 */
export function clusterNodes(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[]
): NodeCluster[] {
  if (nodes.length === 0) return [];

  // Build rank assignments using BFS from start
  const nodeRanks = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  });

  // BFS to assign ranks
  const queue: Array<{ nodeId: string; rank: number }> = [
    { nodeId: "start", rank: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, rank } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    nodeRanks.set(nodeId, rank);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, rank: rank + 1 });
      }
    });
  }

  // Assign unvisited nodes to their own rank
  nodes.forEach((node) => {
    if (!nodeRanks.has(node.id)) {
      nodeRanks.set(node.id, nodes.length);
    }
  });

  // Group nodes by rank
  const rankGroups = new Map<number, FlowV2Node[]>();
  nodes.forEach((node) => {
    const rank = nodeRanks.get(node.id) || 0;
    if (!rankGroups.has(rank)) {
      rankGroups.set(rank, []);
    }
    rankGroups.get(rank)!.push(node);
  });

  // Create clusters from rank groups
  const clusters: NodeCluster[] = [];
  rankGroups.forEach((rankNodes, rank) => {
    // Sort nodes by Y position within rank
    rankNodes.sort((a, b) => a.position.y - b.position.y);

    // Create cluster
    const nodeIds = rankNodes.map((n) => n.id);
    const bounds = calculateClusterBounds(rankNodes);

    clusters.push({
      id: `cluster-${rank}`,
      nodeIds,
      bounds,
      rank,
    });
  });

  return clusters.sort((a, b) => a.rank - b.rank);
}

/**
 * Calculate bounding box for a group of nodes
 */
function calculateClusterBounds(nodes: FlowV2Node[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const size = node.measured?.width
      ? { width: node.measured.width, height: node.measured.height || 100 }
      : estimateSmartNodeSize(node);

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + size.width);
    maxY = Math.max(maxY, node.position.y + size.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ============================================================================
// SMART DAGRE LAYOUT
// ============================================================================

/**
 * Compute layout using Dagre with intelligent, adaptive parameters
 */
export async function computeSmartDagreLayout(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[],
  options?: { useMeasured?: boolean }
): Promise<FlowV2Node[]> {
  const { useMeasured = true } = options || {};

  // Analyze flow structure
  const metrics = analyzeFlowStructure(nodes, edges);
  const { rankSep, nodeSep } = calculateAdaptiveSpacing(metrics);

  const dagre = await getDagre();
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: SMART_LAYOUT_CONFIG.rankdir,
    align: SMART_LAYOUT_CONFIG.align,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: SMART_LAYOUT_CONFIG.spacing.marginX,
    marginy: SMART_LAYOUT_CONFIG.spacing.marginY,
    ranker: "network-simplex", // Better for flow-like graphs
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Set nodes with sizes
  const nodeDimensions = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    let size: { width: number; height: number };

    if (useMeasured && node.measured?.width && node.measured?.height) {
      // Use measured dimensions with padding
      size = {
        width: node.measured.width + SMART_LAYOUT_CONFIG.spacing.nodePadding,
        height: node.measured.height + SMART_LAYOUT_CONFIG.spacing.nodePadding,
      };
    } else {
      size = estimateSmartNodeSize(node);
    }

    nodeDimensions.set(node.id, size);
    g.setNode(node.id, { width: size.width, height: size.height });
  });

  // Set edges with weights for layout optimization
  edges.forEach((edge) => {
    // Higher weight for sequential edges to keep them straighter
    const weight = edge.data?.isSequential ? 3 : 1;
    // Minimum length based on edge type
    const minlen = edge.data?.isSequential ? 1 : 2;

    g.setEdge(edge.source, edge.target, { weight, minlen });
  });

  // Run layout algorithm
  dagre.layout(g);

  // Convert Dagre center coordinates to React Flow top-left coordinates
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const size = nodeDimensions.get(node.id) || { width: 200, height: 100 };

    return {
      ...node,
      position: {
        x: Math.round(nodeWithPosition.x - size.width / 2),
        y: Math.round(nodeWithPosition.y - size.height / 2),
      },
    };
  });
}

// ============================================================================
// OVERLAP RESOLUTION WITH SMART SPACING
// ============================================================================

interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rank?: number;
}

/**
 * Check if two bounds overlap with padding
 */
function boundsOverlap(a: NodeBounds, b: NodeBounds, padding: number): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

/**
 * Get bounds for a node
 */
function getNodeBounds(node: FlowV2Node): NodeBounds {
  const size =
    node.measured?.width && node.measured?.height
      ? { width: node.measured.width, height: node.measured.height }
      : estimateSmartNodeSize(node);

  return {
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: size.width,
    height: size.height,
  };
}

/**
 * Smart overlap resolution with minimal displacement
 */
export function resolveOverlapsSmart(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[],
  maxIterations = 30
): FlowV2Node[] {
  let currentNodes = [...nodes];
  const padding = SMART_LAYOUT_CONFIG.spacing.nodePadding;

  // Build rank map for smarter displacement
  const nodeRanks = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  });

  // BFS to assign ranks
  const queue: Array<{ nodeId: string; rank: number }> = [
    { nodeId: "start", rank: 0 },
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, rank } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    nodeRanks.set(nodeId, rank);

    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ nodeId: neighbor, rank: rank + 1 });
      }
    });
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const boundsList = currentNodes.map((n) => ({
      ...getNodeBounds(n),
      rank: nodeRanks.get(n.id) || 0,
    }));
    let hasOverlap = false;

    for (let i = 0; i < boundsList.length; i++) {
      for (let j = i + 1; j < boundsList.length; j++) {
        if (boundsOverlap(boundsList[i], boundsList[j], padding)) {
          hasOverlap = true;

          const nodeA = currentNodes[i];
          const nodeB = currentNodes[j];
          const boundsA = boundsList[i];
          const boundsB = boundsList[j];

          // Calculate overlap amounts
          const overlapX = Math.min(
            boundsA.x + boundsA.width + padding - boundsB.x,
            boundsB.x + boundsB.width + padding - boundsA.x
          );
          const overlapY = Math.min(
            boundsA.y + boundsA.height + padding - boundsB.y,
            boundsB.y + boundsB.height + padding - boundsA.y
          );

          // Determine which direction to push based on layout direction (LR)
          // For horizontal layout, prefer vertical displacement
          const preferVertical = overlapY < overlapX * 1.5;

          if (preferVertical) {
            // Push vertically
            const pushAmount = Math.ceil((overlapY + padding) / 2);
            const centerA = boundsA.y + boundsA.height / 2;
            const centerB = boundsB.y + boundsB.height / 2;

            if (centerA < centerB) {
              currentNodes[i] = {
                ...nodeA,
                position: { ...nodeA.position, y: nodeA.position.y - pushAmount },
              };
              currentNodes[j] = {
                ...nodeB,
                position: { ...nodeB.position, y: nodeB.position.y + pushAmount },
              };
            } else {
              currentNodes[i] = {
                ...nodeA,
                position: { ...nodeA.position, y: nodeA.position.y + pushAmount },
              };
              currentNodes[j] = {
                ...nodeB,
                position: { ...nodeB.position, y: nodeB.position.y - pushAmount },
              };
            }
          } else {
            // Push horizontally - respect rank ordering
            const pushAmount = Math.ceil((overlapX + padding) / 2);
            const rankA = boundsA.rank || 0;
            const rankB = boundsB.rank || 0;

            if (rankA < rankB) {
              // A should be to the left
              currentNodes[i] = {
                ...nodeA,
                position: { ...nodeA.position, x: nodeA.position.x - pushAmount },
              };
              currentNodes[j] = {
                ...nodeB,
                position: { ...nodeB.position, x: nodeB.position.x + pushAmount },
              };
            } else if (rankA > rankB) {
              // B should be to the left
              currentNodes[i] = {
                ...nodeA,
                position: { ...nodeA.position, x: nodeA.position.x + pushAmount },
              };
              currentNodes[j] = {
                ...nodeB,
                position: { ...nodeB.position, x: nodeB.position.x - pushAmount },
              };
            } else {
              // Same rank - push based on center position
              const centerA = boundsA.x + boundsA.width / 2;
              const centerB = boundsB.x + boundsB.width / 2;

              if (centerA < centerB) {
                currentNodes[i] = {
                  ...nodeA,
                  position: { ...nodeA.position, x: nodeA.position.x - pushAmount },
                };
                currentNodes[j] = {
                  ...nodeB,
                  position: { ...nodeB.position, x: nodeB.position.x + pushAmount },
                };
              } else {
                currentNodes[i] = {
                  ...nodeA,
                  position: { ...nodeA.position, x: nodeA.position.x + pushAmount },
                };
                currentNodes[j] = {
                  ...nodeB,
                  position: { ...nodeB.position, x: nodeB.position.x - pushAmount },
                };
              }
            }
          }
        }
      }
    }

    if (!hasOverlap) break;
  }

  return currentNodes;
}

/**
 * Check if any nodes overlap
 */
export function hasOverlapsSmart(nodes: FlowV2Node[]): boolean {
  const padding = SMART_LAYOUT_CONFIG.spacing.nodePadding;
  const boundsList = nodes.map(getNodeBounds);

  for (let i = 0; i < boundsList.length; i++) {
    for (let j = i + 1; j < boundsList.length; j++) {
      if (boundsOverlap(boundsList[i], boundsList[j], padding)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// FULL SMART LAYOUT PIPELINE
// ============================================================================

/**
 * Complete smart layout with measured dimensions and overlap resolution
 */
export async function computeFullSmartLayout(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[],
  options?: { useMeasured?: boolean }
): Promise<FlowV2Node[]> {
  // First pass: Smart Dagre layout
  let layoutedNodes = await computeSmartDagreLayout(nodes, edges, options);

  // Second pass: Resolve any remaining overlaps
  if (hasOverlapsSmart(layoutedNodes)) {
    layoutedNodes = resolveOverlapsSmart(layoutedNodes, edges);
  }

  return layoutedNodes;
}

// ============================================================================
// REACT HOOK: useSmartLayout
// ============================================================================

export function useSmartLayout() {
  const { getNodes, setNodes, fitView, getEdges } = useReactFlow();
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLayoutingRef = useRef(false);

  /**
   * Apply smart layout to current nodes
   */
  const applySmartLayout = useCallback(
    async (options: SmartLayoutOptions = {}) => {
      const {
        animate = true,
        fitAfterLayout = true,
        fitPadding = 0.15,
      } = options;

      if (isLayoutingRef.current) return;
      isLayoutingRef.current = true;

      const nodes = getNodes() as FlowV2Node[];
      const edges = getEdges() as FlowV2Edge[];

      // Check if all nodes are measured
      const allMeasured = nodes.every(
        (n) => n.measured?.width && n.measured?.height
      );

      // Compute layout
      const layoutedNodes = await computeFullSmartLayout(nodes, edges, {
        useMeasured: allMeasured,
      });

      // Apply positions
      setNodes(layoutedNodes as Node[]);

      // Fit view after layout
      if (fitAfterLayout) {
        setTimeout(() => {
          fitView({
            padding: fitPadding,
            duration: animate ? SMART_LAYOUT_CONFIG.animation.layoutDuration : 0,
          });
        }, 50);
      }

      isLayoutingRef.current = false;
    },
    [getNodes, getEdges, setNodes, fitView]
  );

  /**
   * Debounced layout application
   */
  const applySmartLayoutDebounced = useCallback(
    (options: SmartLayoutOptions = {}, delay = 100) => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      layoutTimeoutRef.current = setTimeout(() => {
        applySmartLayout(options);
        layoutTimeoutRef.current = null;
      }, delay);
    },
    [applySmartLayout]
  );

  /**
   * Get current layout metrics
   */
  const getLayoutMetrics = useCallback((): LayoutMetrics => {
    const nodes = getNodes() as FlowV2Node[];
    const edges = getEdges() as FlowV2Edge[];
    return analyzeFlowStructure(nodes, edges);
  }, [getNodes, getEdges]);

  /**
   * Get node clusters
   */
  const getNodeClusters = useCallback((): NodeCluster[] => {
    const nodes = getNodes() as FlowV2Node[];
    const edges = getEdges() as FlowV2Edge[];
    return clusterNodes(nodes, edges);
  }, [getNodes, getEdges]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, []);

  return {
    applySmartLayout,
    applySmartLayoutDebounced,
    getLayoutMetrics,
    getNodeClusters,
    SMART_LAYOUT_CONFIG,
  };
}
