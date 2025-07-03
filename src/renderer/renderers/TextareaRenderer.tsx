import React, { forwardRef } from 'react';
import { themes } from '../themes';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';
import { BlockData } from '../../types';
import { ThemeDefinition } from '../themes';

interface TextareaRendererProps {
  block: BlockData;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string | null; // Allow null values to match validation function return type
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const TextareaRenderer = forwardRef<HTMLTextAreaElement, TextareaRendererProps>(
  ({ block, value, onChange, onBlur, error, disabled, theme = null }, ref) => {
    const themeConfig = theme ?? themes.default;

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="survey-textarea space-y-2 w-full min-w-0">
        {/* Label */}
        {block.label && (
          <Label
            htmlFor={block.fieldName}
            className={cn("text-base", themeConfig.field.label)}
          >
            {block.label}
          </Label>
        )}

        {/* Description */}
        {block.description && (
          <div className={cn("text-sm text-muted-foreground", themeConfig.field.description)}>
            {block.description}
          </div>
        )}

        {/* Textarea field */}
        <Textarea
          id={block.fieldName}
          name={block.fieldName}
          value={value || ''}
          placeholder={block.placeholder}
          disabled={disabled}
          onChange={handleChange}
          onBlur={onBlur}
          ref={ref}
          className={cn(error && "border-destructive", themeConfig.field.textarea)}
          aria-invalid={!!error}
          rows={block.rows || 4}
        />

        {/* Error message */}
        {error && (
          <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

TextareaRenderer.displayName = 'TextareaRenderer';