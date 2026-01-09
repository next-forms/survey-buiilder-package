import type { Node, Edge } from "@xyflow/react";
import type { BlockData } from "../../types";

export interface FlowV3NodeData extends Record<string, unknown> {
  block: BlockData;
  index: number;
}

export type FlowV3Node = Node<FlowV3NodeData, "survey-node">;
export type FlowV3Edge = Edge;
