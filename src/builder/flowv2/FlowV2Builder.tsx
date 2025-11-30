import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type OnConnect,
  type OnConnectEnd,
  type OnReconnect,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { StartNode, BlockNode, SubmitNode, DropZoneNode } from "./nodes";
import type { DropZoneNodeData } from "./nodes";
import { ConditionalEdge, SmartEdge } from "./edges";
import { FlowV2Sidebar } from "./FlowV2Sidebar";
import { FlowV2Toolbar } from "./FlowV2Toolbar";
import { pagelessToFlow } from "./utils/flowV2Transforms";
import { useSmartLayout, analyzeFlowStructure } from "./hooks";
import type { FlowV2Mode, BlockNodeData, FlowV2Node, FlowV2Edge, ConditionalEdgeData } from "./types";
import { BlockData } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { NodeConfigPanel } from "../flow/NodeConfigPanel";
import { EdgeLabelProvider, NodeBoundsProvider, useNodeBoundsContext } from "./context";
import type { NodeBounds } from "./context";

// Define custom node types
const nodeTypes: NodeTypes = {
  start: StartNode,
  block: BlockNode,
  submit: SubmitNode,
  dropzone: DropZoneNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
  smart: SmartEdge,
};

// Default edge options - use smart edges for better routing
const defaultEdgeOptions = {
  type: "smart",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#3b82f6",
  },
};

interface FlowV2BuilderProps {
  onClose?: () => void;
}

// Inner component that uses React Flow hooks
const FlowV2BuilderInner: React.FC<FlowV2BuilderProps> = ({ onClose }) => {
  const { state, updateNode } = useSurveyBuilder();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, screenToFlowPosition, getNodes, getEdges } = useReactFlow();

  const [mode, setMode] = useState<FlowV2Mode>("select");
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [configMode, setConfigMode] = useState<"full" | "navigation-only">("full");
  const [flowMetrics, setFlowMetrics] = useState<{ complexity: string; blockCount: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previousNodeCountRef = useRef<number>(0);
  const isInitialRenderRef = useRef(true);

  // Smart layout hooks
  const { applySmartLayout } = useSmartLayout();

  // Node bounds context for edge routing
  const nodeBoundsContext = useNodeBoundsContext();

  // Convert survey data to flow nodes/edges
  const initialFlow = useMemo(() => {
    return pagelessToFlow(state.rootNode);
  }, [state.rootNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges as Edge[]);

  // Update node bounds for edge routing whenever nodes change position or size
  useEffect(() => {
    const bounds: NodeBounds[] = nodes.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      width: node.measured?.width || (node.type === 'block' ? 350 : 150),
      height: node.measured?.height || (node.type === 'block' ? 100 : 50),
    }));
    nodeBoundsContext.updateNodeBounds(bounds);
  }, [nodes, nodeBoundsContext]);

  // Track if this is the very first render (for initial fitView only)
  const hasInitializedRef = useRef(false);

  // Handle initial render ONLY - apply smart layout once nodes are measured
  useEffect(() => {
    // Only run once on first mount
    if (hasInitializedRef.current) return;

    const checkAndLayout = () => {
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const allMeasured = currentNodes.every(
        (n) => n.measured?.width && n.measured?.height
      );

      if (allMeasured && currentNodes.length > 0) {
        // Use smart layout for initial positioning with fitView
        applySmartLayout({
          animate: false,
          fitAfterLayout: true,
          fitPadding: 0.12,
        });

        previousNodeCountRef.current = currentNodes.length;
        hasInitializedRef.current = true;
        isInitialRenderRef.current = false;

        // Update flow metrics for display
        const metrics = analyzeFlowStructure(
          currentNodes as FlowV2Node[],
          currentEdges as FlowV2Edge[]
        );
        setFlowMetrics({
          complexity: metrics.complexity,
          blockCount: metrics.blockNodes,
        });
      }
    };

    // Small delay to allow React Flow to measure nodes
    const timeout = setTimeout(checkAndLayout, 80);
    return () => clearTimeout(timeout);
  }, [nodes, edges, getNodes, getEdges, applySmartLayout]);

  // Update metrics when node count changes (but DON'T re-layout or change viewport)
  useEffect(() => {
    if (!hasInitializedRef.current) return;

    const currentNodeCount = nodes.length;
    if (currentNodeCount !== previousNodeCountRef.current) {
      previousNodeCountRef.current = currentNodeCount;

      // Only update metrics, don't re-layout
      const currentNodes = getNodes();
      const currentEdges = getEdges();
      const metrics = analyzeFlowStructure(
        currentNodes as FlowV2Node[],
        currentEdges as FlowV2Edge[]
      );
      setFlowMetrics({
        complexity: metrics.complexity,
        blockCount: metrics.blockNodes,
      });
    }
  }, [nodes.length, getNodes, getEdges]);

  // Sync nodes when survey data changes - preserve viewport
  useEffect(() => {
    const flow = pagelessToFlow(state.rootNode);
    setNodes(flow.nodes as Node[]);
    setEdges(flow.edges as Edge[]);
    // Don't reset isInitialRenderRef - we want to preserve viewport
  }, [state.rootNode, setNodes, setEdges]);

  // Generate drop zone positions based on provided nodes (not from state to avoid loops)
  // Uses horizontal (LR) layout - drop zones appear between nodes horizontally
  const generateDropZones = useCallback((currentNodes: Node[]): Node<DropZoneNodeData>[] => {
    // Get block nodes sorted by X position (horizontal layout)
    const blockNodes = currentNodes
      .filter((n) => n.type === "block")
      .sort((a, b) => a.position.x - b.position.x);

    // Find the start node position
    const startNode = currentNodes.find((n) => n.type === "start");
    const startX = startNode?.position.x ?? 0;
    const startY = startNode?.position.y ?? 0;
    const startWidth = startNode?.measured?.width || 150;

    // Generate drop zones between blocks and at start/end
    const dropZones: Node<DropZoneNodeData>[] = [];

    if (blockNodes.length === 0) {
      // No blocks - single drop zone after start
      dropZones.push({
        id: "dropzone-start",
        type: "dropzone",
        position: {
          x: startX + startWidth + 40, // Position to the right of start node
          y: startY - 10,
        },
        data: { insertIndex: 0, isFirst: true, isLast: true, isVisible: true },
        draggable: false,
        selectable: false,
        zIndex: 1000,
      });
    } else {
      // Drop zone before first block (after start)
      const firstBlock = blockNodes[0];
      const firstBlockX = firstBlock.position.x;
      dropZones.push({
        id: "dropzone-start",
        type: "dropzone",
        position: {
          x: startX + startWidth + (firstBlockX - startX - startWidth) / 2 - 100,
          y: startY - 10,
        },
        data: { insertIndex: 0, isFirst: true, isVisible: true },
        draggable: false,
        selectable: false,
        zIndex: 1000,
      });

      // Drop zones between each block and after last block
      blockNodes.forEach((node, index) => {
        const nodeWidth = node.measured?.width || 350;
        const nextNode = blockNodes[index + 1];

        if (nextNode) {
          // Between two blocks - position in the gap
          const gapStart = node.position.x + nodeWidth;
          const gapEnd = nextNode.position.x;
          const midX = gapStart + (gapEnd - gapStart) / 2 - 100;

          dropZones.push({
            id: `dropzone-${index + 1}`,
            type: "dropzone",
            position: {
              x: midX,
              y: node.position.y - 10,
            },
            data: { insertIndex: index + 1, isVisible: true },
            draggable: false,
            selectable: false,
            zIndex: 1000,
          });
        } else {
          // After the last block
          dropZones.push({
            id: `dropzone-end`,
            type: "dropzone",
            position: {
              x: node.position.x + nodeWidth + 40,
              y: node.position.y - 10,
            },
            data: { insertIndex: index + 1, isLast: true, isVisible: true },
            draggable: false,
            selectable: false,
            zIndex: 1000,
          });
        }
      });
    }

    return dropZones;
  }, []);

  // Track previous isDragging to detect changes
  const prevIsDraggingRef = useRef(isDragging);

  // Add/remove drop zones when dragging state changes
  useEffect(() => {
    // Only act when isDragging actually changes
    if (prevIsDraggingRef.current === isDragging) return;
    prevIsDraggingRef.current = isDragging;

    if (isDragging) {
      // Add drop zones
      setNodes((currentNodes) => {
        // Remove any existing drop zones first
        const withoutDropZones = currentNodes.filter((n) => n.type !== "dropzone");
        const dropZones = generateDropZones(withoutDropZones);
        return [...withoutDropZones, ...dropZones];
      });
    } else {
      // Remove drop zones
      setNodes((currentNodes) => currentNodes.filter((n) => n.type !== "dropzone"));
    }
  }, [isDragging, generateDropZones, setNodes]);

  // Track connection start for onConnectEnd
  const connectingNodeId = useRef<string | null>(null);

  // Handle connection start - track which node we're connecting from
  const onConnectStart = useCallback((_event: MouseEvent | TouchEvent, params: { nodeId: string | null }) => {
    connectingNodeId.current = params.nodeId;
  }, []);

  // Handle new connection (when dropped on a handle)
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      // Validate connection
      if (!params.source || !params.target) return;

      // Don't allow connections from start to submit directly if there are blocks
      if (params.source === "start" && params.target === "submit") {
        const hasBlocks = nodes.some((n) => n.type === "block");
        if (hasBlocks) return;
      }

      // Create navigation rule on source block
      const sourceNode = nodes.find((n) => n.id === params.source);
      if (sourceNode?.type === "block" && state.rootNode) {
        const blockData = (sourceNode.data as unknown as BlockNodeData).block;
        const targetNode = nodes.find((n) => n.id === params.target);

        let targetString = "";
        if (targetNode?.type === "submit") {
          targetString = "submit";
        } else if (targetNode?.type === "block") {
          const targetBlock = (targetNode.data as unknown as BlockNodeData).block;
          targetString = targetBlock.uuid || targetBlock.fieldName || params.target;
        }

        if (targetString) {
          // Create new navigation rule
          // Prefill with a sensible default condition
          const newRule = {
            condition: `${blockData.fieldName || "field"} == ""`,
            target: targetString,
            isDefault: false,
          };

          const updatedBlock = {
            ...blockData,
            navigationRules: [...(blockData.navigationRules || []), newRule],
          };

          // Update the block in rootNode.items
          const updatedItems = (state.rootNode.items || []).map((item) =>
            (item as BlockData).uuid === blockData.uuid ? updatedBlock : item
          );

          updateNode(state.rootNode.uuid!, {
            ...state.rootNode,
            items: updatedItems,
          });

          // Open config panel to edit the rule immediately
          setConfigNodeId(sourceNode.id);
          setConfigMode("navigation-only");
          setShowNodeConfig(true);
        }
      }

      // Clear the connecting node ref
      connectingNodeId.current = null;
    },
    [nodes, state.rootNode, updateNode]
  );

  // Handle connection end - detect if dropped on a node (not on a handle)
  const onConnectEnd: OnConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const sourceId = connectingNodeId.current;
      if (!sourceId || !state.rootNode) {
        connectingNodeId.current = null;
        return;
      }

      // Get the target element from the event
      const targetElement = (event as MouseEvent).target as HTMLElement;
      if (!targetElement) {
        connectingNodeId.current = null;
        return;
      }

      // Find the closest node element by traversing up the DOM
      const nodeElement = targetElement.closest('.react-flow__node');
      if (!nodeElement) {
        connectingNodeId.current = null;
        return;
      }

      // Get the node ID from the data attribute
      const targetId = nodeElement.getAttribute('data-id');
      if (!targetId || targetId === sourceId) {
        connectingNodeId.current = null;
        return;
      }

      // Find the nodes
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);

      if (!sourceNode || !targetNode) {
        connectingNodeId.current = null;
        return;
      }

      // Don't allow connections from non-block nodes
      if (sourceNode.type !== "block") {
        connectingNodeId.current = null;
        return;
      }

      // Don't allow connections to start node
      if (targetNode.type === "start") {
        connectingNodeId.current = null;
        return;
      }

      // Don't allow connections from start to submit directly if there are blocks
      if (sourceId === "start" && targetId === "submit") {
        const hasBlocks = nodes.some((n) => n.type === "block");
        if (hasBlocks) {
          connectingNodeId.current = null;
          return;
        }
      }

      // Create navigation rule on source block
      const blockData = (sourceNode.data as unknown as BlockNodeData).block;

      let targetString = "";
      if (targetNode.type === "submit") {
        targetString = "submit";
      } else if (targetNode.type === "block") {
        const targetBlock = (targetNode.data as unknown as BlockNodeData).block;
        targetString = targetBlock.uuid || targetBlock.fieldName || targetId;
      }

      if (targetString) {
        // Create new navigation rule
        const newRule = {
          condition: `${blockData.fieldName || "field"} == ""`,
          target: targetString,
          isDefault: false,
        };

        const updatedBlock = {
          ...blockData,
          navigationRules: [...(blockData.navigationRules || []), newRule],
        };

        // Update the block in rootNode.items
        const updatedItems = (state.rootNode.items || []).map((item) =>
          (item as BlockData).uuid === blockData.uuid ? updatedBlock : item
        );

        updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems,
        });

        // Open config panel to edit the rule immediately
        setConfigNodeId(sourceNode.id);
        setConfigMode("navigation-only");
        setShowNodeConfig(true);
      }

      connectingNodeId.current = null;
    },
    [nodes, state.rootNode, updateNode]
  );

  // Track edge being reconnected
  const edgeReconnectSuccessful = useRef(true);

  // Handle edge reconnection start
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  // Handle edge reconnection - this fires when dragging an edge endpoint to a new node
  const onReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;

      if (!state.rootNode || !newConnection.target) return;

      const blocks = (state.rootNode.items || []) as BlockData[];

      // Case 1: Reconnecting the start edge (change which block is first)
      if (oldEdge.source === "start") {
        // The start edge always goes to the first block
        // Moving it means reordering blocks so the new target becomes first
        const targetNode = nodes.find((n) => n.id === newConnection.target);
        if (targetNode?.type !== "block") return;

        const targetBlockIndex = blocks.findIndex(
          (b) => b.uuid === newConnection.target
        );
        if (targetBlockIndex <= 0) return; // Already first or not found

        // Move the target block to the beginning
        const targetBlock = blocks[targetBlockIndex];
        const updatedItems = [
          targetBlock,
          ...blocks.slice(0, targetBlockIndex),
          ...blocks.slice(targetBlockIndex + 1),
        ];

        updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems,
        });
        return;
      }

      // Case 2: Reconnecting a sequential/default edge (reorder blocks)
      // Sequential edges have isSequential=true, no navigationRule
      // We only reorder for truly sequential edges, not for conditional rules marked as default
      const edgeDataForCheck = oldEdge.data as ConditionalEdgeData | undefined;
      const isSequentialEdge = edgeDataForCheck?.isSequential === true;
      const isSequentialFallback = edgeDataForCheck?.isDefault === true && !edgeDataForCheck?.navigationRule && !edgeDataForCheck?.condition;

      if (isSequentialEdge || isSequentialFallback) {
        const sourceNode = nodes.find((n) => n.id === oldEdge.source);
        const targetNode = nodes.find((n) => n.id === newConnection.target);

        if (sourceNode?.type !== "block") return;

        // If connecting to submit, no reorder needed - sequential flow handles it
        if (newConnection.target === "submit") {
          // Move source block to be the last block
          const sourceBlockIndex = blocks.findIndex(
            (b) => b.uuid === oldEdge.source
          );
          if (sourceBlockIndex < 0 || sourceBlockIndex === blocks.length - 1) return;

          const sourceBlock = blocks[sourceBlockIndex];
          const updatedItems = [
            ...blocks.slice(0, sourceBlockIndex),
            ...blocks.slice(sourceBlockIndex + 1),
            sourceBlock,
          ];

          updateNode(state.rootNode.uuid!, {
            ...state.rootNode,
            items: updatedItems,
          });
          return;
        }

        if (targetNode?.type !== "block") return;

        // Reorder blocks so target comes immediately after source
        const sourceBlockIndex = blocks.findIndex(
          (b) => b.uuid === oldEdge.source
        );
        const targetBlockIndex = blocks.findIndex(
          (b) => b.uuid === newConnection.target
        );

        if (sourceBlockIndex < 0 || targetBlockIndex < 0) return;
        if (targetBlockIndex === sourceBlockIndex + 1) return; // Already in order

        // Move target to be right after source
        const targetBlock = blocks[targetBlockIndex];
        const withoutTarget = blocks.filter((_, i) => i !== targetBlockIndex);
        const newSourceIndex = withoutTarget.findIndex(
          (b) => b.uuid === oldEdge.source
        );
        const updatedItems = [
          ...withoutTarget.slice(0, newSourceIndex + 1),
          targetBlock,
          ...withoutTarget.slice(newSourceIndex + 1),
        ];

        updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems,
        });
        return;
      }

      // Case 3: Reconnecting a conditional/navigation edge (update navigation rule target)
      if (oldEdge.data?.navigationRule || oldEdge.data?.condition) {
        const sourceBlock = blocks.find((b) => b.uuid === oldEdge.source);
        if (!sourceBlock || !sourceBlock.navigationRules) return;

        // Find the navigation rule to update
        const edgeData = oldEdge.data as ConditionalEdgeData;
        const ruleCondition = edgeData.condition || edgeData.navigationRule?.condition;
        const oldTarget = oldEdge.target;

        // Determine new target string
        let newTargetString = "";
        if (newConnection.target === "submit") {
          newTargetString = "submit";
        } else {
          const targetBlock = blocks.find((b) => b.uuid === newConnection.target);
          if (!targetBlock) return;
          newTargetString = targetBlock.uuid || "";
        }

        // Update the navigation rule
        const updatedRules = sourceBlock.navigationRules.map((rule) => {
          // Match by condition and old target
          const ruleTarget = rule.target;
          const targetMatches =
            ruleTarget === oldTarget ||
            (ruleTarget === "submit" && oldTarget === "submit");
          const conditionMatches = rule.condition === ruleCondition;

          if (targetMatches && conditionMatches) {
            return { ...rule, target: newTargetString };
          }
          return rule;
        });

        const updatedItems = blocks.map((block) =>
          block.uuid === sourceBlock.uuid
            ? { ...block, navigationRules: updatedRules }
            : block
        );

        updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems,
        });
      }
    },
    [nodes, state.rootNode, updateNode]
  );

  // Handle edge reconnection end - delete edge if dropped on empty space
  const onReconnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, _edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        // Edge was dropped on empty space - this could optionally delete the rule
        // For now, we don't delete on failed reconnect to prevent accidental deletions
        // Users can use the X button on the edge label to delete
      }
      edgeReconnectSuccessful.current = true;
    },
    []
  );

  // Handle drag over for dropping new blocks
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop of new block from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const blockType = event.dataTransfer.getData("application/reactflow");
      if (!blockType || !state.rootNode) return;

      const blockDefinition = state.definitions.blocks[blockType];
      if (!blockDefinition) return;

      // Get drop position
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Find the insertion index based on Y position
      const blockNodes = nodes
        .filter((n) => n.type === "block")
        .sort((a, b) => a.position.y - b.position.y);

      let insertIndex = blockNodes.length;
      for (let i = 0; i < blockNodes.length; i++) {
        if (position.y < blockNodes[i].position.y) {
          insertIndex = i;
          break;
        }
      }

      // Create new block data
      const newBlockData = blockDefinition.generateDefaultData
        ? blockDefinition.generateDefaultData()
        : { ...blockDefinition.defaultData };

      const newBlock: BlockData = {
        ...newBlockData,
        uuid: uuidv4(),
      };

      // Insert block at the correct position
      const currentItems = (state.rootNode.items || []) as BlockData[];
      const updatedItems = [
        ...currentItems.slice(0, insertIndex),
        newBlock,
        ...currentItems.slice(insertIndex),
      ];

      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
    },
    [nodes, state.rootNode, state.definitions.blocks, screenToFlowPosition, updateNode]
  );

  // Handle node double-click for inline editing
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "block") {
      setConfigNodeId(node.id);
      setShowNodeConfig(true);
    }
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (!state.rootNode) return;

      const deletedBlockIds = deletedNodes
        .filter((n) => n.type === "block")
        .map((n) => n.id);

      if (deletedBlockIds.length > 0) {
        const updatedItems = (state.rootNode.items || []).filter(
          (item) => !deletedBlockIds.includes((item as BlockData).uuid || "")
        );

        updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems,
        });
      }
    },
    [state.rootNode, updateNode]
  );

  // Handle node updates from config panel
  const handleNodeUpdate = useCallback(
    (nodeId: string, data: any) => {
      if (!state.rootNode) return;

      const updatedItems = (state.rootNode.items || []).map((item) =>
        (item as BlockData).uuid === nodeId ? { ...item, ...data } : item
      );

      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
    },
    [state.rootNode, updateNode]
  );

  // Reset layout - uses smart layout with animation
  const handleResetLayout = useCallback(() => {
    applySmartLayout({
      animate: true,
      fitAfterLayout: true,
      fitPadding: 0.15,
    });
    previousNodeCountRef.current = getNodes().length;

    // Update metrics
    const currentNodes = getNodes();
    const currentEdges = getEdges();
    const metrics = analyzeFlowStructure(
      currentNodes as FlowV2Node[],
      currentEdges as FlowV2Edge[]
    );
    setFlowMetrics({
      complexity: metrics.complexity,
      blockCount: metrics.blockNodes,
    });
  }, [applySmartLayout, getNodes, getEdges]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v":
          setMode("select");
          break;
        case "c":
          setMode("connect");
          break;
        case "h":
          setMode("pan");
          break;
        case "f":
          fitView({ padding: 0.2 });
          break;
        case "=":
        case "+":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "delete":
        case "backspace":
          // Deletion handled by React Flow
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fitView, zoomIn, zoomOut]);

  // Listen for custom configuration event from nodes
  React.useEffect(() => {
    const handleConfigEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>;
      if (customEvent.detail?.nodeId) {
        setConfigNodeId(customEvent.detail.nodeId);
        setConfigMode("full"); // Use full mode for regular configuration
        setShowNodeConfig(true);
      }
    };

    window.addEventListener('flow-v2-configure-node', handleConfigEvent);
    return () => window.removeEventListener('flow-v2-configure-node', handleConfigEvent);
  }, []);

  // Listen for drop events from drop zone nodes
  React.useEffect(() => {
    const handleDropBlock = (e: Event) => {
      const customEvent = e as CustomEvent<{ blockType: string; insertIndex: number }>;
      const { blockType, insertIndex } = customEvent.detail || {};

      if (!blockType || !state.rootNode) return;

      const blockDefinition = state.definitions.blocks[blockType];
      if (!blockDefinition) return;

      // Create new block data
      const newBlockData = blockDefinition.generateDefaultData
        ? blockDefinition.generateDefaultData()
        : { ...blockDefinition.defaultData };

      const newBlock: BlockData = {
        ...newBlockData,
        uuid: uuidv4(),
      };

      // Insert block at the correct position
      const currentItems = (state.rootNode.items || []) as BlockData[];
      const updatedItems = [
        ...currentItems.slice(0, insertIndex),
        newBlock,
        ...currentItems.slice(insertIndex),
      ];

      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });

      // Hide drop zones after drop
      setIsDragging(false);
    };

    window.addEventListener('flow-v2-drop-block', handleDropBlock);
    return () => window.removeEventListener('flow-v2-drop-block', handleDropBlock);
  }, [state.rootNode, state.definitions.blocks, updateNode]);

  // Listen for delete navigation rule events from edge labels
  React.useEffect(() => {
    const handleDeleteNavigationRule = (e: Event) => {
      const customEvent = e as CustomEvent<{
        sourceNodeId: string;
        targetNodeId: string;
        edgeId: string;
        condition: string;
      }>;
      const { sourceNodeId, targetNodeId, condition } = customEvent.detail || {};

      if (!sourceNodeId || !state.rootNode) return;

      // Find the source block and remove the matching navigation rule
      const updatedItems = (state.rootNode.items || []).map((item) => {
        const block = item as BlockData;
        if (block.uuid === sourceNodeId && block.navigationRules) {
          // Find and remove the navigation rule that matches the target and condition
          const updatedRules = block.navigationRules.filter((rule) => {
            // Match by target and condition
            const ruleTarget = rule.target;
            const ruleCondition = rule.condition;

            // Check if this rule matches - compare target (which could be uuid or "submit")
            // and condition
            const targetMatches =
              ruleTarget === targetNodeId ||
              ruleTarget === "submit" && targetNodeId === "submit";

            const conditionMatches = ruleCondition === condition;

            // Keep the rule if it doesn't match (i.e., remove the one that matches)
            return !(targetMatches && conditionMatches);
          });

          return {
            ...block,
            navigationRules: updatedRules,
          };
        }
        return item;
      });

      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
    };

    window.addEventListener('flow-v2-delete-navigation-rule', handleDeleteNavigationRule);
    return () => window.removeEventListener('flow-v2-delete-navigation-rule', handleDeleteNavigationRule);
  }, [state.rootNode, updateNode]);

  // Handle sidebar drag callbacks - show/hide drop zones
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global drag end detection (in case drag ends outside sidebar)
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <FlowV2Toolbar
        mode={mode}
        onModeChange={setMode}
        onFitView={() => fitView({ padding: 0.2 })}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetLayout={handleResetLayout}
        onClose={onClose}
      />

      <div className="flex-1 flex overflow-hidden">
        <FlowV2Sidebar onDragStart={handleDragStart} onDragEnd={handleDragEnd} />

        <div ref={reactFlowWrapper} className="flex-1 relative">
          <EdgeLabelProvider>
              <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodesDelete={onNodesDelete}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              minZoom={0.1}
              maxZoom={2}
              panOnDrag={mode === "pan" || mode === "select"}
              selectionOnDrag={mode === "select"}
              connectOnClick={mode === "connect"}
              deleteKeyCode={["Backspace", "Delete"]}
              multiSelectionKeyCode={["Shift"]}
              className="bg-slate-50 dark:bg-slate-950"
              // Ensure edges render above nodes
              style={{ zIndex: 0 }}
              elevateEdgesOnSelect
            >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#94a3b8"
            />
            <Controls
              position="bottom-right"
              showInteractive={false}
              className="!shadow-lg !rounded-lg !border !border-slate-200"
            />
            <MiniMap
              position="bottom-left"
              nodeColor={(node) => {
                switch (node.type) {
                  case "start":
                    return "#10b981";
                  case "submit":
                    return "#3b82f6";
                  case "block":
                    return "#6366f1";
                  default:
                    return "#64748b";
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              className="!shadow-lg !border !border-slate-200"
            />

            {/* Mode indicator panel with flow stats */}
            <Panel position="top-right" className="!m-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 dark:text-slate-400">Mode:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {mode}
                  </span>
                </div>
                {mode === "connect" && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                    Click nodes to connect
                  </div>
                )}
                {flowMetrics && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Blocks:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{flowMetrics.blockCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Complexity:</span>
                      <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        flowMetrics.complexity === 'simple'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : flowMetrics.complexity === 'moderate'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>
                        {flowMetrics.complexity}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            {/* Enhanced Legend panel */}
            <Panel position="top-left" className="!m-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-700">
                  Flow Legend
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-0.5 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">Sequential flow</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-0.5 bg-amber-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">Conditional branch</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-0.5 bg-slate-400 rounded-full" style={{ backgroundImage: "repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 8px)" }}></div>
                  <span className="text-slate-600 dark:text-slate-400">Default fallback</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">V</kbd>
                    <span>Select</span>
                    <kbd className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">C</kbd>
                    <span>Connect</span>
                    <kbd className="ml-2 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px]">H</kbd>
                    <span>Pan</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    Drag edge endpoints to reconnect
                  </div>
                </div>
              </div>
            </Panel>
            </ReactFlow>
          </EdgeLabelProvider>
        </div>

        {/* Node configuration panel */}
        <NodeConfigPanel
          nodeId={configNodeId}
          open={showNodeConfig}
          onOpenChange={setShowNodeConfig}
          onUpdate={handleNodeUpdate}
          mode={configMode}
        />
      </div>
    </div>
  );
};

// Wrapper component with ReactFlowProvider and NodeBoundsProvider
export const FlowV2Builder: React.FC<FlowV2BuilderProps> = ({ onClose }) => {
  return (
    <ReactFlowProvider>
      <NodeBoundsProvider>
        <FlowV2BuilderInner onClose={onClose} />
      </NodeBoundsProvider>
    </ReactFlowProvider>
  );
};
