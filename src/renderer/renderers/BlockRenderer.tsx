import React, { forwardRef } from 'react';
import type { BlockRendererProps } from '../../types';
import { TextInputRenderer } from './TextInputRenderer';
import { TextareaRenderer } from './TextareaRenderer';
import { RadioRenderer } from './RadioRenderer';
import { CheckboxRenderer } from './CheckboxRenderer';
import { SelectRenderer } from './SelectRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HtmlRenderer } from './HtmlRenderer';
import { RangeRenderer } from './RangeRenderer';
import { DatePickerRenderer } from './DatePickerRenderer';
import { FileUploadRenderer } from './FileUploadRenderer';
import { MatrixRenderer } from './MatrixRenderer';
import { SelectableBoxRenderer } from './SelectableBoxRenderer'
import { ScriptRenderer } from './ScriptRenderer';
import { SetRenderer } from './SetRenderer';
import { ConditionalBlockRenderer } from './ConditionalBlockRenderer';
import { CalculatedFieldRenderer } from './CalculatedFieldRenderer';
import { BMICalculatorRenderer } from './BMICalculatorRenderer';
import { CheckoutRenderer } from './CheckoutRenderer';
import { AuthRenderer } from './AuthRenderer';
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

  // Check if we have a built-in renderer for this block type or special types
  if (
    !blockTypeMap[block.type] &&
    !['conditional', 'calculated', 'bmiCalculator', 'checkout'].includes(block.type)
  ) {
    // For any unhandled types, render a placeholder
    return (
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-sm text-gray-500">
          Unknown block type: {block.type}
        </p>
      </div>
    );
  }

  // Special handling for conditional blocks
  if (block.type === 'conditional' && block.condition) {
    return (
      <ConditionalBlockRenderer
        {...props}
        condition={block.condition}
        block={block.childBlock || { type: 'html', html: 'No child block specified' }}
      />
    );
  }

  // Special handling for calculated fields
  if (block.type === 'calculated' && block.formula) {
    return (
      <CalculatedFieldRenderer
        {...props}
        formula={block.formula}
        dependencies={block.dependencies || []}
        format={block.format}
      />
    );
  }

  // Special handling for BMI calculator
  if (block.type === 'bmiCalculator') {
    return <BMICalculatorRenderer {...props} />;
  }

  // Special handling for Checkout form
  if (block.type === 'checkout') {
    return <CheckoutRenderer {...props} />;
  }

  // Render the appropriate component based on block type
  switch (block.type) {
    case 'textfield':
      return <TextInputRenderer block={block} {...commonProps} ref={ref as React.ForwardedRef<HTMLInputElement>} />;
    case 'textarea':
      return <TextareaRenderer block={block} {...commonProps} ref={ref as React.ForwardedRef<HTMLTextAreaElement>} />;
    case 'radio':
      return <RadioRenderer block={block} {...commonProps} />;
    case 'checkbox':
      return <CheckboxRenderer block={block} {...commonProps} />;
    case 'select':
      return <SelectRenderer block={block} {...commonProps} ref={ref as React.ForwardedRef<HTMLButtonElement>} />;
    case 'range':
      return <RangeRenderer block={block} {...commonProps}/>;
    case 'datepicker':
      return <DatePickerRenderer block={block} {...commonProps}/>;
    case 'fileupload':
      return <FileUploadRenderer block={block} {...commonProps}/>;
    case 'matrix':
      return <MatrixRenderer block={block} {...commonProps} />;
    case 'selectablebox':
      return <SelectableBoxRenderer block={block} {...commonProps} />;      
    case 'markdown':
      return <MarkdownRenderer block={block} {...commonProps} />;
    case 'html':
      return <HtmlRenderer block={block} {...commonProps} />;
    case 'auth':
      return <AuthRenderer block={block} {...commonProps} />;
    case 'script':
      return <ScriptRenderer block={block} theme={theme} />;
    case 'set':
      // For set blocks, we need to filter child items based on visibility conditions
      if (block.items) {
        const visibleItems = getVisibleBlocks(block.items);
        const blockWithVisibleItems = { ...block, items: visibleItems };
        return <SetRenderer block={blockWithVisibleItems} {...commonProps} />;
      }
      return <SetRenderer block={block} {...commonProps} />;
    default:
      // For any unhandled types with a definition, render a generic component
      return (
        <div className="p-4 border border-gray-300 rounded">
          <p className="font-medium mb-1">{block.label || block.name || block.type}</p>
          {block.description && <p className="text-sm text-gray-500 mb-2">{block.description}</p>}
          <p className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200">
            Renderer not implemented for block type: {block.type}
          </p>
        </div>
      );
  }
});

BlockRenderer.displayName = 'BlockRenderer';