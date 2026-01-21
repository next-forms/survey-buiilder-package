import { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import type {
  VoiceState,
  VoiceSessionConfig,
  VoiceMessage,
  VoiceCommand,
  InputMode,
  VoiceStateContext,
  VoiceStateAction,
} from '../types';
import {
  voiceStateReducer,
  initialVoiceState,
} from '../VoiceStateManager';
import { useAudioCapture } from './useAudioCapture';
import { useAudioPlayback } from './useAudioPlayback';

/**
 * Voice session state
 */
interface VoiceSessionState {
  sessionId: string | null;
  isInitialized: boolean;
  messages: VoiceMessage[];
  currentInputMode: InputMode;
  lastTranscript: string;
  lastInterimTranscript: string;
  error: string | null;
}

/**
 * Voice session result
 */
interface UseVoiceSessionResult {
  // State
  voiceState: VoiceStateContext;
  sessionState: VoiceSessionState;

  // Audio controls
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  speakImmediate: (text: string) => Promise<void>;
  stopSpeaking: () => void;

  // Session controls
  initSession: (config?: VoiceSessionConfig) => Promise<void>;
  endSession: () => void;
  switchToVisual: () => void;
  switchToVoice: () => void;

  // Message management
  addMessage: (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // Computed
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  volume: number;
}

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Hook for managing a complete voice survey session
 *
 * Combines audio capture, playback, and state management into
 * a unified interface for voice-based survey interaction.
 */
export function useVoiceSession(
  config: VoiceSessionConfig = {},
  onTranscript?: (transcript: string, isFinal: boolean) => void,
  onCommand?: (command: VoiceCommand) => void,
  onStateChange?: (state: VoiceState) => void
): UseVoiceSessionResult {
  // Voice state machine
  const [voiceState, dispatch] = useReducer(voiceStateReducer, initialVoiceState);

  // Session state
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    sessionId: null,
    isInitialized: false,
    messages: [],
    currentInputMode: 'voice',
    lastTranscript: '',
    lastInterimTranscript: '',
    error: null,
  });

  // Refs for callbacks to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onCommandRef = useRef(onCommand);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onCommandRef.current = onCommand;
    onStateChangeRef.current = onStateChange;
  }, [onTranscript, onCommand, onStateChange]);

  // Notify state changes
  useEffect(() => {
    if (onStateChangeRef.current) {
      onStateChangeRef.current(voiceState.state);
    }
  }, [voiceState.state]);

  /**
   * Parse voice commands from transcript
   */
  const parseVoiceCommand = useCallback((transcript: string): VoiceCommand | null => {
    const normalized = transcript.toLowerCase().trim();

    // Navigation commands
    if (/^(go\s+)?back|previous|before/.test(normalized)) {
      return { type: 'navigate', payload: { direction: 'back' } };
    }

    if (/^repeat|say\s+(that\s+)?again|what(\s+was\s+that)?/.test(normalized)) {
      return { type: 'repeat' };
    }

    if (/^skip|next|pass/.test(normalized)) {
      return { type: 'skip' };
    }

    if (/^stop|cancel|quit|exit/.test(normalized)) {
      return { type: 'stop' };
    }

    if (/^change\s+(my\s+)?answer/.test(normalized)) {
      return { type: 'change' };
    }

    return null;
  }, []);

  /**
   * Handle transcript from audio capture
   */
  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      setSessionState((prev) => ({
        ...prev,
        lastTranscript: isFinal ? transcript : prev.lastTranscript,
        lastInterimTranscript: isFinal ? '' : transcript,
      }));

      // Check for voice commands
      if (isFinal) {
        const command = parseVoiceCommand(transcript);
        if (command) {
          if (onCommandRef.current) {
            onCommandRef.current(command);
          }
          return;
        }
      }

      // Pass through to callback
      if (onTranscriptRef.current) {
        onTranscriptRef.current(transcript, isFinal);
      }
    },
    [parseVoiceCommand]
  );

  /**
   * Handle silence detection
   */
  const handleSilence = useCallback(() => {
    dispatch({ type: 'SILENCE_DETECTED' });
  }, []);

  /**
   * Handle speech start
   */
  const handleSpeakStart = useCallback(() => {
    dispatch({ type: 'START_SPEAKING' });
  }, []);

  /**
   * Handle speech end
   */
  const handleSpeakEnd = useCallback(() => {
    dispatch({ type: 'STOP_SPEAKING' });
  }, []);

  // Audio capture hook
  const {
    state: captureState,
    startCapture,
    stopCapture,
    requestPermission,
  } = useAudioCapture(
    {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    handleTranscript,
    handleSilence
  );

  // Audio playback hook
  const {
    state: playbackState,
    speak: speakText,
    stop: stopSpeaking,
    queueSpeech: queueSpeechText,
  } = useAudioPlayback(
    {
      volume: 1.0,
      speed: 1.0,
    },
    handleSpeakStart,
    handleSpeakEnd
  );

  /**
   * Initialize voice session
   */
  const initSession = useCallback(
    async (sessionConfig: VoiceSessionConfig = {}) => {
      try {
        // Request microphone permission
        const hasPermission = await requestPermission();
        if (!hasPermission) {
          setSessionState((prev) => ({
            ...prev,
            error: 'Microphone permission denied',
          }));
          dispatch({ type: 'ERROR', payload: 'Microphone permission denied' });
          return;
        }

        // Initialize session with API
        const response = await fetch('/api/voice-survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init',
            sessionId: sessionConfig.sessionId,
            surveyId: sessionConfig.surveyId,
            userId: sessionConfig.userId,
            language: sessionConfig.language,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to initialize session');
        }

        setSessionState((prev) => ({
          ...prev,
          sessionId: data.sessionId,
          isInitialized: true,
          error: null,
        }));

        dispatch({ type: 'RESET' });
      } catch (error) {
        console.error('Failed to initialize voice session:', error);
        const errorMsg = error instanceof Error ? error.message : 'Session initialization failed';
        setSessionState((prev) => ({
          ...prev,
          error: errorMsg,
        }));
        dispatch({ type: 'ERROR', payload: errorMsg });
      }
    },
    [requestPermission]
  );

  /**
   * End voice session
   */
  const endSession = useCallback(async () => {
    stopCapture();
    stopSpeaking();

    if (sessionState.sessionId) {
      try {
        await fetch('/api/voice-survey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end',
            sessionId: sessionState.sessionId,
          }),
        });
      } catch (error) {
        console.error('Failed to end session:', error);
      }
    }

    setSessionState((prev) => ({
      ...prev,
      sessionId: null,
      isInitialized: false,
    }));

    dispatch({ type: 'COMPLETE' });
  }, [sessionState.sessionId, stopCapture, stopSpeaking]);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(async () => {
    if (!captureState.isSupported) {
      dispatch({ type: 'ERROR', payload: 'Speech recognition not supported' });
      return;
    }

    dispatch({ type: 'START_LISTENING' });
    await startCapture();
  }, [captureState.isSupported, startCapture]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    stopCapture();
    dispatch({ type: 'STOP_LISTENING' });
  }, [stopCapture]);

  /**
   * Speak text with TTS (queues speech to avoid interruption)
   */
  const speak = useCallback(
    async (text: string) => {
      if (!playbackState.isSupported && !config.useBrowserTTS) {
        // Fall back to visual display
        console.warn('TTS not supported, falling back to visual');
        return;
      }

      dispatch({ type: 'START_SPEAKING' });
      // Use queue to prevent interrupting current speech
      queueSpeechText(text);
    },
    [playbackState.isSupported, config.useBrowserTTS, queueSpeechText]
  );

  /**
   * Speak text immediately (cancels current speech)
   */
  const speakImmediate = useCallback(
    async (text: string) => {
      if (!playbackState.isSupported && !config.useBrowserTTS) {
        // Fall back to visual display
        console.warn('TTS not supported, falling back to visual');
        return;
      }

      dispatch({ type: 'START_SPEAKING' });
      await speakText(text);
    },
    [playbackState.isSupported, config.useBrowserTTS, speakText]
  );

  /**
   * Switch to visual input mode
   */
  const switchToVisual = useCallback(() => {
    stopCapture();
    dispatch({ type: 'SWITCH_TO_VISUAL' });
    setSessionState((prev) => ({
      ...prev,
      currentInputMode: 'visual',
    }));
  }, [stopCapture]);

  /**
   * Switch back to voice input mode
   */
  const switchToVoice = useCallback(() => {
    dispatch({ type: 'RETURN_TO_VOICE' });
    setSessionState((prev) => ({
      ...prev,
      currentInputMode: 'voice',
    }));
  }, []);

  /**
   * Add a message to the conversation history
   */
  const addMessage = useCallback(
    (message: Omit<VoiceMessage, 'id' | 'timestamp'>) => {
      const fullMessage: VoiceMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: new Date(),
      };

      setSessionState((prev) => ({
        ...prev,
        messages: [...prev.messages, fullMessage],
      }));
    },
    []
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      messages: [],
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      stopSpeaking();
    };
  }, [stopCapture, stopSpeaking]);

  return {
    // State
    voiceState,
    sessionState,

    // Audio controls
    startListening,
    stopListening,
    speak,
    speakImmediate,
    stopSpeaking,

    // Session controls
    initSession,
    endSession,
    switchToVisual,
    switchToVoice,

    // Message management
    addMessage,
    clearMessages,

    // Computed
    isListening: captureState.isCapturing,
    isSpeaking: playbackState.isPlaying,
    isProcessing: voiceState.isProcessing,
    volume: captureState.volume,
  };
}
