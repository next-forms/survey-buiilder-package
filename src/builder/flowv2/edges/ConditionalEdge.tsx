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

  const edgeData = data as ConditionalEdgeData | undefined;
  const isConditional = edgeData && !edgeData.isSequential && !edgeData.isDefault;
  const condition = edgeData?.condition || edgeData?.label;

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
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className={`
              px-2 py-1 rounded-md text-xs font-medium
              shadow-md border
              ${isConditional
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
              }
              ${selected ? "ring-2 ring-blue-400" : ""}
              cursor-pointer hover:shadow-lg transition-shadow
              max-w-[200px] truncate
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
