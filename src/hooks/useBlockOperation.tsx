import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

// Module-level registry that persists across component remounts
// Key: blockId, Value: { timestamp, abortController }
const operationRegistry = new Map<string, {
  timestamp: number;
  abortController: AbortController;
}>();

// Debounce window in milliseconds - operations within this window are considered duplicates
const OPERATION_DEBOUNCE_MS = 2000;

// Cleanup old entries periodically (entries older than 30 seconds)
const CLEANUP_THRESHOLD_MS = 30000;

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of operationRegistry.entries()) {
      if (now - value.timestamp > CLEANUP_THRESHOLD_MS) {
        operationRegistry.delete(key);
      }
    }

    // Stop interval if registry is empty
    if (operationRegistry.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, CLEANUP_THRESHOLD_MS);
}

interface BlockMountGuardContextValue {
  blockId: string;
  instanceId: string;
  /**
   * Run an async operation that will be deduplicated across rapid remounts.
   * Returns true if the operation was allowed to run, false if it was debounced.
   */
  runOperation: (
    operationKey: string,
    operation: (signal: AbortSignal) => Promise<void>
  ) => Promise<boolean>;
  /**
   * Check if an operation is currently pending/in-progress
   */
  isOperationPending: (operationKey: string) => boolean;
  /**
   * Abort a specific operation
   */
  abortOperation: (operationKey: string) => void;
}

const BlockMountGuardContext = createContext<BlockMountGuardContextValue | null>(null);

interface BlockMountGuardProps {
  blockId: string;
  children?: React.ReactNode;
}

/**
 * BlockMountGuard provides a stable context for blocks that handles:
 * - Deduplication of async operations across rapid unmount/remount cycles
 * - Automatic cleanup of pending operations on unmount
 * - Abort signal propagation for cancellable operations
 *
 * This component is automatically wrapped around all blocks via getBlockDefinition.
 */
export const BlockMountGuard: React.FC<BlockMountGuardProps> = ({ blockId, children }) => {
  // Unique instance ID for this mount
  const instanceIdRef = useRef(`${blockId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const mountedRef = useRef(true);

  // Track operations started by THIS instance (for cleanup on unmount)
  const instanceOperationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    startCleanupInterval();

    return () => {
      mountedRef.current = false;

      // On unmount, abort operations that were started by THIS instance
      // But DON'T remove from registry - let the debounce window protect against rapid remount
      for (const opKey of instanceOperationsRef.current) {
        const fullKey = `${blockId}:${opKey}`;
        const existing = operationRegistry.get(fullKey);
        if (existing) {
          existing.abortController.abort();
        }
      }
      instanceOperationsRef.current.clear();
    };
  }, [blockId]);

  const runOperation = useCallback(async (
    operationKey: string,
    operation: (signal: AbortSignal) => Promise<void>
  ): Promise<boolean> => {
    const fullKey = `${blockId}:${operationKey}`;
    const now = Date.now();

    // Check if there's a recent operation (within debounce window)
    const existing = operationRegistry.get(fullKey);
    if (existing && (now - existing.timestamp) < OPERATION_DEBOUNCE_MS) {
      // Operation was recently started, skip this one
      return false;
    }

    // Abort any existing operation for this key
    if (existing) {
      existing.abortController.abort();
    }

    // Create new abort controller and register the operation
    const abortController = new AbortController();
    operationRegistry.set(fullKey, {
      timestamp: now,
      abortController,
    });

    // Track this operation as belonging to this instance
    instanceOperationsRef.current.add(operationKey);

    try {
      await operation(abortController.signal);
      return true;
    } catch (error: any) {
      // Don't throw if it was an abort
      if (error?.name === 'AbortError' || abortController.signal.aborted) {
        return false;
      }
      throw error;
    }
  }, [blockId]);

  const isOperationPending = useCallback((operationKey: string): boolean => {
    const fullKey = `${blockId}:${operationKey}`;
    const existing = operationRegistry.get(fullKey);
    if (!existing) return false;

    // Consider it pending if within debounce window and not aborted
    const now = Date.now();
    return (now - existing.timestamp) < OPERATION_DEBOUNCE_MS && !existing.abortController.signal.aborted;
  }, [blockId]);

  const abortOperation = useCallback((operationKey: string) => {
    const fullKey = `${blockId}:${operationKey}`;
    const existing = operationRegistry.get(fullKey);
    if (existing) {
      existing.abortController.abort();
      operationRegistry.delete(fullKey);
    }
  }, [blockId]);

  const contextValue: BlockMountGuardContextValue = {
    blockId,
    instanceId: instanceIdRef.current,
    runOperation,
    isOperationPending,
    abortOperation,
  };

  return (
    <BlockMountGuardContext.Provider value={contextValue}>
      {children}
    </BlockMountGuardContext.Provider>
  );
};

/**
 * Hook to access block operation utilities.
 * Use this in blocks that need to run async operations on mount.
 *
 * @example
 * ```tsx
 * const { runOperation } = useBlockOperation();
 *
 * useEffect(() => {
 *   runOperation('fetch-data', async (signal) => {
 *     const response = await fetch('/api/data', { signal });
 *     if (!signal.aborted) {
 *       setData(await response.json());
 *     }
 *   });
 * }, []);
 * ```
 */
export function useBlockOperation() {
  const context = useContext(BlockMountGuardContext);

  if (!context) {
    // Return a fallback that still provides debouncing via module-level registry
    // This handles cases where a block is rendered outside the guard
    return {
      blockId: 'unknown',
      instanceId: 'unknown',
      runOperation: async (
        operationKey: string,
        operation: (signal: AbortSignal) => Promise<void>
      ): Promise<boolean> => {
        const fullKey = `fallback:${operationKey}`;
        const now = Date.now();

        const existing = operationRegistry.get(fullKey);
        if (existing && (now - existing.timestamp) < OPERATION_DEBOUNCE_MS) {
          return false;
        }

        if (existing) {
          existing.abortController.abort();
        }

        const abortController = new AbortController();
        operationRegistry.set(fullKey, { timestamp: now, abortController });
        startCleanupInterval();

        try {
          await operation(abortController.signal);
          return true;
        } catch (error: any) {
          if (error?.name === 'AbortError' || abortController.signal.aborted) {
            return false;
          }
          throw error;
        }
      },
      isOperationPending: (operationKey: string): boolean => {
        const fullKey = `fallback:${operationKey}`;
        const existing = operationRegistry.get(fullKey);
        if (!existing) return false;
        const now = Date.now();
        return (now - existing.timestamp) < OPERATION_DEBOUNCE_MS && !existing.abortController.signal.aborted;
      },
      abortOperation: (operationKey: string) => {
        const fullKey = `fallback:${operationKey}`;
        const existing = operationRegistry.get(fullKey);
        if (existing) {
          existing.abortController.abort();
          operationRegistry.delete(fullKey);
        }
      },
    };
  }

  return context;
}

/**
 * Utility to clear all registered operations.
 * Useful for testing or when navigating away from the survey entirely.
 */
export function clearAllBlockOperations() {
  for (const [, value] of operationRegistry.entries()) {
    value.abortController.abort();
  }
  operationRegistry.clear();

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
