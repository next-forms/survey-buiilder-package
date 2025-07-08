import React, { useState, useCallback, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { FlowCanvas } from "./FlowCanvas";
import { FlowSidebar } from "./FlowSidebar";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { FlowToolbar } from "./FlowToolbar";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { NodeData, BlockData } from "../../types";
import { flowToSurvey, surveyToFlow, hierarchicalLayoutNodes, repositionBlocksInPage } from "./utils/flowTransforms";
import { FlowNode, FlowEdge, FlowMode } from "./types";

export const FlowBuilder: React.FC = () => {
  const { state, updateNode, createNode, removeNode } = useSurveyBuilder();
  const [flowMode, setFlowMode] = useState<FlowMode>("select");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  
  // Convert survey structure to flow format with positions
  const flowData = React.useMemo(() => {
    if (!state.rootNode) {
      console.log("No root node available for flow");
      return { nodes: [], edges: [] };
    }
    
    console.log("Converting survey to flow, root node:", state.rootNode);
    const data = surveyToFlow(state.rootNode);
    console.log("Flow data before applying positions:", data);
    
    // Apply stored positions
    data.nodes = data.nodes.map(node => ({
      ...node,
      position: nodePositions[node.id] || node.position
    }));
    
    console.log("Final flow data with positions:", data);
    console.log("Current node positions:", nodePositions);
    
    return data;
  }, [state.rootNode, nodePositions]);

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
      
      console.log("Layout check:", {
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
        console.log("Applying full hierarchical layout");
        
        // Apply hierarchical layout based on navigation rules
        const layoutedNodes = hierarchicalLayoutNodes(flowData.nodes, flowData.edges);
        
        // Extract positions from layouted nodes
        const newPositions: Record<string, { x: number; y: number }> = {};
        layoutedNodes.forEach(node => {
          newPositions[node.id] = node.position;
        });
        
        console.log("Setting full layout positions:", newPositions);
        setNodePositions(newPositions); // Complete replacement
      }
      // Partial layout for block additions within existing pages
      else if (currentBlockCount !== prevData.blockCount && newNodesWithoutPositions.length > 0) {
        console.log("Applying partial layout for new blocks");
        
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
          const repositionedBlocks = repositionBlocksInPage(pageId, flowData.nodes, nodePositions);
          Object.assign(partialPositions, repositionedBlocks);
        });
        
        if (Object.keys(partialPositions).length > 0) {
          console.log("Setting partial layout positions:", partialPositions);
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
        console.log(`Moving page ${nodeId} and its children by (${deltaX}, ${deltaY})`);
        
        // Find all child blocks of this page
        flowData.nodes.forEach(node => {
          if (node.type === "block" && node.id.startsWith(`${nodeId}-block-`)) {
            const childOldPos = prev[node.id];
            if (childOldPos) {
              newPositions[node.id] = {
                x: childOldPos.x + deltaX,
                y: childOldPos.y + deltaY
              };
              console.log(`Moving child block ${node.id} to (${newPositions[node.id].x}, ${newPositions[node.id].y})`);
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

    console.log("Creating node of type:", nodeType, "at position:", position, "targetPage:", targetPageId);
    console.log("Available node definitions:", Object.keys(state.definitions.nodes));
    console.log("Available block definitions:", Object.keys(state.definitions.blocks));

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
        console.log("Found target page:", targetPage);
      }
      
      if (!targetPage) {
        // Fallback to first available page - check items array first
        const pageFromItems = state.rootNode.items?.find(item => item.type === 'set') as NodeData;
        if (pageFromItems) {
          targetPage = pageFromItems;
        } else {
          // Fallback to nodes array
          targetPage = state.rootNode.nodes?.[0] as NodeData;
          if (targetPage && typeof targetPage === 'string') {
            targetPage = null;
          }
        }
      }
      
      if (targetPage && typeof targetPage !== 'string') {
        // Use the same format as ContentBlockPage.tsx handleAddBlockItem
        const blockDefinition = state.definitions.blocks[nodeType];
        if (!blockDefinition) {
          console.error(`No block definition found for type '${nodeType}'`);
          return;
        }

        const blockId = `${targetPage.uuid}-block-${(targetPage.items?.length || 0)}`;
        const blockData: BlockData = {
          ...blockDefinition.defaultData,
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
        
        console.log(`Added block ${nodeType} to page ${targetPage.name || targetPage.uuid}`);
      } else {
        console.error("No page available to add block to");
      }
    }
  }, [createNode, updateNode, state.rootNode, state.definitions]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    console.log("Node selected:", nodeId);
    setSelectedNodeId(nodeId || null);
  }, []);

  // Handle node update
  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    console.log("Updating node:", nodeId, "with data:", data);
    
    if (!state.rootNode) {
      console.error("No root node available for update");
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
        console.log("Updated root node with composite block ID changes");
        updateNode(state.rootNode.uuid!, updatedRootNode);
        return;
      }
    }
    
    // Try to find and update as a regular block UUID (survey builder format)
    const updatedRootNode = findAndUpdateBlock(state.rootNode, nodeId);
    if (updatedRootNode) {
      console.log("Updated root node with block UUID changes");
      updateNode(state.rootNode.uuid!, updatedRootNode);
    } else {
      // If not found as a block, treat as regular node update
      console.log("Treating as regular node update");
      updateNode(nodeId, data);
    }
  }, [updateNode, state.rootNode]);

  // Handle node deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    removeNode(nodeId);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    if (configNodeId === nodeId) {
      setConfigNodeId(null);
      setShowNodeConfig(false);
    }
  }, [removeNode, selectedNodeId, configNodeId]);

  // Handle flow mode changes
  const handleModeChange = useCallback((mode: FlowMode) => {
    setFlowMode(mode);
  }, []);

  // Handle node configuration
  const handleNodeConfigure = useCallback((nodeId: string) => {
    console.log("Configure node requested:", nodeId);
    setConfigNodeId(nodeId);
    setShowNodeConfig(true);
  }, []);

  // Handle connection creation for navigation rules
  const handleConnectionCreate = useCallback((sourceNodeId: string, targetNodeId: string) => {
    console.log("Creating connection from", sourceNodeId, "to", targetNodeId);
    
    // Find the source node data
    const sourceNode = flowData.nodes.find(n => n.id === sourceNodeId);
    if (sourceNode?.type !== "block") {
      console.warn("Connections can only be created from block nodes");
      return;
    }

    // Find the target node
    const targetNode = flowData.nodes.find(n => n.id === targetNodeId);
    if (!targetNode) {
      console.warn("Target node not found");
      return;
    }

    // Extract the actual block data from the source node
    const blockData = sourceNode.data as any;
    
    // Determine the target string based on target node type
    let targetString = "";
    if (targetNode.type === "submit") {
      targetString = "submit";
    } else if (targetNode.type === "block") {
      // For block targets, use the field name
      const targetBlockData = targetNode.data as any;
      targetString = targetBlockData.fieldName || targetBlockData.label || targetNode.id;
    } else if (targetNode.type === "set") {
      // For page targets, use the page name or UUID
      const targetPageData = targetNode.data as any;
      targetString = targetPageData.name || targetPageData.uuid || targetNode.id;
    }

    if (!targetString) {
      console.warn("Could not determine target string for connection");
      return;
    }

    // Add the navigation rule to the source block
    const existingRules = blockData.navigationRules || [];
    const newRule = {
      condition: "", // Default empty condition - user will need to configure this
      target: targetString,
      isPage: targetNode.type === "set",
      isDefault: false
    };

    const updatedBlockData = {
      ...blockData,
      navigationRules: [...existingRules, newRule]
    };

    // Update the node with the new navigation rule
    updateNode(sourceNodeId, updatedBlockData);
    
    console.log("Added navigation rule:", newRule);
  }, [flowData.nodes, updateNode]);

  // Handle fit view
  const fitViewRef = useRef<(() => void) | undefined>(undefined);
  const handleFitView = useCallback(() => {
    if (fitViewRef.current) {
      fitViewRef.current();
    }
  }, []);

  // Handle node creation from click (place at center of canvas)
  const handleNodeCreateFromClick = useCallback((nodeType: string) => {
    // Place new nodes at a default position (center of visible area)
    const defaultPosition = { x: 400, y: 300 };
    handleNodeCreate(defaultPosition, nodeType);
  }, [handleNodeCreate]);

  return (
    <div className="flow-builder h-full flex flex-col">
      {/* Flow Toolbar */}
      <FlowToolbar
        mode={flowMode}
        onModeChange={handleModeChange}
        onUndo={() => {}}
        onRedo={() => {}}
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
            onClick={() => console.log("Root Node Structure:", state.rootNode)}
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
            console.log("Dragging node type:", nodeType);
          }}
          onNodeCreate={handleNodeCreateFromClick}
        />

        {/* Main canvas area */}
        <div className="flex-1 relative">
          <FlowCanvas
            nodes={flowData.nodes}
            edges={flowData.edges}
            mode={flowMode}
            selectedNodeId={selectedNodeId}
            onNodeCreate={handleNodeCreate}
            onNodeSelect={handleNodeSelect}
            onNodeUpdate={handleNodeUpdate}
            onNodePositionUpdate={handleNodePositionUpdate}
            onNodeDelete={handleNodeDelete}
            onNodeConfigure={handleNodeConfigure}
            onModeChange={handleModeChange}
            onFitView={fitViewRef}
            onConnectionCreate={handleConnectionCreate}
          />
        </div>

        {/* Node configuration dialog */}
        <NodeConfigPanel
          nodeId={configNodeId}
          open={showNodeConfig}
          onOpenChange={setShowNodeConfig}
          onUpdate={handleNodeUpdate}
        />
      </div>
    </div>
  );
};