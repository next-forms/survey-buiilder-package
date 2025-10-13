import React, { useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { useSurveyAnalytics } from '../../analytics';

interface AnalyticsTrackedLayoutProps {
  children: React.ReactNode;
  analytics?: {
    surveyId?: string;
    sessionId?: string;
    userId?: string;
    trackFieldInteractions?: boolean;
    trackValidationErrors?: boolean;
    trackTimings?: boolean;
  };
}

export const AnalyticsTrackedLayout: React.FC<AnalyticsTrackedLayoutProps> = ({
  children,
  analytics
}) => {
  const {
    currentPage,
    currentBlockIndex,
    totalPages,
    values,
    errors,
    isSubmitting,
    surveyData
  } = useSurveyForm();

  const {
    trackSurveyStart,
    trackSurveyComplete,
    trackSurveyAbandon,
    trackPageView,
    trackNavigation,
    trackValidationError,
    trackFieldInteraction,
    trackFieldComplete,
    isEnabled
  } = useSurveyAnalytics({
    surveyId: analytics?.surveyId,
    sessionId: analytics?.sessionId,
    userId: analytics?.userId,
    trackFieldInteractions: analytics?.trackFieldInteractions ?? true,
    trackValidationErrors: analytics?.trackValidationErrors ?? true,
    trackTimings: analytics?.trackTimings ?? true,
    debug: false
  });

  const hasStartedRef = useRef(false);
  const previousPageRef = useRef(currentPage);
  const previousBlockRef = useRef(currentBlockIndex);
  const fieldValuesRef = useRef<Record<string, any>>({});
  const lastErrorsRef = useRef<Record<string, string>>({});

  // Track survey start
  useEffect(() => {
    if (!hasStartedRef.current && isEnabled) {
      hasStartedRef.current = true;
      trackSurveyStart({
        totalPages,
        surveyTitle: surveyData?.rootNode?.label || 'Survey',
        startTime: new Date().toISOString()
      });
    }
  }, [isEnabled, trackSurveyStart, totalPages, surveyData]);

  // Track page changes
  useEffect(() => {
    if (isEnabled && currentPage !== previousPageRef.current) {
      // Track navigation
      const direction = currentPage > previousPageRef.current ? 'next' : 
                       currentPage < previousPageRef.current ? 'previous' : 'jump';
      
      trackNavigation(
        direction,
        previousPageRef.current,
        currentPage,
        {
          blockIndex: currentBlockIndex,
          timestamp: new Date().toISOString()
        }
      );

      // Track page view
      const pages = surveyData?.rootNode?.items || [];
      const currentPageData = pages[currentPage];
      
      trackPageView(
        currentPage,
        currentPageData?.uuid || `page-${currentPage}`,
        currentPageData?.label || `Page ${currentPage + 1}`,
        totalPages
      );

      previousPageRef.current = currentPage;
    }
  }, [currentPage, isEnabled, trackNavigation, trackPageView, totalPages, surveyData, currentBlockIndex]);

  // Track block changes within a page
  useEffect(() => {
    if (isEnabled && currentBlockIndex !== previousBlockRef.current && currentPage === previousPageRef.current) {
      const pages = surveyData?.rootNode?.items || [];
      const currentPageData = pages[currentPage];
      const blocks = currentPageData?.items || [];
      const currentBlock = blocks[currentBlockIndex];

      if (currentBlock) {
        // Track block interaction
        trackFieldInteraction(
          currentBlock.uuid || `block-${currentBlockIndex}`,
          currentBlock.type,
          'focus',
          undefined,
          currentBlock.label
        );
      }

      previousBlockRef.current = currentBlockIndex;
    }
  }, [currentBlockIndex, currentPage, isEnabled, trackFieldInteraction, surveyData]);

  // Track field value changes
  useEffect(() => {
    if (!isEnabled || !analytics?.trackFieldInteractions) return;

    // Detect changed fields
    Object.keys(values).forEach(fieldId => {
      const newValue = values[fieldId];
      const oldValue = fieldValuesRef.current[fieldId];

      if (newValue !== oldValue && newValue !== undefined) {
        // Find the field metadata
        const pages = surveyData?.rootNode?.items || [];
        let fieldData: any = null;

        for (const page of pages) {
          for (const block of (page.items || [])) {
            if (block.uuid === fieldId || block.fieldName === fieldId) {
              fieldData = block;
              break;
            }
          }
          if (fieldData) break;
        }

        if (fieldData) {
          // Track field completion
          trackFieldComplete(
            fieldId,
            fieldData.type || 'unknown',
            newValue,
            fieldData.label
          );
        }
      }
    });

    fieldValuesRef.current = { ...values };
  }, [values, isEnabled, trackFieldComplete, analytics?.trackFieldInteractions, surveyData]);

  // Track validation errors
  useEffect(() => {
    if (!isEnabled || !analytics?.trackValidationErrors) return;

    // Detect new errors
    Object.keys(errors).forEach(fieldId => {
      const newError = errors[fieldId];
      const oldError = lastErrorsRef.current[fieldId];

      if (newError && newError !== oldError) {
        // Find the field metadata
        const pages = surveyData?.rootNode?.items || [];
        let fieldData: any = null;

        for (const page of pages) {
          for (const block of (page.items || [])) {
            if (block.uuid === fieldId || block.fieldName === fieldId) {
              fieldData = block;
              break;
            }
          }
          if (fieldData) break;
        }

        trackValidationError(
          fieldId,
          fieldData?.type || 'unknown',
          newError,
          values[fieldId]
        );
      }
    });

    lastErrorsRef.current = { ...errors };
  }, [errors, values, isEnabled, trackValidationError, analytics?.trackValidationErrors, surveyData]);

  // Track survey completion/abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isEnabled && hasStartedRef.current) {
        const completionRate = Math.round((currentPage / totalPages) * 100);
        trackSurveyAbandon('page_unload', {
          currentPage,
          totalPages,
          completionRate,
          responsesCollected: Object.keys(values).length,
          lastActivity: new Date().toISOString()
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentPage, totalPages, values, isEnabled, trackSurveyAbandon]);

  // Track survey completion
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (isEnabled && isSubmitting && !hasCompletedRef.current && Object.keys(values).length > 0) {
      hasCompletedRef.current = true;

      // Calculate completion metrics
      const completionTime = Date.now() - (hasStartedRef.current ? 0 : Date.now());
      const completedPages = currentPage + 1;
      const completionRate = Math.round((completedPages / totalPages) * 100);

      // Track survey completion
      trackSurveyComplete({
        completionTime,
        completedPages,
        totalPages,
        completionRate,
        responsesCollected: Object.keys(values).length,
        responses: values,
        timestamp: new Date().toISOString()
      });

      // Set a flag to prevent abandon tracking
      (window as any).surveyCompleted = true;
    }
  }, [isSubmitting, isEnabled, trackSurveyComplete, values, currentPage, totalPages]);

  return <>{children}</>;
};