'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { BlockRenderer } from '../../../renderers/BlockRenderer';
import { AmbientProgressLine } from './AmbientProgress';
import type { InputScreenProps } from '../types';

/**
 * InputScreen Component
 *
 * User input collection screen that displays the block renderer
 * for full form input capabilities. Includes option for voice input.
 * Uses a clean, light white theme for better readability.
 */
export const InputScreen: React.FC<InputScreenProps> = ({
  block,
  questionText,
  value,
  onChange,
  onSubmit,
  onVoiceInput,
  onBack,
  currentStep,
  totalSteps,
  theme,
  disabled = false,
  error,
  isListening = false,
  interimTranscript,
  isValid = true,
}) => {
  // Determine if continue button should be enabled
  // Use isValid from context (which checks block validation rules)
  // Also require a value to be present (not undefined, null, or empty string for simple values)
  const hasValue = value !== undefined && value !== null && value !== '';
  const canSubmit = isValid && hasValue && !disabled;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(value);
    }
  };

  // Handle keyboard shortcut for submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'textarea') {
      e.preventDefault();
      if (canSubmit) {
        onSubmit(value);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 flex flex-col bg-gradient-to-b from-gray-50 to-white"
    >
      {/* Header with question context */}
      <div className="relative z-10 px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          {onBack && currentStep > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className={cn(
                'mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700',
                'transition-colors duration-200'
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </motion.button>
          )}

          {/* Question text as context */}
          {questionText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl font-light text-gray-800 mb-2"
            >
              {questionText}
            </motion.p>
          )}

          {/* Progress */}
          <AmbientProgressLine
            currentStep={currentStep}
            totalSteps={totalSteps}
            theme={theme}
            className="mt-4"
          />
        </div>
      </div>

      {/* Main input area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="max-w-2xl mx-auto"
        >
          {/* Block renderer with light theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'bg-white rounded-xl p-6 border border-gray-200 shadow-sm',
              '[&_label]:text-gray-700 [&_label]:font-medium',
              '[&_input]:bg-gray-50 [&_input]:border-gray-300 [&_input]:text-gray-900',
              '[&_input]:placeholder:text-gray-400',
              '[&_input:focus]:border-blue-500 [&_input:focus]:ring-blue-500/20',
              '[&_textarea]:bg-gray-50 [&_textarea]:border-gray-300 [&_textarea]:text-gray-900',
              '[&_textarea]:placeholder:text-gray-400',
              '[&_select]:bg-gray-50 [&_select]:border-gray-300 [&_select]:text-gray-900',
              '[&_[role="radiogroup"]]:text-gray-700',
              '[&_[role="radio"]]:border-gray-400',
              '[&_[data-state="checked"]]:bg-blue-500 [&_[data-state="checked"]]:border-blue-500',
              '[&_.text-muted-foreground]:text-gray-500',
              '[&_.text-destructive]:text-red-500'
            )}
          >
            <BlockRenderer
              block={block}
              value={value}
              onChange={onChange}
              error={error}
              disabled={disabled}
              theme={theme}
            />
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-red-500 text-center"
            >
              {error}
            </motion.p>
          )}

          {/* Interim transcript when listening */}
          {isListening && interimTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
            >
              <p className="text-gray-600 italic text-center">
                "{interimTranscript}"
              </p>
            </motion.div>
          )}
        </form>
      </div>

      {/* Bottom action area */}
      <div className="relative z-10 px-6 pb-6 pt-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Voice input button - no nested buttons */}
            {onVoiceInput && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onClick={onVoiceInput}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full',
                  'text-sm font-medium transition-all duration-200',
                  isListening
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                )}
              >
                {/* Inline mic icon instead of nested VoiceOrb button */}
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isListening ? 'bg-blue-400' : 'bg-gray-200'
                )}>
                  <svg
                    className={cn('w-4 h-4', isListening ? 'text-white' : 'text-gray-500')}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </span>
                {isListening ? 'Listening...' : 'Tap to speak'}
              </motion.button>
            )}

            {/* Submit button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              type="submit"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex-1 max-w-xs ml-auto px-6 py-3 rounded-full',
                'text-sm font-semibold transition-all duration-200',
                'bg-blue-500 text-white hover:bg-blue-600',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              Continue
            </motion.button>
          </div>

          {/* Keyboard hint */}
          <p className="mt-3 text-xs text-center text-gray-400">
            Press Enter to continue
          </p>
        </div>
      </div>
    </motion.div>
  );
};

InputScreen.displayName = 'InputScreen';
