import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioCaptureConfig } from '../types';
import {
  isWebAudioSupported,
  isSpeechRecognitionSupported,
  calculateVolume,
} from '../utils/audioUtils';

// SpeechRecognition interface definition for cross-browser support
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

/**
 * Get SpeechRecognition constructor with cross-browser support
 */
function getSpeechRecognition(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Audio capture state
 */
interface AudioCaptureState {
  isCapturing: boolean;
  isSupported: boolean;
  error: string | null;
  volume: number;
  transcript: string;
  interimTranscript: string;
  isFinal: boolean;
}

/**
 * Audio capture result
 */
interface UseAudioCaptureResult {
  state: AudioCaptureState;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  requestPermission: () => Promise<boolean>;
}

/**
 * Hook for capturing audio from the microphone using Web Speech API
 *
 * Uses SpeechRecognition for STT (speech-to-text) which provides:
 * - Real-time transcription
 * - Interim results for live feedback
 * - Automatic silence detection
 */
export function useAudioCapture(
  config: AudioCaptureConfig = {},
  onTranscript?: (transcript: string, isFinal: boolean) => void,
  onSilence?: () => void
): UseAudioCaptureResult {
  const [state, setState] = useState<AudioCaptureState>({
    isCapturing: false,
    isSupported: isSpeechRecognitionSupported(),
    error: null,
    volume: 0,
    transcript: '',
    interimTranscript: '',
    isFinal: false,
  });

  // Use refs to avoid stale closure issues
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  const shouldRestartRef = useRef<boolean>(false);

  const silenceTimeout = config.echoCancellation !== false ? 2000 : 1500;

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: config.autoGainControl ?? true,
          channelCount: config.channelCount ?? 1,
        },
      });

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setState((prev) => ({
        ...prev,
        error: 'Microphone permission denied',
      }));
      return false;
    }
  }, [config]);

  /**
   * Set up volume monitoring with Web Audio API
   */
  const setupVolumeMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: config.autoGainControl ?? true,
        },
      });

      mediaStreamRef.current = stream;

      if (isWebAudioSupported()) {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        // Volume monitoring loop
        const dataArray = new Float32Array(analyserRef.current.fftSize);
        const updateVolume = () => {
          if (!analyserRef.current || !isCapturingRef.current) return;
          analyserRef.current.getFloatTimeDomainData(dataArray);
          const volume = calculateVolume(dataArray);
          setState((prev) => ({ ...prev, volume }));

          if (isCapturingRef.current) {
            requestAnimationFrame(updateVolume);
          }
        };
        updateVolume();
      }
    } catch (error) {
      console.error('Volume monitoring setup failed:', error);
    }
  }, [config]);

  /**
   * Start capturing audio
   */
  const startCapture = useCallback(async () => {
    // Prevent rapid start/stop cycles
    if (isStartingRef.current || isCapturingRef.current) {
      return;
    }

    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition not supported in this browser',
        isSupported: false,
      }));
      return;
    }

    isStartingRef.current = true;

    try {
      // Request permission first
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        isStartingRef.current = false;
        return;
      }

      // Set up volume monitoring
      await setupVolumeMonitoring();

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Handle start
      recognition.onstart = () => {
        isStartingRef.current = false;
        isCapturingRef.current = true;
        setState((prev) => ({
          ...prev,
          isCapturing: true,
          error: null,
        }));
      };

      // Handle results
      recognition.onresult = (event: any) => {
        lastSpeechTimeRef.current = Date.now();

        // Clear silence timer on speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        setState((prev) => ({
          ...prev,
          transcript: final || prev.transcript,
          interimTranscript: interim,
          isFinal: !!final,
        }));

        if (final && onTranscript) {
          onTranscript(final, true);
        } else if (interim && onTranscript) {
          onTranscript(interim, false);
        }

        // Start silence timer
        silenceTimerRef.current = setTimeout(() => {
          if (onSilence && isCapturingRef.current) {
            onSilence();
          }
        }, silenceTimeout);
      };

      // Handle errors - be more graceful
      recognition.onerror = (event: any) => {
        const errorType = event.error;

        // Don't log expected errors
        if (errorType !== 'no-speech' && errorType !== 'aborted') {
          console.error('Speech recognition error:', errorType);
        }

        // Handle different error types
        switch (errorType) {
          case 'no-speech':
            // No speech detected - this is normal, just trigger silence callback
            if (onSilence && isCapturingRef.current) {
              onSilence();
            }
            break;

          case 'aborted':
            // Recognition was aborted (usually by user or another start/stop)
            // Don't treat as error, just clean up
            break;

          case 'network':
            setState((prev) => ({
              ...prev,
              error: 'Network error - please check your connection',
            }));
            break;

          case 'not-allowed':
          case 'service-not-allowed':
            setState((prev) => ({
              ...prev,
              error: 'Microphone access denied',
            }));
            break;

          default:
            // Only show error for unexpected issues
            setState((prev) => ({
              ...prev,
              error: `Speech error: ${errorType}`,
            }));
        }
      };

      // Handle end - restart if needed
      recognition.onend = () => {
        // Only restart if we're still supposed to be capturing
        if (isCapturingRef.current && shouldRestartRef.current) {
          // Small delay to prevent rapid restarts
          setTimeout(() => {
            if (isCapturingRef.current && recognitionRef.current === recognition) {
              try {
                recognition.start();
              } catch (e) {
                // Recognition might have been stopped, ignore
              }
            }
          }, 100);
        }
      };

      // Start recognition
      shouldRestartRef.current = true;
      recognition.start();

      setState((prev) => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        isFinal: false,
      }));
    } catch (error) {
      isStartingRef.current = false;
      console.error('Failed to start audio capture:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start capture',
      }));
    }
  }, [
    requestPermission,
    setupVolumeMonitoring,
    onTranscript,
    onSilence,
    silenceTimeout,
  ]);

  /**
   * Stop capturing audio
   */
  const stopCapture = useCallback(() => {
    // Update refs first to prevent restarts
    isCapturingRef.current = false;
    shouldRestartRef.current = false;
    isStartingRef.current = false;

    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent restart
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore errors during cleanup
      }
      recognitionRef.current = null;
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isCapturing: false,
      volume: 0,
      interimTranscript: '',
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    state,
    startCapture,
    stopCapture,
    requestPermission,
  };
}
