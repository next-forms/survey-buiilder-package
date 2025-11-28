import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import type { ConditionalEdgeData } from "../types";

type ConditionalEdgeType = Edge<ConditionalEdgeData, "conditional">;

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

  // Calculate offset for parallel edges to avoid label overlap
  let offsetY = 0;
  if (edgeData?.parallelTotal && edgeData.parallelTotal > 1) {
    const index = edgeData.parallelIndex || 0;
    const total = edgeData.parallelTotal;
    // Center the stack of labels
    // e.g. 2 items: -10, +10
    // e.g. 3 items: -20, 0, +20
    offsetY = (index - (total - 1) / 2) * 24;
  }

  // Truncate condition for display
  const displayLabel = condition
    ? condition.length > 30
      ? condition.substring(0, 27) + "..."
      : condition
    : edgeData?.isDefault
    ? "default"
    : "";

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
      {displayLabel && (
        <EdgeLabelRenderer>
          {edgeData?.isDefault ? (
            <></>
            // <div
            //   style={{
            //     position: "absolute",
            //     transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + offsetY}px)`,
            //     pointerEvents: "all",
            //     zIndex: 1000,
            //   }}
            //   className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm cursor-help hover:bg-slate-600 transition-colors"
            //   title="Default flow"
            // />
          ) : (
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + offsetY}px)`,
                pointerEvents: "all",
                zIndex: 1000,
              }}
              className={`
                px-2 py-0.5 rounded-full text-[10px] font-medium
                shadow-sm border backdrop-blur-sm
                ${
                  isConditional
                    ? "bg-amber-50/90 text-amber-800 border-amber-200"
                    : "bg-slate-50/90 text-slate-600 border-slate-200"
                }
                ${edgeData?.isDefault ? "" : ""}
                ${selected ? "ring-1 ring-blue-400" : ""}
                cursor-pointer hover:shadow-md transition-all
                max-w-[150px] truncate
              `}
              title={condition || ""}
            >
              {displayLabel}
            </div>
          )}
        </EdgeLabelRenderer>
      )}
    </>
  );
};
