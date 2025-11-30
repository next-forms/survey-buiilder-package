import React, { memo, useCallback, useMemo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { Plus, X, Pencil } from "lucide-react";
import { Button } from "../../../components/ui/button";

// Edge data interface for type safety
interface ButtonEdgeData {
  insertIndex?: number;
  targetBlockId?: string;
  sourceBlockId?: string;
  rule?: unknown;
  ruleIndex?: number;
  weight?: number;
  skippedNodeCount?: number; // Number of nodes this edge skips over
}

// Custom path generator for edges that need to route around nodes
// Creates a path that goes to the side, completely avoiding middle nodes
const getAvoidingPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  skippedNodes: number = 1
): { path: string; labelX: number; labelY: number } => {
  // Calculate offset based on how many nodes we're skipping
  // More skipped nodes = route further out to avoid them all
  // Base offset covers half node width (~200-300px) plus margin
  const baseOffset = 280;
  const perNodeOffset = 40; // Additional offset per skipped node
  const sideOffset = baseOffset + (skippedNodes * perNodeOffset);

  // Always go to the right side
  const sideX = Math.max(sourceX, targetX) + sideOffset;

  const r = 10; // corner radius

  // Create a clean rectangular path around the nodes
  // Path: down from source -> right -> down along side -> left -> up to target
  const path = [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${sourceY + r}`,
    `Q ${sourceX} ${sourceY + 2*r} ${sourceX + r} ${sourceY + 2*r}`,
    `L ${sideX - r} ${sourceY + 2*r}`,
    `Q ${sideX} ${sourceY + 2*r} ${sideX} ${sourceY + 3*r}`,
    `L ${sideX} ${targetY - 3*r}`,
    `Q ${sideX} ${targetY - 2*r} ${sideX - r} ${targetY - 2*r}`,
    `L ${targetX + r} ${targetY - 2*r}`,
    `Q ${targetX} ${targetY - 2*r} ${targetX} ${targetY - r}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');

  // Label position - on the vertical side portion, slightly to the right
  const labelX = sideX + 15;
  const labelY = (sourceY + targetY) / 2;

  return { path, labelX, labelY };
};

const ButtonEdgeInner = ({
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
  const edgeData = data as ButtonEdgeData | undefined;

  // Determine if this edge skips over nodes and needs special routing
  const skippedNodeCount = edgeData?.skippedNodeCount ?? 0;
  const isSkipEdge = skippedNodeCount > 0;

  const { edgePath, labelX, labelY } = useMemo(() => {
    if (isSkipEdge) {
      // Route around nodes for edges that skip over them
      const avoiding = getAvoidingPath(sourceX, sourceY, targetX, targetY, skippedNodeCount);
      return { edgePath: avoiding.path, labelX: avoiding.labelX, labelY: avoiding.labelY };
    }

    // For normal sequential edges, use smooth step path for cleaner routing
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    });
    return { edgePath: path, labelX: lx, labelY: ly };
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, isSkipEdge, skippedNodeCount]);

  // Memoize data extraction to avoid recalculating on every render
  const { isExplicitRule, hasRuleIndex, showInsertButton, insertIndex, ruleIndex } = useMemo(() => ({
    isExplicitRule: !!edgeData?.rule,
    hasRuleIndex: typeof edgeData?.ruleIndex === 'number',
    showInsertButton: typeof edgeData?.insertIndex === 'number',
    insertIndex: edgeData?.insertIndex,
    ruleIndex: edgeData?.ruleIndex,
  }), [edgeData?.rule, edgeData?.ruleIndex, edgeData?.insertIndex]);

  // Stable callback references
  const onInsertClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (typeof insertIndex === 'number') {
      window.dispatchEvent(new CustomEvent('flow-v3-add-block', {
        detail: {
          insertIndex,
          targetBlockId: edgeData?.targetBlockId,
          sourceBlockId: edgeData?.sourceBlockId,
          rule: edgeData?.rule
        }
      }));
    }
  }, [insertIndex, edgeData?.targetBlockId, edgeData?.sourceBlockId, edgeData?.rule]);

  const onDeleteClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    window.dispatchEvent(new CustomEvent('flow-v3-delete-edge', {
      detail: { id, source, target, rule: edgeData?.rule }
    }));
  }, [id, source, target, edgeData?.rule]);

  const onEditClick = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (typeof ruleIndex === 'number') {
      window.dispatchEvent(new CustomEvent('flow-v3-edit-edge', {
        detail: { source, ruleIndex }
      }));
    }
  }, [source, ruleIndex]);

  // Highlight style when selected
  const edgeStyle = {
    ...style,
    stroke: selected ? "#3b82f6" : style.stroke,
    strokeWidth: selected ? 5 : style.strokeWidth,
    zIndex: selected ? 100 : 0,
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
        interactionWidth={25}
      />

      <EdgeLabelRenderer>
        {/* Label / Edit / Delete Container - Always visible when there's a label or explicit rule */}
        {(label || isExplicitRule) && (
          <div
            style={{
              position: "absolute",
              // If insert button exists, shift up. If not, center on line.
              transform: showInsertButton
                ? `translate(-50%, -170%) translate(${labelX}px,${labelY}px)`
                : `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 5, // Below nodes (z-index 10) so labels don't overlap node content
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

            {/* Edit button for explicit rules */}
            {isExplicitRule && hasRuleIndex && (
              <button
                className="h-4 w-4 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-500 flex items-center justify-center shadow-sm transition-colors"
                onClick={onEditClick}
                title="Edit Rule"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
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
              zIndex: 5, // Below nodes (z-index 10) so buttons don't overlap node content
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

// Custom areEqual function for edge memoization
// Edges re-render frequently due to position changes, so we check only meaningful props
const areEdgePropsEqual = (prevProps: EdgeProps, nextProps: EdgeProps): boolean => {
  // Check selection state
  if (prevProps.selected !== nextProps.selected) return false;

  // Check label
  if (prevProps.label !== nextProps.label) return false;

  // Check critical position values (significant changes only)
  // Allow small position changes without re-render
  const posTolerance = 1;
  if (Math.abs(prevProps.sourceX - nextProps.sourceX) > posTolerance) return false;
  if (Math.abs(prevProps.sourceY - nextProps.sourceY) > posTolerance) return false;
  if (Math.abs(prevProps.targetX - nextProps.targetX) > posTolerance) return false;
  if (Math.abs(prevProps.targetY - nextProps.targetY) > posTolerance) return false;

  // Check data object (shallow compare important fields)
  const prevData = prevProps.data as ButtonEdgeData | undefined;
  const nextData = nextProps.data as ButtonEdgeData | undefined;

  if (prevData?.insertIndex !== nextData?.insertIndex) return false;
  if (prevData?.ruleIndex !== nextData?.ruleIndex) return false;
  if (prevData?.rule !== nextData?.rule) return false;

  return true;
};

export const ButtonEdge = memo(ButtonEdgeInner, areEdgePropsEqual);
