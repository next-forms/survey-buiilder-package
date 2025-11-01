import type { LayoutDefinition, LayoutProps } from "../../types";
import { RenderPageSurveyLayout } from "./RenderPageSurveyLayout";
import { createLayout } from "./createLayout";
import React from "react";

// Registry of all layout definitions
export const layoutRegistry: Record<string, LayoutDefinition> = {
  default: {
    name: "default",
    description: "Default page-by-page layout with progress bar and navigation",
    component: RenderPageSurveyLayout,
  },
  renderPage: {
    name: "renderPage",
    description: "Alias for default layout - page-by-page rendering",
    component: RenderPageSurveyLayout,
  },
};

// Helper function to get a layout definition by name
export function getLayoutDefinition(name: string): LayoutDefinition | undefined {
  return layoutRegistry[name];
}

// Helper function to get all layout definitions
export function getAllLayoutDefinitions(): LayoutDefinition[] {
  return Object.values(layoutRegistry);
}

// Helper function to register a custom layout
export function registerLayout(layout: LayoutDefinition): void {
  layoutRegistry[layout.name] = layout;
}

// Helper function to unregister a layout
export function unregisterLayout(name: string): void {
  delete layoutRegistry[name];
}

// Helper function to get layout component by name or return custom component
// Automatically wraps custom layouts with analytics tracking
export function getLayoutComponent(
  layout?: string | React.FC<LayoutProps>
): React.FC<LayoutProps> {
  console.log('[getLayoutComponent] Called with:', {
    hasLayout: !!layout,
    layoutType: typeof layout,
    layoutValue: layout,
  });

  // If no layout specified, return default (already has analytics built-in)
  if (!layout) {
    console.log('[getLayoutComponent] No layout, returning default');
    return RenderPageSurveyLayout;
  }

  // If it's a function component, wrap it with createLayout for automatic analytics
  if (typeof layout === "function") {
    console.log('[getLayoutComponent] Function component detected, wrapping with createLayout');
    console.log('[getLayoutComponent] Component name:', layout.name || 'Anonymous');
    const wrapped = createLayout(layout);
    console.log('[getLayoutComponent] Wrapped component:', wrapped.name);
    return wrapped;
  }

  // If it's a string, look it up in the registry
  if (typeof layout === "string") {
    console.log('[getLayoutComponent] String layout name:', layout);
    const layoutDef = getLayoutDefinition(layout);
    if (layoutDef) {
      console.log('[getLayoutComponent] Found in registry');
      // Registry layouts are already set up correctly, no need to wrap
      return layoutDef.component;
    }
    console.warn(
      `Layout "${layout}" not found in registry. Using default layout.`
    );
    return RenderPageSurveyLayout;
  }

  // Fallback to default
  console.log('[getLayoutComponent] Fallback to default');
  return RenderPageSurveyLayout;
}

// Export the default layout for direct import
export { RenderPageSurveyLayout };

// Export helper components and utilities
export { CurrentBlock, NavigationButtons, ProgressIndicator } from './helpers';
export { createLayout } from './createLayout';
