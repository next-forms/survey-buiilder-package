import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import type { AmbientProgressProps } from '../types';

/**
 * AmbientProgress Component
 *
 * A subtle, ambient progress indicator that doesn't distract from
 * the voice conversation. Uses soft visual cues rather than
 * traditional progress bars.
 */
export const AmbientProgress: React.FC<AmbientProgressProps> = ({
  currentStep,
  totalSteps,
  theme,
  className,
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={cn('relative', className)}>
      {/* Subtle dot indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.min(totalSteps, 10) }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const stepIndex = Math.floor((index / Math.min(totalSteps, 10)) * totalSteps);

          return (
            <motion.div
              key={index}
              className={cn(
                'rounded-full transition-all duration-300',
                isCurrent
                  ? 'w-2.5 h-2.5'
                  : 'w-1.5 h-1.5',
                isCompleted
                  ? 'bg-green-500/60'
                  : isCurrent
                  ? 'bg-blue-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
              initial={false}
              animate={{
                scale: isCurrent ? [1, 1.2, 1] : 1,
                opacity: isCurrent ? 1 : isCompleted ? 0.8 : 0.4,
              }}
              transition={{
                scale: {
                  duration: 1,
                  repeat: isCurrent ? Infinity : 0,
                  ease: 'easeInOut',
                },
              }}
            />
          );
        })}

        {/* Show "..." if more than 10 steps */}
        {totalSteps > 10 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
            +{totalSteps - 10}
          </span>
        )}
      </div>

      {/* Ambient glow based on progress */}
      <div className="absolute -inset-2 -z-10 opacity-30">
        <motion.div
          className={cn(
            'h-full rounded-full blur-xl',
            theme?.colors?.primary
              ? `bg-[${theme.colors.primary}]`
              : 'bg-blue-500'
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step counter (optional - can be hidden) */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>
    </div>
  );
};

/**
 * Minimal variant - just a thin line
 */
export const AmbientProgressLine: React.FC<AmbientProgressProps> = ({
  currentStep,
  totalSteps,
  theme,
  className,
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={cn('relative h-0.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', className)}>
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          theme?.colors?.primary
            ? `bg-[${theme.colors.primary}]`
            : 'bg-blue-500'
        )}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Subtle shimmer effect */}
      <motion.div
        className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['0%', '400%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

/**
 * Circle variant - progress shown as a ring
 */
export const AmbientProgressRing: React.FC<AmbientProgressProps & { size?: number }> = ({
  currentStep,
  totalSteps,
  theme,
  className,
  size = 40,
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme?.colors?.primary || '#3B82F6'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

AmbientProgress.displayName = 'AmbientProgress';
AmbientProgressLine.displayName = 'AmbientProgressLine';
AmbientProgressRing.displayName = 'AmbientProgressRing';
