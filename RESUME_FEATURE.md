# Survey Resume & Save Feature

This document explains how to implement save and resume functionality for survey forms.

## Overview

The survey form package now supports:
- **Loading saved answers** - Resume a survey with previously entered data
- **Starting from a specific page** - Continue from where the user left off
- **Combining with default values** - Pre-populate fields while still allowing resume

## API

### New Props

```typescript
interface SurveyFormRendererProps {
  // ... existing props

  initialValues?: Record<string, any>; // For loading saved answers
  startPage?: number;                   // For resuming from specific page (0-indexed)
}
```

### Key Differences

- **`defaultValues`**: Pre-populated field values (e.g., from user profile)
- **`initialValues`**: Previously saved survey answers for resume functionality
- When both are provided, `initialValues` takes precedence

## Implementation Guide

### 1. Basic Save & Resume

```tsx
import { SurveyForm } from '@your-package/survey-form';

function SurveyWithResume() {
  const [savedData, setSavedData] = useState(null);
  const [savedPage, setSavedPage] = useState(0);

  // Save progress on every change
  const handleChange = (data) => {
    localStorage.setItem('surveyAnswers', JSON.stringify(data));
    setSavedData(data);
  };

  // Save current page
  const handlePageChange = (pageIndex, totalPages) => {
    localStorage.setItem('surveyPage', pageIndex.toString());
    setSavedPage(pageIndex);
  };

  // Load saved progress
  const loadProgress = () => {
    const answers = localStorage.getItem('surveyAnswers');
    const page = localStorage.getItem('surveyPage');

    if (answers) {
      setSavedData(JSON.parse(answers));
      setSavedPage(page ? parseInt(page) : 0);
    }
  };

  return (
    <SurveyForm
      survey={surveyData}
      onChange={handleChange}
      onPageChange={handlePageChange}
      initialValues={savedData}
      startPage={savedPage}
    />
  );
}
```

### 2. Backend Integration

```tsx
// API-based save/resume
function SurveyWithBackend({ userId }) {
  const [resumeData, setResumeData] = useState(null);

  // Load saved progress on mount
  useEffect(() => {
    fetch(`/api/surveys/${surveyId}/progress/${userId}`)
      .then(res => res.json())
      .then(data => {
        setResumeData(data);
      });
  }, [userId]);

  // Auto-save with debouncing
  const debouncedSave = useMemo(
    () => debounce((data, page) => {
      fetch(`/api/surveys/${surveyId}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          answers: data,
          currentPage: page
        })
      });
    }, 1000),
    [userId]
  );

  const handleChange = (data) => {
    debouncedSave(data, currentPage);
  };

  return (
    <SurveyForm
      survey={surveyData}
      onChange={handleChange}
      initialValues={resumeData?.answers}
      startPage={resumeData?.currentPage || 0}
    />
  );
}
```

### 3. Advanced Features

```tsx
// Complete implementation with session management
function AdvancedSurveyResume() {
  const [sessionId] = useState(() => generateSessionId());
  const [resumeState, setResumeState] = useState({
    answers: {},
    currentPage: 0,
    timeSpent: 0,
    lastSaved: null
  });

  // Track time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setResumeState(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle progress saving
  const saveProgress = async (data, pageIndex) => {
    const progress = {
      sessionId,
      answers: data,
      currentPage: pageIndex,
      timeSpent: resumeState.timeSpent,
      lastSaved: new Date().toISOString()
    };

    // Save to backend
    await fetch('/api/survey-progress', {
      method: 'POST',
      body: JSON.stringify(progress)
    });

    // Update local state
    setResumeState(progress);

    // Show save indicator
    toast.success('Progress saved');
  };

  // Check for existing sessions
  const checkExistingSessions = async () => {
    const sessions = await fetch('/api/survey-sessions').then(r => r.json());

    if (sessions.length > 0) {
      const resume = confirm('Found previous session. Resume?');
      if (resume) {
        const latest = sessions[0];
        setResumeState(latest);
      }
    }
  };

  return (
    <>
      <div className="save-indicator">
        {resumeState.lastSaved &&
          `Last saved: ${formatTime(resumeState.lastSaved)}`
        }
      </div>

      <SurveyForm
        survey={surveyData}
        onChange={(data) => saveProgress(data, resumeState.currentPage)}
        onPageChange={(page) => saveProgress(resumeState.answers, page)}
        initialValues={resumeState.answers}
        startPage={resumeState.currentPage}
      />
    </>
  );
}
```

## Data Flow

```
1. User starts survey
   ↓
2. onChange → Save answers to storage
   ↓
3. onPageChange → Save current page index
   ↓
4. User leaves and returns
   ↓
5. Load saved data → Pass to initialValues
   ↓
6. Load saved page → Pass to startPage
   ↓
7. Survey resumes from saved state
```

## Best Practices

1. **Auto-save**: Implement debounced auto-saving to prevent data loss
2. **Conflict resolution**: Handle cases where survey structure changes
3. **Expiration**: Set expiration for saved progress (e.g., 30 days)
4. **Security**: Authenticate users before loading saved data
5. **Validation**: Validate loaded data against current survey schema
6. **Migration**: Handle schema changes gracefully

## Migration from Existing Surveys

If you're already using `defaultValues`, you can add resume functionality:

```tsx
// Before
<SurveyForm
  defaultValues={userProfile}
  onChange={handleChange}
/>

// After - maintains defaultValues, adds resume
<SurveyForm
  defaultValues={userProfile}        // Pre-filled from profile
  initialValues={savedAnswers}       // Override with saved progress
  startPage={savedPage}              // Resume from saved page
  onChange={handleChange}
/>
```

## Storage Options

### Local Storage
- Simple implementation
- No backend required
- Limited to ~5-10MB
- Per-device only

### Session Storage
- Temporary (cleared on tab close)
- Good for draft saving
- Same size limits as localStorage

### Backend Database
- Unlimited storage
- Cross-device synchronization
- Requires authentication
- Can track analytics

### IndexedDB
- Large storage capacity
- Offline support
- Complex queries possible
- Requires more setup

## Error Handling

```tsx
const loadSavedProgress = async () => {
  try {
    const saved = await fetchSavedProgress();

    // Validate saved data matches current survey
    if (validateSurveySchema(saved, currentSurvey)) {
      setInitialValues(saved.answers);
      setStartPage(saved.page);
    } else {
      // Schema mismatch - prompt user
      if (confirm('Survey has been updated. Start fresh?')) {
        clearSavedProgress();
      }
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
    // Continue without resume
  }
};
```

## Testing

Test these scenarios:
1. Save and resume from different pages
2. Resume with partial data
3. Resume after survey structure changes
4. Multiple concurrent sessions
5. Network failures during save
6. Storage quota exceeded