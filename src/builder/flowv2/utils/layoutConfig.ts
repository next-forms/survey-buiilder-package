// Layout configuration for horizontal flow
// Separated from flowV2Transforms to avoid pulling in dagre dependency chain
export const LAYOUT_CONFIG = {
  // Dagre graph settings
  rankdir: "LR" as const, // Left-to-Right horizontal layout
  nodesep: 80, // Vertical separation between nodes in same rank
  ranksep: 200, // Horizontal separation between ranks (columns) - increased for better readability
  marginx: 100,
  marginy: 100,
  // Node size defaults
  startNodeWidth: 150,
  startNodeHeight: 50,
  submitNodeWidth: 150,
  submitNodeHeight: 50,
  blockNodeMinWidth: 320,
  blockNodeMaxWidth: 450,
  blockNodeBaseHeight: 80,
  // Spacing
  edgeSeparation: 20,
} as const;
