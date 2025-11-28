import { useCallback, useRef } from "react";
import type { Edge } from "@xyflow/react";

interface LabelPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LabelBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const LABEL_HEIGHT = 20; // Approximate height of label
const LABEL_MIN_WIDTH = 60; // Minimum label width
const LABEL_PADDING = 8; // Padding between labels
const MAX_OFFSET_ITERATIONS = 10;

/**
 * Check if two label bounds overlap
 */
function boundsOverlap(a: LabelBounds, b: LabelBounds): boolean {
  return !(
    a.right + LABEL_PADDING < b.left ||
    b.right + LABEL_PADDING < a.left ||
    a.bottom + LABEL_PADDING < b.top ||
    b.bottom + LABEL_PADDING < a.top
  );
}

/**
 * Get bounds from position
 */
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

/**
 * Calculate label offset to avoid collisions with other labels
 */
export function calculateLabelOffset(
  edgeId: string,
  baseX: number,
  baseY: number,
  labelWidth: number,
  existingPositions: Map<string, LabelPosition>
): { offsetX: number; offsetY: number } {
  const width = Math.max(labelWidth, LABEL_MIN_WIDTH);
  const height = LABEL_HEIGHT;

  const currentBounds: LabelBounds = {
    left: baseX - width / 2,
    right: baseX + width / 2,
    top: baseY - height / 2,
    bottom: baseY + height / 2,
  };

  let offsetX = 0;
  let offsetY = 0;

  // Check against all existing positions
  for (let iteration = 0; iteration < MAX_OFFSET_ITERATIONS; iteration++) {
    let hasCollision = false;

    for (const [id, pos] of existingPositions) {
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

        // Calculate push direction - prefer vertical offset for horizontal layout
        const overlapX = Math.min(
          testBounds.right - otherBounds.left,
          otherBounds.right - testBounds.left
        );
        const overlapY = Math.min(
          testBounds.bottom - otherBounds.top,
          otherBounds.bottom - testBounds.top
        );

        // Prefer vertical offset (looks better in horizontal flow)
        if (overlapY <= overlapX || Math.abs(offsetY) < height * 3) {
          // Push vertically
          const centerY = baseY + offsetY;
          const otherCenterY = pos.y;
          if (centerY <= otherCenterY) {
            offsetY -= (height + LABEL_PADDING);
          } else {
            offsetY += (height + LABEL_PADDING);
          }
        } else {
          // Push horizontally as fallback
          const centerX = baseX + offsetX;
          const otherCenterX = pos.x;
          if (centerX <= otherCenterX) {
            offsetX -= (width / 2 + LABEL_PADDING);
          } else {
            offsetX += (width / 2 + LABEL_PADDING);
          }
        }
        break;
      }
    }

    if (!hasCollision) break;
  }

  return { offsetX, offsetY };
}

/**
 * Hook to manage edge label positions and detect collisions
 */
export function useEdgeLabelPositions() {
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
    (edgeId: string, baseX: number, baseY: number, labelWidth: number) => {
      return calculateLabelOffset(
        edgeId,
        baseX,
        baseY,
        labelWidth,
        positionsRef.current
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    positionsRef.current.clear();
  }, []);

  return {
    registerLabel,
    unregisterLabel,
    getOffset,
    clearAll,
    positions: positionsRef.current,
  };
}

export type EdgeLabelPositionManager = ReturnType<typeof useEdgeLabelPositions>;
