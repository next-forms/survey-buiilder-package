# Unified Block System Overview

## What Changed

The survey form package has been completely refactored from a **separated builder/renderer system** to a **unified block architecture**.

### Before (Legacy System)
```
src/
├── builder/
│   └── blocks/
│       ├── TextInputBlock.tsx      # Builder component
│       ├── RadioBlock.tsx          # Builder component
│       └── ...
└── renderer/
    └── renderers/
        ├── TextInputRenderer.tsx   # Renderer component
        ├── RadioRenderer.tsx       # Renderer component
        └── ...
```

### After (Unified System)
```
src/
└── blocks/
    ├── TextInputBlock.tsx          # Complete unified block
    ├── RadioBlock.tsx              # Complete unified block
    └── ...
```

## Architecture

Each unified block contains:

1. **Builder Components** - For the visual editor
2. **Renderer Component** - For end-user surveys  
3. **Validation Methods** - For both config and user input
4. **Block Definition** - Single source of truth

## Key Components

### BlockDefinition Interface
```typescript
interface BlockDefinition {
  type: string;
  name: string;
  description: string;
  icon?: ReactNode;
  defaultData: BlockData;
  
  // Builder methods
  renderItem?: (props: ContentBlockItemProps) => JSX.Element;
  renderFormFields?: (props: ContentBlockItemProps) => JSX.Element;
  renderPreview?: () => JSX.Element;
  
  // Renderer method - NEW
  renderBlock?: (props: BlockRendererProps) => JSX.Element | null;
  
  // Validation
  validate?: (data: BlockData) => string | null;
  validateValue?: (value: any, data: BlockData) => string | null;
}
```

### Block Registry
```typescript
// Global registry for all blocks
export const blockRegistry: Record<string, BlockDefinition> = {
  textfield: TextInputBlock,
  textarea: TextareaBlock,
  radio: RadioBlock,
  // ... all 18 blocks
};

// Helper functions
export function registerBlock(block: BlockDefinition): void;
export function getBlockDefinition(type: string): BlockDefinition | undefined;
export function unregisterBlock(type: string): void;
```

### BlockRenderer Logic
```typescript
// Unified renderer checks registry first
const blockDefinition = getBlockDefinition(block.type);
if (blockDefinition?.renderBlock) {
  return blockDefinition.renderBlock(props);
}

// Falls back to legacy renderers for unmigrated blocks
```

## Benefits

### 1. Single Source of Truth
- One file defines complete block behavior
- No more sync issues between builder and renderer
- Easier to understand and modify

### 2. Simplified Maintenance  
- Changes in one place affect both builder and renderer
- Less code duplication
- Consistent behavior guaranteed

### 3. Better Developer Experience
- Easier to create custom blocks
- Single registration process
- Type safety across all components

### 4. Enhanced Extensibility
- `registerBlock()` for custom blocks
- Works in both builder and renderer automatically
- No need to modify core files

## Migration Status

✅ **All 18 core blocks migrated:**

1. TextInputBlock (`textfield`)
2. TextareaBlock (`textarea`)  
3. RadioBlock (`radio`)
4. CheckboxBlock (`checkbox`)
5. SelectBlock (`select`)
6. RangeBlock (`range`)
7. DatePickerBlock (`datepicker`)
8. FileUploadBlock (`fileupload`)
9. MatrixBlock (`matrix`)
10. SelectableBoxQuestionBlock (`selectablebox`)
11. MarkdownBlock (`markdown`)
12. HtmlBlock (`html`)
13. ScriptBlock (`script`)
14. AuthBlock (`auth`)
15. BMICalculatorBlock (`bmiCalculator`)
16. CalculatedFieldBlock (`calculated`)
17. ConditionalBlock (`conditional`)
18. CheckoutBlock (`checkout`)

## Usage Examples

### Creating a Custom Block
```typescript
import { registerBlock } from 'survey-form-package';

const MyBlock: BlockDefinition = {
  type: 'my-block',
  name: 'My Custom Block',
  // ... builder methods
  renderBlock: ({ block, value, onChange }) => (
    <div>Custom renderer</div>
  ),
};

// Register globally
registerBlock(MyBlock);
```

### Using in Builder
```typescript
<SurveyBuilder
  blockDefinitions={[...StandardBlocks, MyBlock]}
/>
```

### Automatic Renderer Support
```typescript
<SurveyForm survey={surveyData} />
// Custom blocks automatically work!
```

## File Structure

```
src/packages/survey-form-package/
├── src/
│   ├── blocks/                          # NEW - Unified blocks
│   │   ├── index.ts                     # Block registry
│   │   ├── TextInputBlock.tsx           # Complete text input
│   │   ├── RadioBlock.tsx               # Complete radio
│   │   └── ...                          # All 18 blocks
│   ├── builder/
│   │   └── blocks/
│   │       ├── unifiedIndex.ts          # Imports from ../blocks
│   │       └── [legacy files remain]    # Not removed yet
│   └── renderer/
│       └── renderers/
│           ├── BlockRenderer.tsx         # Updated to use registry
│           └── [legacy files remain]    # Not removed yet
├── CUSTOM_BLOCKS_GUIDE.md               # NEW - Custom block docs
├── UNIFIED_BLOCKS_OVERVIEW.md           # NEW - This file
└── BLOCK_MIGRATION_GUIDE.md             # Updated - Migration status
```

## Backwards Compatibility

- ✅ Existing surveys continue to work
- ✅ Legacy block files remain (not removed)
- ✅ BlockRenderer falls back to legacy for unmigrated blocks
- ✅ All APIs remain unchanged

## Performance

- ✅ No performance impact
- ✅ Blocks load on-demand
- ✅ Registry lookup is O(1)
- ✅ No extra re-renders

## Testing

All blocks have been tested for:
- ✅ Builder functionality (preview, config, library)  
- ✅ Renderer functionality (display, input, validation)
- ✅ Type safety
- ✅ Error handling
- ✅ Theme support

## Next Steps

1. **Custom Blocks**: Use the new system for all custom blocks
2. **Documentation**: Reference the comprehensive guides
3. **Legacy Cleanup**: Eventually remove old builder/renderer files (optional)
4. **Extensions**: Build advanced blocks using the unified system

## Resources

- 📖 [Custom Blocks Guide](./CUSTOM_BLOCKS_GUIDE.md)
- 📖 [Block Migration Guide](./BLOCK_MIGRATION_GUIDE.md)  
- 📖 [README](../../../README.md)
- 💻 [Example: Credit Card Block](../../../src/app/builder/page.tsx)