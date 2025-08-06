import React, { useState, useCallback } from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import type { BlockData } from "../../types";
import { ValidationRuleValueInput } from "./ValidationRuleValueInput";
import { 
  VALIDATION_OPERATORS, 
  type ValidationRule,
  type ValidationRuleInput
} from "./validation-rules-types";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";

interface Props {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

interface RuleState extends ValidationRule {
  id: string;
}

function createEmptyRule(): RuleState {
  return {
    id: Math.random().toString(36).substring(2, 11),
    operator: 'isNotEmpty',
    message: 'This field is required',
    severity: 'error'
  };
}

function parseRules(data: BlockData): RuleState[] {
  if (!data.validationRules || !Array.isArray(data.validationRules)) {
    return [];
  }
  
  return data.validationRules.map((rule, index) => ({
    ...rule,
    id: rule.id || index.toString()
  }));
}

function buildRules(rules: RuleState[]): ValidationRule[] {
  return rules.map(({ id, ...rule }) => rule);
}

export function ValidationRulesEditor({ data, onUpdate }: Props) {
  const { state } = useSurveyBuilder();
  const [rules, setRules] = useState<RuleState[]>(() => parseRules(data));

  // Get all available fields for reference in validation rules
  const availableFields = React.useMemo(() => {
    const fields: string[] = [];
    const traverse = (node: any) => {
      if (node.items) {
        node.items.forEach((item: any) => {
          if (item.type === 'set') {
            traverse(item);
          } else if (item.fieldName) {
            fields.push(item.fieldName);
          }
        });
      }
    };
    
    if (state?.rootNode) {
      traverse(state.rootNode);
    }
    
    return fields.filter((field, index, self) => self.indexOf(field) === index);
  }, [state]);

  const updateRules = useCallback((newRules: RuleState[]) => {
    setRules(newRules);
    if (onUpdate) {
      const updatedData = {
        ...data,
        validationRules: buildRules(newRules)
      };
      onUpdate(updatedData);
    }
  }, [data, onUpdate]);

  const addRule = () => {
    const newRule = createEmptyRule();
    updateRules([...rules, newRule]);
  };

  const updateRule = (index: number, updates: Partial<RuleState>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    updateRules(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    updateRules(newRules);
  };

  const getOperatorDefinition = (operator: string) => {
    return VALIDATION_OPERATORS.find(op => op.value === operator);
  };

  const getValueInputType = (operator: string): ValidationRuleInput => {
    const operatorDef = getOperatorDefinition(operator);
    if (!operatorDef) return { type: 'text', value: '' };

    // Handle date operators specifically
    if (operatorDef.category === 'date') {
      switch (operatorDef.valueType) {
        case 'array':
          return { type: 'array', value: [], isDateArray: true };
        case 'single':
          // For numeric date operations (day/month/year/age), use number input
          if (['dayOfWeekEquals', 'monthEquals', 'yearEquals', 'ageGreaterThan', 'ageLessThan'].includes(operator)) {
            return { type: 'number', value: '' };
          }
          // For age between, use number array
          if (operator === 'ageBetween') {
            return { type: 'array', value: [] };
          }
          // For regular date operations, use date input
          return { type: 'date', value: '' };
        case 'none':
          return { type: 'text', value: '' };
        default:
          return { type: 'date', value: '' };
      }
    }

    switch (operatorDef.valueType) {
      case 'array':
        return { type: 'array', value: [] };
      case 'variable':
        return { type: 'variable', value: '', availableVariables: availableFields };
      case 'mixed':
        return { type: 'mixed', value: [], availableVariables: availableFields };
      case 'none':
        return { type: 'text', value: '' };
      default:
        return { type: 'text', value: '' };
    }
  };

  const renderRuleEditor = (rule: RuleState, index: number) => {
    const operatorDef = getOperatorDefinition(rule.operator);
    const needsValue = operatorDef?.valueType !== 'none';
    
    return (
      <div key={rule.id} className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={rule.severity === 'error' ? 'destructive' : 'secondary'}>
              {rule.severity === 'error' ? (
                <AlertTriangle className="h-3 w-3 mr-1" />
              ) : (
                <Info className="h-3 w-3 mr-1" />
              )}
              {rule.severity || 'error'}
            </Badge>
            <span className="text-sm text-muted-foreground">Rule {index + 1}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => removeRule(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field Reference (optional) */}
          <div className="space-y-2">
            <Label className="text-xs">Field Reference (optional)</Label>
            <Select
              value={rule.field || '__current__'}
              onValueChange={(value) => updateRule(index, { field: value === '__current__' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Current field" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
                <SelectItem value="__current__" className="pl-2 font-medium">
                  <span className="text-sm">Current field</span>
                </SelectItem>
                {availableFields.length > 0 && (
                  <div className="border-t border-muted my-1" />
                )}
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field} className="pl-2">
                    <span className="text-sm">{field}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator */}
          <div className="space-y-2">
            <Label className="text-xs">Validation Type</Label>
            <Select
              value={rule.operator}
              onValueChange={(value) => updateRule(index, { operator: value, value: undefined })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
                {Object.entries(VALIDATION_OPERATORS.reduce((acc, op) => {
                  if (!acc[op.category]) acc[op.category] = [];
                  acc[op.category].push(op);
                  return acc;
                }, {} as Record<string, typeof VALIDATION_OPERATORS>)).map(([category, ops]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="capitalize text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      {category}
                    </SelectLabel>
                    {ops.map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{op.label}</span>
                          {op.description && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Value Input */}
        {needsValue && (
          <div className="space-y-2">
            <Label className="text-xs">Value</Label>
            <ValidationRuleValueInput
              input={{
                ...getValueInputType(rule.operator),
                value: rule.value
              }}
              onChange={(input) => updateRule(index, { value: input.value })}
              placeholder="Enter validation value"
            />
          </div>
        )}

        {/* Error Message */}
        <div className="space-y-2">
          <Label className="text-xs">Error Message</Label>
          <Textarea
            value={rule.message}
            onChange={(e) => updateRule(index, { message: e.target.value })}
            placeholder="Enter error message to display"
            rows={2}
          />
        </div>

        {/* Severity */}
        <div className="space-y-2">
          <Label className="text-xs">Severity</Label>
          <Select
            value={rule.severity || 'error'}
            onValueChange={(value: 'error' | 'warning') => updateRule(index, { severity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
              <SelectItem value="error" className="pl-2">
                <span className="text-sm">Error (blocks submission)</span>
              </SelectItem>
              <SelectItem value="warning" className="pl-2">
                <span className="text-sm">Warning (shows message only)</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Application */}
        <div className="space-y-2">
          <Label className="text-xs">Apply When (optional)</Label>
          <Input
            value={rule.condition || ''}
            onChange={(e) => updateRule(index, { condition: e.target.value || undefined })}
            placeholder="e.g., otherField == 'someValue'"
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to always apply. Use field names and JavaScript expressions.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Validation Rules</h3>
          <p className="text-xs text-muted-foreground">
            Add custom validation rules for this field
          </p>
        </div>
        <Button type="button" onClick={addRule} size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No validation rules defined</p>
          <p className="text-xs">Click "Add Rule" to create custom validation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => renderRuleEditor(rule, index))}
        </div>
      )}
    </div>
  );
}