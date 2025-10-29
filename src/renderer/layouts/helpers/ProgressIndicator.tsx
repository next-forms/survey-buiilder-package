import React from 'react';
import { motion } from 'framer-motion';
import { useSurveyForm } from '../../../context/SurveyFormContext';
import { cn } from '../../../lib/utils';

interface ProgressIndicatorProps {
  /**
   * Type of progress indicator
   */
  type?: 'bar' | 'dots' | 'numbers' | 'percentage' | 'steps';
  /**
   * Show percentage text
   */
  showPercentage?: boolean;
  /**
   * Show step info (e.g., "Question 1 of 5")
   */
  showStepInfo?: boolean;
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * Custom color for the progress bar
   */
  color?: string;
  /**
   * Background color for the progress bar
   */
  backgroundColor?: string;
  /**
   * Height of the progress bar
   */
  height?: string | number;
  /**
   * Enable animation
   */
  animate?: boolean;
  /**
   * Custom render function for the progress indicator
   */
  render?: (props: {
    progress: number;
    currentStep: number;
    totalSteps: number;
  }) => React.ReactNode;
}

/**
 * ProgressIndicator Component
 *
 * Automatically renders a progress indicator based on the current survey progress.
 * Supports multiple visualization types.
 *
 * @example
 * ```tsx
 * // Simple progress bar
 * <ProgressIndicator />
 *
 * // With percentage and step info
 * <ProgressIndicator
 *   type="bar"
 *   showPercentage
 *   showStepInfo
 * />
 *
 * // Dots indicator
 * <ProgressIndicator type="dots" />
 *
 * // Custom render
 * <ProgressIndicator
 *   render={({ progress, currentStep, totalSteps }) => (
 *     <div>Custom progress: {progress}%</div>
 *   )}
 * />
 * ```
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  type = 'bar',
  showPercentage = false,
  showStepInfo = false,
  className,
  color,
  backgroundColor,
  height = '8px',
  animate = true,
  render,
}) => {
  const {
    currentPage,
    totalPages,
    getActualProgress,
    getTotalVisibleSteps,
    getCurrentStepPosition,
    theme,
  } = useSurveyForm();

  // Calculate progress
  const progressPercentage = getActualProgress();
  const currentStepPosition = getCurrentStepPosition();
  const totalVisibleSteps = getTotalVisibleSteps();

  // Use custom render if provided
  if (render) {
    return (
      <div className={className}>
        {render({
          progress: progressPercentage,
          currentStep: currentStepPosition + 1,
          totalSteps: totalVisibleSteps,
        })}
      </div>
    );
  }

  // Default colors from theme
  const progressColor = color || theme?.progress?.bar || 'bg-blue-600';
  const bgColor = backgroundColor || 'bg-gray-200';

  return (
    <div className={cn('w-full', className)}>
      {/* Step Info */}
      {showStepInfo && (
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span className="font-medium">
            Question {currentPage + 1} of {totalPages}
          </span>
          {showPercentage && (
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {type === 'bar' && (
        <div
          className={cn('w-full rounded-full overflow-hidden', bgColor)}
          style={{ height }}
        >
          {animate ? (
            <motion.div
              className={cn('h-full transition-all duration-500 ease-out rounded-full', progressColor)}
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
            />
          ) : (
            <div
              className={cn('h-full rounded-full', progressColor)}
              style={{ width: `${progressPercentage}%` }}
            />
          )}
        </div>
      )}

      {/* Dots Indicator */}
      {type === 'dots' && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalVisibleSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-300',
                i <= currentStepPosition ? progressColor : bgColor
              )}
            />
          ))}
        </div>
      )}

      {/* Numbers Indicator */}
      {type === 'numbers' && (
        <div className="text-center text-sm text-gray-600">
          <span className="font-medium">
            {currentStepPosition + 1} / {totalVisibleSteps}
          </span>
        </div>
      )}

      {/* Percentage Only */}
      {type === 'percentage' && (
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-800">
            {Math.round(progressPercentage)}%
          </span>
          <span className="text-sm text-gray-500 ml-2">complete</span>
        </div>
      )}

      {/* Steps Indicator */}
      {type === 'steps' && (
        <div className="flex items-center justify-between">
          {Array.from({ length: totalPages }, (_, i) => (
            <React.Fragment key={i}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300',
                  i <= currentPage
                    ? `${progressColor} text-white`
                    : `${bgColor} text-gray-500`
                )}
              >
                {i + 1}
              </div>
              {i < totalPages - 1 && (
                <div className={cn('flex-1 h-1', i < currentPage ? progressColor : bgColor)} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Percentage text below (when not showStepInfo) */}
      {showPercentage && !showStepInfo && (
        <div className="text-center text-xs text-gray-500 mt-2">
          {Math.round(progressPercentage)}% complete
        </div>
      )}
    </div>
  );
};
