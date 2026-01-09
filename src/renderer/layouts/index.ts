import type { LayoutDefinition, LayoutProps } from "../../types";
import { RenderPageSurveyLayout } from "./RenderPageSurveyLayout";
import { ChatLayout } from "./ChatLayout";
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
  chat: {
    name: "chat",
    description: "Conversational chat-style layout with AI-powered questions",
    component: ChatLayout,
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

  // If no layout specified, return default (already has analytics built-in)
  if (!layout) {
    return RenderPageSurveyLayout;
  }

  // If it's a function component, wrap it with createLayout for automatic analytics
  if (typeof layout === "function") {
    const wrapped = createLayout(layout);
    return wrapped;
  }

  // If it's a string, look it up in the registry
  if (typeof layout === "string") {
    const layoutDef = getLayoutDefinition(layout);
    if (layoutDef) {
      // Registry layouts are already set up correctly, no need to wrap
      return layoutDef.component;
    }
    console.warn(
      `Layout "${layout}" not found in registry. Using default layout.`
    );
    return RenderPageSurveyLayout;
  }

  return RenderPageSurveyLayout;
}

// Export the default layout for direct import
export { RenderPageSurveyLayout };

// Export ChatLayout and its types
export { ChatLayout } from './ChatLayout';
export type {
  ChatMessage as ChatMessageType,
  AIHandler,
  AIHandlerContext,
  AIHandlerResponse,
  ChatLayoutProps,
  ChatCustomData,
  ChatRendererProps,
} from './ChatLayout';

// Export helper components and utilities
export { CurrentBlock, NavigationButtons, ProgressIndicator } from './helpers';
export { createLayout } from './createLayout';
