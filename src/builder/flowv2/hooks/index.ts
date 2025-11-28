export { useEdgeLabelPositions, calculateLabelOffset } from "./useEdgeLabelPositions";
export type { EdgeLabelPositionManager } from "./useEdgeLabelPositions";

// Smart layout hooks
export {
  useSmartLayout,
  computeSmartDagreLayout,
  computeFullSmartLayout,
  resolveOverlapsSmart,
  hasOverlapsSmart,
  analyzeFlowStructure,
  calculateAdaptiveSpacing,
  estimateSmartNodeSize,
  clusterNodes,
  SMART_LAYOUT_CONFIG,
} from "./useSmartLayout";
export type {
  LayoutMetrics,
  SmartLayoutOptions,
  NodeCluster,
} from "./useSmartLayout";

// Node visibility and focus hooks
export {
  useNodeVisibility,
  useAutoFocus,
  useNodeIntersection,
} from "./useNodeVisibility";
export type {
  VisibilityState,
  ViewportBounds,
  NodeVisibilityInfo,
  UseNodeVisibilityOptions,
  UseAutoFocusOptions,
  UseNodeIntersectionOptions,
} from "./useNodeVisibility";
