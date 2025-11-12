# Block Output Schema - Quick Start Guide

Output schemas declare what data structure your block returns. This 2-minute guide will get you started.

## Why Use Output Schemas?

- **Know what data to expect** from each block
- **Reference nested fields** in conditional logic (e.g., `authResults.email`)
- **Build calculated fields** using block outputs
- **Self-documenting code** - others understand your block instantly

## Three Simple Types

### 1. Scalar (Single Value)

For blocks that return a single value:

```typescript
outputSchema: {
  type: 'string'  // or 'number', 'boolean', 'date'
}
```

**Examples:**
- TextInput → `type: 'string'`
- Range slider → `type: 'number'`
- DatePicker → `type: 'date'`

### 2. Array (List of Values)

For blocks that return multiple selections:

```typescript
outputSchema: {
  type: 'array',
  items: {
    type: 'string'  // type of each item
  }
}
```

**Example:** Checkbox block returning `["option-1", "option-3"]`

### 3. Object (Complex Data)

For blocks that return multiple fields:

```typescript
outputSchema: {
  type: 'object',
  properties: {
    fieldName: {
      type: 'string' | 'number' | 'boolean' | 'date',
      optional?: boolean,
      description?: string
    }
  }
}
```

**Example:** Auth block returning:
```typescript
{
  email: "user@example.com",
  token: "jwt_token_here",
  isAuthenticated: true
}
```

## Adding to Your Block

Simply add the `outputSchema` property to your BlockDefinition:

```typescript
export const MyBlock: BlockDefinition = {
  type: "myblock",
  name: "My Block",
  // ... other properties ...

  // Add this:
  outputSchema: {
    type: 'string'  // or whatever your block returns
  }
};
```

## Real Examples

### Simple Text Input
```typescript
outputSchema: {
  type: 'string'
}
// Returns: "John Doe"
```

### Multi-Select Checkbox
```typescript
outputSchema: {
  type: 'array',
  items: { type: 'string' }
}
// Returns: ["option-1", "option-2"]
```

### Authentication Block
```typescript
outputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string', description: 'User email' },
    token: { type: 'string', description: 'Auth token' },
    isAuthenticated: { type: 'boolean' }
  }
}
// Returns: { email: "user@example.com", token: "...", isAuthenticated: true }
```

### BMI Calculator
```typescript
outputSchema: {
  type: 'object',
  properties: {
    bmi: { type: 'number', description: 'Calculated BMI' },
    category: { type: 'string', description: 'BMI category' },
    weight: { type: 'number' },
    height: { type: 'number' }
  }
}
// Returns: { bmi: 24.2, category: "Normal", weight: 70, height: 170 }
```

## Using Output Data in Conditional Logic

Once you've declared an output schema, you can reference fields in conditions:

```typescript
// Auth block outputs: { email, token, isAuthenticated }
// You can now use:
visibleIf: "authResults.isAuthenticated == true"
visibleIf: "authResults.email contains '@company.com'"

// BMI block outputs: { bmi, category }
// You can use:
visibleIf: "bmiResult.category == 'Obese'"
visibleIf: "bmiResult.bmi > 30"
```

## Common Patterns

| Block Type | Returns | Schema Type |
|------------|---------|-------------|
| Text input, Textarea, Select, Radio | Single value | `scalar` |
| Checkbox (multi-select) | Array of values | `array` |
| Auth, BMI, Checkout | Multiple fields | `object` |
| File upload | File URL/path | `string` |
| Signature | Base64 image | `string` |
| Matrix | Question → Answer map | `object` |
| Date picker | ISO date string | `date` |
| Range slider | Numeric value | `number` |

## Union Types (Multiple Possible Outputs)

Some blocks return different types based on configuration. Use union types (oneOf) to declare all possibilities:

```typescript
outputSchema: {
  oneOf: [
    { type: 'string' },
    { type: 'array', items: { type: 'string' } }
  ],
  discriminator: {
    propertyName: 'multiSelect',  // Config field that determines the type
    mapping: {
      'false': 0,  // When multiSelect is false, use index 0 (string)
      'true': 1    // When multiSelect is true, use index 1 (array)
    }
  }
}
```

**Example: SelectableBoxQuestionBlock**
- Single select mode (`multiSelect: false`) → returns `string`
- Multi-select mode (`multiSelect: true`) → returns `string[]`

The system will automatically resolve to the correct type based on block configuration!

## Tips

1. **Be accurate**: Match what your block actually returns
2. **Mark optionals**: Use `optional: true` for fields that might not exist
3. **Add descriptions**: Help others understand your fields
4. **Keep it simple**: Don't over-complicate - just describe the shape
5. **For conditional types**: Declare the more complex type and document the variation

## Need More?

For detailed examples, utilities, and advanced usage, see the full [OUTPUT_SCHEMA.md](./OUTPUT_SCHEMA.md) documentation.

## Quick Reference

```typescript
// Scalar
{ type: 'string' | 'number' | 'boolean' | 'date' }

// Array
{ type: 'array', items: { type: 'string' | 'number' | 'boolean' } }

// Object
{
  type: 'object',
  properties: {
    field1: { type: 'string', optional?: boolean, description?: string },
    field2: { type: 'number' }
  }
}
```

That's it! You're ready to add output schemas to your blocks. 🎉
