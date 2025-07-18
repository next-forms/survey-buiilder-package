import React, { useState, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { FlowNode, FlowEdge, FlowMode } from "./types";
import { FlowNodeComponent } from "./FlowNodeComponent";
import { FlowEdgeComponent } from "./FlowEdgeComponent";
import { debugLog } from "../../utils/debugUtils";
import { EdgeDragState, validateConnectionWithFeedback, getValidTargets } from "./utils/connectionValidation";
import { calculateEdgeRoutes } from "./utils/edgeRouting";

export interface FlowCanvasRef {
  resetPositions?: () => void;
}

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  mode: FlowMode;
  selectedNodeId: string | null;
  activePageId?: string | null;
  onNodeCreate: (position: { x: number; y: number }, nodeType: string, targetPageId?: string) => void;
  onNodeSelect: (nodeId: string) => void;
  onNodeUpdate: (nodeId: string, data: any) => void;
  onNodePositionUpdate?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeConfigure?: (nodeId: string) => void;
  onModeChange: (mode: FlowMode) => void;
  onFitView?: React.MutableRefObject<(() => void) | undefined>;
  onConnectionCreate?: (sourceNodeId: string, targetNodeId: string) => void;
  onEdgeUpdate?: (edgeId: string, newTarget: string) => void;
  onResetPositions?: () => void;
  enableDebug?: boolean;
}

export const FlowCanvas = forwardRef<FlowCanvasRef, FlowCanvasProps>(({
  nodes,
  edges,
  nodePositions,
  mode,
  selectedNodeId,
  activePageId,
  onNodeCreate,
  onNodeSelect,
  onNodeUpdate,
  onNodePositionUpdate,
  onNodeDelete,
  onNodeConfigure,
  onModeChange,
  onFitView,
  onConnectionCreate,
  onEdgeUpdate,
  onResetPositions,
  enableDebug = false,
}, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    nodeId?: string;
    startPosition?: { x: number; y: number };
    offset?: { x: number; y: number };
    boundaries?: { minX: number; minY: number; maxX: number; maxY: number };
  }>({
    isDragging: false
  });
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<{
    isConnecting: boolean;
    sourceNodeId?: string;
    targetNodeId?: string;
    currentMousePos?: { x: number; y: number };
  }>({
    isConnecting: false
  });
  
  // Edge drag state for connection line pointer dragging
  const [edgeDragState, setEdgeDragState] = useState<EdgeDragState>({
    isDragging: false
  });
  
  // Selected edge state for highlighting
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Pixel grid visibility
  const [showPixelGrid, setShowPixelGrid] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Node creation handler
  const handleNodeCreate = useCallback((position: { x: number; y: number }, nodeType: string, targetPageId?: string) => {
    onNodeCreate(position, nodeType, targetPageId);
  }, [onNodeCreate]);

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    onNodeUpdate(nodeId, data);
  }, [onNodeUpdate]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    onNodeDelete(nodeId);
  }, [onNodeDelete]);

  const handleNodePositionUpdate = useCallback((nodeId: string, position: { x: number; y: number }) => {
    if (onNodePositionUpdate) {
      onNodePositionUpdate(nodeId, position);
    }
  }, [onNodePositionUpdate]);

  const handleConnectionCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    if (onConnectionCreate) {
      onConnectionCreate(sourceNodeId, targetNodeId);
    }
  }, [onConnectionCreate]);

  const handleEdgeUpdate = useCallback((edgeId: string, newTarget: string) => {
    if (onEdgeUpdate) {
      onEdgeUpdate(edgeId, newTarget);
    }
  }, [onEdgeUpdate]);

  // Expose canvas methods to parent component
  useImperativeHandle(ref, () => ({
    resetPositions: onResetPositions
  }), [onResetPositions]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (e.target === canvasRef.current) {
      // Clicked on empty canvas - cancel any connection in progress
      if (connectionState.isConnecting) {
        setConnectionState({ isConnecting: false });
      } else {
        onNodeSelect("");
        setSelectedEdgeId(null); // Clear edge selection
      }
    }
  }, [onNodeSelect, connectionState.isConnecting]);

  // Handle canvas double click to create nodes
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    if (e.target === canvasRef.current) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      
      // Default to creating a page/set node
      handleNodeCreate({ x, y }, "set");
    }
  }, [handleNodeCreate, viewport]);

  // Find which page (if any) contains the given coordinates
  const findPageAtPosition = useCallback((x: number, y: number) => {
    return nodes.find(node => {
      if (node.type !== "set") return false;
      
      const nodeData = node.data as any;
      const containerSize = nodeData?.containerSize || { width: 400, height: 300 };
      
      return x >= node.position.x && 
             x <= node.position.x + containerSize.width &&
             y >= node.position.y && 
             y <= node.position.y + containerSize.height;
    });
  }, [nodes]);

  // Handle drag over for drop functionality
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    
    // Check if dragging over a page node
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
    
    const targetPage = findPageAtPosition(x, y);
    setDragOverPageId(targetPage?.id || null);
  }, [viewport, findPageAtPosition]);

  // Handle drop functionality with smart page detection
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const nodeType = e.dataTransfer.getData("application/flow-node");
    if (nodeType) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      
      // Check if dropping on a specific page
      const targetPage = findPageAtPosition(x, y);
      
      if (targetPage && nodeType !== "set") {
        // Dropping a block onto a specific page
        debugLog(enableDebug, `Dropping ${nodeType} block onto page:`, targetPage.id);
        
        // Calculate position within the page container
        const pageData = targetPage.data as any;
        const containerSize = pageData?.containerSize || { width: 400, height: 300 };
        
        // Position relative to page with some padding and header offset
        const relativeX = Math.max(10, Math.min(containerSize.width - 190, x - targetPage.position.x));
        const relativeY = Math.max(60, Math.min(containerSize.height - 90, y - targetPage.position.y));
        
        const blockPosition = {
          x: targetPage.position.x + relativeX,
          y: targetPage.position.y + relativeY
        };
        
        // Create the block with a custom handler that specifies the target page
        handleNodeCreate(blockPosition, nodeType, targetPage.id);
      } else {
        // Default behavior for pages or blocks dropped on empty canvas
        handleNodeCreate({ x, y }, nodeType);
      }
    }
    
    // Clear drag over state
    setDragOverPageId(null);
  }, [handleNodeCreate, viewport, findPageAtPosition]);

  // Handle edge click for selection
  const handleEdgeClick = useCallback((edgeId: string) => {
    setSelectedEdgeId(edgeId);
    // Clear node selection when selecting an edge
    onNodeSelect('');
  }, [onNodeSelect]);

  // Handle edge drag start
  const handleEdgeDragStart = useCallback((edgeId: string, initialPosition: { x: number; y: number }) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (!sourceNode) return;
    
    // Get valid targets for this edge
    const validTargets = getValidTargets(sourceNode, edge.type || "default", nodes, edges, edgeId);
    
    debugLog(enableDebug, `Starting edge drag for edge ${edgeId} from ${edge.source} to ${edge.target}`);
    debugLog(enableDebug, `Initial position:`, initialPosition);
    debugLog(enableDebug, `Valid targets:`, validTargets);
    debugLog(enableDebug, `Viewport:`, viewport);
    
    debugLog(enableDebug, `Starting edge drag for edge ${edgeId} from ${edge.source} to ${edge.target}`);
    debugLog(enableDebug, `Valid targets:`, validTargets);
    
    setEdgeDragState({
      isDragging: true,
      edgeId,
      originalTarget: edge.target,
      currentPosition: initialPosition,
      validTargets
    });
  }, [edges, nodes, enableDebug, viewport]);

  // Handle edge drag move
  const handleEdgeDragMove = useCallback((edgeId: string, position: { x: number; y: number }) => {
    if (edgeDragState.isDragging && edgeDragState.edgeId === edgeId) {
      setEdgeDragState(prev => ({
        ...prev,
        currentPosition: position
      }));
    }
  }, [edgeDragState]);

  // Handle edge drag end
  const handleEdgeDragEnd = useCallback((edgeId: string, targetNodeId: string | null) => {
    if (!edgeDragState.isDragging || edgeDragState.edgeId !== edgeId) return;
    
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) {
      setEdgeDragState({ isDragging: false });
      return;
    }
    
    if (targetNodeId && targetNodeId !== edge.target) {
      // Validate the connection
      const validation = validateConnectionWithFeedback(
        edge.source,
        targetNodeId,
        edge.type || "default",
        nodes,
        edges,
        edgeId
      );
      
      if (validation.isValid) {
        debugLog(enableDebug, `Updating edge ${edgeId} from ${edge.target} to ${targetNodeId}`);
        handleEdgeUpdate(edgeId, targetNodeId);
      } else {
        debugLog(enableDebug, `Invalid connection: ${validation.message}`);
        // Could show a toast notification here
      }
    }
    
    setEdgeDragState({ isDragging: false });
  }, [edgeDragState, edges, nodes, handleEdgeUpdate, enableDebug]);

  // Get boundary constraints for a node
  const getBoundaryConstraints = useCallback((nodeId: string, type: string = "bounds") => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Block nodes must stay within their parent page
    if (node.type === "block") {
      const blockMatch = nodeId.match(/^(.+)-block-(\d+)$/);
      if (blockMatch) {
        const [, pageUuid] = blockMatch;
        const parentPage = nodes.find(n => n.id === pageUuid && n.type === "set");
        if (parentPage) {
          const pageData = parentPage.data as any;
          const containerSize = pageData?.containerSize || { width: 300, height: 200 };
          const nodeData = node.data as any;
          const blockSize = nodeData?.containerSize || { width: 120, height: 60 };
          const nodeZoomScale = Math.max(0.7, Math.min(1, viewport.zoom));
          const containerWidth = containerSize.width * nodeZoomScale;
          const containerHeight = containerSize.height * nodeZoomScale;
          const blockWidth = blockSize.width * nodeZoomScale;
          const blockHeight = blockSize.height * nodeZoomScale;
          if(type === "position") {
            return {
              minX: parentPage.position.x + 15, // 15px padding
              minY: parentPage.position.y + 35, // 35px for page header
              maxX: parentPage.position.x + containerWidth - blockWidth - 15,
              maxY: parentPage.position.y + containerHeight - blockHeight - 15
            };
          }
          return {
            minX: parentPage.position.x + 15, // 15px padding
            minY: parentPage.position.y + 35, // 35px for page header
            maxX: parentPage.position.x + containerWidth - 15,
            maxY: parentPage.position.y + containerHeight - 15
          };
        }
      }
    }

    // Page nodes can move freely since we removed the section container
    if (node.type === "set") {
      // Allow pages to move freely without strict boundaries
      return null;
    }

    return null;
  }, [nodes, viewport.zoom]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - (node.position.x * viewport.zoom + viewport.x);
    const offsetY = e.clientY - rect.top - (node.position.y * viewport.zoom + viewport.y);
    
    // Get boundary constraints for visual feedback
    const boundaries = getBoundaryConstraints(nodeId);
    
    setDragState({
      isDragging: true,
      nodeId,
      startPosition: { x: e.clientX, y: e.clientY },
      offset: { x: offsetX, y: offsetY },
      boundaries: boundaries || undefined
    });
    
    onNodeSelect(nodeId);
  }, [nodes, viewport, onNodeSelect, getBoundaryConstraints]);

  // Apply boundary constraints to position
  const constrainPosition = useCallback((nodeId: string, x: number, y: number) => {
    const constraints = getBoundaryConstraints(nodeId, "position");
    if (!constraints) return { x, y };

    return {
      x: Math.max(constraints.minX, Math.min(constraints.maxX, x)),
      y: Math.max(constraints.minY, Math.min(constraints.maxY, y))
    };
  }, [getBoundaryConstraints]);

  // Handle node selection with connection logic
  const handleNodeSelectWithConnection = useCallback((nodeId: string) => {
    debugLog(enableDebug, "Node selected:", nodeId, "Connection state:", connectionState);
    
    // Handle connection mode
    if (mode === "connect") {
      if (connectionState.isConnecting && connectionState.sourceNodeId) {
        // Complete the connection
        if (nodeId !== connectionState.sourceNodeId) {
          const sourceNode = nodes.find(n => n.id === connectionState.sourceNodeId);
          const targetNode = nodes.find(n => n.id === nodeId);
          
          // Apply user constraints: Only allow connections from blocks (not sets/sections) to any valid target
          if (sourceNode?.type === "block" && (targetNode?.type === "block" || targetNode?.type === "set" || targetNode?.type === "submit")) {
            handleConnectionCreate(connectionState.sourceNodeId, nodeId);
          }
        }
        // Reset connection state
        setConnectionState({ isConnecting: false });
      } else {
        // Start a new connection from this node (only if it's a block, not set/section)
        const node = nodes.find(n => n.id === nodeId);
        if (node?.type === "block") {
          debugLog(enableDebug, "Starting connection from block:", nodeId);
          setConnectionState({
            isConnecting: true,
            sourceNodeId: nodeId
          });
        } else {
          debugLog(enableDebug, "Cannot start connection from non-block node:", { nodeId, nodeType: node?.type });
        }
      }
      return;
    }
    
    // Normal selection behavior
    onNodeSelect(nodeId);
    setSelectedEdgeId(null); // Clear edge selection when selecting a node
  }, [mode, connectionState, nodes, handleConnectionCreate, onNodeSelect]);

  // Handle mouse move for dragging and panning - optimized for smoothness
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection and other browser defaults
    e.stopPropagation(); // Prevent event bubbling
    
    // Track mouse position for pixel grid display
    if (showPixelGrid && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const worldX = Math.round((e.clientX - rect.left - viewport.x) / viewport.zoom);
      const worldY = Math.round((e.clientY - rect.top - viewport.y) / viewport.zoom);
      setMousePosition({ x: worldX, y: worldY });
    }
    
    if (edgeDragState.isDragging && edgeDragState.edgeId) {
      // Edge dragging - convert screen coordinates to world coordinates
      const rect = canvasRef.current!.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      
      // Convert from screen coordinates to world coordinates
      const worldX = (screenX - viewport.x) / viewport.zoom;
      const worldY = (screenY - viewport.y) / viewport.zoom;
      
      debugLog(enableDebug, "Edge drag move:", { 
        screenX, 
        screenY,
        viewport, 
        worldX, 
        worldY,
        edgeId: edgeDragState.edgeId
      });
      
      handleEdgeDragMove(edgeDragState.edgeId, { x: worldX, y: worldY });
    } else if (dragState.isDragging && dragState.nodeId) {
      // Node dragging with boundary constraints - simplified for performance
      const rect = canvasRef.current!.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - viewport.x - (dragState.offset?.x || 0)) / viewport.zoom;
      const rawY = (e.clientY - rect.top - viewport.y - (dragState.offset?.y || 0)) / viewport.zoom;
      
      // Only apply constraints for blocks and pages, not section to improve performance
      const node = nodes.find(n => n.id === dragState.nodeId);
      let finalPos = { x: rawX, y: rawY };
      
      if (node && node.type !== "section") {
        finalPos = constrainPosition(dragState.nodeId, rawX, rawY);
      }
      
      // Update node position using the position update handler
      if (dragState.nodeId) {
        handleNodePositionUpdate(dragState.nodeId, finalPos);
      }
    } else if (isPanning) {
      // Canvas panning - improved responsiveness
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [dragState, isPanning, lastPanPoint, viewport, constrainPosition, nodes]);

  // Handle mouse up
  const handleMouseUp = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent event bubbling
    }
    
    // Handle edge drag end
    if (edgeDragState.isDragging && edgeDragState.edgeId) {
      let targetNodeId: string | null = null;
      
      // Check if we're dropping on a valid target node
      if (e) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const x = (screenX - viewport.x) / viewport.zoom;
        const y = (screenY - viewport.y) / viewport.zoom;
        
        debugLog(enableDebug, "Edge drag end at:", { screenX, screenY, worldX: x, worldY: y });
        
        // Find the node at this position - prioritize blocks over pages
        const hitNodes = nodes.filter(node => {
          const nodeData = node.data as any;
          const containerSize = nodeData?.containerSize || { width: 120, height: 60 };
          
          // Give blocks a more forgiving hit area (expand by 20px on all sides)
          const padding = node.type === "block" ? 20 : 0;
          
          const hitTest = x >= (node.position.x - padding) && 
                         x <= (node.position.x + containerSize.width + padding) &&
                         y >= (node.position.y - padding) && 
                         y <= (node.position.y + containerSize.height + padding);
          
          if (node.type === "block" || hitTest) {
            debugLog(enableDebug, `Hit test for node ${node.id}:`, {
              nodePos: node.position,
              containerSize,
              mousePos: { x, y },
              hitTest,
              nodeType: node.type,
              isValidTarget: edgeDragState.validTargets?.includes(node.id),
              padding: padding,
              bounds: {
                left: node.position.x - padding,
                right: node.position.x + containerSize.width + padding,
                top: node.position.y - padding,
                bottom: node.position.y + containerSize.height + padding
              }
            });
          }
          
          return hitTest;
        });
        
        // Prioritize blocks over pages, and only consider valid targets
        const targetNode = hitNodes.find(node => 
          node.type === "block" && edgeDragState.validTargets?.includes(node.id)
        ) || hitNodes.find(node => 
          edgeDragState.validTargets?.includes(node.id)
        );
        
        if (targetNode && edgeDragState.validTargets?.includes(targetNode.id)) {
          targetNodeId = targetNode.id;
          debugLog(enableDebug, "Valid target found:", targetNodeId);
        } else {
          debugLog(enableDebug, "No valid target found or not in valid targets list");
        }
      }
      
      handleEdgeDragEnd(edgeDragState.edgeId, targetNodeId);
    }
    
    setDragState({ isDragging: false });
    setIsPanning(false);
  }, [edgeDragState, nodes, viewport, handleEdgeDragEnd]);

  // Handle mouse leave to stop dragging/panning when leaving inner canvas
  const handleCanvasInnerMouseLeave = useCallback(() => {
    setDragState({ isDragging: false });
    setIsPanning(false);
    
    // Also stop edge dragging
    if (edgeDragState.isDragging && edgeDragState.edgeId) {
      handleEdgeDragEnd(edgeDragState.edgeId, null);
    }
  }, [edgeDragState, handleEdgeDragEnd]);

  // Handle pan start
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    // Don't allow panning if we're dragging an edge
    if (edgeDragState.isDragging) {
      return;
    }
    
    // Allow panning when:
    // 1. In pan mode and clicking on canvas background
    // 2. Middle mouse button anywhere
    // 3. In select mode and clicking on canvas background (not on nodes)
    // 4. Right mouse button for context panning
    const target = e.target as HTMLElement;
    const isCanvasBackground = target === canvasRef.current || 
                              // Check if we're clicking inside the canvas but not on nodes
                              (canvasRef.current?.contains(target) && 
                               !target.closest('.flow-node'));
    
    const shouldPan = (mode === "pan") || 
                      e.button === 1 || // Middle mouse button
                      e.button === 2 || // Right mouse button for panning
                      (e.button === 0 && isCanvasBackground && mode === "select");
    
    if (shouldPan) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling
    }
  }, [mode, edgeDragState.isDragging]);

  // Handle zoom with better control
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Always prevent default to stop page scrolling when over canvas
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom by default, pan when Ctrl/Cmd is held
    if (e.ctrlKey || e.metaKey) {
      // Pan mode - scroll to move the canvas when modifier is held
      const panSpeed = 1.5;
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX * panSpeed,
        y: prev.y - e.deltaY * panSpeed
      }));
    } else {
      // Zoom mode - default behavior
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      const newZoom = Math.max(0.2, Math.min(3, viewport.zoom * zoomFactor));
      
      if (newZoom === viewport.zoom) return;
      
      // Zoom towards mouse position
      const zoomRatio = newZoom / viewport.zoom;
      setViewport(prev => ({
        ...prev,
        zoom: newZoom,
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }));
    }
  }, [viewport]);

  // Handle zoom in/out with buttons
  const handleZoomIn = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const zoomFactor = 1.2;
    const newZoom = Math.min(3, viewport.zoom * zoomFactor);
    
    if (newZoom === viewport.zoom) return;
    
    // Zoom towards center
    const zoomRatio = newZoom / viewport.zoom;
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      x: centerX - (centerX - prev.x) * zoomRatio,
      y: centerY - (centerY - prev.y) * zoomRatio
    }));
  }, [viewport]);

  const handleZoomOut = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const zoomFactor = 1 / 1.2;
    const newZoom = Math.max(0.2, viewport.zoom * zoomFactor);
    
    if (newZoom === viewport.zoom) return;
    
    // Zoom towards center
    const zoomRatio = newZoom / viewport.zoom;
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      x: centerX - (centerX - prev.x) * zoomRatio,
      y: centerY - (centerY - prev.y) * zoomRatio
    }));
  }, [viewport]);

  // Fit view to show all nodes
  const fitView = useCallback(() => {
    if (nodes.length === 0 || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 100;
    
    // Calculate bounds of all nodes
    const bounds = nodes.reduce((acc, node) => {
      const nodeWidth = 300; // Estimated node width
      const nodeHeight = 200; // Estimated node height
      
      return {
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + nodeWidth),
        maxY: Math.max(acc.maxY, node.position.y + nodeHeight)
      };
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // Calculate zoom to fit content
    const zoomX = (rect.width - padding * 2) / contentWidth;
    const zoomY = (rect.height - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%
    
    // Center the content
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    
    setViewport({
      x: centerX - contentCenterX * newZoom,
      y: centerY - contentCenterY * newZoom,
      zoom: newZoom
    });
  }, [nodes]);

  // Reset view to center nodes at 100% zoom
  const resetView = useCallback(() => {
    // First reset the positions if handler is available
    if (onResetPositions) {
      onResetPositions();
    }
    
    if (nodes.length === 0 || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 100;
    
    // Calculate bounds of all nodes
    const bounds = nodes.reduce((acc, node) => {
      const nodeWidth = 300; // Estimated node width
      const nodeHeight = 200; // Estimated node height
      
      return {
        minX: Math.min(acc.minX, node.position.x),
        minY: Math.min(acc.minY, node.position.y),
        maxX: Math.max(acc.maxX, node.position.x + nodeWidth),
        maxY: Math.max(acc.maxY, node.position.y + nodeHeight)
      };
    }, {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    });
    
    const contentWidth = bounds.maxX - bounds.minX;
    const contentHeight = bounds.maxY - bounds.minY;
    
    // Calculate zoom to fit content
    const zoomX = (rect.width - padding * 2) / contentWidth;
    const zoomY = (rect.height - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%
    
    // Center the content
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const contentCenterX = (bounds.minX + bounds.maxX) / 2;
    const contentCenterY = (bounds.minY + bounds.maxY) / 2;
    
    setViewport({
      x: centerX - contentCenterX * newZoom,
      y: centerY - contentCenterY * newZoom,
      zoom: newZoom
    });
  }, [nodes, onResetPositions]);

  // Expose fit view to parent
  React.useEffect(() => {
    if (onFitView) {
      onFitView.current = fitView;
    }
  }, [fitView, onFitView]);

  // Global mouse event handling for edge dragging
  React.useEffect(() => {
    if (!edgeDragState.isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current || !edgeDragState.isDragging) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldX = (screenX - viewport.x) / viewport.zoom;
      const worldY = (screenY - viewport.y) / viewport.zoom;
      
      debugLog(enableDebug, "Global mouse move during edge drag:", { screenX, screenY, worldX, worldY });
      
      if (edgeDragState.edgeId) {
        handleEdgeDragMove(edgeDragState.edgeId, { x: worldX, y: worldY });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!canvasRef.current || !edgeDragState.isDragging || !edgeDragState.edgeId) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldX = (screenX - viewport.x) / viewport.zoom;
      const worldY = (screenY - viewport.y) / viewport.zoom;
      
      debugLog(enableDebug, "Global mouse up during edge drag:", { screenX, screenY, worldX, worldY });
      
      // Find target node - prioritize blocks over pages
      let targetNodeId: string | null = null;
      const hitNodes = nodes.filter(node => {
        const nodeData = node.data as any;
        const containerSize = nodeData?.containerSize || { width: 120, height: 60 };
        
        // Give blocks a more forgiving hit area
        const padding = node.type === "block" ? 20 : 0;
        
        return worldX >= (node.position.x - padding) && 
               worldX <= (node.position.x + containerSize.width + padding) &&
               worldY >= (node.position.y - padding) && 
               worldY <= (node.position.y + containerSize.height + padding);
      });
      
      const targetNode = hitNodes.find(node => 
        node.type === "block" && edgeDragState.validTargets?.includes(node.id)
      ) || hitNodes.find(node => 
        edgeDragState.validTargets?.includes(node.id)
      );
      
      if (targetNode && edgeDragState.validTargets?.includes(targetNode.id)) {
        targetNodeId = targetNode.id;
        debugLog(enableDebug, "Global valid target found:", targetNodeId);
      }
      
      handleEdgeDragEnd(edgeDragState.edgeId, targetNodeId);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [edgeDragState.isDragging, edgeDragState.edgeId, edgeDragState.validTargets, viewport, nodes, handleEdgeDragMove, handleEdgeDragEnd]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return; // Only when not focused on input
      
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        fitView();
      } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        resetView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitView, resetView]);

  // Expose fit view to parent
  React.useEffect(() => {
    fitView();
  }, []);

  // Render nodes and edges
  const renderedNodes = useMemo(() => {
    return nodes.map(node => (
      <FlowNodeComponent
        key={node.id}
        node={node}
        selected={selectedNodeId === node.id}
        isActive={activePageId === node.id && node.type === "set"}
        onSelect={handleNodeSelectWithConnection}
        onDragStart={handleNodeDragStart}
        onDelete={handleNodeDelete}
        onConfigure={onNodeConfigure}
        zoom={viewport.zoom}
        isDragOver={dragOverPageId === node.id}
        isConnecting={connectionState.isConnecting}
        connectionSourceId={connectionState.sourceNodeId}
      />
    ));
  }, [nodes, selectedNodeId, handleNodeSelectWithConnection, handleNodeDragStart, handleNodeDelete, onNodeConfigure, viewport.zoom, dragOverPageId, connectionState]);

  // Calculate edge routes to avoid overlaps
  const edgeRoutes = useMemo(() => {
    return calculateEdgeRoutes(edges, nodes, viewport.zoom);
  }, [edges, nodes, viewport.zoom]);

  const renderedEdges = useMemo(() => {
    return edges.map(edge => (
      <FlowEdgeComponent
        key={edge.id}
        edge={edge}
        nodes={nodes}
        zoom={viewport.zoom}
        viewport={viewport}
        edgeRoute={edgeRoutes.get(edge.id)}
        dragState={edgeDragState}
        selected={selectedEdgeId === edge.id}
        onEdgeClick={handleEdgeClick}
        onEdgeDragStart={handleEdgeDragStart}
        onEdgeDragMove={handleEdgeDragMove}
        onEdgeDragEnd={handleEdgeDragEnd}
      />
    ));
  }, [edges, nodes, viewport, edgeRoutes, edgeDragState, selectedEdgeId, handleEdgeClick, handleEdgeDragStart, handleEdgeDragMove, handleEdgeDragEnd]);

  // Handle context menu to prevent interference with right-click panning
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);


  // Track mouse over canvas
  const handleCanvasMouseEnter = useCallback(() => {
    // Mouse entered canvas
  }, []);

  // Track mouse leave canvas
  const handleCanvasMouseLeave = useCallback(() => {
    // Stop any active dragging/panning
    setDragState({ isDragging: false });
    setIsPanning(false);
    
    // Also stop edge dragging
    if (edgeDragState.isDragging && edgeDragState.edgeId) {
      handleEdgeDragEnd(edgeDragState.edgeId, null);
    }
  }, [edgeDragState, handleEdgeDragEnd]);

  return (
    <div 
      className="flow-canvas relative w-full h-full overflow-hidden bg-muted"
      onMouseEnter={handleCanvasMouseEnter}
      onMouseLeave={handleCanvasMouseLeave}
    >
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          cursor: isPanning ? "grabbing" : 
                  mode === "pan" ? "grab" : 
                  mode === "connect" ? "crosshair" : "default",
          touchAction: "none" // Prevent touch scrolling/zooming
        }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleCanvasInnerMouseLeave}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOverPageId(null)}
        onDrop={handleDrop}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`
          }}
        />
        
        {/* Pixel location grid overlay */}
        {showPixelGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255, 0, 0, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 0, 0, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${50 * viewport.zoom}px ${50 * viewport.zoom}px`,
              backgroundPosition: `${viewport.x}px ${viewport.y}px`
            }}
          />
        )}
        
        {/* Pixel coordinates at regular intervals */}
        {showPixelGrid && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.ceil(4000 / 100) }, (_, i) => (
              <div key={`x-${i}`} className="absolute">
                {Array.from({ length: Math.ceil(4000 / 100) }, (_, j) => {
                  const x = i * 100;
                  const y = j * 100;
                  const screenX = x * viewport.zoom + viewport.x;
                  const screenY = y * viewport.zoom + viewport.y;
                  
                  // Only show if visible on screen
                  if (screenX < -50 || screenX > 2000 || screenY < -50 || screenY > 2000) {
                    return null;
                  }
                  
                  return (
                    <div
                      key={`coord-${i}-${j}`}
                      className="absolute text-xs text-red-600 bg-white/80 px-1 rounded shadow-sm font-mono"
                      style={{
                        left: screenX,
                        top: screenY,
                        fontSize: `${10 * viewport.zoom}px`,
                        transform: `scale(${1 / viewport.zoom})`,
                        transformOrigin: 'top left'
                      }}
                    >
                      {x},{y}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Transform container */}
        <div
          className="absolute"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {/* Boundary visualization when dragging */}
          {dragState.isDragging && dragState.boundaries && (
            <div
              className="absolute border-2 border-primary border-dashed bg-primary/20 pointer-events-none"
              style={{
                left: dragState.boundaries.minX,
                top: dragState.boundaries.minY,
                width: dragState.boundaries.maxX - dragState.boundaries.minX,
                height: dragState.boundaries.maxY - dragState.boundaries.minY,
                zIndex: 10
              }}
            >
              <div className="absolute top-2 left-2 text-xs text-primary bg-background/80 px-1 rounded">
                Allowed area
              </div>
            </div>
          )}

          {/* Valid drop targets visualization when dragging edges */}
          {edgeDragState.isDragging && edgeDragState.validTargets && (
            <>
              {edgeDragState.validTargets.map(targetId => {
                const targetNode = nodes.find(n => n.id === targetId);
                if (!targetNode) return null;
                
                const nodeData = targetNode.data as any;
                const containerSize = nodeData?.containerSize || { width: 120, height: 60 };
                
                return (
                  <div
                    key={targetId}
                    className="absolute border-4 border-green-500 border-solid bg-green-500/30 pointer-events-none rounded"
                    style={{
                      left: targetNode.position.x - 8,
                      top: targetNode.position.y - 8,
                      width: containerSize.width + 16,
                      height: containerSize.height + 16,
                      zIndex: 15
                    }}
                  >
                    <div className="absolute -top-8 left-2 text-sm font-bold text-green-800 bg-green-100 px-3 py-1 rounded shadow-lg border border-green-500">
                      🎯 {targetNode.type} 
                    </div>
                    <div className="absolute top-2 left-2 text-xs text-green-700 bg-white/90 px-1 rounded">
                      {targetId.includes('block-') ? `Block ${targetId.split('block-')[1]}` : targetId}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Connection mode: highlight valid targets when starting a connection */}
          {mode === "connect" && connectionState.isConnecting && connectionState.sourceNodeId && (
            <>
              {nodes.filter(node => {
                // Only show valid targets: blocks, sets, submit (but not the source)
                return node.id !== connectionState.sourceNodeId && 
                       (node.type === "block" || node.type === "set" || node.type === "submit");
              }).map(targetNode => {
                const nodeData = targetNode.data as any;
                const containerSize = nodeData?.containerSize || { width: 120, height: 60 };
                
                return (
                  <div
                    key={targetNode.id}
                    className="absolute border-4 border-blue-500 border-dashed bg-blue-500/20 pointer-events-none rounded animate-pulse"
                    style={{
                      left: targetNode.position.x - 8,
                      top: targetNode.position.y - 8,
                      width: containerSize.width + 16,
                      height: containerSize.height + 16,
                      zIndex: 12
                    }}
                  >
                    <div className="absolute -top-8 left-2 text-sm font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded shadow-lg border border-blue-500">
                      📍 Click to connect
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Edges */}
          <svg 
            className="absolute inset-0" 
            style={{ 
              width: "100%", 
              height: "100%",
              zIndex: 5,
              overflow: "visible",
              pointerEvents: "none"
            }}
            preserveAspectRatio="none"
          >
            
            {renderedEdges}
            
            {/* Arrow marker definitions */}
            <defs>
              {/* Default arrowhead for page-to-block and sequential connections */}
              <marker
                id="arrowhead-default"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
              
              {/* Conditional arrowhead for navigation rules */}
              <marker
                id="arrowhead-conditional"
                markerWidth="12"
                markerHeight="8"
                refX="11"
                refY="4"
                orient="auto"
              >
                <polygon
                  points="0 0, 12 4, 0 8"
                  fill="#3b82f6"
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                />
              </marker>
              
              {/* Legacy markers for backward compatibility */}
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#f59e0b"
                />
              </marker>
              <marker
                id="arrowhead-gray"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          <div className="relative">
            {renderedNodes}
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg">
        <div className="flex flex-col">
          <button
            onClick={handleZoomIn}
            className="px-3 py-2 text-lg font-bold text-foreground hover:bg-accent rounded-t-lg transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <div className="px-3 py-1 text-xs text-center text-muted-foreground border-t border-b border-border">
            {Math.round(viewport.zoom * 100)}%
          </div>
          <button
            onClick={handleZoomOut}
            className="px-3 py-2 text-lg font-bold text-foreground hover:bg-accent rounded-b-lg transition-colors"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>
      
      
      {/* Pixel Grid Toggle */}
      {/* <div className="absolute top-4 right-24 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg">
        <button
          onClick={() => setShowPixelGrid(!showPixelGrid)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            showPixelGrid 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'text-foreground hover:bg-accent'
          }`}
          title="Toggle pixel grid overlay"
        >
          📐 Grid
        </button>
      </div> */}
      
      {/* Mouse Position Display */}
      {showPixelGrid && mousePosition && (
        <div className="absolute top-16 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg font-mono text-sm">
          x: {mousePosition.x}, y: {mousePosition.y}
        </div>
      )}

      {/* Connection Lines Legend */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-foreground border border-border shadow-lg">
        <div className="font-medium text-xs mb-2 text-muted-foreground">Connection Types</div>
        <div className="space-y-1.5">
          {/* Start Connection */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#22c55e"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#legend-arrow-green)"
              />
              <defs>
                <marker
                  id="legend-arrow-green"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#22c55e" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Start</span>
          </div>
          
          {/* Page Entry */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#10b981"
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#legend-arrow-emerald)"
              />
              <defs>
                <marker
                  id="legend-arrow-emerald"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#10b981" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Page Entry</span>
          </div>
          
          {/* Page to Page */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#legend-arrow-blue)"
              />
              <defs>
                <marker
                  id="legend-arrow-blue"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Page Flow</span>
          </div>
          
          {/* Sequential */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="none"
                markerEnd="url(#legend-arrow-gray)"
              />
              <defs>
                <marker
                  id="legend-arrow-gray"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Sequential</span>
          </div>
          
          {/* Conditional - Default */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#f59e0b"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#legend-arrow-orange)"
              />
              <defs>
                <marker
                  id="legend-arrow-orange"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#f59e0b" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Default Rule</span>
          </div>
          
          {/* Conditional - Navigation */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#legend-arrow-blue-nav)"
              />
              <defs>
                <marker
                  id="legend-arrow-blue-nav"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Navigation Rule</span>
          </div>
          
          {/* Sequential with Navigation Rules */}
          <div className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <path
                d="M 2 4 L 22 4"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3,2"
                fill="none"
                markerEnd="url(#legend-arrow-gray-dashed)"
              />
              <defs>
                <marker
                  id="legend-arrow-gray-dashed"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs">Fallback Flow</span>
          </div>
        </div>
      </div>

      {/* Canvas info and controls */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-foreground border border-border">
        <div>Mode: {mode}</div>
        <div>Zoom: {Math.round(viewport.zoom * 100)}%</div>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
          <div>• Scroll to zoom in/out</div>
          <div>• Ctrl+Scroll to pan canvas</div>
          <div>• Drag background to pan</div>
          <div>• Middle/Right-click to pan</div>
          <div>• Double-click to add page</div>
          {mode === "connect" && (
            <>
              <div className="text-primary font-medium">Connection Mode:</div>
              <div>• Click block to start connection</div>
              <div>• Click target to complete</div>
            </>
          )}
          <div>• Press 'F' to fit view</div>
          <div>• Press 'R' to reset view</div>
        </div>
        <div className="mt-2 flex gap-1">
          <button
            onClick={fitView}
            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            title="Fit to view"
          >
            Fit All
          </button>
          <button
            onClick={resetView}
            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
});