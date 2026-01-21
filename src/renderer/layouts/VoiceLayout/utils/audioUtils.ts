import type { AudioChunk, PCMEncoderConfig } from '../types';

/**
 * Audio Utilities
 *
 * Provides PCM encoding/decoding and audio processing utilities
 * for the voice survey interface.
 */

/**
 * Default PCM configuration for Amazon Nova 2 Sonic
 */
export const DEFAULT_PCM_CONFIG: PCMEncoderConfig = {
  sampleRate: 16000, // 16kHz is optimal for Nova 2 Sonic
  bitDepth: 16,
  channels: 1, // Mono
};

/**
 * Convert Float32Array audio samples to Int16Array (16-bit PCM)
 */
export function float32ToInt16(samples: Float32Array): Int16Array {
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    // Clamp the value to [-1, 1] range
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    // Convert to 16-bit signed integer
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return int16;
}

/**
 * Convert Int16Array (16-bit PCM) to Float32Array audio samples
 */
export function int16ToFloat32(samples: Int16Array): Float32Array {
  const float32 = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    // Convert from 16-bit signed integer to [-1, 1] range
    float32[i] = samples[i] / (samples[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Encode PCM audio to base64 string for transmission
 */
export function encodePCMToBase64(samples: Int16Array): string {
  const bytes = new Uint8Array(samples.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decode base64 string to PCM Int16Array
 */
export function decodeBase64ToPCM(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Resample audio from one sample rate to another
 */
export function resampleAudio(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) {
    return samples;
  }

  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
    const t = srcIndex - srcIndexFloor;

    // Linear interpolation
    result[i] = samples[srcIndexFloor] * (1 - t) + samples[srcIndexCeil] * t;
  }

  return result;
}

/**
 * Calculate audio volume (RMS) from samples
 */
export function calculateVolume(samples: Float32Array): number {
  if (samples.length === 0) return 0;

  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }

  // RMS (Root Mean Square)
  return Math.sqrt(sum / samples.length);
}

/**
 * Check if audio contains speech (basic VAD - Voice Activity Detection)
 */
export function detectSpeech(
  samples: Float32Array,
  threshold: number = 0.01
): boolean {
  const volume = calculateVolume(samples);
  return volume > threshold;
}

/**
 * Create an audio chunk with timestamp
 */
export function createAudioChunk(
  data: Float32Array | Int16Array,
  sampleRate: number
): AudioChunk {
  return {
    data,
    timestamp: Date.now(),
    sampleRate,
  };
}

/**
 * Merge multiple audio chunks into a single buffer
 */
export function mergeAudioChunks(chunks: AudioChunk[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.data.length, 0);
  const merged = new Float32Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    const data =
      chunk.data instanceof Int16Array
        ? int16ToFloat32(chunk.data)
        : chunk.data;
    merged.set(data, offset);
    offset += data.length;
  }

  return merged;
}

/**
 * Apply a simple low-pass filter to reduce noise
 */
export function lowPassFilter(
  samples: Float32Array,
  cutoffFreq: number,
  sampleRate: number
): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoffFreq);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);

  const result = new Float32Array(samples.length);
  result[0] = samples[0];

  for (let i = 1; i < samples.length; i++) {
    result[i] = result[i - 1] + alpha * (samples[i] - result[i - 1]);
  }

  return result;
}

/**
 * Normalize audio to a target peak level
 */
export function normalizeAudio(
  samples: Float32Array,
  targetPeak: number = 0.9
): Float32Array {
  // Find the current peak
  let maxAbs = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAbs) maxAbs = abs;
  }

  // Avoid division by zero
  if (maxAbs === 0) return samples;

  // Calculate gain and apply
  const gain = targetPeak / maxAbs;
  const result = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    result[i] = samples[i] * gain;
  }

  return result;
}

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window;
}

/**
 * Check if MediaRecorder is supported
 */
export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && 'MediaRecorder' in window;
}

/**
 * Check if SpeechRecognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Check if SpeechSynthesis (TTS) is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Get supported audio constraints for getUserMedia
 */
export function getAudioConstraints(
  config: Partial<PCMEncoderConfig> = {}
): MediaTrackConstraints {
  return {
    channelCount: config.channels || 1,
    sampleRate: config.sampleRate || 16000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
}
