import type { JSX, ReactNode } from "react";

export type UUID = string;

export interface NavigationRule {
  condition: string;
  target: UUID | string;
  isPage?: boolean;
}

export interface ValidationRule {
  id?: string;
  field?: string;
  operator: string;
  value?: string | string[] | { type: 'variable' | 'literal'; value: string }[];
  message: string;
  severity?: 'error' | 'warning';
  dependencies?: string[];
  condition?: string;
}

export interface ContentBlockItemProps {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
  onRemove?: () => void;
}

export interface BlockDefinition {
  type: string;
  name: string;
  description: string;
  icon?: ReactNode;
  defaultData: BlockData;
  generateDefaultData?: () => BlockData;
  // Builder components
  renderItem?: (props: ContentBlockItemProps) => JSX.Element;
  renderFormFields?: (props: ContentBlockItemProps) => JSX.Element;
  renderPreview?: () => JSX.Element;
  // Renderer component - new unified approach
  renderBlock?: (props: BlockRendererProps) => JSX.Element | null;
  // Validation
  validate?: (data: BlockData) => string | null;
  validateValue?: (value: any, data: BlockData) => string | null;
}

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  uuid: UUID;
  icon?: ReactNode;
  defaultData: NodeData;
  renderNode: (props: {
    data: NodeData;
    onUpdate: (data: NodeData) => void;
    onRemove: () => void;
  }) => JSX.Element;
}

export type SurveyTheme =
  | "default"
  | "minimal"
  | "colorful"
  | "modern"
  | "corporate"
  | "dark"
  | "hims"
  | "custom";

export interface ThemeDefinition {
  name: SurveyTheme;
  containerLayout: string;
  header: string;
  title: string;
  description: string;
  background: string;
  card: string;
  field: {
    label: string;
    input: string;
    description: string;
    error: string;
    radio: string;
    checkbox: string;
    select: string;
    textarea: string;
    file: string;
    matrix: string;
    range: string;
    text: string;
    activeText: string;
    placeholder: string;
    boxBorder?: string;

    // Comprehensive SelectableBox styling properties
    selectableBox?: string;                    // Base container styling for the box
    selectableBoxDefault?: string;             // Default/unselected state styling
    selectableBoxSelected?: string;            // Selected state styling
    selectableBoxHover?: string;               // Hover state styling
    selectableBoxFocus?: string;               // Focus state styling
    selectableBoxDisabled?: string;            // Disabled state styling
    selectableBoxContainer?: string;           // Inner container styling
    selectableBoxText?: string;                // Text styling inside the box
    selectableBoxTextSelected?: string;        // Text styling when selected
    selectableBoxIndicator?: string;           // Selection indicator (checkmark) styling
    selectableBoxIndicatorIcon?: string;       // Icon styling within the indicator
  };
  container: {
    card: string;
    border: string;
    activeBorder: string;
    activeBg: string;
    header: string;
  };
  progress: {
    bar: string;
    dots: string;
    numbers: string;
    percentage: string;
    label: string;
  };
  button: {
    primary: string;
    secondary: string;
    text: string;
    navigation: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
    error: string;
    success: string;
  };
}

export interface GlobalCustomField {
  key: string;
  label: string;
  description?: string;
  component: React.ComponentType<{
    data: BlockData;
    onUpdate: (data: BlockData) => void;
    value?: any;
  }>;
  defaultValue?: any;
  showLabel?: boolean;
}

export interface SurveyBuilderState {
  rootNode: NodeData | null;
  definitions: {
    blocks: Record<string, BlockDefinition>;
    nodes: Record<string, NodeDefinition>;
  };
  localizations: LocalizationMap;
  theme: ThemeDefinition;
  selectedNode: UUID | null;
  displayMode: 'list' | 'graph' | 'flow' | 'lang' | 'theme';
  enableDebug?: boolean;
  globalCustomFields?: GlobalCustomField[];
}

export interface SurveyBuilderAction {
  type: string;
  payload?: any;
}

export interface SurveyFormRendererProps {
  survey: {
    rootNode: NodeData;
    localizations?: LocalizationMap;
    theme?: ThemeDefinition;
  };
  onSubmit?: (data: Record<string, any>) => void;
  onChange?: (data: Record<string, any>) => void;
  onPageChange?: (pageIndex: number, totalPages: number) => void;
  defaultValues?: Record<string, any>;
  language?: string;
  theme?: SurveyTheme;
  themeMode?: 'light' | 'dark' | 'system';
  progressBar?: ProgressBarOptions | boolean;
  navigationButtons?: NavigationButtonsOptions;
  autoScroll?: boolean;
  autoFocus?: boolean;
  showSummary?: boolean;
  submitText?: string;
  className?: string;
  // New properties for conditional features
  computedFields?: ComputedFieldsConfig;
  customValidators?: Record<string, CustomValidator>;
  debug?: boolean;
  enableDebug?: boolean;
  logo?: any;
  // Analytics configuration
  analytics?: {
    enabled?: boolean;
    sessionId?: string;
    userId?: string;
    surveyId?: string;
    googleAnalytics?: {
      measurementId: string;
      debug?: boolean;
    };
    googleTagManager?: {
      containerId: string;
      auth?: string;
      preview?: string;
      debug?: boolean;
    };
    trackFieldInteractions?: boolean;
    trackValidationErrors?: boolean;
    trackTimings?: boolean;
    customDimensions?: Record<string, any>;
  };
}



export interface ProgressBarOptions {
  type?: "bar" | "dots" | "numbers" | "percentage";
  showPercentage?: boolean;
  showStepInfo?: boolean;
  showStepTitles?: boolean;
  showStepNumbers?: boolean;
  position?: "top" | "bottom";
  color?: string;
  backgroundColor?: string;
  height?: number | string;
  animation?: boolean;
}

export interface NavigationButtonsOptions {
  showPrevious?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  previousText?: string;
  nextText?: string;
  submitText?: string;
  position?: "bottom" | "split";
  align?: "left" | "center" | "right";
  style?: "default" | "outlined" | "text";
}

export interface BlockRendererProps {
  block: BlockData;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  // Fixed: Use React.FC specifically instead of ComponentType
  customComponents?: Record<string, React.FC<BlockRendererProps>>;
  theme?: ThemeDefinition;
  // New props for conditional rendering
  isVisible?: boolean;
  customValidation?: (value: any) => string | null;
}

export interface PageRendererProps {
  page: Array<BlockData>;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  onBlur?: (field: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  customComponents?: Record<string, React.FC<BlockRendererProps>>;
  theme?: SurveyTheme;
}

export interface SurveyFormContextProps {
  values: Record<string, any>;
  setValue: (field: string, value: any) => void;
  errors: Record<string, string>;
  setError: (field: string, error: string | null) => void;
  currentPage: number;
  currentBlockIndex: number;
  totalPages: number;
  goToPage: (pageIndex: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToNextBlock: (fValue? : Record<string, any>) => void;
  goToPreviousBlock: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  submit: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: ThemeDefinition;
  surveyData: {
    rootNode: NodeData;
    localizations?: LocalizationMap;
  };
  // New props for conditional features
  conditionalErrors: Record<string, string>;
  computedValues: Record<string, any>;
  updateComputedValues: () => void;
  evaluateCondition: (condition: string, contextData?: Record<string, any>) => boolean;
  getNextPageIndex: () => number | null;
  getVisibleBlocks: (blocks: BlockData[]) => BlockData[];
  validateField: (fieldName: string, value: any) => string | null;
  enableDebug?: boolean;
  logo?: any;
  analytics?: {
    surveyId?: string;
    sessionId?: string;
    userId?: string;
    trackFieldInteractions?: boolean;
    trackValidationErrors?: boolean;
    trackTimings?: boolean;
  };
}

// New interfaces for conditional branching and validation

export interface CustomValidator {
  validate: (value: any, formValues: Record<string, any>) => string | null;
  validateAsync?: (value: any, formValues: Record<string, any>) => Promise<string | null>;
  dependencies?: string[]; // List of field names this validator depends on
}

export interface ComputedFieldsConfig {
  [fieldName: string]: {
    formula: string;
    dependencies: string[];
    format?: (value: any) => any;
  };
}

export interface ConditionalBlockProps extends BlockRendererProps {
  condition: string;
  contextData?: Record<string, any>;
}

export interface CalculatedFieldProps extends BlockRendererProps {
  formula: string;
  dependencies: string[];
  format?: (value: any) => any;
}

export type ConditionOperator =
  | '==' | '!=' | '>' | '>=' | '<' | '<='
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'matches'
  | 'empty' | 'notEmpty' | 'isEmpty' | 'isNotEmpty'
  | 'between' | 'notBetween'
  | 'in' | 'notIn' | 'containsAny' | 'containsAll' | 'containsNone';

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: any;
  type?: 'string' | 'number' | 'boolean' | 'date';
}

export interface BranchingLogic {
  condition: string | ConditionRule | ConditionRule[];
  targetPage?: number | 'next' | 'prev' | 'submit';
  targetField?: string;
  message?: string;
}

export interface NavigationRule {
  condition: string;
  target: string;
  isPage?: boolean;
  isDefault?: boolean;
}

export interface CalculationRule {
  formula: string;
  targetField: string;
  dependencies: string[];
  runOn?: 'change' | 'blur' | 'submit' | 'pageChange';
}

export interface CurrentValues {
  [key: string]: string | number | boolean;
}

export interface EvaluationResult {
  matched: boolean;
  target: string | null;
  isPage: boolean | null;
  error?: any;
}

export interface MobileNavigationConfig {
    enableSwipeNavigation?: boolean;
    enableDoubleTapToGoBack?: boolean;
    showMobileBackButton?: boolean;
    preventBrowserBack?: boolean;
    swipeThreshold?: number; // Minimum distance for swipe gesture
}

export interface SwipeDirection {
    direction: 'left' | 'right' | 'up' | 'down' | null;
    distance: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}


export interface BlockData {
  type: string;
  name?: string;
  label?: string;
  description?: string;
  fieldName?: string;
  placeholder?: string;
  text?: string;
  html?: string;
  items?: Array<BlockData>;
  labels?: Array<string>;
  values?: Array<string | number | boolean>;
  defaultValue?: any;
  className?: string;
  showResults?: boolean;
  navigationRules?: NavigationRule[];
  validationRules?: ValidationRule[];
  visibleIf?: any;
  isEndBlock?: boolean;
  /** If true, automatically continue to the next step when an option is selected */
  autoContinueOnSelect?: boolean;
  /** Whether to show the continue button for this block/page */
  showContinueButton?: boolean;
  [key: string]: any;
}

export interface NodeData {
  uuid?: UUID;
  name?: string;
  type: string;
  items?: Array<BlockData>;
  nodes?: Array<NodeData | UUID>;
  navigationLogic?: string;
  entryLogic?: string;
  exitLogic?: string;
  backLogic?: string;
  [key: string]: any;
}

export interface LocalizationMap {
  [key: string]: {
    [key: string]: string;
  };
}