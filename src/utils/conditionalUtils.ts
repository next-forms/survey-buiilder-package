import type {
  ConditionRule,
  ConditionOperator,
  BranchingLogic,
  CalculationRule,
  NavigationRule,
  CurrentValues,
  EvaluationResult,
} from '../types';
import type { BlockData } from '../types';

/**
 * Evaluates a simple condition between two values using the specified operator
 */
export function evaluateSimpleCondition(
  fieldValue: any,
  operator: ConditionOperator,
  comparisonValue: any,
  valueType: 'string' | 'number' | 'boolean' | 'date' = 'string'
): boolean {
  // Handle null/undefined field values specially
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'empty') return true;
    if (operator === 'notEmpty') return false;
    // For equality operators when checking against null/undefined
    if (operator === '==') return comparisonValue === null || comparisonValue === undefined;
    if (operator === '!=') return comparisonValue !== null && comparisonValue !== undefined;
    return false; // Most other operations on null/undefined should return false
  }

  // Type conversions based on the specified type
  let typedFieldValue = fieldValue;
  let typedComparisonValue = comparisonValue;

  if (valueType === 'number') {
    typedFieldValue = Number(fieldValue);
    typedComparisonValue = Number(comparisonValue);
  } else if (valueType === 'boolean') {
    typedFieldValue = Boolean(fieldValue);
    typedComparisonValue = Boolean(comparisonValue);
  } else if (valueType === 'date') {
    typedFieldValue = new Date(fieldValue);
    typedComparisonValue = new Date(comparisonValue);
  } else if (valueType === 'string') {
    typedFieldValue = String(fieldValue);
    typedComparisonValue = String(comparisonValue);
  }

  // Evaluate based on operator
  switch (operator) {
    case '==':
      return typedFieldValue == typedComparisonValue;
    case '!=':
      return typedFieldValue != typedComparisonValue;
    case '>':
      return typedFieldValue > typedComparisonValue;
    case '>=':
      return typedFieldValue >= typedComparisonValue;
    case '<':
      return typedFieldValue < typedComparisonValue;
    case '<=':
      return typedFieldValue <= typedComparisonValue;
    case 'contains':
      return String(typedFieldValue).includes(String(typedComparisonValue));
    case 'startsWith':
      return String(typedFieldValue).startsWith(String(typedComparisonValue));
    case 'endsWith':
      return String(typedFieldValue).endsWith(String(typedComparisonValue));
    case 'empty':
      return typedFieldValue === '' ||
             typedFieldValue === null ||
             typedFieldValue === undefined ||
             (Array.isArray(typedFieldValue) && typedFieldValue.length === 0);
    case 'notEmpty':
      return typedFieldValue !== '' &&
             typedFieldValue !== null &&
             typedFieldValue !== undefined &&
             (!Array.isArray(typedFieldValue) || typedFieldValue.length > 0);
    case 'between':
      if (Array.isArray(typedComparisonValue) && typedComparisonValue.length === 2) {
        return typedFieldValue >= typedComparisonValue[0] && typedFieldValue <= typedComparisonValue[1];
      }
      return false;
    case 'in':
      return Array.isArray(typedComparisonValue) && typedComparisonValue.includes(typedFieldValue);
    case 'notIn':
      return Array.isArray(typedComparisonValue) && !typedComparisonValue.includes(typedFieldValue);
    case 'notContains':
      return !String(typedFieldValue).includes(String(typedComparisonValue));
    case 'containsAny':
      if (Array.isArray(typedFieldValue) && Array.isArray(typedComparisonValue)) {
        return typedFieldValue.some(v => typedComparisonValue.includes(v));
      }
      return false;
    case 'containsAll':
      if (Array.isArray(typedFieldValue) && Array.isArray(typedComparisonValue)) {
        return typedComparisonValue.every(v => typedFieldValue.includes(v));
      }
      return false;
    case 'containsNone':
      if (Array.isArray(typedFieldValue) && Array.isArray(typedComparisonValue)) {
        return !typedFieldValue.some(v => typedComparisonValue.includes(v));
      }
      return false;
    case 'notBetween':
      if (Array.isArray(typedComparisonValue) && typedComparisonValue.length === 2) {
        return typedFieldValue < typedComparisonValue[0] || typedFieldValue > typedComparisonValue[1];
      }
      return false;
    case 'matches':
      try {
        return new RegExp(String(typedComparisonValue)).test(String(typedFieldValue));
      } catch {
        return false;
      }
    case 'isEmpty':
      return typedFieldValue === '' ||
             typedFieldValue === null ||
             typedFieldValue === undefined ||
             (Array.isArray(typedFieldValue) && typedFieldValue.length === 0);
    case 'isNotEmpty':
      return typedFieldValue !== '' &&
             typedFieldValue !== null &&
             typedFieldValue !== undefined &&
             (!Array.isArray(typedFieldValue) || typedFieldValue.length > 0);
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Evaluates a complex condition rule against field values
 */
export function evaluateConditionRule(
  rule: ConditionRule,
  fieldValues: Record<string, any>
): boolean {
  const fieldValue = fieldValues[rule.field];
  return evaluateSimpleCondition(
    fieldValue,
    rule.operator,
    rule.value,
    rule.type
  );
}

function evaluateNavigationalRule(conditionalRule: NavigationRule, currentValues: CurrentValues): EvaluationResult {
  try {
    const { condition, target, isPage } = conditionalRule;
    
    
    // Try to parse enhanced operators first
    const enhancedResult = evaluateEnhancedCondition(condition, currentValues);
    if (enhancedResult !== null) {
      return {
        matched: enhancedResult,
        target: enhancedResult ? target : null,
        isPage: enhancedResult ? (isPage ? true : false) : null
      };
    }
    
    // Fallback to Function constructor evaluation for complex conditions
    const context = { ...currentValues };
    const evaluator = new Function(...Object.keys(context), `return ${condition}`);
    const result = evaluator(...Object.values(context));
    
    if (result) {
      return {
        matched: true,
        target: target,
        isPage: isPage ? true : false
      };
    }
    
    return {
      matched: false,
      target: null,
      isPage: null
    };
    
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return {
      matched: false,
      target: null,
      isPage: null,
      error: error
    };
  }
}

// Helper function to evaluate enhanced conditions
function evaluateEnhancedCondition(condition: string, currentValues: CurrentValues): boolean | null {
  try {
    // Check for isEmpty/isNotEmpty patterns
    if (condition.match(/^!(\w+)\s*\|\|\s*\1\s*===\s*""$/)) {
      const match = condition.match(/^!(\w+)/);
      if (match) {
        const fieldName = match[1];
        const value = currentValues[fieldName];
        return !value || value === "";
      }
    }
    
    if (condition.match(/^(\w+)\s*&&\s*\1\s*!==\s*""$/)) {
      const match = condition.match(/^(\w+)/);
      if (match) {
        const fieldName = match[1];
        const value = currentValues[fieldName];
        return value && value !== "";
      }
    }
    
    // Check for array operations
    if (condition.includes('.includes(')) {
      // Pattern: ["a","b"].includes(field)
      const includesMatch = condition.match(/^(!?)(\[.*?\])\.includes\((\w+)\)$/);
      if (includesMatch) {
        const [, negated, arrayStr, fieldName] = includesMatch;
        const arrayValue = JSON.parse(arrayStr);
        const fieldValue = currentValues[fieldName];
        const result = Array.isArray(arrayValue) && arrayValue.includes(fieldValue);
        return negated ? !result : result;
      }
      
      // Pattern: field.includes("value")
      const fieldIncludesMatch = condition.match(/^(\w+)\.includes\((.+)\)$/);
      if (fieldIncludesMatch) {
        const [, fieldName, valueStr] = fieldIncludesMatch;
        const fieldValue = currentValues[fieldName];
        const value = JSON.parse(valueStr);
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        return String(fieldValue).includes(String(value));
      }
    }
    
    // Check for array some/every operations
    if (condition.includes('.some(') || condition.includes('.every(')) {
      // Pattern: field.some(v => ["a","b"].includes(v))
      const someMatch = condition.match(/^(\w+)\.(some|every)\(v\s*=>\s*(\[.*?\])\.includes\(v\)\)$/);
      if (someMatch) {
        const [, fieldName, method, arrayStr] = someMatch;
        const fieldValue = currentValues[fieldName];
        const arrayValue = JSON.parse(arrayStr);
        
        if (Array.isArray(fieldValue) && Array.isArray(arrayValue)) {
          if (method === 'some') {
            return fieldValue.some(v => arrayValue.includes(v));
          } else {
            return arrayValue.every(v => fieldValue.includes(v));
          }
        }
      }
      
      // Pattern: !field.some(v => ["a","b"].includes(v))
      const notSomeMatch = condition.match(/^!(\w+)\.some\(v\s*=>\s*(\[.*?\])\.includes\(v\)\)$/);
      if (notSomeMatch) {
        const [, fieldName, arrayStr] = notSomeMatch;
        const fieldValue = currentValues[fieldName];
        const arrayValue = JSON.parse(arrayStr);
        
        if (Array.isArray(fieldValue) && Array.isArray(arrayValue)) {
          return !fieldValue.some(v => arrayValue.includes(v));
        }
      }
    }
    
    // Check for between operations
    if (condition.includes(' >= ') && condition.includes(' && ') && condition.includes(' <= ')) {
      const betweenMatch = condition.match(/^(\w+)\s*>=\s*(.+?)\s*&&\s*\1\s*<=\s*(.+)$/);
      if (betweenMatch) {
        const [, fieldName, minStr, maxStr] = betweenMatch;
        const fieldValue = currentValues[fieldName];
        const min = JSON.parse(minStr);
        const max = JSON.parse(maxStr);
        return fieldValue >= min && fieldValue <= max;
      }
    }
    
    // Check for not between operations
    if (condition.includes(' < ') && condition.includes(' || ') && condition.includes(' > ')) {
      const notBetweenMatch = condition.match(/^(\w+)\s*<\s*(.+?)\s*\|\|\s*\1\s*>\s*(.+)$/);
      if (notBetweenMatch) {
        const [, fieldName, minStr, maxStr] = notBetweenMatch;
        const fieldValue = currentValues[fieldName];
        const min = JSON.parse(minStr);
        const max = JSON.parse(maxStr);
        return fieldValue < min || fieldValue > max;
      }
    }
    
    // Check for regex patterns
    if (condition.includes('new RegExp(')) {
      const regexMatch = condition.match(/^new RegExp\((.+?)\)\.test\((\w+)\)$/);
      if (regexMatch) {
        const [, patternStr, fieldName] = regexMatch;
        const pattern = JSON.parse(patternStr);
        const fieldValue = currentValues[fieldName];
        return new RegExp(pattern).test(String(fieldValue));
      }
    }
    
    // Check for string methods (contains, startsWith, endsWith)
    const stringMethodMatch = condition.match(/^(\w+)\.(contains|startsWith|endsWith)\((.+)\)$/);
    if (stringMethodMatch) {
      const [, fieldName, method, valueStr] = stringMethodMatch;
      const fieldValue = String(currentValues[fieldName] || '');
      const value = JSON.parse(valueStr);
      
      switch (method) {
        case 'contains':
          return fieldValue.includes(String(value));
        case 'startsWith':
          return fieldValue.startsWith(String(value));
        case 'endsWith':
          return fieldValue.endsWith(String(value));
      }
    }
    
    // Check for notContains pattern
    if (condition.match(/^!(\w+)\.includes\(/)) {
      const match = condition.match(/^!(\w+)\.includes\((.+)\)$/);
      if (match) {
        const [, fieldName, valueStr] = match;
        const fieldValue = String(currentValues[fieldName] || '');
        const value = JSON.parse(valueStr);
        return !fieldValue.includes(String(value));
      }
    }
    
    // Standard comparison operators
    const comparisonMatch = condition.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
    if (comparisonMatch) {
      const [, fieldName, operator, valueStr] = comparisonMatch;
      const fieldValue = currentValues[fieldName];
      let value;
      try {
        value = JSON.parse(valueStr);
      } catch {
        value = valueStr;
      }
      
      switch (operator) {
        case '==':
          return fieldValue == value;
        case '!=':
          return fieldValue != value;
        case '>':
          return fieldValue > value;
        case '>=':
          return fieldValue >= value;
        case '<':
          return fieldValue < value;
        case '<=':
          return fieldValue <= value;
      }
    }
    
    return null; // Couldn't parse with enhanced operators
  } catch (error) {
    console.error('Error in enhanced condition evaluation:', error);
    return null;
  }
}

// Alternative safer method using manual parsing for simple conditions
function evaluateNavigationalRuleSafe(conditionalRule: NavigationRule, currentValues: CurrentValues): EvaluationResult {
  try {
    const { condition, target, isPage } = conditionalRule;
    
    // Parse simple conditions like "field == value" or "field != value"
    const operatorRegex: RegExp = /(.*?)\s*(==|!=|>|<|>=|<=)\s*(.*)/;
    const match: RegExpMatchArray | null = condition.match(operatorRegex);
    
    if (!match) {
      throw new Error('Unsupported condition format');
    }
    
    const [, leftSide, operator, rightSide]: string[] = match;
    const fieldName: string = leftSide.trim();
    
    // Remove quotes from string values
    let expectedValue: string = rightSide.trim();
    if ((expectedValue.startsWith('"') && expectedValue.endsWith('"')) ||
        (expectedValue.startsWith("'") && expectedValue.endsWith("'"))) {
      expectedValue = expectedValue.slice(1, -1);
    }
    
    const currentValue: string | number | boolean = currentValues[fieldName];
    let result: boolean = false;
    
    switch (operator) {
      case '==':
        result = currentValue == expectedValue;
        break;
      case '!=':
        result = currentValue != expectedValue;
        break;
      case '>':
        result = Number(currentValue) > Number(expectedValue);
        break;
      case '<':
        result = Number(currentValue) < Number(expectedValue);
        break;
      case '>=':
        result = Number(currentValue) >= Number(expectedValue);
        break;
      case '<=':
        result = Number(currentValue) <= Number(expectedValue);
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
    
    if (result) {
      return {
        matched: true,
        target: target,
        isPage: isPage ? true : false,
      };
    }
    
    return {
      matched: false,
      target: null,
      isPage: null
    };
    
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return {
      matched: false,
      target: null,
      isPage: null,
      error: error
    };
  }
}

/**
 * Evaluates a condition expression or rule against field values
 */
export function evaluateCondition(
  condition: string | ConditionRule | ConditionRule[],
  fieldValues: Record<string, any>
): boolean {
  // If condition is a string, evaluate it as a JavaScript expression
  if (typeof condition === 'string') {
    try {
      // Basic sanitization
      const sanitizedCondition = condition
        .replace(/import\s*\{/g, '')
        .replace(/require\s*\(/g, '')
        .replace(/process/g, '')
        .replace(/global/g, '')
        .replace(/window/g, '')
        .replace(/document/g, '')
        .replace(/eval\s*\(/g, '')
        .trim();

      // Allow conditions written as "return x > 0;" by stripping leading return
      const normalized = sanitizedCondition
        .replace(/^return\s+/i, '')
        .replace(/;?\s*$/,'');

      // Create a function that references values by using a parameter object instead of 'with'
      const conditionFn = new Function('values', `
        "use strict";
        try {
          // Access values directly from the values object
          // Example: If condition is "age > 18", we'll reference values.age
          const result = (${translateConditionToExplicitReferences(normalized)});
          return result;
        } catch (e) {
          console.error("Error evaluating condition:", e);
          return false;
        }
      `);

      // Execute the function with the field values
      return Boolean(conditionFn(fieldValues));
    } catch (error) {
      console.error('Error parsing condition expression:', error);
      return false;
    }
  }

  // If condition is a single rule object, evaluate it
  if (!Array.isArray(condition)) {
    return evaluateConditionRule(condition as ConditionRule, fieldValues);
  }

  // If condition is an array of rules, evaluate each rule and return true if all are true
  return (condition as ConditionRule[]).every(rule =>
    evaluateConditionRule(rule, fieldValues)
  );
}

/**
 * Translates a condition string to use explicit references to the values object
 * For example, converts "age > 18" to "values.age > 18"
 */
function translateConditionToExplicitReferences(condition: string): string {
  // Replace variable names with values object references
  // This regex looks for identifiers that aren't part of a property access
  return condition.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b(?!\s*:|\s*\(|\[|\.])/g, (match, name) => {
    // Don't replace JavaScript keywords and common values
    const keywords = [
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
      'if', 'else', 'return', 'function', 'var', 'let', 'const',
      'new', 'this', 'typeof', 'instanceof', 'in'
    ];

    if (keywords.includes(name)) {
      return name;
    }

    return `values.${name}`;
  });
}

/**
 * Determines the next page index based on branching logic
 */
export function getNextPageIndex(
  currentPage: number,
  branchingLogic: BranchingLogic | undefined,
  fieldValues: Record<string, any>,
  totalPages: number
): number {
  // If no branching logic is defined, go to the next page
  if (!branchingLogic || !branchingLogic.condition) {
    return currentPage + 1 < totalPages ? currentPage + 1 : currentPage;
  }

  // Evaluate the condition for this branching logic
  const conditionMet = evaluateCondition(branchingLogic.condition, fieldValues);

  // If condition is not met, proceed to the next page
  if (!conditionMet) {
    return currentPage + 1 < totalPages ? currentPage + 1 : currentPage;
  }

  // If condition is met, determine the target page
  const { targetPage } = branchingLogic;

  if (typeof targetPage === 'number') {
    // Validate the page index
    if (targetPage >= 0 && targetPage < totalPages) {
      return targetPage;
    }
  } else if (targetPage === 'next') {
    return currentPage + 1 < totalPages ? currentPage + 1 : currentPage;
  } else if (targetPage === 'prev') {
    return currentPage - 1 >= 0 ? currentPage - 1 : currentPage;
  } else if (targetPage === 'submit') {
    // Return a special value to indicate submission
    return -1;
  }

  // Default to next page
  return currentPage + 1 < totalPages ? currentPage + 1 : currentPage;
}

/**
 * Evaluate navigation rules defined on blocks to determine next page
 */
export function getNextPageFromNavigationRules(
  blocks: BlockData[],
  pages: Array<BlockData[]>,
  pageIds: string[],
  fieldValues: Record<string, any>
): number | null {
  for (const block of blocks) {
    if (!block.navigationRules) continue;
    for (const rule of block.navigationRules) {
      if (evaluateCondition(rule.condition, fieldValues)) {
        if (rule.target === "submit") {
          return -1;
        }
        if (rule.isPage) {
          const idx = pageIds.indexOf(String(rule.target));
          if (idx >= 0) return idx;
        } else {
          const idx = pages.findIndex((p) =>
            p.some((b) => b.uuid === rule.target)
          );
          if (idx >= 0) return idx;
        }
      }
    }
  }
  return null;
}

/**
 * Find the page and block index for a block UUID
 */
export function findBlockPosition(
  pages: Array<BlockData[]>,
  target: string
): { pageIndex: number; blockIndex: number } | null {
  for (let pIndex = 0; pIndex < pages.length; pIndex++) {
    const bIndex = pages[pIndex].findIndex((b) => b.uuid === target);
    if (bIndex >= 0) {
      return { pageIndex: pIndex, blockIndex: bIndex };
    }
  }
  return null;
}

/**
 * Evaluate navigation rules on a single block and return the target position
 */
export function getNextStepFromNavigationRules(
  block: BlockData,
  pages: Array<BlockData[]>,
  pageIds: string[],
  fieldValues: Record<string, any>
): { pageIndex: number; blockIndex: number } | 'submit' | null {
  if (!block.navigationRules) return null;

  for (const rule of block.navigationRules) {
    // evaluateNavigationalRule(rule, fieldValues)
    const evaluate = evaluateNavigationalRule(rule, fieldValues);
    if(evaluate.matched) {
      if (evaluate.target === 'submit') {
        return 'submit';
      }
      if (evaluate.isPage) {
        const idx = pageIds.indexOf(String(evaluate.target));
        if (idx >= 0) return { pageIndex: idx, blockIndex: 0 };
      } else {
        const pos = findBlockPosition(pages, String(evaluate.target));
        if (pos) return pos;
      }
    }
    // if (evaluateCondition(rule.condition, fieldValues)) {
    //   if (rule.target === 'submit') {
    //     return 'submit';
    //   }
    //   if (rule.isPage) {
    //     const idx = pageIds.indexOf(String(rule.target));
    //     if (idx >= 0) return { pageIndex: idx, blockIndex: 0 };
    //   } else {
    //     const pos = findBlockPosition(pages, String(rule.target));
    //     if (pos) return pos;
    //   }
    // }
  }

  return null;
}

/**
 * Executes a calculation rule to compute a field value
 */
export function executeCalculation(
  calculationRule: CalculationRule,
  fieldValues: Record<string, any>
): any {
  try {
    // Basic sanitization
    const sanitizedFormula = calculationRule.formula
      .replace(/import\s*\{/g, '')
      .replace(/require\s*\(/g, '')
      .replace(/process/g, '')
      .replace(/global/g, '')
      .replace(/window/g, '')
      .replace(/document/g, '')
      .replace(/eval\s*\(/g, '');

    // Simple direct execution approach
    const functionBody = `
      "use strict";

      try {
        // Make all fields directly available
        ${Object.keys(fieldValues).map(key =>
          `const ${key} = ${JSON.stringify(fieldValues[key])};`
        ).join('\n')}

        // Execute formula
        ${sanitizedFormula}
      } catch (error) {
        console.error("Error in formula execution:", error);
        return null;
      }
    `;

    // Create and execute the function
    const fn = new Function(functionBody);
    return fn();
  } catch (error) {
    console.error('Error executing calculation:', error);
    return null;
  }
}

/**
 * Evaluates if a block should be visible based on its visibility condition
 */
export function isBlockVisible(
  block: { visibleIf?: string | ConditionRule | ConditionRule[] },
  fieldValues: Record<string, any>
): boolean {
  // If no visibility condition, the block is always visible
  if (!block.visibleIf) {
    return true;
  }

  // Evaluate the visibility condition
  return evaluateCondition(block.visibleIf, fieldValues);
}

/**
 * Simple BMI calculator example
 */
export function calculateBMI(
  weightInKg: number,
  heightInCm: number
): { bmi: number; category: string } {
  // Convert height to meters
  const heightInM = heightInCm / 100;

  // Calculate BMI
  const bmi = weightInKg / (heightInM * heightInM);

  // Determine BMI category
  let category = '';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    category = 'Normal weight';
  } else if (bmi >= 25 && bmi < 30) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }

  return { bmi: parseFloat(bmi.toFixed(1)), category };
}
