import React from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { themes } from '../../themes';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

interface NavigationButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isValid?: boolean;
  options?: {
    showPrevious?: boolean;
    showNext?: boolean;
    showSubmit?: boolean;
    previousText?: string;
    nextText?: string;
    submitText?: string;
    position?: 'bottom' | 'split';
    align?: 'left' | 'center' | 'right';
    style?: 'default' | 'outlined' | 'text';
  };
  submitText?: string;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onPrevious,
  onNext,
  onSubmit,
  isValid = true,
  options = {
    showPrevious: true,
    showNext: true,
    showSubmit: true,
    previousText: 'Previous',
    nextText: 'Next',
    submitText: 'Submit',
    position: 'bottom',
    align: 'center',
    style: 'default',
  },
  submitText = 'Submit',
}) => {
  const { theme } = useSurveyForm();
  const themeConfig = theme ?? themes.default;
  const isDarkMode = theme.name === 'dark';

  const {
    showPrevious = true,
    showNext = true,
    showSubmit = true,
    previousText = 'Previous',
    nextText = 'Next',
    position = 'bottom',
    align = 'center',
    style = 'default',
  } = options;

  // If all buttons would be hidden, don't render the container
  if (!showPrevious && !showNext && !showSubmit) {
    return null;
  }

  // Determine button variant based on style prop
  const getPrimaryVariant = () => {
    if (style === 'outlined') return 'outline';
    if (style === 'text') return 'ghost';
    return 'default';
  };

  const getSecondaryVariant = () => {
    if (style === 'text') return 'ghost';
    return 'outline';
  };

  // Determine container alignment
  const alignmentClass =
    align === 'left'
      ? 'justify-start'
      : align === 'right'
        ? 'justify-end'
        : 'justify-center';

  // Container class for button positioning
  const containerClass = cn(
    "flex items-center gap-4 mt-6",
    position === 'split' ? 'justify-between' : alignmentClass
  );

  return (
    <div className={containerClass}>
      {/* Previous button */}
      {showPrevious && onPrevious && (
        <Button
          type="button"
          variant={getSecondaryVariant()}
          onClick={onPrevious}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {previousText}
        </Button>
      )}

      {/* Spacer for split positioning */}
      {position === 'split' && <div className="flex-grow" />}

      {/* Next button */}
      {showNext && onNext && (
        <Button
          type="button"
          variant={getPrimaryVariant()}
          onClick={onNext}
          disabled={!isValid}
          className="gap-1"
        >
          {nextText}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}

      {/* Submit button - only show on last page */}
      {showSubmit && onSubmit && (
        <Button
          type="submit"
          variant={getPrimaryVariant()}
          onClick={onSubmit}
          disabled={!isValid}
          className="gap-1"
        >
          {options.submitText || submitText}
          <Send className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
};
