import React, { memo, useCallback, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node, useReactFlow, useUpdateNodeInternals } from "@xyflow/react";
import type { BlockNodeData } from "../types";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { BlockData } from "../../../types";
import {
  GripVertical,
  Settings,
  Trash2,
  ArrowRight,
  CircleDot,
  ChevronDown,
  ChevronRight
} from "lucide-react";

// Output handle positions for horizontal layout (distributed vertically on the right side)
const OUTPUT_HANDLE_POSITIONS = [20, 35, 50, 65, 80]; // percentages from top

type BlockNodeType = Node<BlockNodeData, "block">;

export const BlockNode = memo(({
  id,
  data,
  selected,
}: NodeProps<BlockNodeType>) => {
  const { state, updateNode } = useSurveyBuilder();
  const { deleteElements } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { block, index } = data;

  // Update node internals when collapse state changes (handle positions change)
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, isCollapsed, updateNodeInternals]);

  // Get block definition
  const blockDefinition = state.definitions.blocks[block.type];
  const hasNavigationRules = (block.navigationRules?.length || 0) > 0;

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent node selection
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleConfigure = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection
    // Dispatch custom event for parent to handle
    window.dispatchEvent(new CustomEvent('flow-v2-configure-node', { 
      detail: { nodeId: id } 
    }));
  }, [id]);

  const toggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed((prev) => !prev);
  }, []);

  // Handle updates from the rendered item
  const handleUpdate = useCallback((updatedBlockData: BlockData) => {
    if (!state.rootNode) return;

    // Find the block in rootNode and update it
    // Since we don't have the exact path, we iterate to find by UUID
    const updatedItems = (state.rootNode.items || []).map((item) =>
      (item as BlockData).uuid === block.uuid ? updatedBlockData : item
    );

    updateNode(state.rootNode.uuid!, {
      ...state.rootNode,
      items: updatedItems,
    });
  }, [state.rootNode, block.uuid, updateNode]);

  return (
    <div
      ref={nodeRef}
      className={`
        relative group
        bg-white dark:bg-slate-800
        rounded-xl
        shadow-md hover:shadow-lg
        border-2 transition-all duration-200
        ${isCollapsed ? "w-[280px]" : "min-w-[320px] max-w-[450px]"}
        ${selected
          ? "border-blue-500 shadow-blue-500/20"
          : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
        }
      `}
    >
      {/* Input handle - LEFT side for horizontal layout */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: "50%" }}
      />

      {/* Block header */}
      <div 
        className={`flex items-center gap-2 px-3 py-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl ${isCollapsed ? 'rounded-b-xl border-b-0' : 'border-b'}`}
        onDoubleClick={toggleCollapse}
      >
        <div className="cursor-grab opacity-50 hover:opacity-100">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        <button 
          onClick={toggleCollapse}
          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          {blockDefinition?.icon || <CircleDot className="w-3.5 h-3.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">
            {blockDefinition?.name || block.type}
          </span>
          {isCollapsed && (
            <div className="text-[10px] text-slate-500 truncate">
              {block.label || block.fieldName || `Block ${index + 1}`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            title="Configure"
            onClick={handleConfigure}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500"
            title="Delete"
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Block content - Render actual item (only when expanded) */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          {blockDefinition?.renderItem ? (
            <div className="nodrag cursor-default" onMouseDown={(e) => e.stopPropagation()}>
              {blockDefinition.renderItem({
                data: block,
                onUpdate: handleUpdate,
                onRemove: handleDelete,
              })}
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
              {block.label || block.fieldName || `Block ${index + 1}`}
            </div>
          )}
        </div>
      )}

      {/* Navigation indicator */}
      {hasNavigationRules && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <ArrowRight className="w-3 h-3" />
            <span>{block.navigationRules?.length} navigation rule(s)</span>
          </div>
        </div>
      )}

      {/* Index badge */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>

      {/* Output handles - RIGHT side for horizontal layout */}
      {/* Multiple handles distributed vertically for better edge routing */}
      <div className="absolute top-0 right-0 h-full w-0 z-50 pointer-events-none">
        {OUTPUT_HANDLE_POSITIONS.map((percent, i) => (
          <Handle
            key={`source-${i}`}
            type="source"
            position={Position.Right}
            id={`source-${i}`}
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white hover:!bg-blue-500 hover:!w-4 hover:!h-4 transition-all cursor-crosshair pointer-events-auto opacity-0 group-hover:opacity-100"
            style={{ top: `${percent}%`, right: -6 }}
            title="Drag to connect"
          />
        ))}
      </div>
    </div>
  );
});

BlockNode.displayName = "BlockNode";
