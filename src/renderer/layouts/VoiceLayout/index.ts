export { VoiceLayout } from './VoiceLayout';
export { VoiceOrb } from './components/VoiceOrb';
export {
  AmbientProgress,
  AmbientProgressLine,
  AmbientProgressRing,
} from './components/AmbientProgress';
export { VisualInputWrapper } from './components/VisualInputWrapper';

// Hooks
export { useVoiceSession } from './hooks/useVoiceSession';
export { useAudioCapture } from './hooks/useAudioCapture';
export { useAudioPlayback } from './hooks/useAudioPlayback';
export { useVoiceValidation } from './hooks/useVoiceValidation';

// Types
export type {
  VoiceLayoutProps,
  VoiceCustomData,
  VoiceState,
  VoiceStateAction,
  VoiceStateContext,
  VoiceMessage,
  VoiceCommand,
  VoiceCommandType,
  InputMode,
  QuestionClassification,
  VoiceSessionConfig,
  AudioCaptureConfig,
  AudioPlaybackConfig,
  VoiceOrbProps,
  AmbientProgressProps,
  VisualInputWrapperProps,
  VoiceValidationOption,
  VoiceValidationRequest,
  VoiceValidationResponse,
  MultiSelectVoiceState,
  // Handler types for customization
  VoiceValidationHandler,
  VoiceSessionInitHandler,
  VoiceSessionEndHandler,
  VoiceSessionInitRequest,
  VoiceSessionInitResponse,
  VoiceSessionEndRequest,
  AIHandler,
  // TTS/STT types for custom audio handlers
  TTSHandler,
  TTSRequest,
  TTSResponse,
  STTHandler,
  STTRequest,
  STTResponse,
  STTStreamingSession,
  STTStreamingSessionFactory,
  // Media capture abstraction for cross-platform support
  MediaCaptureFactory,
  MediaCaptureSession,
} from './types';

// Hook types
export type { VoiceSessionHandlers } from './hooks/useVoiceSession';

// Utilities
export { classifyQuestion, matchVoiceToOption, isPrivacyBlock, hasBlockOptions, isMultiSelectBlock } from './QuestionClassifier';
export {
  voiceStateReducer,
  initialVoiceState,
  canTransition,
  getStateDescription,
  shouldShowVoiceControls,
  shouldShowVisualInput,
} from './VoiceStateManager';
