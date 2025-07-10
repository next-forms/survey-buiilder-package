/**
 * Debug utility for conditional logging based on enableDebug flag
 */

import { useContext } from 'react';
import { SurveyBuilderContext } from '../context/SurveyBuilderContext';
import { SurveyFormContext } from '../context/SurveyFormContext';

export interface DebugLogger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
}

/**
 * Creates a debug logger that only logs when enableDebug is true
 */
export function createDebugLogger(enableDebug: boolean): DebugLogger {
  return {
    log: (...args: any[]) => {
      if (enableDebug) {
        console.log(...args);
      }
    },
    error: (...args: any[]) => {
      if (enableDebug) {
        console.error(...args);
      }
    },
    warn: (...args: any[]) => {
      if (enableDebug) {
        console.warn(...args);
      }
    },
    info: (...args: any[]) => {
      if (enableDebug) {
        console.info(...args);
      }
    }
  };
}

/**
 * A simple debug function that can be used directly
 */
export function debugLog(enableDebug: boolean, ...args: any[]) {
  if (enableDebug) {
    console.log(...args);
  }
}

/**
 * Debug error function
 */
export function debugError(enableDebug: boolean, ...args: any[]) {
  if (enableDebug) {
    console.error(...args);
  }
}

/**
 * Debug warn function
 */
export function debugWarn(enableDebug: boolean, ...args: any[]) {
  if (enableDebug) {
    console.warn(...args);
  }
}

/**
 * Debug info function
 */
export function debugInfo(enableDebug: boolean, ...args: any[]) {
  if (enableDebug) {
    console.info(...args);
  }
}

/**
 * Hook to get debug logger from SurveyBuilderContext
 */
export function useBuilderDebug(): DebugLogger {
  const context = useContext(SurveyBuilderContext);
  const enableDebug = context?.state?.enableDebug || false;
  return createDebugLogger(enableDebug);
}

/**
 * Hook to get debug logger from SurveyFormContext
 */
export function useFormDebug(): DebugLogger {
  const context = useContext(SurveyFormContext);
  const enableDebug = context?.enableDebug || false;
  return createDebugLogger(enableDebug);
}