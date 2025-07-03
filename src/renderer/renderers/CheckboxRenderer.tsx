import React, { forwardRef } from 'react';
import { BlockData } from '../../types';
import { ThemeDefinition, themes } from '../themes';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

interface CheckboxRendererProps {
  block: BlockData;
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const CheckboxRenderer = forwardRef<HTMLButtonElement, CheckboxRendererProps>(
  ({ block, value = [], onChange, onBlur, error, disabled, theme = null }, ref) => {
    const themeConfig = theme ?? themes.default;

    // Get labels and values arrays from the block
    const labels = block.labels || [];
    const values = block.values || labels.map((_, i) => i);

    // Handle checkbox change
    const handleChange = (optionValue: string | number, checked: boolean) => {
      if (!onChange) return;

      const currentValues = [...(value || [])];

      if (checked) {
        // Add the value if not already present
        if (!currentValues.includes(optionValue)) {
          onChange([...currentValues, optionValue]);
        }
      } else {
        // Remove the value
        onChange(currentValues.filter(v => v !== optionValue));
      }

      if (onBlur) {
        onBlur();
      }
    };

    return (
      <div className="survey-checkbox space-y-3 w-full min-w-0">
        {/* Label */}
        {block.label && (
          <Label className={cn("text-base block", themeConfig.field.label)}>
            {block.label}
          </Label>
        )}

        {/* Description */}
        {block.description && (
          <div className={cn("text-sm text-muted-foreground", themeConfig.field.description)}>
            {block.description}
          </div>
        )}

        {/* Checkbox options */}
        <div className="space-y-2 mt-2">
          {labels.map((label, index) => {
            const optionValue = values[index];
            const id = `${block.fieldName}-${index}`;
            const isChecked = (typeof optionValue === 'string' || typeof optionValue === 'number') 
            ? value?.includes(optionValue) || false 
            : false;

            return (
              <div key={id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={id}
                  name={`${block.fieldName}[]`}
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={(checked: boolean) => handleChange(optionValue as string, checked as boolean)}
                  aria-invalid={!!error}
                  ref={index === 0 ? ref : undefined}
                />
                <Label
                  htmlFor={id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {label}
                </Label>
              </div>
            );
          })}
        </div>

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

CheckboxRenderer.displayName = 'CheckboxRenderer';
