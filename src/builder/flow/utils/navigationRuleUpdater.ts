import { FlowNode, FlowEdge } from "../types";
import { NodeData, BlockData, NavigationRule } from "../../../types";

export interface NavigationRuleUpdate {
  blockId: string;
  pageId: string;
  blockIndex: number;
  updatedRules: NavigationRule[];
}

/**
 * Updates navigation rules in survey data when flow edges are modified
 */
export function updateNavigationRulesFromEdgeChange(
  rootNode: NodeData,
  edgeId: string,
  newTargetId: string,
  allEdges: FlowEdge[],
  allNodes: FlowNode[]
): { updatedRootNode: NodeData; changes: NavigationRuleUpdate[] } {
  const changes: NavigationRuleUpdate[] = [];
  const updatedRootNode = JSON.parse(JSON.stringify(rootNode)) as NodeData;

  // Find the edge being updated
  const edge = allEdges.find(e => e.id === edgeId);
  if (!edge) {
    return { updatedRootNode, changes };
  }

  // Only handle conditional navigation rule edges
  if (edge.type !== "conditional") {
    return { updatedRootNode, changes };
  }

  // Find the source block
  const sourceBlockInfo = extractBlockInfo(edge.source);
  if (!sourceBlockInfo) {
    return { updatedRootNode, changes };
  }

  // Find the target information
  const targetInfo = getTargetInfo(newTargetId, allNodes);
  if (!targetInfo) {
    return { updatedRootNode, changes };
  }

  // Navigate to the source block in the survey structure
  const sourceBlock = findBlockInSurvey(
    updatedRootNode,
    sourceBlockInfo.pageId,
    sourceBlockInfo.blockIndex
  );

  if (!sourceBlock) {
    return { updatedRootNode, changes };
  }

  // Update the navigation rule for this edge
  const updatedRules = updateNavigationRule(
    sourceBlock,
    edge,
    targetInfo
  );

  // Track the change
  changes.push({
    blockId: edge.source,
    pageId: sourceBlockInfo.pageId,
    blockIndex: sourceBlockInfo.blockIndex,
    updatedRules
  });

  return { updatedRootNode, changes };
}

/**
 * Extracts block information from block ID (format: pageId-block-index)
 */
function extractBlockInfo(blockId: string): { pageId: string; blockIndex: number } | null {
  const match = blockId.match(/^(.+)-block-(\d+)$/);
  if (!match) return null;
  
  return {
    pageId: match[1],
    blockIndex: parseInt(match[2])
  };
}

/**
 * Gets target information for navigation rules
 */
function getTargetInfo(targetId: string, allNodes: FlowNode[]): {
  target: string;
  isPage: boolean;
} | null {
  const targetNode = allNodes.find(n => n.id === targetId);
  if (!targetNode) return null;

  if (targetNode.type === "set") {
    // Target is a page
    const pageData = targetNode.data as NodeData;
    return {
      target: pageData.name || pageData.uuid || targetId,
      isPage: true
    };
  } else if (targetNode.type === "block") {
    // Target is a block
    const blockData = targetNode.data as BlockData;
    return {
      target: blockData.fieldName || blockData.label || blockData.uuid || targetId,
      isPage: false
    };
  } else if (targetNode.type === "submit") {
    // Target is submit
    return {
      target: "submit",
      isPage: false
    };
  }

  return null;
}

/**
 * Finds a block in the survey structure by page and block index
 */
function findBlockInSurvey(
  rootNode: NodeData,
  pageId: string,
  blockIndex: number
): BlockData | null {
  // Find the page
  const page = findPageInSurvey(rootNode, pageId);
  if (!page || !page.items || page.items.length <= blockIndex) {
    return null;
  }

  const item = page.items[blockIndex];
  if (item.type === "set") {
    return null; // Not a block
  }

  return item as BlockData;
}

/**
 * Finds a page in the survey structure by page ID
 */
function findPageInSurvey(rootNode: NodeData, pageId: string): NodeData | null {
  // Check nodes array
  if (rootNode.nodes) {
    for (const node of rootNode.nodes) {
      if (typeof node !== "string" && node.uuid === pageId) {
        return node;
      }
    }
  }

  // Check items array
  if (rootNode.items) {
    for (const item of rootNode.items) {
      if (item.type === "set" && item.uuid === pageId) {
        return item as NodeData;
      }
    }
  }

  return null;
}

/**
 * Updates navigation rule for a specific edge
 */
function updateNavigationRule(
  sourceBlock: BlockData,
  edge: FlowEdge,
  targetInfo: { target: string; isPage: boolean }
): NavigationRule[] {
  // Initialize navigation rules if they don't exist
  if (!sourceBlock.navigationRules) {
    sourceBlock.navigationRules = [];
  }

  // Find the rule that corresponds to this edge
  const condition = edge.data?.condition || "";
  const isDefault = edge.data?.isDefault || false;

  // Find existing rule with matching condition
  const existingRuleIndex = sourceBlock.navigationRules.findIndex(rule => 
    rule.condition === condition && rule.isDefault === isDefault
  );

  const updatedRule: NavigationRule = {
    condition,
    target: targetInfo.target,
    isPage: targetInfo.isPage,
    isDefault
  };

  if (existingRuleIndex >= 0) {
    // Update existing rule
    sourceBlock.navigationRules[existingRuleIndex] = updatedRule;
  } else {
    // Add new rule
    sourceBlock.navigationRules.push(updatedRule);
  }

  return [...sourceBlock.navigationRules];
}

/**
 * Removes a navigation rule when an edge is deleted
 */
export function removeNavigationRuleFromEdgeDelete(
  rootNode: NodeData,
  edgeId: string,
  allEdges: FlowEdge[]
): { updatedRootNode: NodeData; changes: NavigationRuleUpdate[] } {
  const changes: NavigationRuleUpdate[] = [];
  const updatedRootNode = JSON.parse(JSON.stringify(rootNode)) as NodeData;

  // Find the edge being deleted
  const edge = allEdges.find(e => e.id === edgeId);
  if (!edge || edge.type !== "conditional") {
    return { updatedRootNode, changes };
  }

  // Find the source block
  const sourceBlockInfo = extractBlockInfo(edge.source);
  if (!sourceBlockInfo) {
    return { updatedRootNode, changes };
  }

  // Find the source block in the survey structure
  const sourceBlock = findBlockInSurvey(
    updatedRootNode,
    sourceBlockInfo.pageId,
    sourceBlockInfo.blockIndex
  );

  if (!sourceBlock || !sourceBlock.navigationRules) {
    return { updatedRootNode, changes };
  }

  // Remove the rule that corresponds to this edge
  const condition = edge.data?.condition || "";
  const isDefault = edge.data?.isDefault || false;

  const originalRulesCount = sourceBlock.navigationRules.length;
  sourceBlock.navigationRules = sourceBlock.navigationRules.filter(rule => 
    !(rule.condition === condition && rule.isDefault === isDefault)
  );

  if (sourceBlock.navigationRules.length !== originalRulesCount) {
    changes.push({
      blockId: edge.source,
      pageId: sourceBlockInfo.pageId,
      blockIndex: sourceBlockInfo.blockIndex,
      updatedRules: [...sourceBlock.navigationRules]
    });
  }

  return { updatedRootNode, changes };
}

/**
 * Validates that all navigation rules have corresponding edges in the flow
 */
export function validateNavigationRuleConsistency(
  rootNode: NodeData,
  allEdges: FlowEdge[]
): {
  isConsistent: boolean;
  missingEdges: string[];
  orphanedRules: Array<{
    blockId: string;
    rule: NavigationRule;
  }>;
} {
  const missingEdges: string[] = [];
  const orphanedRules: Array<{ blockId: string; rule: NavigationRule }> = [];

  // Build a map of existing conditional edges
  const conditionalEdges = new Map<string, FlowEdge[]>();
  allEdges.forEach(edge => {
    if (edge.type === "conditional") {
      if (!conditionalEdges.has(edge.source)) {
        conditionalEdges.set(edge.source, []);
      }
      conditionalEdges.get(edge.source)!.push(edge);
    }
  });

  // Check each page and block
  function checkNode(node: NodeData, pageId?: string) {
    if (node.items) {
      node.items.forEach((item, index) => {
        if (item.type !== "set" && (item as BlockData).navigationRules) {
          const block = item as BlockData;
          const blockId = pageId ? `${pageId}-block-${index}` : `${node.uuid}-block-${index}`;
          
          if (block.navigationRules) {
            block.navigationRules.forEach(rule => {
              // Check if there's a corresponding edge
              const edges = conditionalEdges.get(blockId) || [];
              const matchingEdge = edges.find(edge => 
                edge.data?.condition === rule.condition && 
                edge.data?.isDefault === rule.isDefault
              );
              
              if (!matchingEdge) {
                orphanedRules.push({ blockId, rule });
              }
            });
          }
        }
      });
    }

    if (node.nodes) {
      node.nodes.forEach(childNode => {
        if (typeof childNode !== "string") {
          checkNode(childNode, childNode.uuid);
        }
      });
    }
  }

  checkNode(rootNode);

  return {
    isConsistent: missingEdges.length === 0 && orphanedRules.length === 0,
    missingEdges,
    orphanedRules
  };
}