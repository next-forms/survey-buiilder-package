/**
 * Example: Dynamically updating userId in analytics after survey has started
 *
 * This example demonstrates:
 * 1. Starting a survey with anonymous tracking (sessionId only)
 * 2. User logs in mid-survey
 * 3. Updating all analytics providers with the new userId
 * 4. Linking previous anonymous events to the identified user
 */

import { useState, useEffect } from 'react';
import { SurveyForm } from '../../renderer/SurveyForm';
import { useAnalytics } from '../AnalyticsContext';

// Example 1: Using the analytics hook within a custom component
export function CustomLoginBlock({ onChange, onNext }: { onChange: (value: any) => void; onNext?: () => void }) {
  const analytics = useAnalytics();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      // Simulate API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const user = await response.json();

      // Update analytics providers with user information
      analytics.setUserProperties({
        user_id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.userType,
        login_method: 'email'
      });

      // Track successful authentication
      if (analytics.trackEvent) {
        analytics.trackEvent({
          category: 'survey',
          action: 'user_authenticated',
          label: 'mid_survey_login',
          metadata: {
            authMethod: 'email',
            userId: user.id
          }
        });
      }

      // Store user data in form
      onChange({
        userId: user.id,
        userEmail: user.email,
        userName: user.name
      });

      // Continue to next step
      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="custom-login-block">
      <h3>Please log in to continue</h3>
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}

// Example 2: Survey container with dynamic userId
export function DynamicUserIdSurveyExample() {
  // Generate a consistent sessionId that persists throughout the survey
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);

  // UserId starts as undefined and gets set when user logs in
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const user = await response.json();
          setUserId(user.id);
          setUserEmail(user.email);
        }
      } catch (error) {
        // User is not logged in, start anonymously
        console.log('Starting survey anonymously');
      }
    };

    checkExistingAuth();
  }, []);

  const handleUserIdentified = async (user: { id: string; email: string; name: string }) => {
    // Update local state
    setUserId(user.id);
    setUserEmail(user.email);

    // Send session-user mapping to backend for retroactive linking
    try {
      await fetch('/api/analytics/link-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to link session to user:', error);
    }
  };

  const handleSurveySubmit = async (data: any) => {
    // Include session and user information in submission
    const submissionData = {
      ...data,
      sessionId: sessionId,
      userId: userId,
      userEmail: userEmail,
      submittedAt: new Date().toISOString()
    };

    await fetch('/api/surveys/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
  };

  return (
    <div className="survey-container">
      <SurveyForm
        survey={surveyData}
        analytics={{
          enabled: true,
          sessionId: sessionId,
          userId: userId, // Starts undefined, updates when user logs in
          surveyId: 'demo-survey-001',

          // Google Analytics
          googleAnalytics: {
            measurementId: 'G-XXXXXXXXXX',
            debug: true
          },

          // Google Tag Manager
          googleTagManager: {
            containerId: 'GTM-XXXXXXX'
          },

          // Meta Pixel
          meta: {
            pixelId: '1234567890',
            accessToken: 'YOUR_ACCESS_TOKEN' // Optional: for Conversion API
          },

          // Custom event handler - send all events to your backend
          onEvent: (event) => {
            fetch('/api/analytics/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...event,
                sessionId: sessionId,
                userId: userId, // Will be undefined initially, then set after login
                userEmail: userEmail,
                timestamp: new Date().toISOString()
              })
            }).catch(console.error);
          },

          trackFieldInteractions: true,
          trackValidationErrors: true,
          trackTimings: true
        }}
        onSubmit={handleSurveySubmit}
        enableDebug={true}
      />

      {/* Optional: External login UI */}
      {!userId && (
        <ExternalLoginPrompt onLogin={handleUserIdentified} />
      )}
    </div>
  );
}

// Example 3: Using window events to update userId from anywhere
export function GlobalUserIdUpdateExample() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Listen for user authentication events from anywhere in your app
    const handleUserAuthenticated = (event: CustomEvent) => {
      const { userId: newUserId, email } = event.detail;

      console.log('User authenticated, updating analytics:', newUserId);
      setUserId(newUserId);

      // Optionally send to backend
      fetch('/api/analytics/link-session', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          userId: newUserId,
          email
        })
      });
    };

    window.addEventListener('user-authenticated', handleUserAuthenticated as EventListener);

    return () => {
      window.removeEventListener('user-authenticated', handleUserAuthenticated as EventListener);
    };
  }, [sessionId]);

  return (
    <SurveyForm
      survey={surveyData}
      analytics={{
        sessionId,
        userId, // Updates when user-authenticated event fires
        googleAnalytics: { measurementId: 'G-XXXXXXXXXX' }
      }}
    />
  );
}

// Helper: Trigger user authentication from anywhere
export function triggerUserAuthentication(userId: string, email: string) {
  const event = new CustomEvent('user-authenticated', {
    detail: { userId, email }
  });
  window.dispatchEvent(event);
}

// Sample data and components for the examples above
const surveyData = {
  rootNode: {
    type: 'set',
    items: [
      {
        type: 'set',
        label: 'Welcome',
        items: [
          {
            type: 'text',
            fieldName: 'name',
            label: 'What is your name?'
          }
        ]
      },
      {
        type: 'set',
        label: 'Login',
        items: [
          {
            type: 'custom',
            component: CustomLoginBlock
          }
        ]
      },
      {
        type: 'set',
        label: 'Preferences',
        items: [
          {
            type: 'radio',
            fieldName: 'preference',
            label: 'What do you prefer?',
            values: ['Option 1', 'Option 2', 'Option 3']
          }
        ]
      }
    ]
  }
};

function LoginForm({ onSubmit, isLoading }: { onSubmit: (email: string, password: string) => void; isLoading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(email, password);
    }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

function ExternalLoginPrompt({ onLogin }: { onLogin: (user: any) => void }) {
  return (
    <div className="external-login-prompt">
      <p>Sign in to save your progress</p>
      <button onClick={async () => {
        // Simulate login
        const user = { id: 'user_123', email: 'user@example.com', name: 'John Doe' };
        onLogin(user);
      }}>
        Sign In
      </button>
    </div>
  );
}
