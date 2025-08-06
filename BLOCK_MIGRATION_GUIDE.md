# Block Migration Guide

## Overview
This guide explains how to migrate existing separate builder blocks and renderers to the new unified block system.

## Benefits of Unified Blocks
- **Single source of truth**: One file defines both builder and renderer behavior
- **Easier maintenance**: Changes only need to be made in one place
- **Better type safety**: Shared interfaces ensure consistency
- **Simplified extension**: Custom blocks only need one implementation
- **Validation consolidation**: Both config and value validation in one place

## Migration Steps

### 1. Create New Unified Block File
Create a new file in `src/blocks/[BlockName].tsx` that combines both builder and renderer functionality.

### 2. Structure Template
```tsx
import React, { forwardRef } from "react";
import type { BlockDefinition, ContentBlockItemProps, BlockRendererProps } from "../types";

// ============= BUILDER COMPONENTS =============
const [BlockName]BlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate }) => {
  // Configuration form for the builder
};

const [BlockName]BlockItem: React.FC<ContentBlockItemProps> = ({ data }) => {
  // Preview in builder's survey view
};

const [BlockName]BlockPreview: React.FC = () => {
  // Preview in block library
};

// ============= RENDERER COMPONENT =============
const [BlockName]Renderer = forwardRef<HTMLElement, BlockRendererProps>(
  ({ block, value, onChange, onBlur, error, disabled, theme }, ref) => {
    // End-user survey renderer
  }
);

// ============= UNIFIED BLOCK DEFINITION =============
export const [BlockName]Block: BlockDefinition = {
  type: "[block-type]",
  name: "[Display Name]",
  description: "[Description]",
  icon: <IconComponent />,
  defaultData: { /* ... */ },
  generateDefaultData: () => ({ /* ... */ }),
  
  // Builder methods
  renderItem: (props) => <[BlockName]BlockItem {...props} />,
  renderFormFields: (props) => <[BlockName]BlockForm {...props} />,
  renderPreview: () => <[BlockName]BlockPreview />,
  
  // Renderer method - NEW
  renderBlock: (props) => <[BlockName]Renderer {...props} />,
  
  // Validation methods
  validate: (data) => { /* validate block configuration */ },
  validateValue: (value, data) => { /* validate user input */ },
};
```

### 3. Register the Block
Add your block to `src/blocks/index.ts`:
```tsx
import { [BlockName]Block } from "./[BlockName]Block";

export const blockRegistry: Record<string, BlockDefinition> = {
  [block-type]: [BlockName]Block,
  // ... other blocks
};

export { [BlockName]Block };
```

### 4. Update Builder Imports
Update `src/builder/blocks/unifiedIndex.ts` to import from the unified location:
```tsx
import { [BlockName]Block } from "../../blocks";
```

### 5. Remove Legacy Files
Once testing confirms the unified block works:
- Remove `src/builder/blocks/[BlockName]Block.tsx`
- Remove `src/renderer/renderers/[BlockName]Renderer.tsx`
- Remove legacy imports from `BlockRenderer.tsx`

## Migration Status

### ✅ Completed
- TextInputBlock (`textfield`)
- TextareaBlock (`textarea`)

### 🔄 To Migrate
- RadioBlock (`radio`)
- CheckboxBlock (`checkbox`)
- SelectBlock (`select`)
- RangeBlock (`range`)
- DatePickerBlock (`datepicker`)
- FileUploadBlock (`fileupload`)
- MatrixBlock (`matrix`)
- SelectableBoxQuestionBlock (`selectablebox`)
- MarkdownBlock (`markdown`)
- HtmlBlock (`html`)
- ScriptBlock (`script`)
- AuthBlock (`auth`)
- BMICalculatorBlock (`bmiCalculator`)
- CalculatedFieldBlock (`calculated`)
- ConditionalBlock (`conditional`)
- CheckoutBlock (`checkout`)

## Testing Checklist
After migrating a block:
- [ ] Builder: Block appears in library with correct icon and preview
- [ ] Builder: Configuration form updates block data correctly
- [ ] Builder: Block preview in survey shows correctly
- [ ] Renderer: Block renders with correct styling and theme
- [ ] Renderer: Value changes are captured correctly
- [ ] Renderer: Validation errors display properly
- [ ] Renderer: Disabled state works
- [ ] Both: All props and features from original implementations work

## Common Pitfalls
1. **Ref types**: Different HTML elements need different ref types (HTMLInputElement, HTMLTextAreaElement, etc.)
2. **Theme imports**: Ensure `themes` is imported from the correct location
3. **Field name generation**: Use the existing `generateFieldName` utility
4. **Validation**: Remember to implement both `validate` (config) and `validateValue` (user input)

## Example Migration PR
See the migration of TextInputBlock and TextareaBlock as reference implementations.