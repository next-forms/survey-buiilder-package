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
import { BlockSelectorDialog } from "./BlockSelectorDialog";
import { getHumanReadableCondition } from "./utils/conditionLabel";
import { Button } from "../../components/ui/button";

import { Plus, ArrowUpToLine, ArrowDownToLine, Pencil } from "lucide-react";

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
  const [editRuleIndex, setEditRuleIndex] = useState<number | undefined>(undefined);
  const [hideRemoveButton, setHideRemoveButton] = useState(false);

  // Block Selector State
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [branchSourceId, setBranchSourceId] = useState<string | null>(null);

  // Track if we are waiting for a layout update
  const [needsLayout, setNeedsLayout] = useState(false);

  // Track the "Insert Index" for the context menu/sidebar
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [insertTargetId, setInsertTargetId] = useState<string | null>(null);
  const [insertSourceId, setInsertSourceId] = useState<string | null>(null);
  const [insertRule, setInsertRule] = useState<any>(null);

  // Edge tooltip state
  const [edgeTooltip, setEdgeTooltip] = useState<{
    edgeId: string;
    x: number;
    y: number;
    sourceId: string;
    targetId: string;
    label?: string;
    ruleIndex?: number;
    isExplicitRule: boolean;
  } | null>(null);

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
        data: { insertIndex: 0, weight: 2 },
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
        data: { insertIndex: 0, weight: 2 },
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2, stroke: '#10b981' }
      });

      // Block Connections
      blocks.forEach((block, index) => {
        const blockId = block.uuid || `block-${index}`;
        const navRules = block.navigationRules || [];
        
        // Determine target for sequential flow first
        let nextBlockId = index < blocks.length - 1 ? blocks[index + 1].uuid || `block-${index + 1}` : "submit";
        
        if (block.nextBlockId) {
            nextBlockId = block.nextBlockId;
        }

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
                  ruleIndex, // Include rule index for editing
                  // ALWAYS provide insertIndex to allow insertion
                  insertIndex: index + 1,
                  targetBlockId: targetId,
                  sourceBlockId: blockId,
                  weight: isSequentialPath ? 2 : 1 // Give higher weight to sequential path
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
            data: { 
                insertIndex: index + 1, 
                targetBlockId: nextBlockId,
                sourceBlockId: blockId,
                weight: 2 
            },
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
          setTimeout(() => fitView({ padding: 0.2, duration: 500, maxZoom: 1 }), 50);
          hasInitialLayoutRef.current = true;
        }
    }
  }, [needsLayout, nodes, getNodes, getEdges, setNodes, setEdges, fitView]);

  // Handle Node Deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      if (!state.rootNode || !state.rootNode.items) return;

      const items = state.rootNode.items as BlockData[];
      
      // 1. Identify deleted block UUIDs and objects
      const deletedBlockUuids = new Set<string>();
      const deletedBlocks: BlockData[] = [];
      
      deletedNodes.forEach(n => {
          if (n.type === 'survey-node') {
              const block = (n.data as any).block as BlockData;
              if (block && block.uuid) {
                  deletedBlockUuids.add(block.uuid);
                  deletedBlocks.push(block);
              }
          }
      });

      if (deletedBlockUuids.size === 0) return;

      // 2. Check for Prevention: "We should not allow deletion of a node if it has conditional rules and valid targets exists"
      // Only prevent if the target is NOT also being deleted.
      const hasActiveRules = deletedBlocks.some(block => {
          return block.navigationRules && block.navigationRules.some(rule => {
             return rule.target && 
                    rule.target !== "submit" && 
                    rule.target !== "end" && 
                    !deletedBlockUuids.has(rule.target); // Target is still alive
          });
      });

      if (hasActiveRules) {
          // Ideally show a toast/alert here. For now we just prevent.
          console.warn("Cannot delete node with active navigation rules to valid targets.");
          // We need to "undo" the deletion in UI because React Flow optimistically removes them? 
          // Actually onNodesDelete is called *after* usually or we are responsible for state update. 
          // React Flow 'useNodesState' handles the visual removal. 
          // To "cancel", we would need to setNodes back to previous. 
          // But since we drive nodes from `initialNodes` (which comes from `state`), 
          // effectively doing nothing here *should* revert the deletion on next render 
          // because `state` hasn't changed!
          // We just need to trigger a re-render or ensure the nodes state syncs back.
          // calling updateNode with same state *might* trigger it, but let's rely on the fact we don't update state.
          
          // Force a re-sync to restore nodes
          setNodes(current => [...current]); 
          return;
      }

      // 3. Calculate "Bridge" targets for each deleted node
      const bridgeMap = new Map<string, string>(); // deletedUuid -> nextUuid (or "submit")

      deletedBlocks.forEach(block => {
          let nextId = "submit";
          
          // Priority 1: Explicit nextBlockId (if not deleted)
          if (block.nextBlockId && !deletedBlockUuids.has(block.nextBlockId)) {
              nextId = block.nextBlockId;
          } 
          // Priority 2: Sequential next (if not deleted)
          else {
              const currentIndex = items.findIndex(i => i.uuid === block.uuid);
              if (currentIndex !== -1 && currentIndex < items.length - 1) {
                  const nextItem = items[currentIndex + 1];
                  if (nextItem.uuid && !deletedBlockUuids.has(nextItem.uuid)) {
                      nextId = nextItem.uuid;
                  }
              }
          }
          bridgeMap.set(block.uuid!, nextId);
      });

      // 4. Filter out deleted items
      let updatedItems = items.filter(item => !deletedBlockUuids.has(item.uuid!));
      
      // 5. Update remaining items to bridge the gap
      updatedItems = updatedItems.map(item => {
          const newItem = { ...item };
          let modified = false;

          // Update nextBlockId
          if (newItem.nextBlockId && bridgeMap.has(newItem.nextBlockId)) {
              newItem.nextBlockId = bridgeMap.get(newItem.nextBlockId);
              modified = true;
          }

          // Update navigationRules
          if (newItem.navigationRules && newItem.navigationRules.length > 0) {
              const newRules = newItem.navigationRules.map(rule => {
                  if (rule.target && bridgeMap.has(rule.target)) {
                      modified = true;
                      return { ...rule, target: bridgeMap.get(rule.target)! };
                  }
                  return rule;
              });
              if (modified) newItem.navigationRules = newRules;
          }
          
          return newItem;
      });

      // 6. Update state
      updateNode(state.rootNode.uuid!, {
        ...state.rootNode,
        items: updatedItems,
      });
    },
    [state.rootNode, updateNode, setNodes]
  );

  // Listen for edit edge events
  useEffect(() => {
    const handleEditEdge = (e: Event) => {
      const customEvent = e as CustomEvent<{ source: string; ruleIndex: number }>;
      const { source, ruleIndex } = customEvent.detail;

      if (!state.rootNode || !source) return;

      // Find the source block
      const items = state.rootNode.items as BlockData[];
      const sourceBlock = items.find(item => item.uuid === source || `block-${items.indexOf(item)}` === source);

      if (!sourceBlock) return;

      // Open config panel for this specific rule in edit mode
      setConfigNodeId(sourceBlock.uuid || source);
      setConfigMode("navigation-only");
      setEditRuleIndex(ruleIndex);
      setHideRemoveButton(true); // Hide remove button when editing existing rule
      setShowNodeConfig(true);
    };

    window.addEventListener('flow-v3-edit-edge', handleEditEdge);
    return () => window.removeEventListener('flow-v3-edit-edge', handleEditEdge);
  }, [state.rootNode]);

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
        setEditRuleIndex(undefined); // Reset edit rule index for full mode
        setHideRemoveButton(false);
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
        const customEvent = e as CustomEvent<{ insertIndex: number; targetBlockId?: string; sourceBlockId?: string; rule?: any }>;
        // When "+" is clicked on edge, we want to show the sidebar or highlight it
        // For now, let's just set the insert index state and open sidebar
        // Or ideally, we want to drag from sidebar to that location?
        // Formity usually opens a popover. 
        // For this CLI task, let's set a mode or flag that the NEXT drag/drop goes to this index?
        // Or simpler: Add a specific placeholder block that users can then configure?
        
        // Let's just expand the sidebar if collapsed and scroll to it? 
        // Better: We can use the 'insertIndex' state to control where the NEXT block dropped goes.
        setInsertIndex(customEvent.detail.insertIndex);
        setInsertTargetId(customEvent.detail.targetBlockId || null);
        setInsertSourceId(customEvent.detail.sourceBlockId || null);
        setInsertRule(customEvent.detail.rule || null);
        
        // Also, maybe visually indicate "Ready to insert at index X"
    };

    window.addEventListener('flow-v3-add-block', handleAddBlock);
    return () => window.removeEventListener('flow-v3-add-block', handleAddBlock);
  }, []);

  // Handle Add Branch Event
  useEffect(() => {
    const handleAddBranch = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceBlockId: string }>;
      const { sourceBlockId } = customEvent.detail;
      
      setBranchSourceId(sourceBlockId);
      setShowBlockSelector(true);
    };

    window.addEventListener('flow-v3-add-branch', handleAddBranch);
    return () => window.removeEventListener('flow-v3-add-branch', handleAddBranch);
  }, []);

  const handleBlockSelect = useCallback((blockType: string) => {
    if (!state.rootNode || !branchSourceId) return;

    const items = state.rootNode.items as BlockData[];
    const sourceBlock = items.find(b => b.uuid === branchSourceId);
    
    if (!sourceBlock) return;

    const blockDefinition = state.definitions.blocks[blockType];
    
    if (!blockDefinition) return;

    const newBlockData = blockDefinition.generateDefaultData
      ? blockDefinition.generateDefaultData()
      : { ...blockDefinition.defaultData };
    
    const newBlock: BlockData = {
      ...newBlockData,
      uuid: uuidv4(),
      isEndBlock: true, // Newly created branch end
    };

    // Add Navigation Rule to Source Block
    const newRule = {
      condition: `${sourceBlock.fieldName || "field"} == "value"`, // Placeholder condition
      target: newBlock.uuid!,
      isDefault: false,
    };

    const updatedSourceBlock = {
      ...sourceBlock,
      navigationRules: [...(sourceBlock.navigationRules || []), newRule],
    };

    // Update Items List: replace source, append new block
    const updatedItems = items.map(item => 
      item.uuid === branchSourceId ? updatedSourceBlock : item
    ).concat(newBlock);

    // Update State
    updateNode(state.rootNode.uuid!, {
      ...state.rootNode,
      items: updatedItems,
    });

    // Trigger Layout and Config
    setNeedsLayout(true);
    setShowBlockSelector(false);
    setBranchSourceId(null);

    // Open config for the source block to edit ONLY the newly added rule
    // The new rule is the last one in the array
    const newRuleIndex = (sourceBlock.navigationRules || []).length; // Index of the newly added rule
    setConfigNodeId(branchSourceId);
    setConfigMode("navigation-only");
    setEditRuleIndex(newRuleIndex);
    setHideRemoveButton(false); // Allow removing the newly created rule
    setShowNodeConfig(true);
  }, [state.rootNode, branchSourceId, state.definitions.blocks, updateNode]);

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
            nextBlockId: insertTargetId === 'submit' ? undefined : (insertTargetId || undefined), // Set next step if target is provided and not submit
            isEndBlock: insertTargetId === 'submit' // Mark as end block if targeting submit
        };

        // Create updated items array
        let updatedItems = [...currentItems];

        // If we are inserting between nodes, and we have a source
        if (insertSourceId) {
            const sourceIndex = updatedItems.findIndex(b => b.uuid === insertSourceId);
            if (sourceIndex !== -1) {
                const sourceBlock = { ...updatedItems[sourceIndex] };

                // Check for rule update
                if (insertRule && sourceBlock.navigationRules) {
                    const ruleIndex = sourceBlock.navigationRules.findIndex(r => 
                        r.condition === insertRule.condition && r.target === insertRule.target
                    );
                    
                    if (ruleIndex !== -1) {
                        const newRules = [...sourceBlock.navigationRules];
                        newRules[ruleIndex] = { ...newRules[ruleIndex], target: newBlock.uuid! };
                        sourceBlock.navigationRules = newRules;
                        updatedItems[sourceIndex] = sourceBlock;
                    }
                }
                // Check for nextBlockId update or End Block update
                else {
                     // If inserting before 'submit', and source was end block
                     if (insertTargetId === 'submit' && sourceBlock.isEndBlock) {
                         sourceBlock.isEndBlock = false;
                         sourceBlock.nextBlockId = newBlock.uuid;
                         updatedItems[sourceIndex] = sourceBlock;
                     }
                     // If source explicitly pointed to target
                     else if (insertTargetId && sourceBlock.nextBlockId === insertTargetId) {
                        sourceBlock.nextBlockId = newBlock.uuid;
                        updatedItems[sourceIndex] = sourceBlock;
                    }
                }
            }
        }

        // Insert the new block
        updatedItems = [
            ...updatedItems.slice(0, targetIndex),
            newBlock,
            ...updatedItems.slice(targetIndex)
        ];

        updateNode(state.rootNode.uuid!, {
            ...state.rootNode,
            items: updatedItems,
        });
        
        setInsertIndex(null); // Reset
        setInsertTargetId(null);
        setInsertSourceId(null);
        setInsertRule(null);
        setIsDragging(false);
    },
    [state.rootNode, insertIndex, insertTargetId, insertSourceId, insertRule, state.definitions.blocks, updateNode]
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

          // Open Config for ONLY the newly added rule
          const newRuleIndex = (blockData.navigationRules || []).length; // Index of the newly added rule
          setConfigNodeId(sourceNode.id);
          setConfigMode("navigation-only");
          setEditRuleIndex(newRuleIndex);
          setHideRemoveButton(false); // Allow removing the newly created rule
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

  // Handle edge click to show tooltip
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();

    // Get position relative to the react flow wrapper
    const wrapper = reactFlowWrapper.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const edgeData = edge.data as any;

    setEdgeTooltip({
      edgeId: edge.id,
      x,
      y,
      sourceId: edge.source,
      targetId: edge.target,
      label: edge.label as string | undefined,
      ruleIndex: edgeData?.ruleIndex,
      isExplicitRule: !!edgeData?.rule,
    });
  }, []);

  // Close edge tooltip
  const closeEdgeTooltip = useCallback(() => {
    setEdgeTooltip(null);
  }, []);

  // Handle pan to node from tooltip
  const handlePanToNode = useCallback((nodeId: string) => {
    const node = getNodes().find(n => n.id === nodeId);
    if (node) {
      fitView({
        nodes: [node],
        duration: 500,
        padding: 0.5,
      });
    }
    closeEdgeTooltip();
  }, [getNodes, fitView, closeEdgeTooltip]);

  // Handle edit rule from tooltip
  const handleEditRuleFromTooltip = useCallback((sourceId: string, ruleIndex: number) => {
    if (!state.rootNode) return;

    const items = state.rootNode.items as BlockData[];
    const sourceBlock = items.find(item => item.uuid === sourceId);

    if (!sourceBlock) return;

    setConfigNodeId(sourceBlock.uuid || sourceId);
    setConfigMode("navigation-only");
    setEditRuleIndex(ruleIndex);
    setHideRemoveButton(true);
    setShowNodeConfig(true);
    closeEdgeTooltip();
  }, [state.rootNode, closeEdgeTooltip]);

  // Get node display name
  const getNodeDisplayName = useCallback((nodeId: string) => {
    const node = getNodes().find(n => n.id === nodeId);
    if (!node) return nodeId;

    if (node.type === 'survey-node') {
      const block = (node.data as any)?.block;
      return block?.fieldName || block?.label || 'Block';
    }
    if (nodeId === 'start') return 'Start';
    if (nodeId === 'submit') return 'Submit';
    return nodeId;
  }, [getNodes]);

  // Close tooltip on click outside or scroll
  useEffect(() => {
    if (!edgeTooltip) return;

    const handleClickOutside = (evt: MouseEvent) => {
      const target = evt.target as HTMLElement;
      // Check if click is inside the tooltip
      if (target.closest('[data-edge-tooltip]')) return;
      closeEdgeTooltip();
    };

    const handleScroll = () => closeEdgeTooltip();

    // Handle pane click (ReactFlow canvas click)
    const handlePaneClick = () => closeEdgeTooltip();

    // Use capture phase to catch events before they're stopped
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('wheel', handleScroll, true);

    // Also listen to ReactFlow pane clicks
    const pane = document.querySelector('.react-flow__pane');
    if (pane) {
      pane.addEventListener('click', handlePaneClick);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('wheel', handleScroll, true);
      if (pane) {
        pane.removeEventListener('click', handlePaneClick);
      }
    };
  }, [edgeTooltip, closeEdgeTooltip]);

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
                onEdgeClick={handleEdgeClick}
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
                    Double-click nodes to edit. Click lines to see options.
                </Panel>
            </ReactFlow>

            {/* Edge Tooltip - rendered outside ReactFlow for proper positioning */}
            {edgeTooltip && (
              <div
                data-edge-tooltip="true"
                style={{
                  position: "absolute",
                  left: edgeTooltip.x,
                  top: edgeTooltip.y,
                  transform: "translate(-50%, -100%)",
                  zIndex: 9999,
                }}
                className="pointer-events-auto"
              >
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[220px] mb-2">
                  {/* Connection Info */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">From:</span>
                      <span className="truncate max-w-[150px]">{getNodeDisplayName(edgeTooltip.sourceId)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">To:</span>
                      <span className="truncate max-w-[150px]">{getNodeDisplayName(edgeTooltip.targetId)}</span>
                    </div>
                  </div>

                  {/* Rule Condition */}
                  {edgeTooltip.label && (
                    <div className="mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Condition</div>
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        {edgeTooltip.label}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => handlePanToNode(edgeTooltip.sourceId)}
                      title={`Pan to ${getNodeDisplayName(edgeTooltip.sourceId)}`}
                    >
                      <ArrowUpToLine className="h-3 w-3 mr-1" />
                      Source
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => handlePanToNode(edgeTooltip.targetId)}
                      title={`Pan to ${getNodeDisplayName(edgeTooltip.targetId)}`}
                    >
                      <ArrowDownToLine className="h-3 w-3 mr-1" />
                      Target
                    </Button>

                    {/* Edit button for explicit rules */}
                    {edgeTooltip.isExplicitRule && edgeTooltip.ruleIndex !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/30"
                        onClick={() => handleEditRuleFromTooltip(edgeTooltip.sourceId, edgeTooltip.ruleIndex!)}
                        title="Edit Rule"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      <NodeConfigPanel
          nodeId={configNodeId}
          open={showNodeConfig}
          onOpenChange={(open) => {
            setShowNodeConfig(open);
            if (!open) {
              // Reset edit mode state when dialog closes
              setEditRuleIndex(undefined);
              setHideRemoveButton(false);
            }
          }}
          onUpdate={handleNodeUpdate}
          mode={configMode}
          editRuleIndex={editRuleIndex}
          hideRemoveButton={hideRemoveButton}
        />

      <BlockSelectorDialog
        open={showBlockSelector}
        onOpenChange={setShowBlockSelector}
        onSelect={handleBlockSelect}
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