import React, { useEffect, useRef, useMemo, useCallback, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { X, GripVertical } from "lucide-react";
import type { ConditionalEdgeData } from "../types";
import { useEdgeLabelContextOptional, useNodeBoundsContextOptional } from "../context";
import type { NodeBounds } from "../context";

type SmartEdgeType = Edge<ConditionalEdgeData, "smart">;

// ============================================================================
// DYNAMIC EDGE ROUTING
// Automatically determines the best connection side based on node positions
// ============================================================================

/**
 * Determine the best connection points based on relative node positions
 * Returns the optimal source and target coordinates
 */
function calculateDynamicConnectionPoints(
  sourceBounds: NodeBounds | undefined,
  targetBounds: NodeBounds | undefined,
  fallbackSourceX: number,
  fallbackSourceY: number,
  fallbackTargetX: number,
  fallbackTargetY: number
): {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceOnRight: boolean;
  targetOnLeft: boolean;
} {
  // If we don't have bounds, use the fallback positions
  if (!sourceBounds || !targetBounds) {
    return {
      sourceX: fallbackSourceX,
      sourceY: fallbackSourceY,
      targetX: fallbackTargetX,
      targetY: fallbackTargetY,
      sourceOnRight: true,
      targetOnLeft: true,
    };
  }

  // Calculate centers
  const sourceCenterX = sourceBounds.x + sourceBounds.width / 2;
  const sourceCenterY = sourceBounds.y + sourceBounds.height / 2;
  const targetCenterX = targetBounds.x + targetBounds.width / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;

  // Determine relative positions
  const targetIsRight = targetCenterX > sourceCenterX;

  // Calculate horizontal and vertical distances
  const horizontalDistance = Math.abs(targetCenterX - sourceCenterX);
  const verticalDistance = Math.abs(targetCenterY - sourceCenterY);

  // Determine connection sides based on relative position
  // Prefer horizontal connections for horizontal layout
  let sourceX: number;
  let sourceY: number;
  let targetX: number;
  let targetY: number;
  let sourceOnRight: boolean;
  let targetOnLeft: boolean;

  if (horizontalDistance > verticalDistance * 0.3) {
    // Primarily horizontal - connect from sides
    if (targetIsRight) {
      // Source on right, target on left
      sourceX = sourceBounds.x + sourceBounds.width;
      sourceY = sourceCenterY;
      targetX = targetBounds.x;
      targetY = targetCenterY;
      sourceOnRight = true;
      targetOnLeft = true;
    } else {
      // Source on left, target on right
      sourceX = sourceBounds.x;
      sourceY = sourceCenterY;
      targetX = targetBounds.x + targetBounds.width;
      targetY = targetCenterY;
      sourceOnRight = false;
      targetOnLeft = false;
    }
  } else {
    // Primarily vertical - connect from top/bottom but still prefer sides for cleaner look
    if (targetIsRight) {
      sourceX = sourceBounds.x + sourceBounds.width;
      sourceY = sourceCenterY;
      targetX = targetBounds.x;
      targetY = targetCenterY;
      sourceOnRight = true;
      targetOnLeft = true;
    } else {
      sourceX = sourceBounds.x;
      sourceY = sourceCenterY;
      targetX = targetBounds.x + targetBounds.width;
      targetY = targetCenterY;
      sourceOnRight = false;
      targetOnLeft = false;
    }
  }

  return { sourceX, sourceY, targetX, targetY, sourceOnRight, targetOnLeft };
}

/**
 * Find all nodes that would be intersected by a direct path
 */
function findIntersectingNodes(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  allNodes: NodeBounds[],
  sourceId: string,
  targetId: string,
  padding: number = 20
): NodeBounds[] {
  const minX = Math.min(sourceX, targetX);
  const maxX = Math.max(sourceX, targetX);
  const minY = Math.min(sourceY, targetY);
  const maxY = Math.max(sourceY, targetY);

  return allNodes.filter((node) => {
    if (node.id === sourceId || node.id === targetId) return false;

    const nodeLeft = node.x - padding;
    const nodeRight = node.x + node.width + padding;
    const nodeTop = node.y - padding;
    const nodeBottom = node.y + node.height + padding;

    // Check if node is in the path's bounding box
    const horizontalOverlap = !(maxX < nodeLeft || minX > nodeRight);
    const verticalOverlap = !(maxY < nodeTop || minY > nodeBottom);

    return horizontalOverlap && verticalOverlap;
  });
}

/**
 * Calculate the best Y position to route around nodes
 */
function calculateAvoidanceY(
  sourceY: number,
  targetY: number,
  intersectingNodes: NodeBounds[],
  padding: number = 30
): { routeAbove: boolean; avoidanceY: number } {
  if (intersectingNodes.length === 0) {
    return { routeAbove: false, avoidanceY: (sourceY + targetY) / 2 };
  }

  let topMost = Infinity;
  let bottomMost = -Infinity;

  intersectingNodes.forEach((node) => {
    topMost = Math.min(topMost, node.y - padding);
    bottomMost = Math.max(bottomMost, node.y + node.height + padding);
  });

  const avgY = (sourceY + targetY) / 2;
  const distanceToTop = Math.abs(avgY - topMost);
  const distanceToBottom = Math.abs(avgY - bottomMost);

  if (distanceToTop <= distanceToBottom) {
    return { routeAbove: true, avoidanceY: topMost - padding };
  } else {
    return { routeAbove: false, avoidanceY: bottomMost + padding };
  }
}

/**
 * Create an orthogonal path that avoids all nodes
 */
function createSmartPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  allNodes: NodeBounds[],
  sourceId: string,
  targetId: string,
  sourceOnRight: boolean,
  targetOnLeft: boolean,
  parallelIndex: number = 0,
  parallelTotal: number = 1
): { path: string; labelX: number; labelY: number } {
  const padding = 25;
  const cornerRadius = 10;

  // Calculate parallel edge offset
  let parallelOffset = 0;
  if (parallelTotal > 1) {
    const spreadFactor = 35;
    const centerIndex = (parallelTotal - 1) / 2;
    parallelOffset = (parallelIndex - centerIndex) * spreadFactor;
  }

  // Find nodes that would be in the way
  const intersectingNodes = findIntersectingNodes(
    sourceX,
    sourceY,
    targetX,
    targetY,
    allNodes,
    sourceId,
    targetId,
    padding
  );

  // Adjust Y positions for parallel edges
  const adjSourceY = sourceY + parallelOffset * 0.5;
  const adjTargetY = targetY + parallelOffset * 0.5;

  // Simple case: no intersecting nodes
  if (intersectingNodes.length === 0) {
    return createDirectPath(
      sourceX,
      adjSourceY,
      targetX,
      adjTargetY,
      sourceOnRight,
      targetOnLeft,
      cornerRadius
    );
  }

  // Complex case: need to route around nodes
  const { routeAbove, avoidanceY } = calculateAvoidanceY(
    sourceY,
    targetY,
    intersectingNodes,
    padding
  );

  const finalAvoidanceY = avoidanceY + parallelOffset * (routeAbove ? -1 : 1);

  return createAvoidancePath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    finalAvoidanceY,
    sourceOnRight,
    targetOnLeft,
    cornerRadius
  );
}

/**
 * Create a direct path between two points (no obstacles)
 */
function createDirectPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceOnRight: boolean,
  targetOnLeft: boolean,
  radius: number
): { path: string; labelX: number; labelY: number } {
  const midX = (sourceX + targetX) / 2;

  // If nearly same Y, draw mostly horizontal
  if (Math.abs(sourceY - targetY) < 5) {
    return {
      path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
      labelX: midX,
      labelY: sourceY - 12,
    };
  }

  const r = Math.min(radius, Math.abs(targetY - sourceY) / 2, Math.abs(midX - sourceX) / 2);
  const goingDown = targetY > sourceY;

  // Determine the direction of the path based on connection sides
  if (sourceOnRight && targetOnLeft) {
    // Normal left-to-right flow
    const path = `
      M ${sourceX},${sourceY}
      L ${midX - r},${sourceY}
      Q ${midX},${sourceY} ${midX},${sourceY + (goingDown ? r : -r)}
      L ${midX},${targetY + (goingDown ? -r : r)}
      Q ${midX},${targetY} ${midX + r},${targetY}
      L ${targetX},${targetY}
    `.replace(/\s+/g, ' ').trim();

    return { path, labelX: midX, labelY: (sourceY + targetY) / 2 };
  } else {
    // Reversed flow (right-to-left)
    const path = `
      M ${sourceX},${sourceY}
      L ${midX + r},${sourceY}
      Q ${midX},${sourceY} ${midX},${sourceY + (goingDown ? r : -r)}
      L ${midX},${targetY + (goingDown ? -r : r)}
      Q ${midX},${targetY} ${midX - r},${targetY}
      L ${targetX},${targetY}
    `.replace(/\s+/g, ' ').trim();

    return { path, labelX: midX, labelY: (sourceY + targetY) / 2 };
  }
}

/**
 * Create a path that avoids obstacles by going above or below
 */
function createAvoidancePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  avoidanceY: number,
  sourceOnRight: boolean,
  targetOnLeft: boolean,
  radius: number
): { path: string; labelX: number; labelY: number } {
  const r = Math.min(radius, 12);

  // Determine exit and entry points based on connection direction
  const exitOffset = sourceOnRight ? 40 : -40;
  const entryOffset = targetOnLeft ? -40 : 40;

  const exitX = sourceX + exitOffset;
  const entryX = targetX + entryOffset;

  const sourceGoingUp = avoidanceY < sourceY;
  const targetGoingUp = avoidanceY > targetY;

  let path: string;

  if (sourceOnRight && targetOnLeft) {
    // Normal left-to-right with avoidance
    path = `
      M ${sourceX},${sourceY}
      L ${exitX - r},${sourceY}
      Q ${exitX},${sourceY} ${exitX},${sourceY + (sourceGoingUp ? -r : r)}
      L ${exitX},${avoidanceY + (sourceGoingUp ? r : -r)}
      Q ${exitX},${avoidanceY} ${exitX + r},${avoidanceY}
      L ${entryX - r},${avoidanceY}
      Q ${entryX},${avoidanceY} ${entryX},${avoidanceY + (targetGoingUp ? r : -r)}
      L ${entryX},${targetY + (targetGoingUp ? -r : r)}
      Q ${entryX},${targetY} ${entryX + r},${targetY}
      L ${targetX},${targetY}
    `.replace(/\s+/g, ' ').trim();
  } else {
    // Reversed flow with avoidance
    path = `
      M ${sourceX},${sourceY}
      L ${exitX + r},${sourceY}
      Q ${exitX},${sourceY} ${exitX},${sourceY + (sourceGoingUp ? -r : r)}
      L ${exitX},${avoidanceY + (sourceGoingUp ? r : -r)}
      Q ${exitX},${avoidanceY} ${exitX - r},${avoidanceY}
      L ${entryX + r},${avoidanceY}
      Q ${entryX},${avoidanceY} ${entryX},${avoidanceY + (targetGoingUp ? r : -r)}
      L ${entryX},${targetY + (targetGoingUp ? -r : r)}
      Q ${entryX},${targetY} ${entryX - r},${targetY}
      L ${targetX},${targetY}
    `.replace(/\s+/g, ' ').trim();
  }

  return {
    path,
    labelX: (exitX + entryX) / 2,
    labelY: avoidanceY - 12,
  };
}

// Estimate label width based on text length
function estimateLabelWidth(text: string): number {
  return Math.min(Math.max(text.length * 7 + 16, 50), 150);
}

// ============================================================================
// SMART EDGE COMPONENT
// ============================================================================

export const SmartEdge: React.FC<EdgeProps<SmartEdgeType>> = ({
  id,
  source,
  target,
  sourceX: fallbackSourceX,
  sourceY: fallbackSourceY,
  targetX: fallbackTargetX,
  targetY: fallbackTargetY,
  data,
  selected,
  markerEnd,
}) => {
  const labelContext = useEdgeLabelContextOptional();
  const nodeBoundsContext = useNodeBoundsContextOptional();
  const labelRef = useRef<HTMLDivElement>(null);

  const edgeData = data as
    | (ConditionalEdgeData & { parallelIndex?: number; parallelTotal?: number })
    | undefined;
  const isConditional = edgeData && !edgeData.isSequential && !edgeData.isDefault;
  const isDefault = edgeData?.isDefault;
  const isSequential = edgeData?.isSequential && !isConditional;
  const condition = edgeData?.condition || edgeData?.label;

  // Truncate condition for display
  const displayLabel = condition
    ? condition.length > 30
      ? condition.substring(0, 27) + "..."
      : condition
    : "";

  // Only show label for conditional edges
  const shouldShowLabel = displayLabel && isConditional;

  // Get node bounds for dynamic connection points
  const sourceBounds = useMemo(
    () => nodeBoundsContext?.getNodeBounds(source),
    [nodeBoundsContext, source]
  );
  const targetBounds = useMemo(
    () => nodeBoundsContext?.getNodeBounds(target),
    [nodeBoundsContext, target]
  );
  const allNodeBounds = useMemo(
    () => nodeBoundsContext?.getAllNodeBounds() || [],
    [nodeBoundsContext]
  );

  // Calculate dynamic connection points based on node positions
  const connectionPoints = useMemo(() => {
    return calculateDynamicConnectionPoints(
      sourceBounds,
      targetBounds,
      fallbackSourceX,
      fallbackSourceY,
      fallbackTargetX,
      fallbackTargetY
    );
  }, [sourceBounds, targetBounds, fallbackSourceX, fallbackSourceY, fallbackTargetX, fallbackTargetY]);

  // Calculate path that avoids nodes
  const { edgePath, labelPosition } = useMemo(() => {
    const { sourceX, sourceY, targetX, targetY, sourceOnRight, targetOnLeft } = connectionPoints;

    const { path, labelX, labelY } = createSmartPath(
      sourceX,
      sourceY,
      targetX,
      targetY,
      allNodeBounds,
      source,
      target,
      sourceOnRight,
      targetOnLeft,
      edgeData?.parallelIndex || 0,
      edgeData?.parallelTotal || 1
    );

    return {
      edgePath: path,
      labelPosition: { x: labelX, y: labelY },
    };
  }, [connectionPoints, allNodeBounds, source, target, edgeData?.parallelIndex, edgeData?.parallelTotal]);

  // Calculate label offset for collision avoidance
  const labelOffset = useMemo(() => {
    if (!shouldShowLabel || !labelContext) {
      return { offsetX: 0, offsetY: 0 };
    }
    const estimatedWidth = estimateLabelWidth(displayLabel);
    return labelContext.getOffset(
      id,
      labelPosition.x,
      labelPosition.y,
      estimatedWidth
    );
  }, [id, labelPosition, displayLabel, shouldShowLabel, labelContext]);

  // Register/update label position
  useEffect(() => {
    if (!shouldShowLabel || !labelContext) return;

    const finalX = labelPosition.x + labelOffset.offsetX;
    const finalY = labelPosition.y + labelOffset.offsetY;
    const width = labelRef.current?.offsetWidth || estimateLabelWidth(displayLabel);
    const height = labelRef.current?.offsetHeight || 22;

    labelContext.registerLabel(id, finalX, finalY, width, height);

    return () => {
      labelContext.unregisterLabel(id);
    };
  }, [id, labelPosition, labelOffset, displayLabel, shouldShowLabel, labelContext]);

  const finalLabelX = labelPosition.x + labelOffset.offsetX;
  const finalLabelY = labelPosition.y + labelOffset.offsetY;

  // Determine edge colors based on type
  const edgeColor = isConditional
    ? "#f59e0b"
    : isDefault
    ? "#94a3b8"
    : "#3b82f6";

  // Determine stroke style
  const strokeDasharray = isSequential
    ? "none"
    : isDefault
    ? "6,4"
    : "none";

  const strokeWidth = selected && !isSequential ? 5 : isConditional ? 2.5 : 2;

  // Larger interaction width for conditional edges to make them easier to select
  const interactionWidthValue = isConditional ? 30 : 20;

  // State to track hover for showing delete button and edge hover
  const [isHovered, setIsHovered] = useState(false);
  const [isEdgeHovered, setIsEdgeHovered] = useState(false);

  // Calculate endpoint positions for grab handles
  const { sourceX, sourceY, targetX, targetY } = connectionPoints;

  // Handle delete navigation rule
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Dispatch custom event to delete the navigation rule
    // The event includes source node id and target to identify which rule to delete
    window.dispatchEvent(new CustomEvent('flow-v2-delete-navigation-rule', {
      detail: {
        sourceNodeId: source,
        targetNodeId: target,
        edgeId: id,
        condition: condition
      }
    }));
  }, [source, target, id, condition]);

  return (
    <>
      {/* Invisible wider path for better edge selection on conditional edges */}
      {isConditional && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={40}
          style={{ cursor: "grab", pointerEvents: "stroke" }}
          onMouseEnter={() => setIsEdgeHovered(true)}
          onMouseLeave={() => setIsEdgeHovered(false)}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isEdgeHovered && isConditional ? "#d97706" : edgeColor,
          strokeWidth: isEdgeHovered && isConditional ? strokeWidth + 1 : strokeWidth,
          strokeDasharray,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          transition: "stroke-width 0.15s ease, stroke 0.15s ease",
          cursor: isConditional ? "grab" : "pointer",
        }}
        className={selected ? "react-flow__edge-selected" : ""}
        interactionWidth={interactionWidthValue}
      />
      {/* Endpoint grab indicator for conditional edges */}
      {isConditional && (isEdgeHovered || selected) && (
        <EdgeLabelRenderer>
          {/* Source endpoint grab handle */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY}px)`,
              pointerEvents: "none",
              zIndex: 1001,
            }}
            className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center animate-pulse"
          >
            <GripVertical className="w-2.5 h-2.5 text-white" />
          </div>
          {/* Target endpoint grab handle */}
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`,
              pointerEvents: "none",
              zIndex: 1001,
            }}
            className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center animate-pulse"
          >
            <GripVertical className="w-2.5 h-2.5 text-white" />
          </div>
        </EdgeLabelRenderer>
      )}
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            ref={labelRef}
            style={{
              position: "absolute",
              transform: `translate(-50%, -10%) translate(${finalLabelX}px,${finalLabelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className={`
              group flex items-center gap-1
              px-2.5 py-1 rounded-full text-[11px] font-medium
              shadow-md border backdrop-blur-sm
              bg-amber-50/95 text-amber-800 border-amber-300/80
              ${selected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
              cursor-pointer hover:shadow-lg hover:bg-amber-100/95
              transition-all duration-150 ease-out
            `}
            title={condition || ""}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="max-w-[130px] truncate whitespace-nowrap">
              {displayLabel}
            </span>
            {/* Delete button - shows on hover */}
            <button
              onClick={handleDelete}
              className={`
                flex-shrink-0 w-4 h-4 rounded-full
                flex items-center justify-center
                bg-red-500 hover:bg-red-600 text-white
                transition-all duration-150
                ${isHovered || selected ? "opacity-100 scale-100" : "opacity-0 scale-75"}
              `}
              title="Delete navigation rule"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

SmartEdge.displayName = "SmartEdge";
