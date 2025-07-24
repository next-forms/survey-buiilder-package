import React, { useCallback } from "react";
import { FlowEdge, FlowNode } from "./types";
import { EdgeDragState } from "./utils/connectionValidation";
import { EdgeRoute } from "./utils/edgeRouting";

interface FlowEdgeComponentProps {
  edge: FlowEdge;
  nodes: FlowNode[];
  zoom: number;
  viewport?: { x: number; y: number; zoom: number };
  edgeRoute?: EdgeRoute;
  dragState?: EdgeDragState;
  selected?: boolean;
  onEdgeClick?: (edgeId: string) => void;
  onEdgeDragStart?: (edgeId: string, position: { x: number; y: number }) => void;
  onEdgeDragEnd?: (edgeId: string, targetNodeId: string | null) => void;
  onEdgeDragMove?: (edgeId: string, position: { x: number; y: number }) => void;
}

export const FlowEdgeComponent: React.FC<FlowEdgeComponentProps> = ({
  edge,
  nodes,
  zoom,
  viewport,
  edgeRoute,
  dragState,
  selected,
  onEdgeClick,
  onEdgeDragStart,
  onEdgeDragEnd,
  onEdgeDragMove
}) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) {
    return null;
  }
  

  // Determine edge style based on type and custom styles first
  const isConditional = edge.type === "conditional";
  const isSequential = edge.data?.isSequential || false;
  const isPageEntry = edge.data?.isPageEntry || false;
  const isPageToPage = edge.data?.isPageToPage || false;
  const isStartEntry = edge.data?.isStartEntry || false;
  
  // Only certain edge types should be draggable
  // Start entry: change first page
  // Page entry: change first block in page
  // Page to page: reorder pages
  // Sequential (within same page): reorder blocks within page
  const isDraggable = isStartEntry || isPageEntry || isPageToPage || (isSequential && isBlockWithinSamePage(edge, nodes));
  
  // Helper function to check if sequential edge connects blocks within same page
  function isBlockWithinSamePage(edge: FlowEdge, nodes: FlowNode[]): boolean {
    if (!edge.data?.isSequential) return false;
    
    // Extract page IDs from block IDs (format: pageId-block-index)
    const sourceMatch = edge.source.match(/^(.+)-block-\d+$/);
    const targetMatch = edge.target.match(/^(.+)-block-\d+$/);
    
    if (!sourceMatch || !targetMatch) return false;
    
    // Check if both blocks belong to the same page
    return sourceMatch[1] === targetMatch[1];
  }

  let sourceX: number, sourceY: number, targetX: number, targetY: number;
  let path: string;

  // Use pre-calculated edge route if available
  if (edgeRoute) {
    sourceX = edgeRoute.source.x;
    sourceY = edgeRoute.source.y;
    targetX = edgeRoute.target.x;
    targetY = edgeRoute.target.y;
    path = edgeRoute.path;
  } else {
    // Fallback to original calculation logic
    const sourceData = sourceNode.data as any;
    const targetData = targetNode.data as any;
    const baseSourceSize = sourceData?.containerSize || { width: 120, height: 60 };
    const baseTargetSize = targetData?.containerSize || { width: 120, height: 60 };
    
    // Apply zoom scaling to match how nodes are actually rendered
    const nodeZoomScale = Math.max(0.7, Math.min(1, zoom));
    const sourceSize = {
      width: baseSourceSize.width * nodeZoomScale,
      height: baseSourceSize.height * nodeZoomScale
    };
    const targetSize = {
      width: baseTargetSize.width * nodeZoomScale,
      height: baseTargetSize.height * nodeZoomScale
    };

    // Calculate center positions
    sourceX = sourceNode.position.x + sourceSize.width / 2;
    targetX = targetNode.position.x + targetSize.width / 2;
    
    // Get connection handle offsets based on node type
    const getConnectionHandleOffset = (nodeType: string) => {
      switch (nodeType) {
        case 'set': return 2;
        case 'block': return 1;
        case 'start':
        case 'submit': return 1;
        default: return 0;
      }
    };
    
    const sourceHandleOffset = getConnectionHandleOffset(sourceNode.type);
    const targetHandleOffset = getConnectionHandleOffset(targetNode.type);
    
    if (isPageToPage) {
      sourceY = sourceNode.position.y + sourceSize.height + sourceHandleOffset;
      targetY = targetNode.position.y - targetHandleOffset;
    }
    else if (isPageEntry) {
      sourceY = sourceNode.position.y - sourceHandleOffset;
      targetY = targetNode.position.y - targetHandleOffset;
    } 
    else if (isSequential) {
      sourceY = sourceNode.position.y + sourceSize.height + sourceHandleOffset;
      targetY = targetNode.position.y - targetHandleOffset;
    }
    else {
      sourceY = sourceNode.position.y + sourceSize.height + sourceHandleOffset;
      targetY = targetNode.position.y - targetHandleOffset;
    }

    // Create smooth curve path
    const deltaY = Math.abs(targetY - sourceY);
    const controlPointOffset = Math.max(30, deltaY * 0.3);
    
    if (isPageToPage) {
      const pageControlPointOffset = Math.max(50, deltaY * 0.4);
      if (targetY > sourceY) {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY + pageControlPointOffset} ${targetX} ${targetY - pageControlPointOffset} ${targetX} ${targetY}`;
      } else {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY - pageControlPointOffset} ${targetX} ${targetY + pageControlPointOffset} ${targetX} ${targetY}`;
      }
    } else if (isPageEntry) {
      if (targetY > sourceY) {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY + controlPointOffset} ${targetX} ${targetY - controlPointOffset} ${targetX} ${targetY}`;
      } else {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY - controlPointOffset} ${targetX} ${targetY + controlPointOffset} ${targetX} ${targetY}`;
      }
    } else {
      if (targetY > sourceY) {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY + controlPointOffset} ${targetX} ${targetY - controlPointOffset} ${targetX} ${targetY}`;
      } else {
        path = `M ${sourceX} ${sourceY} 
                C ${sourceX} ${sourceY - controlPointOffset} ${targetX} ${targetY + controlPointOffset} ${targetX} ${targetY}`;
      }
    }
  }
  
  // Use custom style color if provided, otherwise default colors
  let strokeColor = edge.style?.stroke as string;
  if (!strokeColor) {
    if (isConditional) {
      strokeColor = edge.data?.isDefault ? "#f59e0b" : "#3b82f6"; // Orange for default nav, blue for conditional nav
    } else if (isPageToPage) {
      strokeColor = "#3b82f6"; // Blue for page-to-page connections
    } else if (isSequential) {
      strokeColor = "#94a3b8"; // Gray for sequential flow
    } else if (isPageEntry) {
      strokeColor = "#10b981"; // Green for page entry
    } else {
      strokeColor = "#6b7280"; // Default gray
    }
  }
  
  // Use custom stroke dash array if provided, scaling with zoom
  let strokeDasharray = edge.style?.strokeDasharray as string || "none";
  if (strokeDasharray === "none" && isConditional) {
    strokeDasharray = "none"; // Solid line for navigation rules
  } else if (strokeDasharray === "none" && isSequential && edge.style?.strokeDasharray) {
    strokeDasharray = edge.style.strokeDasharray as string; // Dashed line for sequential with nav rules
  }
  
  // Keep dash array as-is since SVG is in transformed container
  // No need to scale dash array - transform handles it
  
  // Use custom stroke width if provided - no zoom scaling needed since SVG is in transformed container
  const strokeWidth = typeof edge.style?.strokeWidth === 'number' ? edge.style.strokeWidth : (isConditional ? 2 : (isPageToPage ? 3 : 1.5));
  
  const markerEnd = isConditional ? "url(#arrowhead-conditional)" : "url(#arrowhead-default)";

  // Handle arrowhead drag start
  const handleArrowheadDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log for debugging
    console.log('Edge drag start:', {
      edgeId: edge.id,
      edgeType: edge.type,
      edgeData: edge.data,
      source: edge.source,
      target: edge.target
    });
    
    if (onEdgeDragStart) {
      // Get the initial mouse position in world coordinates
      onEdgeDragStart(edge.id, {
        x: targetX,
        y: targetY
      });
    }
  }, [edge.id, edge.type, edge.data, edge.source, edge.target, onEdgeDragStart, targetX, targetY]);

  // Handle edge click
  const handleEdgeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onEdgeClick) {
      onEdgeClick(edge.id);
    }
  }, [edge.id, onEdgeClick]);

  // Check if this edge is currently being dragged
  const isBeingDragged = dragState?.isDragging && dragState.edgeId === edge.id;
  
  // Debug log drag state
  if (dragState?.isDragging) {
    console.log(`Edge ${edge.id} drag state:`, { isBeingDragged, dragStateEdgeId: dragState.edgeId, edgeId: edge.id });
  }
  
  // Calculate drag line path if this edge is being dragged
  let dragLinePath = "";
  let draggedTargetX = targetX;
  let draggedTargetY = targetY;
  
  if (isBeingDragged && dragState.currentPosition) {
    draggedTargetX = dragState.currentPosition.x;
    draggedTargetY = dragState.currentPosition.y;
    
    // Debug log to verify position updates
    console.log(`Edge ${edge.id} drag position:`, { draggedTargetX, draggedTargetY, originalTarget: { targetX, targetY } });
    
    // Create a smooth curve from source to current drag position
    const deltaY = Math.abs(draggedTargetY - sourceY);
    const controlPointOffset = Math.max(30, deltaY * 0.3);
    
    if (draggedTargetY > sourceY) {
      dragLinePath = `M ${sourceX} ${sourceY} 
                      C ${sourceX} ${sourceY + controlPointOffset} ${draggedTargetX} ${draggedTargetY - controlPointOffset} ${draggedTargetX} ${draggedTargetY}`;
    } else {
      dragLinePath = `M ${sourceX} ${sourceY} 
                      C ${sourceX} ${sourceY - controlPointOffset} ${draggedTargetX} ${draggedTargetY + controlPointOffset} ${draggedTargetX} ${draggedTargetY}`;
    }
  }

  return (
    <g>
      {/* Ghost of original edge when dragging */}
      {isBeingDragged && (
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray="4,4"
          opacity={0.3}
          style={{
            pointerEvents: "none"
          }}
        />
      )}
      
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth + 10, 15)}
        fill="none"
        style={{
          cursor: "pointer",
          pointerEvents: "stroke"
        }}
        onClick={handleEdgeClick}
      />
      
      {/* Highlight glow effect when selected */}
      {selected && (
        <path
          d={path}
          stroke={strokeColor}
          strokeWidth={strokeWidth + 6}
          fill="none"
          strokeDasharray={strokeDasharray}
          className="animate-pulse"
          style={{
            opacity: 0.3,
            filter: "blur(4px)"
          }}
        />
      )}
      
      {/* Edge path - show dragged path when dragging, otherwise original */}
      <path
        d={isBeingDragged && dragLinePath ? dragLinePath : path}
        stroke={strokeColor}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        fill="none"
        strokeDasharray={strokeDasharray}
        className={edge.animated || selected ? "animate-pulse" : ""}
        markerEnd={markerEnd}
        style={{
          opacity: isBeingDragged ? 0.8 : 1,
          filter: selected ? "brightness(1.2)" : "none",
          transition: isBeingDragged ? "none" : "all 0.2s ease"
        }}
        onClick={handleEdgeClick}
      />

      {/* Arrowhead area - different behavior for draggable vs non-draggable edges */}
      <g style={{ pointerEvents: "all" }}>
        {isDraggable ? (
          <>
            {/* Draggable edges - interactive drag handle */}
            <circle
              cx={isBeingDragged ? draggedTargetX : targetX}
              cy={isBeingDragged ? draggedTargetY : targetY}
              r={20}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="2"
              onMouseDown={handleArrowheadDragStart}
              className="hover:fill-blue-500/30 hover:stroke-blue-500"
              style={{
                cursor: isBeingDragged ? "grabbing" : "grab",
                pointerEvents: "all",
                transition: "all 0.2s ease"
              }}
            />
            
            {/* Visible grab indicator for draggable edges */}
            <circle
              cx={isBeingDragged ? draggedTargetX : targetX}
              cy={isBeingDragged ? draggedTargetY : targetY}
              r={8}
              fill="transparent"
              stroke={isBeingDragged ? strokeColor : "transparent"}
              strokeWidth={2}
              className="hover:stroke-primary hover:fill-primary/20"
              style={{
                pointerEvents: "none",
                transition: isBeingDragged ? "none" : "all 0.2s ease"
              }}
            />
            
            {/* Visual hint for draggable edges */}
            {!isBeingDragged && (
              <>
                <circle
                  cx={targetX}
                  cy={targetY}
                  r={12}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeDasharray="3,3"
                  className="opacity-50 hover:opacity-80 animate-pulse"
                  style={{
                    pointerEvents: "none",
                    transition: "opacity 0.2s ease"
                  }}
                />
                {/* Add text hint for draggable edges */}
                <text
                  x={targetX + 20}
                  y={targetY - 10}
                  className="text-xs fill-current opacity-0 hover:opacity-60"
                  style={{
                    pointerEvents: "none",
                    fontSize: "10px",
                    fill: strokeColor
                  }}
                >
                  {isStartEntry ? "Drag to change first page" : 
                   isPageEntry ? "Drag to reorder blocks" : 
                   isPageToPage ? "Drag to reorder pages" : 
                   (isSequential && isBlockWithinSamePage(edge, nodes)) ? "Drag to reorder blocks" :
                   "Drag to reorder"}
                </text>
              </>
            )}
          </>
        ) : (
          <>
            {/* Non-draggable edges - just show the arrowhead indicator */}
            <circle
              cx={targetX}
              cy={targetY}
              r={3}
              fill={strokeColor}
              className="opacity-60"
              style={{
                pointerEvents: "none"
              }}
            />
          </>
        )}
        
        {/* Connection point indicator - shown for all edges */}
        <circle
          cx={isBeingDragged ? draggedTargetX : targetX}
          cy={isBeingDragged ? draggedTargetY : targetY}
          r={isDraggable ? 4 : 3}
          fill={strokeColor}
          className={isDraggable ? "opacity-80 hover:opacity-100" : "opacity-60"}
          style={{
            pointerEvents: "none",
            transition: isBeingDragged ? "none" : "opacity 0.2s ease"
          }}
        />
        
        {/* Drop zone indicator when dragging */}
        {isBeingDragged && (
          <>
            {/* Pulsing circle at cursor position */}
            <circle
              cx={draggedTargetX}
              cy={draggedTargetY}
              r={20}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              className="animate-pulse"
              style={{
                pointerEvents: "none",
                opacity: 0.6
              }}
            />
            <circle
              cx={draggedTargetX}
              cy={draggedTargetY}
              r={6}
              fill={strokeColor}
              className="animate-pulse"
              style={{
                pointerEvents: "none",
                opacity: 0.8
              }}
            />
            {/* Hint text */}
            <text
              x={draggedTargetX + 25}
              y={draggedTargetY + 5}
              className="text-xs font-medium"
              style={{
                pointerEvents: "none",
                fontSize: "12px",
                fill: strokeColor,
                opacity: 0.9
              }}
            >
              Drop on target
            </text>
          </>
        )}
      </g>


      {/* Edge label with improved styling */}
      {edge.data?.label && !isSequential && (
        <g style={{ cursor: "pointer" }} onClick={handleEdgeClick}>
          {/* Highlight glow for selected label */}
          {selected && (
            <rect
              x={(sourceX + targetX) / 2 - (edge.data.label.length * 3) - 4}
              y={(sourceY + targetY) / 2 - 12}
              width={edge.data.label.length * 6 + 8}
              height={24}
              fill={strokeColor}
              stroke="none"
              rx="5"
              className="animate-pulse"
              style={{
                opacity: 0.2,
                filter: "blur(4px)"
              }}
            />
          )}
          
          {/* Background rectangle for better readability */}
          <rect
            x={(sourceX + targetX) / 2 - (edge.data.label.length * 3)}
            y={(sourceY + targetY) / 2 - 8}
            width={edge.data.label.length * 6}
            height={16}
            fill={selected ? strokeColor : "white"}
            stroke={selected ? strokeColor : "#e5e7eb"}
            strokeWidth={selected ? "2" : "1"}
            rx="3"
            className={selected ? "opacity-100" : "opacity-90"}
            style={{
              transition: "all 0.2s ease"
            }}
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2 + 3}
            textAnchor="middle"
            className="text-xs font-medium"
            style={{
              fontSize: Math.max(9, 10),
              fill: selected ? 'white' : (isConditional ? '#374151' : '#6b7280'),
              fontWeight: selected ? 600 : 500,
              transition: "all 0.2s ease"
            }}
          >
            {/* Truncate long labels */}
            {edge.data.label.length > 20 ? edge.data.label.substring(0, 20) + '...' : edge.data.label}
          </text>
        </g>
      )}

      {/* Simple dot indicator for sequential connections - scale with zoom */}
      {isSequential && edge.data?.label && (
        <g style={{ cursor: "pointer" }} onClick={handleEdgeClick}>
          {/* Highlight glow for selected dot */}
          {selected && (
            <circle
              cx={(sourceX + targetX) / 2}
              cy={(sourceY + targetY) / 2}
              r="8"
              fill={strokeColor}
              className="animate-pulse"
              style={{
                opacity: 0.3,
                filter: "blur(4px)"
              }}
            />
          )}
          <circle
            cx={(sourceX + targetX) / 2}
            cy={(sourceY + targetY) / 2}
            r={selected ? "4" : "3"}
            fill={selected ? strokeColor : "#94a3b8"}
            className={selected ? "opacity-100" : "opacity-60"}
            style={{
              transition: "all 0.2s ease"
            }}
          />
        </g>
      )}

    </g>
  );
};