import React, { useState, useEffect, useId } from 'react';
import { BlockData } from '../../types';
import { ThemeDefinition, themes } from '../../themes';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Card } from '../../components/ui/card';
import { CheckSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BoxOption {
  id: string;
  label: string;
  value: string;
}

interface SelectableBoxRendererProps {
  block: BlockData;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const SelectableBoxRenderer: React.FC<SelectableBoxRendererProps> = ({
  block,
  value = '',
  onChange,
  onBlur,
  error,
  disabled,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;
  const idPrefix = useId();
  
  // Parse options from block
  const options: BoxOption[] = block.options || [];
  const boxSpacing = block.boxSpacing || "4";
  const showSelectionIndicator = block.showSelectionIndicator !== false;
  
  // Track selected value
  const [selectedValue, setSelectedValue] = useState<string>(value || '');
  
  // Update local state when props change
  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);
  
  // Handle option selection
  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    
    if (onChange) {
      onChange(optionValue);
    }
    
    if (onBlur) {
      onBlur();
    }
  };
  
  return (
    <div className="survey-box-question space-y-4 w-full min-w-0">
      {/* Label */}
      {block.label && (
        <Label
          className={cn("text-lg font-bold block", themeConfig.field.label)}
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
      
      {/* Selectable Boxes */}
      <RadioGroup 
        value={selectedValue} 
        onValueChange={handleSelect}
        disabled={disabled}
        className={`space-y-${boxSpacing} my-8`}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const id = `${idPrefix}-${block.fieldName}-${option.id}`;
          
          return (
            <div key={option.id} className="relative">
              <RadioGroupItem 
                value={option.value} 
                id={id}
                className="sr-only"
                aria-invalid={!!error}
              />
              <Label 
                htmlFor={id} 
                className={cn(
                  "block w-full cursor-pointer",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Card 
                  className={cn(
                    // Base box styling from theme
                    themeConfig.field.selectableBox || "p-4 transition-colors hover:bg-accent dark:hover:bg-accent/50",
                    // Selected state styling
                    isSelected 
                      ? themeConfig.field.selectableBoxSelected || themeConfig.field.boxBorder || "border-primary" 
                      : themeConfig.field.selectableBoxDefault || "border-[#ccc]",
                    // Hover state styling
                    !disabled && (themeConfig.field.selectableBoxHover || "hover:border-gray-400"),
                    // Focus state styling
                    themeConfig.field.selectableBoxFocus || "focus-within:ring-2 focus-within:ring-offset-2",
                    // Disabled state styling
                    disabled && (themeConfig.field.selectableBoxDisabled || "opacity-50 cursor-not-allowed")
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-between",
                    themeConfig.field.selectableBoxContainer || ""
                  )}>
                    <span className={cn(
                      "text-foreground", 
                      themeConfig.field.selectableBoxText || themeConfig.field.text,
                      isSelected && (themeConfig.field.selectableBoxTextSelected || themeConfig.field.activeText)
                    )}>
                      {option.label}
                    </span>
                    {isSelected && showSelectionIndicator && (
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        themeConfig.field.selectableBoxIndicator || "bg-primary text-primary-foreground"
                      )}>
                        <CheckSquare className={cn(
                          "h-3 w-3",
                          themeConfig.field.selectableBoxIndicatorIcon || ""
                        )} />
                      </div>
                    )}
                  </div>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      
      {/* Error message */}
      {error && (
        <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>
          {error}
        </div>
      )}
    </div>
  );
};