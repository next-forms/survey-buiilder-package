import type { Node, Edge, BuiltInNode, BuiltInEdge } from "@xyflow/react";
import type { BlockData, NavigationRule } from "../../types";

// Node data types - must extend Record<string, unknown> for React Flow v12
export interface StartNodeData extends Record<string, unknown> {
  label: string;
}

export interface BlockNodeData extends Record<string, unknown> {
  block: BlockData;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface SubmitNodeData extends Record<string, unknown> {
  label: string;
}

// Typed nodes for React Flow
export type StartNode = Node<StartNodeData, "start">;
export type BlockNode = Node<BlockNodeData, "block">;
export type SubmitNode = Node<SubmitNodeData, "submit">;

export type FlowV2Node = StartNode | BlockNode | SubmitNode;

// Edge data for conditional navigation - must extend Record<string, unknown>
export interface ConditionalEdgeData extends Record<string, unknown> {
  condition?: string;
  label?: string;
  isDefault?: boolean;
  isSequential?: boolean;
  navigationRule?: NavigationRule;
}

export type FlowV2Edge = Edge<ConditionalEdgeData>;

// Flow modes
export type FlowV2Mode = "select" | "connect" | "pan";

// Re-export LAYOUT_CONFIG for convenience (from separate file to avoid dagre dependency chain)
export { LAYOUT_CONFIG } from "./utils/layoutConfig";
