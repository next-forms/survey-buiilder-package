import { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import type {
  VoiceState,
  VoiceSessionConfig,
  VoiceMessage,
  VoiceCommand,
  InputMode,
  VoiceStateContext,
  VoiceSessionInitHandler,
  VoiceSessionEndHandler,
  TTSHandler,
  STTStreamingSessionFactory,
  STTStreamingSession,
  MediaCaptureFactory,
} from '../types';
import {
  voiceStateReducer,
  initialVoiceState,
} from '../VoiceStateManager';
import { useAudioCapture } from './useAudioCapture';
import { useAudioPlayback } from './useAudioPlayback';
import { useStreamingAudioCapture } from './useStreamingAudioCapture';

/**
 * Extended session config with optional handlers
 */
export interface VoiceSessionHandlers {
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
   */
  ttsHandler?: TTSHandler;

  /**
   * Custom STT (Speech-to-Text) streaming session factory.
   * If provided, this will be used instead of browser's SpeechRecognition.
   */
  sttSessionFactory?: STTStreamingSessionFactory;

  /**
   * Custom media capture factory for recording audio from the microphone.
   * If provided, this will be used instead of the built-in Web Audio API implementation.
   * Use this for better cross-platform support (especially iOS) with libraries like react-media-recorder.
   */
  mediaCaptureFactory?: MediaCaptureFactory;

  /**
   * Language code for TTS/STT (e.g., 'en-US').
   * @default 'en-US'
   */
  language?: string;

  /**
   * Voice ID for TTS (e.g., AWS Polly voice ID).
   */
  ttsVoice?: string;
}

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
 * Pre-generated audio data (e.g., from AI response)
 */
interface PreGeneratedAudio {
  audio: string;
  format: string;
  sampleRate?: number;
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
  /** Speak text, optionally using pre-generated audio (skips TTS call if provided) */
  speak: (text: string, preGeneratedAudio?: PreGeneratedAudio) => Promise<void>;
  speakImmediate: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  /** Pre-connect STT WebSocket (call during AI speaking for faster response) */
  preconnectSTT: () => Promise<void>;

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
  /** Whether STT WebSocket is connected */
  isSTTConnected: boolean;
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
 *
 * Session tracking (init/end) is optional - if no handlers are provided,
 * the voice functionality still works without external session management.
 */
export function useVoiceSession(
  config: VoiceSessionConfig = {},
  onTranscript?: (transcript: string, isFinal: boolean) => void,
  onCommand?: (command: VoiceCommand) => void,
  onStateChange?: (state: VoiceState) => void,
  handlers?: VoiceSessionHandlers
): UseVoiceSessionResult {
  // Voice state machine
  const [voiceState, dispatch] = useReducer(voiceStateReducer, initialVoiceState);

  // Refs for custom TTS/STT
  const customSTTSessionRef = useRef<STTStreamingSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  // HTML Audio element for streaming TTS (better for perceived performance)
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Track custom TTS playing state (browser TTS uses playbackState.isPlaying)
  const [isCustomTTSPlaying, setIsCustomTTSPlaying] = useState(false);
  // Also track with a ref for synchronous access
  const isCustomTTSPlayingRef = useRef(false);

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

  // Streaming audio capture hook (for custom STT)
  const {
    state: streamingCaptureState,
    startCapture: startStreamingCapture,
    stopCapture: stopStreamingCapture,
    requestPermission: requestStreamingPermission,
  } = useStreamingAudioCapture({
    sampleRate: 16000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    mediaCaptureFactory: handlers?.mediaCaptureFactory,
  });

  /**
   * Initialize voice session
   * Session tracking is optional - voice will work without it
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

        // Create the persistent STT session if using custom STT factory
        // This session will be reused across multiple questions
        if (handlers?.sttSessionFactory && !customSTTSessionRef.current) {
          customSTTSessionRef.current = handlers.sttSessionFactory(
            (transcript, isFinal) => {
              // Update session state
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

              // Pass to transcript handler
              if (onTranscriptRef.current) {
                onTranscriptRef.current(transcript, isFinal);
              }
            },
            (error) => {
              console.error('Custom STT error:', error);
              dispatch({ type: 'ERROR', payload: error });
            },
            {
              language: handlers.language || 'en-US',
              sampleRate: 16000,
            }
          );

          // Pre-warm the URL (non-blocking)
          if ('prewarm' in customSTTSessionRef.current && typeof customSTTSessionRef.current.prewarm === 'function') {
            customSTTSessionRef.current.prewarm().catch(() => {
              // Prewarm errors are non-fatal
            });
          }
        }

        // Check if a custom session init handler is provided
        if (handlers?.sessionInitHandler) {
          // Use custom handler
          const result = await handlers.sessionInitHandler({
            sessionId: sessionConfig.sessionId,
            surveyId: sessionConfig.surveyId,
            userId: sessionConfig.userId,
            language: sessionConfig.language,
          });

          // If handler returns null, skip session tracking
          if (result === null) {
            setSessionState((prev) => ({
              ...prev,
              sessionId: null,
              isInitialized: true,
              error: null,
            }));
            dispatch({ type: 'RESET' });
            return;
          }

          if (!result.success) {
            throw new Error(result.error || 'Failed to initialize session');
          }

          setSessionState((prev) => ({
            ...prev,
            sessionId: result.sessionId || null,
            isInitialized: true,
            error: null,
          }));
        } else {
          // No session handler provided - just initialize locally without session tracking
          // This allows voice to work without any backend dependency
          setSessionState((prev) => ({
            ...prev,
            sessionId: null,
            isInitialized: true,
            error: null,
          }));
        }

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
    [requestPermission, handlers]
  );

  /**
   * End voice session
   * Closes STT connection and cleans up resources
   */
  const endSession = useCallback(async () => {
    stopCapture();
    stopSpeaking();
    stopStreamingCapture();

    // End custom STT session (close WebSocket connection)
    if (customSTTSessionRef.current) {
      await customSTTSessionRef.current.end().catch(console.error);
      customSTTSessionRef.current = null;
    }

    // Only call end handler if session was tracked and handler is provided
    if (sessionState.sessionId && handlers?.sessionEndHandler) {
      try {
        await handlers.sessionEndHandler({
          sessionId: sessionState.sessionId,
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
  }, [sessionState.sessionId, stopCapture, stopSpeaking, stopStreamingCapture, handlers]);

  /**
   * Helper to update custom TTS playing state (both state and ref)
   */
  const setCustomTTSPlaying = useCallback((playing: boolean) => {
    isCustomTTSPlayingRef.current = playing;
    setIsCustomTTSPlaying(playing);
  }, []);

  /**
   * Play audio from a streaming URL using HTML Audio element.
   * This allows playback to start before the full file is downloaded.
   */
  const playAudioFromStreamUrl = useCallback(async (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Track if we've already resolved/rejected to prevent double-firing
      let hasCompleted = false;
      let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let pollingIntervalId: ReturnType<typeof setInterval> | null = null;
      // Track consecutive "at end" detections to avoid false positives
      let atEndCount = 0;
      // Track last known position to detect if playback is truly stuck
      let lastPosition = -1;
      let stuckCount = 0;

      const cleanup = () => {
        if (safetyTimeoutId) {
          clearTimeout(safetyTimeoutId);
          safetyTimeoutId = null;
        }
        if (pollingIntervalId) {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
        }
      };

      const completePlayback = (_reason?: string) => {
        if (hasCompleted) return;
        hasCompleted = true;
        cleanup();

        // Clean up audio element
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.src = '';
          audioElementRef.current = null;
        }

        setCustomTTSPlaying(false);
        dispatch({ type: 'STOP_SPEAKING' });
        resolve();
      };

      // Stop any currently playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
        audioElementRef.current = null;
      }

      // Create new audio element
      const audio = new Audio();
      audioElementRef.current = audio;

      // Safety timeout - if audio doesn't end within 60 seconds, force cleanup
      // This is critical for iOS where 'ended' event may not fire
      safetyTimeoutId = setTimeout(() => {
        console.warn('Audio playback safety timeout reached');
        completePlayback('safety_timeout');
      }, 60000);

      // iOS workaround: Poll for ended state since 'ended' event may not fire
      // Use conservative checks to avoid false positives during buffering
      const startPolling = () => {
        pollingIntervalId = setInterval(() => {
          // Check if audio was stopped externally (e.g., stopCustomTTS was called)
          if (!audio || hasCompleted || !audioElementRef.current) {
            cleanup();
            if (!hasCompleted) {
              completePlayback('external_stop');
            }
            return;
          }

          // Primary check: audio.ended property (most reliable when it works)
          if (audio.ended) {
            completePlayback('polling_ended_true');
            return;
          }

          // Secondary check: at end of known duration
          // Only trigger if duration is valid (not NaN, not Infinity, and > 0)
          const duration = audio.duration;
          const currentTime = audio.currentTime;
          const hasValidDuration = Number.isFinite(duration) && duration > 0;

          if (hasValidDuration && currentTime >= duration - 0.05) {
            // We appear to be at the end - but require multiple consecutive detections
            // to avoid false positives during loading/buffering
            atEndCount++;
            if (atEndCount >= 3) {
              completePlayback('polling_at_duration');
              return;
            }
          } else {
            // Reset counter if we're not at the end
            atEndCount = 0;
          }

          // Tertiary check: detect truly stuck playback (position hasn't changed)
          // This handles cases where audio finished but duration wasn't accurate
          if (hasValidDuration && currentTime > 0) {
            if (Math.abs(currentTime - lastPosition) < 0.01) {
              stuckCount++;
              // If stuck at same position for 2+ seconds (8 checks at 250ms),
              // and we're past 90% of duration, consider it done
              if (stuckCount >= 8 && currentTime >= duration * 0.9) {
                completePlayback('polling_stuck_at_end');
                return;
              }
            } else {
              stuckCount = 0;
            }
            lastPosition = currentTime;
          }
        }, 250);
      };

      // Set up event handlers BEFORE setting src
      audio.oncanplaythrough = () => {
        // Audio has buffered enough to play through
      };

      audio.onplay = () => {
        // Audio started playing - mark as speaking
        setCustomTTSPlaying(true);
        // Start polling as a backup for iOS
        startPolling();
      };

      audio.onended = () => {
        completePlayback('onended_event');
      };

      // iOS-specific: Also listen to 'pause' event at the end of playback
      // On iOS, sometimes 'pause' fires instead of 'ended' when audio truly completes
      // But we need to be careful not to trigger on buffering pauses
      audio.onpause = () => {
        if (hasCompleted) return;

        // Only complete if audio.ended is true (safest check)
        if (audio.ended) {
          completePlayback('onpause_ended_true');
          return;
        }

        // Or if we're very close to the end of a known duration
        const duration = audio.duration;
        const currentTime = audio.currentTime;
        if (Number.isFinite(duration) && duration > 0 && currentTime >= duration - 0.05) {
          // Wait a brief moment to confirm this isn't just a buffering pause
          setTimeout(() => {
            if (!hasCompleted && audio.paused && audio.currentTime >= audio.duration - 0.05) {
              completePlayback('onpause_at_end_confirmed');
            }
          }, 300);
        }
      };

      audio.onerror = (e) => {
        if (hasCompleted) return;
        hasCompleted = true;
        cleanup();
        console.error('Audio playback error:', e);
        audioElementRef.current = null;
        setCustomTTSPlaying(false);
        dispatch({ type: 'STOP_SPEAKING' });
        reject(new Error('Audio playback failed'));
      };

      // Set preload to auto for faster start
      audio.preload = 'auto';

      // iOS-specific: Set playsinline attribute
      audio.setAttribute('playsinline', 'true');

      // Set the source - this starts loading
      audio.src = url;

      // Start playing as soon as possible (browser may wait for some buffering)
      audio.play().catch((error) => {
        if (hasCompleted) return;
        hasCompleted = true;
        cleanup();
        console.error('Audio play() failed:', error);
        audioElementRef.current = null;
        setCustomTTSPlaying(false);
        dispatch({ type: 'STOP_SPEAKING' });
        reject(error);
      });
    });
  }, [setCustomTTSPlaying]);

  /**
   * Play audio from TTS response using Web Audio API
   */
  const playAudioFromTTS = useCallback(async (audio: string | ArrayBuffer, format: string, sampleRate?: number): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      // Safety timeout - if audio doesn't end within 60 seconds, force cleanup
      const safetyTimeout = setTimeout(() => {
        console.warn('TTS playback safety timeout reached');
        if (currentAudioSourceRef.current) {
          try {
            currentAudioSourceRef.current.stop();
          } catch (e) {
            // Ignore
          }
          currentAudioSourceRef.current = null;
        }
        setCustomTTSPlaying(false);
        dispatch({ type: 'STOP_SPEAKING' });
        resolve();
      }, 60000);

      try {
        // Mark as playing (update both state and ref)
        setCustomTTSPlaying(true);

        // Create or reuse audio context
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContext();
        }
        const audioContext = audioContextRef.current;

        // Resume if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Convert base64 to ArrayBuffer if needed
        let audioData: ArrayBuffer;
        if (typeof audio === 'string') {
          const binaryString = atob(audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioData = bytes.buffer;
        } else {
          // Clone the ArrayBuffer to avoid detached buffer issues
          audioData = audio.slice(0);
        }

        // Decode audio data (need to clone as decodeAudioData detaches the buffer)
        const audioDataCopy = audioData.slice(0);
        const audioBuffer = await audioContext.decodeAudioData(audioDataCopy);

        // Stop any currently playing audio
        if (currentAudioSourceRef.current) {
          currentAudioSourceRef.current.stop();
          currentAudioSourceRef.current = null;
        }

        // Create and play source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        currentAudioSourceRef.current = source;

        source.onended = () => {
          clearTimeout(safetyTimeout);
          currentAudioSourceRef.current = null;
          // Small delay before clearing state to ensure React has processed the "playing" state
          setTimeout(() => {
            setCustomTTSPlaying(false);
            dispatch({ type: 'STOP_SPEAKING' });
            resolve();
          }, 50);
        };

        // Wait for React to process the state update (isCustomTTSPlaying = true)
        // This ensures VoiceLayout's useEffect sees isSpeaking=true and sets hasStartedSpeakingRef
        // We use multiple animation frames to guarantee a render cycle has completed
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Additional small delay to ensure useEffect has run
              setTimeout(resolve, 50);
            });
          });
        });

        source.start();
      } catch (error) {
        clearTimeout(safetyTimeout);
        console.error('Error playing TTS audio:', error);
        setCustomTTSPlaying(false);
        dispatch({ type: 'STOP_SPEAKING' });
        reject(error);
      }
    });
  }, [setCustomTTSPlaying]);

  /**
   * Stop custom TTS audio playback (both Web Audio API and HTML Audio element)
   */
  const stopCustomTTS = useCallback(() => {
    // Stop Web Audio API source
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      currentAudioSourceRef.current = null;
    }

    // Stop HTML Audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    setCustomTTSPlaying(false);
  }, [setCustomTTSPlaying]);

  /**
   * Pre-connect STT WebSocket during AI speaking
   * This ensures the connection is ready when user needs to speak
   */
  const preconnectSTT = useCallback(async () => {
    if (!customSTTSessionRef.current) return;

    // Check if already connected
    if (customSTTSessionRef.current.isConnected) return;

    try {
      // Use preconnect if available, otherwise start will handle it
      if ('preconnect' in customSTTSessionRef.current && typeof customSTTSessionRef.current.preconnect === 'function') {
        await customSTTSessionRef.current.preconnect();
      }
    } catch (error) {
      console.warn('STT preconnect failed (will retry on start):', error);
    }
  }, []);

  // Track if we're in the process of starting listening to prevent double calls
  const isStartingListeningRef = useRef(false);

  /**
   * Start listening for voice input
   * Uses custom STT session if provided, otherwise falls back to browser's SpeechRecognition
   */
  const startListening = useCallback(async () => {
    // Prevent double starts
    if (isStartingListeningRef.current) {
      return;
    }

    // Check if already listening
    if (streamingCaptureState.isCapturing || captureState.isCapturing) {
      return;
    }

    isStartingListeningRef.current = true;

    try {
      // Check if custom STT is available
      if (handlers?.sttSessionFactory && customSTTSessionRef.current) {
        // Start the STT session first (will connect/reconnect if needed)
        await customSTTSessionRef.current.start();

        // Then start capturing audio - this will update isCapturing state
        await startStreamingCapture(customSTTSessionRef.current);

        // Dispatch after capture starts to reduce re-renders
        dispatch({ type: 'START_LISTENING' });
        return;
      }

      // Fall back to browser's SpeechRecognition
      if (!captureState.isSupported) {
        dispatch({ type: 'ERROR', payload: 'Speech recognition not supported' });
        return;
      }

      dispatch({ type: 'START_LISTENING' });
      await startCapture();
    } catch (error) {
      console.error('Failed to start listening:', error);
      dispatch({ type: 'ERROR', payload: 'Failed to start speech recognition' });
      stopStreamingCapture();
    } finally {
      isStartingListeningRef.current = false;
    }
  }, [handlers, captureState.isSupported, captureState.isCapturing, streamingCaptureState.isCapturing, startCapture, startStreamingCapture, stopStreamingCapture]);

  /**
   * Stop listening (pauses STT but keeps connection open for next question)
   */
  const stopListening = useCallback(() => {
    // Stop streaming audio capture (for custom STT)
    stopStreamingCapture();

    // Pause custom STT session (keep connection open for reuse)
    if (customSTTSessionRef.current?.isActive) {
      if ('pause' in customSTTSessionRef.current && typeof customSTTSessionRef.current.pause === 'function') {
        customSTTSessionRef.current.pause();
      }
    }

    // Also stop browser capture (for fallback STT)
    stopCapture();
    dispatch({ type: 'STOP_LISTENING' });
    // Clear interim transcript when stopping
    setSessionState(prev => ({
      ...prev,
      lastInterimTranscript: '',
    }));
  }, [stopCapture, stopStreamingCapture]);

  /**
   * Speak text with TTS (queues speech to avoid interruption)
   * Uses custom TTS handler if provided, otherwise falls back to browser's Web Speech Synthesis
   *
   * @param text - Text to speak
   * @param preGeneratedAudio - Optional pre-generated audio (e.g., from AI response)
   */
  const speak = useCallback(
    async (text: string, preGeneratedAudio?: { audio?: string; format?: string; sampleRate?: number; streamUrl?: string }) => {
      // If a streaming URL is provided, use it (best for perceived performance)
      if (preGeneratedAudio?.streamUrl) {
        dispatch({ type: 'START_SPEAKING' });
        try {
          await playAudioFromStreamUrl(preGeneratedAudio.streamUrl);
        } catch (error) {
          console.error('Error playing streaming audio:', error);
          dispatch({ type: 'STOP_SPEAKING' });
        }
        return;
      }

      // If pre-generated audio data is provided, use it directly (no TTS API call needed)
      if (preGeneratedAudio?.audio) {
        dispatch({ type: 'START_SPEAKING' });
        try {
          await playAudioFromTTS(preGeneratedAudio.audio, preGeneratedAudio.format || 'mp3', preGeneratedAudio.sampleRate);
        } catch (error) {
          console.error('Error playing pre-generated audio:', error);
          dispatch({ type: 'STOP_SPEAKING' });
        }
        return;
      }

      // Check if custom TTS handler is available
      if (handlers?.ttsHandler) {
        dispatch({ type: 'START_SPEAKING' });
        try {
          const response = await handlers.ttsHandler({
            text,
            language: handlers.language || 'en-US',
            voice: handlers.ttsVoice,
            rate: 1.0,
          });

          // Prefer streaming URL if provided
          if (response.streamUrl) {
            await playAudioFromStreamUrl(response.streamUrl);
          } else if (response.audio) {
            await playAudioFromTTS(response.audio, response.format || 'mp3', response.sampleRate);
          } else {
            console.warn('TTS handler returned no audio');
            dispatch({ type: 'STOP_SPEAKING' });
          }
        } catch (error) {
          console.error('Custom TTS error:', error);
          dispatch({ type: 'STOP_SPEAKING' });
        }
        return;
      }

      // Fall back to browser TTS
      if (!playbackState.isSupported && !config.useBrowserTTS) {
        // Fall back to visual display
        console.warn('TTS not supported, falling back to visual');
        return;
      }

      dispatch({ type: 'START_SPEAKING' });
      // Use queue to prevent interrupting current speech
      queueSpeechText(text);
    },
    [handlers, playbackState.isSupported, config.useBrowserTTS, queueSpeechText, playAudioFromTTS, playAudioFromStreamUrl]
  );

  /**
   * Speak text immediately (cancels current speech)
   */
  const speakImmediate = useCallback(
    async (text: string) => {
      // Stop any current custom TTS
      stopCustomTTS();

      // Check if custom TTS is available
      if (handlers?.ttsHandler) {
        dispatch({ type: 'START_SPEAKING' });
        try {
          const response = await handlers.ttsHandler({
            text,
            language: handlers.language || 'en-US',
            voice: handlers.ttsVoice,
            rate: 1.0,
          });
          await playAudioFromTTS(response.audio, response.format, response.sampleRate);
        } catch (error) {
          console.error('Custom TTS error:', error);
          dispatch({ type: 'STOP_SPEAKING' });
        }
        return;
      }

      // Fall back to browser TTS
      if (!playbackState.isSupported && !config.useBrowserTTS) {
        console.warn('TTS not supported, falling back to visual');
        return;
      }

      dispatch({ type: 'START_SPEAKING' });
      await speakText(text);
    },
    [handlers, playbackState.isSupported, config.useBrowserTTS, speakText, playAudioFromTTS, stopCustomTTS]
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
      // Stop streaming audio capture
      stopStreamingCapture();

      // Stop browser-based capture and playback
      stopCapture();
      stopSpeaking();

      // Stop custom STT session
      if (customSTTSessionRef.current?.isActive) {
        customSTTSessionRef.current.end().catch(console.error);
      }

      // Stop custom TTS playback
      if (currentAudioSourceRef.current) {
        try {
          currentAudioSourceRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [stopCapture, stopSpeaking, stopStreamingCapture]);

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
    preconnectSTT,

    // Session controls
    initSession,
    endSession,
    switchToVisual,
    switchToVoice,

    // Message management
    addMessage,
    clearMessages,

    // Computed
    // isListening is true if either browser capture or streaming capture is active
    isListening: captureState.isCapturing || streamingCaptureState.isCapturing,
    // isSpeaking is true if either browser TTS or custom TTS is playing
    isSpeaking: playbackState.isPlaying || isCustomTTSPlaying,
    isProcessing: voiceState.isProcessing,
    // Use volume from streaming capture if active, otherwise from browser capture
    volume: streamingCaptureState.isCapturing ? streamingCaptureState.volume : captureState.volume,
    // Whether STT WebSocket is connected
    isSTTConnected: customSTTSessionRef.current?.isConnected ?? false,
  };
}
