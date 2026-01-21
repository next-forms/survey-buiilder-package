import type { BlockData, LayoutProps, ThemeDefinition } from '../../../types';

/**
 * Voice state machine states
 */
export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'visual_input'
  | 'error'
  | 'complete';

/**
 * Voice layout mode - controls which screen is shown
 */
export type VoiceLayoutMode =
  | 'welcome'      // Initial welcome screen
  | 'ai_speaking'  // Full-screen orb mode - AI is speaking
  | 'user_input'   // Input collection mode - user provides answer
  | 'processing'   // Processing user response
  | 'complete';    // Survey finished

/**
 * Input mode determined by question classifier
 */
export type InputMode = 'voice' | 'visual' | 'hybrid';

/**
 * Voice command types
 */
export type VoiceCommandType = 'navigate' | 'repeat' | 'skip' | 'stop' | 'change';

/**
 * Voice command parsed from speech
 */
export interface VoiceCommand {
  type: VoiceCommandType;
  payload?: {
    direction?: 'back' | 'forward';
    fieldName?: string;
    [key: string]: unknown;
  };
}

/**
 * Message in the voice conversation history
 */
export interface VoiceMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  blockId?: string;
  blockType?: string;
  isLoading?: boolean;
  inputMode?: InputMode;
  userResponse?: {
    value: unknown;
    displayValue: string;
    isVoice: boolean;
  };
}

/**
 * Audio capture configuration
 */
export interface AudioCaptureConfig {
  sampleRate?: number; // Default: 16000 for Nova 2 Sonic
  channelCount?: number; // Default: 1 (mono)
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

/**
 * Audio playback configuration
 */
export interface AudioPlaybackConfig {
  sampleRate?: number;
  volume?: number;
  speed?: number;
}

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sessionId: string | null;
}

/**
 * Voice session configuration
 */
export interface VoiceSessionConfig {
  sessionId?: string;
  surveyId?: string;
  userId?: string;
  language?: string;
  useBrowserTTS?: boolean; // Use browser's Web Speech API for TTS
  useBrowserSTT?: boolean; // Use browser's SpeechRecognition for STT
}

/**
 * Question classification result
 */
export interface QuestionClassification {
  inputMode: InputMode;
  reason: string;
  voiceHints?: string[]; // Hints for voice input (e.g., expected option names)
}

/**
 * Props for the VoiceLayout component
 */
export interface VoiceLayoutProps extends LayoutProps {
  /**
   * Welcome message spoken when starting the survey
   * @default "Hi! Let's get started with your survey. I'll ask you some questions."
   */
  welcomeMessage?: string;

  /**
   * Message spoken when survey is complete
   * @default "Thank you for completing the survey!"
   */
  completionMessage?: string;

  /**
   * Whether to automatically start listening after speaking
   * @default true
   */
  autoListen?: boolean;

  /**
   * Silence timeout before processing speech (ms)
   * @default 2000
   */
  silenceTimeout?: number;

  /**
   * Maximum listening time (ms)
   * @default 15000
   */
  maxListenTime?: number;

  /**
   * Custom class for the container
   */
  containerClassName?: string;

  /**
   * Custom class for message history
   */
  messageHistoryClassName?: string;

  /**
   * Whether to show message history
   * @default true
   */
  showMessageHistory?: boolean;

  /**
   * Whether to show visual input controls even in voice mode
   * @default true
   */
  showVisualFallback?: boolean;

  /**
   * Voice orb animation style
   * @default 'pulse'
   */
  orbStyle?: 'pulse' | 'wave' | 'glow' | 'minimal';

  /**
   * Position of the voice orb
   * @default 'center'
   */
  orbPosition?: 'center' | 'bottom' | 'top';
}

/**
 * Custom data passed to VoiceLayout via SurveyForm
 */
export interface VoiceCustomData {
  welcomeMessage?: string;
  completionMessage?: string;
  autoListen?: boolean;
  silenceTimeout?: number;
  maxListenTime?: number;
  sessionConfig?: VoiceSessionConfig;
  onVoiceCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceState) => void;
}

/**
 * Voice state manager actions
 */
export type VoiceStateAction =
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'SPEECH_DETECTED' }
  | { type: 'SILENCE_DETECTED' }
  | { type: 'PROCESSING' }
  | { type: 'START_SPEAKING' }
  | { type: 'STOP_SPEAKING' }
  | { type: 'SWITCH_TO_VISUAL' }
  | { type: 'RETURN_TO_VOICE' }
  | { type: 'ERROR'; payload: string }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

/**
 * Voice state context
 */
export interface VoiceStateContext {
  state: VoiceState;
  previousState: VoiceState | null;
  errorMessage: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  currentInputMode: InputMode;
}

/**
 * Props for VoiceOrb component
 */
export interface VoiceOrbProps {
  state: VoiceState;
  theme?: ThemeDefinition;
  style?: 'pulse' | 'wave' | 'glow' | 'minimal' | 'breathe';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  onClick?: () => void;
  className?: string;
  /** Volume level for audio visualizer effect (0-1) */
  volume?: number;
  /** Render as div instead of button (use when inside another button) */
  asDiv?: boolean;
}

/**
 * Props for AnimatedText component
 */
export interface AnimatedTextProps {
  text: string;
  /** Speed in ms per character */
  speed?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Whether to highlight keywords */
  highlightKeywords?: boolean;
  className?: string;
}

/**
 * Props for OrbScreen component
 */
export interface OrbScreenProps {
  questionText: string;
  isSpeaking: boolean;
  voiceState: VoiceState;
  onSkip?: () => void;
  currentStep: number;
  totalSteps: number;
  theme?: ThemeDefinition;
  orbStyle?: 'pulse' | 'wave' | 'glow' | 'minimal' | 'breathe';
  volume?: number;
}

/**
 * Props for InputScreen component
 */
export interface InputScreenProps {
  block: BlockData;
  questionText: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit: (value: unknown) => void;
  onVoiceInput?: () => void;
  onBack?: () => void;
  currentStep: number;
  totalSteps: number;
  theme?: ThemeDefinition;
  disabled?: boolean;
  error?: string;
  isListening?: boolean;
  interimTranscript?: string;
}

/**
 * Props for AmbientProgress component
 */
export interface AmbientProgressProps {
  currentStep: number;
  totalSteps: number;
  theme?: ThemeDefinition;
  className?: string;
}

/**
 * Props for VisualInputWrapper component
 */
export interface VisualInputWrapperProps {
  block: BlockData;
  value?: unknown;
  onChange: (value: unknown) => void;
  onSubmit: (value: unknown) => void;
  theme?: ThemeDefinition;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Audio utilities types
 */
export interface AudioChunk {
  data: Float32Array | Int16Array;
  timestamp: number;
  sampleRate: number;
}

export interface PCMEncoderConfig {
  sampleRate: number;
  bitDepth: 16 | 32;
  channels: number;
}

/**
 * Voice answer validation types
 */
export interface VoiceValidationOption {
  id?: string;
  label: string;
  value: string;
}

export interface VoiceValidationRequest {
  transcript: string;
  options: VoiceValidationOption[];
  multiSelect: boolean;
  questionLabel?: string;
  blockType?: string;
  previousSelections?: string[];
  isConfirmation?: boolean;
}

export interface VoiceValidationResponse {
  success: boolean;
  isValid: boolean;
  matchedOptions: VoiceValidationOption[];
  matchedValues: string[];
  confidence: 'high' | 'medium' | 'low';
  needsConfirmation: boolean;
  confirmationMessage?: string;
  invalidReason?: string;
  suggestedAction?: 'confirm' | 'reask' | 'add_more' | 'submit' | 'finish_multiselect';
}

/**
 * Multi-select voice state
 */
export interface MultiSelectVoiceState {
  isActive: boolean;
  selectedValues: string[];
  selectedLabels: string[];
  awaitingConfirmation: boolean;
  awaitingMoreSelections: boolean;
}
