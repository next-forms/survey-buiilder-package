import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { StartNodeData } from "../types";
import { Play } from "lucide-react";

type StartNodeType = Node<StartNodeData, "start">;

export const StartNode = memo(({ data, selected }: NodeProps<StartNodeType>) => {
  return (
    <div
      className={`
        relative
        px-5 py-3 rounded-xl
        bg-gradient-to-r from-emerald-500 to-green-500
        text-white font-semibold text-sm
        shadow-lg shadow-emerald-500/30
        flex items-center gap-2 justify-center
        min-w-[140px]
        transition-all duration-200
        ${selected ? "ring-2 ring-emerald-300 ring-offset-2" : ""}
      `}
    >
      <Play className="w-4 h-4" />
      <span>{data.label}</span>
      {/* Output handle - RIGHT side for horizontal layout */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2 !border-emerald-500"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
