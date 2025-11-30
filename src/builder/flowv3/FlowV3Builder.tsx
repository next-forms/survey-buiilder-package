import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
  type OnConnect,
  type OnConnectEnd,
  Connection,
  Panel,
  useNodesInitialized,
  OnConnectStart
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";

import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { SurveyNode } from "./nodes/SurveyNode";
import { ButtonEdge } from "./edges/ButtonEdge";
import { getLayoutedElements } from "./utils/layout";
import type { BlockData } from "../../types";
import { FlowV2Sidebar } from "../flowv2/FlowV2Sidebar";
import { FlowV2Toolbar } from "../flowv2/FlowV2Toolbar";
import type { FlowV2Mode } from "../flowv2/types";
import { NodeConfigPanel } from "../flow/NodeConfigPanel";
import { Button } from "../../components/ui/button";
import { Plus, Layout } from "lucide-react";
import { getHumanReadableCondition } from "./utils/conditionLabel";

const nodeTypes = {
  "survey-node": SurveyNode,
};

const edgeTypes = {
  "button-edge": ButtonEdge,
};

interface FlowV3BuilderProps {
  onClose?: () => void;
}

const FlowV3BuilderInner: React.FC<FlowV3BuilderProps> = ({ onClose }) => {
  const { state, updateNode } = useSurveyBuilder();
  const { fitView, zoomIn, zoomOut, getNodes, getEdges } = useReactFlow();
  
  const [mode, setMode] = useState<FlowV2Mode>("select");
  const [isDragging, setIsDragging] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Config Panel State
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [configMode, setConfigMode] = useState<"full" | "navigation-only">("full");

  // Track if we are waiting for a layout update
  const [needsLayout, setNeedsLayout] = useState(false);

  // Track the "Insert Index" for the context menu/sidebar
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // Transform survey state to React Flow nodes/edges
  // We ONLY do this when the STRUCTURE changes, not on every render.
  // However, since state.rootNode changes on every edit, we need to be careful not to reset positions if we want manual drag.
  // BUT, for a "Formity" style vertical builder, AUTO-LAYOUT is usually preferred.
  // So we will aggressively re-layout on structure changes.
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!state.rootNode || !state.rootNode.items) return { initialNodes: [], initialEdges: [] };

    const blocks = state.rootNode.items as BlockData[];
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Helper to resolve target
    const resolveNavigationTarget = (target: string): string => {
      if (!target || target === "submit" || target === "end") return "submit";
      const targetBlock = blocks.find((b) => b.uuid === target || b.fieldName === target);
      return targetBlock ? targetBlock.uuid || "" : "submit";
    };

    // --- 1. Create Nodes ---

    // Start Node
    nodes.push({
      id: "start",
      type: "input", 
      data: { label: "Start Survey" },
      position: { x: 0, y: 0 },
      style: { 
        background: '#10b981', 
        color: 'white', 
        border: 'none', 
        borderRadius: '8px', 
        padding: '10px 20px', 
        fontWeight: 'bold',
        width: 'fit-content',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }
    });

    // Block Nodes
    blocks.forEach((block, index) => {
      nodes.push({
        id: block.uuid || `block-${index}`,
        type: "survey-node",
        data: { block, index },
        position: { x: 0, y: 0 }, // Layout will set this
      });
    });

    // Submit Node
    nodes.push({
      id: "submit",
      type: "output",
      data: { label: "Submit / End" },
      position: { x: 0, y: 0 },
       style: { 
         background: '#3b82f6', 
         color: 'white', 
         border: 'none', 
         borderRadius: '8px', 
         padding: '10px 20px', 
         fontWeight: 'bold',
         width: 'fit-content',
         textAlign: 'center',
         boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
       }
    });

    // --- 2. Create Edges ---

    if (blocks.length === 0) {
       edges.push({
        id: "start-to-submit",
        source: "start",
        target: "submit",
        type: "button-edge", // Use button edge to allow insert
        data: { insertIndex: 0 },
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#94a3b8' }
      });
    } else {
      // Start -> First Block
      const firstBlockId = blocks[0].uuid || "block-0";
      edges.push({
        id: "start-to-first",
        source: "start",
        target: firstBlockId,
        type: "button-edge",
        data: { insertIndex: 0 },
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#10b981' }
      });

      // Block Connections
      blocks.forEach((block, index) => {
        const blockId = block.uuid || `block-${index}`;
        const navRules = block.navigationRules || [];
        
        // Determine target for sequential flow first
        let nextBlockId = index < blocks.length - 1 ? blocks[index + 1].uuid || `block-${index + 1}` : "submit";
        if (block.isEndBlock) {
            nextBlockId = "submit";
        }

        // Explicit Navigation Rules
        navRules.forEach((rule, ruleIndex) => {
          const targetId = resolveNavigationTarget(rule.target);
          if (targetId) {
            // Check if this rule follows the sequential path
            const isSequentialPath = targetId === nextBlockId;

            edges.push({
              id: `${blockId}-nav-${ruleIndex}`,
              source: blockId,
              target: targetId,
              // Use human readable label
              label: rule.isDefault ? "Default" : getHumanReadableCondition(rule.condition, blocks),
              // ALWAYS use button-edge to show labels/delete buttons
              type: "button-edge",
              animated: !rule.isDefault,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { 
                  stroke: rule.isDefault ? '#94a3b8' : '#3b82f6', 
                  strokeWidth: rule.isDefault ? 1 : 2 
              },
              data: { 
                  rule,
                  // Add insert index ONLY if it matches sequential path
                  insertIndex: isSequentialPath ? index + 1 : undefined
              }
            });
          }
        });

        // Implicit Sequential Fallback
        const hasDefaultRule = navRules.some((r) => r.isDefault || !r.condition);
        
        // Check if we already have a rule pointing to the next block
        const hasRuleToNextBlock = navRules.some(rule => {
             const targetId = resolveNavigationTarget(rule.target);
             return targetId === nextBlockId;
        });

        if (!hasDefaultRule && !hasRuleToNextBlock) {
           edges.push({
            id: `${blockId}-seq-${nextBlockId}`,
            source: blockId,
            target: nextBlockId,
            type: "button-edge", // Allow insert on sequential edges
            data: { insertIndex: index + 1 },
            animated: false,
            // No "Else" label
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { 
                stroke: '#94a3b8', 
                strokeWidth: 2,
                strokeDasharray: '5,5' 
            },
          });
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [state.rootNode]); // Dependency on structure

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const nodesInitialized = useNodesInitialized();

  const hasInitialLayoutRef = useRef(false);
  
  // Effect to update nodes/edges when structure changes
  useEffect(() => {
      setNodes((currentNodes) => {
        const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
        
        return initialNodes.map(node => {
          const existing = nodeMap.get(node.id);
          if (existing) {
             // Preserve position and measured dimensions
             return {
               ...node,
               position: existing.position,
               measured: existing.measured,
               // Ensure data is updated
               data: node.data
             };
          }
          return node;
        });
      });
      setEdges(initialEdges);
      
      // Only trigger layout if structure changed (count diff)
      // Or if it's the very first load
      if (nodes.length !== initialNodes.length || edges.length !== initialEdges.length || initialNodes.length === 0) {
         setNeedsLayout(true);
      }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Effect to run layout when nodes are initialized or structure changed
  useEffect(() => {
    // Wait for nodes to be initialized and have measurements
    const allMeasured = nodes.every(n => n.measured && n.measured.width && n.measured.height);
    
    if (needsLayout && nodes.length > 0 && allMeasured) {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        
        // Run layout with actual node sizes
        const layout = getLayoutedElements(currentNodes, currentEdges, "TB");
        
        setNodes([...layout.nodes]);
        setEdges([...layout.edges]);
        setNeedsLayout(false);
        
        // Only fit view on initial load
        if (!hasInitialLayoutRef.current) {
          setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 50);
          hasInitialLayoutRef.current = true;
        }
    }
  }, [needsLayout, nodes, getNodes, getEdges, setNodes, setEdges, fitView]);

  // Handle Node Deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (!state.rootNode || !state.rootNode.items) return;

      // 1. Identify deleted block UUIDs
      const deletedBlockUuids = new Set<string>();
      deletedNodes.forEach(n => {
          if (n.type === 'survey-node') {
              const block = (n.data as any).block as BlockData;
              if (block && block.uuid) deletedBlockUuids.add(block.uuid);
          }
      });

      if (deletedBlockUuids.size === 0) return;

      // 2. Remove blocks from items list
      let updatedItems = (state.rootNode.items as BlockData[]).filter(item => !deletedBlockUuids.has(item.uuid!));
      
      // 3. Clean up navigation rules in remaining blocks
      updatedItems = updatedItems.map(item => {
          if (!item.navigationRules || item.navigationRules.length === 0) return item;
          
          const hasBadRule = item.navigationRules.some(rule => rule.target && deletedBlockUuids.has(rule.target));
          
          if (!hasBadRule) return item;

          const newRules = item.navigationRules.map(rule => {
              if (rule.target && deletedBlockUuids.has(rule.target)) {
                  // Reset target to empty (or 'submit' if preferred, but empty indicates 'needs config')
                  return { ...rule, target: '' }; 
              }
              return rule;
          });
          return { ...item, navigationRules: newRules };
      });

      // 4. Update state
      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
    },
    [state.rootNode, updateNode]
  );

  // Listen for delete edge events
  useEffect(() => {
    const handleDeleteEdge = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; source: string; target: string; rule: any }>;
      const { source, rule } = customEvent.detail;
      
      if (!state.rootNode || !source || !rule) return;

      // Find the source block
      const items = state.rootNode.items as BlockData[];
      const sourceBlock = items.find(item => item.uuid === source || `block-${items.indexOf(item)}` === source);
      
      if (!sourceBlock || !sourceBlock.navigationRules) return;

      // Remove the specific rule
      // We match by target AND condition to be precise
      const updatedRules = sourceBlock.navigationRules.filter(r => 
          r.target !== rule.target || r.condition !== rule.condition
      );

      const updatedItems = items.map(item => 
          item.uuid === sourceBlock.uuid ? { ...item, navigationRules: updatedRules } : item
      );

      updateNode(state.rootNode.uuid!, {
          ...state.rootNode,
          items: updatedItems
      });
    };

    window.addEventListener('flow-v3-delete-edge', handleDeleteEdge);
    return () => window.removeEventListener('flow-v3-delete-edge', handleDeleteEdge);
  }, [state.rootNode, updateNode]);

  // Listen for custom configuration event from nodes
  useEffect(() => {
    const handleConfigEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string; blockUuid?: string }>;
      if (customEvent.detail?.blockUuid) {
        setConfigNodeId(customEvent.detail.blockUuid);
        setConfigMode("full"); 
        setShowNodeConfig(true);
      }
    };

    window.addEventListener('flow-v3-configure-node', handleConfigEvent);
    return () => window.removeEventListener('flow-v3-configure-node', handleConfigEvent);
  }, []);


  const handleResetLayout = useCallback(() => {
    setNeedsLayout(true);
  }, []);

  // Handle Drag Over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle Drop (Add new block)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const blockType = event.dataTransfer.getData("application/reactflow");
      if (!blockType || !state.rootNode) return;

      const blockDefinition = state.definitions.blocks[blockType];
      if (!blockDefinition) return;

      const currentItems = (state.rootNode.items || []) as BlockData[];
      
      // Use the specific insert index if dropped on a "plus" button (via some state?)
      // Or if just dropped on canvas, append to end.
      // If dropped via "ButtonEdge", we handle that separately via event listener.
      // This onDrop is for dragging from sidebar to canvas.
      
      const newBlockData = blockDefinition.generateDefaultData
        ? blockDefinition.generateDefaultData()
        : { ...blockDefinition.defaultData };

      const newBlock: BlockData = {
        ...newBlockData,
        uuid: uuidv4(),
      };

      const updatedItems = [...currentItems, newBlock];

      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
      
      setIsDragging(false);
    },
    [state.rootNode, state.definitions.blocks, updateNode]
  );

  // Event Listener for "ButtonEdge" click
  useEffect(() => {
    const handleAddBlock = (e: Event) => {
        const customEvent = e as CustomEvent<{ insertIndex: number }>;
        // When "+" is clicked on edge, we want to show the sidebar or highlight it
        // For now, let's just set the insert index state and open sidebar
        // Or ideally, we want to drag from sidebar to that location?
        // Formity usually opens a popover. 
        // For this CLI task, let's set a mode or flag that the NEXT drag/drop goes to this index?
        // Or simpler: Add a specific placeholder block that users can then configure?
        
        // Let's just expand the sidebar if collapsed and scroll to it? 
        // Better: We can use the 'insertIndex' state to control where the NEXT block dropped goes.
        setInsertIndex(customEvent.detail.insertIndex);
        
        // Also, maybe visually indicate "Ready to insert at index X"
    };

    window.addEventListener('flow-v3-add-block', handleAddBlock);
    return () => window.removeEventListener('flow-v3-add-block', handleAddBlock);
  }, []);

  // Modified onDrop to respect insertIndex if set
  const onDropWithIndex = useCallback(
    (event: React.DragEvent) => {
        event.preventDefault();
        const blockType = event.dataTransfer.getData("application/reactflow");
        if (!blockType || !state.rootNode) return;

        const blockDefinition = state.definitions.blocks[blockType];
        if (!blockDefinition) return;
        
        const currentItems = (state.rootNode.items || []) as BlockData[];
        const targetIndex = insertIndex !== null ? insertIndex : currentItems.length;

        const newBlockData = blockDefinition.generateDefaultData
            ? blockDefinition.generateDefaultData()
            : { ...blockDefinition.defaultData };

        const newBlock: BlockData = {
            ...newBlockData,
            uuid: uuidv4(),
        };

        const updatedItems = [
            ...currentItems.slice(0, targetIndex),
            newBlock,
            ...currentItems.slice(targetIndex)
        ];

        updateNode(state.rootNode.uuid!, {
            ...state.rootNode,
            items: updatedItems,
        });
        
        setInsertIndex(null); // Reset
        setIsDragging(false);
    },
    [state.rootNode, insertIndex, state.definitions.blocks, updateNode]
  );

  // Track connection start for onConnectEnd
  const connectingNodeId = useRef<string | null>(null);

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const handleAddRule = useCallback((sourceId: string, targetId: string) => {
      const sourceNode = getNodes().find((n) => n.id === sourceId);
      if (!sourceNode || sourceNode.type !== "survey-node") return;

      const blockData = (sourceNode.data as any).block as BlockData;
      
      // Target can be block or submit
      const targetNode = getNodes().find((n) => n.id === targetId);
      let targetString = "submit";
      if (targetNode && targetNode.type === "survey-node") {
          const targetBlock = (targetNode.data as any).block as BlockData;
          targetString = targetBlock.uuid || "";
      }

      // Add Navigation Rule
       const newRule = {
            condition: `${blockData.fieldName || "field"} == ""`,
            target: targetString,
            isDefault: false,
          };

          const updatedBlock = {
            ...blockData,
            navigationRules: [...(blockData.navigationRules || []), newRule],
          };

          const updatedItems = (state.rootNode?.items || []).map((item) =>
            (item as BlockData).uuid === blockData.uuid ? updatedBlock : item
          );

          updateNode(state.rootNode!.uuid!, {
            ...state.rootNode!,
            items: updatedItems,
          });

          // Open Config
          setConfigNodeId(sourceNode.id);
          setConfigMode("navigation-only");
          setShowNodeConfig(true);
  }, [getNodes, state.rootNode, updateNode]);

  // Connect Handler
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === "start") return; // Start is fixed
      handleAddRule(params.source, params.target);
    }, 
    [handleAddRule]
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;

      const target = event.target as HTMLElement;
      const nodeElement = target.closest('.react-flow__node');
      
      if (nodeElement) {
        const targetId = nodeElement.getAttribute('data-id');
        if (targetId && targetId !== connectingNodeId.current) {
            handleAddRule(connectingNodeId.current, targetId);
        }
      }
      
      connectingNodeId.current = null;
    },
    [handleAddRule]
  );


  // Handle Node Double Click
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "survey-node") {
        // Use the block UUID as the ID for config
        const blockData = (node.data as any).block;
        if (blockData && blockData.uuid) {
            setConfigNodeId(blockData.uuid);
            setConfigMode("full");
            setShowNodeConfig(true);
        }
    }
  }, []);

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


  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

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
        
        <div ref={reactFlowWrapper} className="flex-1 relative bg-slate-50 dark:bg-slate-950">
             {/* Visual indicator for Insert Mode */}
             {insertIndex !== null && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center animate-bounce pointer-events-none">
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Drag a block to insert at position {insertIndex + 1}</span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-2 h-6 w-6 p-0 hover:bg-blue-700 rounded-full text-white pointer-events-auto"
                        onClick={() => setInsertIndex(null)}
                    >
                        &times;
                    </Button>
                </div>
             )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodesDelete={onNodesDelete}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onDragOver={onDragOver}
                onDrop={onDropWithIndex}
                onNodeDoubleClick={onNodeDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                panOnDrag={mode === "pan" || mode === "select"}
                selectionOnDrag={mode === "select"}
                connectOnClick={mode === "connect"}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls showInteractive={false} position="bottom-right" />
                <Panel position="top-right" className="bg-white/80 p-2 rounded shadow-sm border text-xs text-slate-500">
                    Double-click nodes to edit. Click + on lines to insert.
                </Panel>
            </ReactFlow>
        </div>
      </div>

      <NodeConfigPanel
          nodeId={configNodeId}
          open={showNodeConfig}
          onOpenChange={setShowNodeConfig}
          onUpdate={handleNodeUpdate}
          mode={configMode}
        />
    </div>
  );
};

export const FlowV3Builder: React.FC<FlowV3BuilderProps> = ({ onClose }) => {
  return (
    <ReactFlowProvider>
      <FlowV3BuilderInner onClose={onClose} />
    </ReactFlowProvider>
  );
};