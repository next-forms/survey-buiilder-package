import type {
  VoiceState,
  VoiceStateAction,
  VoiceStateContext,
  InputMode,
} from './types';

/**
 * Voice State Machine
 *
 * Manages the state transitions for the voice survey interface.
 *
 * State Flow:
 *
 *        ┌──────────────────────────────────────────┐
 *        ▼                                          │
 *     [IDLE] ──start──▶ [LISTENING] ──speech──▶ [PROCESSING]
 *        ▲                   │                      │
 *        │                   │ silence              │ response
 *        │                   ▼                      ▼
 *        │              [TIMEOUT]              [SPEAKING]
 *        │                   │                      │
 *        │                   ▼                      │
 *        └───────────◀──[VISUAL_INPUT]◀─────────────┘
 *                           │
 *                           │ user submits
 *                           ▼
 *                       next block
 */

/**
 * Initial voice state context
 */
export const initialVoiceState: VoiceStateContext = {
  state: 'idle',
  previousState: null,
  errorMessage: null,
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  currentInputMode: 'voice',
};

/**
 * Voice state reducer
 */
export function voiceStateReducer(
  context: VoiceStateContext,
  action: VoiceStateAction
): VoiceStateContext {
  const { state } = context;

  switch (action.type) {
    case 'START_LISTENING':
      if (state === 'idle' || state === 'speaking' || state === 'error') {
        return {
          ...context,
          previousState: state,
          state: 'listening',
          isListening: true,
          isSpeaking: false,
          isProcessing: false,
          errorMessage: null,
          currentInputMode: 'voice',
        };
      }
      return context;

    case 'STOP_LISTENING':
      if (state === 'listening') {
        return {
          ...context,
          previousState: state,
          state: 'idle',
          isListening: false,
        };
      }
      return context;

    case 'SPEECH_DETECTED':
      // Keep listening, just acknowledge speech is happening
      return context;

    case 'SILENCE_DETECTED':
      if (state === 'listening') {
        return {
          ...context,
          previousState: state,
          state: 'processing',
          isListening: false,
          isProcessing: true,
        };
      }
      return context;

    case 'PROCESSING':
      return {
        ...context,
        previousState: state,
        state: 'processing',
        isListening: false,
        isSpeaking: false,
        isProcessing: true,
      };

    case 'START_SPEAKING':
      return {
        ...context,
        previousState: state,
        state: 'speaking',
        isListening: false,
        isSpeaking: true,
        isProcessing: false,
      };

    case 'STOP_SPEAKING':
      if (state === 'speaking') {
        return {
          ...context,
          previousState: state,
          state: 'idle',
          isSpeaking: false,
        };
      }
      return context;

    case 'SWITCH_TO_VISUAL':
      return {
        ...context,
        previousState: state,
        state: 'visual_input',
        isListening: false,
        isSpeaking: false,
        isProcessing: false,
        currentInputMode: 'visual',
      };

    case 'RETURN_TO_VOICE':
      if (state === 'visual_input') {
        return {
          ...context,
          previousState: state,
          state: 'idle',
          currentInputMode: 'voice',
        };
      }
      return context;

    case 'ERROR':
      return {
        ...context,
        previousState: state,
        state: 'error',
        isListening: false,
        isSpeaking: false,
        isProcessing: false,
        errorMessage: action.payload,
      };

    case 'COMPLETE':
      return {
        ...context,
        previousState: state,
        state: 'complete',
        isListening: false,
        isSpeaking: false,
        isProcessing: false,
      };

    case 'RESET':
      return initialVoiceState;

    default:
      return context;
  }
}

/**
 * Check if a transition is valid
 */
export function canTransition(
  fromState: VoiceState,
  action: VoiceStateAction['type']
): boolean {
  const validTransitions: Record<VoiceState, VoiceStateAction['type'][]> = {
    idle: ['START_LISTENING', 'START_SPEAKING', 'SWITCH_TO_VISUAL', 'ERROR', 'COMPLETE', 'RESET'],
    listening: ['STOP_LISTENING', 'SPEECH_DETECTED', 'SILENCE_DETECTED', 'SWITCH_TO_VISUAL', 'ERROR'],
    processing: ['START_SPEAKING', 'SWITCH_TO_VISUAL', 'ERROR', 'RESET'],
    speaking: ['STOP_SPEAKING', 'START_LISTENING', 'SWITCH_TO_VISUAL', 'ERROR'],
    visual_input: ['RETURN_TO_VOICE', 'START_LISTENING', 'ERROR', 'COMPLETE'],
    error: ['START_LISTENING', 'SWITCH_TO_VISUAL', 'RESET'],
    complete: ['RESET'],
    loading: ['START_SPEAKING', 'SWITCH_TO_VISUAL', 'ERROR', 'RESET'], // UI-only state for API loading
  };

  return validTransitions[fromState]?.includes(action) ?? false;
}

/**
 * Get user-friendly state description
 */
export function getStateDescription(state: VoiceState): string {
  const descriptions: Record<VoiceState, string> = {
    idle: 'Ready',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
    visual_input: 'Enter your answer',
    error: 'Something went wrong',
    complete: 'Complete',
    loading: 'Loading...',
  };

  return descriptions[state];
}

/**
 * Determine if voice controls should be shown
 */
export function shouldShowVoiceControls(
  state: VoiceState,
  inputMode: InputMode
): boolean {
  if (inputMode === 'visual') {
    return false;
  }

  return state !== 'visual_input' && state !== 'complete';
}

/**
 * Determine if visual input should be shown
 */
export function shouldShowVisualInput(
  state: VoiceState,
  inputMode: InputMode
): boolean {
  return inputMode === 'visual' || inputMode === 'hybrid' || state === 'visual_input';
}
