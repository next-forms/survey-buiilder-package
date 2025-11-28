import type { NodeData, BlockData } from "../../../types";
import type { FlowV2Node, FlowV2Edge, BlockNodeData } from "../types";
import { NODE_DIMENSIONS } from "../types";

// Layout configuration
const LAYOUT = {
  startY: 80,
  nodeSpacingY: 160,
  nodeSpacingX: 350,
  centerX: 500,
  branchOffsetX: 300,
};

/**
 * Transform pageless survey data (rootNode.items = blocks) to React Flow nodes and edges
 * with proper branching layout based on navigation rules
 */
export function pagelessToFlow(rootNode: NodeData | null): {
  nodes: FlowV2Node[];
  edges: FlowV2Edge[];
} {
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  const nodes: FlowV2Node[] = [];
  const edges: FlowV2Edge[] = [];

  // Get blocks directly from rootNode.items (pageless mode)
  const blocks = (rootNode.items || []) as BlockData[];

  // Analyze navigation rules to determine layout
  const branchTargets = new Set<string>();
  const branchSources = new Map<string, string[]>(); // source -> targets

  blocks.forEach((block) => {
    const rules = block.navigationRules || [];
    if (rules.length > 0) {
      const targets: string[] = [];
      rules.forEach((rule) => {
        if (rule.target && rule.target !== "submit") {
          branchTargets.add(rule.target);
          targets.push(rule.target);
        }
      });
      if (targets.length > 0) {
        branchSources.set(block.uuid || block.fieldName || "", targets);
      }
    }
  });

  // Calculate positions using a tree-like layout
  const positions = calculateBranchingLayout(blocks, branchSources, branchTargets);

  // Create start node
  const startNode: FlowV2Node = {
    id: "start",
    type: "start",
    position: { x: LAYOUT.centerX - NODE_DIMENSIONS.start.width / 2, y: LAYOUT.startY },
    data: { label: "Start" },
    draggable: true,
  };
  nodes.push(startNode);

  // Create block nodes with calculated positions
  blocks.forEach((block, index) => {
    const blockId = block.uuid || `block-${index}`;
    const pos = positions.get(blockId) || {
      x: LAYOUT.centerX - NODE_DIMENSIONS.block.width / 2,
      y: LAYOUT.startY + NODE_DIMENSIONS.start.height + LAYOUT.nodeSpacingY * (index + 1),
    };

    const blockNode: FlowV2Node = {
      id: blockId,
      type: "block",
      position: pos,
      data: {
        block,
        index,
        isFirst: index === 0,
        isLast: index === blocks.length - 1,
      } as BlockNodeData,
      draggable: true,
    };
    nodes.push(blockNode);
  });

  // Create submit node
  const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y), LAYOUT.startY);
  const submitY = maxY + LAYOUT.nodeSpacingY;
  const submitNode: FlowV2Node = {
    id: "submit",
    type: "submit",
    position: { x: LAYOUT.centerX - NODE_DIMENSIONS.submit.width / 2, y: submitY },
    data: { label: "Submit" },
    draggable: true,
  };
  nodes.push(submitNode);

  // Create edges
  createEdges(blocks, edges);

  return { nodes, edges };
}

/**
 * Calculate positions for blocks considering branching
 */
function calculateBranchingLayout(
  blocks: BlockData[],
  branchSources: Map<string, string[]>,
  branchTargets: Set<string>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Track which blocks are branch targets (they might be offset)
  const blockColumns = new Map<string, number>(); // blockId -> column (0 = center, -1 = left, 1 = right)

  // First pass: identify branches and assign columns
  blocks.forEach((block, index) => {
    const blockId = block.uuid || block.fieldName || `block-${index}`;

    // Check if this block branches to multiple targets
    const targets = branchSources.get(blockId) || [];
    if (targets.length > 1) {
      // This block branches - keep it centered, spread targets
      blockColumns.set(blockId, 0);
    } else if (branchTargets.has(blockId) || branchTargets.has(block.fieldName || "")) {
      // This block is a branch target - might need to offset
      // Find which branch it belongs to
      let foundColumn = 0;
      branchSources.forEach((targetList) => {
        const targetIndex = targetList.indexOf(blockId) !== -1
          ? targetList.indexOf(blockId)
          : targetList.indexOf(block.fieldName || "");
        if (targetIndex !== -1) {
          foundColumn = targetIndex - Math.floor(targetList.length / 2);
        }
      });
      blockColumns.set(blockId, foundColumn);
    } else {
      blockColumns.set(blockId, 0);
    }
  });

  // Second pass: calculate actual positions - simple sequential layout
  // For now, just place blocks vertically in order
  blocks.forEach((block, index) => {
    const blockId = block.uuid || block.fieldName || `block-${index}`;
    const column = blockColumns.get(blockId) || 0;

    const x = LAYOUT.centerX - NODE_DIMENSIONS.block.width / 2 + column * LAYOUT.branchOffsetX;
    const y = LAYOUT.startY + NODE_DIMENSIONS.start.height + LAYOUT.nodeSpacingY * (index + 1);

    positions.set(blockId, { x, y });
  });

  return positions;
}

/**
 * Create edges between nodes based on navigation rules and sequential flow
 */
function createEdges(
  blocks: BlockData[],
  edges: FlowV2Edge[]
): void {
  // Start -> first block (or submit if no blocks)
  if (blocks.length > 0) {
    const firstBlockId = blocks[0].uuid || "block-0";
    edges.push({
      id: "start-to-first",
      source: "start",
      target: firstBlockId,
      type: "conditional",
      data: { isSequential: true },
    });
  } else {
    edges.push({
      id: "start-to-submit",
      source: "start",
      target: "submit",
      type: "conditional",
      data: { isSequential: true },
    });
    return;
  }

  // Process each block
  blocks.forEach((block, index) => {
    const blockId = block.uuid || `block-${index}`;
    const isLastBlock = index === blocks.length - 1;
    const nextBlockId = isLastBlock ? "submit" : blocks[index + 1].uuid || `block-${index + 1}`;

    const navigationRules = block.navigationRules || [];

    if (navigationRules.length > 0) {
      // Create edges for each navigation rule
      navigationRules.forEach((rule, ruleIndex) => {
        const targetId = resolveNavigationTarget(rule.target, blocks);

        edges.push({
          id: `${blockId}-nav-${ruleIndex}`,
          source: blockId,
          target: targetId,
          type: "conditional",
          data: {
            condition: rule.condition,
            isDefault: rule.isDefault,
            label: rule.isDefault ? "default" : rule.condition,
            navigationRule: rule,
          },
        });
      });

      // Add default sequential edge if no default rule exists
      const hasDefault = navigationRules.some((r) => r.isDefault);
      if (!hasDefault) {
        edges.push({
          id: `${blockId}-to-${nextBlockId}-seq`,
          source: blockId,
          target: nextBlockId,
          type: "conditional",
          data: {
            isSequential: true,
            isDefault: true,
            label: "default",
          },
        });
      }
    } else {
      // No navigation rules - just sequential flow
      edges.push({
        id: `${blockId}-to-${nextBlockId}`,
        source: blockId,
        target: nextBlockId,
        type: "conditional",
        data: { isSequential: true },
      });
    }
  });
}

/**
 * Resolve navigation target to node ID
 */
function resolveNavigationTarget(target: string, blocks: BlockData[]): string {
  if (target === "submit" || target === "end") {
    return "submit";
  }

  // Check if target matches a block's uuid or fieldName
  const targetBlock = blocks.find((b) => b.uuid === target || b.fieldName === target);

  if (targetBlock) {
    return targetBlock.uuid || `block-${blocks.indexOf(targetBlock)}`;
  }

  // Default to submit if target not found
  return "submit";
}

/**
 * Recalculate node positions after reorder - maintains the branching structure
 */
export function recalculatePositions(nodes: FlowV2Node[]): FlowV2Node[] {
  const startNode = nodes.find((n) => n.type === "start");
  const blockNodes = nodes.filter((n) => n.type === "block").sort((a, b) => {
    const aData = a.data as BlockNodeData;
    const bData = b.data as BlockNodeData;
    return aData.index - bData.index;
  });
  const submitNode = nodes.find((n) => n.type === "submit");

  const result: FlowV2Node[] = [];

  if (startNode) {
    result.push({
      ...startNode,
      position: {
        x: LAYOUT.centerX - NODE_DIMENSIONS.start.width / 2,
        y: LAYOUT.startY,
      },
    });
  }

  blockNodes.forEach((node, index) => {
    const y = LAYOUT.startY + NODE_DIMENSIONS.start.height + LAYOUT.nodeSpacingY * (index + 1);
    result.push({
      ...node,
      position: {
        x: LAYOUT.centerX - NODE_DIMENSIONS.block.width / 2,
        y,
      },
    });
  });

  if (submitNode) {
    const submitY =
      LAYOUT.startY + NODE_DIMENSIONS.start.height + LAYOUT.nodeSpacingY * (blockNodes.length + 1);
    result.push({
      ...submitNode,
      position: {
        x: LAYOUT.centerX - NODE_DIMENSIONS.submit.width / 2,
        y: submitY,
      },
    });
  }

  return result;
}
