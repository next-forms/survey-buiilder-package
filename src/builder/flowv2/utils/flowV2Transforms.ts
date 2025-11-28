import type { NodeData, BlockData, NavigationRule } from "../../../types";
import type { FlowV2Node, FlowV2Edge, BlockNodeData } from "../types";
import { NODE_DIMENSIONS } from "../types";
import dagre from "dagre";

// Layout configuration
// Using dagre defaults where possible, but these are useful for estimates
const LAYOUT = {
  defaultNodeWidth: 400, 
  defaultNodeHeight: 150, 
};

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

  if (blocks.length === 0) {
    // Empty survey: Start -> Submit
    edges.push({
      id: "start-to-submit",
      source: "start",
      target: "submit",
      type: "smoothstep",
      animated: true,
      data: { isSequential: true },
    });
  } else {
    // Start -> First Block
    const firstBlockId = blocks[0].uuid || "block-0";
    edges.push({
      id: "start-to-first",
      source: "start",
      target: firstBlockId,
      type: "smoothstep",
      animated: true,
      data: { isSequential: true },
    });

    // Block Connections
    blocks.forEach((block, index) => {
      const blockId = block.uuid || `block-${index}`;
      const navRules = block.navigationRules || [];
      const nextBlockId =
        index < blocks.length - 1
          ? blocks[index + 1].uuid || `block-${index + 1}`
          : "submit";

      // Collect all edges to be created for this block
      const edgesByTarget: Record<string, any[]> = {};

      const addEdgeConfig = (config: any) => {
        if (!edgesByTarget[config.targetId]) {
          edgesByTarget[config.targetId] = [];
        }
        edgesByTarget[config.targetId].push(config);
      };

      // 1. Navigation Rules (Conditional)
      navRules.forEach((rule, ruleIndex) => {
        const targetId = resolveNavigationTarget(rule.target, blocks);
        if (targetId) {
          addEdgeConfig({
            type: "rule",
            targetId,
            rule,
            ruleIndex,
          });
        }
      });

      // 2. Check if we need a default/sequential fallback
      const hasDefaultRule = navRules.some((r) => r.isDefault);
      if (!hasDefaultRule) {
        addEdgeConfig({
          type: "sequential",
          targetId: nextBlockId,
        });
      }

      // Flatten and assign handles
      const allEdgesForBlock: any[] = [];
      Object.values(edgesByTarget).forEach((group) => {
        group.forEach((config, idx) => {
           allEdgesForBlock.push({
             ...config,
             parallelIndex: idx,
             parallelTotal: group.length
           });
        });
      });
      
      // Distribute handles
      const edgeCount = allEdgesForBlock.length;
      let handleIndices: number[] = [];

      if (edgeCount === 1) handleIndices = [2];
      else if (edgeCount === 2) handleIndices = [1, 3];
      else if (edgeCount === 3) handleIndices = [1, 2, 3];
      else if (edgeCount === 4) handleIndices = [0, 1, 3, 4];
      else handleIndices = allEdgesForBlock.map((_, i) => i % 5);

      // Create the actual edge objects
      allEdgesForBlock.forEach((edgeConfig, i) => {
        const sourceHandle = `source-${handleIndices[i]}`;
        const isSequential = edgeConfig.type === "sequential";
        const rule = edgeConfig.rule;

        if (isSequential) {
          edges.push({
            id: `${blockId}-seq-${edgeConfig.targetId}`,
            source: blockId,
            sourceHandle,
            target: edgeConfig.targetId,
            type: "conditional",
            label: navRules.length > 0 ? "Else" : undefined,
            data: {
              isSequential: true,
              isDefault: true,
              parallelIndex: edgeConfig.parallelIndex,
              parallelTotal: edgeConfig.parallelTotal,
            },
            style: {
              stroke: "#94a3b8",
              strokeDasharray: "5,5",
            },
          });
        } else {
          edges.push({
            id: `${blockId}-nav-${edgeConfig.ruleIndex}`,
            source: blockId,
            sourceHandle,
            target: edgeConfig.targetId,
            type: "conditional",
            animated: !rule.isDefault,
            label: rule.isDefault ? undefined : truncateLabel(rule.condition),
            data: {
              condition: rule.condition,
              isDefault: rule.isDefault,
              navigationRule: rule,
              parallelIndex: edgeConfig.parallelIndex,
              parallelTotal: edgeConfig.parallelTotal,
            },
            style: {
              stroke: rule.isDefault ? "#94a3b8" : "#3b82f6",
              strokeWidth: rule.isDefault ? 1 : 2,
            },
          });
        }
      });
    });
  }

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
 */
export function recalculatePositions(nodes: FlowV2Node[], edges: FlowV2Edge[]): FlowV2Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: "TB", 
    nodesep: 80, // Horizontal separation
    ranksep: 100, // Vertical separation
    marginx: 50,
    marginy: 50
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Set nodes
  nodes.forEach((node) => {
    // Use measured dimensions if available, otherwise estimate
    const width = node.measured?.width ?? estimateNodeSize(node).width;
    const height = node.measured?.height ?? estimateNodeSize(node).height;
    g.setNode(node.id, { width, height });
  });

  // Set edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(g);

  // Apply positions
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    
    const width = node.measured?.width ?? estimateNodeSize(node).width;
    const height = node.measured?.height ?? estimateNodeSize(node).height;

    // Dagre gives center coordinates, React Flow needs top-left
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });
}

/**
 * Estimate node dimensions based on content
 */
function estimateNodeSize(node: FlowV2Node): { width: number; height: number } {
  if (node.type === "start" || node.type === "submit") {
    return { width: 150, height: 80 };
  }

  if (node.type === "block") {
    const block = (node.data as BlockNodeData).block;
    // Block width constraint from CSS (min 320, max 450)
    const width = 400; 
    
    // Base height for header + padding
    let height = 100; 
    
    // Add height for content (rough estimate)
    // If rendering options or complex fields, height increases
    if (block.options && block.options.length > 0) {
      // 40px per option approx, capped
      height += Math.min(block.options.length * 40, 400);
    } else {
      // Default input field approx height
      height += 80;
    }
    
    // Add extra for label text wrapping
    if (block.label && block.label.length > 50) {
      height += 40;
    }

    return { width, height };
  }

  return { width: 200, height: 100 };
}

/**
 * Compute initial layout using Dagre with estimated sizes
 */
function computeDagreLayout(
  nodes: FlowV2Node[],
  edges: FlowV2Edge[]
): FlowV2Node[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ 
    rankdir: 'TB', 
    nodesep: 80, // Horizontal separation
    ranksep: 100, // Vertical separation
    marginx: 50,
    marginy: 50
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Set nodes
  nodes.forEach((node) => {
    const size = estimateNodeSize(node);
    g.setNode(node.id, { width: size.width, height: size.height });
  });

  // Set edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(g);

  // Apply positions
  return nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const size = estimateNodeSize(node);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - size.width / 2,
        y: nodeWithPosition.y - size.height / 2,
      },
    };
  });
}
