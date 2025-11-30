import type { NodeData, BlockData } from "../../../types";
import type { FlowV2Node, FlowV2Edge, BlockNodeData } from "../types";
import dagre from "@dagrejs/dagre";

// Layout configuration for horizontal flow
export const LAYOUT_CONFIG = {
  // Dagre graph settings
  rankdir: "LR" as const, // Left-to-Right horizontal layout
  nodesep: 80, // Vertical separation between nodes in same rank
  ranksep: 200, // Horizontal separation between ranks (columns) - increased for better readability
  marginx: 100,
  marginy: 100,
  // Node size defaults
  startNodeWidth: 150,
  startNodeHeight: 50,
  submitNodeWidth: 150,
  submitNodeHeight: 50,
  blockNodeMinWidth: 320,
  blockNodeMaxWidth: 450,
  blockNodeBaseHeight: 80,
  // Spacing
  edgeSeparation: 20,
} as const;

/**
 * Transform pageless survey data (rootNode.items = blocks) to React Flow nodes and edges
 * using dagre for layout.
 */
export function pagelessToFlow(rootNode: NodeData | null): {
  nodes: FlowV2Node[];
  edges: FlowV2Edge[];
} {
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  let nodes: FlowV2Node[] = [];
  const edges: FlowV2Edge[] = [];
  const blocks = (rootNode.items || []) as BlockData[];

  // --- 1. Generate Nodes ---

  // Start Node
  nodes.push({
    id: "start",
    type: "start",
    position: { x: 0, y: 0 }, // Will be calculated
    data: { label: "Start Survey" },
    draggable: true,
  });

  // Block Nodes
  blocks.forEach((block, index) => {
    const blockId = block.uuid || `block-${index}`;
    nodes.push({
      id: blockId,
      type: "block",
      position: { x: 0, y: 0 }, // Will be calculated
      data: {
        block,
        index,
        isFirst: index === 0,
        isLast: index === blocks.length - 1,
      } as BlockNodeData,
      draggable: true,
    });
  });

  // Submit Node
  nodes.push({
    id: "submit",
    type: "submit",
    position: { x: 0, y: 0 }, // Will be calculated
    data: { label: "Submit / End" },
    draggable: true,
  });

  // --- 2. Generate Edges ---
  // First pass: collect all edge configurations
  interface EdgeConfig {
    id: string;
    source: string;
    target: string;
    type: "sequential" | "rule";
    rule?: any;
    ruleIndex?: number;
    hasNavRules?: boolean;
  }

  const allEdgeConfigs: EdgeConfig[] = [];

  if (blocks.length === 0) {
    // Empty survey: Start -> Submit
    allEdgeConfigs.push({
      id: "start-to-submit",
      source: "start",
      target: "submit",
      type: "sequential",
    });
  } else {
    // Start -> First Block
    const firstBlockId = blocks[0].uuid || "block-0";
    allEdgeConfigs.push({
      id: "start-to-first",
      source: "start",
      target: firstBlockId,
      type: "sequential",
    });

    // Block Connections
    blocks.forEach((block, index) => {
      const blockId = block.uuid || `block-${index}`;
      const navRules = block.navigationRules || [];
      const nextBlockId =
        index < blocks.length - 1
          ? blocks[index + 1].uuid || `block-${index + 1}`
          : "submit";

      // 1. Navigation Rules (Conditional)
      navRules.forEach((rule, ruleIndex) => {
        const targetId = resolveNavigationTarget(rule.target, blocks);
        if (targetId) {
          allEdgeConfigs.push({
            id: `${blockId}-nav-${ruleIndex}`,
            source: blockId,
            target: targetId,
            type: "rule",
            rule,
            ruleIndex,
            hasNavRules: true,
          });
        }
      });

      // 2. Check if we need a default/sequential fallback
      const hasDefaultRule = navRules.some((r) => r.isDefault);
      if (!hasDefaultRule) {
        allEdgeConfigs.push({
          id: `${blockId}-seq-${nextBlockId}`,
          source: blockId,
          target: nextBlockId,
          type: "sequential",
          hasNavRules: navRules.length > 0,
        });
      }
    });
  }

  // Second pass: group edges by source and target for handle assignment
  // Group by source for source handle assignment
  const edgesBySource: Record<string, EdgeConfig[]> = {};
  // Group by target for target handle assignment
  const edgesByTarget: Record<string, EdgeConfig[]> = {};

  allEdgeConfigs.forEach((config) => {
    if (!edgesBySource[config.source]) {
      edgesBySource[config.source] = [];
    }
    edgesBySource[config.source].push(config);

    if (!edgesByTarget[config.target]) {
      edgesByTarget[config.target] = [];
    }
    edgesByTarget[config.target].push(config);
  });

  // Helper to distribute handles
  const getHandleIndices = (count: number): number[] => {
    if (count === 1) return [2];
    if (count === 2) return [1, 3];
    if (count === 3) return [1, 2, 3];
    if (count === 4) return [0, 1, 3, 4];
    return Array.from({ length: count }, (_, i) => i % 5);
  };

  // Create source handle mapping
  const sourceHandleMap: Record<string, string> = {};
  Object.entries(edgesBySource).forEach(([sourceId, sourceEdges]) => {
    const handleIndices = getHandleIndices(sourceEdges.length);
    sourceEdges.forEach((edge, i) => {
      sourceHandleMap[edge.id] = `source-${handleIndices[i]}`;
    });
  });

  // Create target handle mapping
  const targetHandleMap: Record<string, string> = {};
  Object.entries(edgesByTarget).forEach(([targetId, targetEdges]) => {
    const handleIndices = getHandleIndices(targetEdges.length);
    targetEdges.forEach((edge, i) => {
      targetHandleMap[edge.id] = `target-${handleIndices[i]}`;
    });
  });

  // Third pass: create actual edge objects with handles
  allEdgeConfigs.forEach((config) => {
    const sourceHandle = sourceHandleMap[config.id];
    const targetHandle = targetHandleMap[config.id];
    const isSequential = config.type === "sequential";
    const rule = config.rule;

    // Calculate parallel edge info for edges going to the same target
    const targetEdges = edgesByTarget[config.target];
    const parallelIndex = targetEdges.findIndex((e) => e.id === config.id);
    const parallelTotal = targetEdges.length;

    if (isSequential) {
      edges.push({
        id: config.id,
        source: config.source,
        sourceHandle,
        target: config.target,
        targetHandle,
        type: "smart",
        animated: config.source === "start",
        label: config.hasNavRules ? "Else" : undefined,
        zIndex: 0, // Sequential edges render below conditional edges
        data: {
          isSequential: true,
          isDefault: true,
          parallelIndex,
          parallelTotal,
        },
        style: {
          stroke: "#94a3b8",
          strokeDasharray: "5,5",
        },
      });
    } else {
      edges.push({
        id: config.id,
        source: config.source,
        sourceHandle,
        target: config.target,
        targetHandle,
        type: "smart",
        animated: !rule.isDefault,
        label: rule.isDefault ? undefined : truncateLabel(rule.condition),
        zIndex: rule.isDefault ? 1 : 10, // Conditional edges render above sequential edges
        data: {
          condition: rule.condition,
          isDefault: rule.isDefault,
          navigationRule: rule,
          parallelIndex,
          parallelTotal,
        },
        style: {
          stroke: rule.isDefault ? "#94a3b8" : "#3b82f6",
          strokeWidth: rule.isDefault ? 1 : 2,
        },
      });
    }
  });

  // --- 3. Compute Layout using Dagre ---
  const layoutedNodes = computeDagreLayout(nodes, edges);

  return { nodes: layoutedNodes, edges };
}

/**
 * Helper to truncate long condition labels
 */
function truncateLabel(str?: string, maxLength = 20): string | undefined {
  if (!str) return undefined;
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
}

/**
 * Resolve target ID from string (uuid or fieldName)
 */
function resolveNavigationTarget(target: string, blocks: BlockData[]): string | null {
  if (!target) return null;
  if (target === "submit" || target === "end") return "submit";

  const targetBlock = blocks.find(
    (b) => b.uuid === target || b.fieldName === target
  );
  return targetBlock ? targetBlock.uuid || "" : "submit";
}

/**
 * Recalculate positions for existing nodes using Dagre.
 * Supports using actual measured dimensions if available.
 * Uses horizontal (LR) layout for better flow visualization.
 */
export function recalculatePositions(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[],
  options?: { useMeasured?: boolean }
): FlowV2Node[] {
  const { useMeasured = true } = options || {};

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: LAYOUT_CONFIG.rankdir, // Horizontal layout
    nodesep: LAYOUT_CONFIG.nodesep, // Vertical separation between nodes
    ranksep: LAYOUT_CONFIG.ranksep, // Horizontal separation between ranks
    marginx: LAYOUT_CONFIG.marginx,
    marginy: LAYOUT_CONFIG.marginy,
    align: "UL", // Align nodes to upper-left for consistent positioning
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Build a map of node dimensions
  const nodeDimensions = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    // Use measured dimensions if available and requested, otherwise estimate
    let width: number;
    let height: number;

    if (useMeasured && node.measured?.width && node.measured?.height) {
      // Use actual measured dimensions with some padding
      width = node.measured.width + 20;
      height = node.measured.height + 20;
    } else {
      const estimated = estimateNodeSize(node);
      width = estimated.width;
      height = estimated.height;
    }

    nodeDimensions.set(node.id, { width, height });
    g.setNode(node.id, { width, height });
  });

  // Set edges - use all edges to inform the layout
  edges.forEach((edge) => {
    // Add weight to sequential edges to prioritize them
    const weight = edge.data?.isSequential ? 2 : 1;
    g.setEdge(edge.source, edge.target, { weight });
  });

  // Calculate layout
  dagre.layout(g);

  // Apply positions - Dagre gives center coordinates, React Flow needs top-left
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const dims = nodeDimensions.get(node.id) || { width: 200, height: 100 };

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
    };
  });
}

/**
 * Estimate node dimensions based on content.
 * These estimates are used for initial layout before actual measurements are available.
 */
export function estimateNodeSize(node: FlowV2Node): { width: number; height: number } {
  if (node.type === "start") {
    return {
      width: LAYOUT_CONFIG.startNodeWidth,
      height: LAYOUT_CONFIG.startNodeHeight,
    };
  }

  if (node.type === "submit") {
    return {
      width: LAYOUT_CONFIG.submitNodeWidth,
      height: LAYOUT_CONFIG.submitNodeHeight,
    };
  }

  if (node.type === "block") {
    const block = (node.data as BlockNodeData).block;

    // Width: use average of min/max for estimation
    const width = Math.round(
      (LAYOUT_CONFIG.blockNodeMinWidth + LAYOUT_CONFIG.blockNodeMaxWidth) / 2
    );

    // Height: base + content estimation
    let height = LAYOUT_CONFIG.blockNodeBaseHeight;

    // Add height for different block types
    switch (block.type) {
      case "radio":
      case "checkbox":
        // Options-based blocks
        if (block.options && block.options.length > 0) {
          // ~36px per option, capped at reasonable maximum
          height += Math.min(block.options.length * 36, 300);
        } else {
          height += 60;
        }
        break;

      case "matrix":
        // Matrix blocks are taller
        const matrixRows = (block as any).rows?.length || 3;
        height += Math.min(matrixRows * 40 + 60, 400);
        break;

      case "textarea":
        // Textarea is taller
        height += 120;
        break;

      case "range":
      case "slider":
        // Slider/range blocks
        height += 80;
        break;

      default:
        // Standard input blocks
        height += 60;
    }

    // Add extra for long labels (likely to wrap)
    if (block.label) {
      const labelLines = Math.ceil(block.label.length / 40);
      if (labelLines > 1) {
        height += (labelLines - 1) * 20;
      }
    }

    // Add height for description if present
    if (block.description) {
      height += Math.min(Math.ceil(block.description.length / 50) * 18, 60);
    }

    // Add height for navigation rules indicator
    if (block.navigationRules && block.navigationRules.length > 0) {
      height += 28;
    }

    return { width, height };
  }

  return { width: 200, height: 100 };
}

/**
 * Compute initial layout using Dagre with estimated sizes.
 * Uses horizontal (LR) layout for better flow visualization.
 */
function computeDagreLayout(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[]
): FlowV2Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: LAYOUT_CONFIG.rankdir, // Horizontal (LR) layout
    nodesep: LAYOUT_CONFIG.nodesep, // Vertical separation
    ranksep: LAYOUT_CONFIG.ranksep, // Horizontal separation
    marginx: LAYOUT_CONFIG.marginx,
    marginy: LAYOUT_CONFIG.marginy,
    align: "UL", // Consistent alignment
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Build a map of node dimensions
  const nodeDimensions = new Map<string, { width: number; height: number }>();

  // Set nodes with estimated sizes
  nodes.forEach((node) => {
    const size = estimateNodeSize(node);
    nodeDimensions.set(node.id, size);
    g.setNode(node.id, { width: size.width, height: size.height });
  });

  // Set edges with weights to influence layout
  edges.forEach((edge) => {
    // Give higher weight to sequential edges to keep them straighter
    const weight = edge.data?.isSequential ? 2 : 1;
    g.setEdge(edge.source, edge.target, { weight });
  });

  // Calculate layout
  dagre.layout(g);

  // Apply positions - Dagre gives center coordinates, React Flow needs top-left
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const size = nodeDimensions.get(node.id) || { width: 200, height: 100 };

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - size.width / 2,
        y: nodeWithPosition.y - size.height / 2,
      },
    };
  });
}

// ============================================================================
// OVERLAP DETECTION AND RESOLUTION
// ============================================================================

interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if two node bounds overlap
 */
function boundsOverlap(a: NodeBounds, b: NodeBounds, padding = 10): boolean {
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
  const size = node.measured?.width && node.measured?.height
    ? { width: node.measured.width, height: node.measured.height }
    : estimateNodeSize(node);

  return {
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: size.width,
    height: size.height,
  };
}

/**
 * Detect overlapping nodes
 * Returns pairs of overlapping node IDs
 */
export function detectOverlaps(nodes: FlowV2Node[]): Array<[string, string]> {
  const overlaps: Array<[string, string]> = [];
  const boundsList = nodes.map(getNodeBounds);

  for (let i = 0; i < boundsList.length; i++) {
    for (let j = i + 1; j < boundsList.length; j++) {
      if (boundsOverlap(boundsList[i], boundsList[j])) {
        overlaps.push([boundsList[i].id, boundsList[j].id]);
      }
    }
  }

  return overlaps;
}

/**
 * Check if any nodes overlap
 */
export function hasOverlaps(nodes: FlowV2Node[]): boolean {
  return detectOverlaps(nodes).length > 0;
}

/**
 * Resolve overlaps by nudging nodes apart
 * This is a simple iterative approach that pushes overlapping nodes apart
 */
export function resolveOverlaps(
  nodes: FlowV2Node[],
  maxIterations = 50
): FlowV2Node[] {
  let currentNodes = [...nodes];
  const padding = 20;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const boundsList = currentNodes.map(getNodeBounds);
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
            boundsA.x + boundsA.width - boundsB.x,
            boundsB.x + boundsB.width - boundsA.x
          );
          const overlapY = Math.min(
            boundsA.y + boundsA.height - boundsB.y,
            boundsB.y + boundsB.height - boundsA.y
          );

          // Push nodes apart (prefer vertical separation for horizontal layout)
          if (overlapY < overlapX) {
            // Push vertically
            const pushAmount = (overlapY + padding) / 2;
            const centerA = boundsA.y + boundsA.height / 2;
            const centerB = boundsB.y + boundsB.height / 2;

            if (centerA < centerB) {
              currentNodes[i] = { ...nodeA, position: { ...nodeA.position, y: nodeA.position.y - pushAmount } };
              currentNodes[j] = { ...nodeB, position: { ...nodeB.position, y: nodeB.position.y + pushAmount } };
            } else {
              currentNodes[i] = { ...nodeA, position: { ...nodeA.position, y: nodeA.position.y + pushAmount } };
              currentNodes[j] = { ...nodeB, position: { ...nodeB.position, y: nodeB.position.y - pushAmount } };
            }
          } else {
            // Push horizontally
            const pushAmount = (overlapX + padding) / 2;
            const centerA = boundsA.x + boundsA.width / 2;
            const centerB = boundsB.x + boundsB.width / 2;

            if (centerA < centerB) {
              currentNodes[i] = { ...nodeA, position: { ...nodeA.position, x: nodeA.position.x - pushAmount } };
              currentNodes[j] = { ...nodeB, position: { ...nodeB.position, x: nodeB.position.x + pushAmount } };
            } else {
              currentNodes[i] = { ...nodeA, position: { ...nodeA.position, x: nodeA.position.x + pushAmount } };
              currentNodes[j] = { ...nodeB, position: { ...nodeB.position, x: nodeB.position.x - pushAmount } };
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
 * Full layout recalculation with overlap resolution
 * Use this when nodes have been measured and you want a clean layout
 */
export function layoutWithMeasuredDimensions(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[]
): FlowV2Node[] {
  // First, recalculate using Dagre with measured dimensions
  let layoutedNodes = recalculatePositions(nodes, edges, { useMeasured: true });

  // Then resolve any remaining overlaps
  if (hasOverlaps(layoutedNodes)) {
    layoutedNodes = resolveOverlaps(layoutedNodes);
  }

  return layoutedNodes;
}

/**
 * Check if nodes need relayout based on position changes or overlaps
 */
export function needsRelayout(
  currentNodes: FlowV2Node[],
  previousNodeCount: number
): boolean {
  // Relayout if node count changed
  if (currentNodes.length !== previousNodeCount) {
    return true;
  }

  // Relayout if there are overlaps
  if (hasOverlaps(currentNodes)) {
    return true;
  }

  return false;
}
