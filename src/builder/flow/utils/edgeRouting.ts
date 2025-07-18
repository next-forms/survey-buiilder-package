import { FlowNode, FlowEdge } from "../types";

export type ConnectionSide = "top" | "right" | "bottom" | "left";

export interface ConnectionPoint {
  x: number;
  y: number;
  side: ConnectionSide;
}

export interface EdgeRoute {
  source: ConnectionPoint;
  target: ConnectionPoint;
  path: string;
}

/**
 * Calculate the best connection sides for two nodes based on their relative positions
 */
export function getBestConnectionSides(
  sourceNode: FlowNode,
  targetNode: FlowNode,
  sourceSize: { width: number; height: number },
  targetSize: { width: number; height: number },
  edge?: FlowEdge
): { sourceSide: ConnectionSide; targetSide: ConnectionSide } {
  const sourceCenterX = sourceNode.position.x + sourceSize.width / 2;
  const sourceCenterY = sourceNode.position.y + sourceSize.height / 2;
  const targetCenterX = targetNode.position.x + targetSize.width / 2;
  const targetCenterY = targetNode.position.y + targetSize.height / 2;
  
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  
  // Determine primary direction
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  // Special handling based on edge type
  const isPageToPage = edge?.data?.isPageToPage;
  const isPageEntry = edge?.data?.isPageEntry;
  const isSequential = edge?.data?.isSequential;
  const isConditional = edge?.type === "conditional";
  
  // For hierarchical layouts, prefer top/bottom connections
  if (isPageToPage || (sourceNode.type === "set" && targetNode.type === "set")) {
    // Page-to-page connections: always bottom to top
    return { sourceSide: "bottom", targetSide: "top" };
  }
  
  if (isPageEntry || (sourceNode.type === "set" && targetNode.type === "block")) {
    // Page to block: check if block is inside page
    const blockMatch = targetNode.id.match(/^(.+)-block-(\d+)$/);
    if (blockMatch && blockMatch[1] === sourceNode.id) {
      // Internal block: connect from top of page to top of block
      return { sourceSide: "top", targetSide: "top" };
    }
  }
  
  // For conditional edges (branching), prefer side connections when nodes are horizontally separated
  if (isConditional && absDx > absDy * 0.5) {
    // Use side connections for better visibility
    if (dx > 0) {
      return { sourceSide: "right", targetSide: "left" };
    } else {
      return { sourceSide: "left", targetSide: "right" };
    }
  }
  
  // For sequential flow, always use bottom to top
  if (isSequential) {
    return { sourceSide: "bottom", targetSide: "top" };
  }
  
  // Default logic based on relative positions
  if (absDx > absDy * 1.5) {
    // Primarily horizontal
    if (dx > 0) {
      return { sourceSide: "right", targetSide: "left" };
    } else {
      return { sourceSide: "left", targetSide: "right" };
    }
  } else {
    // Primarily vertical or diagonal
    if (dy > 0) {
      return { sourceSide: "bottom", targetSide: "top" };
    } else {
      return { sourceSide: "top", targetSide: "bottom" };
    }
  }
}

/**
 * Get connection point on a specific side of a node
 */
export function getConnectionPoint(
  node: FlowNode,
  nodeSize: { width: number; height: number },
  side: ConnectionSide,
  offset: number = 0.5 // 0 to 1, where 0.5 is center
): ConnectionPoint {
  const { x, y } = node.position;
  const { width, height } = nodeSize;
  
  switch (side) {
    case "top":
      return {
        x: x + width * offset,
        y: y,
        side: "top"
      };
    case "right":
      return {
        x: x + width,
        y: y + height * offset,
        side: "right"
      };
    case "bottom":
      return {
        x: x + width * offset,
        y: y + height,
        side: "bottom"
      };
    case "left":
      return {
        x: x,
        y: y + height * offset,
        side: "left"
      };
  }
}

/**
 * Distribute connection points along a side when multiple edges connect to the same side
 */
export function distributeConnectionPoints(
  nodeId: string,
  side: ConnectionSide,
  edges: FlowEdge[],
  currentEdgeId: string
): number {
  // Find all edges that connect to this node on this side
  const edgesOnSide = edges.filter(edge => {
    if (edge.id === currentEdgeId) return true;
    // Check if this edge connects to the same node
    return edge.source === nodeId || edge.target === nodeId;
  });
  
  // Sort edges by ID for consistent ordering
  edgesOnSide.sort((a, b) => a.id.localeCompare(b.id));
  
  // Find index of current edge
  const currentIndex = edgesOnSide.findIndex(e => e.id === currentEdgeId);
  const totalEdges = edgesOnSide.length;
  
  if (totalEdges === 1) {
    return 0.5; // Center
  }
  
  // Distribute evenly along the side
  const spacing = 0.8 / (totalEdges + 1); // Use 80% of the side, leaving 10% margin on each end
  const offset = 0.1 + spacing * (currentIndex + 1);
  
  return offset;
}

/**
 * Create a smooth bezier curve path between two connection points
 */
export function createEdgePath(
  source: ConnectionPoint,
  target: ConnectionPoint,
  edgeType?: string
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Control point offset based on connection sides and distance
  let controlOffset = Math.max(30, Math.min(150, distance * 0.4));
  
  // Special handling for different edge types
  if (edgeType === "conditional") {
    controlOffset *= 1.2; // Larger curves for conditional edges
  }
  
  // Calculate control points based on connection sides
  let cp1x = source.x;
  let cp1y = source.y;
  let cp2x = target.x;
  let cp2y = target.y;
  
  // Adjust control points based on source side
  switch (source.side) {
    case "top":
      cp1y -= controlOffset;
      break;
    case "right":
      cp1x += controlOffset;
      break;
    case "bottom":
      cp1y += controlOffset;
      break;
    case "left":
      cp1x -= controlOffset;
      break;
  }
  
  // Adjust control points based on target side
  switch (target.side) {
    case "top":
      cp2y -= controlOffset;
      break;
    case "right":
      cp2x += controlOffset;
      break;
    case "bottom":
      cp2y += controlOffset;
      break;
    case "left":
      cp2x -= controlOffset;
      break;
  }
  
  // Create bezier curve path
  return `M ${source.x} ${source.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;
}

/**
 * Calculate smart edge routing for all edges to avoid overlaps
 */
export function calculateEdgeRoutes(
  edges: FlowEdge[],
  nodes: FlowNode[],
  zoom: number
): Map<string, EdgeRoute> {
  const routes = new Map<string, EdgeRoute>();
  
  // Group edges by source and target nodes
  const edgesByNode = new Map<string, FlowEdge[]>();
  edges.forEach(edge => {
    // Group by source
    const sourceEdges = edgesByNode.get(edge.source) || [];
    sourceEdges.push(edge);
    edgesByNode.set(edge.source, sourceEdges);
    
    // Group by target
    const targetEdges = edgesByNode.get(edge.target) || [];
    targetEdges.push(edge);
    edgesByNode.set(edge.target, targetEdges);
  });
  
  // Calculate route for each edge
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    // Get node sizes
    const sourceData = sourceNode.data as any;
    const targetData = targetNode.data as any;
    const nodeZoomScale = Math.max(0.7, Math.min(1, zoom));
    
    const sourceSize = {
      width: (sourceData?.containerSize?.width || 120) * nodeZoomScale,
      height: (sourceData?.containerSize?.height || 60) * nodeZoomScale
    };
    const targetSize = {
      width: (targetData?.containerSize?.width || 120) * nodeZoomScale,
      height: (targetData?.containerSize?.height || 60) * nodeZoomScale
    };
    
    // Determine best connection sides
    const { sourceSide, targetSide } = getBestConnectionSides(
      sourceNode, 
      targetNode, 
      sourceSize, 
      targetSize,
      edge
    );
    
    // Get connection offsets to distribute multiple edges
    const sourceOffset = distributeConnectionPoints(
      edge.source,
      sourceSide,
      edgesByNode.get(edge.source) || [],
      edge.id
    );
    const targetOffset = distributeConnectionPoints(
      edge.target,
      targetSide,
      edgesByNode.get(edge.target) || [],
      edge.id
    );
    
    // Calculate connection points
    const sourcePoint = getConnectionPoint(sourceNode, sourceSize, sourceSide, sourceOffset);
    const targetPoint = getConnectionPoint(targetNode, targetSize, targetSide, targetOffset);
    
    // Create edge path
    const path = createEdgePath(sourcePoint, targetPoint, edge.type);
    
    routes.set(edge.id, {
      source: sourcePoint,
      target: targetPoint,
      path
    });
  });
  
  return routes;
}