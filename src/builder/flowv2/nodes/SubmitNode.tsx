import React, { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { SubmitNodeData } from "../types";
import { CheckCircle2 } from "lucide-react";

// Input handle positions for horizontal layout (distributed vertically on the left side)
const INPUT_HANDLE_POSITIONS = [20, 35, 50, 65, 80]; // percentages from top

type SubmitNodeType = Node<SubmitNodeData, "submit">;

export const SubmitNode = memo(({ data, selected }: NodeProps<SubmitNodeType>) => {
  return (
    <div
      className={`
        relative
        px-5 py-3 rounded-xl
        bg-gradient-to-r from-blue-500 to-indigo-500
        text-white font-semibold text-sm
        shadow-lg shadow-blue-500/30
        flex items-center gap-2 justify-center
        min-w-[140px] min-h-[60px]
        transition-all duration-200
        ${selected ? "ring-2 ring-blue-300 ring-offset-2" : ""}
      `}
    >
      {/* Input handles - LEFT side for horizontal layout */}
      {/* Multiple handles distributed vertically for separate incoming connections */}
      {INPUT_HANDLE_POSITIONS.map((percent, i) => (
        <Handle
          key={`target-${i}`}
          type="target"
          position={Position.Left}
          id={`target-${i}`}
          className="!w-3 !h-3 !bg-white !border-2 !border-blue-500 hover:!bg-blue-100 hover:!w-4 hover:!h-4 transition-all cursor-crosshair"
          style={{ top: `${percent}%`, left: -6 }}
          title="Connection target"
        />
      ))}
      <CheckCircle2 className="w-4 h-4" />
      <span>{data.label}</span>
    </div>
  );
});

SubmitNode.displayName = "SubmitNode";
