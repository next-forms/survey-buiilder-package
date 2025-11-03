import type { BlockData, ABTestConfig, ABTestVariant } from '../types';

/**
 * Selects a variant based on weighted probabilities using a deterministic approach
 * @param config A/B test configuration
 * @param blockId Unique identifier for the block (used for deterministic selection)
 * @param sessionId Optional session ID for user-specific consistency
 * @param debug Optional debug mode to log selection process
 * @param previewMode If true, bypasses storage and always selects a fresh variant
 * @returns Selected variant or null if no variants available
 */
export function selectVariant(
  config: ABTestConfig,
  blockId: string,
  sessionId?: string,
  debug: boolean = false,
  previewMode: boolean = false
): ABTestVariant | null {
  if (!config.enabled || !config.variants || config.variants.length === 0) {
    if (debug) console.log('[A/B Test] No variants configured or disabled');
    return null;
  }

  // If only one variant, return it
  if (config.variants.length === 1) {
    if (debug) console.log('[A/B Test] Only one variant, using:', config.variants[0].name);
    return config.variants[0];
  }

  // In preview mode, skip storage lookup
  if (!previewMode) {
    // Check if we have a previously selected variant stored
    const storageKey = `abtest_${blockId}${sessionId ? `_${sessionId}` : ''}`;
    const storedVariantId = getStoredVariantId(storageKey);

    if (storedVariantId) {
      const storedVariant = config.variants.find(v => v.id === storedVariantId);
      if (storedVariant) {
        if (debug) console.log('[A/B Test] Using stored variant:', storedVariant.name, 'for block:', blockId);
        return storedVariant;
      }
    }
  } else if (debug) {
    console.log('[A/B Test] Preview mode enabled - selecting fresh variant');
  }

  // Calculate total weight
  const totalWeight = config.variants.reduce((sum, v) => sum + (v.weight || 0), 0);

  // Generate storage key for non-preview mode
  const storageKey = `abtest_${blockId}${sessionId ? `_${sessionId}` : ''}`;

  if (totalWeight === 0) {
    // If all weights are 0, distribute equally
    const randomIndex = Math.floor(Math.random() * config.variants.length);
    const selectedVariant = config.variants[randomIndex];
    if (debug) {
      console.log('[A/B Test] All weights are 0, random selection:', selectedVariant.name);
    }
    if (!previewMode) {
      storeVariantId(storageKey, selectedVariant.id);
    }
    return selectedVariant;
  }

  // Generate a random number between 0 and totalWeight
  const random = Math.random() * totalWeight;

  if (debug) {
    console.log('[A/B Test] Block:', blockId);
    console.log('[A/B Test] Total weight:', totalWeight, 'Random value:', random.toFixed(2));
    console.log('[A/B Test] Variants:', config.variants.map(v => `${v.name} (weight: ${v.weight})`).join(', '));
  }

  // Select variant based on cumulative weights
  let cumulativeWeight = 0;
  for (const variant of config.variants) {
    cumulativeWeight += variant.weight || 0;
    if (random < cumulativeWeight) {
      if (debug) {
        console.log('[A/B Test] Selected variant:', variant.name, `(${random.toFixed(2)} < ${cumulativeWeight})`);
      }
      if (!previewMode) {
        storeVariantId(storageKey, variant.id);
      }
      return variant;
    }
  }

  // Fallback to last variant (edge case when random equals totalWeight)
  const fallbackVariant = config.variants[config.variants.length - 1];
  if (debug) {
    console.log('[A/B Test] Fallback to last variant:', fallbackVariant.name);
  }
  if (!previewMode) {
    storeVariantId(storageKey, fallbackVariant.id);
  }
  return fallbackVariant;
}

/**
 * Generates a stable block identifier for A/B testing
 * @param block Block data
 * @returns Stable identifier string
 */
function generateBlockId(block: BlockData): string {
  // Use UUID if available (most reliable)
  if (block.uuid) {
    return block.uuid;
  }

  // Use fieldName if available
  if (block.fieldName) {
    return block.fieldName;
  }

  // Fallback: create a hash from block properties
  // This ensures blocks with different content get different IDs
  const identifier = `${block.type}_${block.label || ''}_${block.name || ''}`;
  return identifier;
}

/**
 * Gets the block data to render, considering A/B testing
 * @param block Original block data
 * @param sessionId Optional session ID for user-specific consistency
 * @param debug Optional debug mode
 * @param previewMode If true, bypasses storage and always selects a fresh variant
 * @returns Block data to render (either original or variant)
 */
export function getBlockDataForRendering(
  block: BlockData,
  sessionId?: string,
  debug: boolean = false,
  previewMode: boolean = false
): BlockData {
  if (!block.abTest?.enabled) {
    return block;
  }

  const blockId = generateBlockId(block);
  const selectedVariant = selectVariant(block.abTest, blockId, sessionId, debug, previewMode);

  if (!selectedVariant) {
    return block;
  }

  if (debug) {
    console.log('[A/B Test] Rendering variant:', selectedVariant.name, 'for block:', block.fieldName || block.label);
  }

  // Return the variant's block data, but preserve the original UUID and fieldName
  // to ensure form values are correctly associated
  return {
    ...selectedVariant.blockData,
    uuid: block.uuid,
    fieldName: block.fieldName,
    // Keep the original A/B test config to track what was selected
    abTest: {
      ...block.abTest,
      selectedVariantId: selectedVariant.id,
    },
  };
}

/**
 * Stores the selected variant ID for consistency across renders
 */
function storeVariantId(key: string, variantId: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, variantId);
    }
  } catch (error) {
    console.warn('Failed to store A/B test variant selection:', error);
  }
}

/**
 * Retrieves the previously selected variant ID
 */
function getStoredVariantId(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch (error) {
    console.warn('Failed to retrieve A/B test variant selection:', error);
  }
  return null;
}

/**
 * Clears all A/B test selections (useful for testing or resetting state)
 */
export function clearABTestSelections(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const keys = Object.keys(window.sessionStorage);
      for (const key of keys) {
        if (key.startsWith('abtest_')) {
          window.sessionStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to clear A/B test selections:', error);
  }
}

/**
 * Gets analytics data for the selected variant
 * @param block Block data with A/B test configuration
 * @returns Object with variant information for analytics tracking
 */
export function getABTestAnalytics(block: BlockData): {
  isABTest: boolean;
  variantId?: string;
  variantName?: string;
  totalVariants?: number;
} {
  if (!block.abTest?.enabled) {
    return { isABTest: false };
  }

  const selectedVariantId = block.abTest.selectedVariantId;
  const selectedVariant = block.abTest.variants.find(v => v.id === selectedVariantId);

  return {
    isABTest: true,
    variantId: selectedVariantId,
    variantName: selectedVariant?.name,
    totalVariants: block.abTest.variants.length,
  };
}
