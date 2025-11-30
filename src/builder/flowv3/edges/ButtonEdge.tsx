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
  edgeIndex?: number; // Index of this edge among parallel edges from same source
  totalParallelEdges?: number; // Total number of edges from the same source
  isHighlighted?: boolean; // Whether this edge is connected to a selected node
  edgeType?: 'default' | 'start' | 'conditional' | 'sequential'; // Type for styling
}

// Edge colors that work in both light and dark modes
// Using CSS custom properties would be ideal but React Flow styles need inline values
const EDGE_COLORS = {
  light: {
    default: '#64748b',      // slate-500
    start: '#10b981',        // emerald-500
    conditional: '#0ea5e9',  // sky-500 (less harsh than blue-500)
    sequential: '#94a3b8',   // slate-400
    selected: '#6366f1',     // indigo-500
    highlighted: '#a855f7',  // purple-500
  },
  dark: {
    default: '#94a3b8',      // slate-400
    start: '#34d399',        // emerald-400
    conditional: '#38bdf8',  // sky-400
    sequential: '#64748b',   // slate-500
    selected: '#818cf8',     // indigo-400
    highlighted: '#c084fc',  // purple-400
  }
};

// Custom path generator for edges that need to route around nodes
// Creates a path that goes to the side, completely avoiding middle nodes
const getAvoidingPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  skippedNodes: number = 1,
  edgeIndex: number = 0,
  totalEdges: number = 1
): { path: string; labelX: number; labelY: number } => {
  // Calculate offset based on how many nodes we're skipping
  // More skipped nodes = route further out to avoid them all
  // Base offset covers half node width (~200-300px) plus margin
  const baseOffset = 280;
  const perNodeOffset = 40; // Additional offset per skipped node
  const parallelOffset = 50; // Offset between parallel edges

  // Calculate parallel edge offset (spread edges out)
  const parallelShift = totalEdges > 1
    ? (edgeIndex - (totalEdges - 1) / 2) * parallelOffset
    : 0;

  const sideOffset = baseOffset + (skippedNodes * perNodeOffset) + Math.abs(parallelShift);

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

  // Label position - on the vertical side portion, offset vertically for parallel edges
  const labelX = sideX + 15;
  const labelY = (sourceY + targetY) / 2 + (edgeIndex * 30); // Offset labels vertically

  return { path, labelX, labelY };
};

// Hook to detect dark mode
const useIsDarkMode = () => {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
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
  const isDarkMode = useIsDarkMode();

  // Determine if this edge skips over nodes and needs special routing
  const skippedNodeCount = edgeData?.skippedNodeCount ?? 0;
  const isSkipEdge = skippedNodeCount > 0;

  // Parallel edge info for offsetting overlapping edges
  const edgeIndex = edgeData?.edgeIndex ?? 0;
  const totalParallelEdges = edgeData?.totalParallelEdges ?? 1;

  const { edgePath, labelX, labelY } = useMemo(() => {
    if (isSkipEdge) {
      // Route around nodes for edges that skip over them
      const avoiding = getAvoidingPath(
        sourceX, sourceY, targetX, targetY,
        skippedNodeCount, edgeIndex, totalParallelEdges
      );
      return { edgePath: avoiding.path, labelX: avoiding.labelX, labelY: avoiding.labelY };
    }

    // For normal sequential edges, use smooth step path for cleaner routing
    // Apply offset for parallel edges sharing the same path
    const parallelOffset = totalParallelEdges > 1
      ? (edgeIndex - (totalParallelEdges - 1) / 2) * 30
      : 0;

    const [path, lx, ly] = getSmoothStepPath({
      sourceX: sourceX + parallelOffset,
      sourceY,
      sourcePosition,
      targetX: targetX + parallelOffset,
      targetY,
      targetPosition,
      borderRadius: 16,
    });

    // Offset label position for parallel edges
    const adjustedLabelY = ly + (edgeIndex * 25);

    return { edgePath: path, labelX: lx, labelY: adjustedLabelY };
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, isSkipEdge, skippedNodeCount, edgeIndex, totalParallelEdges]);

  // Memoize data extraction to avoid recalculating on every render
  const { isExplicitRule, hasRuleIndex, showInsertButton, insertIndex, ruleIndex } = useMemo(() => ({
    isExplicitRule: !!edgeData?.rule,
    hasRuleIndex: typeof edgeData?.ruleIndex === 'number',
    showInsertButton: typeof edgeData?.insertIndex === 'number',
    insertIndex: edgeData?.insertIndex,
    ruleIndex: edgeData?.ruleIndex,
  }), [edgeData?.rule, edgeData?.ruleIndex, edgeData?.insertIndex]);

  // Only show start/end + buttons when this is the only edge from source
  // This prevents confusion when multiple edges share the same origin point
  const showEndpointButtons = showInsertButton && totalParallelEdges <= 1;

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

  // Check if edge is highlighted (connected to selected node)
  const isHighlighted = edgeData?.isHighlighted ?? false;
  const edgeType = edgeData?.edgeType ?? 'default';

  // Get colors based on dark mode
  const colors = isDarkMode ? EDGE_COLORS.dark : EDGE_COLORS.light;

  // Determine base stroke color based on edge type
  const getBaseStrokeColor = () => {
    switch (edgeType) {
      case 'start': return colors.start;
      case 'conditional': return colors.conditional;
      case 'sequential': return colors.sequential;
      default: return colors.default;
    }
  };

  // Determine stroke width based on edge type
  const getBaseStrokeWidth = () => {
    switch (edgeType) {
      case 'conditional': return 2;
      case 'sequential': return 2;
      default: return 2;
    }
  };

  // Get stroke dash array for sequential edges
  const getStrokeDashArray = () => {
    return edgeType === 'sequential' ? '5,5' : undefined;
  };

  // Highlight style when selected or connected to selected node
  const edgeStyle = {
    ...style,
    stroke: selected ? colors.selected : isHighlighted ? colors.highlighted : getBaseStrokeColor(),
    strokeWidth: selected ? 5 : isHighlighted ? 3 : getBaseStrokeWidth(),
    strokeDasharray: getStrokeDashArray(),
    zIndex: selected ? 100 : isHighlighted ? 50 : 0,
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
              <div className={`px-2 py-1 border rounded text-[10px] font-medium whitespace-nowrap shadow-sm ${selected ? 'bg-primary/10 border-primary/30 text-primary dark:bg-primary/20 dark:border-primary/40' : isHighlighted ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                {label}
              </div>
            )}

            {/* Edit button for explicit rules */}
            {isExplicitRule && hasRuleIndex && (
              <button
                className="h-4 w-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:border-amber-500 dark:hover:text-amber-400 dark:hover:border-amber-400 flex items-center justify-center shadow-sm transition-colors"
                onClick={onEditClick}
                title="Edit Rule"
              >
                <Pencil className="h-2.5 w-2.5" />
              </button>
            )}

            {isExplicitRule && (
              <button
                className="h-4 w-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-400 flex items-center justify-center shadow-sm transition-colors"
                onClick={onDeleteClick}
                title="Delete Connection"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Insert Button Container - Center */}
        {showInsertButton && (
          <div
            style={{
              position: "absolute",
              transform: (label || isExplicitRule)
                ? `translate(-50%, 30%) translate(${labelX}px,${labelY}px)`
                : `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 5,
            }}
            className="nodrag nopan"
          >
            <Button
              variant="outline"
              size="icon"
              className={`h-6 w-6 rounded-full border shadow-sm p-0 z-10 transition-colors ${selected ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20' : isHighlighted ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'border-primary/60 bg-white dark:bg-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20'}`}
              onClick={onInsertClick}
              title="Insert Block"
            >
              <Plus className="h-3.5 w-3.5 text-current" />
            </Button>
          </div>
        )}

        {/* Insert Button - Near Source (appears on hover) */}
        {/* Only shown when this is the only edge from source to avoid ambiguity */}
        {showEndpointButtons && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY + 40}px)`,
              pointerEvents: "all",
              zIndex: 5,
            }}
            className="nodrag nopan group/start"
          >
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5 rounded-full border shadow-sm p-0 transition-all opacity-0 group-hover/start:opacity-100 hover:!opacity-100 border-emerald-500 dark:border-emerald-400 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-110"
              onClick={onInsertClick}
              title="Insert Block After Source"
            >
              <Plus className="h-3 w-3 text-current" />
            </Button>
          </div>
        )}

        {/* Insert Button - Near Target (appears on hover) */}
        {/* Only shown when this is the only edge from source to avoid ambiguity */}
        {showEndpointButtons && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX}px,${targetY - 40}px)`,
              pointerEvents: "all",
              zIndex: 5,
            }}
            className="nodrag nopan group/end"
          >
            <Button
              variant="outline"
              size="icon"
              className="h-5 w-5 rounded-full border shadow-sm p-0 transition-all opacity-0 group-hover/end:opacity-100 hover:!opacity-100 border-amber-500 dark:border-amber-400 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 hover:scale-110"
              onClick={onInsertClick}
              title="Insert Block Before Target"
            >
              <Plus className="h-3 w-3 text-current" />
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
  if (prevData?.isHighlighted !== nextData?.isHighlighted) return false;

  return true;
};

export const ButtonEdge = memo(ButtonEdgeInner, areEdgePropsEqual);
