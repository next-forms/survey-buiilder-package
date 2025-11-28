import React, { memo, useState, useCallback } from "react";
import { type NodeProps, type Node } from "@xyflow/react";
import { Plus } from "lucide-react";

export interface DropZoneNodeData extends Record<string, unknown> {
  insertIndex: number;
  isFirst?: boolean;
  isLast?: boolean;
  isVisible?: boolean;
}

type DropZoneNodeType = Node<DropZoneNodeData, "dropzone">;

type DropZoneNodeProps = NodeProps<DropZoneNodeType>;

export const DropZoneNode = memo(({
  data,
}: DropZoneNodeProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { insertIndex, isFirst, isLast, isVisible = true } = data;

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Check if dragging a block
    if (
      e.dataTransfer.types.includes("application/reactflow") ||
      e.dataTransfer.types.includes("application/x-block-type")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as HTMLElement)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const blockType =
      e.dataTransfer.getData("application/reactflow") ||
      e.dataTransfer.getData("application/x-block-type");

    if (blockType) {
      // Dispatch custom event with insert index
      window.dispatchEvent(new CustomEvent('flow-v2-drop-block', {
        detail: { blockType, insertIndex }
      }));
    }
  }, [insertIndex]);

  return (
    <div
      className={`
        transition-all duration-200 ease-out
        rounded-xl
        flex items-center justify-center
        cursor-pointer
        pointer-events-auto
        ${isDragOver
          ? "w-[220px] h-24 border-3 border-dashed border-blue-500 bg-blue-100/90 dark:bg-blue-900/50 shadow-xl shadow-blue-500/30 scale-105"
          : "w-[200px] h-16 border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 hover:border-blue-500 hover:bg-blue-100/80 dark:hover:bg-blue-800/40 hover:scale-102"
        }
      `}
      style={{ zIndex: 9999 }}
      onDragOver={handleDragOver}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (
          e.dataTransfer.types.includes("application/reactflow") ||
          e.dataTransfer.types.includes("application/x-block-type")
        ) {
          setIsDragOver(true);
        }
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`
        flex items-center gap-2 text-sm font-semibold
        transition-all duration-200
        ${isDragOver
          ? "text-blue-700 dark:text-blue-300 scale-105"
          : "text-blue-600 dark:text-blue-400"
        }
      `}>
        <div className={`
          w-7 h-7 rounded-full flex items-center justify-center
          transition-all duration-200
          ${isDragOver
            ? "bg-blue-600 text-white shadow-md"
            : "bg-blue-500 text-white"
          }
        `}>
          <Plus className="w-4 h-4" />
        </div>
        <span className="select-none">
          {isDragOver
            ? "Drop here!"
            : isFirst
              ? "Drop first block"
              : isLast
                ? "Drop at end"
                : "Insert here"
          }
        </span>
      </div>
    </div>
  );
});

DropZoneNode.displayName = "DropZoneNode";
