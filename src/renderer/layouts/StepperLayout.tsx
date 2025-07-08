import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { NavigationButtons } from '../../components/ui/NavigationButtons';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { themes } from '../../themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DebugInfo } from '../../components/ui/DebugInfo';
import { cn } from '../../lib/utils';
import { CheckIcon } from 'lucide-react';

interface StepperLayoutProps {
  progressBar?: boolean | {
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
  navigationButtons?: {
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
  autoScroll?: boolean;
  autoFocus?: boolean;
  showSummary?: boolean;
  submitText?: string;
  enableDebug?: boolean;
}

export const StepperLayout: React.FC<StepperLayoutProps> = ({
  progressBar = true,
  navigationButtons = {
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
  autoScroll = true,
  autoFocus = true,
  showSummary = false,
  submitText = 'Submit',
  enableDebug = false
}) => {
  // Enable debug mode for development
  const showDebug = process.env.NODE_ENV !== 'production';

  const {
    currentPage,
    currentBlockIndex,
    totalPages,
    values,
    setValue,
    errors,
    goToNextBlock,
    goToPreviousBlock,
    isFirstPage,
    isLastPage,
    submit,
    isValid,
    theme,
    goToPage,
    surveyData
  } = useSurveyForm();

  const themeConfig = theme ?? themes.default;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all survey pages
  const { getSurveyPages } = require('../../utils/surveyUtils');
  const pages = getSurveyPages(surveyData.rootNode);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Apply dark mode styling
  const isDarkMode = theme.name === 'dark';

  return (
    <div className="survey-stepper-layout" ref={containerRef}>
      {/* Page tabs/steps */}
      <div className="survey-stepper-tabs mb-6">
        <div className="flex items-center justify-center flex-wrap gap-2">
          {pages.map((pageBlocks, index) => {
            const isActive = index === currentPage;
            const isCompleted = index < currentPage;

            // Get the step title
            const stepTitle = pageBlocks[0]?.name || `Step ${index + 1}`;

            return (
              <div
                key={`step-${index}`}
                className="flex items-center"
              >
                <Button
                  variant={isActive ? "default" : isCompleted ? "outline" : "secondary"}
                  size="sm"
                  className={cn(
                    "h-9 rounded-full flex items-center mr-1",
                    isCompleted && "bg-primary/10 hover:bg-primary/20"
                  )}
                  onClick={() => goToPage(index)}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs mr-1">
                      {index + 1}
                    </span>
                  )}
                  {pageBlocks[0]?.name && (
                    <span className="hidden sm:inline-block text-sm">
                      {stepTitle}
                    </span>
                  )}
                </Button>

                {/* Connector line */}
                {index < pages.length - 1 && (
                  <div
                    className={cn(
                      "hidden sm:block w-8 h-0.5",
                      index < currentPage ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="survey-form">
        <Card className={cn("border", isDarkMode && "bg-card text-card-foreground border-border")}>
          {/* Page header */}
          {pages[currentPage] && pages[currentPage][0]?.name && (
            <CardHeader>
              <CardTitle>{pages[currentPage][0].name}</CardTitle>
              {pages[currentPage][0]?.description && (
                <CardDescription>{pages[currentPage][0].description}</CardDescription>
              )}
            </CardHeader>
          )}

          <CardContent>
            {/* Page content */}
            <div className="survey-page-content space-y-6">
              {pages[currentPage] && pages[currentPage][currentBlockIndex] && (
                <BlockRenderer
                  key={pages[currentPage][currentBlockIndex].uuid || `block-${currentBlockIndex}`}
                  block={pages[currentPage][currentBlockIndex]}
                  value={pages[currentPage][currentBlockIndex].fieldName ? values[pages[currentPage][currentBlockIndex].fieldName as string] : undefined}
                  onChange={(value) => {
                    const currentBlock = pages[currentPage][currentBlockIndex];
                    const field = currentBlock.fieldName;
                    if (field) setValue(field, value);
                    if (currentBlock.autoContinueOnSelect) {
                      goToNextBlock();
                    }
                  }}
                  error={pages[currentPage][currentBlockIndex].fieldName ? errors[pages[currentPage][currentBlockIndex].fieldName as string] : undefined}
                  theme={theme}
                />
              )}
            </div>

            {/* Debug information */}
            <DebugInfo show={enableDebug} />

            {/* Navigation buttons */}
            <div className="mt-6">
              <NavigationButtons
                onPrevious={!isFirstPage || currentBlockIndex > 0 ? goToPreviousBlock : undefined}
                onNext={goToNextBlock}
                onSubmit={isLastPage && currentBlockIndex === pages[currentPage].length - 1 ? submit : undefined}
                isValid={isValid}
                options={{
                  ...navigationButtons,
                  showNext:
                    navigationButtons?.showNext !== false &&
                    pages[currentPage][currentBlockIndex]?.showContinueButton !== false,
                }}
                submitText={submitText}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
