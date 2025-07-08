import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { NavigationButtons } from '../../components/ui/NavigationButtons';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { themes } from '../../themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { DebugInfo } from '../../components/ui/DebugInfo';

interface ContinuousLayoutProps {
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
  enableDebug?: boolean,
}

export const ContinuousLayout: React.FC<ContinuousLayoutProps> = ({
  progressBar = true,
  navigationButtons = {
    showPrevious: false,
    showNext: false,
    showSubmit: true,
    submitText: 'Submit',
    position: 'bottom',
    align: 'center',
    style: 'default',
  },
  autoScroll = true,
  autoFocus = false,
  showSummary = false,
  submitText = 'Submit',
  enableDebug = false,
}) => {
  // Enable debug mode for development
  const showDebug = process.env.NODE_ENV !== 'production';

  const {
    values,
    setValue,
    errors,
    submit,
    isValid,
    theme
  } = useSurveyForm();

  const themeConfig = theme ?? themes.default;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all survey pages from the surveyData in context
  const { getSurveyPages } = require('../../utils/surveyUtils');
  const { surveyData } = useSurveyForm();
  const pages = getSurveyPages(surveyData.rootNode);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Apply dark mode styling
  const isDarkMode = theme.name === 'dark';

  return (
    <div className="survey-continuous-layout" ref={containerRef}>
      {/* Progress bar */}
      {progressBar && (
        <ProgressBar
          currentPage={0}
          totalPages={1}
          options={typeof progressBar === 'object' ? progressBar : undefined}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="survey-form">
        <Card className={cn("border", isDarkMode && "bg-card text-card-foreground border-border")}>
          <CardContent className="pt-6">
            {/* Content - all pages in one continuous scroll */}
            <div className="survey-continuous-content space-y-10">
              {pages.map((pageBlocks, pageIndex) => (
                <div key={`page-${pageIndex}`} className="space-y-8">
                  {/* Section header if available */}
                  {pageBlocks[0]?.name && (
                    <div className="mb-4">
                      <CardTitle className="text-xl">{pageBlocks[0].name}</CardTitle>
                      {pageBlocks[0]?.description && (
                        <CardDescription className="mt-1">{pageBlocks[0].description}</CardDescription>
                      )}
                    </div>
                  )}

                  {/* Blocks for this page */}
                  <div className="space-y-6">
                    {pageBlocks.map((block, blockIndex) => (
                      <BlockRenderer
                        key={block.uuid || `block-${pageIndex}-${blockIndex}`}
                        block={block}
                        value={block.fieldName ? values[block.fieldName] : undefined}
                        onChange={(value) => block.fieldName && setValue(block.fieldName, value)}
                        error={block.fieldName ? errors[block.fieldName] : undefined}
                        theme={theme}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Debug information */}
            <DebugInfo show={enableDebug} />

            {/* Submit button */}
            <div className="mt-6">
              <NavigationButtons
                onSubmit={submit}
                isValid={isValid}
                options={{
                  ...navigationButtons,
                  showPrevious: false,
                  showNext: false,
                  showSubmit: true,
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