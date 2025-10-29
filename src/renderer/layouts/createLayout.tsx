import React from 'react';
import type { LayoutProps } from '../../types';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { AnalyticsTrackedLayout } from './AnalyticsTrackedLayout';

/**
 * createLayout - Higher-order function to create a custom layout with automatic analytics tracking
 *
 * This function wraps your custom layout component with:
 * - Automatic analytics tracking (if analytics is configured)
 * - Proper context access
 * - Type safety
 *
 * @param layoutComponent - Your custom layout component
 * @returns A wrapped layout component with analytics support
 *
 * @example
 * ```tsx
 * import { createLayout, CurrentBlock, NavigationButtons, ProgressIndicator } from 'survey-form-package';
 *
 * const MyCustomLayout = createLayout(() => (
 *   <div className="my-layout">
 *     <ProgressIndicator type="bar" showPercentage />
 *     <CurrentBlock className="my-4" />
 *     <NavigationButtons />
 *   </div>
 * ));
 *
 * // Use it
 * <SurveyForm survey={data} layout={MyCustomLayout} />
 * ```
 */
export function createLayout(
  layoutComponent: React.ComponentType<LayoutProps>
): React.FC<LayoutProps> {
  const WrappedLayout: React.FC<LayoutProps> = (props) => {
    const { analytics } = useSurveyForm();

    const layoutContent = React.createElement(layoutComponent, props);

    // Wrap with analytics if configured
    if (analytics) {
      return (
        <AnalyticsTrackedLayout analytics={analytics}>
          {layoutContent}
        </AnalyticsTrackedLayout>
      );
    }

    return layoutContent;
  };

  // Set display name for better debugging
  WrappedLayout.displayName = `createLayout(${
    layoutComponent.displayName || layoutComponent.name || 'CustomLayout'
  })`;

  return WrappedLayout;
}
