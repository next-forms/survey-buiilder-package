# Survey Analytics Module

## Overview

This analytics module provides comprehensive tracking for survey forms with support for Google Analytics, Google Tag Manager, and future extensibility for other platforms like Meta and X (Twitter).

## Features

- **Multiple Analytics Providers**: Support for Google Analytics 4, Google Tag Manager, and Meta (Facebook) Pixel
- **Meta Conversion API**: Server-side event tracking for improved accuracy
- **Custom Event Handler**: Pass your own event handler function to receive all analytics events
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

// With Meta Pixel
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    sessionId: 'unique-session-id-123',
    userId: 'user-123',
    meta: {
      pixelId: '1234567890',
      accessToken: 'YOUR_ACCESS_TOKEN',  // Optional: For Conversion API
      testEventCode: 'TEST12345',        // Optional: For testing
      debug: false
    }
  }}
  onSubmit={handleSubmit}
/>

// With Custom Event Handler
<SurveyForm
  survey={surveyData}
  analytics={{
    enabled: true,
    sessionId: 'unique-session-id-123',
    userId: 'user-123',
    trackEvent: (event) => {
      // Receive all analytics events in your custom handler
      console.log('Survey event:', event);
      // Send to your own analytics service
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(event)
      });
    },
    trackPageView: (url: string, title?: string, additionalData?: Record<string, any>) => {
      // Receive all analytics events in your custom handler
      console.log('Survey page update:', additionalData);
      // Send to your own analytics service
      data = [url, title, additionalData];
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    trackTiming: (category: string, variable: string, value: number, label?: string) => {
      // Receive all analytics events in your custom handler
      console.log('Survey page update:', value);
      // Send to your own analytics service
      data = [category, variable, value];
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    setUserProperties: (properties: Record<string, any>) => {
      // Receive all analytics events in your custom handler
      console.log('Survey page update:', properties);
      // Send to your own analytics service
      fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(properties)
      });
    }
  }},
  onSubmit={handleSubmit}
/>

// With All Providers
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
    meta: {
      pixelId: '1234567890',
      accessToken: 'YOUR_ACCESS_TOKEN'
    },
    trackEvent: (event) => {
      // Custom handler receives all events
      myAnalytics.track(event);
    },
    trackFieldInteractions: true,
    trackValidationErrors: true,
    trackTimings: true
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

## Meta Pixel Setup

### Basic Meta Pixel Integration

1. Get your Meta Pixel ID from Facebook Events Manager
2. Add the pixel configuration to your survey:

```tsx
<SurveyForm
  survey={surveyData}
  analytics={{
    meta: {
      pixelId: 'YOUR_PIXEL_ID'
    }
  }}
/>
```

### Meta Conversion API (Server-Side Tracking)

For improved tracking accuracy and privacy compliance, use the Conversion API:

1. Generate an access token in Facebook Events Manager:
   - Go to Events Manager > Settings
   - Generate a Conversions API Access Token
2. Add the token to your configuration:

```tsx
<SurveyForm
  survey={surveyData}
  analytics={{
    meta: {
      pixelId: 'YOUR_PIXEL_ID',
      accessToken: 'YOUR_ACCESS_TOKEN',
      testEventCode: 'TEST12345'  // Optional: for testing
    }
  }}
/>
```

The provider will automatically send events to both the browser pixel and the server-side Conversion API.

### Meta Events Mapping

Survey events are automatically mapped to Meta standard events:

| Survey Event | Meta Event | Use Case |
|--------------|------------|----------|
| `survey_start` | `StartTrial` | Lead generation |
| `survey_complete` | `CompleteRegistration` | Conversion tracking |
| `page_view` | `PageView` | Page tracking |
| `field_complete` | Custom `Survey` event | Engagement tracking |

### Testing Meta Pixel

1. Enable test mode:

```tsx
analytics={{
  meta: {
    pixelId: 'YOUR_PIXEL_ID',
    testEventCode: 'TEST12345',
    debug: true
  }
}}
```

2. Open Facebook Events Manager > Test Events
3. View events as they're tracked in real-time

## Updating User ID Dynamically

If you need to update the userId after the survey has already started (e.g., user logs in mid-survey), you can do so using the `useAnalytics` hook or by updating the SurveyForm prop.

### Method 1: Using the Analytics Hook (Recommended)

This method allows you to update the userId from within a custom block or component:

```tsx
import { useAnalytics } from '@your-package/survey-form/analytics';

function CustomLoginBlock() {
  const analytics = useAnalytics();

  const handleLogin = async (credentials) => {
    // Perform login
    const user = await loginUser(credentials);

    // Update user ID across all analytics providers
    analytics.setUserProperties({
      user_id: user.id,
      email: user.email,
      name: user.name
    });

    // All subsequent events will use this userId
    // Previous events can be linked via sessionId
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

### Method 2: Updating the SurveyForm Prop

You can also update the analytics prop dynamically:

```tsx
function SurveyContainer() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

  const handleUserIdentified = (user) => {
    setUserId(user.id);

    // Also send to backend to link session with user
    fetch('/api/link-session', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: sessionId,
        userId: user.id
      })
    });
  };

  return (
    <>
      <SurveyForm
        survey={surveyData}
        analytics={{
          sessionId: sessionId,
          userId: userId, // Updates dynamically
          googleAnalytics: {
            measurementId: 'G-XXXXXXXXXX'
          },
          meta: {
            pixelId: '1234567890'
          }
        }}
      />

      {/* Custom UI to capture user info */}
      <UserIdentificationModal onIdentified={handleUserIdentified} />
    </>
  );
}
```

### Linking Anonymous Sessions to Users

Since all events are tracked with a `sessionId`, you can link anonymous sessions to users retroactively:

**Frontend - Track with consistent sessionId:**
```tsx
const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);

// Survey starts anonymously
<SurveyForm
  survey={surveyData}
  analytics={{
    sessionId: sessionId, // Consistent throughout
    userId: undefined,    // Will be set later
    googleAnalytics: { measurementId: 'G-XXXXXXXXXX' }
  }}
/>

// Later, when user logs in
analytics.setUserProperties({
  user_id: user.id
});
```

**Backend - Link sessions:**
```typescript
// Pseudo-code for backend
async function linkSessionToUser(sessionId: string, userId: string) {
  // Update all events with this sessionId to include the userId
  await analyticsDB.updateEvents({
    sessionId: sessionId
  }, {
    userId: userId
  });

  // Store the mapping
  await sessionMappings.create({
    sessionId,
    userId,
    linkedAt: new Date()
  });
}
```

### Google Analytics User ID

Google Analytics will automatically associate the userId with the `client_id` when you update it:

```tsx
analytics.setUserProperties({
  user_id: user.id
});

// GA4 will:
// 1. Continue using the same client_id
// 2. Add the user_id to all future events
// 3. Allow you to create a User ID view to analyze cross-device behavior
```

### Meta Pixel - External ID

Meta Pixel uses `external_id` which is automatically updated:

```tsx
analytics.setUserProperties({
  user_id: user.id
});

// Meta Pixel will:
// 1. Update the fbq initialization with new external_id
// 2. Send subsequent events with the updated user identifier
// 3. Allow audience matching for logged-in users
```

### Complete Example with Auth Flow

```tsx
import { useState, useEffect } from 'react';
import { SurveyForm } from '@your-package/survey-form';
import { useAnalytics } from '@your-package/survey-form/analytics';

function AuthAwareSurvey() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [user, setUser] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
        setUser(currentUser);
      }
    };
    checkAuth();
  }, []);

  return (
    <SurveyForm
      survey={surveyData}
      analytics={{
        enabled: true,
        sessionId: sessionId,
        userId: userId,
        googleAnalytics: {
          measurementId: 'G-XXXXXXXXXX'
        },
        meta: {
          pixelId: '1234567890'
        },
        onEvent: (event) => {
          // Send to your backend with session/user binding
          fetch('/api/analytics', {
            method: 'POST',
            body: JSON.stringify({
              ...event,
              sessionId: sessionId,
              userId: userId
            })
          });
        }
      }}
      onSubmit={handleSubmit}
    />
  );
}

// Custom Auth Block Component
function AuthBlockComponent({ value, onChange }) {
  const analytics = useAnalytics();

  const handleAuth = async (authData) => {
    const user = await authenticate(authData);

    // Update analytics providers
    analytics.setUserProperties({
      user_id: user.id,
      email: user.email,
      user_type: user.type,
      registration_date: user.registeredAt
    });

    // Store in form
    onChange({ userId: user.id, ...user });

    // Track authentication event
    analytics.trackEvent({
      category: 'survey',
      action: 'user_authenticated',
      metadata: {
        authMethod: 'email',
        userId: user.id
      }
    });
  };

  return <AuthForm onSubmit={handleAuth} />;
}
```

## Custom Event Handler

The custom event handler allows you to receive all analytics events in your own function, enabling you to:

- Send events to custom analytics services
- Log events to your backend
- Implement custom logic based on survey events
- Debug and monitor survey interactions

### Basic Usage

```tsx
<SurveyForm
  survey={surveyData}
  analytics={{
    onEvent: (event) => {
      console.log('Event:', event.action);
      console.log('Data:', event.metadata);
    }
  }}
/>
```

### Advanced Usage - Custom Analytics Service

```tsx
const handleAnalyticsEvent = (event) => {
  // Send to your backend
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: event.action,
      eventData: {
        category: event.category,
        label: event.label,
        value: event.value,
        metadata: event.metadata,
        sessionId: event.sessionId,
        userId: event.userId,
        surveyId: event.surveyId,
        timestamp: event.timestamp
      }
    })
  });

  // Or send to a third-party service
  if (window.mixpanel) {
    window.mixpanel.track(event.action, event.metadata);
  }
};

<SurveyForm
  survey={surveyData}
  analytics={{
    onEvent: handleAnalyticsEvent,
    // You can still use other providers
    googleAnalytics: {
      measurementId: 'G-XXXXXXXXXX'
    }
  }}
/>
```

### Event Structure

The event object passed to your handler has the following structure:

```typescript
interface SurveyAnalyticsEvent {
  category: 'survey';
  action: SurveyAction;  // 'survey_start' | 'page_view' | 'field_complete' | etc.
  label?: string;
  value?: number;
  sessionId?: string;
  userId?: string;
  surveyId?: string;
  timestamp?: number;
  metadata?: {
    // Varies by event type
    pageIndex?: number;
    pageId?: string;
    fieldId?: string;
    fieldType?: string;
    fieldValue?: any;
    // ... and more
  };
}
```

## Future Providers

The architecture supports adding additional providers:

- **X (Twitter) Pixel**: Track conversions
- **LinkedIn Insight Tag**: B2B tracking
- **Hotjar/FullStory**: Session recording
- **Mixpanel/Amplitude**: Product analytics
- **Custom webhooks**: Send to your own endpoints

## Support

For issues or questions about analytics integration, please refer to the main package documentation or create an issue in the repository.