import React, { useState } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { NavigationButtons } from '../../components/ui/NavigationButtons';
import { BlockRenderer } from '../renderers/BlockRenderer';
import { themes } from '../../themes';

interface AccordionLayoutProps {
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

export const AccordionLayout: React.FC<AccordionLayoutProps> = ({
  progressBar = false,
  navigationButtons = {
    showPrevious: false,
    showNext: false,
    showSubmit: true,
    submitText: 'Submit',
    position: 'bottom',
    align: 'center',
    style: 'default',
  },
  autoScroll = false,
  autoFocus = false,
  showSummary = false,
  submitText = 'Submit',
  enableDebug = false,
}) => {
  const {
    values,
    setValue,
    errors,
    submit,
    isValid,
    theme
  } = useSurveyForm();

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const themeConfig = theme ?? themes.default;

  // Get all survey pages
  const { getSurveyPages } = require('../../utils/surveyUtils');
  const pages = getSurveyPages(useSurveyForm().surveyData.rootNode);

  // Toggle a section's expanded state
  const toggleSection = (index: number) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="survey-accordion-layout">
      <form onSubmit={handleSubmit} className="survey-form">
        <div className="space-y-4">
          {/* Accordion sections */}
          {pages.map((pageBlocks, pageIndex) => {
            const isExpanded = expandedSections.includes(pageIndex);
            const sectionName = pageBlocks[0]?.name || `Section ${pageIndex + 1}`;

            return (
              <div key={`section-${pageIndex}`} className={`border rounded-md overflow-hidden ${themeConfig.background}`}>
                {/* Section header */}
                <div
                  className={`
                    p-4 font-medium flex items-center justify-between cursor-pointer
                    transition-colors
                    ${isExpanded ? 'bg-gray-100' : ''}
                  `}
                  onClick={() => toggleSection(pageIndex)}
                  style={{
                    backgroundColor: isExpanded ? themeConfig.colors.background : 'transparent',
                    borderBottom: isExpanded ? `1px solid ${themeConfig.colors.border}` : 'none'
                  }}
                >
                  <div>
                    <span className="font-bold">{sectionName}</span>
                    {pageBlocks[0]?.description && (
                      <p className="text-sm text-gray-500 mt-1">{pageBlocks[0].description}</p>
                    )}
                  </div>
                  <span className="text-xl">
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>

                {/* Section content */}
                {isExpanded && (
                  <div className="p-4 space-y-6">
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
                )}
              </div>
            );
          })}

          {/* Submit button */}
          <div className={themeConfig.card}>
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
        </div>
      </form>
    </div>
  );
};
