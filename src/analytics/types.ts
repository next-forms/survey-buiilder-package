// Analytics provider types and interfaces

export interface AnalyticsConfig {
  // Session identifier for tracking
  sessionId?: string;
  userId?: string;
  customDimensions?: Record<string, any>;
  
  // Google Analytics configuration
  googleAnalytics?: {
    measurementId: string;
    debug?: boolean;
  };
  // Google Tag Manager configuration
  googleTagManager?: {
    containerId: string;
    auth?: string;
    preview?: string;
    debug?: boolean;
  };
  // Meta (Facebook) Pixel and Conversion API configuration
  meta?: {
    pixelId: string;
    accessToken?: string; // For Conversion API
    testEventCode?: string; // For testing events
    debug?: boolean;
  };
  // Custom event handler function
  trackEvent?: (event: any) => void;
  trackPageView?: (url: string, title?: string, additionalData?: Record<string, any>) => void;
  trackTiming?: (category: string, variable: string, value: number, label?: string) => void;
  setUserProperties?: (properties: Record<string, any>) => void;

  // Custom analytics provider
  custom?: {
    name: string;
    config: Record<string, any>;
    handler: AnalyticsProvider;
  };
}

// Analytics event types for survey tracking
export interface SurveyAnalyticsEvent {
  category: 'survey';
  action: SurveyAction;
  label?: string;
  value?: number;
  sessionId?: string;
  userId?: string;
  surveyId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export type SurveyAction =
  | 'user_authenticated'
  | 'survey_start'
  | 'survey_complete'
  | 'survey_abandon'
  | 'page_view'
  | 'page_complete'
  | 'field_interact'
  | 'field_complete'
  | 'field_error'
  | 'navigation_next'
  | 'navigation_previous'
  | 'navigation_jump'
  | 'validation_error'
  | 'conditional_show'
  | 'conditional_hide'
  | 'file_upload'
  | 'time_spent'
  | 'block_value_selected';

export interface PageViewEvent extends SurveyAnalyticsEvent {
  action: 'page_view';
  metadata: {
    pageIndex: number;
    pageId: string;
    pageTitle?: string;
    totalPages: number;
    timeOnPage?: number;
  };
}

export interface FieldInteractionEvent extends SurveyAnalyticsEvent {
  action: 'field_interact' | 'field_complete' | 'field_error';
  metadata: {
    fieldId: string;
    fieldType: string;
    fieldLabel?: string;
    value?: any;
    errorMessage?: string;
    interactionType?: 'focus' | 'blur' | 'change' | 'click';
    timeSpent?: number;
  };
}

export interface SurveyCompletionEvent extends SurveyAnalyticsEvent {
  action: 'survey_complete' | 'survey_abandon';
  metadata: {
    surveyId?: string;
    completionTime: number;
    completedPages: number;
    totalPages: number;
    completionRate: number;
    responses?: Record<string, any>;
  };
}

export interface NavigationEvent extends SurveyAnalyticsEvent {
  action: 'navigation_next' | 'navigation_previous' | 'navigation_jump';
  metadata: {
    fromPage: number;
    toPage: number;
    fromPageId?: string;
    toPageId?: string;
    navigationRule?: string;
  };
}

export interface ValidationErrorEvent extends SurveyAnalyticsEvent {
  action: 'validation_error';
  metadata: {
    fieldId: string;
    fieldType: string;
    errorMessage: string;
    attemptedValue?: any;
    pageIndex?: number;
  };
}

// Analytics provider interface
export interface AnalyticsProvider {
  name: string;
  initialize(config: any): Promise<void>;
  trackEvent(event: SurveyAnalyticsEvent): void;
  trackPageView(url: string, title?: string, additionalData?: Record<string, any>): void;
  trackTiming(category: string, variable: string, value: number, label?: string): void;
  setUserProperties(properties: Record<string, any>): void;
  setCustomDimensions?(dimensions: Record<string, any>): void;
  isInitialized(): boolean;
  destroy?(): void;
}

// Context value for analytics
export interface AnalyticsContextValue {
  providers: AnalyticsProvider[];
  trackEvent: (event: SurveyAnalyticsEvent) => void;
  trackPageView: (url: string, title?: string, additionalData?: Record<string, any>) => void;
  trackTiming: (category: string, variable: string, value: number, label?: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  isEnabled: boolean;
  config: AnalyticsConfig;
}

// Helper type for GTM data layer
export interface GTMDataLayerEvent {
  event: string;
  [key: string]: any;
}

// Global declarations for GA and GTM
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: GTMDataLayerEvent[];
    ga?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    twq?: (...args: any[]) => void;
  }
}