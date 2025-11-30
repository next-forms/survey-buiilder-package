import React, { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node, useReactFlow } from "@xyflow/react";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import type { FlowV3NodeData } from "../types";
import { cn } from "../../../lib/utils";
import { BlockData } from "../../../types";
import { Settings, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

// Custom Node Component
export const SurveyNode = memo(({ id, data, selected }: NodeProps<Node<FlowV3NodeData>>) => {
  const { state, updateNode } = useSurveyBuilder();
  const { deleteElements } = useReactFlow();
  const { block } = data;
  const blockDefinition = state.definitions.blocks[block.type];

  const handleDelete = useCallback((e?: React.MouseEvent) => {
      e?.stopPropagation();
      deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const handleConfigure = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('flow-v3-configure-node', { 
      detail: { nodeId: id, blockUuid: block.uuid } 
    }));
  }, [id, block.uuid]);

  const handleUpdate = useCallback((updatedBlockData: BlockData) => {
    if (!state.rootNode) return;
    
    // Update the block in the global state
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
      className={cn(
        "relative group bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 transition-all duration-200 min-w-[400px] max-w-[600px]",
        selected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white dark:!border-slate-900"
      />

      {/* Node Actions Toolbar (Visible on Hover) */}
      <div className="absolute -top-3 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-full shadow-sm border border-slate-200 bg-white hover:bg-slate-100"
            onClick={handleConfigure}
            title="Configure Block"
        >
            <Settings className="h-3.5 w-3.5 text-slate-600" />
        </Button>
        <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7 rounded-full shadow-sm border border-red-200 hover:bg-red-600"
            onClick={handleDelete}
            title="Delete Block"
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4" onDoubleClick={handleConfigure}>
        {/* Render the actual block content */}
        {blockDefinition?.renderItem ? (
           <div className="nodrag cursor-default" onMouseDown={(e) => e.stopPropagation()}>
            {blockDefinition.renderItem({
              data: block,
              onUpdate: handleUpdate,
              onRemove: handleDelete, 
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500">
            Unknown Block Type: {block.type}
          </div>
        )}
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-white dark:!border-slate-900"
      />
    </div>
  );
});

SurveyNode.displayName = "SurveyNode";
