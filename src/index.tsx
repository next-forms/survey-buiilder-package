import { SurveyForm } from './renderer/SurveyForm';
import { SurveyFormProvider, useSurveyForm } from './context/SurveyFormContext';
import { DebugInfo } from './components/ui/DebugInfo';

// New conditional components
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
  formatFieldName,
  detectSurveyMode
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

// Font loader utilities
export {
  loadFonts,
  unloadFonts,
  useFontLoader,
  getFontCSSProperties,
  getFontFamilyWithFallback,
  normalizeFontFamily
} from './utils/fontLoader';

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

  // UI components
  DebugInfo,

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
  getSurveyPageIds,
  detectSurveyMode
};

// Export public types
export * from './types';

// Export unified block system
export {
  blockRegistry,
  getBlockDefinition,
  getAllBlockDefinitions,
  registerBlock,
  unregisterBlock,
  // Export all unified blocks
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
} from './blocks';

// Export layout system
export {
  layoutRegistry,
  getLayoutDefinition,
  getAllLayoutDefinitions,
  registerLayout,
  unregisterLayout,
  getLayoutComponent,
  RenderPageSurveyLayout,
  // Layout helpers for easier custom layout creation
  CurrentBlock,
  NavigationButtons,
  ProgressIndicator,
  createLayout
} from './renderer/layouts';

export * from "./builder/survey/SurveyBuilder";

// Export context and hooks
export {
  SurveyBuilderProvider,
  useSurveyBuilder,
  ActionTypes
} from './context/SurveyBuilderContext';

// Export standard blocks - using unified blocks where available
// For now, we'll export from the unifiedIndex which combines both unified and legacy blocks
export * from './blocks/';

// Export node definitions
export * from './builder/nodes';

// Export utility functions
export * from './utils/nodeUtils';

// Export flow history hook
export { useFlowHistory } from './builder/flow/useFlowHistory';
export type { FlowHistoryState, FlowHistoryEntry, FlowHistory, UseFlowHistoryReturn } from './builder/flow/useFlowHistory';

// Export FlowV2 builder for pageless mode
export { FlowV2Builder } from './builder/flowv2/FlowV2Builder';
export * from './builder/flowv2/types';

// Export global custom fields components
export { GlobalCustomFields } from './builder/common/GlobalCustomFields';
export { ReferenceQuestionKeyField } from './examples/ReferenceQuestionKeyField';
export { SimpleCustomField } from './examples/SimpleCustomField';

export default SurveyForm;