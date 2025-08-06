// Unified block imports - ALL blocks now come from the new unified blocks directory
import { 
  TextInputBlock, 
  TextareaBlock, 
  AuthBlock,
  RadioBlock,
  CheckboxBlock,
  SelectBlock,
  BMICalculatorBlock,
  CalculatedFieldBlock,
  CheckoutBlock,
  ConditionalBlock,
  DatePickerBlock,
  FileUploadBlock,
  HtmlBlock,
  MarkdownBlock,
  MatrixBlock,
  RangeBlock,
  ScriptBlock,
  SelectableBoxQuestionBlock
} from "../../blocks";

import type { BlockDefinition } from "../../types";

// Export all standard block definitions - ALL NOW UNIFIED
export const StandardBlocks: BlockDefinition[] = [
  // Basic input blocks
  SelectableBoxQuestionBlock,
  TextInputBlock,
  TextareaBlock,
  SelectBlock,
  RadioBlock,
  CheckboxBlock,

  // Advanced input blocks
  RangeBlock,
  DatePickerBlock,
  FileUploadBlock,
  MatrixBlock,
  
  // Content blocks
  MarkdownBlock,
  HtmlBlock,

  // Logic blocks
  AuthBlock,
  ScriptBlock,

  // Advanced calculation and conditional blocks
  BMICalculatorBlock,
  CalculatedFieldBlock,
  ConditionalBlock,
  CheckoutBlock,
];

// Export individual blocks for direct imports - ALL NOW UNIFIED
export {
  TextInputBlock,
  TextareaBlock,
  SelectableBoxQuestionBlock,
  RadioBlock,
  CheckboxBlock,
  MarkdownBlock,
  HtmlBlock,
  ScriptBlock,
  AuthBlock,
  SelectBlock,
  RangeBlock,
  DatePickerBlock,
  FileUploadBlock,
  MatrixBlock,
  BMICalculatorBlock,
  CalculatedFieldBlock,
  ConditionalBlock,
  CheckoutBlock,
};