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

  // Add a start node
  const startNodeId = "start-node";
  nodes.push({
    id: startNodeId,
    type: "start",
    position: { x: 0, y: 0 }, // Default position, will be overridden by layout
    data: { 
      name: "Start", 
      type: "start",
      containerSize: { width: 100, height: 60 }
    }
  });

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
        debugError(enableDebug ,"Child node missing UUID, generating one");
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
      
      // Add edge from start node to first page
      if (pageIndex === 0) {
        edges.push({
          id: `${startNodeId}-${actualChildNode.uuid}`,
          source: startNodeId,
          target: actualChildNode.uuid,
          type: "default",
          style: {
            stroke: '#22c55e', // Green color for start connection
            strokeWidth: 2
          },
          data: {
            label: "Begin Survey",
            isStartEntry: true
          }
        });
      }
      
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
    
    // Add page-to-page connections for sequential flow
    for (let i = 0; i < pagesToProcess.length - 1; i++) {
      const currentPage = pagesToProcess[i];
      const nextPage = pagesToProcess[i + 1];
      
      const currentPageNode = typeof currentPage === 'string' ? { uuid: currentPage } : currentPage;
      const nextPageNode = typeof nextPage === 'string' ? { uuid: nextPage } : nextPage;
      
      // Add page-to-page connection edge
      const pageToPageEdgeId = `${currentPageNode.uuid}-page-to-page-${nextPageNode.uuid}`;
      edges.push({
        id: pageToPageEdgeId,
        source: currentPageNode.uuid,
        target: nextPageNode.uuid,
        type: "default",
        style: {
          stroke: '#3b82f6', // Blue color for page-to-page flow
          strokeWidth: 3
        },
        data: {
          label: `Page ${i + 1} → Page ${i + 2}`,
          isPageToPage: true
        }
      });
    }
    
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
    pageSpacing: { x: 450, y: 350 }, // Horizontal and vertical spacing between pages
    blockSpacing: { x: 160, y: 100 }, // Spacing between blocks within a page
    blockSize: { width: 140, height: 80 }, // Default block size
    rowSpacing: 400, // Vertical spacing between decision rows
    startPosition: { x: 400, y: 100 },
    blockOffset: { x: 20, y: 60 }, // Offset of blocks relative to their parent page
    decisionBranchSpacing: 550, // Extra horizontal spacing for decision branches
  };
  
  // Separate different node types
  const startNodes = layoutNodes.filter(node => node.type === "start");
  const pageNodes = layoutNodes.filter(node => node.type === "set");
  const blockNodes = layoutNodes.filter(node => node.type === "block");
  const submitNodes = layoutNodes.filter(node => node.type === "submit");
  
  debugLog(enableDebug, "Start:", startNodes.length, "Pages:", pageNodes.length, "Blocks:", blockNodes.length, "Submit:", submitNodes.length);
  
  // Build parent-child relationships for blocks
  const blockToPage = new Map<string, string>();
  blockNodes.forEach(block => {
    const match = block.id.match(/^(.+)-block-(\d+)$/);
    if (match) {
      blockToPage.set(block.id, match[1]);
    }
  });
  
  // Build navigation analysis
  const outgoingEdges = new Map<string, FlowEdge[]>();
  const incomingEdges = new Map<string, FlowEdge[]>();
  
  edges.forEach(edge => {
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge);
    
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);
  });
  
  // Identify blocks with navigation rules that create branches
  const branchingBlocks = new Set<string>();
  blockNodes.forEach(block => {
    const outgoing = outgoingEdges.get(block.id) || [];
    const conditionalEdges = outgoing.filter(e => e.type === "conditional");
    
    // A block creates branching if it has conditional edges to different pages
    if (conditionalEdges.length > 0) {
      const targetPages = new Set<string>();
      conditionalEdges.forEach(edge => {
        const targetNode = layoutNodes.find(n => n.id === edge.target);
        if (targetNode) {
          if (targetNode.type === "set") {
            targetPages.add(targetNode.id);
          } else if (targetNode.type === "block") {
            const parentPage = blockToPage.get(targetNode.id);
            if (parentPage) targetPages.add(parentPage);
          }
        }
      });
      
      // If conditional edges lead to different pages, it's a branching block
      if (targetPages.size > 1) {
        branchingBlocks.add(block.id);
      }
    }
  });
  
  debugLog(enableDebug, "Branching blocks:", Array.from(branchingBlocks));
  
  // Build page-level flow graph
  const pageFlowGraph = new Map<string, Set<string>>();
  const pageIncoming = new Map<string, Set<string>>();
  
  // Initialize page flow tracking
  pageNodes.forEach(page => {
    pageFlowGraph.set(page.id, new Set());
    pageIncoming.set(page.id, new Set());
  });
  
  // Analyze page-to-page flow through navigation rules
  edges.forEach(edge => {
    if (edge.type === "conditional") {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        let sourcePage: string | null = null;
        let targetPage: string | null = null;
        
        // Get source page
        if (sourceNode.type === "set") {
          sourcePage = sourceNode.id;
        } else if (sourceNode.type === "block") {
          sourcePage = blockToPage.get(sourceNode.id) || null;
        }
        
        // Get target page
        if (targetNode.type === "set") {
          targetPage = targetNode.id;
        } else if (targetNode.type === "block") {
          targetPage = blockToPage.get(targetNode.id) || null;
        }
        
        // Record page-to-page flow
        if (sourcePage && targetPage && sourcePage !== targetPage) {
          pageFlowGraph.get(sourcePage)?.add(targetPage);
          pageIncoming.get(targetPage)?.add(sourcePage);
        }
      }
    }
  });
  
  // Also consider sequential flow between pages
  const pageToPageEdges = edges.filter(e => e.data?.isPageToPage);
  pageToPageEdges.forEach(edge => {
    pageFlowGraph.get(edge.source)?.add(edge.target);
    pageIncoming.get(edge.target)?.add(edge.source);
  });
  
  // Calculate page levels using modified BFS that considers branching
  const pageLevels = new Map<string, number>();
  const levelPages = new Map<number, string[]>();
  const visited = new Set<string>();
  
  // Find root pages (connected from start or no incoming edges from other pages)
  const rootPages: string[] = [];
  pageNodes.forEach(page => {
    const hasStartConnection = edges.some(e => 
      e.source === "start-node" && e.target === page.id
    );
    const hasIncomingFromPages = pageIncoming.get(page.id)?.size || 0;
    
    if (hasStartConnection || hasIncomingFromPages === 0) {
      rootPages.push(page.id);
    }
  });
  
  // If no root pages found, use the first page
  if (rootPages.length === 0 && pageNodes.length > 0) {
    rootPages.push(pageNodes[0].id);
  }
  
  // BFS to assign levels, considering branching points
  const queue: Array<{ pageId: string; level: number; fromBranch: boolean }> = [];
  rootPages.forEach(pageId => {
    queue.push({ pageId, level: 0, fromBranch: false });
  });
  
  while (queue.length > 0) {
    const { pageId, level, fromBranch } = queue.shift()!;
    
    if (visited.has(pageId)) continue;
    visited.add(pageId);
    
    pageLevels.set(pageId, level);
    
    if (!levelPages.has(level)) {
      levelPages.set(level, []);
    }
    levelPages.get(level)!.push(pageId);
    
    // Check if this page contains branching blocks
    const pageHasBranching = blockNodes.some(block => 
      blockToPage.get(block.id) === pageId && branchingBlocks.has(block.id)
    );
    
    // Add connected pages to queue
    const connectedPages = pageFlowGraph.get(pageId) || new Set();
    connectedPages.forEach(targetPageId => {
      if (!visited.has(targetPageId)) {
        // If current page has branching, put targets in next level
        const nextLevel = pageHasBranching || fromBranch ? level + 1 : level + 1;
        queue.push({ pageId: targetPageId, level: nextLevel, fromBranch: pageHasBranching });
      }
    });
  }
  
  // Handle unvisited pages
  pageNodes.forEach(page => {
    if (!visited.has(page.id)) {
      const maxLevel = Math.max(...Array.from(pageLevels.values()), -1);
      const newLevel = maxLevel + 1;
      pageLevels.set(page.id, newLevel);
      
      if (!levelPages.has(newLevel)) {
        levelPages.set(newLevel, []);
      }
      levelPages.get(newLevel)!.push(page.id);
    }
  });
  
  // Position start node
  const nodePositions = new Map<string, { x: number; y: number }>();
  if (startNodes.length > 0) {
    nodePositions.set(startNodes[0].id, {
      x: layout.startPosition.x,
      y: layout.startPosition.y - layout.rowSpacing / 2
    });
  }
  
  // Position pages by level
  let currentY = layout.startPosition.y;
  levelPages.forEach((pageIds, level) => {
    if (pageIds.length === 0) return;
    
    // Check if this is a branching level
    const isBranchingLevel = pageIds.some(pageId => {
      const incomingPages = Array.from(pageIncoming.get(pageId) || []);
      return incomingPages.some(sourcePageId => {
        return blockNodes.some(block => 
          blockToPage.get(block.id) === sourcePageId && branchingBlocks.has(block.id)
        );
      });
    });
    
    // Use wider spacing for branching levels
    const horizontalSpacing = isBranchingLevel ? layout.decisionBranchSpacing : layout.pageSpacing.x;
    const totalWidth = Math.max(0, (pageIds.length - 1) * horizontalSpacing);
    let currentX = layout.startPosition.x - totalWidth / 2;
    
    pageIds.forEach(pageId => {
      nodePositions.set(pageId, { x: currentX, y: currentY });
      currentX += horizontalSpacing;
    });
    
    currentY += layout.rowSpacing;
  });
  
  // Position blocks within their parent pages
  blockNodes.forEach(blockNode => {
    const parentPageId = blockToPage.get(blockNode.id);
    if (parentPageId) {
      const parentPagePos = nodePositions.get(parentPageId);
      if (parentPagePos) {
        // Extract block index
        const match = blockNode.id.match(/^(.+)-block-(\d+)$/);
        if (match) {
          const blockIndex = parseInt(match[2]);
          
          // Layout blocks in a grid within the page
          const blocksInPage = blockNodes.filter(b => blockToPage.get(b.id) === parentPageId);
          const blocksPerRow = Math.min(2, blocksInPage.length); // Max 2 blocks per row
          const row = Math.floor(blockIndex / blocksPerRow);
          const col = blockIndex % blocksPerRow;
          
          const blockX = parentPagePos.x + layout.blockOffset.x + col * layout.blockSpacing.x;
          const blockY = parentPagePos.y + layout.blockOffset.y + row * layout.blockSpacing.y;
          
          nodePositions.set(blockNode.id, { x: blockX, y: blockY });
        }
      }
    }
  });
  
  // Position submit node
  if (submitNodes.length > 0) {
    const maxLevel = Math.max(...Array.from(pageLevels.values()), -1);
    nodePositions.set(submitNodes[0].id, {
      x: layout.startPosition.x,
      y: layout.startPosition.y + (maxLevel + 1) * layout.rowSpacing
    });
  }
  
  // Apply all calculated positions
  layoutNodes.forEach(node => {
    const position = nodePositions.get(node.id);
    if (position) {
      node.position = position;
    }
  });
  
  // Adjust page sizes based on their contents
  pageNodes.forEach(pageNode => {
    const pageBlocks = blockNodes.filter(b => blockToPage.get(b.id) === pageNode.id);
    const blockCount = pageBlocks.length;
    
    if (blockCount > 0) {
      const blocksPerRow = Math.min(2, blockCount);
      const blockRows = Math.ceil(blockCount / blocksPerRow);
      
      // Calculate required size with padding
      const requiredWidth = Math.max(
        350, // Minimum width
        blocksPerRow * layout.blockSize.width + (blocksPerRow - 1) * 20 + 60
      );
      const requiredHeight = Math.max(
        250, // Minimum height
        80 + blockRows * layout.blockSize.height + (blockRows - 1) * 20 + 40
      );
      
      // Update page data with container size
      const pageData = pageNode.data as any;
      pageData.containerSize = {
        width: requiredWidth,
        height: requiredHeight
      };
    }
  });
  
  debugLog(enableDebug, "Improved hierarchical layout results:");
  debugLog(enableDebug, "Page levels:", Array.from(pageLevels.entries()));
  debugLog(enableDebug, "Level pages:", Array.from(levelPages.entries()));
  debugLog(enableDebug, "Branching blocks:", Array.from(branchingBlocks));
  debugLog(enableDebug, "Page flow graph:", Array.from(pageFlowGraph.entries()));
  
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