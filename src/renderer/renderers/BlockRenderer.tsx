import React, { forwardRef } from 'react';
import type { BlockRendererProps } from '../../types';
import { getBlockDefinition } from '../../blocks';
// Legacy renderers for blocks not yet migrated
import { blockTypeMap, validateBlock } from '../../utils/blockAdapter';
import { useSurveyForm } from '../../context/SurveyFormContext';

/**
 * A component that renders different types of blocks based on their type
 */
export const BlockRenderer = forwardRef<HTMLElement, BlockRendererProps>((props, ref) => {
  const { block, value, onChange, onBlur, error, disabled, customComponents, theme = null, isVisible } = props;
  const { getVisibleBlocks } = useSurveyForm();

  // If the block has a visibility condition and is explicitly not visible, don't render it
  if (isVisible === false) {
    return null;
  }

  // Common props for all renderers (excluding ref since different components need different ref types)
  const validationError = validateBlock(block);
  const commonProps = {
    value,
    onChange,
    onBlur,
    error: error ?? (validationError === null ? undefined : validationError),
    disabled,
    theme
  };

  // If there's a custom component for this block type, use it
  if (customComponents && customComponents[block.type]) {
    const CustomComponent = customComponents[block.type] as React.FC<BlockRendererProps>;
    return <CustomComponent {...props} />;
  }

  // Check if we have a unified block definition with renderBlock method
  const blockDefinition = getBlockDefinition(block.type);
  if (blockDefinition?.renderBlock) {
    return blockDefinition.renderBlock(props);
  }

});

BlockRenderer.displayName = 'BlockRenderer';