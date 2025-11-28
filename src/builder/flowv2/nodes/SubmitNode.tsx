import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { SubmitNodeData } from "../types";
import { CheckCircle2 } from "lucide-react";

type SubmitNodeType = Node<SubmitNodeData, "submit">;

export const SubmitNode = memo(({ data, selected }: NodeProps<SubmitNodeType>) => {
  return (
    <div
      className={`
        px-4 py-3 rounded-full
        bg-gradient-to-r from-blue-500 to-indigo-500
        text-white font-semibold text-sm
        shadow-lg shadow-blue-500/30
        flex items-center gap-2 justify-center
        min-w-[100px]
        transition-all duration-200
        ${selected ? "ring-2 ring-blue-300 ring-offset-2" : ""}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-white !border-2 !border-blue-500"
      />
      <CheckCircle2 className="w-4 h-4" />
      <span>{data.label}</span>
    </div>
  );
});

SubmitNode.displayName = "SubmitNode";
