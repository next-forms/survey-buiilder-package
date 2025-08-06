export interface OperatorDefinition {
  value: string;
  label: string;
  description?: string;
  category: 'comparison' | 'string' | 'array' | 'logical' | 'date';
  valueType: 'single' | 'array' | 'variable' | 'mixed';
  supportsVariables?: boolean;
}

export const OPERATORS: OperatorDefinition[] = [
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
  { value: 'isEmpty', label: 'Is empty', description: 'Field has no value', category: 'logical', valueType: 'single' },
  { value: 'isNotEmpty', label: 'Is not empty', description: 'Field has a value', category: 'logical', valueType: 'single' },
  { value: 'between', label: 'Between', description: 'Value is between two values', category: 'logical', valueType: 'array' },
  { value: 'notBetween', label: 'Not between', description: 'Value is not between two values', category: 'logical', valueType: 'array' },
  
  // Date operators
  { value: 'dateEquals', label: 'Date equals', description: 'Date is exactly equal to value', category: 'date', valueType: 'single' },
  { value: 'dateNotEquals', label: 'Date not equals', description: 'Date is not equal to value', category: 'date', valueType: 'single' },
  { value: 'dateGreaterThan', label: 'Date after', description: 'Date is after the specified date', category: 'date', valueType: 'single' },
  { value: 'dateGreaterThanOrEqual', label: 'Date on or after', description: 'Date is on or after the specified date', category: 'date', valueType: 'single' },
  { value: 'dateLessThan', label: 'Date before', description: 'Date is before the specified date', category: 'date', valueType: 'single' },
  { value: 'dateLessThanOrEqual', label: 'Date on or before', description: 'Date is on or before the specified date', category: 'date', valueType: 'single' },
  { value: 'dateBetween', label: 'Date between', description: 'Date is between two dates (inclusive)', category: 'date', valueType: 'array' },
  { value: 'dateNotBetween', label: 'Date not between', description: 'Date is not between two dates', category: 'date', valueType: 'array' },
  { value: 'isToday', label: 'Is today', description: 'Date is today', category: 'date', valueType: 'single' },
  { value: 'isPastDate', label: 'Is past date', description: 'Date is in the past', category: 'date', valueType: 'single' },
  { value: 'isFutureDate', label: 'Is future date', description: 'Date is in the future', category: 'date', valueType: 'single' },
  { value: 'isWeekday', label: 'Is weekday', description: 'Date falls on a weekday (Mon-Fri)', category: 'date', valueType: 'single' },
  { value: 'isWeekend', label: 'Is weekend', description: 'Date falls on a weekend (Sat-Sun)', category: 'date', valueType: 'single' },
  { value: 'dayOfWeekEquals', label: 'Day of week equals', description: 'Date falls on specific day (0=Sunday, 1=Monday, etc.)', category: 'date', valueType: 'single' },
  { value: 'monthEquals', label: 'Month equals', description: 'Date is in specific month (1=January, 2=February, etc.)', category: 'date', valueType: 'single' },
  { value: 'yearEquals', label: 'Year equals', description: 'Date is in specific year', category: 'date', valueType: 'single' },
  { value: 'ageGreaterThan', label: 'Age greater than', description: 'Age calculated from date is greater than value', category: 'date', valueType: 'single' },
  { value: 'ageLessThan', label: 'Age less than', description: 'Age calculated from date is less than value', category: 'date', valueType: 'single' },
  { value: 'ageBetween', label: 'Age between', description: 'Age calculated from date is between two values', category: 'date', valueType: 'array' },
];

export interface EnhancedNavigationRule {
  field: string;
  operator: string;
  value: string | string[] | { type: 'variable' | 'literal'; value: string }[];
  target: string;
  isPage?: boolean;
}

export interface RuleValueInput {
  type: 'text' | 'number' | 'array' | 'variable' | 'mixed' | 'date';
  value: any;
  availableVariables?: string[];
  isDateArray?: boolean; // Flag to indicate if array should use date inputs
}

// Helper to convert enhanced rule to standard NavigationRule format
export function enhancedRuleToStandard(rule: EnhancedNavigationRule): string {
  const { field, operator, value } = rule;
  
  // Handle different operator types
  switch (operator) {
    case 'isEmpty':
      return `!${field} || ${field} === ""`;
    
    case 'isNotEmpty':
      return `${field} && ${field} !== ""`;
    
    case 'in':
    case 'notIn': {
      const arrayValue = Array.isArray(value) ? value : [value];
      const jsonArray = JSON.stringify(arrayValue);
      return operator === 'in' 
        ? `${jsonArray}.includes(${field})`
        : `!${jsonArray}.includes(${field})`;
    }
    
    case 'containsAny':
    case 'containsAll':
    case 'containsNone': {
      const arrayValue = Array.isArray(value) ? value : [value];
      const jsonArray = JSON.stringify(arrayValue);
      if (operator === 'containsAny') {
        return `${field}.some(v => ${jsonArray}.includes(v))`;
      } else if (operator === 'containsAll') {
        return `${jsonArray}.every(v => ${field}.includes(v))`;
      } else {
        return `!${field}.some(v => ${jsonArray}.includes(v))`;
      }
    }
    
    case 'between': {
      const [min, max] = Array.isArray(value) ? value : [value, value];
      return `${field} >= ${JSON.stringify(min)} && ${field} <= ${JSON.stringify(max)}`;
    }
    
    case 'notBetween': {
      const [min, max] = Array.isArray(value) ? value : [value, value];
      return `${field} < ${JSON.stringify(min)} || ${field} > ${JSON.stringify(max)}`;
    }
    
    case 'matches':
      return `new RegExp(${JSON.stringify(value)}).test(${field})`;
    
    case 'notContains':
      return `!${field}.includes(${JSON.stringify(value)})`;
    
    // Date operators
    case 'dateEquals':
      return `new Date(${field}).toDateString() === new Date(${JSON.stringify(value)}).toDateString()`;
    
    case 'dateNotEquals':
      return `new Date(${field}).toDateString() !== new Date(${JSON.stringify(value)}).toDateString()`;
    
    case 'dateGreaterThan':
      return `new Date(${field}) > new Date(${JSON.stringify(value)})`;
    
    case 'dateGreaterThanOrEqual':
      return `new Date(${field}) >= new Date(${JSON.stringify(value)})`;
    
    case 'dateLessThan':
      return `new Date(${field}) < new Date(${JSON.stringify(value)})`;
    
    case 'dateLessThanOrEqual':
      return `new Date(${field}) <= new Date(${JSON.stringify(value)})`;
    
    case 'dateBetween': {
      const [min, max] = Array.isArray(value) ? value : [value, value];
      return `new Date(${field}) >= new Date(${JSON.stringify(min)}) && new Date(${field}) <= new Date(${JSON.stringify(max)})`;
    }
    
    case 'dateNotBetween': {
      const [min, max] = Array.isArray(value) ? value : [value, value];
      return `new Date(${field}) < new Date(${JSON.stringify(min)}) || new Date(${field}) > new Date(${JSON.stringify(max)})`;
    }
    
    case 'isToday':
      return `new Date(${field}).toDateString() === new Date().toDateString()`;
    
    case 'isPastDate':
      return `new Date(${field}) < new Date()`;
    
    case 'isFutureDate':
      return `new Date(${field}) > new Date()`;
    
    case 'isWeekday': {
      return `(() => { const d = new Date(${field}); const day = d.getDay(); return day >= 1 && day <= 5; })()`;
    }
    
    case 'isWeekend': {
      return `(() => { const d = new Date(${field}); const day = d.getDay(); return day === 0 || day === 6; })()`;
    }
    
    case 'dayOfWeekEquals':
      return `new Date(${field}).getDay() === ${JSON.stringify(Number(value))}`;
    
    case 'monthEquals':
      return `(new Date(${field}).getMonth() + 1) === ${JSON.stringify(Number(value))}`;
    
    case 'yearEquals':
      return `new Date(${field}).getFullYear() === ${JSON.stringify(Number(value))}`;
    
    case 'ageGreaterThan':
      return `Math.floor((new Date().getTime() - new Date(${field}).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) > ${JSON.stringify(Number(value))}`;
    
    case 'ageLessThan':
      return `Math.floor((new Date().getTime() - new Date(${field}).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) < ${JSON.stringify(Number(value))}`;
    
    case 'ageBetween': {
      const [minAge, maxAge] = Array.isArray(value) ? value : [value, value];
      return `(() => { const age = Math.floor((new Date().getTime() - new Date(${field}).getTime()) / (365.25 * 24 * 60 * 60 * 1000)); return age >= ${JSON.stringify(Number(minAge))} && age <= ${JSON.stringify(Number(maxAge))}; })()`;
    }
    
    default:
      // Handle standard operators and contains/startsWith/endsWith
      if (['contains', 'startsWith', 'endsWith'].includes(operator)) {
        return `${field}.${operator}(${JSON.stringify(value)})`;
      }
      // Standard comparison operators
      return `${field} ${operator} ${JSON.stringify(value)}`;
  }
}

// Helper to parse standard rule to enhanced format
export function standardRuleToEnhanced(condition: string): Partial<EnhancedNavigationRule> {
  
  // Try to match various patterns
  const patterns = [
    // Standard comparison: field == "value"
    /^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/,
    // Contains/starts/ends: field.contains("value")
    /^(\w+)\.(contains|startsWith|endsWith)\((.+)\)$/,
    // Array includes: ["a","b"].includes(field)
    /^(\[.+\])\.includes\((\w+)\)$/,
    // Not includes: !["a","b"].includes(field)
    /^!(\[.+\])\.includes\((\w+)\)$/,
    // Empty checks: !field || field === ""
    /^!(\w+)\s*\|\|\s*\1\s*===\s*""$/,
    // Not empty: field && field !== ""
    /^(\w+)\s*&&\s*\1\s*!==\s*""$/,
  ];
  
  for (const pattern of patterns) {
    const match = condition.match(pattern);
    if (match) {
      // Parse based on pattern type
      if (pattern.toString().includes('includes')) {
        const isNegated = condition.startsWith('!');
        const arrayStr = isNegated ? match[1] : match[1];
        const field = isNegated ? match[2] : match[2];
        try {
          const arrayValue = JSON.parse(arrayStr);
          return {
            field,
            operator: isNegated ? 'notIn' : 'in',
            value: arrayValue
          };
        } catch {
          // Fallback
        }
      } else if (pattern.toString().includes('||')) {
        return { field: match[1], operator: 'isEmpty' };
      } else if (pattern.toString().includes('&&')) {
        return { field: match[1], operator: 'isNotEmpty' };
      } else {
        // Standard operators
        const field = match[1];
        const operator = match[2];
        let value = match[3];
        
        // Try to parse JSON value
        try {
          value = JSON.parse(value);
        } catch {
          // Remove quotes if present
          value = value.replace(/^['"]|['"]$/g, '');
        }
        
        return { field, operator, value };
      }
    }
  }
  
  // Fallback - try to extract field and value
  const fallbackMatch = condition.match(/^(\w+)\s*(.+)$/);
  if (fallbackMatch) {
    return { field: fallbackMatch[1], operator: '==', value: fallbackMatch[2] };
  }
  
  return { field: '', operator: '==', value: '' };
}