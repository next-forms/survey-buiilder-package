import React from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { X, Plus } from "lucide-react";
import type { ValidationRuleInput } from "./validation-rules-types";

interface Props {
  input: ValidationRuleInput;
  onChange: (input: ValidationRuleInput) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ValidationRuleValueInput({ input, onChange, placeholder, disabled }: Props) {
  const handleSingleValueChange = (value: string) => {
    onChange({
      ...input,
      value: input.type === 'number' ? (value === '' ? '' : Number(value)) : value
    });
  };

  const handleArrayValueChange = (index: number, value: string) => {
    const newArray = [...(input.value || [])];
    newArray[index] = input.type === 'number' ? (value === '' ? '' : Number(value)) : value;
    onChange({
      ...input,
      value: newArray
    });
  };

  const addArrayItem = () => {
    const newArray = [...(input.value || []), ''];
    onChange({
      ...input,
      value: newArray
    });
  };

  const removeArrayItem = (index: number) => {
    const newArray = [...(input.value || [])];
    newArray.splice(index, 1);
    onChange({
      ...input,
      value: newArray
    });
  };

  const handleMixedValueChange = (index: number, newItem: { type: 'variable' | 'literal'; value: string }) => {
    const newArray = [...(input.value || [])];
    newArray[index] = newItem;
    onChange({
      ...input,
      value: newArray
    });
  };

  const addMixedItem = (type: 'variable' | 'literal') => {
    const newArray = [...(input.value || []), { type, value: '' }];
    onChange({
      ...input,
      value: newArray
    });
  };

  const removeMixedItem = (index: number) => {
    const newArray = [...(input.value || [])];
    newArray.splice(index, 1);
    onChange({
      ...input,
      value: newArray
    });
  };

  if (input.type === 'array') {
    const arrayValue = Array.isArray(input.value) ? input.value : [];
    
    return (
      <div className="space-y-2">
        {arrayValue.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item || ''}
              onChange={(e) => handleArrayValueChange(index, e.target.value)}
              placeholder={`Value ${index + 1}`}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeArrayItem(index)}
              disabled={disabled}
              className="px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addArrayItem}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Value
        </Button>
      </div>
    );
  }

  if (input.type === 'mixed' && input.availableVariables) {
    const mixedValue = Array.isArray(input.value) ? input.value : [];
    
    return (
      <div className="space-y-2">
        {mixedValue.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Badge 
              variant={item.type === 'variable' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {item.type === 'variable' ? 'Var' : 'Val'}
            </Badge>
            {item.type === 'variable' ? (
              <select
                value={item.value}
                onChange={(e) => handleMixedValueChange(index, { ...item, value: e.target.value })}
                disabled={disabled}
                className="flex-1 px-3 py-1 border border-input bg-background text-sm rounded-md"
              >
                <option value="">Select field...</option>
                {input.availableVariables?.map(variable => (
                  <option key={variable} value={variable}>{variable}</option>
                ))}
              </select>
            ) : (
              <Input
                value={item.value}
                onChange={(e) => handleMixedValueChange(index, { ...item, value: e.target.value })}
                placeholder="Enter value"
                disabled={disabled}
                className="flex-1"
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeMixedItem(index)}
              disabled={disabled}
              className="px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMixedItem('literal')}
            disabled={disabled}
            className="flex-1"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Value
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMixedItem('variable')}
            disabled={disabled}
            className="flex-1"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Variable
          </Button>
        </div>
      </div>
    );
  }

  // Single value input (text, number, variable)
  if (input.type === 'variable' && input.availableVariables) {
    return (
      <select
        value={input.value || ''}
        onChange={(e) => onChange({ ...input, value: e.target.value })}
        disabled={disabled}
        className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
      >
        <option value="">Select field...</option>
        {input.availableVariables.map(variable => (
          <option key={variable} value={variable}>{variable}</option>
        ))}
      </select>
    );
  }

  return (
    <Input
      type={input.type === 'number' ? 'number' : 'text'}
      value={input.value || ''}
      onChange={(e) => handleSingleValueChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}