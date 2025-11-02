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
    // console.log('[createLayout/WrappedLayout] Rendering with props:', {
    //   hasProps: !!props,
    //   propsKeys: Object.keys(props),
    //   componentName: layoutComponent.displayName || layoutComponent.name || 'CustomLayout',
    // });

    const { analytics } = useSurveyForm();

    // console.log('[createLayout/WrappedLayout] Creating element for:', layoutComponent.name);

    // Create an error boundary wrapper to catch any errors
    let layoutContent;
    try {
      // Call the component function directly to see what it returns
      const LayoutComponent = layoutComponent as React.FC<LayoutProps>;
      // console.log('[createLayout/WrappedLayout] Calling component function directly');
      layoutContent = <LayoutComponent {...props} />;
      // console.log('[createLayout/WrappedLayout] Component returned:', {
      //   hasContent: !!layoutContent,
      //   contentType: typeof layoutContent,
      //   contentProps: layoutContent?.props,
      // });
    } catch (error) {
      // console.error('[createLayout/WrappedLayout] Error creating layout:', error);
      return (
        <div style={{ padding: '20px', background: '#fee', border: '2px solid red', margin: '20px' }}>
          <h3>Layout Error</h3>
          <pre>{String(error)}</pre>
        </div>
      );
    }

    // Wrap with analytics if configured
    if (analytics) {
      // console.log('[createLayout/WrappedLayout] Wrapping with analytics');
      return (
        <AnalyticsTrackedLayout analytics={analytics}>
          {layoutContent}
        </AnalyticsTrackedLayout>
      );
    }

    // console.log('[createLayout/WrappedLayout] Returning layout content directly');
    return layoutContent;
  };

  // Set display name for better debugging
  WrappedLayout.displayName = `createLayout(${
    layoutComponent.displayName || layoutComponent.name || 'CustomLayout'
  })`;

  return WrappedLayout;
}
