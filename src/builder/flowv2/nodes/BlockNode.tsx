import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { BlockNodeData } from "../types";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import {
  GripVertical,
  Settings,
  Trash2,
  ArrowRight,
  CircleDot
} from "lucide-react";

type BlockNodeType = Node<BlockNodeData, "block">;

export const BlockNode = memo(({
  id,
  data,
  selected,
}: NodeProps<BlockNodeType>) => {
  const { state } = useSurveyBuilder();
  const { block, index } = data;

  // Get block definition for icon
  const blockDefinition = state.definitions.blocks[block.type];
  const hasNavigationRules = (block.navigationRules?.length || 0) > 0;

  return (
    <div
      className={`
        relative group
        bg-white dark:bg-slate-800
        rounded-xl
        shadow-md hover:shadow-lg
        border-2 transition-all duration-200
        min-w-[260px] max-w-[280px]
        ${selected
          ? "border-blue-500 shadow-blue-500/20"
          : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
        }
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <div className="cursor-grab opacity-50 hover:opacity-100">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          {blockDefinition?.icon || <CircleDot className="w-3.5 h-3.5" />}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">
            {blockDefinition?.name || block.type}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            title="Configure"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Block content */}
      <div className="px-3 py-2">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
          {block.label || block.fieldName || `Block ${index + 1}`}
        </div>
        {block.fieldName && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {block.fieldName}
          </div>
        )}
      </div>

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

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Conditional output handles for navigation rules */}
      {hasNavigationRules && (
        <Handle
          type="source"
          position={Position.Right}
          id="conditional"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        />
      )}
    </div>
  );
});

BlockNode.displayName = "BlockNode";
