import type { AnalyticsProvider, SurveyAnalyticsEvent } from '../types';

interface MetaEventData {
  event_name: string;
  event_time: number;
  event_id?: string;
  user_data?: {
    external_id?: string;
  };
  custom_data?: Record<string, any>;
}

export class MetaPixelProvider implements AnalyticsProvider {
  name = 'MetaPixel';
  private initialized = false;
  private pixelId: string = '';
  private accessToken?: string;
  private testEventCode?: string;
  private sessionId?: string;
  private userId?: string;
  private debug = false;

  async initialize(config: {
    pixelId: string;
    accessToken?: string;
    testEventCode?: string;
    debug?: boolean;
    sessionId?: string;
    userId?: string;
  }): Promise<void> {
    this.pixelId = config.pixelId;
    this.accessToken = config.accessToken;
    this.testEventCode = config.testEventCode;
    this.debug = config.debug || false;
    this.sessionId = config.sessionId;
    this.userId = config.userId;

    if (this.debug) {
      console.log('[MetaPixel] Initializing with pixel ID:', this.pixelId);
    }

    // Check if fbq already exists
    if (window.fbq) {
      if (this.debug) {
        console.log('[MetaPixel] fbq already exists, configuring...');
      }
      this.initialized = true;
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
    if (existingScript) {
      if (this.debug) {
        console.log('[MetaPixel] Facebook Pixel script already exists');
      }
      // Initialize fbq if it doesn't exist
      this.initializeFbq();
      this.initialized = true;
      return;
    }

    // Initialize Facebook Pixel
    this.initializeFbq();

    // Load Facebook Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.id = 'facebook-pixel-script';

    if (this.debug) {
      console.log('[MetaPixel] Creating script element');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[MetaPixel] Script load timeout after 10 seconds');
        reject(new Error('Meta Pixel script load timeout'));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeout);
        if (this.debug) {
          console.log('[MetaPixel] Script loaded successfully');
        }
        this.initialized = true;
        resolve();
      };

      script.onerror = (error) => {
        clearTimeout(timeout);
        console.error('[MetaPixel] Script load error:', error);
        reject(new Error('Failed to load Meta Pixel'));
      };

      document.head.appendChild(script);
    });
  }

  private initializeFbq(): void {
    // Initialize the fbq function
    if (!window.fbq) {
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    // Initialize the pixel
    if (window.fbq) {
      window.fbq('init', this.pixelId, {
        external_id: this.userId
      });

      // Set test event code if provided
      if (this.testEventCode) {
        window.fbq('init', this.pixelId, {
          external_id: this.userId
        }, {
          test_event_code: this.testEventCode
        });
      }

      if (this.debug) {
        console.log('[MetaPixel] Pixel initialized');
      }
    }
  }

  private mapEventToMetaEvent(event: SurveyAnalyticsEvent): { eventName: string; customData: Record<string, any> } {
    let eventName = 'Survey';
    const customData: Record<string, any> = {
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      session_id: event.sessionId || this.sessionId,
      user_id: event.userId || this.userId,
      survey_id: event.surveyId,
      timestamp: event.timestamp || Date.now()
    };

    // Map survey actions to standard Meta events where applicable
    switch (event.action) {
      case 'survey_start':
        eventName = 'StartTrial'; // Or 'Lead' depending on use case
        break;
      case 'survey_complete':
        eventName = 'CompleteRegistration';
        customData.content_name = 'Survey Completion';
        break;
      case 'page_view':
        eventName = 'PageView';
        break;
      case 'field_complete':
        eventName = 'Survey';
        customData.content_name = 'Field Completed';
        break;
      default:
        eventName = 'Survey';
        customData.content_name = event.action;
    }

    // Add metadata
    if (event.metadata) {
      Object.keys(event.metadata).forEach(key => {
        customData[key] = event.metadata[key];
      });
    }

    // Remove undefined values
    Object.keys(customData).forEach(key =>
      customData[key] === undefined && delete customData[key]
    );

    return { eventName, customData };
  }

  trackEvent(event: SurveyAnalyticsEvent): void {
    if (!this.initialized || !window.fbq) return;

    const { eventName, customData } = this.mapEventToMetaEvent(event);

    // Track with Facebook Pixel
    window.fbq('track', eventName, customData);

    // If Conversion API is configured, send server-side event
    if (this.accessToken) {
      this.sendConversionAPIEvent(eventName, customData);
    }

    if (this.debug) {
      console.log('[MetaPixel] Event tracked:', eventName, customData);
    }
  }

  trackPageView(url: string, title?: string, additionalData?: Record<string, any>): void {
    if (!this.initialized || !window.fbq) return;

    const pageData = {
      page_path: url,
      page_title: title,
      session_id: this.sessionId,
      user_id: this.userId,
      ...additionalData
    };

    // Remove undefined values
    Object.keys(pageData).forEach(key =>
      pageData[key] === undefined && delete pageData[key]
    );

    window.fbq('track', 'PageView', pageData);

    // If Conversion API is configured, send server-side event
    if (this.accessToken) {
      this.sendConversionAPIEvent('PageView', pageData);
    }

    if (this.debug) {
      console.log('[MetaPixel] Page view tracked:', pageData);
    }
  }

  trackTiming(category: string, variable: string, value: number, label?: string): void {
    if (!this.initialized || !window.fbq) return;

    const timingData = {
      timing_category: category,
      timing_variable: variable,
      timing_value: Math.round(value),
      timing_label: label,
      session_id: this.sessionId,
      user_id: this.userId
    };

    // Remove undefined values
    Object.keys(timingData).forEach(key =>
      timingData[key] === undefined && delete timingData[key]
    );

    window.fbq('trackCustom', 'SurveyTiming', timingData);

    if (this.debug) {
      console.log('[MetaPixel] Timing tracked:', timingData);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.initialized || !window.fbq) return;

    // Update internal user ID if provided
    if (properties.user_id) {
      this.userId = properties.user_id;
    }

    // Meta Pixel doesn't have a direct setUserProperties method,
    // but we can send custom events with user data
    window.fbq('trackCustom', 'UserPropertiesUpdated', {
      ...properties,
      session_id: this.sessionId
    });

    if (this.debug) {
      console.log('[MetaPixel] User properties set:', properties);
    }
  }

  setCustomDimensions(dimensions: Record<string, any>): void {
    if (!this.initialized || !window.fbq) return;

    // Track as custom event
    window.fbq('trackCustom', 'CustomDimensionsSet', {
      ...dimensions,
      session_id: this.sessionId,
      user_id: this.userId
    });

    if (this.debug) {
      console.log('[MetaPixel] Custom dimensions set:', dimensions);
    }
  }

  private async sendConversionAPIEvent(
    eventName: string,
    customData: Record<string, any>
  ): Promise<void> {
    if (!this.accessToken) return;

    try {
      const eventData: MetaEventData = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: `${this.sessionId}_${Date.now()}`, // Deduplication ID
        user_data: {
          external_id: this.userId || this.sessionId
        },
        custom_data: customData
      };

      const payload: any = {
        data: [eventData]
      };

      // Add test event code if provided
      if (this.testEventCode) {
        payload.test_event_code = this.testEventCode;
      }

      const url = `https://graph.facebook.com/v18.0/${this.pixelId}/events?access_token=${this.accessToken}`;

      // Send to Conversion API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[MetaPixel] Conversion API error:', errorData);
      } else if (this.debug) {
        const responseData = await response.json();
        console.log('[MetaPixel] Conversion API response:', responseData);
      }
    } catch (error) {
      console.error('[MetaPixel] Failed to send Conversion API event:', error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    // Meta Pixel doesn't provide a way to fully unload, but we can stop tracking
    this.initialized = false;
    if (this.debug) {
      console.log('[MetaPixel] Provider destroyed');
    }
  }
}
