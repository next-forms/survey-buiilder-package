import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useReactFlow, useViewport, type Node } from "@xyflow/react";
import type { FlowV2Node } from "../types";
import { estimateSmartNodeSize, SMART_LAYOUT_CONFIG } from "./useSmartLayout";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VisibilityState {
  /** Node IDs that are currently visible in the viewport */
  visibleNodeIds: Set<string>;
  /** Node IDs that are in the extended viewport (buffer zone) */
  nearbyNodeIds: Set<string>;
  /** Whether detail rendering should be enabled (based on zoom level) */
  shouldRenderDetails: boolean;
  /** Current viewport bounds in flow coordinates */
  viewportBounds: ViewportBounds;
}

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeVisibilityInfo {
  id: string;
  isVisible: boolean;
  isNearby: boolean;
  distanceToViewport: number;
}

// ============================================================================
// VIEWPORT UTILITIES
// ============================================================================

/**
 * Convert screen coordinates to flow coordinates
 */
function screenToFlowCoords(
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; zoom: number }
): { x: number; y: number } {
  return {
    x: (screenX - viewport.x) / viewport.zoom,
    y: (screenY - viewport.y) / viewport.zoom,
  };
}

/**
 * Get viewport bounds in flow coordinates
 */
function getViewportBounds(
  containerWidth: number,
  containerHeight: number,
  viewport: { x: number; y: number; zoom: number }
): ViewportBounds {
  const topLeft = screenToFlowCoords(0, 0, viewport);
  const bottomRight = screenToFlowCoords(containerWidth, containerHeight, viewport);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/**
 * Get extended viewport bounds (with buffer for pre-rendering)
 */
function getExtendedViewportBounds(
  bounds: ViewportBounds,
  buffer: number
): ViewportBounds {
  return {
    x: bounds.x - buffer,
    y: bounds.y - buffer,
    width: bounds.width + buffer * 2,
    height: bounds.height + buffer * 2,
  };
}

/**
 * Check if a node intersects with bounds
 */
function nodeIntersectsBounds(
  node: FlowV2Node,
  bounds: ViewportBounds
): boolean {
  const size =
    node.measured?.width && node.measured?.height
      ? { width: node.measured.width, height: node.measured.height }
      : estimateSmartNodeSize(node);

  const nodeRight = node.position.x + size.width;
  const nodeBottom = node.position.y + size.height;
  const boundsRight = bounds.x + bounds.width;
  const boundsBottom = bounds.y + bounds.height;

  return !(
    node.position.x > boundsRight ||
    nodeRight < bounds.x ||
    node.position.y > boundsBottom ||
    nodeBottom < bounds.y
  );
}

/**
 * Calculate distance from node to viewport center
 */
function distanceToViewportCenter(
  node: FlowV2Node,
  bounds: ViewportBounds
): number {
  const size =
    node.measured?.width && node.measured?.height
      ? { width: node.measured.width, height: node.measured.height }
      : estimateSmartNodeSize(node);

  const nodeCenterX = node.position.x + size.width / 2;
  const nodeCenterY = node.position.y + size.height / 2;
  const viewportCenterX = bounds.x + bounds.width / 2;
  const viewportCenterY = bounds.y + bounds.height / 2;

  return Math.sqrt(
    Math.pow(nodeCenterX - viewportCenterX, 2) +
      Math.pow(nodeCenterY - viewportCenterY, 2)
  );
}

// ============================================================================
// REACT HOOK: useNodeVisibility
// ============================================================================

export interface UseNodeVisibilityOptions {
  /** Buffer size around viewport for pre-rendering (in flow coordinates) */
  buffer?: number;
  /** Minimum zoom level for detailed rendering */
  detailZoomThreshold?: number;
  /** Debounce delay for visibility updates (ms) */
  debounceMs?: number;
  /** Container element for size calculations */
  containerRef?: React.RefObject<HTMLElement>;
}

export function useNodeVisibility(options: UseNodeVisibilityOptions = {}) {
  const {
    buffer = SMART_LAYOUT_CONFIG.viewport.buffer,
    detailZoomThreshold = SMART_LAYOUT_CONFIG.viewport.detailZoomThreshold,
    debounceMs = 50,
    containerRef,
  } = options;

  const { getNodes } = useReactFlow();
  const viewport = useViewport();
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visibilityState, setVisibilityState] = useState<VisibilityState>({
    visibleNodeIds: new Set(),
    nearbyNodeIds: new Set(),
    shouldRenderDetails: true,
    viewportBounds: { x: 0, y: 0, width: 1000, height: 800 },
  });

  /**
   * Update visibility state based on current viewport
   */
  const updateVisibility = useCallback(() => {
    const nodes = getNodes() as FlowV2Node[];
    if (nodes.length === 0) return;

    // Get container dimensions
    const container = containerRef?.current;
    const containerWidth = container?.clientWidth || window.innerWidth;
    const containerHeight = container?.clientHeight || window.innerHeight;

    // Calculate viewport bounds
    const viewportBounds = getViewportBounds(
      containerWidth,
      containerHeight,
      viewport
    );
    const extendedBounds = getExtendedViewportBounds(viewportBounds, buffer);

    // Determine visibility for each node
    const visibleNodeIds = new Set<string>();
    const nearbyNodeIds = new Set<string>();

    nodes.forEach((node) => {
      if (nodeIntersectsBounds(node, viewportBounds)) {
        visibleNodeIds.add(node.id);
      } else if (nodeIntersectsBounds(node, extendedBounds)) {
        nearbyNodeIds.add(node.id);
      }
    });

    // Determine if details should be rendered
    const shouldRenderDetails = viewport.zoom >= detailZoomThreshold;

    setVisibilityState({
      visibleNodeIds,
      nearbyNodeIds,
      shouldRenderDetails,
      viewportBounds,
    });
  }, [getNodes, viewport, buffer, detailZoomThreshold, containerRef]);

  /**
   * Debounced visibility update
   */
  const updateVisibilityDebounced = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateVisibility();
      updateTimeoutRef.current = null;
    }, debounceMs);
  }, [updateVisibility, debounceMs]);

  // Update visibility when viewport changes
  useEffect(() => {
    updateVisibilityDebounced();
  }, [viewport.x, viewport.y, viewport.zoom, updateVisibilityDebounced]);

  // Initial update
  useEffect(() => {
    updateVisibility();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Check if a specific node is visible
   */
  const isNodeVisible = useCallback(
    (nodeId: string): boolean => {
      return visibilityState.visibleNodeIds.has(nodeId);
    },
    [visibilityState.visibleNodeIds]
  );

  /**
   * Check if a specific node is nearby (in buffer zone)
   */
  const isNodeNearby = useCallback(
    (nodeId: string): boolean => {
      return visibilityState.nearbyNodeIds.has(nodeId);
    },
    [visibilityState.nearbyNodeIds]
  );

  /**
   * Get visibility info for all nodes
   */
  const getNodeVisibilityInfo = useCallback((): NodeVisibilityInfo[] => {
    const nodes = getNodes() as FlowV2Node[];

    return nodes.map((node) => ({
      id: node.id,
      isVisible: visibilityState.visibleNodeIds.has(node.id),
      isNearby: visibilityState.nearbyNodeIds.has(node.id),
      distanceToViewport: distanceToViewportCenter(
        node,
        visibilityState.viewportBounds
      ),
    }));
  }, [getNodes, visibilityState]);

  /**
   * Get nodes sorted by distance to viewport center
   */
  const getNodesByProximity = useCallback((): FlowV2Node[] => {
    const nodes = getNodes() as FlowV2Node[];

    return [...nodes].sort((a, b) => {
      const distA = distanceToViewportCenter(a, visibilityState.viewportBounds);
      const distB = distanceToViewportCenter(b, visibilityState.viewportBounds);
      return distA - distB;
    });
  }, [getNodes, visibilityState.viewportBounds]);

  return {
    ...visibilityState,
    isNodeVisible,
    isNodeNearby,
    getNodeVisibilityInfo,
    getNodesByProximity,
    updateVisibility,
    updateVisibilityDebounced,
  };
}

// ============================================================================
// REACT HOOK: useAutoFocus
// ============================================================================

export interface UseAutoFocusOptions {
  /** Duration of focus animation (ms) */
  animationDuration?: number;
  /** Padding around focused node(s) */
  padding?: number;
}

export function useAutoFocus(options: UseAutoFocusOptions = {}) {
  const {
    animationDuration = SMART_LAYOUT_CONFIG.animation.focusDuration,
    padding = 0.2,
  } = options;

  const { fitView, setCenter, getZoom, getNodes } = useReactFlow();

  /**
   * Focus on a specific node
   */
  const focusNode = useCallback(
    (nodeId: string, options?: { zoom?: number }) => {
      const nodes = getNodes();
      const node = nodes.find((n) => n.id === nodeId);

      if (!node) return;

      const size =
        node.measured?.width && node.measured?.height
          ? { width: node.measured.width, height: node.measured.height }
          : estimateSmartNodeSize(node as FlowV2Node);

      const centerX = node.position.x + size.width / 2;
      const centerY = node.position.y + size.height / 2;
      const targetZoom = options?.zoom || Math.max(getZoom(), 1);

      setCenter(centerX, centerY, {
        zoom: targetZoom,
        duration: animationDuration,
      });
    },
    [getNodes, setCenter, getZoom, animationDuration]
  );

  /**
   * Focus on multiple nodes (fit them all in view)
   */
  const focusNodes = useCallback(
    (nodeIds: string[]) => {
      if (nodeIds.length === 0) return;

      fitView({
        nodes: nodeIds.map((id) => ({ id })),
        padding,
        duration: animationDuration,
      });
    },
    [fitView, padding, animationDuration]
  );

  /**
   * Focus on the next node in the flow
   */
  const focusNextNode = useCallback(
    (currentNodeId: string) => {
      const nodes = getNodes() as FlowV2Node[];

      // Find block nodes sorted by index
      const blockNodes = nodes
        .filter((n) => n.type === "block")
        .sort((a, b) => {
          const indexA = (a.data as any).index || 0;
          const indexB = (b.data as any).index || 0;
          return indexA - indexB;
        });

      const currentIndex = blockNodes.findIndex((n) => n.id === currentNodeId);
      if (currentIndex === -1 || currentIndex >= blockNodes.length - 1) {
        // Focus submit if at end
        focusNode("submit");
      } else {
        focusNode(blockNodes[currentIndex + 1].id);
      }
    },
    [getNodes, focusNode]
  );

  /**
   * Focus on the previous node in the flow
   */
  const focusPreviousNode = useCallback(
    (currentNodeId: string) => {
      const nodes = getNodes() as FlowV2Node[];

      // Find block nodes sorted by index
      const blockNodes = nodes
        .filter((n) => n.type === "block")
        .sort((a, b) => {
          const indexA = (a.data as any).index || 0;
          const indexB = (b.data as any).index || 0;
          return indexA - indexB;
        });

      const currentIndex = blockNodes.findIndex((n) => n.id === currentNodeId);
      if (currentIndex <= 0) {
        // Focus start if at beginning
        focusNode("start");
      } else {
        focusNode(blockNodes[currentIndex - 1].id);
      }
    },
    [getNodes, focusNode]
  );

  /**
   * Fit all nodes in view
   */
  const fitAll = useCallback(() => {
    fitView({
      padding,
      duration: animationDuration,
    });
  }, [fitView, padding, animationDuration]);

  return {
    focusNode,
    focusNodes,
    focusNextNode,
    focusPreviousNode,
    fitAll,
  };
}

// ============================================================================
// INTERSECTION OBSERVER HOOK FOR INDIVIDUAL NODES
// ============================================================================

export interface UseNodeIntersectionOptions {
  /** Root element for intersection observer */
  root?: Element | null;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number | number[];
  /** Callback when visibility changes */
  onVisibilityChange?: (isVisible: boolean) => void;
}

export function useNodeIntersection(
  nodeRef: React.RefObject<HTMLElement>,
  options: UseNodeIntersectionOptions = {}
) {
  const {
    root = null,
    rootMargin = "100px",
    threshold = 0,
    onVisibilityChange,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);

  useEffect(() => {
    const element = nodeRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const newIsIntersecting = entry.isIntersecting;
          setIsIntersecting(newIsIntersecting);
          setIntersectionRatio(entry.intersectionRatio);

          if (onVisibilityChange) {
            onVisibilityChange(newIsIntersecting);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [nodeRef, root, rootMargin, threshold, onVisibilityChange]);

  return {
    isIntersecting,
    intersectionRatio,
  };
}
