import React from "react";
import { Button } from "../../components/ui/button";
import {
  MousePointer2,
  Link2,
  Hand,
  Maximize,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  X,
} from "lucide-react";
import type { FlowV2Mode } from "./types";

interface FlowV2ToolbarProps {
  mode: FlowV2Mode;
  onModeChange: (mode: FlowV2Mode) => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetLayout: () => void;
  onClose?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const FlowV2Toolbar: React.FC<FlowV2ToolbarProps> = ({
  mode,
  onModeChange,
  onFitView,
  onZoomIn,
  onZoomOut,
  onResetLayout,
  onClose,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-sidebar-border bg-white dark:bg-sidebar">
      {/* Left side - Close button and mode selection */}
      <div className="flex items-center gap-3">
        {/* Close button */}
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Close flow builder"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* Mode selection */}
        {/* <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
        <Button
          type="button"
          variant={mode === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("select")}
          className="h-8 px-3"
          title="Select mode (V)"
        >
          <MousePointer2 className="w-4 h-4 mr-1.5" />
          Select
        </Button>
        <Button
          type="button"
          variant={mode === "connect" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("connect")}
          className="h-8 px-3"
          title="Connect mode (C)"
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          Connect
        </Button>
        <Button
          type="button"
          variant={mode === "pan" ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange("pan")}
          className="h-8 px-3"
          title="Pan mode (H)"
        >
          <Hand className="w-4 h-4 mr-1.5" />
          Pan
        </Button>
        </div> */}
      </div>

      {/* View controls */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-1 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-sidebar-accent rounded-lg p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-8 w-8 p-0"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-8 w-8 p-0"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFitView}
            className="h-8 w-8 p-0"
            title="Fit view (F)"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Reset layout */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetLayout}
          className="h-8"
          title="Reset layout"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Reset
        </Button>
      </div>
    </div>
  );
};
