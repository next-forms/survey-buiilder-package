import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import type { VoiceOrbProps } from '../types';

/**
 * VoiceOrb Component
 *
 * A visual indicator that shows the current voice state through
 * animated effects. Supports multiple animation styles.
 */
export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  theme,
  style = 'pulse',
  size = 'md',
  onClick,
  className,
  volume = 0,
  asDiv = false,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    xxl: 'w-64 h-64',
  };

  const innerSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    xxl: 'w-52 h-52',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    xxl: 'w-20 h-20',
  };

  // Determine colors based on state
  const getStateColors = () => {
    switch (state) {
      case 'listening':
        return {
          outer: 'bg-blue-500/20',
          inner: 'bg-blue-500',
          glow: 'shadow-blue-500/50',
        };
      case 'processing':
        return {
          outer: 'bg-amber-500/20',
          inner: 'bg-amber-500',
          glow: 'shadow-amber-500/50',
        };
      case 'speaking':
        return {
          outer: 'bg-green-500/20',
          inner: 'bg-green-500',
          glow: 'shadow-green-500/50',
        };
      case 'error':
        return {
          outer: 'bg-red-500/20',
          inner: 'bg-red-500',
          glow: 'shadow-red-500/50',
        };
      case 'visual_input':
        return {
          outer: 'bg-purple-500/20',
          inner: 'bg-purple-500',
          glow: 'shadow-purple-500/50',
        };
      case 'complete':
        return {
          outer: 'bg-green-500/20',
          inner: 'bg-green-500',
          glow: 'shadow-green-500/50',
        };
      default:
        return {
          outer: 'bg-gray-300/20 dark:bg-gray-600/20',
          inner: 'bg-gray-400 dark:bg-gray-500',
          glow: 'shadow-gray-400/30',
        };
    }
  };

  const colors = getStateColors();

  // Animation variants based on style and state
  const getPulseAnimation = () => {
    if (state === 'idle') return {};
    if (state === 'listening') {
      return {
        scale: [1, 1.15, 1],
        opacity: [0.3, 0.6, 0.3],
      };
    }
    if (state === 'processing') {
      return {
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      };
    }
    if (state === 'speaking') {
      return {
        scale: [1, 1.08, 1],
      };
    }
    return {};
  };

  const getWaveAnimation = () => {
    if (state === 'idle') return {};
    return {
      scale: [1, 1.3, 1],
      opacity: [0.5, 0, 0.5],
    };
  };

  // Breathe animation - gentle, organic pulsation like breathing
  const getBreatheAnimation = () => {
    if (state === 'idle') return {};
    // Scale animation responds to volume for audio-reactive effect
    const baseScale = state === 'speaking' ? 1 + volume * 0.15 : 1;
    if (state === 'listening') {
      return {
        scale: [baseScale, baseScale * 1.1, baseScale],
        opacity: [0.4, 0.7, 0.4],
      };
    }
    if (state === 'speaking') {
      return {
        scale: [baseScale * 0.95, baseScale * 1.1, baseScale * 0.95],
        opacity: [0.5, 0.8, 0.5],
      };
    }
    return {
      scale: [1, 1.05, 1],
      opacity: [0.3, 0.5, 0.3],
    };
  };

  const renderIcon = () => {
    switch (state) {
      case 'listening':
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white')}
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
        );
      case 'processing':
        return (
          <motion.svg
            className={cn(iconSizeClasses[size], 'text-white')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
          </motion.svg>
        );
      case 'speaking':
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <motion.path
              d="M19.07 4.93a10 10 0 0 1 0 14.14"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
            />
            <motion.path
              d="M15.54 8.46a5 5 0 0 1 0 7.07"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: 0.2,
              }}
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'complete':
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'visual_input':
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        );
      default:
        return (
          <svg
            className={cn(iconSizeClasses[size], 'text-white/70')}
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
        );
    }
  };

  const isActive = state !== 'idle' && state !== 'complete';

  const containerClassName = cn(
    'relative flex items-center justify-center',
    sizeClasses[size],
    'rounded-full',
    !asDiv && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
    !asDiv && 'transition-transform hover:scale-105 active:scale-95',
    className
  );

  const content = (
    <>
      {/* Outer ring animations */}
      {style === 'pulse' && isActive && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            colors.outer
          )}
          animate={getPulseAnimation()}
          transition={{
            duration: state === 'listening' ? 1.5 : 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {style === 'wave' && isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'absolute inset-0 rounded-full',
                colors.outer
              )}
              animate={getWaveAnimation()}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </>
      )}

      {style === 'glow' && isActive && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full blur-md',
            colors.inner,
            colors.glow
          )}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Breathe style - multiple soft rings with organic animation */}
      {style === 'breathe' && isActive && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'absolute rounded-full',
                i === 0 ? 'inset-0' : i === 1 ? 'inset-[-12%]' : 'inset-[-24%]',
                colors.outer,
                'blur-sm'
              )}
              animate={getBreatheAnimation()}
              transition={{
                duration: state === 'speaking' ? 1.2 : 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
          {/* Extra glow layer for depth */}
          <motion.div
            className={cn(
              'absolute inset-[-40%] rounded-full blur-2xl',
              colors.outer
            )}
            animate={{
              opacity: [0.1, 0.25, 0.1],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      {/* Inner orb */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          innerSizeClasses[size],
          colors.inner,
          isActive && 'shadow-lg',
          isActive && colors.glow
        )}
        animate={
          state === 'listening'
            ? { scale: [1, 1.05, 1] }
            : state === 'speaking'
            ? { scale: [1, 1.03, 1] }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: state === 'listening' || state === 'speaking' ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {renderIcon()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </>
  );

  if (asDiv) {
    return (
      <div className={containerClassName} role="img" aria-label={`Voice control - ${state}`}>
        {content}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={containerClassName}
      aria-label={`Voice control - ${state}`}
      type="button"
    >
      {content}
    </button>
  );
};

VoiceOrb.displayName = 'VoiceOrb';
