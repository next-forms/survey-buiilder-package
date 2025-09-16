import type { AnalyticsProvider, SurveyAnalyticsEvent, GTMDataLayerEvent } from '../types';

export class GoogleTagManagerProvider implements AnalyticsProvider {
  name = 'GoogleTagManager';
  private initialized = false;
  private containerId: string = '';
  private sessionId?: string;
  private userId?: string;
  private debug = false;

  async initialize(config: { 
    containerId: string; 
    auth?: string;
    preview?: string;
    debug?: boolean;
    sessionId?: string;
    userId?: string;
  }): Promise<void> {
    this.containerId = config.containerId;
    this.debug = config.debug || false;
    this.sessionId = config.sessionId;
    this.userId = config.userId;

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Push initial configuration
    this.pushToDataLayer({
      event: 'gtm.init',
      'gtm.start': new Date().getTime(),
      session_id: this.sessionId,
      user_id: this.userId
    });

    // Check if GTM is already loaded
    const existingScript = document.querySelector(`script[src*="gtm.js?id=${this.containerId}"]`);
    if (existingScript) {
      this.initialized = true;
      return;
    }

    // Load Google Tag Manager script
    const script = document.createElement('script');
    script.async = true;
    
    let src = `https://www.googletagmanager.com/gtm.js?id=${this.containerId}`;
    if (config.auth && config.preview) {
      src += `&gtm_auth=${config.auth}&gtm_preview=${config.preview}&gtm_cookies_win=x`;
    }
    
    script.src = src;
    
    return new Promise((resolve, reject) => {
      script.onload = () => {
        this.initialized = true;
        
        // Also add noscript iframe for fallback
        this.addNoScriptFallback(config);
        
        if (this.debug) {
          console.log('[GTM] Initialized with container:', this.containerId);
        }
        
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Tag Manager'));
      };
      
      document.head.appendChild(script);
    });
  }

  private addNoScriptFallback(config: { auth?: string; preview?: string }): void {
    // Check if noscript already exists
    if (document.querySelector(`iframe[src*="ns.html?id=${this.containerId}"]`)) {
      return;
    }

    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    
    let src = `https://www.googletagmanager.com/ns.html?id=${this.containerId}`;
    if (config.auth && config.preview) {
      src += `&gtm_auth=${config.auth}&gtm_preview=${config.preview}&gtm_cookies_win=x`;
    }
    
    iframe.src = src;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }

  private pushToDataLayer(data: GTMDataLayerEvent): void {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Add session and user IDs to all events
    const enrichedData = {
      ...data,
      session_id: data.session_id || this.sessionId,
      user_id: data.user_id || this.userId
    };

    // Remove undefined values
    Object.keys(enrichedData).forEach(key => 
      enrichedData[key] === undefined && delete enrichedData[key]
    );

    window.dataLayer.push(enrichedData);

    if (this.debug) {
      console.log('[GTM] Data pushed to dataLayer:', enrichedData);
    }
  }

  trackEvent(event: SurveyAnalyticsEvent): void {
    if (!this.initialized) return;

    const gtmEvent: GTMDataLayerEvent = {
      event: `survey.${event.action}`,
      survey_category: event.category,
      survey_action: event.action,
      survey_label: event.label,
      survey_value: event.value,
      survey_id: event.surveyId,
      session_id: event.sessionId || this.sessionId,
      user_id: event.userId || this.userId,
      timestamp: event.timestamp || Date.now()
    };

    // Add metadata fields, especially field responses for field_complete events
    if (event.metadata) {
      // For field_complete events, ensure field response is prominently included
      if (event.action === 'field_complete') {
        gtmEvent.field_id = event.metadata.fieldId;
        gtmEvent.field_type = event.metadata.fieldType;
        gtmEvent.field_label = event.metadata.fieldLabel;
        gtmEvent.field_value = event.metadata.fieldValue;
        
        // Include the raw response for analysis
        if (event.metadata.fieldResponse !== undefined) {
          gtmEvent.field_response = event.metadata.fieldResponse;
        }
      }
      
      // Include all metadata
      Object.keys(event.metadata).forEach(key => {
        if (!gtmEvent.hasOwnProperty(key)) {
          gtmEvent[key] = event.metadata[key];
        }
      });
    }

    this.pushToDataLayer(gtmEvent);

    // Also push a generic survey_event for catch-all triggers
    this.pushToDataLayer({
      event: 'survey_event',
      eventDetails: gtmEvent
    });
  }

  trackPageView(url: string, title?: string, additionalData?: Record<string, any>): void {
    if (!this.initialized) return;

    const pageViewEvent: GTMDataLayerEvent = {
      event: 'survey_page_view',
      page_path: url,
      page_title: title,
      page_location: window.location.href,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now(),
      ...additionalData
    };

    this.pushToDataLayer(pageViewEvent);

    // Also push standard virtual page view
    this.pushToDataLayer({
      event: 'virtualPageView',
      virtualPageURL: url,
      virtualPageTitle: title
    });
  }

  trackTiming(category: string, variable: string, value: number, label?: string): void {
    if (!this.initialized) return;

    const timingEvent: GTMDataLayerEvent = {
      event: 'survey_timing',
      timing_category: category,
      timing_variable: variable,
      timing_value: Math.round(value),
      timing_label: label,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now()
    };

    this.pushToDataLayer(timingEvent);
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.initialized) return;

    // Update internal user ID if provided
    if (properties.user_id) {
      this.userId = properties.user_id;
    }

    // Push user properties to dataLayer
    const userEvent: GTMDataLayerEvent = {
      event: 'survey_user_properties',
      user_properties: properties,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now()
    };

    this.pushToDataLayer(userEvent);

    // Also set as persistent properties
    this.pushToDataLayer({
      ...properties,
      event: 'setUserProperties'
    });
  }

  setCustomDimensions(dimensions: Record<string, any>): void {
    if (!this.initialized) return;

    // Push custom dimensions to dataLayer
    const dimensionsEvent: GTMDataLayerEvent = {
      event: 'survey_custom_dimensions',
      ...dimensions,
      session_id: this.sessionId,
      user_id: this.userId
    };

    this.pushToDataLayer(dimensionsEvent);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    // GTM doesn't provide a way to fully unload, but we can clear the dataLayer
    if (window.dataLayer) {
      // Push a cleanup event
      this.pushToDataLayer({
        event: 'survey_cleanup',
        session_id: this.sessionId
      });
    }
    
    this.initialized = false;
    
    if (this.debug) {
      console.log('[GTM] Provider destroyed');
    }
  }
}