// Enhanced RenderPageSurveyLayout with intake form design styling
import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { ChevronLeft, ArrowRight, History } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSurveyPages, detectSurveyMode } from '../../utils/surveyUtils';
import { AnalyticsTrackedLayout } from './AnalyticsTrackedLayout';

interface RenderPageSurveyLayoutProps {
  progressBar?:
    | boolean
    | {
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
  showNavigationHistory?: boolean;
  logo?: any;
}

export const RenderPageSurveyLayout: React.FC<RenderPageSurveyLayoutProps> = ({
  progressBar = true,
  navigationButtons = {
    showPrevious: true,
    showNext: true,
    showSubmit: true,
    previousText: 'Previous',
    nextText: 'Continue',
    submitText: 'Complete Survey',
    position: 'bottom',
    align: 'center',
    style: 'default',
  },
  autoScroll = true,
  autoFocus = true,
  showSummary = false,
  submitText = 'Complete Survey',
  enableDebug = false,
  showNavigationHistory = false,
  logo = null,
}) => {
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
    surveyData,
    // Enhanced navigation properties
    navigationHistory,
    canGoBack,
    getActualProgress,
    getTotalVisibleSteps,
    getCurrentStepPosition,
    getVisibleBlocks,
    analytics,
  } = useSurveyForm();

  const containerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Detect survey mode and get the current page blocks from the surveyData in context
  const surveyMode = detectSurveyMode(surveyData.rootNode);
  const pages = getSurveyPages(surveyData.rootNode, surveyMode);
  const currentPageBlocks =
    currentPage < pages.length ? pages[currentPage] : [];
  const visibleCurrentPageBlocks = getVisibleBlocks(currentPageBlocks);

  // Auto-focus first input when step changes
  useEffect(() => {
    if (autoFocus && firstInputRef.current) {
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 200);
    }
  }, [currentPage, currentBlockIndex, autoFocus]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentBlock = currentPageBlocks[currentBlockIndex];
    if (currentBlock?.isEndBlock) {
      submit();
    } else if (
      isLastPage &&
      currentBlockIndex === currentPageBlocks.length - 1
    ) {
      submit();
    } else {
      goToNextBlock();
    }
  };

  // Handle previous navigation using history
  const handlePrevious = () => {
    if (canGoBack) {
      goToPreviousBlock();
    }
  };

  // Calculate progress percentage based on actual visible steps completed
  const progressPercentage = getActualProgress();
  const currentStepPosition = getCurrentStepPosition();
  const totalVisibleSteps = getTotalVisibleSteps();

  // Get button text from navigationButtons or fallback
  const continueText = navigationButtons?.nextText || 'Continue';
  const completeText = navigationButtons?.submitText || submitText;
  const showNextButton =
    navigationButtons?.showNext !== false &&
    currentPageBlocks[currentBlockIndex]?.showContinueButton !== false;

  // Debug info (only shown when enableDebug is true)
  const debugInfo = enableDebug
    ? {
        currentPage,
        currentBlockIndex,
        totalPages,
        totalVisibleSteps,
        currentStepPosition,
        progressPercentage: Math.round(progressPercentage),
        navigationHistoryLength: navigationHistory.length,
        canGoBack,
        visibleBlocksInCurrentPage: visibleCurrentPageBlocks.length,
      }
    : null;

  // Get current block for potential disclaimer
  const currentBlock = currentPageBlocks[currentBlockIndex];
  const blockDisclaimer = currentBlock?.disclaimer;

  const layoutContent = (
    <div
      className="survey-fullpage-layout min-h-max flex flex-col w-full p-4 sm:p-8 flex-1"
      ref={containerRef}
    >
      {/* Debug Panel (only visible when enableDebug is true) */}
      {enableDebug && (
        <div className="w-full bg-yellow-50 border-b border-yellow-200 p-2 text-xs">
          <div className="max-w-2xl mx-auto">
            <details className="cursor-pointer">
              <summary className="font-medium text-yellow-800">
                Debug Info
              </summary>
              <pre className="mt-2 text-yellow-700 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Logo Section - Positioned after header */}
      {logo && (
        <div className="w-full flex py-2 border-gray-100 mb-4 mx-auto">
          {logo()}
        </div>
      )}

      {/* Fixed Header Section */}
      <div className="w-full backdrop-blur-sm mx-auto py-4">
        {/* Progress Bar Section */}
        {progressBar &&
          typeof progressBar === 'object' &&
          progressBar.position !== 'bottom' && (
            <div className="mb-3">
              <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200">
                <motion.div
                  className={cn(
                    'h-full transition-all duration-500 ease-out rounded-full',
                    theme.progress.bar || 'bg-[#a55a36]'
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Progress bar type variations */}
              {progressBar.type === 'dots' && (
                <div className="flex justify-center space-x-1 mt-2">
                  {Array.from({ length: totalVisibleSteps }, (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        i <= currentStepPosition
                          ? 'bg-[#E67E4D]'
                          : 'bg-gray-200'
                      )}
                    />
                  ))}
                </div>
              )}

              {progressBar.type === 'numbers' && (
                <div className="text-center text-xs text-gray-500 mt-2">
                  {currentStepPosition + 1} / {totalVisibleSteps}
                </div>
              )}
            </div>
          )}

        {/* Default progress bar for boolean true */}
        {progressBar === true && (
          <div className="mb-3">
            <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200">
              <motion.div
                className="h-full bg-[#E67E4D] transition-all duration-500 ease-out rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Row - Only Back button */}
        <div className="flex items-center justify-start h-8">
          {/* Back Button */}
          <div className="flex items-center">
            {navigationButtons?.showPrevious !== false && canGoBack && (
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className={
                    theme?.button?.navigation ||
                    cn(
                      'opacity-70 hover:opacity-100 transition-all duration-200',
                      'w-8 h-8 p-0 rounded-full',
                      'border border-gray-200',
                      'hover:bg-gray-50 hover:scale-105',
                      'focus:ring-2 focus:ring-[#E67E4D]/20'
                    )
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="sr-only">
                    {navigationButtons?.previousText || 'Previous'}
                  </span>
                </Button>

                {/* Navigation history indicator */}
                {showNavigationHistory && (
                  <div className="text-xs text-gray-500 flex items-center opacity-70">
                    <History className="w-3 h-3 mr-1" />
                    <span className="tabular-nums">
                      {navigationHistory.length - 1}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentPage}-${currentBlockIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Question Content - Centered Layout */}
            <div className="relative flex-[0.8] flex flex-col justify-start items-center py-2">
              <div className="w-full mx-auto space-y-6">
                {currentPageBlocks[currentBlockIndex] && (
                  <div className="text-start">
                    <BlockRenderer
                      block={currentPageBlocks[currentBlockIndex]}
                      value={(() => {
                        const fieldName =
                          currentPageBlocks[currentBlockIndex].fieldName;
                        const fieldValue = fieldName
                          ? values[fieldName as string]
                          : undefined;
                        if (enableDebug) {
                          console.log(
                            '[RenderPageSurveyLayout] BlockRenderer value:',
                            {
                              fieldName,
                              fieldValue,
                              allValues: values,
                              currentBlockIndex,
                              currentPage,
                            }
                          );
                        }
                        return fieldValue;
                      })()}
                      onChange={(value) => {
                        const currentBlock =
                          currentPageBlocks[currentBlockIndex];
                        const field = currentBlock.fieldName;
                        if (field) setValue(field, value);
                        if (currentBlock.autoContinueOnSelect) {
                          goToNextBlock(field ? { [field]: value } : undefined);
                        }
                      }}
                      error={
                        currentPageBlocks[currentBlockIndex].fieldName
                          ? errors[
                              currentPageBlocks[currentBlockIndex]
                                .fieldName as string
                            ]
                          : undefined
                      }
                      ref={firstInputRef}
                      theme={theme}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Buttons - Fixed at bottom */}
            <div className="w-full backdrop-blur-sm border-gray-100">
              <div className="w-full mx-auto py-4">
                {/* Disclaimer Text */}
                {blockDisclaimer && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto text-center">
                      {blockDisclaimer}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div
                    className={cn(
                      'flex items-center',
                      navigationButtons?.align === 'left'
                        ? 'justify-start'
                        : navigationButtons?.align === 'right'
                        ? 'justify-end'
                        : 'justify-center'
                    )}
                  >
                    {/* Previous Button (if split layout) */}
                    {navigationButtons?.position === 'split' &&
                      canGoBack &&
                      navigationButtons?.showPrevious !== false && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          className={cn('mr-auto', theme?.button?.secondary)}
                        >
                          <ChevronLeft className="mr-2 w-4 h-4" />
                          {navigationButtons?.previousText || 'Previous'}
                        </Button>
                      )}

                    {/* Main Action Button - Intake Form Style */}
                    {showNextButton && (
                      <Button
                        type="submit"
                        disabled={!isValid}
                        variant="ghost"
                        size="lg"
                        className={
                          theme?.button?.navigation ||
                          cn(
                            'bg-black hover:bg-gray-800 text-white',
                            'px-16 py-4 text-base font-medium',
                            'rounded-full min-w-32 sm:min-w-[200px]',
                            'transition-all duration-200',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                          )
                        }
                      >
                        <span className="flex items-center">
                          {isLastPage &&
                          currentBlockIndex === currentPageBlocks.length - 1
                            ? completeText
                            : continueText}
                          {!(
                            isLastPage &&
                            currentBlockIndex === currentPageBlocks.length - 1
                          ) && <ArrowRight className="ml-2 w-4 h-4" />}
                        </span>
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Progress Bar (if positioned at bottom) */}
      {progressBar &&
        typeof progressBar === 'object' &&
        progressBar.position === 'bottom' && (
          <div className="w-full mx-auto border-t bg-white/80 backdrop-blur-sm py-2">
            <div className="h-2 w-full rounded-full overflow-hidden bg-gray-200">
              <motion.div
                className={cn(
                  'h-full transition-all duration-500 ease-out rounded-full',
                  progressBar.color || 'bg-[#E67E4D]'
                )}
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
    </div>
  );

  // Wrap with analytics tracking if analytics is configured
  if (analytics) {
    return (
      <AnalyticsTrackedLayout analytics={analytics}>
        {layoutContent}
      </AnalyticsTrackedLayout>
    );
  }

  return layoutContent;
};
