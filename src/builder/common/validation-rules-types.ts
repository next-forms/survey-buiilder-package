export interface ValidationOperatorDefinition {
  value: string;
  label: string;
  description?: string;
  category: 'comparison' | 'string' | 'array' | 'logical' | 'format';
  valueType: 'single' | 'array' | 'variable' | 'mixed' | 'none';
  supportsVariables?: boolean;
}

export const VALIDATION_OPERATORS: ValidationOperatorDefinition[] = [
  // Comparison operators
  { value: '==', label: 'Equals', category: 'comparison', valueType: 'single', supportsVariables: true },
  { value: '!=', label: 'Not equals', category: 'comparison', valueType: 'single', supportsVariables: true },
  { value: '>', label: 'Greater than', category: 'comparison', valueType: 'single', supportsVariables: true },
  { value: '>=', label: 'Greater than or equal', category: 'comparison', valueType: 'single', supportsVariables: true },
  { value: '<', label: 'Less than', category: 'comparison', valueType: 'single', supportsVariables: true },
  { value: '<=', label: 'Less than or equal', category: 'comparison', valueType: 'single', supportsVariables: true },
  
  // String operators
  { value: 'contains', label: 'Contains', description: 'Text contains substring', category: 'string', valueType: 'single' },
  { value: 'notContains', label: 'Does not contain', description: 'Text does not contain substring', category: 'string', valueType: 'single' },
  { value: 'startsWith', label: 'Starts with', category: 'string', valueType: 'single' },
  { value: 'endsWith', label: 'Ends with', category: 'string', valueType: 'single' },
  { value: 'matches', label: 'Matches pattern', description: 'Matches regex pattern', category: 'string', valueType: 'single' },
  
  // Array/Set operators
  { value: 'in', label: 'In array', description: 'Value is in the list', category: 'array', valueType: 'array' },
  { value: 'notIn', label: 'Not in array', description: 'Value is not in the list', category: 'array', valueType: 'array' },
  { value: 'containsAny', label: 'Contains any of', description: 'Contains at least one value from list', category: 'array', valueType: 'array' },
  { value: 'containsAll', label: 'Contains all of', description: 'Contains all values from list', category: 'array', valueType: 'array' },
  { value: 'containsNone', label: 'Contains none of', description: 'Contains no values from list', category: 'array', valueType: 'array' },
  
  // Logical operators
  { value: 'isEmpty', label: 'Is empty', description: 'Field has no value', category: 'logical', valueType: 'none' },
  { value: 'isNotEmpty', label: 'Is not empty', description: 'Field has a value', category: 'logical', valueType: 'none' },
  { value: 'between', label: 'Between', description: 'Value is between two values', category: 'logical', valueType: 'array' },
  { value: 'notBetween', label: 'Not between', description: 'Value is not between two values', category: 'logical', valueType: 'array' },
  
  // Format validation operators
  { value: 'isEmail', label: 'Is valid email', description: 'Value is a valid email address', category: 'format', valueType: 'none' },
  { value: 'isUrl', label: 'Is valid URL', description: 'Value is a valid URL', category: 'format', valueType: 'none' },
  { value: 'isNumber', label: 'Is valid number', description: 'Value is a valid number', category: 'format', valueType: 'none' },
  { value: 'isInteger', label: 'Is valid integer', description: 'Value is a valid integer', category: 'format', valueType: 'none' },
  { value: 'isDate', label: 'Is valid date', description: 'Value is a valid date', category: 'format', valueType: 'none' },
  { value: 'isPhone', label: 'Is valid phone', description: 'Value is a valid phone number', category: 'format', valueType: 'none' },
  
  // Length validation operators
  { value: 'lengthEquals', label: 'Length equals', description: 'Text length equals value', category: 'string', valueType: 'single' },
  { value: 'lengthGreaterThan', label: 'Length greater than', description: 'Text length greater than value', category: 'string', valueType: 'single' },
  { value: 'lengthLessThan', label: 'Length less than', description: 'Text length less than value', category: 'string', valueType: 'single' },
  { value: 'minLength', label: 'Minimum length', description: 'Text has minimum length', category: 'string', valueType: 'single' },
  { value: 'maxLength', label: 'Maximum length', description: 'Text has maximum length', category: 'string', valueType: 'single' },
];

export interface ValidationRule {
  field?: string;
  operator: string;
  value?: string | string[] | { type: 'variable' | 'literal'; value: string }[];
  message: string;
  severity?: 'error' | 'warning';
  dependencies?: string[];
  condition?: string; // Optional condition when this validation should apply
}

export interface ValidationRuleInput {
  type: 'text' | 'number' | 'array' | 'variable' | 'mixed';
  value: any;
  availableVariables?: string[];
}

// Helper to convert enhanced validation rule to executable function
export function validationRuleToFunction(rule: ValidationRule): (value: any, formValues: Record<string, any>) => string | null {
  const { field, operator, value: ruleValue, message } = rule;
  
  return (currentValue: any, formValues: Record<string, any>): string | null => {
    // If there's a field reference, use that field's value, otherwise use currentValue
    const valueToValidate = field ? formValues[field] : currentValue;
    
    try {
      // Handle different operator types
      switch (operator) {
        case 'isEmpty':
          return (!valueToValidate || valueToValidate === "" || (Array.isArray(valueToValidate) && valueToValidate.length === 0)) ? null : message;
        
        case 'isNotEmpty':
          return (valueToValidate && valueToValidate !== "" && !(Array.isArray(valueToValidate) && valueToValidate.length === 0)) ? null : message;
        
        case 'isEmail': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(String(valueToValidate)) ? null : message;
        }
        
        case 'isUrl': {
          try {
            new URL(String(valueToValidate));
            return null;
          } catch {
            return message;
          }
        }
        
        case 'isNumber':
          return (!isNaN(Number(valueToValidate)) && isFinite(Number(valueToValidate))) ? null : message;
        
        case 'isInteger':
          return Number.isInteger(Number(valueToValidate)) ? null : message;
        
        case 'isDate': {
          const date = new Date(valueToValidate);
          return !isNaN(date.getTime()) ? null : message;
        }
        
        case 'isPhone': {
          const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
          return phoneRegex.test(String(valueToValidate)) ? null : message;
        }
        
        case 'minLength':
          return String(valueToValidate).length >= Number(ruleValue) ? null : message;
        
        case 'maxLength':
          return String(valueToValidate).length <= Number(ruleValue) ? null : message;
        
        case 'lengthEquals':
          return String(valueToValidate).length === Number(ruleValue) ? null : message;
        
        case 'lengthGreaterThan':
          return String(valueToValidate).length > Number(ruleValue) ? null : message;
        
        case 'lengthLessThan':
          return String(valueToValidate).length < Number(ruleValue) ? null : message;
        
        case 'in':
        case 'notIn': {
          const arrayValue = Array.isArray(ruleValue) ? ruleValue : [ruleValue];
          const isIn = arrayValue.includes(valueToValidate);
          return (operator === 'in' ? isIn : !isIn) ? null : message;
        }
        
        case 'containsAny':
        case 'containsAll':
        case 'containsNone': {
          if (!Array.isArray(valueToValidate)) return message;
          const arrayValue = Array.isArray(ruleValue) ? ruleValue : [ruleValue];
          
          if (operator === 'containsAny') {
            return valueToValidate.some(v => arrayValue.includes(v)) ? null : message;
          } else if (operator === 'containsAll') {
            return arrayValue.every(v => valueToValidate.includes(v)) ? null : message;
          } else {
            return !valueToValidate.some(v => arrayValue.includes(v)) ? null : message;
          }
        }
        
        case 'between': {
          const [min, max] = Array.isArray(ruleValue) ? ruleValue : [ruleValue, ruleValue];
          const numValue = Number(valueToValidate);
          return (numValue >= Number(min) && numValue <= Number(max)) ? null : message;
        }
        
        case 'notBetween': {
          const [min, max] = Array.isArray(ruleValue) ? ruleValue : [ruleValue, ruleValue];
          const numValue = Number(valueToValidate);
          return (numValue < Number(min) || numValue > Number(max)) ? null : message;
        }
        
        case 'matches': {
          const regex = new RegExp(String(ruleValue));
          return regex.test(String(valueToValidate)) ? null : message;
        }
        
        case 'contains':
          return String(valueToValidate).includes(String(ruleValue)) ? null : message;
        
        case 'notContains':
          return !String(valueToValidate).includes(String(ruleValue)) ? null : message;
        
        case 'startsWith':
          return String(valueToValidate).startsWith(String(ruleValue)) ? null : message;
        
        case 'endsWith':
          return String(valueToValidate).endsWith(String(ruleValue)) ? null : message;
        
        default:
          // Handle standard comparison operators
          const compareValue = ruleValue;
          switch (operator) {
            case '==':
              return valueToValidate == compareValue ? null : message;
            case '!=':
              return valueToValidate != compareValue ? null : message;
            case '>':
              return Number(valueToValidate) > Number(compareValue) ? null : message;
            case '>=':
              return Number(valueToValidate) >= Number(compareValue) ? null : message;
            case '<':
              return Number(valueToValidate) < Number(compareValue) ? null : message;
            case '<=':
              return Number(valueToValidate) <= Number(compareValue) ? null : message;
            default:
              return null;
          }
      }
    } catch (error) {
      console.error('Validation rule error:', error);
      return message;
    }
  };
}

// Helper to parse validation rule from string format (if needed for backwards compatibility)
export function parseValidationRule(ruleString: string): Partial<ValidationRule> {
  // Basic parsing - can be extended based on needs
  const parts = ruleString.split('|');
  if (parts.length >= 2) {
    const [operator, value, ...messageParts] = parts;
    return {
      operator: operator.trim(),
      value: value.trim(),
      message: messageParts.join('|').trim() || 'Validation failed'
    };
  }
  
  return {
    operator: '==',
    value: '',
    message: 'Validation failed'
  };
}

// Helper to convert validation rule to string format (if needed)
export function validationRuleToString(rule: ValidationRule): string {
  const { operator, value, message } = rule;
  return `${operator}|${Array.isArray(value) ? value.join(',') : value}|${message}`;
}