import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { NavigationButtons } from '../../components/ui/NavigationButtons';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { DebugInfo } from '../../components/ui/DebugInfo';
import { themes } from '../themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { cn } from '../../lib/utils';

interface PageByPageLayoutProps {
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
  showPageLocationHeader? : boolean;
}

export const PageByPageLayout: React.FC<PageByPageLayoutProps> = ({
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
  enableDebug = false,
  showPageLocationHeader = false,
}) => {
  // Enable debug mode for development
  const showDebug = process.env.NODE_ENV !== 'production';

  const {
    currentPage,
    totalPages,
    values,
    setValue,
    errors,
    goToNextPage,
    goToPreviousPage,
    isFirstPage,
    isLastPage,
    submit,
    isValid,
    theme
  } = useSurveyForm();

  const themeConfig = theme ?? themes.default;
  const containerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the top of the container when page changes
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [currentPage, autoScroll]);

  // Auto-focus first input when page changes
  useEffect(() => {
    if (autoFocus && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 300); // Small delay to ensure the page has rendered
    }
  }, [currentPage, autoFocus]);

  // Get the current page blocks from the surveyData in context
  const { getSurveyPages } = require('../../utils/surveyUtils');
  const { surveyData } = useSurveyForm();
  const pages = getSurveyPages(surveyData.rootNode);
  const currentPageBlocks = currentPage < pages.length ? pages[currentPage] : [];

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  // Find the page title (either from the first block or default)
  const pageTitle = currentPageBlocks[0]?.name || `Page ${currentPage + 1}`;

  // Apply dark mode styling
  const isDarkMode = theme.name === 'dark';

  return (
    <div className="survey-page-by-page-layout" ref={containerRef}>
      {/* Progress bar */}
      {progressBar && currentPage >= 0 && (
        <ProgressBar
          currentPage={currentPage}
          totalPages={totalPages}
          options={typeof progressBar === 'object' ? progressBar : undefined}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="survey-form">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className={cn("border", isDarkMode && "bg-card text-card-foreground border-border")}>
              <CardHeader>
              {showPageLocationHeader &&
                <CardTitle>{pageTitle}</CardTitle>
              }
              </CardHeader>

              <CardContent>
                {/* Page content */}
                <div className="survey-page-content space-y-6">
                  {currentPageBlocks.map((block, index) => (
                    <BlockRenderer
                      key={block.uuid || `block-${index}`}
                      block={block}
                      value={block.fieldName ? values[block.fieldName] : undefined}
                      onChange={(value) => {
                        if (block.fieldName) setValue(block.fieldName, value);
                        if (block.autoContinueOnSelect) {
                          goToNextPage();
                        }
                      }}
                      error={block.fieldName ? errors[block.fieldName] : undefined}
                      ref={index === 0 ? firstInputRef : undefined}
                      theme={theme}
                    />
                  ))}
                </div>

                {/* Debug information */}
                <DebugInfo show={enableDebug} />

                {/* Navigation buttons */}
                <div className="mt-6">
                  <NavigationButtons
                    onPrevious={!isFirstPage ? goToPreviousPage : undefined}
                    onNext={!isLastPage ? goToNextPage : undefined}
                    onSubmit={isLastPage ? submit : undefined}
                    isValid={isValid}
                    options={{
                      ...navigationButtons,
                      showNext:
                        navigationButtons?.showNext !== false &&
                        currentPageBlocks[0]?.showContinueButton !== false,
                    }}
                    submitText={submitText}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
};
