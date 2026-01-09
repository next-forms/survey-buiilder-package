import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { BlockData, ThemeDefinition, OutputSchema, OutputSchemaScalar, OutputSchemaArray, OutputSchemaObject, OutputSchemaUnion } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';

interface SchemaBasedInputProps {
  block: BlockData;
  schema: OutputSchema | undefined;
  value?: any;
  onChange: (value: any) => void;
  onSubmit: (value: any) => void;
  theme?: ThemeDefinition;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

// Type guards for different schema types
function isScalarSchema(schema: OutputSchema): schema is OutputSchemaScalar {
  return 'type' in schema && ['string', 'number', 'boolean', 'date'].includes(schema.type);
}

function isObjectSchema(schema: OutputSchema): schema is OutputSchemaObject {
  return 'type' in schema && schema.type === 'object' && 'properties' in schema;
}

function isArraySchema(schema: OutputSchema): schema is OutputSchemaArray {
  return 'type' in schema && schema.type === 'array';
}

function isUnionSchema(schema: OutputSchema): schema is OutputSchemaUnion {
  return 'oneOf' in schema;
}

// Helper to get the effective schema from a union (use first option as default)
function getEffectiveSchema(schema: OutputSchema): OutputSchemaScalar | OutputSchemaArray | OutputSchemaObject | null {
  if (isUnionSchema(schema)) {
    // For union schemas, use the first option as default
    return schema.oneOf[0] || null;
  }
  if (isScalarSchema(schema) || isObjectSchema(schema) || isArraySchema(schema)) {
    return schema;
  }
  return null;
}

/**
 * Renders input fields based on inputSchema or outputSchema
 * Used as a fallback for unknown block types that have schema definitions
 */
export const SchemaBasedInput: React.FC<SchemaBasedInputProps> = ({
  block,
  schema,
  value,
  onChange,
  onSubmit,
  theme,
  disabled = false,
  error,
  placeholder,
}) => {
  const [localValue, setLocalValue] = useState<Record<string, any>>(
    typeof value === 'object' && value !== null ? value : {}
  );

  // Sync with external value
  useEffect(() => {
    if (typeof value === 'object' && value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    const newValue = { ...localValue, [fieldName]: fieldValue };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleSubmitClick = () => {
    onSubmit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitClick();
    }
  };

  // If no schema, show fallback
  if (!schema) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          No schema defined for this block.
        </p>
      </div>
    );
  }

  // Get effective schema (handles union types by using first option)
  const effectiveSchema = getEffectiveSchema(schema);

  if (!effectiveSchema) {
    return (
      <div className="p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Unable to determine schema type.
        </p>
      </div>
    );
  }

  // Handle scalar schemas (string, number, boolean, date)
  if (isScalarSchema(effectiveSchema)) {
    const scalarValue = typeof value !== 'object' ? value : '';
    const schemaType = effectiveSchema.type;

    return (
      <div className="flex gap-2 w-full">
        <Input
          type={schemaType === 'number' ? 'number' : schemaType === 'date' ? 'date' : 'text'}
          value={scalarValue ?? ''}
          onChange={(e) => {
            const newVal = schemaType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
            onChange(newVal);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `Enter ${schemaType}...`}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-full px-4 py-2 h-12',
            theme?.field?.input,
            error && 'border-red-500'
          )}
        />
        <Button
          type="button"
          onClick={() => onSubmit(scalarValue)}
          disabled={disabled || !scalarValue}
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
        {error && (
          <p className="absolute -bottom-6 left-0 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // Handle object schemas with properties
  if (isObjectSchema(effectiveSchema)) {
    const properties = effectiveSchema.properties;
    const propertyNames = Object.keys(properties);

    // Check if all required fields have values
    const hasAllValues = propertyNames.every((name) => {
      const prop = properties[name];
      if (prop.optional) return true;
      const val = localValue[name];
      return val !== undefined && val !== null && val !== '';
    });

    return (
      <div className="flex flex-col gap-4 w-full">
        {propertyNames.map((fieldName) => {
          const fieldDef = properties[fieldName];
          const fieldValue = localValue[fieldName] ?? '';
          const isRequired = !fieldDef.optional;

          return (
            <div key={fieldName} className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {fieldDef.description || fieldName}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {fieldDef.type === 'boolean' ? (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!fieldValue}
                    onCheckedChange={(checked) => handleFieldChange(fieldName, !!checked)}
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {fieldDef.description || fieldName}
                  </span>
                </div>
              ) : (
                <Input
                  type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
                  value={fieldValue}
                  onChange={(e) => {
                    const newVal = fieldDef.type === 'number'
                      ? parseFloat(e.target.value) || 0
                      : e.target.value;
                    handleFieldChange(fieldName, newVal);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={fieldDef.description || `Enter ${fieldName}...`}
                  disabled={disabled}
                  className={cn(
                    'w-full rounded-lg px-4 py-2',
                    theme?.field?.input
                  )}
                />
              )}
            </div>
          );
        })}

        <div className="flex justify-end mt-2">
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={disabled || !hasAllValues}
            className="rounded-full px-6"
            style={
              theme?.colors?.primary
                ? { backgroundColor: theme.colors.primary }
                : undefined
            }
          >
            <Send className="w-4 h-4 mr-2" />
            Submit
          </Button>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // Handle array schemas
  if (isArraySchema(effectiveSchema)) {
    // For arrays, we'll just use a text input and parse as JSON or comma-separated
    const arrayValue = Array.isArray(value) ? value.join(', ') : '';

    return (
      <div className="flex gap-2 w-full">
        <Input
          type="text"
          value={arrayValue}
          onChange={(e) => {
            const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange(items);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Enter values separated by commas...'}
          disabled={disabled}
          className={cn(
            'flex-1 rounded-full px-4 py-2 h-12',
            theme?.field?.input,
            error && 'border-red-500'
          )}
        />
        <Button
          type="button"
          onClick={() => {
            const items = arrayValue.split(',').map((s) => s.trim()).filter(Boolean);
            onSubmit(items);
          }}
          disabled={disabled || !arrayValue}
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
        {error && (
          <p className="absolute -bottom-6 left-0 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  // Fallback - no valid schema structure
  return (
    <div className="p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
      <p className="text-sm text-yellow-600 dark:text-yellow-400">
        Unable to render input for this schema type.
      </p>
    </div>
  );
};
