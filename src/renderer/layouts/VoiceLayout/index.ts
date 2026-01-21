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
} from './types';

// Utilities
export { classifyQuestion, matchVoiceToOption, isPrivacyBlock } from './QuestionClassifier';
export {
  voiceStateReducer,
  initialVoiceState,
  canTransition,
  getStateDescription,
  shouldShowVoiceControls,
  shouldShowVisualInput,
} from './VoiceStateManager';
