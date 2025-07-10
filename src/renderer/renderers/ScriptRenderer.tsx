import React, { useEffect, useContext } from 'react';
import { BlockData } from '../../types';
import { SurveyFormContext } from '../../context/SurveyFormContext';
import { evaluateLogic } from '../../utils/surveyUtils';
import { ThemeDefinition, themes } from '../../themes';

interface ScriptRendererProps {
  block: BlockData;
  theme?: ThemeDefinition;
}

/**
 * The ScriptRenderer evaluates JavaScript code in a controlled environment.
 * It doesn't render anything visible but can modify form state, show/hide questions,
 * validate fields, etc. based on the script's logic.
 */
export const ScriptRenderer: React.FC<ScriptRendererProps> = ({ block }) => {
  const { values, setValue, currentPage, setError, enableDebug } = useContext(SurveyFormContext);

  // Run the script when values change, the page changes, or on initial render
  useEffect(() => {
    if (typeof block.script !== 'string' || !block.script.trim()) return;

    try {
      // Create a context object with the current form values and helper functions
      const context = {
        fieldValues: values,
        setValue,
        setError,
        currentPage,

        // Additional safe helper functions could be provided here
        // For example:
        getFieldValue: (fieldName: string) => values[fieldName],
        showAlert: (message: string) => enableDebug ? console.log('Script alert:', message) : undefined, // Safe console log
      };

      // Evaluate the script safely
      evaluateLogic(block.script, context);
    } catch (error) {
      if (enableDebug) {
        console.error('Error executing script block:', error);
      }

      // Optionally set an error on the block itself if needed
      if (block.fieldName) {
        setError(block.fieldName, `Script error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [values, currentPage, block.script, block.fieldName, setValue, setError, enableDebug]);

  // This component doesn't render anything visible
  return null;
};
