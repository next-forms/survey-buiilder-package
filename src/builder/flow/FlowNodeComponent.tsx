import React from "react";
import { FlowNode } from "./types";
import { NodeData, BlockData } from "../../types";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { Button } from "../../components/ui/button";
import { X, Settings } from "lucide-react";
import { useBuilderDebug } from "../../utils/debugUtils";

interface FlowNodeComponentProps {
  node: FlowNode;
  selected: boolean;
  isActive?: boolean;
  onSelect: (nodeId: string) => void;
  onDragStart: (e: React.MouseEvent, nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConfigure?: (nodeId: string) => void;
  zoom: number;
  isDragOver?: boolean;
  isConnecting?: boolean;
  connectionSourceId?: string;
}

export const FlowNodeComponent: React.FC<FlowNodeComponentProps> = ({
  node,
  selected,
  isActive = false,
  onSelect,
  onDragStart,
  onDelete,
  onConfigure,
  zoom,
  isDragOver = false,
  isConnecting = false,
  connectionSourceId
}) => {
  const { state } = useSurveyBuilder();
  const debug = useBuilderDebug();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(node.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on control buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    onDragStart(e, node.id);
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    debug.log("Opening config for node:", node.id);
    onConfigure?.(node.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(node.id);
  };

  const renderNodeContent = () => {
    if (node.type === "section") {
      const nodeData = node.data as NodeData & { containerSize?: { width: number; height: number } };
      return (
        <div className="flow-node-section rounded-md overflow-hidden h-full">
          <div className="flex items-center gap-2 p-3 bg-primary/10 border-b border-primary/20">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <span className="font-semibold text-sm text-primary">Survey Section</span>
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-foreground">
              {nodeData.name || "Untitled Section"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {nodeData.nodes?.length || 0} pages, {nodeData.items?.length || 0} direct items
            </div>
          </div>
        </div>
      );
    }

    if (node.type === "start") {
      const nodeData = node.data as { name: string; type: string };
      return (
        <div className="flow-node-start rounded-md overflow-hidden h-full">
          <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            <span className="font-medium text-xs text-blue-900 dark:text-blue-100">Start</span>
          </div>
          <div className="p-1">
            <div className="text-xs font-medium text-foreground text-center">
              {nodeData.name || "Start Survey"}
            </div>
          </div>
        </div>
      );
    }

    if (node.type === "submit") {
      const nodeData = node.data as { name: string; type: string };
      return (
        <div className="flow-node-submit rounded-md overflow-hidden h-full">
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border-b border-destructive/20">
            <div className="w-3 h-3 bg-destructive rounded-full"></div>
            <span className="font-medium text-xs text-destructive">Submit</span>
          </div>
          <div className="p-2">
            <div className="text-xs font-medium text-foreground text-center">
              {nodeData.name || "Submit Form"}
            </div>
          </div>
        </div>
      );
    }

    if (node.type === "set") {
      const nodeData = node.data as NodeData & { containerSize?: { width: number; height: number } };
      return (
        <div className="flow-node-set rounded-md overflow-hidden h-full">
          <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <span className="font-medium text-xs text-green-900 dark:text-green-100">{nodeData.name || "Untitled Page"} {isActive && <span className=" text-blue-600 font-medium"> • Active</span>}</span>
            {isActive && (
              <div className="ml-auto">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Active page - new blocks will be added here"></div>
              </div>
            )}
          </div>
          <div className="p-2">
            <div className="text-xs text-muted-foreground mt-1">
              {nodeData.items?.length || 0} blocks
            </div>
          </div>
        </div>
      );
    }

    if (node.type === "block") {
      const blockData = node.data as BlockData & { containerSize?: { width: number; height: number } };
      const definition = state.definitions.blocks[blockData.type];
      
      return (
        <div className="flow-node-block rounded-md overflow-hidden h-full">
          <div className="flex items-center gap-1 p-1 bg-purple-100 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
            <span className="font-medium text-xs text-purple-900 dark:text-purple-100 truncate">
              {definition?.name || blockData.type}
            </span>
          </div>
          <div className="p-1">
            <div className="text-xs font-medium text-foreground truncate">
              {blockData.label || blockData.fieldName || 'Untitled'}
            </div>
            {blockData.required && (
              <div className="text-xs text-destructive mt-0.5">Required</div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Get container size from node data
  const nodeData = node.data as any;
  const containerSize = nodeData?.containerSize;
  
  // Define base styles for different node types
  const getNodeStyles = () => {
    const baseStyle = {
      left: node.position.x,
      top: node.position.y,
      transform: `scale(${Math.max(0.7, Math.min(1, zoom))})`,
      transformOrigin: "top left"
    };

    if (node.type === "section") {
      return {
        ...baseStyle,
        width: containerSize?.width || 2000,
        height: containerSize?.height || 1200,
        minWidth: 1800,
        minHeight: 1000
      };
    }
    
    if (node.type === "set") {
      return {
        ...baseStyle,
        width: containerSize?.width || 300,
        height: containerSize?.height || 200,
        minWidth: 280,
        minHeight: 180
      };
    }
    
    if (node.type === "block") {
      return {
        ...baseStyle,
        width: containerSize?.width || 120,
        height: containerSize?.height || 60,
        minWidth: 110,
        minHeight: 50
      };
    }

    if (node.type === "start") {
      return {
        ...baseStyle,
        width: containerSize?.width || 100,
        height: containerSize?.height || 60,
        minWidth: 80,
        minHeight: 50
      };
    }

    if (node.type === "submit") {
      return {
        ...baseStyle,
        width: containerSize?.width || 100,
        height: containerSize?.height || 60,
        minWidth: 80,
        minHeight: 50
      };
    }
    
    return {
      ...baseStyle,
      minWidth: 200,
      maxWidth: 300
    };
  };

  const getNodeClasses = () => {
    const cursorClass = isConnecting ? "cursor-crosshair" : "cursor-move"; // Change cursor in connection mode
    const baseClasses = `flow-node absolute ${cursorClass} transition-none`; // Remove transitions for smoother movement
    const selectedClasses = selected ? "border-primary shadow-xl ring-2 ring-primary/20" : "border-border hover:border-accent";
    const dragOverClasses = isDragOver ? "ring-4 ring-green-400 border-green-500 bg-green-100/70 dark:bg-green-900/70 shadow-xl shadow-green-400/20" : "";
    
    // Active page styling - subtle highlight for the current active page
    const activeClasses = isActive && node.type === "set" ? "ring-2 ring-blue-300 border-blue-400 bg-blue-50/30 dark:bg-blue-900/30" : "";
    
    // Connection state styling
    const isConnectionSource = connectionSourceId === node.id;
    const canBeTarget = isConnecting && connectionSourceId !== node.id && 
                       (node.type === "block" || node.type === "set" || node.type === "submit");
    const connectionClasses = isConnectionSource ? "ring-4 ring-orange-300 border-orange-400" : 
                             canBeTarget ? "ring-2 ring-green-300 border-green-400 bg-green-50/30 dark:bg-green-900/30" : "";
    
    if (node.type === "section") {
      return `${baseClasses} bg-primary/5 border-2 border-primary/30 rounded-xl shadow-2xl ${selectedClasses} ${dragOverClasses} ${connectionClasses}`;
    }
    
    if (node.type === "set") {
      return `${baseClasses} bg-card border-2 border-green-200 dark:border-green-800 rounded-lg shadow-lg ${selectedClasses} ${dragOverClasses} ${connectionClasses} ${activeClasses}`;
    }
    
    if (node.type === "block") {
      return `${baseClasses} bg-card border border-purple-200 dark:border-purple-800 rounded-md shadow-sm ${selectedClasses} ${dragOverClasses} ${connectionClasses}`;
    }

    if (node.type === "start") {
      return `${baseClasses} bg-card border border-blue-200 dark:border-blue-800 rounded-md shadow-sm ${selectedClasses} ${dragOverClasses} ${connectionClasses}`;
    }

    if (node.type === "submit") {
      return `${baseClasses} bg-card border border-destructive/20 rounded-md shadow-sm ${selectedClasses} ${dragOverClasses} ${connectionClasses}`;
    }
    
    return `${baseClasses} bg-card rounded-lg shadow-lg border-2 ${selectedClasses} ${dragOverClasses} ${connectionClasses}`;
  };

  return (
    <div
      className={getNodeClasses()}
      style={getNodeStyles()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Connection handles - blocks have output handles, pages have both */}
      {node.type === "block" && (
        <>
          <div 
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Input connection"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Output connection - drag to create navigation rule"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
        </>
      )}
      
      {node.type === "set" && (
        <>
          <div 
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Input connection"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Output connection"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
        </>
      )}

      {node.type === "start" && (
        <>
          <div 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Output connection"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
        </>
      )}

      {node.type === "submit" && (
        <>
          <div 
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full border border-background shadow-sm hover:scale-125 transition-transform cursor-crosshair z-10" 
            title="Input connection"
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
          ></div>
        </>
      )}

      {/* Node content */}
      <div className="w-full h-full overflow-hidden">
        {renderNodeContent()}
      </div>

      {/* Node controls */}
      {selected && node.type !== "submit" && node.type !== "start" && (
        <div className="absolute -bottom-3 -right-3 flex gap-1 pointer-events-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-7 h-7 p-0 bg-background shadow-md hover:shadow-lg"
            onClick={handleConfigure}
            onMouseDown={(e) => e.stopPropagation()}
            title="Configure Node"
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
          {node.type !== "section" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-7 h-7 p-0 bg-background shadow-md hover:shadow-lg"
              onClick={handleDelete}
              onMouseDown={(e) => e.stopPropagation()}
              title="Delete Node"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Navigation rules indicator */}
      {node.type === "block" && (node.data as BlockData).navigationRules?.length > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-background pointer-events-none"></div>
      )}
    </div>
  );
};