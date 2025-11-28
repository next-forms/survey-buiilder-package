import React, { createContext, useContext, useMemo, useRef, useCallback } from "react";

interface LabelPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EdgeLabelContextValue {
  registerLabel: (id: string, x: number, y: number, width: number, height: number) => void;
  unregisterLabel: (id: string) => void;
  getOffset: (edgeId: string, baseX: number, baseY: number, labelWidth: number) => { offsetX: number; offsetY: number };
  clearAll: () => void;
}

const EdgeLabelContext = createContext<EdgeLabelContextValue | null>(null);

const LABEL_HEIGHT = 22;
const LABEL_MIN_WIDTH = 60;
const LABEL_PADDING = 10;
const MAX_OFFSET_ITERATIONS = 8;

interface LabelBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boundsOverlap(a: LabelBounds, b: LabelBounds): boolean {
  return !(
    a.right + LABEL_PADDING < b.left ||
    b.right + LABEL_PADDING < a.left ||
    a.bottom + LABEL_PADDING < b.top ||
    b.bottom + LABEL_PADDING < a.top
  );
}

function getBounds(pos: LabelPosition): LabelBounds {
  const halfWidth = pos.width / 2;
  const halfHeight = pos.height / 2;
  return {
    left: pos.x - halfWidth,
    right: pos.x + halfWidth,
    top: pos.y - halfHeight,
    bottom: pos.y + halfHeight,
  };
}

export const EdgeLabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const positionsRef = useRef<Map<string, LabelPosition>>(new Map());

  const registerLabel = useCallback(
    (id: string, x: number, y: number, width: number, height: number) => {
      positionsRef.current.set(id, { id, x, y, width, height });
    },
    []
  );

  const unregisterLabel = useCallback((id: string) => {
    positionsRef.current.delete(id);
  }, []);

  const getOffset = useCallback(
    (edgeId: string, baseX: number, baseY: number, labelWidth: number): { offsetX: number; offsetY: number } => {
      const width = Math.max(labelWidth, LABEL_MIN_WIDTH);
      const height = LABEL_HEIGHT;

      let offsetX = 0;
      let offsetY = 0;

      const currentBounds: LabelBounds = {
        left: baseX - width / 2,
        right: baseX + width / 2,
        top: baseY - height / 2,
        bottom: baseY + height / 2,
      };

      // Check against all existing positions
      for (let iteration = 0; iteration < MAX_OFFSET_ITERATIONS; iteration++) {
        let hasCollision = false;

        for (const [id, pos] of positionsRef.current) {
          if (id === edgeId) continue;

          const otherBounds = getBounds(pos);
          const testBounds: LabelBounds = {
            left: currentBounds.left + offsetX,
            right: currentBounds.right + offsetX,
            top: currentBounds.top + offsetY,
            bottom: currentBounds.bottom + offsetY,
          };

          if (boundsOverlap(testBounds, otherBounds)) {
            hasCollision = true;

            // Push vertically (better for horizontal flow layout)
            const centerY = baseY + offsetY;
            const otherCenterY = pos.y;
            if (centerY <= otherCenterY) {
              offsetY -= (height + LABEL_PADDING);
            } else {
              offsetY += (height + LABEL_PADDING);
            }
            break;
          }
        }

        if (!hasCollision) break;
      }

      return { offsetX, offsetY };
    },
    []
  );

  const clearAll = useCallback(() => {
    positionsRef.current.clear();
  }, []);

  const value = useMemo(
    () => ({
      registerLabel,
      unregisterLabel,
      getOffset,
      clearAll,
    }),
    [registerLabel, unregisterLabel, getOffset, clearAll]
  );

  return (
    <EdgeLabelContext.Provider value={value}>
      {children}
    </EdgeLabelContext.Provider>
  );
};

export function useEdgeLabelContext() {
  const context = useContext(EdgeLabelContext);
  if (!context) {
    throw new Error("useEdgeLabelContext must be used within EdgeLabelProvider");
  }
  return context;
}

// Optional hook that doesn't throw if context is missing
export function useEdgeLabelContextOptional() {
  return useContext(EdgeLabelContext);
}
