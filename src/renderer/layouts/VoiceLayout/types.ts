import type { BlockData, LayoutProps, ThemeDefinition } from '../../../types';
import type { AIHandler } from '../ChatLayout/types';

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
  | 'complete'
  | 'loading'; // Loading state for API calls (distinct from processing user input)

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
 * Custom data passed to VoiceLayout via SurveyForm.
 * All handlers are optional - if not provided, defaults will be used or
 * features requiring backend will be disabled gracefully.
 */
export interface VoiceCustomData {
  // Messages
  welcomeMessage?: string;
  completionMessage?: string;

  // Behavior options
  autoListen?: boolean;
  silenceTimeout?: number;
  maxListenTime?: number;
  typingDelay?: number;
  orbStyle?: 'pulse' | 'wave' | 'glow' | 'minimal' | 'breathe';

  // Session configuration
  sessionConfig?: VoiceSessionConfig;

  // Event callbacks
  onVoiceCommand?: (command: VoiceCommand) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onStateChange?: (state: VoiceState) => void;

  /**
   * Custom AI handler for generating conversational questions.
   * If not provided, the block's label/name will be used as-is.
   */
  aiHandler?: AIHandler;

  /**
   * Custom voice validation handler for matching voice input to options.
   * If not provided, basic local matching will be used (no AI validation).
   */
  validationHandler?: VoiceValidationHandler;

  /**
   * Custom session initialization handler.
   * If not provided, session tracking will be skipped (voice still works).
   */
  sessionInitHandler?: VoiceSessionInitHandler;

  /**
   * Custom session end handler.
   * If not provided, session end will be skipped.
   */
  sessionEndHandler?: VoiceSessionEndHandler;

  /**
   * Custom TTS (Text-to-Speech) handler.
   * If provided, this will be used instead of browser's Web Speech Synthesis.
   * Use this for cloud-based TTS like AWS Polly for better quality and cross-browser support.
   */
  ttsHandler?: TTSHandler;

  /**
   * Custom STT (Speech-to-Text) streaming session factory.
   * If provided, this will be used instead of browser's SpeechRecognition.
   * Use this for cloud-based STT like AWS Transcribe for better accuracy and cross-browser support.
   */
  sttSessionFactory?: STTStreamingSessionFactory;

  /**
   * Custom media capture factory for recording audio from the microphone.
   * If provided, this will be used instead of the built-in Web Audio API implementation.
   * Use this for better cross-platform support (especially iOS) with libraries like react-media-recorder.
   *
   * The factory should return audio as PCM Int16 ArrayBuffer chunks that will be sent to the STT session.
   */
  mediaCaptureFactory?: MediaCaptureFactory;

  /**
   * Language code for TTS/STT (e.g., 'en-US', 'es-ES').
   * @default 'en-US'
   */
  language?: string;

  /**
   * Voice ID for TTS (e.g., AWS Polly voice ID like 'Joanna', 'Matthew').
   */
  ttsVoice?: string;
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
  /** Whether the AI is loading/processing a response */
  isLoading?: boolean;
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
  /**
   * Whether the current block's value passes validation.
   * When false, the continue button will be disabled.
   */
  isValid?: boolean;
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
  // Schema-based extraction results
  extractedData?: Record<string, unknown>;
  missingFields?: string[];
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

/**
 * Voice validation handler function signature.
 * Can be provided via customData to replace the default API call.
 */
export type VoiceValidationHandler = (
  request: VoiceValidationRequest
) => Promise<VoiceValidationResponse>;

/**
 * Session initialization request
 */
export interface VoiceSessionInitRequest {
  sessionId?: string;
  surveyId?: string;
  userId?: string;
  language?: string;
}

/**
 * Session initialization response
 */
export interface VoiceSessionInitResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Session end request
 */
export interface VoiceSessionEndRequest {
  sessionId: string;
}

/**
 * Voice session initialization handler function signature.
 * Can be provided via customData to replace the default API call.
 * Return null to skip session tracking entirely.
 */
export type VoiceSessionInitHandler = (
  request: VoiceSessionInitRequest
) => Promise<VoiceSessionInitResponse | null>;

/**
 * Voice session end handler function signature.
 * Can be provided via customData to replace the default API call.
 */
export type VoiceSessionEndHandler = (
  request: VoiceSessionEndRequest
) => Promise<void>;

// Re-export AIHandler for convenience
export type { AIHandler };

/**
 * TTS (Text-to-Speech) handler function signature.
 * Implement this to provide custom TTS (e.g., AWS Polly, Google TTS, etc.)
 *
 * Can return either:
 * - Audio data (base64 or ArrayBuffer) for immediate playback
 * - A streaming URL that the browser can play directly (preferred for better perceived performance)
 */
export type TTSHandler = (request: TTSRequest) => Promise<TTSResponse>;

/**
 * TTS request
 */
export interface TTSRequest {
  text: string;
  /** Language code (e.g., 'en-US') */
  language?: string;
  /** Voice ID or name */
  voice?: string;
  /** Speech rate (0.5-2.0, default 1.0) */
  rate?: number;
}

/**
 * TTS response
 */
export interface TTSResponse {
  /** Audio data as base64 encoded string or ArrayBuffer (for Web Audio API playback) */
  audio?: string | ArrayBuffer;
  /** Audio format (e.g., 'mp3', 'pcm', 'ogg') */
  format?: 'mp3' | 'pcm' | 'ogg' | 'wav';
  /** Sample rate in Hz (for PCM) */
  sampleRate?: number;
  /**
   * Streaming URL for the audio (preferred for better perceived performance).
   * If provided, uses HTML Audio element which can start playing before full download.
   * Example: '/api/voice-survey/tts?text=Hello&voice=Joanna'
   */
  streamUrl?: string;
}

/**
 * STT (Speech-to-Text) handler function signature.
 * Implement this to provide custom STT (e.g., AWS Transcribe, Google STT, etc.)
 *
 * This handler receives audio chunks and returns transcripts.
 * For streaming STT, the handler may be called multiple times.
 */
export type STTHandler = (request: STTRequest) => Promise<STTResponse>;

/**
 * STT request
 */
export interface STTRequest {
  /** Audio data as base64 encoded string or ArrayBuffer */
  audio: string | ArrayBuffer;
  /** Audio format */
  format: 'pcm' | 'wav' | 'mp3' | 'ogg' | 'webm';
  /** Sample rate in Hz */
  sampleRate: number;
  /** Language code (e.g., 'en-US') */
  language?: string;
  /** Whether this is the final chunk (for streaming) */
  isFinal?: boolean;
  /** Session ID for streaming sessions */
  sessionId?: string;
}

/**
 * STT response
 */
export interface STTResponse {
  /** Transcribed text */
  transcript: string;
  /** Whether this is a final transcript or interim */
  isFinal: boolean;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Session ID for streaming sessions */
  sessionId?: string;
}

/**
 * Streaming STT session manager.
 * For real-time streaming STT like AWS Transcribe Streaming.
 */
export interface STTStreamingSession {
  /** Start the streaming session (connects and begins listening) */
  start: () => Promise<void>;
  /** Send audio chunk to the stream */
  sendAudio: (audio: ArrayBuffer) => void;
  /** End the streaming session and close connection */
  end: () => Promise<void>;
  /** Whether the session is actively listening */
  isActive: boolean;
  /** Whether the WebSocket is connected (optional) */
  isConnected?: boolean;
  /** Whether listening is paused but connection is open (optional) */
  isPaused?: boolean;
  /** Pre-connect the WebSocket without starting to listen (optional) */
  preconnect?: () => Promise<void>;
  /** Pause listening but keep connection open (optional) */
  pause?: () => void;
  /** Resume listening after pause (optional) */
  resume?: () => void;
}

/**
 * Factory function to create a streaming STT session.
 * Implement this for real-time streaming STT support.
 */
export type STTStreamingSessionFactory = (
  onTranscript: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  config?: {
    language?: string;
    sampleRate?: number;
  }
) => STTStreamingSession;

/**
 * Media capture session for recording audio from the microphone.
 * This abstraction allows different implementations (native Web Audio, react-media-recorder, etc.)
 * to be used interchangeably.
 */
export interface MediaCaptureSession {
  /** Start capturing audio */
  start: () => Promise<void>;
  /** Stop capturing audio */
  stop: () => void;
  /** Whether the session is currently capturing */
  isCapturing: boolean;
  /** Current volume level (0-1) for visualization */
  volume: number;
}

/**
 * Factory function to create a media capture session.
 *
 * The factory receives a callback that should be called with audio chunks.
 * Audio should be provided as PCM Int16 ArrayBuffer at the specified sample rate.
 *
 * @example
 * ```typescript
 * const mediaCaptureFactory: MediaCaptureFactory = (onAudioChunk, config) => {
 *   // Implementation using react-media-recorder or other library
 *   return {
 *     start: async () => { ... },
 *     stop: () => { ... },
 *     isCapturing: false,
 *     volume: 0,
 *   };
 * };
 * ```
 */
export type MediaCaptureFactory = (
  /** Callback to send audio chunks to STT. Audio should be PCM Int16 ArrayBuffer. */
  onAudioChunk: (audio: ArrayBuffer) => void,
  /** Configuration for the capture session */
  config?: {
    /** Target sample rate in Hz (default: 16000) */
    sampleRate?: number;
    /** Enable echo cancellation */
    echoCancellation?: boolean;
    /** Enable noise suppression */
    noiseSuppression?: boolean;
    /** Enable auto gain control */
    autoGainControl?: boolean;
  },
  /** Error callback */
  onError?: (error: string) => void
) => MediaCaptureSession;
