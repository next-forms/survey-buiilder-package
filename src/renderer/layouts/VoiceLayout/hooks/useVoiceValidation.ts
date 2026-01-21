import { useState, useCallback, useRef } from 'react';
import type { BlockData } from '../../../../types';
import type {
  VoiceValidationOption,
  VoiceValidationResponse,
  MultiSelectVoiceState,
} from '../types';

interface UseVoiceValidationOptions {
  onConfirmationNeeded?: (message: string) => void;
  onValidationComplete?: (values: string[], labels: string[]) => void;
  onReaskNeeded?: (reason: string) => void;
  apiEndpoint?: string;
}

interface UseVoiceValidationReturn {
  validateAnswer: (
    transcript: string,
    block: BlockData,
    isConfirmation?: boolean,
    previousSelections?: string[]
  ) => Promise<VoiceValidationResponse>;
  multiSelectState: MultiSelectVoiceState;
  resetMultiSelectState: () => void;
  addToSelection: (value: string, label: string) => void;
  removeFromSelection: (value: string) => void;
  confirmSelection: () => void;
  isValidating: boolean;
}

/**
 * Extract options from a block
 */
function extractOptionsFromBlock(block: BlockData): VoiceValidationOption[] {
  const options: VoiceValidationOption[] = [];

  if (block.options && Array.isArray(block.options)) {
    for (const opt of block.options) {
      if (typeof opt === 'object' && opt !== null) {
        options.push({
          id: opt.id,
          label: opt.label || String(opt.value || opt),
          value: String(opt.value ?? opt.label ?? opt),
        });
      } else if (typeof opt === 'string') {
        options.push({ label: opt, value: opt });
      }
    }
  } else if (block.items && Array.isArray(block.items)) {
    for (const item of block.items as any[]) {
      if (typeof item === 'object' && item !== null) {
        options.push({
          id: item.id,
          label: item.label || String(item.value || item),
          value: String(item.value ?? item.label ?? item),
        });
      } else if (typeof item === 'string') {
        options.push({ label: item, value: item });
      }
    }
  } else if (block.labels && Array.isArray(block.labels)) {
    const values = block.values as string[] | undefined;
    block.labels.forEach((label, i) => {
      options.push({
        label: String(label),
        value: values?.[i] ?? String(label),
      });
    });
  }

  return options;
}

/**
 * Check if a block is multi-select
 */
function isMultiSelectBlock(block: BlockData): boolean {
  return (
    block.type === 'checkbox' ||
    block.multiSelect === true ||
    block.type === 'multiselect'
  );
}

/**
 * Hook for validating voice answers using AI
 */
export function useVoiceValidation(
  options: UseVoiceValidationOptions = {}
): UseVoiceValidationReturn {
  const {
    onConfirmationNeeded,
    onValidationComplete,
    onReaskNeeded,
    apiEndpoint = '/api/voice-survey/validate',
  } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [multiSelectState, setMultiSelectState] = useState<MultiSelectVoiceState>({
    isActive: false,
    selectedValues: [],
    selectedLabels: [],
    awaitingConfirmation: false,
    awaitingMoreSelections: false,
  });

  // Track options for current block
  const currentOptionsRef = useRef<VoiceValidationOption[]>([]);

  const resetMultiSelectState = useCallback(() => {
    setMultiSelectState({
      isActive: false,
      selectedValues: [],
      selectedLabels: [],
      awaitingConfirmation: false,
      awaitingMoreSelections: false,
    });
  }, []);

  const addToSelection = useCallback((value: string, label: string) => {
    setMultiSelectState((prev) => {
      if (prev.selectedValues.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        selectedValues: [...prev.selectedValues, value],
        selectedLabels: [...prev.selectedLabels, label],
      };
    });
  }, []);

  const removeFromSelection = useCallback((value: string) => {
    setMultiSelectState((prev) => {
      const index = prev.selectedValues.indexOf(value);
      if (index === -1) return prev;
      return {
        ...prev,
        selectedValues: prev.selectedValues.filter((_, i) => i !== index),
        selectedLabels: prev.selectedLabels.filter((_, i) => i !== index),
      };
    });
  }, []);

  const confirmSelection = useCallback(() => {
    setMultiSelectState((prev) => ({
      ...prev,
      awaitingConfirmation: false,
      awaitingMoreSelections: false,
    }));
    if (onValidationComplete) {
      onValidationComplete(multiSelectState.selectedValues, multiSelectState.selectedLabels);
    }
  }, [multiSelectState.selectedValues, multiSelectState.selectedLabels, onValidationComplete]);

  const validateAnswer = useCallback(
    async (
      transcript: string,
      block: BlockData,
      isConfirmation: boolean = false,
      previousSelections?: string[]
    ): Promise<VoiceValidationResponse> => {
      setIsValidating(true);

      try {
        const blockOptions = extractOptionsFromBlock(block);
        currentOptionsRef.current = blockOptions;

        const multiSelect = isMultiSelectBlock(block);

        // Use passed previousSelections or fall back to internal state
        const selections = previousSelections ?? multiSelectState.selectedValues;

        // If this is multi-select and we're awaiting confirmation, handle that
        if (multiSelect && (multiSelectState.awaitingConfirmation || (selections.length > 0 && isConfirmation))) {
          isConfirmation = true;
        }

        const requestBody = {
          transcript,
          options: blockOptions,
          multiSelect,
          questionLabel: block.label || block.name,
          blockType: block.type,
          previousSelections: selections,
          isConfirmation,
        };

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Validation request failed');
        }

        const result: VoiceValidationResponse = await response.json();

        // Handle different suggested actions
        if (result.suggestedAction === 'submit' && result.isValid) {
          // Single select or final submission
          if (multiSelect) {
            // For multi-select, merge with existing selections (use passed previousSelections)
            const allValues = [...new Set([...selections, ...result.matchedValues])];
            const existingLabels = currentOptionsRef.current
              .filter(opt => selections.includes(opt.value))
              .map(opt => opt.label);
            const allLabels = [...new Set([...existingLabels, ...result.matchedOptions.map(o => o.label)])];

            setMultiSelectState({
              isActive: false,
              selectedValues: allValues,
              selectedLabels: allLabels,
              awaitingConfirmation: false,
              awaitingMoreSelections: false,
            });

            if (onValidationComplete) {
              onValidationComplete(allValues, allLabels);
            }
          }
          return result;
        }

        if (result.suggestedAction === 'confirm' && result.needsConfirmation) {
          // Need to confirm selection
          if (multiSelect) {
            // Merge selections - use passed previousSelections (from VoiceLayout's pendingValidation)
            // NOT the hook's internal multiSelectState.selectedValues
            const allValues = [...new Set([...selections, ...result.matchedValues])];
            const existingLabels = currentOptionsRef.current
              .filter(opt => selections.includes(opt.value))
              .map(opt => opt.label);
            const allLabels = [...new Set([...existingLabels, ...result.matchedOptions.map(o => o.label)])];

            setMultiSelectState({
              isActive: true,
              selectedValues: allValues,
              selectedLabels: allLabels,
              awaitingConfirmation: true,
              awaitingMoreSelections: false,
            });
          } else {
            setMultiSelectState(prev => ({
              ...prev,
              awaitingConfirmation: true,
            }));
          }

          if (onConfirmationNeeded && result.confirmationMessage) {
            onConfirmationNeeded(result.confirmationMessage);
          }
          return result;
        }

        if (result.suggestedAction === 'add_more') {
          // User wants to add more selections
          setMultiSelectState((prev) => ({
            ...prev,
            isActive: true,
            awaitingConfirmation: false,
            awaitingMoreSelections: true,
          }));

          if (onConfirmationNeeded && result.confirmationMessage) {
            onConfirmationNeeded(result.confirmationMessage);
          }
          return result;
        }

        if (result.suggestedAction === 'reask' || !result.isValid) {
          // Invalid answer, need to reask
          if (onReaskNeeded && result.invalidReason) {
            onReaskNeeded(result.invalidReason);
          }
          return result;
        }

        return result;
      } catch (error) {
        console.error('Voice validation error:', error);
        return {
          success: false,
          isValid: false,
          matchedOptions: [],
          matchedValues: [],
          confidence: 'low',
          needsConfirmation: false,
          invalidReason: 'Failed to validate your answer. Please try again.',
          suggestedAction: 'reask',
        };
      } finally {
        setIsValidating(false);
      }
    },
    [apiEndpoint, multiSelectState, onConfirmationNeeded, onValidationComplete, onReaskNeeded]
  );

  return {
    validateAnswer,
    multiSelectState,
    resetMultiSelectState,
    addToSelection,
    removeFromSelection,
    confirmSelection,
    isValidating,
  };
}
