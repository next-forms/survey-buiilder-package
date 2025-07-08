import { SurveyForm } from './renderer/SurveyForm';
import { SurveyFormProvider, useSurveyForm } from './context/SurveyFormContext';
import { BlockRenderer } from './renderer/renderers/BlockRenderer';
import { TextInputRenderer } from './renderer/renderers/TextInputRenderer';
import { TextareaRenderer } from './renderer/renderers/TextareaRenderer';
import { RadioRenderer } from './renderer/renderers/RadioRenderer';
import { CheckboxRenderer } from './renderer/renderers/CheckboxRenderer';
import { SelectRenderer } from './renderer/renderers/SelectRenderer';
import { MarkdownRenderer } from './renderer/renderers/MarkdownRenderer';
import { HtmlRenderer } from './renderer/renderers/HtmlRenderer';
import { RangeRenderer } from './renderer/renderers/RangeRenderer';
import { DatePickerRenderer } from './renderer/renderers/DatePickerRenderer';
import { FileUploadRenderer } from './renderer/renderers/FileUploadRenderer';
import { MatrixRenderer } from './renderer/renderers/MatrixRenderer';
import { SelectableBoxRenderer } from './renderer/renderers/SelectableBoxRenderer';
import { ScriptRenderer } from './renderer/renderers/ScriptRenderer';
import { SetRenderer } from './renderer/renderers/SetRenderer';
import { AuthRenderer } from './renderer/renderers/AuthRenderer';
import { DebugInfo } from './components/ui/DebugInfo';

// New conditional components
import { ConditionalBlockRenderer } from './renderer/renderers/ConditionalBlockRenderer';
import { CalculatedFieldRenderer } from './renderer/renderers/CalculatedFieldRenderer';
import { BMICalculatorRenderer } from './renderer/renderers/BMICalculatorRenderer';
import { CheckoutRenderer } from './renderer/renderers/CheckoutRenderer';
import { ValidationSummary } from './components/ui/ValidationSummary';

// Utility functions
import {
  evaluateCondition,
  evaluateSimpleCondition,
  isBlockVisible,
  executeCalculation,
  calculateBMI
} from './utils/conditionalUtils';

import {
  evaluateLogic,
  getSurveyPages,
  getSurveyPageIds,
  getLocalized,
  getThemeClass,
  formatFieldName
} from './utils/surveyUtils';

import {
  blockTypeMap,
  validateBlock,
  isContentBlock,
  isInputBlock,
  supportsConditionalRendering,
  supportsBranchingLogic
} from './utils/blockAdapter';
import { SurveyBuilder } from './builder/survey/SurveyBuilder';

export { applyDynamicColors } from './utils/colorUtils';

// Themes
export {
  themes,
  defaultTheme,
  minimalTheme,
  colorfulTheme,
  modernTheme,
  corporateTheme,
  darkTheme,
  himsTheme,
} from './themes';

export {
  // Main components
  SurveyForm,
  SurveyFormProvider,
  useSurveyForm,

  // Block renderers
  BlockRenderer,
  TextInputRenderer,
  TextareaRenderer,
  RadioRenderer,
  CheckboxRenderer,
  SelectRenderer,
  MarkdownRenderer,
  HtmlRenderer,
  RangeRenderer,
  DatePickerRenderer,
  FileUploadRenderer,
  MatrixRenderer,
  SelectableBoxRenderer,
  ScriptRenderer,
  SetRenderer,
  AuthRenderer,

  // UI components
  DebugInfo,

  // New conditional components
  ConditionalBlockRenderer,
  CalculatedFieldRenderer,
  BMICalculatorRenderer,
  CheckoutRenderer,
  ValidationSummary,

  // Utility functions
  evaluateLogic,
  getSurveyPages,
  getLocalized,
  getThemeClass,
  formatFieldName,
  blockTypeMap,
  validateBlock,
  isContentBlock,
  isInputBlock,

  // Conditional utility functions
  evaluateCondition,
  evaluateSimpleCondition,
  isBlockVisible,
  executeCalculation,
  calculateBMI,
  supportsConditionalRendering,
  supportsBranchingLogic,
  getSurveyPageIds
};

// Export public types
export * from './types';

export * from "./builder/survey/SurveyBuilder";

// Export context and hooks
export {
  SurveyBuilderProvider,
  useSurveyBuilder,
  ActionTypes
} from './context/SurveyBuilderContext';

// Export standard blocks
export * from './builder/blocks';

// Export node definitions
export * from './builder/nodes';

// Export utility functions
export * from './utils/nodeUtils';

export default SurveyForm;