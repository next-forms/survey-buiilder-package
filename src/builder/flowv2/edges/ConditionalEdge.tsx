import React, { useEffect, useRef, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import type { ConditionalEdgeData } from "../types";
import { useEdgeLabelContextOptional } from "../context";

type ConditionalEdgeType = Edge<ConditionalEdgeData, "conditional">;

// Estimate label width based on text length
function estimateLabelWidth(text: string): number {
  // Approximate: ~7px per character + padding
  return Math.min(Math.max(text.length * 7 + 16, 50), 150);
}

export const ConditionalEdge: React.FC<EdgeProps<ConditionalEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}) => {
  const labelContext = useEdgeLabelContextOptional();
  const labelRef = useRef<HTMLDivElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const edgeData = data as ConditionalEdgeData & { parallelIndex?: number; parallelTotal?: number } | undefined;
  const isConditional = edgeData && !edgeData.isSequential && !edgeData.isDefault;
  const condition = edgeData?.condition || edgeData?.label;

  // Truncate condition for display
  const displayLabel = condition
    ? condition.length > 30
      ? condition.substring(0, 27) + "..."
      : condition
    : "";

  // Only show label for conditional edges (not default/sequential)
  const shouldShowLabel = displayLabel && isConditional;

  // Calculate label offset for collision avoidance
  const labelOffset = useMemo(() => {
    if (!shouldShowLabel || !labelContext) {
      return { offsetX: 0, offsetY: 0 };
    }
    const estimatedWidth = estimateLabelWidth(displayLabel);
    return labelContext.getOffset(id, labelX, labelY, estimatedWidth);
  }, [id, labelX, labelY, displayLabel, shouldShowLabel, labelContext]);

  // Register/update label position for collision detection
  useEffect(() => {
    if (!shouldShowLabel || !labelContext) return;

    const finalX = labelX + labelOffset.offsetX;
    const finalY = labelY + labelOffset.offsetY;
    const width = labelRef.current?.offsetWidth || estimateLabelWidth(displayLabel);
    const height = labelRef.current?.offsetHeight || 22;

    labelContext.registerLabel(id, finalX, finalY, width, height);

    return () => {
      labelContext.unregisterLabel(id);
    };
  }, [id, labelX, labelY, labelOffset, displayLabel, shouldShowLabel, labelContext]);

  const finalLabelX = labelX + labelOffset.offsetX;
  const finalLabelY = labelY + labelOffset.offsetY;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isConditional ? "#f59e0b" : edgeData?.isDefault ? "#94a3b8" : "#3b82f6",
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: edgeData?.isSequential && !isConditional ? "none" : "5,5",
        }}
      />
      {shouldShowLabel && (
        <EdgeLabelRenderer>
          <div
            ref={labelRef}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className={`
              px-2 py-0.5 rounded-full text-[10px] font-medium
              shadow-sm border backdrop-blur-sm
              bg-amber-50/90 text-amber-800 border-amber-200
              ${selected ? "ring-1 ring-blue-400" : ""}
              cursor-pointer hover:shadow-md transition-all
              max-w-[150px] truncate whitespace-nowrap
            `}
            title={condition || ""}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
