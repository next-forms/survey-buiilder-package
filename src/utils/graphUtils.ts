import type { NodeData, BlockData } from "../types";

/**
 * Interface to represent a node in the graph view
 */
export interface GraphNode {
  id: string;
  type: "section" | "page" | "block";
  label: string;
  data: NodeData | BlockData;
  childIds: string[];
  parentId?: string;
  position?: { x: number; y: number };
}

/**
 * Interface to represent a connection between nodes
 */
export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type?: 'default' | 'conditional';
}

/**
 * Extract all nodes and edges from a survey definition
 */
export const extractGraph = (rootNode: NodeData | null): { nodes: GraphNode[], edges: GraphEdge[] } => {
  if (!rootNode) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap: Record<string, GraphNode> = {};

  // Process all nodes recursively
  const processNode = (node: NodeData, parentId?: string, depth = 0, horizontalIndex = 0): GraphNode => {
    // Create a unique ID if none exists
    const nodeId = node.uuid || `node-${depth}-${horizontalIndex}`;

    // Create graph node
    const graphNode: GraphNode = {
      id: nodeId,
      type: "section",
      label: node.name || "Unnamed Section",
      data: node,
      childIds: [],
      parentId,
      position: {
        x: horizontalIndex * 300,
        y: depth * 200
      }
    };

    // Add to node map and results
    nodeMap[nodeId] = graphNode;
    nodes.push(graphNode);

    // Process pages (items)
    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((page, pageIdx) => {
        const pageId = page.uuid || `page-${nodeId}-${pageIdx}`;

        // Create page node
        const pageNode: GraphNode = {
          id: pageId,
          type: "page",
          label: page.name || `Page ${pageIdx + 1}`,
          data: page,
          childIds: [],
          parentId: nodeId,
          position: {
            x: horizontalIndex * 300 + (pageIdx * 50),
            y: (depth + 1) * 200
          }
        };

        // Add to node map and results
        nodeMap[pageId] = pageNode;
        nodes.push(pageNode);

        // Add edge from section to page
        const sectionToPageEdge: GraphEdge = {
          id: `edge-${nodeId}-${pageId}`,
          sourceId: nodeId,
          targetId: pageId,
          type: 'default'
        };

        edges.push(sectionToPageEdge);
        graphNode.childIds.push(pageId);

        // Process blocks (items in pages)
        if (page.items && Array.isArray(page.items)) {
          page.items.forEach((block, blockIdx) => {
            if (block.type !== 'markdown' && block.type !== 'html') {
              const blockId = block.uuid || `block-${pageId}-${blockIdx}`;

              // Create block node
              const blockNode: GraphNode = {
                id: blockId,
                type: "block",
                label: block.label || block.name || `${block.type} Block`,
                data: block,
                childIds: [],
                parentId: pageId,
                position: {
                  x: horizontalIndex * 300 + (blockIdx * 25),
                  y: (depth + 2) * 200 + (blockIdx * 50)
                }
              };

              // Add to node map and results
              nodeMap[blockId] = blockNode;
              nodes.push(blockNode);

              // Add edge from page to block
              const pageToBlockEdge: GraphEdge = {
                id: `edge-${pageId}-${blockId}`,
                sourceId: pageId,
                targetId: blockId,
                type: 'default'
              };

              edges.push(pageToBlockEdge);
              pageNode.childIds.push(blockId);
            }
          });
        }
      });
    }

    // Process child nodes
    if (node.nodes && Array.isArray(node.nodes)) {
      node.nodes.forEach((childNodeRef, childIdx) => {
        if (typeof childNodeRef === 'string') {
          // If it's a reference, we can't process it here
          // but we'll add an edge if we find the node later
          graphNode.childIds.push(childNodeRef);
        } else {
          // Process child node recursively
          const childGraphNode = processNode(
            childNodeRef,
            nodeId,
            depth + 1,
            horizontalIndex + childIdx + 1
          );

          // Add edge from parent to child
          const parentToChildEdge: GraphEdge = {
            id: `edge-${nodeId}-${childGraphNode.id}`,
            sourceId: nodeId,
            targetId: childGraphNode.id,
            type: 'default'
          };

          edges.push(parentToChildEdge);
          graphNode.childIds.push(childGraphNode.id);
        }
      });
    }

    return graphNode;
  };

  // Start with the root node
  processNode(rootNode);

  // Connect any string references that we couldn't process earlier
  for (const node of nodes) {
    if (node.data.navigationLogic && node.data.navigationLogic.trim() !== "return 0;") {
      // This node has custom navigation logic, so mark its outgoing edges as conditional
      node.childIds.forEach(childId => {
        const existingEdge = edges.find(e =>
          e.sourceId === node.id && e.targetId === childId
        );

        if (existingEdge) {
          existingEdge.type = 'conditional';
          existingEdge.label = 'Conditional';
        }
      });
    }
  }

  return { nodes, edges };
};

/**
 * Helper function to get a simplified layout for the graph
 */
export const layoutGraph = (nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] => {
  // Create a map of nodes by their parentId for easy access
  const nodesByParent: Record<string, GraphNode[]> = {};

  // Group nodes by their parent
  for (const node of nodes) {
    if (node.parentId) {
      if (!nodesByParent[node.parentId]) {
        nodesByParent[node.parentId] = [];
      }
      nodesByParent[node.parentId].push(node);
    }
  }

  // Find root nodes (nodes without parents)
  const rootNodes = nodes.filter(node => !node.parentId);

  // Helper function to position nodes recursively
  const positionNodes = (
    node: GraphNode,
    x = 0,
    y = 0,
    horizontalSpacing = 300,
    verticalSpacing = 200
  ) => {
    // Position the current node
    node.position = { x, y };

    // Get children of this node
    const children = nodesByParent[node.id] || [];

    // Position children with even spacing
    const totalChildren = children.length;
    const startX = x - (totalChildren * horizontalSpacing) / 2;

    children.forEach((child, index) => {
      const childX = startX + index * horizontalSpacing;
      const childY = y + verticalSpacing;
      positionNodes(child, childX, childY, horizontalSpacing / 1.5, verticalSpacing);
    });
  };

  // Position all root nodes
  rootNodes.forEach((rootNode, index) => {
    positionNodes(rootNode, index * 600, 0);
  });

  return nodes;
};

/**
 * Get all possible paths through the survey
 * This is useful for visualizing branching logic
 */
export const getAllPaths = (rootNode: NodeData | null): NodeData[][] => {
  if (!rootNode) return [];

  const paths: NodeData[][] = [];

  // Helper function to get all leaf node paths
  const getLeafNodePaths = (node: NodeData): NodeData[][] => {
    // If the node has no children, return a path with just this node
    if (!node.nodes || node.nodes.length === 0) {
      return [[node]];
    }

    // Otherwise, collect all paths from children
    const childPaths: NodeData[][] = [];

    for (const childNodeRef of node.nodes) {
      // Skip string references for simplicity
      if (typeof childNodeRef === 'string') continue;

      // Get paths from this child
      const paths = getLeafNodePaths(childNodeRef);
      for (const path of paths) {
        childPaths.push([node, ...path]);
      }
    }

    // If no child paths were found, return a path with just this node
    if (childPaths.length === 0) {
      return [[node]];
    }

    return childPaths;
  };

  return getLeafNodePaths(rootNode);
};
