import { NodeData, BlockData } from "../../../types";
import { FlowNode, FlowEdge } from "../types";
import { debugLog, debugError } from "../../../utils/debugUtils";

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function surveyToFlow(rootNode: NodeData, enableDebug: boolean = false): FlowData {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  
  debugLog(enableDebug, "surveyToFlow called with rootNode:", rootNode);
  
  // Ensure root node has a UUID
  if (!rootNode.uuid) {
    debugError(enableDebug, "Root node missing UUID, generating one");
    rootNode.uuid = `root_${Date.now()}`;
  }
  
  // Layout configuration for node sizing
  const layout = {
    pageSize: { width: 350, height: 250 },
    blockSize: { width: 140, height: 80 }
  };
  
  // Skip creating section node since there's only one section
  
  // Process pages - they can be in both items array AND nodes array
  const pagesFromItems = rootNode.items?.filter(item => item.type === "set") || [];
  const pagesFromNodes = rootNode.nodes?.filter(node => 
    typeof node !== 'string' && node.type === "set"
  ) || [];
  
  // Combine both sources of pages
  const pagesToProcess = [...pagesFromItems, ...pagesFromNodes];
  
  debugLog(enableDebug, "Pages from items:", pagesFromItems.length);
  debugLog(enableDebug, "Pages from nodes:", pagesFromNodes.length);
  debugLog(enableDebug, "Total pages to process:", pagesToProcess.length);

  // Create a sequential flow map to track all blocks in order
  const sequentialBlocks: Array<{
    blockId: string;
    pageIndex: number;
    blockIndex: number;
    hasNavigationRules: boolean;
  }> = [];

  if (pagesToProcess.length > 0) {
    debugLog(enableDebug, "Processing pages:", pagesToProcess);
    
    // Better page layout algorithm - calculate optimal grid layout
    const optimalPagesPerRow = Math.min(pagesToProcess.length, 3); // Max 3 pages per row for better visibility
    
    pagesToProcess.forEach((childNode, pageIndex) => {
      // Handle both string UUIDs and actual NodeData objects
      let actualChildNode: NodeData;
      
      if (typeof childNode === 'string') {
        debugLog(enableDebug, "Found string node UUID:", childNode);
        actualChildNode = {
          uuid: childNode,
          type: "set",
          name: `Page ${pageIndex + 1}`,
          items: [],
          nodes: []
        };
      } else {
        actualChildNode = childNode as NodeData;
      }
      
      // Ensure child node has UUID
      if (!actualChildNode.uuid) {
        console.error("Child node missing UUID, generating one");
        actualChildNode.uuid = `page_${Date.now()}_${pageIndex}`;
      }
      
      // Calculate dynamic page size to accommodate all blocks
      const blockCount = actualChildNode.items?.filter(item => item.type !== "set").length || 0;
      const blockSpacing = { x: 20, y: 20 }; // Local spacing for calculations
      const blocksPerRow = Math.min(
        Math.floor(layout.pageSize.width / (layout.blockSize.width + blockSpacing.x)), 
        Math.max(1, Math.ceil(Math.sqrt(blockCount)))
      );
      const blockRows = Math.max(1, Math.ceil(blockCount / blocksPerRow));
      
      // Calculate required space for all blocks with generous padding
      const requiredWidth = Math.max(
        layout.pageSize.width, 
        blocksPerRow * (layout.blockSize.width + blockSpacing.x) + blockSpacing.x * 2 + 40 // Extra padding
      );
      const requiredHeight = Math.max(
        layout.pageSize.height, 
        60 + blockRows * (layout.blockSize.height + blockSpacing.y) + blockSpacing.y * 2 + 40 // Extra padding
      );
      
      // Dynamic page size with generous boundaries
      const dynamicPageSize = {
        width: requiredWidth,
        height: requiredHeight
      };
      
      debugLog(enableDebug, `Adding page node ${pageIndex} with size (${dynamicPageSize.width} x ${dynamicPageSize.height}):`, actualChildNode);
      
      // Add page node with dynamic container size, position will be set by hierarchical layout
      nodes.push({
        id: actualChildNode.uuid,
        type: "set",
        position: { x: 0, y: 0 }, // Default position, will be overridden by layout
        data: { ...actualChildNode, containerSize: dynamicPageSize }
      });
      
      // Skip adding edges from root to pages since we removed the section node
      
      // Process blocks within this page in a smart grid layout
      if (actualChildNode.items && actualChildNode.items.length > 0) {
        debugLog(enableDebug, `Processing ${actualChildNode.items.length} blocks in page:`, actualChildNode.name);
        
        // Process blocks within this page
        
        actualChildNode.items.forEach((item, blockIndex) => {
          // Skip non-block items (like other sets)
          if (item.type === "set") {
            debugLog(enableDebug, "Skipping nested set in page items");
            return;
          }
          
          // This is a block item
          const block = item as BlockData;
          const blockId = `${actualChildNode.uuid}-block-${blockIndex}`;
          
          // Add to sequential tracking
          sequentialBlocks.push({
            blockId,
            pageIndex,
            blockIndex,
            hasNavigationRules: !!(block.navigationRules && block.navigationRules.length > 0)
          });
          
          debugLog(enableDebug, `Adding block node ${blockIndex}:`, block);
          
          // Add block node, position will be set by hierarchical layout
          nodes.push({
            id: blockId,
            type: "block",
            position: { x: 0, y: 0 }, // Default position, will be overridden by layout
            data: { ...block, containerSize: layout.blockSize }
          });
          
          // Only connect page to first block of the page
          if (blockIndex === 0) {
            edges.push({
              id: `${actualChildNode.uuid}-${blockId}`,
              source: actualChildNode.uuid,
              target: blockId,
              type: "default",
              style: {
                stroke: '#10b981', // Green color for page entry
                strokeWidth: 1.5
              },
              data: {
                label: "Start",
                isPageEntry: true
              }
            });
          }
        });
      }
    });

    // Now add sequential flow connections and navigation rule connections
    debugLog(enableDebug, "Sequential blocks order:", sequentialBlocks);
    
    // Add sequential flow edges between all blocks
    for (let i = 0; i < sequentialBlocks.length - 1; i++) {
      const currentBlock = sequentialBlocks[i];
      const nextBlock = sequentialBlocks[i + 1];
      
      // Add sequential flow edge (unless the current block has navigation rules that override)
      const sequentialEdgeId = `${currentBlock.blockId}-sequential-${nextBlock.blockId}`;
      edges.push({
        id: sequentialEdgeId,
        source: currentBlock.blockId,
        target: nextBlock.blockId,
        type: "default",
        style: { 
          stroke: '#94a3b8', // Gray color for sequential flow
          strokeDasharray: currentBlock.hasNavigationRules ? '5,5' : undefined // Dashed if has nav rules
        },
        data: {
          label: currentBlock.hasNavigationRules ? "Default" : "",
          isSequential: true
        }
      });
    }

    // Add final sequential edge to submit for the last block (if no navigation rules)
    if (sequentialBlocks.length > 0) {
      const lastBlock = sequentialBlocks[sequentialBlocks.length - 1];
      
      // Add a virtual submit node if it doesn't exist
      const submitNodeId = "submit-node";
      if (!nodes.find(n => n.id === submitNodeId)) {
        nodes.push({
          id: submitNodeId,
          type: "submit",
          position: { x: 0, y: 0 }, // Default position, will be overridden by layout
          data: { 
            name: "Submit", 
            type: "submit",
            containerSize: { width: 100, height: 60 }
          }
        });
      }
      
      // Add sequential edge to submit for last block
      edges.push({
        id: `${lastBlock.blockId}-sequential-submit`,
        source: lastBlock.blockId,
        target: submitNodeId,
        type: "default",
        style: { 
          stroke: '#94a3b8',
          strokeDasharray: lastBlock.hasNavigationRules ? '5,5' : undefined
        },
        data: {
          label: lastBlock.hasNavigationRules ? "Default" : "",
          isSequential: true
        }
      });
    }

    // Now add navigation rule edges (conditional branches)
    pagesToProcess.forEach((childNode, pageIndex) => {
      let actualChildNode: NodeData;
      
      if (typeof childNode === 'string') {
        actualChildNode = {
          uuid: childNode,
          type: "set", 
          name: `Page ${pageIndex + 1}`,
          items: [],
          nodes: []
        };
      } else {
        actualChildNode = childNode as NodeData;
      }

      if (actualChildNode.items && actualChildNode.items.length > 0) {
        actualChildNode.items.forEach((item, blockIndex) => {
          if (item.type === "set") return;
          
          const block = item as BlockData;
          const blockId = `${actualChildNode.uuid}-block-${blockIndex}`;
          
          // Add navigation rule edges (conditional branches)
          if (block.navigationRules && block.navigationRules.length > 0) {
            block.navigationRules.forEach((rule, ruleIndex) => {
              if (rule.target && rule.target !== "submit") {
                let targetNodeId = null;
                
                if (rule.isPage) {
                  // Target is a page - find the page and connect to its first block
                  const targetPage = pagesToProcess.find(page => {
                    const pageNode = typeof page === 'string' ? { uuid: page, name: page } : page;
                    return pageNode.name === rule.target || pageNode.uuid === rule.target;
                  });
                  
                  if (targetPage) {
                    const targetPageNode = typeof targetPage === 'string' ? { uuid: targetPage, items: [] } : targetPage;
                    if (targetPageNode.items && targetPageNode.items.length > 0) {
                      // Connect to first block of target page
                      targetNodeId = `${targetPageNode.uuid}-block-0`;
                    } else {
                      // Connect to page itself if no blocks
                      targetNodeId = targetPageNode.uuid;
                    }
                  }
                } else {
                  // Target is a specific block - search through all blocks
                  const targetBlock = sequentialBlocks.find(seqBlock => {
                    const blockData = nodes.find(n => n.id === seqBlock.blockId)?.data as BlockData;
                    return blockData?.fieldName === rule.target || 
                           blockData?.label === rule.target ||
                           blockData?.uuid === rule.target;
                  });
                  
                  if (targetBlock) {
                    targetNodeId = targetBlock.blockId;
                  }
                }
                
                if (targetNodeId) {
                  edges.push({
                    id: `${blockId}-nav-${ruleIndex}`,
                    source: blockId,
                    target: targetNodeId,
                    type: "conditional",
                    animated: true,
                    style: {
                      stroke: rule.isDefault ? '#f59e0b' : '#3b82f6', // Orange for default, blue for conditional
                      strokeWidth: 2
                    },
                    data: {
                      condition: rule.condition,
                      label: rule.condition || "Default",
                      isDefault: rule.isDefault || false
                    }
                  });
                }
              } else if (rule.target === "submit") {
                const submitNodeId = "submit-node";
                edges.push({
                  id: `${blockId}-submit-${ruleIndex}`,
                  source: blockId,
                  target: submitNodeId,
                  type: "conditional", 
                  animated: true,
                  style: {
                    stroke: rule.isDefault ? '#f59e0b' : '#10b981', // Orange for default, green for submit
                    strokeWidth: 2
                  },
                  data: {
                    condition: rule.condition,
                    label: rule.condition ? rule.condition : "Submit",
                    isDefault: rule.isDefault || false
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    debugLog(enableDebug, "No child nodes found in root node");
  }
  
  return { nodes, edges };
}

export function flowToSurvey(flowData: FlowData): NodeData | null {
  const { nodes, edges } = flowData;
  
  // Since we removed the section node, create a root structure from pages
  if (nodes.length === 0) return null;
  
  // Build the survey structure with a virtual root
  const result: NodeData = {
    uuid: `root_${Date.now()}`,
    type: "section",
    name: "Survey",
    nodes: [],
    items: []
  };
  
  // Find all page nodes connected to root
  const pageNodes = nodes.filter(n => n.type === "set");
  
  pageNodes.forEach(pageNode => {
    const pageData = pageNode.data as NodeData;
    const page: NodeData = {
      ...pageData,
      items: [],
      nodes: []
    };
    
    // Find all blocks connected to this page
    const pageBlocks = nodes.filter(n => 
      n.type === "block" && 
      edges.some(e => e.source === pageNode.id && e.target === n.id)
    );
    
    pageBlocks.forEach(blockNode => {
      const blockData = blockNode.data as BlockData;
      
      // Rebuild navigation rules from edges
      const navigationRules = edges
        .filter(e => e.source === blockNode.id && e.type === "conditional")
        .map(e => ({
          condition: e.data?.condition || "",
          target: findTargetByNodeId(nodes, e.target),
          isPage: true,
          isDefault: !e.data?.condition
        }));
      
      page.items!.push({
        ...blockData,
        navigationRules
      });
    });
    
    result.nodes!.push(page);
  });
  
  return result;
}


function findTargetByNodeId(nodes: FlowNode[], nodeId: string): string {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return "";
  
  if (node.type === "set") {
    const nodeData = node.data as NodeData;
    return nodeData.name || nodeData.uuid;
  }
  
  return "";
}

export function autoLayoutNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  // Simple auto-layout algorithm
  const layoutNodes = [...nodes];
  
  // Find root nodes (nodes with no incoming edges)
  const rootNodes = layoutNodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );
  
  // Perform breadth-first layout
  const visited = new Set<string>();
  const queue = rootNodes.map((node, index) => ({
    node,
    level: 0,
    index
  }));
  
  while (queue.length > 0) {
    const { node, level, index } = queue.shift()!;
    
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    
    // Position node
    node.position = {
      x: index * 300 + 100,
      y: level * 200 + 100
    };
    
    // Add children to queue
    const childEdges = edges.filter(edge => edge.source === node.id);
    childEdges.forEach((edge, childIndex) => {
      const childNode = layoutNodes.find(n => n.id === edge.target);
      if (childNode && !visited.has(childNode.id)) {
        queue.push({
          node: childNode,
          level: level + 1,
          index: childIndex
        });
      }
    });
  }
  
  return layoutNodes;
}

export function hierarchicalLayoutNodes(nodes: FlowNode[], edges: FlowEdge[], enableDebug: boolean = false): FlowNode[] {
  const layoutNodes = [...nodes];
  
  // Layout configuration
  const layout = {
    pageSpacing: { x: 500, y: 400 }, // Large spacing between pages
    blockSpacing: { x: 160, y: 100 }, // Spacing between blocks within a page
    levelSpacing: 300, // Vertical spacing between hierarchy levels
    startPosition: { x: 200, y: 100 },
    blockOffset: { x: 20, y: 60 } // Offset of blocks relative to their parent page
  };
  
  // Separate pages and blocks
  const pageNodes = layoutNodes.filter(node => node.type === "set");
  const blockNodes = layoutNodes.filter(node => node.type === "block");
  const submitNodes = layoutNodes.filter(node => node.type === "submit");
  
  debugLog(enableDebug, "Pages:", pageNodes.length, "Blocks:", blockNodes.length, "Submit:", submitNodes.length);
  
  // Build navigation graph for conditional flows
  const navigationEdges = edges.filter(edge => edge.type === "conditional");
  
  // Build page-to-page navigation by analyzing block navigation rules
  const pageNavigationGraph = new Map<string, string[]>();
  
  navigationEdges.forEach(edge => {
    // Check if this edge connects blocks to pages or pages
    const sourceNode = layoutNodes.find(n => n.id === edge.source);
    const targetNode = layoutNodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      let sourcePage = sourceNode.type === "set" ? sourceNode.id : null;
      let targetPage = targetNode.type === "set" ? targetNode.id : null;
      
      // If source is a block, find its parent page
      if (sourceNode.type === "block") {
        const match = sourceNode.id.match(/^(.+)-block-(\d+)$/);
        if (match) {
          sourcePage = match[1];
        }
      }
      
      // If target is a block, find its parent page
      if (targetNode.type === "block") {
        const match = targetNode.id.match(/^(.+)-block-(\d+)$/);
        if (match) {
          targetPage = match[1];
        }
      }
      
      // Create page-to-page connection if they are different pages
      if (sourcePage && targetPage && sourcePage !== targetPage) {
        if (!pageNavigationGraph.has(sourcePage)) {
          pageNavigationGraph.set(sourcePage, []);
        }
        if (!pageNavigationGraph.get(sourcePage)!.includes(targetPage)) {
          pageNavigationGraph.get(sourcePage)!.push(targetPage);
        }
      }
    }
  });
  
  // Find root pages (pages with no incoming navigation from other pages)
  const rootPages = pageNodes.filter(page => {
    return !Array.from(pageNavigationGraph.values()).flat().includes(page.id);
  });
  
  debugLog(enableDebug, "Root pages:", rootPages.map(p => p.id));
  debugLog(enableDebug, "Page navigation graph:", Array.from(pageNavigationGraph.entries()));
  
  // Calculate levels for pages using BFS
  const pageLevels = new Map<string, number>();
  const levelPages = new Map<number, string[]>();
  const visited = new Set<string>();
  const queue: Array<{ pageId: string; level: number }> = [];
  
  // Start from root pages
  rootPages.forEach(page => {
    queue.push({ pageId: page.id, level: 0 });
  });
  
  // If no root pages found, start with the first page
  if (rootPages.length === 0 && pageNodes.length > 0) {
    queue.push({ pageId: pageNodes[0].id, level: 0 });
  }
  
  // BFS to assign levels to pages
  while (queue.length > 0) {
    const { pageId, level } = queue.shift()!;
    
    if (visited.has(pageId)) continue;
    visited.add(pageId);
    
    pageLevels.set(pageId, level);
    
    if (!levelPages.has(level)) {
      levelPages.set(level, []);
    }
    levelPages.get(level)!.push(pageId);
    
    // Add child pages to queue
    const children = pageNavigationGraph.get(pageId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ pageId: childId, level: level + 1 });
      }
    });
  }
  
  // Handle unvisited pages (no navigation connections)
  // Put them at the last level + 1 to appear at the bottom
  const maxLevel = visited.size > 0 ? Math.max(...Array.from(pageLevels.values())) : -1;
  const newPageLevel = maxLevel + 1;
  
  pageNodes.forEach(page => {
    if (!visited.has(page.id)) {
      pageLevels.set(page.id, newPageLevel);
      if (!levelPages.has(newPageLevel)) {
        levelPages.set(newPageLevel, []);
      }
      levelPages.get(newPageLevel)!.push(page.id);
    }
  });
  
  // Position pages
  const pagePositions = new Map<string, { x: number; y: number }>();
  levelPages.forEach((pageIds, level) => {
    const y = layout.startPosition.y + level * layout.levelSpacing;
    
    // Calculate horizontal spacing for pages at this level
    const totalWidth = (pageIds.length - 1) * layout.pageSpacing.x;
    const startX = layout.startPosition.x + (pageIds.length > 1 ? -totalWidth / 2 : 0);
    
    pageIds.forEach((pageId, index) => {
      const x = startX + index * layout.pageSpacing.x;
      pagePositions.set(pageId, { x, y });
    });
  });
  
  // Position blocks relative to their parent pages
  const blockPositions = new Map<string, { x: number; y: number }>();
  blockNodes.forEach(blockNode => {
    // Extract parent page ID from block ID (format: pageId-block-index)
    const match = blockNode.id.match(/^(.+)-block-(\d+)$/);
    if (match) {
      const [, parentPageId, blockIndexStr] = match;
      const blockIndex = parseInt(blockIndexStr);
      
      const parentPagePos = pagePositions.get(parentPageId);
      if (parentPagePos) {
        // Layout blocks in a grid within the page
        const blocksInPage = blockNodes.filter(b => b.id.startsWith(`${parentPageId}-block-`));
        const blocksPerRow = Math.min(2, blocksInPage.length); // Max 2 blocks per row
        const row = Math.floor(blockIndex / blocksPerRow);
        const col = blockIndex % blocksPerRow;
        
        const blockX = parentPagePos.x + layout.blockOffset.x + col * layout.blockSpacing.x;
        const blockY = parentPagePos.y + layout.blockOffset.y + row * layout.blockSpacing.y;
        
        blockPositions.set(blockNode.id, { x: blockX, y: blockY });
      }
    }
  });
  
  // Position submit node
  if (submitNodes.length > 0) {
    const maxLevel = Math.max(...Array.from(pageLevels.values()));
    const submitX = layout.startPosition.x;
    const submitY = layout.startPosition.y + (maxLevel + 1) * layout.levelSpacing;
    
    submitNodes.forEach(submitNode => {
      submitNode.position = { x: submitX, y: submitY };
    });
  }
  
  // Apply all calculated positions
  layoutNodes.forEach(node => {
    if (node.type === "set") {
      const position = pagePositions.get(node.id);
      if (position) {
        node.position = position;
      }
    } else if (node.type === "block") {
      const position = blockPositions.get(node.id);
      if (position) {
        node.position = position;
      }
    }
  });
  
  debugLog(enableDebug, "Hierarchical layout results:");
  debugLog(enableDebug, "Page levels:", Array.from(pageLevels.entries()));
  debugLog(enableDebug, "Page positions:", Array.from(pagePositions.entries()));
  debugLog(enableDebug, "Block positions:", Array.from(blockPositions.entries()));
  
  return layoutNodes;
}

export function repositionBlocksInPage(
  pageId: string, 
  nodes: FlowNode[], 
  nodePositions: Record<string, { x: number; y: number }>,
  enableDebug: boolean = false
): Record<string, { x: number; y: number }> {
  const updatedPositions: Record<string, { x: number; y: number }> = {};
  
  // Find the page position
  const pagePos = nodePositions[pageId];
  if (!pagePos) return updatedPositions;
  
  // Find all blocks in this page
  const blocksInPage = nodes.filter(node => 
    node.type === "block" && node.id.startsWith(`${pageId}-block-`)
  );
  
  if (blocksInPage.length === 0) return updatedPositions;
  
  // Layout configuration
  const blockOffset = { x: 20, y: 60 };
  const blockSpacing = { x: 160, y: 100 };
  const blocksPerRow = Math.min(2, blocksInPage.length);
  
  // Reposition all blocks in this page
  blocksInPage.forEach(blockNode => {
    const match = blockNode.id.match(/^(.+)-block-(\d+)$/);
    if (match) {
      const [, , blockIndexStr] = match;
      const blockIndex = parseInt(blockIndexStr);
      
      const row = Math.floor(blockIndex / blocksPerRow);
      const col = blockIndex % blocksPerRow;
      
      updatedPositions[blockNode.id] = {
        x: pagePos.x + blockOffset.x + col * blockSpacing.x,
        y: pagePos.y + blockOffset.y + row * blockSpacing.y
      };
    }
  });
  
  debugLog(enableDebug, `Repositioned ${blocksInPage.length} blocks in page ${pageId}:`, updatedPositions);
  return updatedPositions;
}