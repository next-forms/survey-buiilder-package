# Block Output Schema

The output schema system allows blocks to declare what data structure they return. This makes it easy to programmatically understand what keys and values a block produces.

## Why Output Schemas?

- **Type Safety**: Know what data structure to expect from each block
- **Conditional Logic**: Easily reference nested fields in conditional expressions
- **Calculated Fields**: Use block outputs in calculations
- **Documentation**: Self-documenting block behavior
- **Validation**: Validate block outputs match expected structure

## Schema Types

### Scalar Types

For blocks that return a single value (string, number, boolean, date):

```typescript
outputSchema: {
  type: 'string'  // or 'number', 'boolean', 'date'
}
```

**Example - Text Input Block:**
```typescript
export const TextInputBlock: BlockDefinition = {
  type: "textfield",
  name: "Text Input",
  // ... other properties
  outputSchema: {
    type: 'string'
  }
};

// Returns: "John Doe"
```

### Array Types

For blocks that return an array of values:

```typescript
outputSchema: {
  type: 'array',
  items: {
    type: 'string'  // or 'number', 'boolean', 'object'
  }
}
```

**Example - Checkbox Block:**
```typescript
export const CheckboxBlock: BlockDefinition = {
  type: "checkbox",
  name: "Checkbox",
  // ... other properties
  outputSchema: {
    type: 'array',
    items: {
      type: 'string'
    }
  }
};

// Returns: ["option-1", "option-3"]
```

### Object Types

For blocks that return a complex object with multiple fields:

```typescript
outputSchema: {
  type: 'object',
  properties: {
    fieldName: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array',
      optional?: boolean,
      description?: string
    },
    // ... more fields
  }
}
```

### Union Types (oneOf)

For blocks that return different types based on configuration:

```typescript
outputSchema: {
  oneOf: [
    { type: 'string' },
    { type: 'array', items: { type: 'string' } }
  ],
  discriminator: {
    propertyName: 'multiSelect',
    mapping: {
      'false': 0,  // Single select mode - returns string
      'true': 1    // Multi-select mode - returns array
    }
  }
}
```

**Example - SelectableBox Block:**
```typescript
export const SelectableBoxBlock: BlockDefinition = {
  type: "selectableBox",
  name: "Selectable Box",
  // ... other properties ...
  outputSchema: {
    oneOf: [
      { type: 'string' },  // Single selection
      { type: 'array', items: { type: 'string' } }  // Multi-selection
    ],
    discriminator: {
      propertyName: 'multiSelect',
      mapping: {
        'false': 0,
        'true': 1
      }
    }
  }
};

// With multiSelect: false → returns: "option-1"
// With multiSelect: true → returns: ["option-1", "option-2"]
```

**Example - Auth Block:**
```typescript
export const AuthBlock: BlockDefinition = {
  type: "auth",
  name: "Authentication",
  // ... other properties
  outputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        optional: true,
        description: 'Full name of the user'
      },
      email: {
        type: 'string',
        optional: true,
        description: 'Email address'
      },
      token: {
        type: 'string',
        description: 'Authentication token'
      },
      isAuthenticated: {
        type: 'boolean',
        description: 'Whether authentication was successful'
      },
      timestamp: {
        type: 'string',
        description: 'ISO timestamp of authentication'
      }
    }
  }
};

// Returns:
// {
//   name: "John Doe",
//   email: "john@example.com",
//   token: "jwt_token_here",
//   isAuthenticated: true,
//   timestamp: "2025-01-15T10:30:00Z"
// }
```

## Using Output Schemas Programmatically

### Get Field Keys from a Block

```typescript
import { getOutputKeys } from '../utils/outputSchema';

const keys = getOutputKeys(AuthBlock);
// Returns: ['name', 'email', 'token', 'isAuthenticated', 'timestamp']

// For union types, pass block configuration to resolve the correct type:
const keys = getOutputKeys(SelectableBoxBlock, { multiSelect: true });
// Returns: [] (array type has no nested keys)
```

### Check Output Type

```typescript
import {
  isScalarOutput,
  isArrayOutput,
  isObjectOutput
} from '../utils/outputSchema';

isScalarOutput(TextInputBlock);  // true
isArrayOutput(CheckboxBlock);    // true
isObjectOutput(AuthBlock);       // true
```

### Get Type Description

```typescript
import { getOutputDescription } from '../utils/outputSchema';

getOutputDescription(TextInputBlock);
// "Text value"

getOutputDescription(CheckboxBlock);
// "Array of string values"

getOutputDescription(AuthBlock);
// "Object with fields: name, email, token, isAuthenticated, timestamp"
```

### Validate Output Data

```typescript
import { validateOutput } from '../utils/outputSchema';

const error = validateOutput(value, blockDefinition);
if (error) {
  console.error('Invalid output:', error);
}

// For union types, pass block config to validate against the correct schema:
const error = validateOutput(
  ["option-1", "option-2"],
  SelectableBoxBlock,
  { multiSelect: true }
);
// null (valid)

const error2 = validateOutput(
  ["option-1"],
  SelectableBoxBlock,
  { multiSelect: false }
);
// "Expected string value, got object" (invalid - should be string, not array)
```

### Get TypeScript Type

```typescript
import { getTypeScriptType } from '../utils/outputSchema';

getTypeScriptType(AuthBlock);
// "{ name?: string; email?: string; token: string; isAuthenticated: boolean; timestamp: string }"

// For union types without config data:
getTypeScriptType(SelectableBoxBlock);
// "string | string[]"

// For union types with config data:
getTypeScriptType(SelectableBoxBlock, { multiSelect: true });
// "string[]"
```

## Using in Conditional Logic

When blocks output objects, you can reference nested fields in conditional expressions:

```typescript
// Auth block with fieldName "authResults" outputs an object
{
  fieldName: "authResults",
  outputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      isAuthenticated: { type: 'boolean' }
    }
  }
}

// In conditional logic, reference fields as:
visibleIf: "authResults.isAuthenticated == true"
visibleIf: "authResults.email contains '@example.com'"
```

## Using in Calculated Fields

Reference block outputs in calculated field formulas:

```typescript
// Text input returns a string
{
  fieldName: "quantity",
  outputSchema: { type: 'number' }
}

// Auth block returns an object
{
  fieldName: "authResults",
  outputSchema: {
    type: 'object',
    properties: {
      discountTier: { type: 'string' }
    }
  }
}

// Use in calculations:
formula: "quantity * 10"  // scalar value
formula: "authResults.discountTier == 'premium' ? quantity * 0.8 : quantity"  // object field
```

## Adding Output Schema to Custom Blocks

When creating custom blocks, add the `outputSchema` property to your BlockDefinition:

```typescript
export const MyCustomBlock: BlockDefinition = {
  type: "custom",
  name: "My Custom Block",
  description: "A custom block",
  // ... other required properties

  // Add output schema
  outputSchema: {
    type: 'object',
    properties: {
      customField1: { type: 'string' },
      customField2: { type: 'number' },
      metadata: {
        type: 'object',
        optional: true,
        description: 'Additional metadata'
      }
    }
  }
};
```

## Best Practices

1. **Always define outputSchema**: Makes your block self-documenting and enables better tooling
2. **Mark optional fields**: Use `optional: true` for fields that may not always be present
3. **Add descriptions**: Help other developers understand what each field represents
4. **Match actual output**: Ensure your block actually returns the declared schema
5. **Keep it simple**: Only include fields that are actually returned and used

## Example: Complete Block with Output Schema

```typescript
export const RatingBlock: BlockDefinition = {
  type: "rating",
  name: "Rating",
  description: "5-star rating input",
  icon: <Star className="w-4 h-4" />,
  defaultData: {
    type: "rating",
    fieldName: "rating",
    label: "Rate your experience",
    maxStars: 5
  },
  renderBlock: (props) => <RatingRenderer {...props} />,

  // Output schema: this block returns a number (1-5)
  outputSchema: {
    type: 'number'
  },

  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    return null;
  },
  validateValue: (value, data) => {
    if (data.required && !value) return "Rating is required";
    if (value < 1 || value > 5) return "Rating must be between 1 and 5";
    return null;
  }
};
```

## Migration Guide

If you have existing blocks without output schemas:

1. **Identify the output**: What does your block's `onChange` handler pass?
2. **Choose the type**: scalar, array, or object
3. **Add the schema**: Add the `outputSchema` property to your BlockDefinition
4. **Test**: Verify the schema matches actual output

Example migration:

```typescript
// Before
export const MyBlock: BlockDefinition = {
  type: "myblock",
  // ... properties
};

// After
export const MyBlock: BlockDefinition = {
  type: "myblock",
  // ... properties
  outputSchema: {
    type: 'string'  // or whatever your block returns
  }
};
```
