import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Package, Sun, Moon, Monitor, Smartphone, Tablet, Laptop, Monitor as MonitorIcon } from "lucide-react";
import { SurveyForm } from "../../../renderer/SurveyForm";
import { ThemeDefinition, SurveyBuilderState } from "../../../types";

// Import the theme isolation CSS
import '../../../styles/survey-theme-isolation.css';

// Theme mode type
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemePreviewProps {
  theme: ThemeDefinition;
  state: SurveyBuilderState;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, state }) => {
  const [surveyThemeMode, setSurveyThemeMode] = useState<ThemeMode>('light');
  const [previewWidth, setPreviewWidth] = useState(400);

  // Predefined viewport sizes
  const viewportPresets = [
    { name: "Mobile", width: 375, icon: Smartphone },
    { name: "Tablet", width: 768, icon: Tablet },
    { name: "Desktop", width: 1024, icon: Laptop },
    { name: "Large", width: 1440, icon: MonitorIcon },
  ];

  // Handle system theme changes
  useEffect(() => {
    if (surveyThemeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Force re-render when system theme changes
        setSurveyThemeMode('system');
      };
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [surveyThemeMode]);

  // Determine if we should use dark theme
  const isDarkMode = surveyThemeMode === 'dark' || 
    (surveyThemeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Create theme-specific CSS variables that override default values
  const surveyThemeStyle = {
    // Use CSS custom properties to override within the survey scope
    '--survey-primary': theme.colors.primary,
    '--survey-secondary': theme.colors.secondary,
    '--survey-accent': theme.colors.accent,
    '--survey-success': theme.colors.success || (isDarkMode ? 'oklch(0.696 0.17 162.48)' : 'oklch(0.6 0.118 184.704)'),
    '--survey-error': theme.colors.error || (isDarkMode ? 'oklch(0.704 0.191 22.216)' : 'oklch(0.577 0.245 27.325)'),
    '--survey-background': theme.colors.background || (isDarkMode ? 'oklch(0.141 0.005 285.823)' : 'oklch(0.99 0.002 286)'),
    '--survey-text': theme.colors.text || (isDarkMode ? 'oklch(0.985 0 0)' : 'oklch(0.141 0.005 285.823)'),
    '--survey-border': theme.colors.border || (isDarkMode ? 'oklch(1 0 0 / 12%)' : 'oklch(0.94 0.002 286.32)'),
    '--survey-surface': isDarkMode ? 'oklch(0.21 0.006 285.885)' : 'oklch(1 0 0)',
    '--survey-text-muted': isDarkMode ? 'oklch(0.705 0.015 286.067)' : 'oklch(0.552 0.016 285.938)',
    '--survey-input': isDarkMode ? 'oklch(1 0 0 / 18%)' : 'oklch(0.96 0.002 286.32)',
    '--survey-ring': isDarkMode ? 'oklch(0.552 0.016 285.938)' : 'oklch(0.705 0.015 286.067)',
    '--survey-bg': theme.colors.background || (isDarkMode ? 'oklch(0.141 0.005 285.823)' : 'oklch(0.99 0.002 286)'),
    '--survey-shadow': isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--survey-shadow-lg': isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  } as React.CSSProperties;

  // Determine theme class based on mode
  const getThemeClass = () => {
    switch (surveyThemeMode) {
      case 'light': return 'survey-theme-light';
      case 'dark': return 'survey-theme-dark';
      case 'system': return 'survey-theme-system';
      default: return 'survey-theme-light';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Survey Preview</CardTitle>
          
          {/* Theme mode switcher */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Theme:</span>
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={surveyThemeMode === 'light' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSurveyThemeMode('light')}
                className="h-7 px-3"
              >
                <Sun className="w-3 h-3 mr-1" />
                Light
              </Button>
              <Button
                variant={surveyThemeMode === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSurveyThemeMode('dark')}
                className="h-7 px-3"
              >
                <Moon className="w-3 h-3 mr-1" />
                Dark
              </Button>
              <Button
                variant={surveyThemeMode === 'system' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSurveyThemeMode('system')}
                className="h-7 px-3"
              >
                <Monitor className="w-3 h-3 mr-1" />
                Auto
              </Button>
            </div>
          </div>
        </div>

        {/* Viewport controls */}
        {/* <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Size:</span>
          <div className="flex gap-1">
            {viewportPresets.map((preset) => {
              const IconComponent = preset.icon;
              return (
                <Button
                  key={preset.name}
                  variant={previewWidth === preset.width ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewWidth(preset.width)}
                  className="h-7 px-3 text-xs"
                >
                  <IconComponent className="w-3 h-3 mr-1" />
                  {preset.name}
                </Button>
              );
            })}
          </div>
        </div> */}
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden">
        {/* Survey Theme Container - This creates the isolated theme scope */}
        <div 
          className={`survey-theme-container ${getThemeClass()} h-full w-full overflow-auto relative`}
          style={surveyThemeStyle}
        >
          {/* Responsive preview wrapper */}
          <div className="h-full flex items-start justify-center p-4">
            <div 
              className="survey-preview-content transition-all duration-300 mx-auto">
              {state.rootNode ? (
                <div className="survey-isolated-content">
                  <SurveyForm
                    survey={{...state, theme}}
                    layout="fullpage"
                    enableDebug={false}
                    theme={theme.name}
                    progressBar={{
                      type: 'percentage',
                      showPercentage: true,
                      showStepInfo: true,
                      position: 'top',
                    }}
                  />
                </div>
              ) : (
                <div className="survey-empty-state p-8 text-center rounded-xl border-2 border-dashed transition-colors">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Add some blocks to see survey in action</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemePreview;