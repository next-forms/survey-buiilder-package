import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { Plus, X } from "lucide-react";
import { Button } from "../../../components/ui/button";

export const ButtonEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  selected,
}: EdgeProps) => {
  const { setEdges, getNodes, setNodes } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onInsertClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    const insertIndex = (data as any)?.insertIndex;
    if (typeof insertIndex === 'number') {
         window.dispatchEvent(new CustomEvent('flow-v3-add-block', {
            detail: { insertIndex }
         }));
    }
  };

  const onDeleteClick = (evt: React.MouseEvent) => {
      evt.stopPropagation();
      // Dispatch delete event with edge identification
      window.dispatchEvent(new CustomEvent('flow-v3-delete-edge', {
          detail: { id, source, target, rule: (data as any)?.rule }
      }));
  };

  const isExplicitRule = !!(data as any)?.rule;
  const showInsertButton = typeof (data as any)?.insertIndex === 'number';

  // Highlight style when selected
  const edgeStyle = {
    ...style,
    stroke: selected ? "#3b82f6" : style.stroke,
    strokeWidth: selected ? 3 : style.strokeWidth,
    zIndex: selected ? 100 : 0,
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        {/* Label / Delete Container */}
        {(label || isExplicitRule) && (
          <div
            style={{
              position: "absolute",
              // If insert button exists, shift up. If not, center on line.
              transform: showInsertButton
                ? `translate(-50%, -170%) translate(${labelX}px,${labelY}px)`
                : `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="nodrag nopan"
          >
            {label && (
              <div className={`px-2 py-1 border rounded text-[10px] font-medium whitespace-nowrap shadow-sm ${selected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                {label}
              </div>
            )}
            
            {isExplicitRule && (
                <button
                    className="h-4 w-4 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 flex items-center justify-center shadow-sm transition-colors"
                    onClick={onDeleteClick}
                    title="Delete Connection"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
          </div>
        )}
        
        {/* Insert Button Container */}
        {showInsertButton && (
            <div
            style={{
                position: "absolute",
                transform: (label || isExplicitRule)
                ? `translate(-50%, 30%) translate(${labelX}px,${labelY}px)` 
                : `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
                zIndex: 1000,
            }}
            className="nodrag nopan"
            >
            <Button
                variant="outline"
                size="icon"
                className={`h-6 w-6 rounded-full border shadow-sm p-0 z-10 transition-colors ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-blue-500 bg-white hover:bg-blue-50 hover:text-blue-600'}`}
                onClick={onInsertClick}
                title="Insert Block"
            >
                <Plus className="h-3.5 w-3.5 text-current" />
            </Button>
            </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};
