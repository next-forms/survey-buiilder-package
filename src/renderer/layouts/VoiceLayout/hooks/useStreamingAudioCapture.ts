import { useState, useCallback, useRef, useEffect } from 'react';
import type { STTStreamingSession } from '../types';
import { calculateVolume } from '../utils/audioUtils';

/**
 * Configuration for streaming audio capture
 */
interface StreamingAudioCaptureConfig {
  /** Audio sample rate (default: 16000 for AWS Transcribe) */
  sampleRate?: number;
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable auto gain control */
  autoGainControl?: boolean;
  /** Chunk size in samples (default: 4096) */
  chunkSize?: number;
}

/**
 * State for streaming audio capture
 */
interface StreamingAudioCaptureState {
  isCapturing: boolean;
  isSupported: boolean;
  error: string | null;
  volume: number;
}

/**
 * Result from useStreamingAudioCapture hook
 */
interface UseStreamingAudioCaptureResult {
  state: StreamingAudioCaptureState;
  startCapture: (sttSession: STTStreamingSession) => Promise<void>;
  stopCapture: () => void;
  requestPermission: () => Promise<boolean>;
}

/**
 * Convert Float32Array to Int16Array (PCM 16-bit)
 * AWS Transcribe expects signed 16-bit PCM
 */
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

/**
 * Downsample audio from source sample rate to target sample rate
 */
function downsample(
  buffer: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return buffer;
  }

  const sampleRateRatio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

/**
 * Hook for capturing raw audio from the microphone and streaming to STT service
 *
 * This hook captures PCM audio data suitable for streaming speech-to-text services
 * like AWS Transcribe. It handles:
 * - Microphone access and permission
 * - Audio resampling to target sample rate
 * - Conversion to 16-bit PCM format
 * - Volume level monitoring for visualization
 */
export function useStreamingAudioCapture(
  config: StreamingAudioCaptureConfig = {}
): UseStreamingAudioCaptureResult {
  const {
    sampleRate: targetSampleRate = 16000,
    echoCancellation = true,
    noiseSuppression = true,
    autoGainControl = true,
    chunkSize = 4096,
  } = config;

  const [state, setState] = useState<StreamingAudioCaptureState>({
    isCapturing: false,
    isSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    error: null,
    volume: 0,
  });

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sttSessionRef = useRef<STTStreamingSession | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const volumeIntervalRef = useRef<number | null>(null);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation,
          noiseSuppression,
          autoGainControl,
          channelCount: 1,
        },
      });

      // Stop immediately - we just needed permission check
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
  }, [echoCancellation, noiseSuppression, autoGainControl]);

  /**
   * Start capturing audio and streaming to STT session
   */
  const startCapture = useCallback(
    async (sttSession: STTStreamingSession) => {
      if (isCapturingRef.current) {
        return;
      }

      try {
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation,
            noiseSuppression,
            autoGainControl,
            channelCount: 1,
            // Don't specify sampleRate - let the browser use native rate
            // We'll resample in the processor
          },
        });

        mediaStreamRef.current = stream;
        sttSessionRef.current = sttSession;

        // Create audio context with default sample rate
        // We MUST use the native sample rate to avoid "different sample-rate" errors
        // Resampling to target rate will be done in the processor
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Create source from microphone
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Create analyser for volume monitoring
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        source.connect(analyser);

        // Create script processor for audio data
        // Note: ScriptProcessorNode is deprecated but widely supported
        // AudioWorklet is the modern alternative but more complex to set up
        const processor = audioContext.createScriptProcessor(chunkSize, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (!isCapturingRef.current || !sttSessionRef.current) {
            return;
          }

          const inputData = event.inputBuffer.getChannelData(0);

          // Downsample if needed
          const actualSampleRate = audioContext.sampleRate;
          const processedData =
            actualSampleRate !== targetSampleRate
              ? downsample(inputData, actualSampleRate, targetSampleRate)
              : new Float32Array(inputData);

          // Convert to 16-bit PCM
          const pcmData = floatTo16BitPCM(processedData);

          // Send to STT session
          sttSessionRef.current.sendAudio(pcmData);
        };

        // Connect the processor (must be connected to destination to work)
        source.connect(processor);
        processor.connect(audioContext.destination);

        // Start volume monitoring
        const dataArray = new Float32Array(analyser.fftSize);
        volumeIntervalRef.current = window.setInterval(() => {
          if (analyserRef.current && isCapturingRef.current) {
            analyserRef.current.getFloatTimeDomainData(dataArray);
            const volume = calculateVolume(dataArray);
            setState((prev) => ({ ...prev, volume }));
          }
        }, 100);

        // Update state
        isCapturingRef.current = true;
        setState((prev) => ({
          ...prev,
          isCapturing: true,
          error: null,
        }));
      } catch (error) {
        console.error('Failed to start audio capture:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to start capture',
          isCapturing: false,
        }));
      }
    },
    [targetSampleRate, echoCancellation, noiseSuppression, autoGainControl, chunkSize]
  );

  /**
   * Stop capturing audio
   */
  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;

    // Stop volume monitoring
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    // Disconnect and clean up processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Clean up analyser
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Clear STT session reference
    sttSessionRef.current = null;

    setState((prev) => ({
      ...prev,
      isCapturing: false,
      volume: 0,
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
