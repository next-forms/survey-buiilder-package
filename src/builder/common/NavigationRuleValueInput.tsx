import React from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { X, Plus, Variable } from "lucide-react";
import type { OperatorDefinition } from "./navigation-rules-types";

interface FieldOption {
  label: string;
  value: string;
}

interface Props {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  operator: OperatorDefinition;
  availableVariables: string[];
  fieldType?: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  /** Options from the selected field (e.g., radio, select, checkbox options) */
  fieldOptions?: FieldOption[];
}

export const NavigationRuleValueInput: React.FC<Props> = ({
  value,
  onChange,
  operator,
  availableVariables,
  fieldType = 'text',
  fieldOptions = []
}) => {
  // Check for logical operators first, before any hooks
  const isLogicalOperator = operator.value === 'isEmpty' || operator.value === 'isNotEmpty' ||
                           ['isToday', 'isPastDate', 'isFutureDate', 'isWeekday', 'isWeekend'].includes(operator.value);

  // Don't show input for logical operators that don't need values
  if (isLogicalOperator) {
    return null;
  }

  const [inputMode, setInputMode] = React.useState<'literal' | 'variable'>('literal');
  const [valueMode, setValueMode] = React.useState<'options' | 'custom'>('options');

  const hasFieldOptions = fieldOptions.length > 0;

  // Handle array values for operators that support them
  const isArrayOperator = operator.valueType === 'array' || operator.value === 'between' || operator.value === 'notBetween';
  const isBetweenOperator = operator.value === 'between' || operator.value === 'notBetween' ||
                           operator.value === 'dateBetween' || operator.value === 'dateNotBetween' ||
                           operator.value === 'ageBetween';
  
  // Convert value to array format if needed
  const arrayValue = React.useMemo(() => {
    if (isArrayOperator) {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string' && value) return [value];
      return isBetweenOperator ? ['', ''] : [''];
    }
    return [];
  }, [value, isArrayOperator, isBetweenOperator]);
  
  // Convert value to string if needed
  const stringValue = React.useMemo(() => {
    if (!isArrayOperator) {
      if (Array.isArray(value)) return value[0] || '';
      return value || '';
    }
    return '';
  }, [value, isArrayOperator]);
  
  const handleArrayItemChange = (index: number, newValue: string) => {
    const newArray = [...arrayValue];
    newArray[index] = newValue;
    onChange(newArray);
  };
  
  const addArrayItem = () => {
    onChange([...arrayValue, '']);
  };
  
  const removeArrayItem = (index: number) => {
    const newArray = arrayValue.filter((_, i) => i !== index);
    onChange(newArray.length > 0 ? newArray : ['']);
  };
  
  const getInputType = () => {
    if (fieldType === 'number') return 'number';
    
    // Handle date operators
    if (operator.category === 'date') {
      // For numeric date operations (day/month/year/age), use number input
      if (['dayOfWeekEquals', 'monthEquals', 'yearEquals', 'ageGreaterThan', 'ageLessThan', 'ageBetween'].includes(operator.value)) {
        return 'number';
      }
      // For regular date operations, use date input
      if (['dateEquals', 'dateNotEquals', 'dateGreaterThan', 'dateGreaterThanOrEqual', 
           'dateLessThan', 'dateLessThanOrEqual', 'dateBetween', 'dateNotBetween'].includes(operator.value)) {
        return 'date';
      }
    }
    
    return 'text';
  };
  
  // Render for between operators (need exactly 2 values)
  if (isBetweenOperator) {
    const isDateBetween = operator.value === 'dateBetween' || operator.value === 'dateNotBetween';
    const isAgeBetween = operator.value === 'ageBetween';
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs">
              {isDateBetween ? 'From Date' : isAgeBetween ? 'Min Age' : 'Min'}
            </Label>
            <Input
              type={getInputType()}
              value={arrayValue[0] || ''}
              onChange={(e) => handleArrayItemChange(0, e.target.value)}
              placeholder={isDateBetween ? 'Start date' : isAgeBetween ? 'Minimum age' : 'Minimum value'}
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">
              {isDateBetween ? 'To Date' : isAgeBetween ? 'Max Age' : 'Max'}
            </Label>
            <Input
              type={getInputType()}
              value={arrayValue[1] || ''}
              onChange={(e) => handleArrayItemChange(1, e.target.value)}
              placeholder={isDateBetween ? 'End date' : isAgeBetween ? 'Maximum age' : 'Maximum value'}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Render for array operators
  if (isArrayOperator) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Values</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addArrayItem}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {arrayValue.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {hasFieldOptions ? (
              <Select
                value={item}
                onValueChange={(val) => handleArrayItemChange(index, val)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={`Select value ${index + 1}`} />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      {option.label !== option.value && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({option.value})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={getInputType()}
                value={item}
                onChange={(e) => handleArrayItemChange(index, e.target.value)}
                placeholder={`Value ${index + 1}`}
                className="flex-1"
              />
            )}
            {arrayValue.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Render for single value operators
  if (operator.supportsVariables && availableVariables.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {hasFieldOptions && (
            <Button
              type="button"
              variant={inputMode === 'literal' && valueMode === 'options' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setInputMode('literal'); setValueMode('options'); }}
              className="h-7 px-2 text-xs"
            >
              Options
            </Button>
          )}
          <Button
            type="button"
            variant={inputMode === 'literal' && (!hasFieldOptions || valueMode === 'custom') ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setInputMode('literal'); setValueMode('custom'); }}
            className="h-7 px-2 text-xs"
          >
            {hasFieldOptions ? 'Custom' : 'Value'}
          </Button>
          <Button
            type="button"
            variant={inputMode === 'variable' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setInputMode('variable')}
            className="h-7 px-2 text-xs"
          >
            <Variable className="h-3 w-3 mr-1" />
            Variable
          </Button>
        </div>

        {inputMode === 'literal' ? (
          hasFieldOptions && valueMode === 'options' ? (
            <Select value={stringValue} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select from options" />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.label !== option.value && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({option.value})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={getInputType()}
              value={stringValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={hasFieldOptions ? "Enter custom value" : "Enter value"}
            />
          )
        ) : (
          <Select value={stringValue} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select variable" />
            </SelectTrigger>
            <SelectContent>
              {availableVariables.map((varName) => (
                <SelectItem key={varName} value={varName}>
                  {varName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }
  
  // Default single value input - with field options support
  if (hasFieldOptions) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={valueMode === 'options' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValueMode('options')}
            className="h-7 px-2 text-xs"
          >
            Options
          </Button>
          <Button
            type="button"
            variant={valueMode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setValueMode('custom')}
            className="h-7 px-2 text-xs"
          >
            Custom
          </Button>
        </div>

        {valueMode === 'options' ? (
          <Select value={stringValue} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select from options" />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                  {option.label !== option.value && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({option.value})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={getInputType()}
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter custom value"
          />
        )}
      </div>
    );
  }

  // Default single value input (no field options)
  return (
    <Input
      type={getInputType()}
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
    />
  );
};