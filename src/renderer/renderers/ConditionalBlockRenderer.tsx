import React from 'react';
import { BlockRenderer } from './BlockRenderer';
import { useSurveyForm } from '../../context/SurveyFormContext';
import type { ConditionalBlockProps } from '../../types';

/**
 * A component that conditionally renders its children based on a condition
 */
export const ConditionalBlockRenderer: React.FC<ConditionalBlockProps> = ({
  block,
  condition,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  theme,
  contextData,
  customComponents,
}) => {
  const { evaluateCondition } = useSurveyForm();

  // Evaluate the condition
  const conditionMet = evaluateCondition(condition, contextData);

  // If condition is not met, don't render anything
  if (!conditionMet) {
    return null;
  }

  // If condition is met, render the block
  return (
    <BlockRenderer
      block={block}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      customComponents={customComponents}
      theme={theme}
    />
  );
};