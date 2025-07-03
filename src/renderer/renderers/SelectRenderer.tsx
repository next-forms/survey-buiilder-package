import React, { forwardRef } from 'react';
import { BlockData } from '../../types';
import { themes } from '../themes';
import { ThemeDefinition } from '../themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

interface SelectRendererProps {
  block: BlockData;
  value?: string | number;
  onChange?: (value: string | number | boolean) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const SelectRenderer = forwardRef<HTMLButtonElement, SelectRendererProps>(
  ({ block, value, onChange, onBlur, error, disabled, theme = null }, ref) => {
    const themeConfig = theme ?? themes.default;

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    // Get labels and values arrays from the block
    const labels = block.labels || [];
    const values = block.values || labels.map((_, i) => i);

    return (
      <div className="survey-select space-y-2 w-full min-w-0">
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

        {/* Select field */}
        <Select
          name={block.fieldName}
          value={(value !== undefined && value !== null) ? value.toString() : undefined}
          onValueChange={(selectedValue) => {
            // Find the original value type (string or number)
            const index = values.findIndex(v => v.toString() === selectedValue);
            if (index !== -1) {
              onChange?.(values[index]);
            } else {
              onChange?.(selectedValue);
            }
            if (onBlur) onBlur();
          }}
          disabled={disabled}
        >
          <SelectTrigger
            id={block.fieldName}
            className={cn(error && "border-destructive", themeConfig.field.select)}
            aria-invalid={!!error}
            ref={ref}
          >
            <SelectValue placeholder={block.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {labels.map((label, index) => {
              const optionValue = values[index];
              const stringValue = optionValue !== undefined ? optionValue.toString() : '';
              return (
                <SelectItem key={index} value={stringValue}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

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

SelectRenderer.displayName = 'SelectRenderer';
