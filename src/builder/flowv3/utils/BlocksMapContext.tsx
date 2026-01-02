import React, { createContext, useContext } from "react";
import type { BlockData } from "../../../types";

// Context for sharing blocksMap across flow components
// This enables O(1) block lookups instead of O(n) Array.find()
const BlocksMapContext = createContext<Map<string, BlockData>>(new Map());

export const BlocksMapProvider = BlocksMapContext.Provider;

/**
 * Hook to access the shared blocks map for O(1) lookups
 * Use blocksMap.get(uuid) instead of blocks.find(b => b.uuid === uuid)
 */
export const useBlocksMap = () => useContext(BlocksMapContext);
