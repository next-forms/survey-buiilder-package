import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  type OnConnect,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { StartNode, BlockNode, SubmitNode } from "./nodes";
import { ConditionalEdge } from "./edges";
import { FlowV2Sidebar } from "./FlowV2Sidebar";
import { FlowV2Toolbar } from "./FlowV2Toolbar";
import { pagelessToFlow, recalculatePositions } from "./utils/flowV2Transforms";
import type { FlowV2Mode, BlockNodeData, FlowV2Node, FlowV2Edge } from "./types";
import { BlockData } from "../../types";
import { v4 as uuidv4 } from "uuid";
import { NodeConfigPanel } from "../flow/NodeConfigPanel";

// Define custom node types
const nodeTypes: NodeTypes = {
  start: StartNode,
  block: BlockNode,
  submit: SubmitNode,
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: "conditional",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#3b82f6",
  },
};

// Inner component that uses React Flow hooks
const FlowV2BuilderInner: React.FC = () => {
  const { state, updateNode } = useSurveyBuilder();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();

  const [mode, setMode] = useState<FlowV2Mode>("select");
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);

  // Convert survey data to flow nodes/edges
  const initialFlow = useMemo(() => {
    return pagelessToFlow(state.rootNode);
  }, [state.rootNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges as Edge[]);

  // Sync nodes when survey data changes
  React.useEffect(() => {
    const flow = pagelessToFlow(state.rootNode);
    setNodes(flow.nodes as Node[]);
    setEdges(flow.edges as Edge[]);
  }, [state.rootNode, setNodes, setEdges]);

  // Handle new connection
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
            condition: `${blockData.fieldName || "field"} != ""`,
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
          setShowNodeConfig(true);
        }
      }
    },
    [nodes, state.rootNode, updateNode]
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

  // Reset layout
  const handleResetLayout = useCallback(() => {
    // Use recalculatePositions with current nodes to leverage measured dimensions (e.g. collapsed state)
    const layoutedNodes = recalculatePositions(nodes as FlowV2Node[], edges as FlowV2Edge[]);
    setNodes(layoutedNodes as Node[]);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, fitView]);

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
        setShowNodeConfig(true);
      }
    };

    window.addEventListener('flow-v2-configure-node', handleConfigEvent);
    return () => window.removeEventListener('flow-v2-configure-node', handleConfigEvent);
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
      />

      <div className="flex-1 flex overflow-hidden">
        <FlowV2Sidebar />

        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
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
              className="!shadow-lg !rounded-lg !border !border-slate-200"
            />

            {/* Mode indicator panel */}
            <Panel position="top-right" className="!m-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md px-3 py-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Mode: </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {mode}
                </span>
                {mode === "connect" && (
                  <span className="ml-2 text-xs text-amber-600">(Click nodes to connect)</span>
                )}
              </div>
            </Panel>

            {/* Legend panel */}
            <Panel position="top-left" className="!m-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
                <div className="font-medium text-slate-700 dark:text-slate-200 mb-2">Legend</div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Sequential flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-amber-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 5px, transparent 5px, transparent 10px)" }}></div>
                  <span className="text-slate-600 dark:text-slate-400">Conditional navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-slate-400" style={{ backgroundImage: "repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 5px, transparent 5px, transparent 10px)" }}></div>
                  <span className="text-slate-600 dark:text-slate-400">Default fallback</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node configuration panel */}
        <NodeConfigPanel
          nodeId={configNodeId}
          open={showNodeConfig}
          onOpenChange={setShowNodeConfig}
          onUpdate={handleNodeUpdate}
          mode="full"
        />
      </div>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const FlowV2Builder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowV2BuilderInner />
    </ReactFlowProvider>
  );
};
