import React from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { themes } from '../../themes';

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  options?: {
    type?: 'bar' | 'dots' | 'numbers' | 'percentage';
    showPercentage?: boolean;
    showStepInfo?: boolean;
    showStepTitles?: boolean;
    showStepNumbers?: boolean;
    position?: 'top' | 'bottom';
    color?: string;
    backgroundColor?: string;
    height?: number | string;
    animation?: boolean;
  };
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentPage,
  totalPages,
  options = {
    type: 'bar',
    showPercentage: true,
    showStepInfo: true,
    position: 'top',
    animation: true,
  },
}) => {
  const { theme } = useSurveyForm();
  const themeConfig = theme ?? themes.default;

  const {
    type = 'bar',
    showPercentage = true,
    showStepInfo = true,
    showStepTitles = false,
    showStepNumbers = true,
    position = 'top',
    color = themeConfig.colors.primary,
    backgroundColor = themeConfig.colors.border,
    height = '8px',
    animation = true,
  } = options;

  // Calculate progress percentage - safely handle edge cases
  const progress = totalPages <= 1
    ? 100 // If there's only one page, progress is 100%
    : Math.max(0, Math.min(100, (currentPage / (totalPages - 1)) * 100));

  // Generate the wrapper classes based on position
  const wrapperClass = `survey-progress-wrapper ${position === 'bottom' ? 'mt-6 mb-2' : 'mb-6 mt-2'}`;

  // Render the appropriate progress indicator based on type
  const renderProgressIndicator = () => {
    switch (type) {
      case 'dots':
        return (
          <div className={themeConfig.progress.dots}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`h-3 w-3 rounded-full ${
                  index <= currentPage
                    ? 'bg-primary-600'
                    : 'bg-gray-200'
                }`}
                style={{
                  backgroundColor: index <= currentPage ? color : backgroundColor,
                  transition: animation ? 'background-color 0.3s ease' : 'none',
                }}
              />
            ))}
          </div>
        );
      case 'numbers':
        return (
          <div className={themeConfig.progress.numbers}>
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                  index <= currentPage
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                style={{
                  backgroundColor: index <= currentPage ? color : backgroundColor,
                  transition: animation ? 'background-color 0.3s ease' : 'none',
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
        );
      case 'percentage':
        return (
          <div className="text-center text-lg font-bold">
            {Math.round(progress)}%
          </div>
        );
      case 'bar':
      default:
        return (
          <div
            className={themeConfig.progress.bar}
            style={{ height }}
          >
            <div
              className="bg-primary-600 h-full"
              style={{
                width: `${progress}%`,
                backgroundColor: color,
                transition: animation ? 'width 0.3s ease' : 'none',
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className={wrapperClass}>
      {/* Show step info (Page X of Y) */}
      {showStepInfo && (
        <div className="flex justify-between mb-1">
          <span className={themeConfig.progress.label}>
            {showStepNumbers && (
              <>
                Page {currentPage + 1} of {totalPages}
              </>
            )}
          </span>
          {showPercentage && type !== 'percentage' && (
            <span className={themeConfig.progress.percentage}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress indicator */}
      {renderProgressIndicator()}
    </div>
  );
};
