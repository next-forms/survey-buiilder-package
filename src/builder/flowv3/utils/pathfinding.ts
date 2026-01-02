/**
 * Smart edge routing with collision detection
 * Uses actual node positions to determine optimal paths
 */

// Padding around nodes to prevent edges from touching them
const NODE_PADDING = 25;

// Represents a node's bounding box
export interface NodeBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Result of path calculation
export interface PathResult {
  path: string;
  labelX: number;
  labelY: number;
  needsRouting: boolean;
}

// Check if a line segment from (x1,y1) to (x2,y2) intersects a rectangle
const lineIntersectsRect = (
  x1: number, y1: number,
  x2: number, y2: number,
  rectLeft: number, rectTop: number, rectRight: number, rectBottom: number
): boolean => {
  // Check if line's bounding box intersects rectangle
  const lineLeft = Math.min(x1, x2);
  const lineRight = Math.max(x1, x2);
  const lineTop = Math.min(y1, y2);
  const lineBottom = Math.max(y1, y2);

  if (lineRight < rectLeft || lineLeft > rectRight) return false;
  if (lineBottom < rectTop || lineTop > rectBottom) return false;

  // For vertical lines
  if (Math.abs(x1 - x2) < 1) {
    return x1 >= rectLeft && x1 <= rectRight;
  }

  // For horizontal lines
  if (Math.abs(y1 - y2) < 1) {
    return y1 >= rectTop && y1 <= rectBottom;
  }

  // For diagonal lines, check if line passes through rectangle
  // Using line equation: y = mx + b
  const m = (y2 - y1) / (x2 - x1);
  const b = y1 - m * x1;

  // Check intersection with each edge of the rectangle
  // Left edge
  const yAtLeft = m * rectLeft + b;
  if (yAtLeft >= rectTop && yAtLeft <= rectBottom && rectLeft >= lineLeft && rectLeft <= lineRight) return true;

  // Right edge
  const yAtRight = m * rectRight + b;
  if (yAtRight >= rectTop && yAtRight <= rectBottom && rectRight >= lineLeft && rectRight <= lineRight) return true;

  // Top edge
  const xAtTop = (rectTop - b) / m;
  if (xAtTop >= rectLeft && xAtTop <= rectRight && rectTop >= lineTop && rectTop <= lineBottom) return true;

  // Bottom edge
  const xAtBottom = (rectBottom - b) / m;
  if (xAtBottom >= rectLeft && xAtBottom <= rectRight && rectBottom >= lineTop && rectBottom <= lineBottom) return true;

  return false;
};

// Check if a smooth step path would intersect any nodes
const findBlockingNodes = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  nodes: NodeBounds[],
  sourceId: string,
  targetId: string
): NodeBounds[] => {
  const blocking: NodeBounds[] = [];

  // A smooth step path goes: vertical from source, horizontal, vertical to target
  // We need to check all three segments
  const midY = (sourceY + targetY) / 2;

  for (const node of nodes) {
    if (node.id === sourceId || node.id === targetId) continue;

    // Skip nodes with invalid positions (during drag)
    if (!isFinite(node.x) || !isFinite(node.y) || !isFinite(node.width) || !isFinite(node.height)) {
      continue;
    }

    const nodeLeft = node.x - NODE_PADDING;
    const nodeRight = node.x + node.width + NODE_PADDING;
    const nodeTop = node.y - NODE_PADDING;
    const nodeBottom = node.y + node.height + NODE_PADDING;

    // Check vertical segment from source down to midY
    if (lineIntersectsRect(sourceX, sourceY, sourceX, midY, nodeLeft, nodeTop, nodeRight, nodeBottom)) {
      blocking.push(node);
      continue;
    }

    // Check horizontal segment at midY
    if (lineIntersectsRect(sourceX, midY, targetX, midY, nodeLeft, nodeTop, nodeRight, nodeBottom)) {
      blocking.push(node);
      continue;
    }

    // Check vertical segment from midY to target
    if (lineIntersectsRect(targetX, midY, targetX, targetY, nodeLeft, nodeTop, nodeRight, nodeBottom)) {
      blocking.push(node);
      continue;
    }
  }

  return blocking;
};

// Calculate the best side to route around obstacles
const calculateRoutingSide = (
  sourceX: number,
  targetX: number,
  blockingNodes: NodeBounds[],
  allNodes: NodeBounds[]
): 'left' | 'right' => {
  if (blockingNodes.length === 0) return 'right';

  // Calculate space available on each side
  let leftClearance = Infinity;
  let rightClearance = Infinity;

  const pathLeft = Math.min(sourceX, targetX);
  const pathRight = Math.max(sourceX, targetX);

  for (const node of allNodes) {
    const nodeLeft = node.x;
    const nodeRight = node.x + node.width;

    // Space to the left of the path
    if (nodeRight < pathLeft) {
      leftClearance = Math.min(leftClearance, pathLeft - nodeRight);
    }

    // Space to the right of the path
    if (nodeLeft > pathRight) {
      rightClearance = Math.min(rightClearance, nodeLeft - pathRight);
    }
  }

  // Also consider blocking nodes - route away from them
  let blockingCenterX = 0;
  for (const node of blockingNodes) {
    blockingCenterX += node.x + node.width / 2;
  }
  blockingCenterX /= blockingNodes.length;

  const pathCenterX = (sourceX + targetX) / 2;

  // Prefer the side with more clearance, but also route away from blocking nodes
  if (blockingCenterX > pathCenterX) {
    return leftClearance > 50 ? 'left' : 'right';
  } else {
    return rightClearance > 50 ? 'right' : 'left';
  }
};

// Calculate minimum offset needed to clear blocking nodes
const calculateClearanceOffset = (
  sourceX: number,
  targetX: number,
  sourceY: number,
  targetY: number,
  blockingNodes: NodeBounds[],
  side: 'left' | 'right'
): number => {
  if (blockingNodes.length === 0) return 80;

  let maxOffset = 0;
  const refX = side === 'right' ? Math.max(sourceX, targetX) : Math.min(sourceX, targetX);

  for (const node of blockingNodes) {
    // Only consider nodes that are actually between source and target vertically
    const nodeTop = node.y;
    const nodeBottom = node.y + node.height;
    const pathTop = Math.min(sourceY, targetY);
    const pathBottom = Math.max(sourceY, targetY);

    if (nodeBottom < pathTop || nodeTop > pathBottom) continue;

    const nodeEdge = side === 'right'
      ? node.x + node.width + NODE_PADDING
      : node.x - NODE_PADDING;

    const offset = side === 'right'
      ? Math.max(0, nodeEdge - refX)
      : Math.max(0, refX - nodeEdge);

    maxOffset = Math.max(maxOffset, offset);
  }

  return maxOffset + 40; // Add clearance margin
};

// Generate a clean path around obstacles
const generateRoutingPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  blockingNodes: NodeBounds[],
  allNodes: NodeBounds[],
  edgeIndex: number,
  totalParallelEdges: number
): { path: string; labelX: number; labelY: number } => {
  const side = calculateRoutingSide(sourceX, targetX, blockingNodes, allNodes);
  const baseOffset = calculateClearanceOffset(sourceX, targetX, sourceY, targetY, blockingNodes, side);

  // Parallel edge offset
  const parallelOffset = totalParallelEdges > 1
    ? (edgeIndex - (totalParallelEdges - 1) / 2) * 35
    : 0;

  const totalOffset = baseOffset + Math.abs(parallelOffset);
  const sideX = side === 'right'
    ? Math.max(sourceX, targetX) + totalOffset
    : Math.min(sourceX, targetX) - totalOffset;

  const r = 10; // corner radius

  // Ensure minimum segment lengths for corners
  const minSegment = r * 3;
  const verticalDistance = targetY - sourceY;

  // If very short vertical distance, use simpler path
  if (verticalDistance < minSegment * 2) {
    const path = `M ${sourceX} ${sourceY} L ${sideX} ${sourceY} L ${sideX} ${targetY} L ${targetX} ${targetY}`;
    return {
      path,
      labelX: sideX + (side === 'right' ? 12 : -12),
      labelY: (sourceY + targetY) / 2 + (edgeIndex * 20),
    };
  }

  // Build path with rounded corners
  const signX = side === 'right' ? 1 : -1;

  const path = [
    `M ${sourceX} ${sourceY}`,
    // Down from source
    `L ${sourceX} ${sourceY + r}`,
    // Curve toward side
    `Q ${sourceX} ${sourceY + r * 2} ${sourceX + signX * r} ${sourceY + r * 2}`,
    // Horizontal to side
    `L ${sideX - signX * r} ${sourceY + r * 2}`,
    // Curve down
    `Q ${sideX} ${sourceY + r * 2} ${sideX} ${sourceY + r * 3}`,
    // Down along side
    `L ${sideX} ${targetY - r * 3}`,
    // Curve toward target
    `Q ${sideX} ${targetY - r * 2} ${sideX - signX * r} ${targetY - r * 2}`,
    // Horizontal toward target
    `L ${targetX + signX * r} ${targetY - r * 2}`,
    // Curve down to target
    `Q ${targetX} ${targetY - r * 2} ${targetX} ${targetY - r}`,
    // Final segment to target
    `L ${targetX} ${targetY}`,
  ].join(' ');

  // Label position on the vertical side
  const labelX = sideX + (side === 'right' ? 12 : -40);
  const labelY = (sourceY + targetY) / 2 + (edgeIndex * 20);

  return { path, labelX, labelY };
};

// Main function to calculate edge path
export const calculateEdgePath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  nodes: NodeBounds[],
  sourceId: string,
  targetId: string,
  edgeIndex: number = 0,
  totalParallelEdges: number = 1
): PathResult => {
  // Validate inputs - return fallback for invalid coordinates
  if (!isFinite(sourceX) || !isFinite(sourceY) || !isFinite(targetX) || !isFinite(targetY)) {
    return {
      path: `M ${sourceX || 0} ${sourceY || 0} L ${targetX || 0} ${targetY || 0}`,
      labelX: ((sourceX || 0) + (targetX || 0)) / 2,
      labelY: ((sourceY || 0) + (targetY || 0)) / 2,
      needsRouting: false,
    };
  }

  // Filter out invalid nodes
  const validNodes = nodes.filter(n =>
    isFinite(n.x) && isFinite(n.y) && isFinite(n.width) && isFinite(n.height) &&
    n.width > 0 && n.height > 0
  );

  // Find nodes that would block a direct path
  const blockingNodes = findBlockingNodes(
    sourceX, sourceY, targetX, targetY,
    validNodes, sourceId, targetId
  );

  if (blockingNodes.length === 0) {
    // No blocking nodes - use smooth step path
    return {
      path: '',
      labelX: (sourceX + targetX) / 2,
      labelY: (sourceY + targetY) / 2,
      needsRouting: false,
    };
  }

  // Generate routing path around obstacles
  const result = generateRoutingPath(
    sourceX, sourceY, targetX, targetY,
    blockingNodes, validNodes,
    edgeIndex, totalParallelEdges
  );

  return {
    path: result.path,
    labelX: result.labelX,
    labelY: result.labelY,
    needsRouting: true,
  };
};
