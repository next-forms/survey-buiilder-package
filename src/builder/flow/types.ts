import { NodeData, BlockData } from "../../types";

export type FlowMode = "select" | "connect" | "pan";

export interface FlowNode {
  id: string;
  type: "section" | "set" | "block" | "submit";
  position: { x: number; y: number };
  data: NodeData | BlockData | { name: string; type: string; containerSize?: { width: number; height: number } };
  selected?: boolean;
  connections?: {
    inputs: FlowHandle[];
    outputs: FlowHandle[];
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: "default" | "conditional" | "navigation" | "sequential";
  animated?: boolean;
  style?: React.CSSProperties;
  data?: {
    condition?: string;
    label?: string;
    isDefault?: boolean;
    isSequential?: boolean;
    isPageEntry?: boolean;
  };
}

export interface FlowHandle {
  id: string;
  type: "source" | "target";
  position: "top" | "bottom" | "left" | "right";
  style?: React.CSSProperties;
  data?: {
    label?: string;
    connectionType?: string;
  };
}

export interface FlowNodeDefinition {
  type: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  category: "form" | "logic" | "action" | "container";
  defaultData: Partial<NodeData | BlockData>;
  connectionPoints?: {
    inputs: Array<{
      id: string;
      label: string;
      type: string;
      position: "top" | "bottom" | "left" | "right";
    }>;
    outputs: Array<{
      id: string;
      label: string;
      type: string;
      position: "top" | "bottom" | "left" | "right";
    }>;
  };
}

export interface FlowBuilderState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  mode: FlowMode;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  dragState: {
    isDragging: boolean;
    nodeType?: string;
    startPosition?: { x: number; y: number };
  };
  connectionState: {
    isConnecting: boolean;
    sourceNodeId?: string;
    sourceHandleId?: string;
  };
}