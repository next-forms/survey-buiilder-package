import React, { useState, useCallback, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FlowCanvas, FlowCanvasRef } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { FlowToolbar } from "./FlowToolbar";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { NodeData, BlockData } from "../../types";
import { surveyToFlow, hierarchicalLayoutNodes, repositionBlocksInPage } from "./utils/flowTransforms";
import { FlowNode, FlowEdge, FlowMode } from "./types";
import { useBuilderDebug } from "../../utils/debugUtils";

export const FlowBuilder: React.FC = () => {
  const { state, updateNode, createNode, removeNode } = useSurveyBuilder();
  const debug = useBuilderDebug();
  const [flowMode, setFlowMode] = useState<FlowMode>("select");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [configMode, setConfigMode] = useState<"full" | "navigation-only">("full");
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [initialNodePositions, setInitialNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  
  
  // Ref for FlowCanvas undo/redo functions
  const flowCanvasRef = useRef<FlowCanvasRef>(null);
  
  // Convert survey structure to flow format with positions
  const flowData = React.useMemo(() => {
    if (!state.rootNode) {
      debug.log("No root node available for flow");
      return { nodes: [], edges: [] };
    }
    
    debug.log("Converting survey to flow, root node:", state.rootNode);
    const data = surveyToFlow(state.rootNode, state.enableDebug);
    debug.log("Flow data before applying positions:", data);
    
    // Apply stored positions
    data.nodes = data.nodes.map(node => ({
      ...node,
      position: nodePositions[node.id] || node.position
    }));
    
    debug.log("Final flow data with positions:", data);
    debug.log("Current node positions:", nodePositions);
    
    return data;
  }, [state.rootNode, nodePositions]);

  // Auto-set active page when flow loads or when no active page is set
  React.useEffect(() => {
    if (flowData.nodes.length > 0 && !activePageId) {
      const firstPage = flowData.nodes.find(node => node.type === "set");
      if (firstPage) {
        setActivePageId(firstPage.id);
        debug.log("Auto-selected active page:", firstPage.id);
      }
    }
  }, [flowData.nodes, activePageId]);

  // Track previous flow data to detect changes
  const prevFlowDataRef = React.useRef<{ nodeCount: number; pageCount: number; blockCount: number }>({
    nodeCount: 0,
    pageCount: 0,
    blockCount: 0
  });

  // Effect to handle hierarchical layout when flow structure changes
  React.useEffect(() => {
    if (flowData.nodes.length > 0) {
      const currentPageCount = flowData.nodes.filter(n => n.type === "set").length;
      const currentBlockCount = flowData.nodes.filter(n => n.type === "block").length;
      const currentNodeCount = flowData.nodes.length;
      
      const prevData = prevFlowDataRef.current;
      const isInitialLoad = Object.keys(nodePositions).length === 0;
      const pageCountChanged = currentPageCount !== prevData.pageCount;
      const newNodesWithoutPositions = flowData.nodes.filter(node => !nodePositions[node.id]);
      
      debug.log("Layout check:", {
        isInitialLoad,
        pageCountChanged,
        currentPageCount,
        prevPageCount: prevData.pageCount,
        currentBlockCount,
        prevBlockCount: prevData.blockCount,
        newNodesWithoutPositions: newNodesWithoutPositions.length
      });
      
      // Full layout reset conditions:
      // 1. Initial load
      // 2. Page count changed (new page added)
      // 3. Major structural changes
      if (isInitialLoad || pageCountChanged) {
        debug.log("Applying full hierarchical layout");
        
        // Apply hierarchical layout based on navigation rules
        const layoutedNodes = hierarchicalLayoutNodes(flowData.nodes, flowData.edges, state.enableDebug);
        
        // Extract positions from layouted nodes
        const newPositions: Record<string, { x: number; y: number }> = {};
        layoutedNodes.forEach(node => {
          newPositions[node.id] = node.position;
        });
        
        debug.log("Setting full layout positions:", newPositions);
        setNodePositions(newPositions); // Complete replacement
        setInitialNodePositions(newPositions); // Store as initial positions
      }
      // Partial layout for block additions within existing pages
      else if (currentBlockCount !== prevData.blockCount && newNodesWithoutPositions.length > 0) {
        debug.log("Applying partial layout for new blocks");
        
        const partialPositions: Record<string, { x: number; y: number }> = {};
        const affectedPages = new Set<string>();
        
        // Find which pages are affected by new blocks
        newNodesWithoutPositions.forEach(node => {
          if (node.type === "block") {
            const match = node.id.match(/^(.+)-block-(\d+)$/);
            if (match) {
              const [, parentPageId] = match;
              affectedPages.add(parentPageId);
            }
          } else if (node.type === "submit") {
            // Position submit node at the bottom
            const pageNodes = flowData.nodes.filter(n => n.type === "set");
            const maxY = Math.max(...pageNodes.map(n => nodePositions[n.id]?.y || 0));
            partialPositions[node.id] = {
              x: 200,
              y: maxY + 400
            };
          }
        });
        
        // Reposition all blocks in affected pages to maintain proper layout
        affectedPages.forEach(pageId => {
          const repositionedBlocks = repositionBlocksInPage(pageId, flowData.nodes, nodePositions, state.enableDebug);
          Object.assign(partialPositions, repositionedBlocks);
        });
        
        if (Object.keys(partialPositions).length > 0) {
          debug.log("Setting partial layout positions:", partialPositions);
          setNodePositions(prev => ({ ...prev, ...partialPositions }));
        }
      }
      
      // Update reference for next comparison
      prevFlowDataRef.current = {
        nodeCount: currentNodeCount,
        pageCount: currentPageCount,
        blockCount: currentBlockCount
      };
    }
  }, [flowData.nodes, flowData.edges, nodePositions]);

  // Handle node position updates with relative positioning for children
  const handleNodePositionUpdate = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodePositions(prev => {
      const oldPosition = prev[nodeId];
      if (!oldPosition) {
        return { ...prev, [nodeId]: position };
      }
      
      // Calculate the delta movement
      const deltaX = position.x - oldPosition.x;
      const deltaY = position.y - oldPosition.y;
      
      // Update the node's position
      const newPositions = { ...prev, [nodeId]: position };
      
      // If moving a page (set), also move all its child blocks
      const nodeInFlow = flowData.nodes.find(n => n.id === nodeId);
      if (nodeInFlow?.type === "set") {
        debug.log(`Moving page ${nodeId} and its children by (${deltaX}, ${deltaY})`);
        
        // Find all child blocks of this page
        flowData.nodes.forEach(node => {
          if (node.type === "block" && node.id.startsWith(`${nodeId}-block-`)) {
            const childOldPos = prev[node.id];
            if (childOldPos) {
              newPositions[node.id] = {
                x: childOldPos.x + deltaX,
                y: childOldPos.y + deltaY
              };
              debug.log(`Moving child block ${node.id} to (${newPositions[node.id].x}, ${newPositions[node.id].y})`);
            }
          }
        });
      }
      
      // Section movement logic removed since we no longer have section nodes
      
      return newPositions;
    });
  }, [flowData.nodes]);

  // Handle node creation from sidebar
  const handleNodeCreate = useCallback((position: { x: number; y: number }, nodeType: string, targetPageId?: string) => {
    if (!state.rootNode) return;

    debug.log("Creating node of type:", nodeType, "at position:", position, "targetPage:", targetPageId);
    debug.log("Available node definitions:", Object.keys(state.definitions.nodes));
    debug.log("Available block definitions:", Object.keys(state.definitions.blocks));

    // Create node based on type
    if (nodeType === "set") {
      // Create a new page/set node - use the node definition if available
      const newPageData = {
        uuid: `page_${Date.now()}`,
        type: "set",
        name: `Page ${(state.rootNode.items?.filter(item => item.type === 'set').length || 0) + 1}`,
        items: [],
      };
      
      setNodePositions(prev => ({
        ...prev,
        [newPageData.uuid!]: position
      }));

      // Manually update the root node - add to items array
      const updatedRootNode = {
        ...state.rootNode,
        items: [...(state.rootNode.items || []), newPageData]
      };
      updateNode(state.rootNode.uuid!, updatedRootNode);
    } else {
      // It's a block type - add to specific page if provided, otherwise first available page
      let targetPage: NodeData | null = null;
      
      if (targetPageId) {
        // Find the target page by ID
        const findPageById = (node: NodeData, id: string): NodeData | null => {
          if (node.uuid === id) return node;
          
          // Check in items (for nested pages)
          if (node.items) {
            for (const item of node.items) {
              if (item.type === 'set' && typeof item !== 'string') {
                const found = findPageById(item as NodeData, id);
                if (found) return found;
              }
            }
          }
          
          // Check in child nodes
          if (node.nodes) {
            for (const childNode of node.nodes) {
              if (typeof childNode !== 'string') {
                const found = findPageById(childNode, id);
                if (found) return found;
              }
            }
          }
          
          return null;
        };
        
        targetPage = findPageById(state.rootNode, targetPageId);
        debug.log("Found target page:", targetPage);
      }
      
      if (!targetPage) {
        // Try to use the active page first
        if (activePageId) {
          const findPageById = (node: NodeData, id: string): NodeData | null => {
            if (node.uuid === id) return node;
            
            // Check in items (for nested pages)
            if (node.items) {
              for (const item of node.items) {
                if (item.type === 'set' && typeof item !== 'string') {
                  const found = findPageById(item as NodeData, id);
                  if (found) return found;
                }
              }
            }
            
            // Check in child nodes
            if (node.nodes) {
              for (const childNode of node.nodes) {
                if (typeof childNode !== 'string') {
                  const found = findPageById(childNode, id);
                  if (found) return found;
                }
              }
            }
            
            return null;
          };
          
          targetPage = findPageById(state.rootNode, activePageId);
          if (targetPage) {
            debug.log("Using active page for block creation:", activePageId);
          }
        }
        
        // Fallback to first available page if no active page or active page not found
        if (!targetPage) {
          const pageFromItems = state.rootNode.items?.find(item => item.type === 'set') as NodeData;
          if (pageFromItems) {
            targetPage = pageFromItems;
            debug.log("Fallback to first page in items:", pageFromItems.uuid);
          } else {
            // Fallback to nodes array
            targetPage = state.rootNode.nodes?.[0] as NodeData;
            if (targetPage && typeof targetPage === 'string') {
              targetPage = null;
            } else if (targetPage) {
              debug.log("Fallback to first page in nodes:", targetPage.uuid);
            }
          }
        }
      }
      
      if (targetPage && typeof targetPage !== 'string') {
        // Use the same format as ContentBlockPage.tsx handleAddBlockItem
        const blockDefinition = state.definitions.blocks[nodeType];
        if (!blockDefinition) {
          debug.error(`No block definition found for type '${nodeType}'`);
          return;
        }

        const blockId = `${targetPage.uuid}-block-${(targetPage.items?.length || 0)}`;
        const genBlockData = blockDefinition.generateDefaultData 
          ? blockDefinition.generateDefaultData()
          : blockDefinition.defaultData;

          const blockData: BlockData = {
          ...genBlockData,
          uuid: `block_${Date.now()}`,
        };
        
        // Store the position for the new block
        setNodePositions(prev => ({
          ...prev,
          [blockId]: position
        }));
        
        const updatedPage = {
          ...targetPage,
          items: [...(targetPage.items || []), blockData]
        };
        updateNode(targetPage.uuid!, updatedPage);
        
        debug.log(`Added block ${nodeType} to page ${targetPage.name || targetPage.uuid}`);
      } else {
        debug.error("No page available to add block to");
      }
    }
  }, [createNode, updateNode, state.rootNode, state.definitions, activePageId]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    debug.log("Node selected:", nodeId);
    setSelectedNodeId(nodeId || null);
    
    // Update active page based on selection
    if (nodeId) {
      const selectedNode = flowData.nodes.find(n => n.id === nodeId);
      if (selectedNode) {
        if (selectedNode.type === "set") {
          // If a page is selected, make it the active page
          setActivePageId(nodeId);
          debug.log("Set active page from selection:", nodeId);
        } else if (selectedNode.type === "block") {
          // If a block is selected, determine its parent page and make that active
          const blockMatch = nodeId.match(/^(.+)-block-(\d+)$/);
          if (blockMatch) {
            const pageId = blockMatch[1];
            setActivePageId(pageId);
            debug.log("Set active page from block selection:", pageId);
          }
        }
      }
    }
  }, [flowData.nodes]);

  // Handle node update
  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    debug.log("Updating node:", nodeId, "with data:", data);
    
    if (!state.rootNode) {
      debug.error("No root node available for update");
      return;
    }
    
    // Universal function to find and update a block by UUID (works for both flow and survey builder created blocks)
    const findAndUpdateBlock = (node: NodeData, blockId: string): NodeData | null => {
      // Check if this node has items (blocks)
      if (node.items) {
        for (let i = 0; i < node.items.length; i++) {
          const item = node.items[i];
          
          // Check if this item is a block and matches our target
          if (item.type !== 'set' && ((item as any).uuid === blockId || (item as any).fieldName === blockId)) {
            // Found the block - update it
            const updatedItems = [...node.items];
            updatedItems[i] = { ...updatedItems[i], ...data };
            return {
              ...node,
              items: updatedItems
            };
          }
          
          // If this item is a nested page, search within it
          if (item.type === 'set' && typeof item !== 'string') {
            const updated = findAndUpdateBlock(item as NodeData, blockId);
            if (updated) {
              const updatedItems = [...node.items];
              updatedItems[i] = updated;
              return {
                ...node,
                items: updatedItems
              };
            }
          }
        }
      }
      
      // Check in child nodes
      if (node.nodes) {
        for (let i = 0; i < node.nodes.length; i++) {
          const childNode = node.nodes[i];
          if (typeof childNode !== 'string') {
            const updated = findAndUpdateBlock(childNode, blockId);
            if (updated) {
              const updatedNodes = [...node.nodes];
              updatedNodes[i] = updated;
              return {
                ...node,
                nodes: updatedNodes
              };
            }
          }
        }
      }
      
      return null;
    };
    
    // Handle composite block IDs (flow builder format: pageUuid-block-index)
    const blockMatch = nodeId.match(/^(.+)-block-(\d+)$/);
    if (blockMatch) {
      const [, pageUuid, blockIndexStr] = blockMatch;
      const blockIndex = parseInt(blockIndexStr, 10);
      
      // Find the page and update the block at the specific index
      const findAndUpdateBlockByIndex = (node: NodeData): NodeData | null => {
        if (node.uuid === pageUuid && node.items && node.items[blockIndex]) {
          const updatedItems = [...node.items];
          updatedItems[blockIndex] = { ...updatedItems[blockIndex], ...data };
          return {
            ...node,
            items: updatedItems
          };
        }
        
        // Search in nested items
        if (node.items) {
          for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];
            if (item.type === 'set' && typeof item !== 'string') {
              const updated = findAndUpdateBlockByIndex(item as NodeData);
              if (updated) {
                const updatedItems = [...node.items];
                updatedItems[i] = updated;
                return {
                  ...node,
                  items: updatedItems
                };
              }
            }
          }
        }
        
        return null;
      };
      
      const updatedRootNode = findAndUpdateBlockByIndex(state.rootNode);
      if (updatedRootNode) {
        debug.log("Updated root node with composite block ID changes");
        updateNode(state.rootNode.uuid!, updatedRootNode);
        return;
      }
    }
    
    // Try to find and update as a regular block UUID (survey builder format)
    const updatedRootNode = findAndUpdateBlock(state.rootNode, nodeId);
    if (updatedRootNode) {
      debug.log("Updated root node with block UUID changes");
      updateNode(state.rootNode.uuid!, updatedRootNode);
    } else {
      // If not found as a block, treat as regular node update
      debug.log("Treating as regular node update");
      updateNode(nodeId, data);
    }
  }, [updateNode, state.rootNode]);

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (!state.rootNode) {
      debug.error("No root node available for deletion");
      return;
    }
    
    // Handle composite block IDs (flow builder format: pageUuid-block-index)
    const blockMatch = nodeId.match(/^(.+)-block-(\d+)$/);
    if (blockMatch) {
      const [, pageUuid, blockIndexStr] = blockMatch;
      const blockIndex = parseInt(blockIndexStr, 10);
      
      // Find the page and remove the block at the specific index
      const findAndRemoveBlockByIndex = (node: NodeData): NodeData | null => {
        if (node.uuid === pageUuid && node.items && node.items[blockIndex]) {
          const updatedItems = [...node.items];
          updatedItems.splice(blockIndex, 1);
          return {
            ...node,
            items: updatedItems
          };
        }
        
        // Search in nested items
        if (node.items) {
          for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];
            if (item.type === 'set' && typeof item !== 'string') {
              const updated = findAndRemoveBlockByIndex(item as NodeData);
              if (updated) {
                const updatedItems = [...node.items];
                updatedItems[i] = updated;
                return {
                  ...node,
                  items: updatedItems
                };
              }
            }
          }
        }
        
        return null;
      };
      
      const updatedRootNode = findAndRemoveBlockByIndex(state.rootNode);
      if (updatedRootNode) {
        debug.log("Updated root node with block removal");
        updateNode(state.rootNode.uuid!, updatedRootNode);
      }
    } else {
      // Handle regular node deletion (pages, submit nodes, etc.)
      removeNode(nodeId);
    }
    
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    if (configNodeId === nodeId) {
      setConfigNodeId(null);
      setShowNodeConfig(false);
    }
  }, [removeNode, selectedNodeId, configNodeId, state.rootNode, updateNode]);

  // Handle flow mode changes
  const handleModeChange = useCallback((mode: FlowMode) => {
    setFlowMode(mode);
  }, []);

  // Handle node configuration
  const handleNodeConfigure = useCallback((nodeId: string) => {
    debug.log("Configure node requested:", nodeId);
    setConfigMode("full"); // Use full mode for regular configuration
    setConfigNodeId(nodeId);
    setShowNodeConfig(true);
  }, []);

  // Handle edge update for connection line pointer dragging
  const handleEdgeUpdate = useCallback((edgeId: string, newTargetId: string) => {
    debug.log("Updating edge", edgeId, "to target", newTargetId);
    
    // Find the edge in the current flow data
    const edge = flowData.edges.find(e => e.id === edgeId);
    if (!edge) {
      debug.warn("Edge not found:", edgeId);
      return;
    }

    // For conditional navigation rules, update the block's navigation rules
    if (edge.type === "conditional") {
      const sourceNode = flowData.nodes.find(n => n.id === edge.source);
      if (sourceNode?.type === "block") {
        const blockData = sourceNode.data as any;
        const targetNode = flowData.nodes.find(n => n.id === newTargetId);
        
        if (targetNode) {
          // Determine the new target string
          let newTargetString = "";
          if (targetNode.type === "submit") {
            newTargetString = "submit";
          } else if (targetNode.type === "block") {
            const targetBlockData = targetNode.data as any;
            newTargetString = targetBlockData.fieldName || targetBlockData.label || targetNode.id;
          } else if (targetNode.type === "set") {
            const targetPageData = targetNode.data as any;
            newTargetString = targetPageData.name || targetPageData.uuid || targetNode.id;
          }

          // Update the navigation rule
          const navigationRules = blockData.navigationRules || [];
          const condition = edge.data?.condition || "";
          const isDefault = edge.data?.isDefault || false;

          // Find and update the matching rule
          const updatedRules = navigationRules.map((rule: any) => {
            if (rule.condition === condition && rule.isDefault === isDefault) {
              return {
                ...rule,
                target: newTargetString,
                isPage: targetNode.type === "set"
              };
            }
            return rule;
          });

          const updatedBlockData = {
            ...blockData,
            navigationRules: updatedRules
          };

          handleNodeUpdate(edge.source, updatedBlockData);
          debug.log("Updated navigation rule for edge:", edgeId);
        }
      }
    }
    // Handle page-to-page connections (direct page reordering)
    else if (edge.type === "default" && edge.data?.isPageToPage) {
      // For page-to-page edges, we're changing what comes AFTER the source page
      // The source page stays in its current position
      const sourcePageId = edge.source;
      const currentTargetPageId = edge.target;
      const newTargetPageId = newTargetId;
      
      debug.log(`Reordering pages via page-to-page connection: source=${sourcePageId} stays in place, changing its next page from ${currentTargetPageId} to ${newTargetPageId}`);
      
      // Find and reorder pages in the survey structure
      const findAndReorderPages = (node: NodeData): NodeData | null => {
        if (node.items) {
          // Find pages in the items array
          const pages = node.items.filter(item => item.type === 'set');
          const nonPages = node.items.filter(item => item.type !== 'set');
          
          if (pages.length > 0) {
            debug.log(`Original page order:`, pages.map((page, i) => `${i}: ${(page as NodeData).name || (page as NodeData).uuid}`));
            
            // Find indices
            const sourcePageIndex = pages.findIndex(page => (page as NodeData).uuid === sourcePageId);
            const currentTargetIndex = pages.findIndex(page => (page as NodeData).uuid === currentTargetPageId);
            const newTargetIndex = pages.findIndex(page => (page as NodeData).uuid === newTargetPageId);
            
            if (sourcePageIndex >= 0 && currentTargetIndex >= 0 && newTargetIndex >= 0) {
              // The source page should stay at its current position
              // We need to reorder what comes after it
              
              const updatedPages = [...pages];
              
              // If the new target should come right after the source
              // Remove the new target from its current position
              const [newTargetPage] = updatedPages.splice(newTargetIndex, 1);
              
              // Insert it right after the source page
              let insertPosition = sourcePageIndex + 1;
              if (newTargetIndex <= sourcePageIndex) {
                // If we removed a page before the source, the source index shifted
                insertPosition = sourcePageIndex;
              }
              
              updatedPages.splice(insertPosition, 0, newTargetPage);
              
              debug.log(`New page order:`, updatedPages.map((page, i) => `${i}: ${(page as NodeData).name || (page as NodeData).uuid}`));
              
              // Combine back with non-page items
              return {
                ...node,
                items: [...updatedPages, ...nonPages]
              };
            }
          }
        }
        
        // Search in child nodes if not found in items
        if (node.nodes) {
          for (let i = 0; i < node.nodes.length; i++) {
            const childNode = node.nodes[i];
            if (typeof childNode !== 'string') {
              const updated = findAndReorderPages(childNode);
              if (updated) {
                const updatedNodes = [...node.nodes];
                updatedNodes[i] = updated;
                return {
                  ...node,
                  nodes: updatedNodes
                };
              }
            }
          }
        }
        
        return null;
      };
      
      if (state.rootNode) {
        const updatedRootNode = findAndReorderPages(state.rootNode);
        if (updatedRootNode) {
          debug.log("Updating root node with reordered pages via page-to-page connection");
          updateNode(state.rootNode.uuid!, updatedRootNode);
        } else {
          debug.log("Could not find and reorder pages via page-to-page connection");
        }
      }
    }
    // Handle start entry connections (from start to pages)
    else if (edge.type === "default" && edge.data?.isStartEntry) {
      // For start entry edges, we need to reorder the pages
      const currentTargetPageId = edge.target;
      const newTargetPageId = newTargetId;
      
      debug.log(`Reordering pages: moving page ${newTargetPageId} to position 0 (was ${currentTargetPageId})`);
      
      // Find and reorder pages in the survey structure
      const findAndReorderPages = (node: NodeData): NodeData | null => {
        if (node.items) {
          // Find pages in the items array
          const pages = node.items.filter(item => item.type === 'set');
          const nonPages = node.items.filter(item => item.type !== 'set');
          
          if (pages.length > 0) {
            debug.log(`Original page order:`, pages.map((page, i) => `${i}: ${(page as NodeData).name || (page as NodeData).uuid}`));
            
            // Find the target page to move
            const targetPageIndex = pages.findIndex(page => (page as NodeData).uuid === newTargetPageId);
            
            if (targetPageIndex >= 0) {
              // Remove the target page and insert at beginning
              const updatedPages = [...pages];
              const [targetPage] = updatedPages.splice(targetPageIndex, 1);
              updatedPages.unshift(targetPage);
              
              debug.log(`New page order:`, updatedPages.map((page, i) => `${i}: ${(page as NodeData).name || (page as NodeData).uuid}`));
              
              // Combine back with non-page items
              return {
                ...node,
                items: [...updatedPages, ...nonPages]
              };
            }
          }
        }
        
        // Search in child nodes if not found in items
        if (node.nodes) {
          for (let i = 0; i < node.nodes.length; i++) {
            const childNode = node.nodes[i];
            if (typeof childNode !== 'string') {
              const updated = findAndReorderPages(childNode);
              if (updated) {
                const updatedNodes = [...node.nodes];
                updatedNodes[i] = updated;
                return {
                  ...node,
                  nodes: updatedNodes
                };
              }
            }
          }
        }
        
        return null;
      };
      
      if (state.rootNode) {
        const updatedRootNode = findAndReorderPages(state.rootNode);
        if (updatedRootNode) {
          debug.log("Updating root node with reordered pages");
          updateNode(state.rootNode.uuid!, updatedRootNode);
        } else {
          debug.log("Could not find and reorder pages");
        }
      }
    }
    // Handle page entry connections (from page to first block)
    else if (edge.type === "default" && edge.data?.isPageEntry) {
      // For page entry edges, we need to reorder the blocks within the page
      const sourcePageId = edge.source;
      const currentTargetBlockId = edge.target;
      const newTargetBlockId = newTargetId;
      
      // Find the page in the survey structure
      const findAndReorderBlocks = (node: NodeData): NodeData | null => {
        if (node.uuid === sourcePageId && node.items) {
          // Extract block indices from IDs
          const currentBlockMatch = currentTargetBlockId.match(/^(.+)-block-(\d+)$/);
          const newBlockMatch = newTargetBlockId.match(/^(.+)-block-(\d+)$/);
          
          if (currentBlockMatch && newBlockMatch) {
            const newBlockIndex = parseInt(newBlockMatch[2]);
            
            // Insertion-based reordering: move the target block to position 0 and shift others
            const updatedItems = [...node.items];
            
            debug.log(`Reordering blocks: moving block from index ${newBlockIndex} to position 0`);
            debug.log(`Original order:`, updatedItems.map((item, i) => `${i}: ${(item as any).fieldName || (item as any).label || item.type}`));
            
            // Remove the target block from its current position
            const [targetBlock] = updatedItems.splice(newBlockIndex, 1);
            
            // Insert the target block at the beginning (position 0)
            updatedItems.unshift(targetBlock);
            
            debug.log(`New order:`, updatedItems.map((item, i) => `${i}: ${(item as any).fieldName || (item as any).label || item.type}`));
            
            return {
              ...node,
              items: updatedItems
            };
          }
        }
        
        // Search in nested items
        if (node.items) {
          for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];
            if (item.type === 'set' && typeof item !== 'string') {
              const updated = findAndReorderBlocks(item as NodeData);
              if (updated) {
                const updatedItems = [...node.items];
                updatedItems[i] = updated;
                return {
                  ...node,
                  items: updatedItems
                };
              }
            }
          }
        }
        
        return null;
      };
      
      if (state.rootNode) {
        const updatedRootNode = findAndReorderBlocks(state.rootNode);
        if (updatedRootNode) {
          updateNode(state.rootNode.uuid!, updatedRootNode);
        }
      }
    }
    // Handle sequential connections within same page (block reordering)
    else if (edge.type === "default" && edge.data?.isSequential) {
      // Check if this is a sequential edge within the same page
      const sourceMatch = edge.source.match(/^(.+)-block-(\d+)$/);
      const targetMatch = edge.target.match(/^(.+)-block-(\d+)$/);
      const newTargetMatch = newTargetId.match(/^(.+)-block-(\d+)$/);
      
      if (sourceMatch && targetMatch && newTargetMatch) {
        const sourcePageId = sourceMatch[1];
        const targetPageId = targetMatch[1];
        const newTargetPageId = newTargetMatch[1];
        
        // Only allow reordering within the same page
        if (sourcePageId === targetPageId && sourcePageId === newTargetPageId) {
          const sourceBlockIndex = parseInt(sourceMatch[2]);
          const newTargetBlockIndex = parseInt(newTargetMatch[2]);
          
          debug.log(`Reordering blocks within page ${sourcePageId}: moving block after index ${sourceBlockIndex} to after index ${newTargetBlockIndex}`);
          
          // Find the page and reorder blocks
          const findAndReorderBlocks = (node: NodeData): NodeData | null => {
            if (node.uuid === sourcePageId && node.items) {
              const updatedItems = [...node.items];
              
              debug.log(`Original order:`, updatedItems.map((item, i) => `${i}: ${(item as any).fieldName || (item as any).label || item.type}`));
              
              // The source block should be moved to be right after the new target block
              const [movedBlock] = updatedItems.splice(sourceBlockIndex, 1);
              
              // Calculate the insertion index
              let insertIndex = newTargetBlockIndex;
              if (sourceBlockIndex < newTargetBlockIndex) {
                // If moving forward, adjust for the removal
                insertIndex = newTargetBlockIndex;
              } else {
                // If moving backward, insert after the target
                insertIndex = newTargetBlockIndex + 1;
              }
              
              // Insert the block at the new position
              updatedItems.splice(insertIndex, 0, movedBlock);
              
              debug.log(`New order:`, updatedItems.map((item, i) => `${i}: ${(item as any).fieldName || (item as any).label || item.type}`));
              
              return {
                ...node,
                items: updatedItems
              };
            }
            
            // Search in nested items
            if (node.items) {
              for (let i = 0; i < node.items.length; i++) {
                const item = node.items[i];
                if (item.type === 'set' && typeof item !== 'string') {
                  const updated = findAndReorderBlocks(item as NodeData);
                  if (updated) {
                    const updatedItems = [...node.items];
                    updatedItems[i] = updated;
                    return {
                      ...node,
                      items: updatedItems
                    };
                  }
                }
              }
            }
            
            return null;
          };
          
          if (state.rootNode) {
            const updatedRootNode = findAndReorderBlocks(state.rootNode);
            if (updatedRootNode) {
              updateNode(state.rootNode.uuid!, updatedRootNode);
            }
          }
        } else {
          debug.log("Cannot reorder blocks across different pages");
        }
      }
    }
    // For other edge types (sequential, etc.)
    else {
      debug.log("Edge update not implemented for edge type:", edge.type);
    }
  }, [flowData.edges, flowData.nodes, handleNodeUpdate]);

  // Handle connection creation for navigation rules
  const handleConnectionCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    debug.log("Creating connection from", sourceNodeId, "to", targetNodeId);
    
    // Find the source node data
    const sourceNode = flowData.nodes.find(n => n.id === sourceNodeId);
    if (sourceNode?.type !== "block") {
      debug.warn("Connections can only be created from block nodes");
      return;
    }

    // Find the target node
    const targetNode = flowData.nodes.find(n => n.id === targetNodeId);
    if (!targetNode) {
      debug.warn("Target node not found");
      return;
    }

    // Extract the actual block data from the source node
    const blockData = sourceNode.data as any;
    
    // Determine the target string based on target node type
    let targetString = "";
    let isPageTarget = false;
    
    if (targetNode.type === "submit") {
      targetString = "submit";
    } else if (targetNode.type === "block") {
      // For block targets, we need to find the actual block UUID from the node data
      const targetBlockData = targetNode.data as any;
      // For blocks, the navigation rules expect the block's UUID, not its fieldName
      targetString = targetBlockData.uuid || targetNode.id;
      isPageTarget = false;
    } else if (targetNode.type === "set") {
      // For page targets, use the page UUID from the node data
      const targetPageData = targetNode.data as any;
      // For pages, use the uuid property which is what collectPages returns
      targetString = targetPageData.uuid || targetNode.id;
      isPageTarget = true;
    }

    if (!targetString) {
      debug.warn("Could not determine target string for connection");
      return;
    }

    // Get the source field name for pre-populating the condition
    const sourceFieldName = blockData.fieldName || blockData.label || "field";

    // Add the navigation rule to the source block with better defaults
    const existingRules = blockData.navigationRules || [];
    const newRule = {
      condition: `${sourceFieldName} == ""`, // Pre-populate with source field
      target: targetString,
      isPage: isPageTarget,
      isDefault: false
    };

    const updatedBlockData = {
      ...blockData,
      navigationRules: [...existingRules, newRule]
    };

    debug.log("Creating navigation rule:", {
      sourceNode: sourceNodeId,
      sourceFieldName,
      targetNode: targetNodeId,
      targetString,
      targetNodeData: targetNode.data,
      newRule
    });

    // Update the node with the new navigation rule
    handleNodeUpdate(sourceNodeId, updatedBlockData);
    
    // Small delay to ensure the update is processed before opening the editor
    setTimeout(() => {
      // Open the NavigationRulesEditor in navigation-only mode
      setConfigMode("navigation-only");
      setConfigNodeId(sourceNodeId);
      setShowNodeConfig(true);
    }, 100);
    
    debug.log("Added navigation rule and opened editor:", newRule);
  }, [flowData.nodes, handleNodeUpdate]);

  // Handle fit view
  const fitViewRef = useRef<(() => void) | undefined>(undefined);
  const handleFitView = useCallback(() => {
    if (fitViewRef.current) {
      fitViewRef.current();
    }
  }, []);

  // Handle reset positions to initial layout
  const handleResetPositions = useCallback(() => {
    debug.log("Resetting node positions to initial layout");
    
    // Apply hierarchical layout to get fresh positions
    const layoutedNodes = hierarchicalLayoutNodes(flowData.nodes, flowData.edges, state.enableDebug);
    
    // Extract positions from layouted nodes
    const newPositions: Record<string, { x: number; y: number }> = {};
    layoutedNodes.forEach(node => {
      newPositions[node.id] = node.position;
    });
    
    debug.log("Reset positions:", newPositions);
    setNodePositions(newPositions);
    setInitialNodePositions(newPositions);
  }, [flowData.nodes, flowData.edges, state.enableDebug]);

  // Handle node creation from click (place at center of canvas)
  const handleNodeCreateFromClick = useCallback((nodeType: string) => {
    // Place new nodes at a default position (center of visible area)
    const defaultPosition = { x: 400, y: 300 };
    handleNodeCreate(defaultPosition, nodeType);
  }, [handleNodeCreate]);


  // History change handler removed - no longer needed without undo/redo

  // Undo/Redo functions are now handled directly by FlowCanvas via ref

  return (
    <div className="flow-builder h-full flex flex-col">
      {/* Flow Toolbar */}
      <FlowToolbar
        mode={flowMode}
        onModeChange={handleModeChange}
        onFitView={handleFitView}
        onExport={() => {}}
      />
      
      {/* Debug info */}
      {/* <div className="bg-muted border-b border-border px-4 py-2 text-sm">
        <div className="flex gap-4 items-center flex-wrap">
          <span>Root: {state.rootNode?.uuid || 'None'}</span>
          <span>Root Items: {state.rootNode?.items?.length || 0}</span>
          <span>Root Nodes: {state.rootNode?.nodes?.length || 0}</span>
          <span>Pages in Items: {state.rootNode?.items?.filter(i => i.type === 'set').length || 0}</span>
          <span>Total Blocks: {state.rootNode?.items?.reduce((sum, item) => {
            if (item.type === 'set') {
              return sum + (item.items?.length || 0);
            }
            return sum;
          }, 0) || 0}</span>
          <span>Flow Nodes: {flowData.nodes.length}</span>
          <Button 
            type="button"
            size="sm"
            variant="default"
            onClick={() => handleNodeCreateFromClick('set')}
            className="text-xs h-6"
          >
            Debug: Add Page
          </Button>
          <Button 
            type="button"
            size="sm"
            variant="outline"
            onClick={() => debug.log("Root Node Structure:", state.rootNode)}
            className="text-xs h-6"
          >
            Log Structure
          </Button>
        </div>
      </div> */}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with node types */}
        <FlowSidebar 
          definitions={state.definitions}
          onNodeDragStart={(nodeType) => {
            debug.log("Dragging node type:", nodeType);
          }}
          onNodeCreate={handleNodeCreateFromClick}
        />

        {/* Main canvas area */}
        <div className="flex-1 relative">
          <FlowCanvas
            ref={flowCanvasRef}
            nodes={flowData.nodes}
            edges={flowData.edges}
            nodePositions={nodePositions}
            mode={flowMode}
            selectedNodeId={selectedNodeId}
            activePageId={activePageId}
            onNodeCreate={handleNodeCreate}
            onNodeSelect={handleNodeSelect}
            onNodeUpdate={handleNodeUpdate}
            onNodePositionUpdate={handleNodePositionUpdate}
            onNodeDelete={handleNodeDelete}
            onNodeConfigure={handleNodeConfigure}
            onModeChange={handleModeChange}
            onFitView={fitViewRef}
            onConnectionCreate={handleConnectionCreate}
            onEdgeUpdate={handleEdgeUpdate}
            onResetPositions={handleResetPositions}
            enableDebug={state.enableDebug}
          />
        </div>

        {/* Node configuration dialog */}
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