import dagre from "@dagrejs/dagre";
import { Node, Edge, Position } from "@xyflow/react";

const defaultWidth = 400;
const defaultHeight = 150;

// Cache for layout results to avoid redundant calculations
let layoutCache: {
  key: string;
  result: { nodes: Node[]; edges: Edge[] };
} | null = null;

// Generate a cache key based on node IDs, connections, and sizes
const generateLayoutCacheKey = (nodes: Node[], edges: Edge[]): string => {
  const nodeKey = nodes.map(n =>
    `${n.id}:${n.measured?.width ?? defaultWidth}x${n.measured?.height ?? defaultHeight}`
  ).join('|');
  const edgeKey = edges.map(e => `${e.source}->${e.target}`).join('|');
  return `${nodeKey}::${edgeKey}`;
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  // Check cache first
  const cacheKey = generateLayoutCacheKey(nodes, edges);
  if (layoutCache && layoutCache.key === cacheKey) {
    return layoutCache.result;
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";

  // OPTIMIZED: Reduced nodesep from 1200 to 100 for better performance
  // Large nodesep values cause the layout algorithm to work harder
  // and create unnecessarily spread out graphs
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,  // Reduced from 1200 - much better performance
    ranksep: 150,  // Slightly reduced for tighter layouts
    ranker: 'tight-tree',  // Faster than network-simplex for most cases
    align: 'DL'  // Align child nodes to the left instead of right
  });

  nodes.forEach((node) => {
    // Prefer measured dimensions from React Flow v12
    const width = node.measured?.width ?? defaultWidth;
    const height = node.measured?.height ?? defaultHeight;

    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    // Use weight from edge data if available to guide layout (higher weight = straighter/shorter edge)
    const weight = (edge.data?.weight as number) || 1;
    dagreGraph.setEdge(edge.source, edge.target, { weight });
  });

  dagre.layout(dagreGraph);

  // Calculate min and max x to mirror the layout horizontally
  // This shifts child nodes to the left instead of right
  let minX = Infinity;
  let maxX = -Infinity;
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    minX = Math.min(minX, nodeWithPosition.x);
    maxX = Math.max(maxX, nodeWithPosition.x);
  });
  const centerX = (minX + maxX) / 2;

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    // Dagre returns center point, React Flow wants top-left
    // Use the dimensions we gave Dagre
    const width = node.measured?.width ?? defaultWidth;
    const height = node.measured?.height ?? defaultHeight;

    // Mirror x position around center to shift children left instead of right
    const mirroredX = centerX - (nodeWithPosition.x - centerX);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: mirroredX - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  const result = { nodes: layoutedNodes, edges };

  // Cache the result
  layoutCache = { key: cacheKey, result };

  return result;
};

// Export function to invalidate cache if needed
export const invalidateLayoutCache = () => {
  layoutCache = null;
};