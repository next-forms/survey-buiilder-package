import { FlowNode, FlowEdge } from "../types";

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  allowedTargets?: string[];
}

export interface EdgeDragState {
  isDragging: boolean;
  edgeId?: string;
  originalTarget?: string;
  currentPosition?: { x: number; y: number };
  validTargets?: string[];
}

/**
 * Validates whether a connection can be made between two nodes
 */
export function validateConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode,
  edge: FlowEdge,
  allNodes: FlowNode[],
  allEdges: FlowEdge[]
): ConnectionValidationResult {
  // Prevent self-connections
  if (sourceNode.id === targetNode.id) {
    return { isValid: false, reason: "Cannot connect node to itself" };
  }

  // Check for existing connection
  const existingEdge = allEdges.find(e => 
    e.source === sourceNode.id && e.target === targetNode.id && e.id !== edge.id
  );
  if (existingEdge) {
    return { isValid: false, reason: "Connection already exists" };
  }

  // Type-specific validation
  switch (edge.type) {
    case "conditional":
      return validateConditionalConnection(sourceNode, targetNode);
    
    case "sequential":
      return validateSequentialConnection(sourceNode, targetNode, allNodes);
    
    case "default":
      if (edge.data?.isStartEntry) {
        return validateStartEntryConnection(sourceNode, targetNode);
      } else if (edge.data?.isPageEntry) {
        return validatePageEntryConnection(sourceNode, targetNode);
      } else if (edge.data?.isPageToPage) {
        return validatePageToPageConnection(sourceNode, targetNode);
      }
      return validateDefaultConnection(sourceNode, targetNode);
    
    default:
      return validateDefaultConnection(sourceNode, targetNode);
  }
}

/**
 * Validates conditional navigation rule connections
 */
function validateConditionalConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode
): ConnectionValidationResult {
  // Source must be a block (cannot be set or section)
  if (sourceNode.type !== "block") {
    return { isValid: false, reason: "Navigation rules can only start from blocks (not from sets or sections)" };
  }

  // Target can be block, page (set), or submit
  if (!["block", "set", "submit"].includes(targetNode.type)) {
    return { isValid: false, reason: "Invalid target for navigation rule" };
  }

  // Additional validation: blocks within the same page should be allowed
  // Cross-page navigation should be to the first block of the target page
  if (targetNode.type === "block") {
    const sourcePageId = extractPageIdFromBlockId(sourceNode.id);
    const targetPageId = extractPageIdFromBlockId(targetNode.id);
    
    if (sourcePageId !== targetPageId) {
      // Cross-page navigation to a block should target the first block of the page
      const targetBlockIndex = extractBlockIndexFromBlockId(targetNode.id);
      if (targetBlockIndex !== 0) {
        return { 
          isValid: false, 
          reason: "Cross-page navigation should target the first block of the page" 
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates sequential flow connections
 */
function validateSequentialConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode,
  _allNodes: FlowNode[]
): ConnectionValidationResult {
  // Sequential connections are between blocks or from blocks to submit
  if (sourceNode.type !== "block") {
    return { isValid: false, reason: "Sequential flow must start from a block" };
  }

  if (!["block", "submit"].includes(targetNode.type)) {
    return { isValid: false, reason: "Sequential flow can only connect to blocks or submit" };
  }

  // Check for logical sequence within same page
  if (targetNode.type === "block") {
    const sourcePageId = extractPageIdFromBlockId(sourceNode.id);
    const targetPageId = extractPageIdFromBlockId(targetNode.id);
    
    if (sourcePageId === targetPageId) {
      // Within same page - check if it's a logical sequence
      const sourceBlockIndex = extractBlockIndexFromBlockId(sourceNode.id);
      const targetBlockIndex = extractBlockIndexFromBlockId(targetNode.id);
      
      if (targetBlockIndex <= sourceBlockIndex) {
        return { 
          isValid: false, 
          reason: "Sequential flow should move forward within the same page" 
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Validates start entry connections (from start to pages)
 */
function validateStartEntryConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode
): ConnectionValidationResult {
  // Source must be a start node
  if (sourceNode.type !== "start") {
    return { isValid: false, reason: "Start entry connections must start from a start node" };
  }

  // Target must be a page
  if (targetNode.type !== "set") {
    return { isValid: false, reason: "Start entry connections must target a page" };
  }

  return { isValid: true };
}

/**
 * Validates page entry connections (from page to first block)
 */
function validatePageEntryConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode
): ConnectionValidationResult {
  // Source must be a page
  if (sourceNode.type !== "set") {
    return { isValid: false, reason: "Page entry connections must start from a page" };
  }

  // Target must be a block
  if (targetNode.type !== "block") {
    return { isValid: false, reason: "Page entry connections must target a block" };
  }

  // Target must be within the source page
  const targetPageId = extractPageIdFromBlockId(targetNode.id);
  if (targetPageId !== sourceNode.id) {
    return { isValid: false, reason: "Page entry must connect to a block within the same page" };
  }

  return { isValid: true };
}

/**
 * Validates page-to-page connections (direct page connections)
 */
function validatePageToPageConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode
): ConnectionValidationResult {
  // Source must be a page
  if (sourceNode.type !== "set") {
    return { isValid: false, reason: "Page-to-page connections must start from a page" };
  }

  // Target must be a page
  if (targetNode.type !== "set") {
    return { isValid: false, reason: "Page-to-page connections must target a page" };
  }

  return { isValid: true };
}

/**
 * Validates default connections
 */
function validateDefaultConnection(
  sourceNode: FlowNode,
  targetNode: FlowNode
): ConnectionValidationResult {
  // Apply user requirements: cannot create navigation rules for set and section as origin
  // But sets can be targets, any node that is not set or section can be origin
  const validConnections = {
    "start": ["set"], // Start can connect to pages
    "set": [], // Sets (pages) cannot have navigation rules as origin
    "section": [], // Sections cannot have navigation rules as origin  
    "block": ["block", "set", "submit"], // Blocks can connect to blocks, pages, or submit
    "submit": [] // Submit nodes don't have outgoing connections
  };

  const allowedTargets = validConnections[sourceNode.type as keyof typeof validConnections] || [];
  
  if (!allowedTargets.includes(targetNode.type)) {
    if (sourceNode.type === "set" || sourceNode.type === "section") {
      return { 
        isValid: false, 
        reason: `Cannot create navigation rules for ${sourceNode.type} nodes as origin. Only blocks can be connection origins.` 
      };
    }
    return { 
      isValid: false, 
      reason: `${sourceNode.type} nodes cannot connect to ${targetNode.type} nodes` 
    };
  }

  return { isValid: true };
}

/**
 * Gets all valid target nodes for a given source node and edge type
 */
export function getValidTargets(
  sourceNode: FlowNode,
  edgeType: string,
  allNodes: FlowNode[],
  allEdges: FlowEdge[],
  currentEdgeId?: string
): string[] {
  const validTargets: string[] = [];

  allNodes.forEach(targetNode => {
    if (targetNode.id === sourceNode.id) return; // Skip self

    // Create a temporary edge for validation
    const tempEdge: FlowEdge = {
      id: currentEdgeId || "temp",
      source: sourceNode.id,
      target: targetNode.id,
      type: edgeType as any
    };

    const validation = validateConnection(sourceNode, targetNode, tempEdge, allNodes, allEdges);
    if (validation.isValid) {
      validTargets.push(targetNode.id);
    }
  });

  return validTargets;
}

/**
 * Checks if a connection would create a cycle
 */
export function wouldCreateCycle(
  sourceNodeId: string,
  targetNodeId: string,
  allEdges: FlowEdge[],
  excludeEdgeId?: string
): boolean {
  // Build adjacency list excluding the edge being modified
  const adjacencyList = new Map<string, string[]>();
  
  allEdges.forEach(edge => {
    if (edge.id === excludeEdgeId) return;
    
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });

  // Add the new edge
  if (!adjacencyList.has(sourceNodeId)) {
    adjacencyList.set(sourceNodeId, []);
  }
  adjacencyList.get(sourceNodeId)!.push(targetNodeId);

  // Check for cycle using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycleDFS(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (hasCycleDFS(neighbor)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check for cycles starting from any node
  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId)) {
      if (hasCycleDFS(nodeId)) return true;
    }
  }

  return false;
}

/**
 * Extracts page ID from block ID (format: pageId-block-index)
 */
function extractPageIdFromBlockId(blockId: string): string | null {
  const match = blockId.match(/^(.+)-block-(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Extracts block index from block ID (format: pageId-block-index)  
 */
function extractBlockIndexFromBlockId(blockId: string): number {
  const match = blockId.match(/^(.+)-block-(\d+)$/);
  return match ? parseInt(match[2]) : -1;
}

/**
 * Validates connection and provides user-friendly feedback
 */
export function validateConnectionWithFeedback(
  sourceNodeId: string,
  targetNodeId: string,
  edgeType: string,
  allNodes: FlowNode[],
  allEdges: FlowEdge[],
  currentEdgeId?: string
): { isValid: boolean; message: string } {
  const sourceNode = allNodes.find(n => n.id === sourceNodeId);
  const targetNode = allNodes.find(n => n.id === targetNodeId);

  if (!sourceNode || !targetNode) {
    return { isValid: false, message: "Source or target node not found" };
  }

  // Check for cycles
  if (wouldCreateCycle(sourceNodeId, targetNodeId, allEdges, currentEdgeId)) {
    return { isValid: false, message: "This connection would create a cycle" };
  }

  // Create temporary edge for validation
  const tempEdge: FlowEdge = {
    id: currentEdgeId || "temp",
    source: sourceNodeId,
    target: targetNodeId,
    type: edgeType as any
  };

  const validation = validateConnection(sourceNode, targetNode, tempEdge, allNodes, allEdges);
  
  if (validation.isValid) {
    return { isValid: true, message: "Valid connection" };
  } else {
    return { isValid: false, message: validation.reason || "Invalid connection" };
  }
}