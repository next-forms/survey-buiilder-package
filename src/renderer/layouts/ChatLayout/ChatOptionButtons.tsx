import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Check } from 'lucide-react';
import type { BlockData, ThemeDefinition } from '../../../types';
import { Button } from '../../../components/ui/button';

interface ChatOptionButtonsProps {
  block: BlockData;
  value?: any;
  onChange: (value: any) => void;
  onSubmit?: (value?: any) => void;
  theme?: ThemeDefinition;
  disabled?: boolean;
}

interface OptionItem {
  label: string;
  value: any;
}

function getOptionsFromBlock(block: BlockData): OptionItem[] {
  // Handle options array structure (preferred format)
  if (block.options && Array.isArray(block.options)) {
    return block.options.map((option: any) => ({
      label: option.label || option.name || String(option.value),
      value: option.value !== undefined ? option.value : option.label,
    }));
  }

  // Handle items array structure
  if (block.items && Array.isArray(block.items)) {
    return block.items.map((item: any) => ({
      label: item.label || item.name || String(item.value),
      value: item.value !== undefined ? item.value : item.label,
    }));
  }

  // Handle labels/values array structure (legacy format)
  if (block.labels && Array.isArray(block.labels)) {
    const values = block.values || block.labels;
    return block.labels.map((label: string, index: number) => ({
      label,
      value: values[index] !== undefined ? values[index] : label,
    }));
  }

  return [];
}

export const ChatOptionButtons: React.FC<ChatOptionButtonsProps> = ({
  block,
  value,
  onChange,
  onSubmit,
  theme,
  disabled = false,
}) => {
  const options = getOptionsFromBlock(block);
  const isMultiSelect = block.type === 'checkbox';
  const [selectedValues, setSelectedValues] = useState<any[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );

  const handleOptionClick = (optionValue: any) => {
    if (disabled) return;

    if (isMultiSelect) {
      // For checkbox/multi-select, toggle the value
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      setSelectedValues(newValues);
      onChange(newValues);
    } else {
      // For radio/single-select, set the value and auto-submit
      console.log("Here1")
      onChange(optionValue);
      if (onSubmit) {
      console.log("Here2")
        // Small delay to show selection, then submit with the value
        setTimeout(() => onSubmit(optionValue), 150);
      console.log("Here3")
      }
    }
  };

  const handleConfirm = () => {
    if (selectedValues.length > 0 && onSubmit) {
      onSubmit(selectedValues);
    }
  };

  const isSelected = (optionValue: any) => {
    if (isMultiSelect) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex flex-col gap-2 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => {
          const selected = isSelected(option.value);
          return (
            <motion.button
              key={`${option.value}-${index}`}
              type="button"
              variants={itemVariants}
              onClick={() => handleOptionClick(option.value)}
              disabled={disabled}
              className={cn(
                'px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200',
                'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
                selected
                  ? 'border-transparent text-white shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={
                selected && theme?.colors?.primary
                  ? { backgroundColor: theme.colors.primary }
                  : selected
                  ? { backgroundColor: '#2563eb' }
                  : undefined
              }
            >
              <span className="flex items-center gap-2">
                {selected && isMultiSelect && <Check className="w-4 h-4" />}
                {option.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button for multi-select */}
      {isMultiSelect && selectedValues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={disabled}
            className={cn(
              'px-6 py-2 rounded-full font-medium',
              theme?.button?.primary
            )}
            style={
              theme?.colors?.primary
                ? { backgroundColor: theme.colors.primary }
                : undefined
            }
          >
            Confirm Selection ({selectedValues.length})
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
