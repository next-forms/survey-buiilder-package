import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { NavigationButtons } from '../../components/ui/NavigationButtons';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { themes } from '../themes';

interface TabsLayoutProps {
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
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({
  progressBar = false,
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
  autoFocus = false,
  showSummary = false,
  submitText = 'Submit',
}) => {
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
    theme,
    goToPage
  } = useSurveyForm();

  const themeConfig = theme ?? themes.default;
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all survey pages
  const { getSurveyPages } = require('../../utils/surveyUtils');
  const pages = getSurveyPages(useSurveyForm().surveyData.rootNode);

  // Auto-scroll to the top of the container when page changes
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [currentPage, autoScroll]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="survey-tabs-layout" ref={containerRef}>
      {/* Page tabs */}
      <div className="survey-tabs mb-6 flex items-center border-b overflow-x-auto">
        {pages.map((pageBlocks, index) => {
          const isActive = index === currentPage;

          // Get the tab title
          const tabTitle = pageBlocks[0]?.name || `Page ${index + 1}`;

          return (
            <button
              key={`tab-${index}`}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap
                ${isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              style={{
                borderBottomColor: isActive ? themeConfig.colors.primary : 'transparent',
                color: isActive ? themeConfig.colors.primary : themeConfig.colors.secondary
              }}
              onClick={() => goToPage(index)}
            >
              {tabTitle}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="survey-form">
        <div className={themeConfig.card}>
          {/* Page header */}
          {pages[currentPage] && pages[currentPage][0]?.description && (
            <div className={themeConfig.header}>
              <p className={themeConfig.description}>{pages[currentPage][0].description}</p>
            </div>
          )}

          {/* Page content */}
          <div className="survey-page-content space-y-6">
            {pages[currentPage]?.map((block, index) => (
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
                theme={theme}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <NavigationButtons
            onPrevious={!isFirstPage ? goToPreviousPage : undefined}
            onNext={!isLastPage ? goToNextPage : undefined}
            onSubmit={isLastPage ? submit : undefined}
            isValid={isValid}
            options={{
              ...navigationButtons,
              showNext:
                navigationButtons?.showNext !== false &&
                pages[currentPage][0]?.showContinueButton !== false,
            }}
            submitText={submitText}
          />
        </div>
      </form>
    </div>
  );
};
