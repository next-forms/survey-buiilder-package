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
    
    if (onEdgeDragStart) {
      // Get the initial mouse position in world coordinates
      onEdgeDragStart(edge.id, {
        x: targetX,
        y: targetY
      });
    }
  }, [edge.id, onEdgeDragStart, targetX, targetY]);

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
  
  // Calculate drag line path if this edge is being dragged
  let dragLinePath = "";
  if (isBeingDragged && dragState.currentPosition) {
    const dragX = dragState.currentPosition.x;
    const dragY = dragState.currentPosition.y;
    
    // Create a line from source to current drag position
    dragLinePath = `M ${sourceX} ${sourceY} L ${dragX} ${dragY}`;
  }

  return (
    <g>
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
      
      {/* Edge path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        fill="none"
        strokeDasharray={strokeDasharray}
        className={edge.animated || selected ? "animate-pulse" : ""}
        markerEnd={markerEnd}
        style={{
          opacity: isBeingDragged ? 0.5 : 1,
          filter: selected ? "brightness(1.2)" : "none",
          transition: "all 0.2s ease"
        }}
        onClick={handleEdgeClick}
      />

      {/* Interactive arrowhead area for dragging */}
      <g style={{ pointerEvents: "all" }}>
        {/* Invisible larger circle for easier grabbing */}
        <circle
          cx={targetX}
          cy={targetY}
          r={12}
          fill="transparent"
          stroke="transparent"
          onMouseDown={handleArrowheadDragStart}
          style={{
            cursor: isBeingDragged ? "grabbing" : "grab"
          }}
        />
        
        {/* Visible grab indicator on hover */}
        <circle
          cx={targetX}
          cy={targetY}
          r={6}
          fill="transparent"
          stroke="transparent"
          className="hover:stroke-primary hover:stroke-2 hover:fill-primary/20"
          style={{
            pointerEvents: "none",
            transition: "all 0.2s ease"
          }}
        />
        
        {/* Small dot indicator for the connection point */}
        <circle
          cx={targetX}
          cy={targetY}
          r={2}
          fill={strokeColor}
          className="opacity-60 hover:opacity-100"
          style={{
            pointerEvents: "none",
            transition: "opacity 0.2s ease"
          }}
        />
      </g>

      {/* Drag line when dragging */}
      {isBeingDragged && dragLinePath && (
        <path
          d={dragLinePath}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray="5,5"
          className="animate-pulse"
          markerEnd={markerEnd}
        />
      )}

      {/* Edge label with improved styling */}
      {edge.data?.label && !isSequential && (
        <g>
          {/* Background rectangle for better readability */}
          <rect
            x={(sourceX + targetX) / 2 - (edge.data.label.length * 3)}
            y={(sourceY + targetY) / 2 - 8}
            width={edge.data.label.length * 6}
            height={16}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
            rx="3"
            className="opacity-90"
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2 + 3}
            textAnchor="middle"
            className="text-xs font-medium"
            style={{
              fontSize: Math.max(9, 10),
              fill: isConditional ? '#374151' : '#6b7280'
            }}
          >
            {/* Truncate long labels */}
            {edge.data.label.length > 20 ? edge.data.label : edge.data.label}
          </text>
        </g>
      )}

      {/* Simple dot indicator for sequential connections - scale with zoom */}
      {isSequential && edge.data?.label && (
        <circle
          cx={(sourceX + targetX) / 2}
          cy={(sourceY + targetY) / 2}
          r="3"
          fill="#94a3b8"
          className="opacity-60"
        />
      )}

    </g>
  );
};