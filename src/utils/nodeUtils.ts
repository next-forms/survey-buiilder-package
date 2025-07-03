import type { NodeData, UUID } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Find a node by UUID in the survey tree
 */
export const findNodeById = (
  rootNode: NodeData | null,
  uuid: UUID
): NodeData | null => {
  if (!rootNode) return null;
  if (rootNode.uuid === uuid) return rootNode;

  if (!rootNode.nodes || rootNode.nodes.length === 0) return null;

  for (const childNode of rootNode.nodes) {
    if (typeof childNode === "string") continue;

    const foundNode = findNodeById(childNode, uuid);
    if (foundNode) return foundNode;
  }

  return null;
};

/**
 * Get all nodes in the survey tree (flattened)
 */
export const getAllNodes = (rootNode: NodeData | null): NodeData[] => {
  if (!rootNode) return [];

  const nodes: NodeData[] = [rootNode];

  if (rootNode.nodes && rootNode.nodes.length > 0) {
    for (const childNode of rootNode.nodes) {
      if (typeof childNode === "string") continue;
      nodes.push(...getAllNodes(childNode));
    }
  }

  return nodes;
};

/**
 * Get direct parent node of a node by UUID
 */
export const getParentNode = (
  rootNode: NodeData | null,
  uuid: UUID
): NodeData | null => {
  if (!rootNode || !rootNode.nodes || rootNode.nodes.length === 0) return null;

  for (const childNode of rootNode.nodes) {
    if (typeof childNode === "string") {
      if (childNode === uuid) return rootNode;
      continue;
    }

    if (childNode.uuid === uuid) return rootNode;

    const parent = getParentNode(childNode, uuid);
    if (parent) return parent;
  }

  return null;
};

/**
 * Get all parent nodes of a node by UUID
 */
export const getAllParentNodes = (
  rootNode: NodeData | null,
  uuid: UUID
): NodeData[] => {
  if (!rootNode) return [];

  const parent = getParentNode(rootNode, uuid);
  if (!parent) return [];

  if (parent === rootNode) return [parent];

  return [...getAllParentNodes(rootNode, parent.uuid as UUID), parent];
};

/**
 * Ensure all nodes have UUIDs (useful for imported data)
 */
export const ensureNodeUuids = (node: NodeData): NodeData => {
  const nodeWithUuid = {
    ...node,
    uuid: node.uuid || uuidv4(),
  };

  if (nodeWithUuid.nodes && nodeWithUuid.nodes.length > 0) {
    nodeWithUuid.nodes = nodeWithUuid.nodes.map((childNode) => {
      if (typeof childNode === "string") return childNode;
      return ensureNodeUuids(childNode);
    });
  }

  return nodeWithUuid;
};

/**
 * Get the paths to all leaf nodes (nodes without children)
 */
export const getLeafNodePaths = (rootNode: NodeData | null): NodeData[][] => {
  if (!rootNode) return [];

  if (!rootNode.nodes || rootNode.nodes.length === 0) {
    return [[rootNode]];
  }

  const paths: NodeData[][] = [];

  for (const childNode of rootNode.nodes) {
    if (typeof childNode === "string") continue;

    const childPaths = getLeafNodePaths(childNode);
    childPaths.forEach((path) => {
      paths.push([rootNode, ...path]);
    });
  }

  return paths.length > 0 ? paths : [[rootNode]];
};

/**
 * Clone a node with all its children
 */
export const cloneNode = (node: NodeData): NodeData => {
  const clonedNode = { ...node, uuid: uuidv4() };

  if (clonedNode.nodes && clonedNode.nodes.length > 0) {
    clonedNode.nodes = clonedNode.nodes.map((childNode) => {
      if (typeof childNode === "string") return childNode;
      return cloneNode(childNode);
    });
  }

  return clonedNode;
};

/**
 * Create a link between two nodes
 */
export const linkNodes = (
  sourceNode: NodeData,
  targetNode: NodeData | UUID
): NodeData => {
  const uuid = typeof targetNode === "string" ? targetNode : targetNode.uuid;
  if (!uuid) return sourceNode;

  return {
    ...sourceNode,
    nodes: [...(sourceNode.nodes || []), uuid],
  };
};
