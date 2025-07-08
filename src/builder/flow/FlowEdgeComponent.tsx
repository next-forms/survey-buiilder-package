import React from "react";
import { FlowEdge, FlowNode } from "./types";

interface FlowEdgeComponentProps {
  edge: FlowEdge;
  nodes: FlowNode[];
  zoom: number;
  viewport?: { x: number; y: number; zoom: number };
}

export const FlowEdgeComponent: React.FC<FlowEdgeComponentProps> = ({
  edge,
  nodes,
  zoom,
  viewport
}) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  // Get node sizes from their data
  const sourceData = sourceNode.data as any;
  const targetData = targetNode.data as any;
  const sourceSize = sourceData?.containerSize || { width: 120, height: 60 };
  const targetSize = targetData?.containerSize || { width: 120, height: 60 };

  // Determine edge style based on type and custom styles first
  const isConditional = edge.type === "conditional";
  const isSequential = edge.data?.isSequential || false;
  const isPageEntry = edge.data?.isPageEntry || false;

  // Calculate connection points more accurately
  let sourceX = sourceNode.position.x + sourceSize.width / 2; // Center of source node
  let sourceY: number;
  
  // For page entry connections, connect from top middle of page
  if (isPageEntry) {
    sourceY = sourceNode.position.y; // Top of source node (page)
  } else {
    sourceY = sourceNode.position.y + sourceSize.height; // Bottom of source node
  }
  
  const targetX = targetNode.position.x + targetSize.width / 2; // Center of target node
  const targetY = targetNode.position.y;                        // Top of target node

  // Create smooth curve path with better control points
  const deltaY = Math.abs(targetY - sourceY);
  const controlPointOffset = Math.max(30, deltaY * 0.3); // Minimum 30px curve
  
  let path: string;
  if (isPageEntry) {
    // For page entry connections, create a downward curve from page top to block top
    if (targetY > sourceY) {
      // Normal case: target block is below page top
      path = `M ${sourceX} ${sourceY} 
              C ${sourceX} ${sourceY + controlPointOffset} ${targetX} ${targetY - controlPointOffset} ${targetX} ${targetY}`;
    } else {
      // Edge case: target block is above page top (shouldn't happen in normal layouts)
      path = `M ${sourceX} ${sourceY} 
              C ${sourceX} ${sourceY - controlPointOffset} ${targetX} ${targetY + controlPointOffset} ${targetX} ${targetY}`;
    }
  } else {
    // For all other connections, use the original logic
    if (targetY > sourceY) {
      // Target is below source - normal downward curve
      path = `M ${sourceX} ${sourceY} 
              C ${sourceX} ${sourceY + controlPointOffset} ${targetX} ${targetY - controlPointOffset} ${targetX} ${targetY}`;
    } else {
      // Target is above source - upward curve
      path = `M ${sourceX} ${sourceY} 
              C ${sourceX} ${sourceY - controlPointOffset} ${targetX} ${targetY + controlPointOffset} ${targetX} ${targetY}`;
    }
  }
  
  // Use custom style color if provided, otherwise default colors
  let strokeColor = edge.style?.stroke as string;
  if (!strokeColor) {
    if (isConditional) {
      strokeColor = edge.data?.isDefault ? "#f59e0b" : "#3b82f6"; // Orange for default nav, blue for conditional nav
    } else if (isSequential) {
      strokeColor = "#94a3b8"; // Gray for sequential flow
    } else if (isPageEntry) {
      strokeColor = "#10b981"; // Green for page entry
    } else {
      strokeColor = "#6b7280"; // Default gray
    }
  }
  
  // Use custom stroke dash array if provided
  let strokeDasharray = edge.style?.strokeDasharray as string || "none";
  if (strokeDasharray === "none" && isConditional) {
    strokeDasharray = "none"; // Solid line for navigation rules
  } else if (strokeDasharray === "none" && isSequential && edge.style?.strokeDasharray) {
    strokeDasharray = edge.style.strokeDasharray as string; // Dashed line for sequential with nav rules
  }
  
  // Use custom stroke width if provided
  const strokeWidth = edge.style?.strokeWidth || (isConditional ? 2 : 1.5);
  
  const markerEnd = isConditional ? "url(#arrowhead-conditional)" : "url(#arrowhead-default)";

  return (
    <g>
      {/* Edge path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={strokeDasharray}
        className={edge.animated ? "animate-pulse" : ""}
        markerEnd={markerEnd}
      />

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
              fontSize: Math.max(9, 10 * zoom),
              fill: isConditional ? '#374151' : '#6b7280'
            }}
          >
            {/* Truncate long labels */}
            {edge.data.label.length > 20 ? edge.data.label.substring(0, 17) + '...' : edge.data.label}
          </text>
        </g>
      )}

      {/* Simple dot indicator for sequential connections */}
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