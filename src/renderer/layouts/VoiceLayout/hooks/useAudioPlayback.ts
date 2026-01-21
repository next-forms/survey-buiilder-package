import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioPlaybackConfig } from '../types';
import { isSpeechSynthesisSupported } from '../utils/audioUtils';

/**
 * Audio playback state
 */
interface AudioPlaybackState {
  isPlaying: boolean;
  isSupported: boolean;
  error: string | null;
  currentText: string;
  queueLength: number;
}

/**
 * Audio playback result
 */
interface UseAudioPlaybackResult {
  state: AudioPlaybackState;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  queueSpeech: (text: string) => void;
  clearQueue: () => void;
  setVoice: (voiceName: string) => void;
  getAvailableVoices: () => SpeechSynthesisVoice[];
}

/**
 * Hook for playing audio/speech using Web Speech Synthesis API
 *
 * Provides:
 * - Text-to-speech playback
 * - Queue management for sequential speech
 * - Voice selection
 * - Playback controls (pause/resume/stop)
 */
export function useAudioPlayback(
  config: AudioPlaybackConfig = {},
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): UseAudioPlaybackResult {
  const [state, setState] = useState<AudioPlaybackState>({
    isPlaying: false,
    isSupported: isSpeechSynthesisSupported(),
    error: null,
    currentText: '',
    queueLength: 0,
  });

  const queueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isProcessingQueueRef = useRef(false);

  /**
   * Get available voices
   */
  const getAvailableVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!isSpeechSynthesisSupported()) return [];
    return speechSynthesis.getVoices();
  }, []);

  /**
   * Set the preferred voice
   */
  const setVoice = useCallback((voiceName: string) => {
    const voices = getAvailableVoices();
    const voice = voices.find(
      (v) => v.name === voiceName || v.name.includes(voiceName)
    );
    if (voice) {
      selectedVoiceRef.current = voice;
    }
  }, [getAvailableVoices]);

  /**
   * Get the best available voice
   */
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (selectedVoiceRef.current) {
      return selectedVoiceRef.current;
    }

    const voices = getAvailableVoices();
    if (voices.length === 0) return null;

    // Prefer high-quality English voices
    const preferredVoices = [
      'Google US English',
      'Microsoft David',
      'Samantha',
      'Alex',
    ];

    for (const preferred of preferredVoices) {
      const voice = voices.find((v) => v.name.includes(preferred));
      if (voice) return voice;
    }

    // Fall back to any English voice
    const englishVoice = voices.find((v) => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Fall back to default
    return voices.find((v) => v.default) || voices[0];
  }, [getAvailableVoices]);

  /**
   * Process the speech queue
   */
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    while (queueRef.current.length > 0) {
      const text = queueRef.current.shift()!;
      setState((prev) => ({
        ...prev,
        queueLength: queueRef.current.length,
      }));

      await new Promise<void>((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;

        // Configure utterance
        const voice = getBestVoice();
        if (voice) {
          utterance.voice = voice;
        }
        utterance.rate = config.speed ?? 1.0;
        utterance.volume = config.volume ?? 1.0;
        utterance.pitch = 1.0;

        // Event handlers
        utterance.onstart = () => {
          setState((prev) => ({
            ...prev,
            isPlaying: true,
            currentText: text,
          }));
          if (onStart) onStart();
        };

        utterance.onend = () => {
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            currentText: '',
          }));
          currentUtteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          const errorMsg = `Speech error: ${event.error}`;
          setState((prev) => ({
            ...prev,
            isPlaying: false,
            error: errorMsg,
            currentText: '',
          }));
          currentUtteranceRef.current = null;
          if (onError) onError(errorMsg);
          resolve(); // Resolve to continue queue processing
        };

        // Speak
        speechSynthesis.speak(utterance);
      });
    }

    isProcessingQueueRef.current = false;
    if (onEnd) onEnd();
  }, [config.speed, config.volume, getBestVoice, onStart, onEnd, onError]);

  /**
   * Speak text immediately (clears queue)
   */
  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!isSpeechSynthesisSupported()) {
        const error = 'Speech synthesis not supported';
        setState((prev) => ({ ...prev, error }));
        if (onError) onError(error);
        return;
      }

      // Stop any current speech and clear queue
      speechSynthesis.cancel();
      queueRef.current = [];
      isProcessingQueueRef.current = false;

      // Add to queue and process
      queueRef.current.push(text);
      setState((prev) => ({
        ...prev,
        queueLength: queueRef.current.length,
        error: null,
      }));

      await processQueue();
    },
    [processQueue, onError]
  );

  /**
   * Queue speech for later (doesn't interrupt current speech)
   */
  const queueSpeech = useCallback(
    (text: string) => {
      if (!isSpeechSynthesisSupported()) {
        const error = 'Speech synthesis not supported';
        setState((prev) => ({ ...prev, error }));
        if (onError) onError(error);
        return;
      }

      queueRef.current.push(text);
      setState((prev) => ({
        ...prev,
        queueLength: queueRef.current.length,
        error: null,
      }));

      // Start processing if not already
      processQueue();
    },
    [processQueue, onError]
  );

  /**
   * Stop all speech
   */
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    queueRef.current = [];
    isProcessingQueueRef.current = false;
    currentUtteranceRef.current = null;

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      currentText: '',
      queueLength: 0,
    }));
  }, []);

  /**
   * Pause current speech
   */
  const pause = useCallback(() => {
    if (isSpeechSynthesisSupported()) {
      speechSynthesis.pause();
    }
  }, []);

  /**
   * Resume paused speech
   */
  const resume = useCallback(() => {
    if (isSpeechSynthesisSupported()) {
      speechSynthesis.resume();
    }
  }, []);

  /**
   * Clear the speech queue (doesn't stop current speech)
   */
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setState((prev) => ({
      ...prev,
      queueLength: 0,
    }));
  }, []);

  // Load voices when available
  useEffect(() => {
    if (!isSpeechSynthesisSupported()) return;

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0 && !selectedVoiceRef.current) {
        selectedVoiceRef.current = getBestVoice();
      }
    };

    // Load immediately if available
    loadVoices();

    // Also listen for voiceschanged event (needed for some browsers)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [getBestVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSpeechSynthesisSupported()) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    state,
    speak,
    stop,
    pause,
    resume,
    queueSpeech,
    clearQueue,
    setVoice,
    getAvailableVoices,
  };
}
