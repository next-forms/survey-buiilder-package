'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import { VoiceOrb } from './VoiceOrb';
import { AnimatedText } from './AnimatedText';
import { AmbientProgressLine } from './AmbientProgress';
import type { OrbScreenProps } from '../types';

/**
 * OrbScreen Component
 *
 * Full-screen immersive view for when the AI is speaking.
 * Features a large centered orb with pulsating animation and
 * typewriter text animation for the spoken question.
 * Uses a clean, light white theme.
 */
export const OrbScreen: React.FC<OrbScreenProps> = ({
  questionText,
  isSpeaking,
  voiceState,
  onSkip,
  currentStep,
  totalSteps,
  theme,
  orbStyle = 'breathe',
  volume = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 flex flex-col"
    >
      {/* Clean light background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-gray-100">
        {/* Subtle animated gradient overlay */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Subtle decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-100/20 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Large centered orb */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <VoiceOrb
            state={voiceState}
            theme={theme}
            style={orbStyle}
            size="xxl"
            volume={volume}
            className="cursor-default"
          />
        </motion.div>

        {/* Question text with typewriter animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-2xl text-center"
        >
          {questionText ? (
            <AnimatedText
              text={questionText}
              speed={isSpeaking ? 40 : 20}
              className="text-2xl md:text-3xl font-light leading-relaxed text-gray-800"
            />
          ) : (
            <div className="h-12 flex items-center justify-center">
              <motion.div
                className="flex gap-2"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Skip button - only show for long questions */}
        {isSpeaking && questionText && questionText.length > 50 && onSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={onSkip}
            className={cn(
              'mt-8 px-4 py-2 text-sm text-gray-500 hover:text-gray-700',
              'border border-gray-300 hover:border-gray-400 rounded-full',
              'transition-colors duration-200 bg-white/50 backdrop-blur-sm'
            )}
          >
            Skip speaking
          </motion.button>
        )}
      </div>

      {/* Bottom progress area */}
      <div className="relative z-10 px-6 pb-8">
        <div className="max-w-md mx-auto">
          <AmbientProgressLine
            currentStep={currentStep}
            totalSteps={totalSteps}
            theme={theme}
            className="mb-4"
          />
          <p className="text-center text-sm text-gray-500">
            Question {currentStep + 1} of {totalSteps}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

OrbScreen.displayName = 'OrbScreen';
