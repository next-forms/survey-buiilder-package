# Survey Analytics Module

## Overview

This analytics module provides comprehensive tracking for survey forms with support for Google Analytics, Google Tag Manager, and future extensibility for other platforms like Meta and X (Twitter).

## Features

- **Multiple Analytics Providers**: Support for Google Analytics 4 and Google Tag Manager
- **Session Tracking**: Unique session and user identifiers for tracking across survey sessions
- **Comprehensive Event Tracking**: Track all survey interactions including:
  - Survey start/complete/abandon
  - Page views and navigation
  - Field interactions and completions
  - Validation errors
  - File uploads
  - Time spent on pages/fields
- **Extensible Architecture**: Easy to add new analytics providers

## Usage

### Basic Setup

```tsx
import { SurveyForm } from '@your-package/survey-form';

// With Google Analytics
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    sessionId: 'unique-session-id-123', // Optional: auto-generated if not provided
    userId: 'user-123',                  // Optional: for logged-in users
    surveyId: 'survey-abc',              // Optional: survey identifier
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX',
      debug: false
    }
  }}
  onSubmit={handleSubmit}
/>

// With Google Tag Manager
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    sessionId: 'unique-session-id-123',
    googleTagManager: {
      containerId: 'GTM-XXXXXXX',
      auth: 'optional-auth-string',      // For staging environments
      preview: 'optional-preview-string', // For staging environments
      debug: false
    }
  }}
  onSubmit={handleSubmit}
/>

// With Both GA and GTM
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    sessionId: 'unique-session-id-123',
    userId: 'user-123',
    surveyId: 'survey-abc',
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX'
    },
    googleTagManager: {
      containerId: 'GTM-XXXXXXX'
    },
    trackFieldInteractions: true,  // Track individual field interactions
    trackValidationErrors: true,   // Track validation errors
    trackTimings: true,           // Track time spent
    customDimensions: {           // Additional custom data
      department: 'sales',
      region: 'north-america'
    }
  }}
  onSubmit={handleSubmit}
/>
```

## Events Tracked

### Survey Events

| Event | Description | Data Collected |
|-------|-------------|----------------|
| `survey_start` | Survey initiated | Survey ID, session ID, user agent, screen resolution |
| `survey_complete` | Survey submitted successfully | Completion time, pages completed, response count |
| `survey_abandon` | User left survey | Time spent, last page, completion rate |

### Page Events

| Event | Description | Data Collected |
|-------|-------------|----------------|
| `page_view` | Page viewed | Page index, page ID, page title |
| `navigation_next` | Next button clicked | From/to pages |
| `navigation_previous` | Previous button clicked | From/to pages |
| `navigation_jump` | Direct navigation | From/to pages, navigation rule |

### Field Events

| Event | Description | Data Collected |
|-------|-------------|----------------|
| `field_interact` | Field focused/clicked | Field ID, type, interaction type |
| `field_complete` | Field value submitted | Field ID, type, value presence |
| `field_error` | Validation error | Field ID, error message |
| `file_upload` | File uploaded | File name, size, type |

## Google Analytics Setup

### GA4 Configuration

1. Create a GA4 property in Google Analytics
2. Get your Measurement ID (format: G-XXXXXXXXXX)
3. Configure custom events in GA4:
   - Go to Configure > Events
   - Mark survey events as conversions if needed
   - Create custom dimensions for survey_id, session_id

### Recommended GA4 Custom Dimensions

- `session_id` - Track individual survey sessions
- `survey_id` - Identify different surveys
- `user_id` - Track logged-in users
- `page_id` - Track specific pages
- `field_id` - Track field interactions

## Google Tag Manager Setup

### GTM Container Configuration

1. Create a GTM container
2. Add triggers for survey events:

```javascript
// Trigger: Survey Start
Trigger Type: Custom Event
Event name: survey.survey_start

// Trigger: Survey Complete
Trigger Type: Custom Event
Event name: survey.survey_complete

// Trigger: Page View
Trigger Type: Custom Event
Event name: survey.page_view
```

3. Create variables for data layer values:

```javascript
// Variable: Session ID
Variable Type: Data Layer Variable
Data Layer Variable Name: session_id

// Variable: Survey ID
Variable Type: Data Layer Variable
Data Layer Variable Name: survey_id
```

4. Set up tags to send data to GA4, Meta Pixel, etc.

### Example GTM Tag for GA4

```javascript
Tag Type: Google Analytics: GA4 Event
Configuration Tag: [Your GA4 Configuration]
Event Name: {{Event}}
Event Parameters:
  session_id: {{Session ID}}
  survey_id: {{Survey ID}}
  user_id: {{User ID}}
```

## Advanced Usage

### Custom Analytics Provider

```typescript
import { AnalyticsProvider } from '@your-package/survey-form/analytics';

class CustomAnalyticsProvider implements AnalyticsProvider {
  name = 'CustomAnalytics';
  
  async initialize(config: any): Promise<void> {
    // Initialize your analytics service
  }
  
  trackEvent(event: SurveyAnalyticsEvent): void {
    // Send event to your service
  }
  
  trackPageView(url: string, title?: string): void {
    // Track page view
  }
  
  // ... other required methods
}

// Use custom provider
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    custom: {
      name: 'MyAnalytics',
      config: { apiKey: 'xxx' },
      handler: new CustomAnalyticsProvider()
    }
  }}
/>
```

### Tracking Additional Events

Use the analytics hook in custom components:

```tsx
import { useSurveyAnalytics } from '@your-package/survey-form/analytics';

function CustomSurveyComponent() {
  const analytics = useSurveyAnalytics({
    surveyId: 'survey-123',
    sessionId: 'session-456'
  });
  
  const handleCustomAction = () => {
    analytics.trackCustomEvent(
      'custom_action',
      'Button clicked',
      1,
      { buttonId: 'special-button' }
    );
  };
  
  return <button onClick={handleCustomAction}>Track Me</button>;
}
```

## Privacy Considerations

- Always comply with GDPR, CCPA, and other privacy regulations
- Implement cookie consent before loading analytics
- Provide opt-out mechanisms
- Don't track personally identifiable information without consent
- Use appropriate data retention policies

## Testing Analytics

### Debug Mode

Enable debug mode to see all analytics events in the console:

```tsx
analytics={{
  googleAnalytics: {
    measurementId: 'G-XXXXXXXXXX',
    debug: true
  },
  googleTagManager: {
    containerId: 'GTM-XXXXXXX',
    debug: true
  }
}}
```

### Google Analytics DebugView

1. Enable debug mode in your implementation
2. Open GA4 > Configure > DebugView
3. Interact with your survey
4. View real-time events

### GTM Preview Mode

1. In GTM, click Preview
2. Enter your survey URL
3. Interact with the survey
4. View fired tags and data layer updates

## Future Providers

The architecture supports adding additional providers:

- **Meta (Facebook) Pixel**: Track conversions and audiences
- **X (Twitter) Pixel**: Track conversions
- **LinkedIn Insight Tag**: B2B tracking
- **Hotjar/FullStory**: Session recording
- **Mixpanel/Amplitude**: Product analytics
- **Custom webhooks**: Send to your own endpoints

## Support

For issues or questions about analytics integration, please refer to the main package documentation or create an issue in the repository.