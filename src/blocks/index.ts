import type { BlockDefinition } from "../types";
import { AgreementBlock } from "./AgreementBlock";
import { TextInputBlock } from "./TextInputBlock";
import { TextareaBlock } from "./TextareaBlock";
import { AuthBlock } from "./AuthBlock";
import { RadioBlock } from "./RadioBlock";
import { CheckboxBlock } from "./CheckboxBlock";
import { SelectBlock } from "./SelectBlock";
import { BMICalculatorBlock } from "./BMICalculatorBlock";
import { CalculatedFieldBlock } from "./CalculatedFieldBlock";
// import { CheckoutBlock } from "./CheckoutBlock";
import { ConditionalBlock } from "./ConditionalBlock";
import { DatePickerBlock } from "./DatePickerBlock";
import { FileUploadBlock } from "./FileUploadBlock";
import { HtmlBlock } from "./HtmlBlock";
import { MarkdownBlock } from "./MarkdownBlock";
import { MatrixBlock } from "./MatrixBlock";
import { RangeBlock } from "./RangeBlock";
import { ScriptBlock } from "./ScriptBlock";
import { SelectableBoxQuestionBlock } from "./SelectableBoxQuestionBlock";
// import { PatientBlock } from "./PatientBlock";

// Registry of all block definitions
export const blockRegistry: Record<string, BlockDefinition> = {
  // patientAuth: PatientBlock,
  agreement: AgreementBlock,
  textfield: TextInputBlock,
  textarea: TextareaBlock,
  auth: AuthBlock,
  radio: RadioBlock,
  checkbox: CheckboxBlock,
  select: SelectBlock,
  bmiCalculator: BMICalculatorBlock,
  calculated: CalculatedFieldBlock,
  // checkout: CheckoutBlock,
  conditional: ConditionalBlock,
  datepicker: DatePickerBlock,
  fileupload: FileUploadBlock,
  html: HtmlBlock,
  markdown: MarkdownBlock,
  matrix: MatrixBlock,
  range: RangeBlock,
  script: ScriptBlock,
  selectablebox: SelectableBoxQuestionBlock,
};

// Export all standard block definitions - ALL NOW UNIFIED
export const StandardBlocks: BlockDefinition[] = [
  // Basic input blocks
  // PatientBlock,
  AgreementBlock,
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
  // CheckoutBlock,
];

// Export individual blocks for direct import
export { 
  // PatientBlock,
  AgreementBlock,
  TextInputBlock, 
  TextareaBlock, 
  AuthBlock,
  RadioBlock,
  CheckboxBlock,
  SelectBlock,
  BMICalculatorBlock,
  CalculatedFieldBlock,
  // CheckoutBlock,
  ConditionalBlock,
  DatePickerBlock,
  FileUploadBlock,
  HtmlBlock,
  MarkdownBlock,
  MatrixBlock,
  RangeBlock,
  ScriptBlock,
  SelectableBoxQuestionBlock
};

// Helper function to get a block definition by type
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockRegistry[type];
}

// Helper function to get all block definitions
export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(blockRegistry);
}

// Helper function to register a custom block
export function registerBlock(block: BlockDefinition): void {
  blockRegistry[block.type] = block;
}

// Helper function to unregister a block
export function unregisterBlock(type: string): void {
  delete blockRegistry[type];
}