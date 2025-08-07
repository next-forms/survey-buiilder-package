import React, { useState, useEffect } from 'react';
import type { SurveyFormRendererProps } from '../types';
import { SurveyFormProvider } from '../context/SurveyFormContext';
import { RenderPageSurveyLayout } from './layouts/RenderPageSurveyLayout';
import { themes } from '../themes';
import { applyDynamicColors } from '../utils/colorUtils';

// Import the theme isolation CSS
import '../styles/survey-theme-isolation.css';

// Theme mode type
type ThemeMode = 'light' | 'dark' | 'system';

export const SurveyForm: React.FC<SurveyFormRendererProps> = ({
  survey,
  onSubmit,
  onChange,
  onPageChange,
  defaultValues = {},
  language = 'en',
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
  logo = null,
  className = '',
  themeMode = 'light',
}) => {

  // Debug log - helps diagnose issues with the survey data
  if (enableDebug) {
    console.log('SurveyForm rendering with survey data:', survey?.rootNode?.type || 'No survey data');
  }

  // Get the selected theme
  const themeConfig = survey?.theme ?? themes.modern;

  // Determine if we should use dark theme based on the themeMode prop
  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Create theme-specific CSS variables that override default values
  const surveyThemeStyle = {
    // Use CSS custom properties to override within the survey scope
    '--survey-primary': themeConfig.colors.primary,
    '--survey-secondary': themeConfig.colors.secondary,
    '--survey-accent': themeConfig.colors.accent,
    '--survey-success': themeConfig.colors.success || (isDarkMode ? 'oklch(0.696 0.17 162.48)' : 'oklch(0.6 0.118 184.704)'),
    '--survey-error': themeConfig.colors.error || (isDarkMode ? 'oklch(0.704 0.191 22.216)' : 'oklch(0.577 0.245 27.325)'),
    '--survey-background': themeConfig.colors.background || (isDarkMode ? 'oklch(0.141 0.005 285.823)' : 'oklch(0.99 0.002 286)'),
    '--survey-text': themeConfig.colors.text || (isDarkMode ? 'oklch(0.985 0 0)' : 'oklch(0.141 0.005 285.823)'),
    '--survey-border': themeConfig.colors.border || (isDarkMode ? 'oklch(1 0 0 / 12%)' : 'oklch(0.94 0.002 286.32)'),
    '--survey-surface': isDarkMode ? 'oklch(0.21 0.006 285.885)' : 'oklch(1 0 0)',
    '--survey-text-muted': isDarkMode ? 'oklch(0.705 0.015 286.067)' : 'oklch(0.552 0.016 285.938)',
    '--survey-input': isDarkMode ? 'oklch(1 0 0 / 18%)' : 'oklch(0.96 0.002 286.32)',
    '--survey-ring': isDarkMode ? 'oklch(0.552 0.016 285.938)' : 'oklch(0.705 0.015 286.067)',
    '--survey-bg': themeConfig.colors.background || (isDarkMode ? 'oklch(0.141 0.005 285.823)' : 'oklch(0.99 0.002 286)'),
    '--survey-shadow': isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--survey-shadow-lg': isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties;

  useEffect(() => {
    applyDynamicColors(themeConfig);
  }, [themeConfig]);

  // Force re-render when themeMode changes
  useEffect(() => {
    // This effect ensures the component re-renders when themeMode changes
  }, [themeMode]);

  // Determine theme class based on mode
  const getThemeClass = () => {
    switch (themeMode) {
      case 'light': return 'survey-theme-light';
      case 'dark': return 'survey-theme-dark';
      case 'system': return 'survey-theme-system';
      default: return 'survey-theme-light';
    }
  };

  // Enhanced container class with better mobile responsiveness
  const containerClass = `survey-form-container ${themeConfig.containerLayout} antialiased ${className}`;

  const layoutProps = {
    enableDebug,
    progressBar,
    navigationButtons,
    autoScroll,
    autoFocus,
    showSummary,
    submitText,
    logo
  };

  return (
    <div 
      className={`survey-theme-container ${getThemeClass()} min-h-screen`}
      style={surveyThemeStyle}
    >
      <div className="survey-isolated-content">
        <div className={`${containerClass} ${themeConfig.background} min-h-screen flex justify-center`}>
          <SurveyFormProvider
            surveyData={survey}
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            onChange={onChange}
            onPageChange={onPageChange}
            enableDebug={enableDebug}
            language={language}
            theme={themeConfig}
            logo={logo}
          >
            <RenderPageSurveyLayout {...layoutProps} />
          </SurveyFormProvider>
        </div>
      </div>
    </div>
  );
};