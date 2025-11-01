# Custom Layouts Guide

This guide explains how to create custom layouts for the unified survey form package.

## Overview

The layout system allows you to create completely custom survey rendering layouts. With our helper components, you can focus on the visual design while we handle all the complexity:

✅ **Automatic analytics tracking** - Built-in, no setup required
✅ **Auto block rendering** - Just place `<CurrentBlock />` where you want questions
✅ **Auto navigation logic** - Submit vs Next button handled automatically
✅ **Auto progress calculation** - Multiple progress indicator styles ready to use
✅ **Type-safe** - Full TypeScript support

## 🎨 Three Approaches - Choose What Works for You

The layout system is **completely flexible**. Choose the approach that fits your needs:

### 1. **Helper Components** (Fastest - Recommended for most cases)
Use pre-built components for common functionality. Takes ~10 lines of code.
```typescript
<CurrentBlock />
<NavigationButtons />
```

### 2. **Hybrid Approach** (Flexible - Best of both worlds)
Mix helpers with your own custom components. Use helpers where convenient, custom code where you need unique design.
```typescript
<MyCustomProgressBar />  {/* Your design */}
<CurrentBlock />          {/* Use helper */}
<MyCustomNavigation />    {/* Your design */}
```

### 3. **Fully Custom** (Maximum Control - Total creative freedom)
Build everything from scratch using `useSurveyForm()` hook. Perfect for unique brand experiences.
```typescript
// Access all survey state and methods
const { currentPage, values, setValue, goToNextBlock, ... } = useSurveyForm();
// Build whatever you want!
```

**Important:** Helpers are **100% optional**. You can use all helpers, some helpers, or no helpers at all. The choice is yours!

## Quick Start - The Easy Way

### Using Helper Components (Recommended)

The simplest way to create a custom layout is using our helper components:

```typescript
import {
  CurrentBlock,
  NavigationButtons,
  ProgressIndicator
} from 'survey-form-package';

const MyCustomLayout = () => (
  <div className="my-layout">
    {/* Progress bar - automatically calculated */}
    <ProgressIndicator type="bar" showPercentage showStepInfo />

    {/* Current question - automatically rendered with proper wiring */}
    <CurrentBlock className="my-4" autoFocus />

    {/* Navigation - automatically handles submit vs next */}
    <NavigationButtons />
  </div>
);

// Use it
<SurveyForm survey={data} layout={MyCustomLayout} />
```

**That's it!** No manual state management, no BlockRenderer imports, no form submission logic. Everything is handled automatically, including analytics tracking.

## Complete Example: Beautiful Card Layout

```typescript
import React from 'react';
import type { LayoutProps } from 'survey-form-package';
import {
  CurrentBlock,
  NavigationButtons,
  ProgressIndicator
} from 'survey-form-package';

export const BeautifulCardLayout: React.FC<LayoutProps> = ({ logo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        {logo && <div className="text-center mb-6">{logo}</div>}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Progress - using built-in styles */}
          <ProgressIndicator
            type="bar"
            showPercentage
            showStepInfo
            color="bg-gradient-to-r from-indigo-500 to-purple-600"
            height="12px"
            className="mb-8"
          />

          {/* Question */}
          <CurrentBlock className="mb-8" autoFocus />

          {/* Navigation with custom styles */}
          <NavigationButtons
            previousText="Back"
            nextText="Continue →"
            submitText="Complete Survey"
            renderNextButton={({ disabled, text }) => (
              <button
                type="submit"
                disabled={disabled}
                className={`px-8 py-3 rounded-lg font-semibold text-white ${
                  disabled
                    ? 'bg-gray-300'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg'
                }`}
              >
                {text}
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
};
```

## Helper Components

### CurrentBlock

Automatically renders the current survey block with all proper wiring.

**Props:**
```typescript
interface CurrentBlockProps {
  className?: string;              // Custom styling
  autoFocus?: boolean;             // Auto-focus input on change
  onValueChange?: (fieldName: string, value: any) => void; // Value change callback
  wrapper?: React.ComponentType<{ children: ReactNode }>; // Wrap block in custom component
}
```

**Usage:**
```typescript
// Simple
<CurrentBlock />

// With styling
<CurrentBlock className="my-4 p-6" />

// With auto-focus
<CurrentBlock autoFocus />

// With callback
<CurrentBlock onValueChange={(field, value) => console.log(field, value)} />
```

**What it handles automatically:**
- Gets current page and block index
- Retrieves the correct block data
- Wires up onChange handlers
- Passes errors and theme
- Handles auto-continue if configured
- Focuses input when block changes (if autoFocus=true)

### NavigationButtons

Renders navigation buttons with automatic submit vs next logic.

**Props:**
```typescript
interface NavigationButtonsProps {
  className?: string;
  showPrevious?: boolean;          // Show back button (default: true)
  showNext?: boolean;              // Show next/submit button (default: true)
  previousText?: string;           // Back button text
  nextText?: string;               // Next button text
  submitText?: string;             // Submit button text
  align?: 'left' | 'center' | 'right' | 'space-between';
  variant?: 'default' | 'custom';  // Use default styles or custom
  renderPreviousButton?: (props) => ReactNode;  // Custom back button
  renderNextButton?: (props) => ReactNode;      // Custom next button
  onNavigate?: (direction) => void; // Navigation callback
}
```

**Usage:**
```typescript
// Default styling
<NavigationButtons />

// Custom text
<NavigationButtons
  previousText="Go Back"
  nextText="Continue"
  submitText="Finish"
/>

// Custom render
<NavigationButtons
  variant="custom"
  renderNextButton={({ disabled, text, isSubmit }) => (
    <button
      type="submit"
      disabled={disabled}
      className="my-custom-button"
    >
      {text}
    </button>
  )}
/>

// With navigation callback
<NavigationButtons
  onNavigate={(direction) => {
    console.log('Navigating:', direction); // 'previous', 'next', or 'submit'
  }}
/>
```

**What it handles automatically:**
- Form submission handling
- Determines if current step is last (submit vs next)
- Checks if previous button should show (based on history)
- Validates current step before allowing navigation
- Respects block's `showContinueButton` configuration
- Calls appropriate navigation functions
- Includes proper TypeScript types

### ProgressIndicator

Renders progress indicators with automatic calculation.

**Props:**
```typescript
interface ProgressIndicatorProps {
  type?: 'bar' | 'dots' | 'numbers' | 'percentage' | 'steps';
  showPercentage?: boolean;        // Show percentage text
  showStepInfo?: boolean;          // Show "Question X of Y"
  className?: string;
  color?: string;                  // Progress color (Tailwind class)
  backgroundColor?: string;        // Background color
  height?: string | number;        // Bar height
  animate?: boolean;               // Enable animations (default: true)
  render?: (props) => ReactNode;   // Custom render function
}
```

**Usage:**
```typescript
// Simple progress bar
<ProgressIndicator />

// With percentage and step info
<ProgressIndicator
  type="bar"
  showPercentage
  showStepInfo
/>

// Dots style
<ProgressIndicator type="dots" />

// Numbers
<ProgressIndicator type="numbers" />

// Steps (stepper UI)
<ProgressIndicator type="steps" />

// Custom colors
<ProgressIndicator
  type="bar"
  color="bg-gradient-to-r from-purple-500 to-pink-500"
  backgroundColor="bg-purple-100"
  height="16px"
/>

// Custom render
<ProgressIndicator
  render={({ progress, currentStep, totalSteps }) => (
    <div>
      <h3>Question {currentStep} of {totalSteps}</h3>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
    </div>
  )}
/>
```

**What it handles automatically:**
- Calculates actual progress (accounts for conditional logic)
- Gets current step position
- Gets total visible steps
- Applies theme colors
- Handles animations
- Supports multiple visualization types

## Advanced: Custom Render Functions

All helper components support custom render functions for maximum flexibility:

```typescript
export const AdvancedLayout: React.FC<LayoutProps> = () => {
  return (
    <div className="advanced-layout">
      {/* Custom progress with gradient */}
      <ProgressIndicator
        render={({ progress, currentStep, totalSteps }) => (
          <div>
            <div className="flex justify-between mb-2">
              <span>Step {currentStep}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      />

      {/* Question with custom wrapper */}
      <CurrentBlock
        wrapper={({ children }) => (
          <div className="question-card border-2 border-blue-500 p-6">
            {children}
          </div>
        )}
      />

      {/* Navigation with icons */}
      <NavigationButtons
        variant="custom"
        renderPreviousButton={({ onClick, disabled, text }) => (
          <button onClick={onClick} disabled={disabled}>
            ← {text}
          </button>
        )}
        renderNextButton={({ disabled, text, isSubmit }) => (
          <button type="submit" disabled={disabled}>
            {text} {!isSubmit && '→'}
          </button>
        )}
      />
    </div>
  );
};
```

## Analytics - Automatic!

**Important:** Analytics tracking is **automatically included** for all custom layouts. You don't need to do anything!

When you pass a layout component to `<SurveyForm>`, it's automatically wrapped with analytics tracking. This includes:

- ✅ Survey start/complete tracking
- ✅ Page view tracking
- ✅ Navigation tracking
- ✅ Field interaction tracking
- ✅ Validation error tracking
- ✅ Timing metrics

Just configure analytics in your `<SurveyForm>` props and it works:

```typescript
<SurveyForm
  survey={surveyData}
  layout={MyCustomLayout}  // Analytics automatically included!
  analytics={{
    enabled: true,
    sessionId: "session-123",
    googleAnalytics: { measurementId: "G-XXXXXX" }
  }}
/>
```

## Building Fully Custom Layouts (No Helpers)

Want **complete control** over your layout design? You can build everything from scratch using the `useSurveyForm()` hook. This gives you maximum flexibility for unique brand experiences.

### Custom Progress Bar Example

```typescript
import { useSurveyForm } from 'survey-form-package';

const MyCustomLayout = () => {
  const { currentPage, totalPages, getActualProgress } = useSurveyForm();
  const progress = getActualProgress();

  return (
    <div>
      {/* Your completely custom progress bar */}
      <div className="my-custom-progress">
        <div className="progress-segments flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 rounded-full transition-all ${
                i < currentPage ? 'bg-green-500' :
                i === currentPage ? 'bg-blue-500' :
                'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-center mt-2">
          <span className="text-2xl font-bold">{Math.round(progress)}%</span>
        </div>
      </div>
      {/* Rest of your layout... */}
    </div>
  );
};
```

### Custom Navigation Buttons Example

```typescript
import { useSurveyForm, getSurveyPages } from 'survey-form-package';

const MyCustomLayout = () => {
  const {
    currentPage,
    currentBlockIndex,
    goToNextBlock,
    goToPreviousBlock,
    canGoBack,
    isLastPage,
    submit,
    isValid,
    surveyData,
  } = useSurveyForm();

  const pages = getSurveyPages(surveyData.rootNode);
  const currentPageBlocks = pages[currentPage] || [];
  const isFinalStep = isLastPage && currentBlockIndex === currentPageBlocks.length - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinalStep) {
      submit();
    } else {
      goToNextBlock();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your questions here... */}

      {/* Your completely custom navigation */}
      <div className="my-custom-navigation">
        {canGoBack && (
          <button
            type="button"
            onClick={goToPreviousBlock}
            className="custom-back-btn"
          >
            ← Back
          </button>
        )}

        <button
          type="submit"
          disabled={!isValid}
          className="custom-next-btn"
        >
          {isFinalStep ? 'Submit Survey 🎉' : 'Continue →'}
        </button>
      </div>
    </form>
  );
};
```

### Custom Block Rendering Example

```typescript
import { useSurveyForm, getSurveyPages, BlockRenderer } from 'survey-form-package';

const MyCustomLayout = () => {
  const {
    currentPage,
    currentBlockIndex,
    values,
    setValue,
    errors,
    theme,
    surveyData,
  } = useSurveyForm();

  const pages = getSurveyPages(surveyData.rootNode);
  const currentPageBlocks = pages[currentPage] || [];
  const currentBlock = currentPageBlocks[currentBlockIndex];

  if (!currentBlock) return null;

  return (
    <div>
      {/* Wrap block in your custom design */}
      <div className="my-custom-question-card">
        <div className="question-number">
          Question {currentBlockIndex + 1}
        </div>

        <BlockRenderer
          block={currentBlock}
          value={currentBlock.fieldName ? values[currentBlock.fieldName] : undefined}
          onChange={(value) => {
            if (currentBlock.fieldName) {
              setValue(currentBlock.fieldName, value);
            }
          }}
          error={currentBlock.fieldName ? errors[currentBlock.fieldName] : undefined}
          theme={theme}
        />

        {/* Custom disclaimer */}
        {currentBlock.disclaimer && (
          <div className="custom-disclaimer">
            ℹ️ {currentBlock.disclaimer}
          </div>
        )}
      </div>
    </div>
  );
};
```

### Complete Fully Custom Example

See `FullyCustomLayout.tsx` in the demo app for a complete example with:
- ✨ Custom animated progress bar with shimmer effect
- 🎨 Custom gradient navigation buttons
- 🎯 Custom step indicators
- 💫 Custom hover effects and transitions
- 📱 Fully responsive design

### Available Survey Context Methods

When building custom layouts, you have access to everything via `useSurveyForm()`:

```typescript
const {
  // Current state
  currentPage,              // Current page index
  currentBlockIndex,        // Current block within page
  totalPages,               // Total number of pages
  values,                   // All form values
  errors,                   // Validation errors
  isValid,                  // Current step validation status
  isFirstPage,              // Whether on first page
  isLastPage,               // Whether on last page
  isSubmitting,             // Submission in progress

  // Navigation methods
  goToPage,                 // Jump to specific page
  goToNextPage,             // Next page
  goToPreviousPage,         // Previous page
  goToNextBlock,            // Next block (handles page transitions)
  goToPreviousBlock,        // Previous block
  submit,                   // Submit survey

  // Value management
  setValue,                 // Set field value
  setError,                 // Set field error

  // Survey data
  surveyData,               // Full survey configuration
  theme,                    // Theme configuration
  language,                 // Current language
  setLanguage,              // Change language

  // Advanced
  navigationHistory,        // Navigation history array
  canGoBack,                // Whether back is available
  getActualProgress,        // Get progress percentage
  getTotalVisibleSteps,     // Total steps (accounting for conditions)
  getCurrentStepPosition,   // Current step number
  getVisibleBlocks,         // Filter visible blocks
  evaluateCondition,        // Evaluate conditional logic
  validateField,            // Validate specific field

  // Props
  logo,                     // Logo prop passed to SurveyForm
  analytics,                // Analytics configuration
} = useSurveyForm();
```

### Helper Utilities

```typescript
import {
  getSurveyPages,           // Get all pages from survey data
  BlockRenderer,            // Render individual blocks
  useSurveyForm,            // Survey context hook
} from 'survey-form-package';
```

## Hybrid Approach - Best of Both Worlds

You don't have to choose between helpers and custom code. Mix and match!

**Example:** Custom progress bar + Helper components for the rest

```typescript
const HybridLayout = () => {
  const { getActualProgress } = useSurveyForm();

  return (
    <div>
      {/* Your custom progress bar */}
      <MyAwesomeProgressBar progress={getActualProgress()} />

      {/* Use helpers for the rest */}
      <CurrentBlock className="my-4" />
      <NavigationButtons />
    </div>
  );
};
```

See `HybridLayout.tsx` in the demo app for a complete example showing:
- 🎨 Custom multi-segment progress bar
- 🔧 CurrentBlock helper for easy rendering
- 🎯 NavigationButtons helper with custom styling
- 💡 Custom header and footer sections

## Registration Methods

### Method 1: Direct Component Passing (Recommended for single-use)

```typescript
<SurveyForm
  survey={surveyData}
  layout={MyCustomLayout}
  onSubmit={handleSubmit}
/>
```

### Method 2: Global Registration (Recommended for reusable layouts)

```typescript
import { registerLayout } from 'survey-form-package';

// Register once in app initialization
registerLayout({
  name: 'my-custom-layout',
  description: 'A beautiful card layout',
  component: MyCustomLayout
});

// Use anywhere by name
<SurveyForm
  survey={surveyData}
  layout="my-custom-layout"
  onSubmit={handleSubmit}
/>
```

## Migration from Manual Approach

If you previously created layouts manually with `useSurveyForm()` and `BlockRenderer`, you can simplify:

**Before (Manual - ~100+ lines):**
```typescript
const OldLayout = () => {
  const {
    currentPage, currentBlockIndex, values, setValue,
    errors, goToNextBlock, goToPreviousBlock, isLastPage,
    submit, isValid, theme, surveyData
  } = useSurveyForm();

  const pages = getSurveyPages(surveyData.rootNode);
  const currentPageBlocks = pages[currentPage];
  const currentBlock = currentPageBlocks[currentBlockIndex];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLastPage && currentBlockIndex === currentPageBlocks.length - 1) {
      submit();
    } else {
      goToNextBlock();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <BlockRenderer
        block={currentBlock}
        value={values[currentBlock.fieldName]}
        onChange={(value) => {
          if (currentBlock.fieldName) {
            setValue(currentBlock.fieldName, value);
          }
        }}
        error={errors[currentBlock.fieldName]}
        theme={theme}
      />
      <button type="button" onClick={goToPreviousBlock}>Previous</button>
      <button type="submit" disabled={!isValid}>
        {isLastPage ? 'Submit' : 'Next'}
      </button>
    </form>
  );
};
```

**After (With Helpers - ~20 lines):**
```typescript
const NewLayout = () => (
  <div>
    <CurrentBlock />
    <NavigationButtons />
  </div>
);
```

## Best Practices

### 1. Use Helper Components
Always prefer helper components over manual state management:
- ✅ `<CurrentBlock />` instead of manual `BlockRenderer`
- ✅ `<NavigationButtons />` instead of manual form submission
- ✅ `<ProgressIndicator />` instead of manual progress calculation

### 2. Focus on Design
Let helpers handle the mechanics, you focus on:
- Visual design and styling
- Layout and spacing
- Animations and transitions
- Brand identity

### 3. Leverage Custom Render
Use `render` props for maximum flexibility while keeping automatic behavior:
```typescript
<ProgressIndicator
  render={({ progress }) => <MyCustomProgressBar value={progress} />}
/>
```

### 4. Test Responsiveness
Ensure your custom layout works on mobile:
```typescript
<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
  <CurrentBlock />
</div>
```

### 5. Accessibility
Helper components include basic accessibility, but enhance as needed:
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## Troubleshooting

### Helper Components Not Rendering

**Issue:** Nothing shows on screen
**Fix:** Ensure you're rendering inside `<SurveyForm>` context

### Navigation Not Working

**Issue:** Buttons don't navigate
**Fix:** `<NavigationButtons />` must be inside its own form OR use the default variant which handles this

### Progress Stuck at 0%

**Issue:** Progress doesn't update
**Fix:** Ensure survey data has proper page structure with UUIDs

### TypeScript Errors

**Issue:** Type errors with custom render
**Fix:** Check the prop types in the interface definitions

## Examples Gallery

### Minimal Layout
```typescript
const MinimalLayout = () => (
  <div className="max-w-xl mx-auto p-4">
    <CurrentBlock />
    <NavigationButtons className="mt-4" />
  </div>
);
```

### Full-Featured Layout
```typescript
const FullLayout: React.FC<LayoutProps> = ({ logo }) => (
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-3xl mx-auto">
      {logo && <div className="mb-4">{logo}</div>}
      <ProgressIndicator type="bar" showStepInfo showPercentage />
      <div className="bg-white rounded-lg shadow p-6 my-4">
        <CurrentBlock autoFocus />
      </div>
      <NavigationButtons align="space-between" />
    </div>
  </div>
);
```

### Mobile-First Layout
```typescript
const MobileLayout = () => (
  <div className="min-h-screen flex flex-col">
    <header className="bg-white border-b p-4">
      <ProgressIndicator type="dots" />
    </header>
    <main className="flex-1 p-4">
      <CurrentBlock />
    </main>
    <footer className="bg-white border-t p-4">
      <NavigationButtons />
    </footer>
  </div>
);
```

## Available Resources

### UI Components

Your custom layouts have access to a comprehensive set of shadcn/ui components:

- **Form Inputs**: Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch, Slider
- **Layout**: Card, Separator, ScrollArea, Collapsible, Tabs
- **Feedback**: Alert, Badge, Progress, Dialog, Popover
- **Buttons**: Button, Toggle, ToggleGroup

**Import from**: `@/components/ui/[component-name]`

Example:
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
```

### Icons

Access to 1000+ Lucide React icons:

```typescript
import { ArrowLeft, Check, AlertCircle, Heart } from "lucide-react";

// Usage in your layout
<ArrowLeft className="h-4 w-4" />
```

### Available NPM Packages

Your layouts can import from these pre-installed packages:

**Charts & Visualization**:
- `recharts` - Composable charting library
- `chart.js` & `react-chartjs-2` - Canvas-based charts

**Forms & Validation**:
- `react-hook-form` - Performant forms
- `zod` - TypeScript-first schema validation

**Date & Time**:
- `date-fns` - Modern date utilities
- `react-day-picker` - Flexible date picker

**Rich Text**:
- `@tiptap/react` - Headless rich-text editor
- `react-markdown` - Markdown component

**Animations**:
- `framer-motion` - Production-ready animations

Example:
```typescript
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis } from "recharts";
```

### Theme Access

Access theme properties for consistent styling:

```typescript
const { theme } = useSurveyForm();

// Available theme properties:
theme.colors.primary        // Primary color hex
theme.colors.background     // Background color
theme.button.primary        // Primary button classes
theme.field.label          // Label styling
theme.progress.bar         // Progress bar styling
// ... and many more
```

### Helper Components

The following helper components are available to make layout development easier:

**CurrentBlock** - Automatically renders the current question:
```typescript
<CurrentBlock
  className="my-4"
  autoFocus={true}
  onValueChange={(field, value) => console.log(field, value)}
/>
```

**NavigationButtons** - Handles prev/next/submit logic:
```typescript
<NavigationButtons
  showPrevious={true}
  nextText="Continue"
  submitText="Finish"
  variant="custom"
  renderNextButton={({ disabled, text, isSubmit }) => (
    <button type="submit" disabled={disabled}>
      {text}
    </button>
  )}
/>
```

**ProgressIndicator** - Shows survey progress:
```typescript
<ProgressIndicator
  type="bar"        // or "dots", "numbers", "percentage", "steps"
  showPercentage={true}
  showStepInfo={true}
  color="bg-blue-600"
/>
```

## API Reference

For complete TypeScript definitions, see:
- `src/types.ts` - LayoutProps interface
- `src/renderer/layouts/helpers/` - Helper component implementations

## Need Help?

- Check out `CustomSimpleLayout.tsx` in the demo app for a working example
- Review `RenderPageSurveyLayout.tsx` for the default implementation
- All helpers use the same `useSurveyForm()` context you can access if needed
