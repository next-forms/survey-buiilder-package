import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ThemeDefinition } from '../../../types';
import type { SchemaProperty } from './types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface ChatMultiFieldInputProps {
  fieldName: string;
  fieldSchema?: SchemaProperty;
  onSubmit: (value: any) => void;
  theme?: ThemeDefinition;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatMultiFieldInput: React.FC<ChatMultiFieldInputProps> = ({
  fieldName,
  fieldSchema,
  onSubmit,
  theme,
  disabled = false,
  placeholder = 'Type your answer...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  // Auto-focus on mount or field change
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, [fieldName]);

  // Reset value when field changes
  useEffect(() => {
    setValue('');
  }, [fieldName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!value.trim()) return;

    // Convert value based on field type
    let finalValue: any = value.trim();

    if (fieldSchema?.type === 'number') {
      finalValue = parseFloat(value);
      if (isNaN(finalValue)) {
        // Invalid number, don't submit
        return;
      }
    } else if (fieldSchema?.type === 'boolean') {
      finalValue = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
    }

    onSubmit(finalValue);
    setValue('');
  };

  // Determine input type based on schema
  const getInputType = () => {
    if (fieldSchema?.type === 'number') return 'number';
    if (fieldSchema?.type === 'date') return 'date';
    return 'text';
  };

  // Generate placeholder based on field name and schema
  const getPlaceholder = () => {
    if (fieldSchema?.description) {
      return `Enter ${fieldSchema.description.toLowerCase()}...`;
    }
    // Humanize field name
    const humanized = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim()
      .toLowerCase();
    return `Enter your ${humanized}...`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 w-full"
    >
      <Input
        ref={inputRef}
        type={getInputType()}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        disabled={disabled}
        className={cn(
          'flex-1 rounded-full px-4 py-2 h-12',
          theme?.field?.input
        )}
        step={fieldSchema?.type === 'number' ? 'any' : undefined}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        size="icon"
        className="rounded-full h-12 w-12 shrink-0"
        style={
          theme?.colors?.primary
            ? { backgroundColor: theme.colors.primary }
            : undefined
        }
      >
        <Send className="w-5 h-5" />
      </Button>
    </motion.div>
  );
};
