import dagre from "dagre";
import { Node, Edge, Position } from "@xyflow/react";

const defaultWidth = 400;
const defaultHeight = 150;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 1200, 
    ranksep: 200, // Reduced from 200 for better vertical flow
    ranker: 'network-simplex' // Explicitly set ranker algorithm
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

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Dagre returns center point, React Flow wants top-left
    // Use the dimensions we gave Dagre
    const width = node.measured?.width ?? defaultWidth;
    const height = node.measured?.height ?? defaultHeight;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};