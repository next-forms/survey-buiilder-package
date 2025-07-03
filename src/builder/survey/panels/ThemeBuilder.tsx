import React from "react";
import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Separator } from "../../../components/ui/separator";
import { Switch } from "../../../components/ui/switch";
import { Slider } from "../../../components/ui/slider";
import { Badge } from "../../../components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { 
  ClipboardCopy, Palette, Type, Layout, MousePointer, BarChart3, Package, 
  RefreshCw, Download, Upload, Plus, X, Info, Eye, EyeOff, Sparkles,
  Square, Circle, RotateCcw, Sliders, Paintbrush, Grid3X3, Move, CheckSquare
} from "lucide-react";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { ThemeDefinition, SurveyTheme, SurveyBuilderState, NodeData, LocalizationMap } from "../../../types";
import { SurveyForm } from "../../../renderer/SurveyForm";

// Preset options for various styling properties
const PRESET_OPTIONS = {
  fontSize: [
    { label: "Extra Small", value: "text-xs" },
    { label: "Small", value: "text-sm" },
    { label: "Base", value: "text-base" },
    { label: "Large", value: "text-lg" },
    { label: "Extra Large", value: "text-xl" },
    { label: "2X Large", value: "text-2xl" },
    { label: "3X Large", value: "text-3xl" },
    { label: "4X Large", value: "text-4xl" },
  ],
  fontWeight: [
    { label: "Thin", value: "font-thin" },
    { label: "Light", value: "font-light" },
    { label: "Normal", value: "font-normal" },
    { label: "Medium", value: "font-medium" },
    { label: "Semibold", value: "font-semibold" },
    { label: "Bold", value: "font-bold" },
    { label: "Extra Bold", value: "font-extrabold" },
  ],
  textAlign: [
    { label: "Left", value: "text-left", icon: "⬅️" },
    { label: "Center", value: "text-center", icon: "↔️" },
    { label: "Right", value: "text-right", icon: "➡️" },
    { label: "Justify", value: "text-justify", icon: "☰" },
  ],
  borderRadius: [
    { label: "None", value: "rounded-none", preview: "◻️" },
    { label: "Small", value: "rounded-sm", preview: "⬜" },
    { label: "Default", value: "rounded", preview: "⬜" },
    { label: "Medium", value: "rounded-md", preview: "⬜" },
    { label: "Large", value: "rounded-lg", preview: "⬜" },
    { label: "XL", value: "rounded-xl", preview: "⬜" },
    { label: "2XL", value: "rounded-2xl", preview: "⬜" },
    { label: "3XL", value: "rounded-3xl", preview: "⬜" },
    { label: "Full", value: "rounded-full", preview: "⭕" },
  ],
  borderWidth: [
    { label: "None", value: "border-0" },
    { label: "1px", value: "border" },
    { label: "2px", value: "border-2" },
    { label: "4px", value: "border-4" },
    { label: "8px", value: "border-8" },
  ],
  shadow: [
    { label: "None", value: "shadow-none" },
    { label: "Small", value: "shadow-sm" },
    { label: "Default", value: "shadow" },
    { label: "Medium", value: "shadow-md" },
    { label: "Large", value: "shadow-lg" },
    { label: "XL", value: "shadow-xl" },
    { label: "2XL", value: "shadow-2xl" },
  ],
  spacing: [
    { label: "None", value: "0" },
    { label: "0.5", value: "0.5" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "8", value: "8" },
    { label: "10", value: "10" },
    { label: "12", value: "12" },
    { label: "16", value: "16" },
  ],
  containerWidth: [
    { label: "Small", value: "max-w-sm" },
    { label: "Medium", value: "max-w-md" },
    { label: "Large", value: "max-w-lg" },
    { label: "XL", value: "max-w-xl" },
    { label: "2XL", value: "max-w-2xl" },
    { label: "3XL", value: "max-w-3xl" },
    { label: "4XL", value: "max-w-4xl" },
    { label: "5XL", value: "max-w-5xl" },
    { label: "Full", value: "max-w-full" },
  ],
};

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#9333EA" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Green", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Gray", value: "#6B7280" },
  { name: "Slate", value: "#475569" },
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
];

// Helper function to parse Tailwind classes
const parseTailwindClasses = (classString: string) => {
  const classes = classString.split(' ').filter(Boolean);
  const parsed: any = {
    fontSize: '',
    fontWeight: '',
    textAlign: '',
    textColor: '',
    bgColor: '',
    borderRadius: '',
    borderWidth: '',
    borderColor: '',
    shadow: '',
    padding: {},
    margin: {},
    custom: []
  };

  classes.forEach(cls => {
    // Font size
    if (cls.startsWith('text-') && PRESET_OPTIONS.fontSize.some(opt => opt.value === cls)) {
      parsed.fontSize = cls;
    }
    // Font weight
    else if (cls.startsWith('font-')) {
      parsed.fontWeight = cls;
    }
    // Text align
    else if (['text-left', 'text-center', 'text-right', 'text-justify'].includes(cls)) {
      parsed.textAlign = cls;
    }
    // Text color
    else if (cls.startsWith('text-') && (cls.includes('[#') || cls.includes('-50') || cls.includes('-100') || cls.includes('-200') || cls.includes('-300') || cls.includes('-400') || cls.includes('-500') || cls.includes('-600') || cls.includes('-700') || cls.includes('-800') || cls.includes('-900'))) {
      parsed.textColor = cls;
    }
    // Background color
    else if (cls.startsWith('bg-')) {
      parsed.bgColor = cls;
    }
    // Border radius
    else if (cls.startsWith('rounded')) {
      parsed.borderRadius = cls;
    }
    // Border width
    else if (cls === 'border' || cls.match(/^border-\d+$/)) {
      parsed.borderWidth = cls;
    }
    // Border color
    else if (cls.startsWith('border-') && !cls.match(/^border-\d+$/)) {
      parsed.borderColor = cls;
    }
    // Shadow
    else if (cls.startsWith('shadow')) {
      parsed.shadow = cls;
    }
    // Padding
    else if (cls.match(/^p[tlrbxy]?-/)) {
      const [type, value] = cls.split('-');
      parsed.padding[type] = value;
    }
    // Margin
    else if (cls.match(/^m[tlrbxy]?-/)) {
      const [type, value] = cls.split('-');
      parsed.margin[type] = value;
    }
    // Custom classes
    else {
      parsed.custom.push(cls);
    }
  });

  return parsed;
};

// Helper to extract color from Tailwind class
const extractColorFromClass = (colorClass: string): string => {
  if (!colorClass) return '#000000';
  const match = colorClass.match(/\[(#[0-9a-fA-F]{6})\]/);
  if (match) return match[1];
  
  // Map common Tailwind colors to hex
  const colorMap: Record<string, string> = {
    'gray-50': '#F9FAFB', 'gray-100': '#F3F4F6', 'gray-200': '#E5E7EB', 'gray-300': '#D1D5DB', 
    'gray-400': '#9CA3AF', 'gray-500': '#6B7280', 'gray-600': '#4B5563', 'gray-700': '#374151',
    'gray-800': '#1F2937', 'gray-900': '#111827',
    'blue-50': '#EFF6FF', 'blue-100': '#DBEAFE', 'blue-200': '#BFDBFE', 'blue-300': '#93C5FD',
    'blue-400': '#60A5FA', 'blue-500': '#3B82F6', 'blue-600': '#2563EB', 'blue-700': '#1D4ED8',
    'blue-800': '#1E40AF', 'blue-900': '#1E3A8A',
    'red-50': '#FEF2F2', 'red-100': '#FEE2E2', 'red-200': '#FECACA', 'red-300': '#FCA5A5',
    'red-400': '#F87171', 'red-500': '#EF4444', 'red-600': '#DC2626', 'red-700': '#B91C1C',
    'red-800': '#991B1B', 'red-900': '#7F1D1D',
    'green-50': '#F0FDF4', 'green-100': '#DCFCE7', 'green-200': '#BBF7D0', 'green-300': '#86EFAC',
    'green-400': '#4ADE80', 'green-500': '#22C55E', 'green-600': '#16A34A', 'green-700': '#15803D',
    'green-800': '#166534', 'green-900': '#14532D',
    'purple-50': '#FAF5FF', 'purple-100': '#F3E8FF', 'purple-200': '#E9D5FF', 'purple-300': '#D8B4FE',
    'purple-400': '#C084FC', 'purple-500': '#A855F7', 'purple-600': '#9333EA', 'purple-700': '#7C3AED',
    'purple-800': '#6B21A8', 'purple-900': '#581C87',
  };
  
  for (const [key, value] of Object.entries(colorMap)) {
    if (colorClass.includes(key)) return value;
  }
  
  return '#000000';
};

// Component for color picker with presets
const ColorPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  label: string;
  prefix?: string;
}> = ({ value, onChange, label, prefix = 'text' }) => {
  const hexColor = extractColorFromClass(value);
  
  const handleColorChange = (color: string) => {
    onChange(`${prefix}-[${color}]`);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: hexColor }}
              />
              <span className="text-sm">{hexColor}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Quick Colors</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      className="w-10 h-10 rounded border-2 hover:scale-110 transition-transform"
                      style={{ backgroundColor: preset.value }}
                      onClick={() => handleColorChange(preset.value)}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground">Custom Color</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={hexColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${prefix}-gray-900`}
          className="flex-1"
        />
      </div>
    </div>
  );
};

// Component for spacing controls
const SpacingControl: React.FC<{
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  type: 'padding' | 'margin';
}> = ({ value, onChange, type }) => {
  const prefix = type === 'padding' ? 'p' : 'm';
  
  const updateSpacing = (side: string, val: string) => {
    const newValue = { ...value };
    if (val === '0') {
      delete newValue[`${prefix}${side}`];
    } else {
      newValue[`${prefix}${side}`] = val;
    }
    onChange(newValue);
  };

  const allValue = value[prefix] || '0';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="capitalize">{type}</Label>
        <Badge variant="outline" className="bg-background text-foreground">{Object.keys(value).length} rules</Badge>
      </div>
      
      <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Label className="w-16 text-xs">All</Label>
          <Select value={allValue} onValueChange={(val) => updateSpacing('', val)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.spacing.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { side: 't', label: 'Top' },
            { side: 'r', label: 'Right' },
            { side: 'b', label: 'Bottom' },
            { side: 'l', label: 'Left' }
          ].map(({ side, label }) => (
            <div key={side} className="flex items-center gap-2">
              <Label className="w-12 text-xs">{label}</Label>
              <Select 
                value={value[`${prefix}${side}`] || '0'} 
                onValueChange={(val) => updateSpacing(side, val)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.spacing.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Visual style builder component
const VisualStyleBuilder: React.FC<{
  value: string;
  onChange: (value: string) => void;
  presetType: keyof typeof FIELD_PRESETS;
}> = ({ value, onChange, presetType }) => {
  const parsed = parseTailwindClasses(value);
  
  const updateClasses = (updates: Partial<typeof parsed>) => {
    const newParsed = { ...parsed, ...updates };
    
    // Reconstruct the class string
    const classes = [];
    
    if (newParsed.fontSize) classes.push(newParsed.fontSize);
    if (newParsed.fontWeight) classes.push(newParsed.fontWeight);
    if (newParsed.textAlign) classes.push(newParsed.textAlign);
    if (newParsed.textColor) classes.push(newParsed.textColor);
    if (newParsed.bgColor) classes.push(newParsed.bgColor);
    if (newParsed.borderRadius) classes.push(newParsed.borderRadius);
    if (newParsed.borderWidth) classes.push(newParsed.borderWidth);
    if (newParsed.borderColor) classes.push(newParsed.borderColor);
    if (newParsed.shadow) classes.push(newParsed.shadow);
    
    // Add spacing classes
    Object.entries(newParsed.padding).forEach(([key, val]) => {
      classes.push(`${key}-${val}`);
    });
    Object.entries(newParsed.margin).forEach(([key, val]) => {
      classes.push(`${key}-${val}`);
    });
    
    // Add custom classes
    classes.push(...newParsed.custom);
    
    onChange(classes.join(' '));
  };

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* Quick presets */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" />
          Quick Presets
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_PRESETS[presetType].map(preset => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => onChange(preset.value)}
              className="justify-start text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Visual builders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Typography */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </h4>
          
          <Select value={parsed.fontSize} onValueChange={(val) => updateClasses({ fontSize: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Font Size" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.fontSize.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={parsed.fontWeight} onValueChange={(val) => updateClasses({ fontWeight: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Font Weight" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.fontWeight.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup 
            type="single" 
            value={parsed.textAlign} 
            onValueChange={(val) => updateClasses({ textAlign: val })}
          >
            {PRESET_OPTIONS.textAlign.map(opt => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="data-[state=on]:bg-blue-100">
                <span className="text-xs">{opt.icon}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Paintbrush className="w-4 h-4" />
            Appearance
          </h4>

          <Select value={parsed.borderRadius} onValueChange={(val) => updateClasses({ borderRadius: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Border Radius" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.borderRadius.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span>{opt.preview}</span>
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={parsed.shadow} onValueChange={(val) => updateClasses({ shadow: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Shadow" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_OPTIONS.shadow.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {parsed.borderWidth && (
            <Select value={parsed.borderWidth} onValueChange={(val) => updateClasses({ borderWidth: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Border Width" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_OPTIONS.borderWidth.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorPicker 
          value={parsed.textColor} 
          onChange={(val) => updateClasses({ textColor: val })}
          label="Text Color"
          prefix="text"
        />
        <ColorPicker 
          value={parsed.bgColor} 
          onChange={(val) => updateClasses({ bgColor: val })}
          label="Background Color"
          prefix="bg"
        />
        {parsed.borderWidth && (
          <ColorPicker 
            value={parsed.borderColor} 
            onChange={(val) => updateClasses({ borderColor: val })}
            label="Border Color"
            prefix="border"
          />
        )}
      </div>

      {/* Advanced spacing */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Advanced Spacing
          </span>
          {showAdvanced ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
            <SpacingControl 
              value={parsed.padding} 
              onChange={(val) => updateClasses({ padding: val })}
              type="padding"
            />
            <SpacingControl 
              value={parsed.margin} 
              onChange={(val) => updateClasses({ margin: val })}
              type="margin"
            />
          </div>
        )}
      </div>

      {/* Custom classes */}
      <div className="space-y-2">
        <Label>Custom Classes</Label>
        <Textarea
          value={parsed.custom.join(' ')}
          onChange={(e) => updateClasses({ custom: e.target.value.split(' ').filter(Boolean) })}
          placeholder="Add any additional Tailwind classes here..."
          rows={2}
        />
      </div>

      {/* Full class string preview */}
      <div className="p-3 bg-gray-100 rounded-lg">
        <code className="text-xs text-gray-700 break-all">{value}</code>
      </div>
    </div>
  );
};

// Predefined theme presets
const themePresets: Record<SurveyTheme, ThemeDefinition> = {
  default: {
    name: "default",
    containerLayout: "max-w-2xl mx-auto py-4 px-4 sm:px-6",
    header: "mb-8",
    title: "text-3xl font-bold text-gray-900 mb-4 text-center",
    description: "text-lg text-gray-600 mb-8 text-center",
    background: "bg-muted/50",
    card: "bg-white shadow-sm rounded-lg p-6 mb-6",
    container: {
      card: "bg-white border border-gray-200 rounded-lg",
      border: "border-gray-200",
      activeBorder: "border-blue-500",
      activeBg: "bg-blue-50",
      header: "bg-muted/50",
    },
    field: {
      label: "block text-sm font-medium text-gray-700 mb-2",
      input: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
      description: "mt-1 text-sm text-gray-500",
      error: "mt-1 text-sm text-red-600",
      radio: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300",
      checkbox: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded",
      select: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
      textarea: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
      file: "w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-muted/50",
      matrix: "border-collapse w-full text-sm",
      range: "accent-blue-600",
      text: "text-gray-900",
      activeText: "text-blue-600",
      placeholder: "text-gray-400",
      boxBorder: "border-gray-300",
      // SelectableBox specific styles
      selectableBox: "p-4 transition-all duration-200 hover:shadow-sm cursor-pointer",
      selectableBoxDefault: "border border-gray-300 bg-white",
      selectableBoxSelected: "border-blue-500 bg-blue-50 ring-1 ring-blue-500",
      selectableBoxHover: "hover:border-gray-400 hover:shadow-sm",
      selectableBoxFocus: "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed",
      selectableBoxContainer: "",
      selectableBoxText: "text-gray-900 font-medium",
      selectableBoxTextSelected: "text-blue-900",
      selectableBoxIndicator: "bg-blue-500 text-white",
      selectableBoxIndicatorIcon: "text-white"
    },
    progress: {
      bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
      dots: "flex space-x-2 justify-center",
      numbers: "flex space-x-2 justify-center",
      percentage: "text-right text-sm text-gray-600 mb-1",
      label: "text-sm text-gray-600 mb-1",
    },
    button: {
      primary: "inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
      secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
      text: "text-sm font-medium text-blue-600 hover:text-blue-500",
      navigation: "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    },
    colors: {
      primary: "#3B82F6",
      secondary: "#6B7280",
      accent: "#1D4ED8",
      background: "#FFFFFF",
      text: "#111827",
      border: "#D1D5DB",
      error: "#EF4444",
      success: "#10B981",
    },
  },
  minimal: {
    name: "minimal",
    containerLayout: "max-w-xl mx-auto py-8 px-4",
    header: "mb-12",
    title: "text-2xl font-light text-gray-900 mb-6 text-center",
    description: "text-base text-gray-600 mb-8 text-center",
    background: "bg-white",
    card: "bg-white border-b border-gray-100 py-8",
    container: {
      card: "bg-white",
      border: "border-gray-100",
      activeBorder: "border-gray-900",
      activeBg: "bg-muted/50",
      header: "bg-white",
    },
    field: {
      label: "block text-sm font-normal text-gray-900 mb-3",
      input: "w-full border-0 border-b border-gray-200 rounded-none focus:border-gray-900 focus:ring-0 py-3 px-0",
      description: "mt-2 text-xs text-gray-500",
      error: "mt-2 text-xs text-red-600",
      radio: "focus:ring-gray-900 h-4 w-4 text-gray-900 border-gray-300",
      checkbox: "focus:ring-gray-900 h-4 w-4 text-gray-900 border-gray-300 rounded-none",
      select: "w-full border-0 border-b border-gray-200 rounded-none focus:border-gray-900 focus:ring-0",
      textarea: "w-full border-0 border-b border-gray-200 rounded-none focus:border-gray-900 focus:ring-0",
      file: "w-full text-sm text-gray-900 border border-gray-200 rounded-none cursor-pointer bg-white",
      matrix: "border-collapse w-full text-sm",
      range: "accent-gray-900",
      text: "text-gray-900",
      activeText: "text-gray-900",
      placeholder: "text-gray-400",
      boxBorder: "border-gray-200",
      // SelectableBox minimal styles
      selectableBox: "p-6 transition-all duration-200 cursor-pointer",
      selectableBoxDefault: "border-b border-gray-100 bg-white",
      selectableBoxSelected: "border-b-2 border-gray-900 bg-muted/50",
      selectableBoxHover: "hover:bg-muted/50",
      selectableBoxFocus: "focus-within:bg-muted/50",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed",
      selectableBoxContainer: "",
      selectableBoxText: "text-gray-900 font-normal",
      selectableBoxTextSelected: "text-gray-900 font-medium",
      selectableBoxIndicator: "bg-gray-900 text-white",
      selectableBoxIndicatorIcon: "text-white"
    },
    progress: {
      bar: "h-1 bg-gray-100 rounded-none overflow-hidden",
      dots: "flex space-x-1 justify-center",
      numbers: "flex space-x-1 justify-center",
      percentage: "text-right text-xs text-gray-600 mb-2",
      label: "text-xs text-gray-600 mb-2",
    },
    button: {
      primary: "inline-flex justify-center py-3 px-8 text-sm font-normal border border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white focus:outline-none transition-colors",
      secondary: "inline-flex justify-center py-3 px-8 text-sm font-normal text-gray-600 bg-white hover:text-gray-900 focus:outline-none",
      text: "text-sm font-normal text-gray-600 hover:text-gray-900",
      navigation: "inline-flex items-center px-8 py-3 text-sm font-normal border border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white focus:outline-none transition-colors",
    },
    colors: {
      primary: "#111827",
      secondary: "#6B7280",
      accent: "#000000",
      background: "#FFFFFF",
      text: "#111827",
      border: "#E5E7EB",
      error: "#DC2626",
      success: "#059669",
    },
  },
  modern: {
    name: "modern",
    containerLayout: "max-w-2xl mx-auto py-4 px-4 sm:px-6",
    header: "mb-8",
    title: "text-4xl font-light text-[#E67E4D] mb-6 text-start leading-tight",
    description: "text-xl text-gray-900 leading-relaxed font-normal text-start max-w-md mx-auto",
    background: "bg-transparent",
    card: "bg-white p-8 mb-8",
    container: {
      card: "bg-white border border-gray-100 rounded-xl",
      border: "border-gray-100",
      activeBorder: "border-[#E67E4D]",
      activeBg: "bg-[#E67E4D]/5",
      header: "bg-white",
    },
    field: {
      label: "block text-xl font-medium text-gray-900 mb-4 text-start text-[#C48A66]",
      input: "w-full rounded-xl border-gray-200 shadow-sm focus:border-[#E67E4D] focus:ring-[#E67E4D] text-lg py-4 px-4",
      description: "mt-2 text-base text-gray-600 text-start",
      error: "mt-2 text-sm text-red-600 font-medium text-start",
      radio: "focus:ring-[#E67E4D] h-5 w-5 text-[#E67E4D] border-gray-300",
      checkbox: "focus:ring-[#E67E4D] h-5 w-5 text-[#E67E4D] border-gray-300 rounded-md",
      select: "w-full rounded-xl border-gray-200 shadow-sm focus:border-[#E67E4D] focus:ring-[#E67E4D] text-lg py-4 px-4",
      textarea: "w-full rounded-xl border-gray-200 shadow-sm focus:border-[#E67E4D] focus:ring-[#E67E4D] text-lg py-4 px-4",
      file: "w-full text-base text-gray-900 border border-gray-200 rounded-xl cursor-pointer bg-muted/50 py-4 px-4",
      matrix: "border-collapse w-full text-base rounded-lg overflow-hidden",
      range: "accent-[#E67E4D] focus:outline-none focus:ring-2 focus:ring-[#E67E4D]",
      text: "text-gray-900 text-sm",
      activeText: "text-[#E67E4D]",
      placeholder: "text-gray-400",
      boxBorder: "border-[#C48A66]",
      // SelectableBox modern styles
      selectableBox: "p-6 transition-all duration-300 cursor-pointer rounded-xl",
      selectableBoxDefault: "border border-gray-200 bg-white shadow-sm",
      selectableBoxSelected: "border-[#E67E4D] bg-[#E67E4D]/5 shadow-md ring-1 ring-[#E67E4D]/20",
      selectableBoxHover: "hover:border-[#C48A66] hover:shadow-md hover:scale-[1.02]",
      selectableBoxFocus: "focus-within:ring-2 focus-within:ring-[#E67E4D] focus-within:ring-offset-2",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed",
      selectableBoxContainer: "",
      selectableBoxText: "text-gray-900 text-lg font-medium",
      selectableBoxTextSelected: "text-[#E67E4D] font-semibold",
      selectableBoxIndicator: "bg-[#E67E4D] text-white shadow-sm",
      selectableBoxIndicatorIcon: "text-white"
    },
    progress: {
      bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
      dots: "flex space-x-2 justify-center",
      numbers: "flex space-x-2 justify-center",
      percentage: "text-right text-base text-gray-900 font-medium mb-1",
      label: "text-base text-gray-600 mb-1 text-start",
    },
    button: {
      primary: "inline-flex justify-center py-4 px-16 text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-w-[200px]",
      secondary: "inline-flex justify-center py-3 px-8 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E4D]",
      text: "text-base font-medium text-[#E67E4D] hover:text-[#D86B3C]",
      navigation: "inline-flex items-center px-8 py-4 text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200",
    },
    colors: {
      primary: "#E67E4D",
      secondary: "#6B7280",
      accent: "#D86B3C",
      background: "#FFFFFF",
      text: "#111827",
      border: "#E5E7EB",
      error: "#EF4444",
      success: "#10B981",
    },
  },
  colorful: {
    name: "colorful",
    containerLayout: "max-w-3xl mx-auto py-6 px-4 sm:px-6",
    header: "mb-10",
    title: "text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 text-center",
    description: "text-lg text-gray-700 mb-8 text-center",
    background: "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50",
    card: "bg-white shadow-lg rounded-2xl p-8 mb-8 border border-purple-100",
    container: {
      card: "bg-white border border-purple-200 rounded-2xl shadow-sm",
      border: "border-purple-200",
      activeBorder: "border-purple-500",
      activeBg: "bg-purple-50",
      header: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    field: {
      label: "block text-base font-semibold text-gray-800 mb-3",
      input: "w-full rounded-xl border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-base py-3 px-4",
      description: "mt-2 text-sm text-gray-600",
      error: "mt-2 text-sm text-red-600 font-medium",
      radio: "focus:ring-purple-500 h-5 w-5 text-purple-600 border-purple-300",
      checkbox: "focus:ring-purple-500 h-5 w-5 text-purple-600 border-purple-300 rounded-md",
      select: "w-full rounded-xl border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-base py-3 px-4",
      textarea: "w-full rounded-xl border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-base py-3 px-4",
      file: "w-full text-base text-gray-900 border border-purple-200 rounded-xl cursor-pointer bg-purple-50 py-3 px-4",
      matrix: "border-collapse w-full text-base rounded-xl overflow-hidden",
      range: "accent-purple-600",
      text: "text-gray-800",
      activeText: "text-purple-600",
      placeholder: "text-gray-400",
      boxBorder: "border-purple-300",
      // SelectableBox colorful styles
      selectableBox: "p-6 transition-all duration-300 cursor-pointer rounded-2xl transform hover:scale-105",
      selectableBoxDefault: "border-2 border-purple-200 bg-white shadow-sm",
      selectableBoxSelected: "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg ring-2 ring-purple-200",
      selectableBoxHover: "hover:border-purple-400 hover:shadow-md",
      selectableBoxFocus: "focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed transform-none",
      selectableBoxContainer: "",
      selectableBoxText: "text-gray-800 text-base font-semibold",
      selectableBoxTextSelected: "text-purple-700 font-bold",
      selectableBoxIndicator: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg",
      selectableBoxIndicatorIcon: "text-white"
    },
    progress: {
      bar: "h-3 bg-[#3B82F6] rounded-full overflow-hidden",
      dots: "flex space-x-2 justify-center",
      numbers: "flex space-x-2 justify-center",
      percentage: "text-right text-base text-purple-600 font-semibold mb-2",
      label: "text-base text-gray-700 mb-2 font-medium",
    },
    button: {
      primary: "inline-flex justify-center py-3 px-8 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200",
      secondary: "inline-flex justify-center py-3 px-8 border-2 border-purple-200 text-base font-semibold rounded-xl text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
      text: "text-base font-semibold text-purple-600 hover:text-purple-700",
      navigation: "inline-flex items-center px-8 py-3 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200",
    },
    colors: {
      primary: "#9333EA",
      secondary: "#6B7280",
      accent: "#EC4899",
      background: "#FFFFFF",
      text: "#1F2937",
      border: "#D1D5DB",
      error: "#EF4444",
      success: "#10B981",
    },
  },
  corporate: {
    name: "corporate",
    containerLayout: "max-w-4xl mx-auto py-8 px-6 sm:px-8",
    header: "mb-12",
    title: "text-3xl font-semibold text-slate-800 mb-6 text-center tracking-tight",
    description: "text-lg text-slate-600 mb-10 text-center max-w-2xl mx-auto leading-relaxed",
    background: "bg-slate-50",
    card: "bg-white shadow-sm border border-slate-200 rounded-lg p-8 mb-8",
    container: {
      card: "bg-white border border-slate-200 rounded-lg",
      border: "border-slate-200",
      activeBorder: "border-slate-600",
      activeBg: "bg-slate-50",
      header: "bg-slate-100",
    },
    field: {
      label: "block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide",
      input: "w-full rounded-md border-slate-300 shadow-sm focus:border-slate-600 focus:ring-slate-600 text-base py-3 px-4",
      description: "mt-2 text-sm text-slate-500",
      error: "mt-2 text-sm text-red-600 font-medium",
      radio: "focus:ring-slate-600 h-4 w-4 text-slate-600 border-slate-300",
      checkbox: "focus:ring-slate-600 h-4 w-4 text-slate-600 border-slate-300 rounded",
      select: "w-full rounded-md border-slate-300 shadow-sm focus:border-slate-600 focus:ring-slate-600 text-base py-3 px-4",
      textarea: "w-full rounded-md border-slate-300 shadow-sm focus:border-slate-600 focus:ring-slate-600 text-base py-3 px-4",
      file: "w-full text-base text-slate-900 border border-slate-300 rounded-md cursor-pointer bg-slate-50 py-3 px-4",
      matrix: "border-collapse w-full text-base",
      range: "accent-slate-600",
      text: "text-slate-900",
      activeText: "text-slate-600",
      placeholder: "text-slate-400",
      boxBorder: "border-slate-300",
      // SelectableBox corporate styles
      selectableBox: "p-5 transition-all duration-200 cursor-pointer rounded-lg",
      selectableBoxDefault: "border border-slate-300 bg-white shadow-sm",
      selectableBoxSelected: "border-slate-600 bg-slate-50 shadow-md",
      selectableBoxHover: "hover:border-slate-400 hover:shadow-sm",
      selectableBoxFocus: "focus-within:ring-2 focus-within:ring-slate-600 focus-within:ring-offset-2",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed",
      selectableBoxContainer: "",
      selectableBoxText: "text-slate-900 font-medium tracking-wide",
      selectableBoxTextSelected: "text-slate-700 font-semibold",
      selectableBoxIndicator: "bg-slate-600 text-white",
      selectableBoxIndicatorIcon: "text-white"
    },
    progress: {
      bar: "h-2 bg-slate-200 rounded overflow-hidden",
      dots: "flex space-x-3 justify-center",
      numbers: "flex space-x-3 justify-center",
      percentage: "text-right text-sm text-slate-600 font-semibold mb-2",
      label: "text-sm text-slate-600 mb-2 font-medium",
    },
    button: {
      primary: "inline-flex justify-center py-3 px-6 text-base font-semibold rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200",
      secondary: "inline-flex justify-center py-3 px-6 border border-slate-300 text-base font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500",
      text: "text-base font-semibold text-slate-600 hover:text-slate-700",
      navigation: "inline-flex items-center px-6 py-3 text-base font-semibold rounded-md text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200",
    },
    colors: {
      primary: "#475569",
      secondary: "#64748B",
      accent: "#334155",
      background: "#F8FAFC",
      text: "#1E293B",
      border: "#CBD5E1",
      error: "#DC2626",
      success: "#059669",
    },
  },
  dark: {
    name: "dark",
    containerLayout: "max-w-2xl mx-auto py-6 px-4 sm:px-6",
    header: "mb-10",
    title: "text-3xl font-bold text-white mb-6 text-center",
    description: "text-lg text-gray-300 mb-8 text-center",
    background: "bg-gray-900",
    card: "bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8",
    container: {
      card: "bg-gray-800 border border-gray-700 rounded-lg",
      border: "border-gray-700",
      activeBorder: "border-blue-400",
      activeBg: "bg-gray-700",
      header: "bg-gray-700",
    },
    field: {
      label: "block text-sm font-medium text-gray-200 mb-2",
      input: "w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-400 focus:ring-blue-400 text-base py-3 px-4",
      description: "mt-2 text-sm text-gray-400",
      error: "mt-2 text-sm text-red-400 font-medium",
      radio: "focus:ring-blue-400 h-4 w-4 text-blue-500 border-gray-600 bg-gray-700",
      checkbox: "focus:ring-blue-400 h-4 w-4 text-blue-500 border-gray-600 bg-gray-700 rounded",
      select: "w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-400 focus:ring-blue-400 text-base py-3 px-4",
      textarea: "w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-400 focus:ring-blue-400 text-base py-3 px-4",
      file: "w-full text-base text-gray-200 border border-gray-600 bg-gray-700 rounded-md cursor-pointer py-3 px-4",
      matrix: "border-collapse w-full text-base",
      range: "accent-blue-500",
      text: "text-gray-200",
      activeText: "text-blue-400",
      placeholder: "text-gray-500",
      boxBorder: "border-gray-600",
      // SelectableBox dark styles
      selectableBox: "p-5 transition-all duration-200 cursor-pointer rounded-lg",
      selectableBoxDefault: "border border-gray-600 bg-gray-800",
      selectableBoxSelected: "border-blue-400 bg-gray-700 ring-1 ring-blue-400/50",
      selectableBoxHover: "hover:border-gray-500 hover:bg-gray-750",
      selectableBoxFocus: "focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-gray-900",
      selectableBoxDisabled: "opacity-50 cursor-not-allowed",
      selectableBoxContainer: "",
      selectableBoxText: "text-gray-200 font-medium",
      selectableBoxTextSelected: "text-blue-300 font-semibold",
      selectableBoxIndicator: "bg-blue-500 text-gray-900",
      selectableBoxIndicatorIcon: "text-gray-900"
    },
    progress: {
      bar: "h-2 bg-gray-700 rounded overflow-hidden",
      dots: "flex space-x-2 justify-center",
      numbers: "flex space-x-2 justify-center",
      percentage: "text-right text-sm text-gray-300 font-medium mb-2",
      label: "text-sm text-gray-300 mb-2",
    },
    button: {
      primary: "inline-flex justify-center py-3 px-6 text-base font-medium rounded-md text-gray-900 bg-blue-500 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors duration-200",
      secondary: "inline-flex justify-center py-3 px-6 border border-gray-600 text-base font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900",
      text: "text-base font-medium text-blue-400 hover:text-blue-300",
      navigation: "inline-flex items-center px-6 py-3 text-base font-medium rounded-md text-gray-900 bg-blue-500 hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors duration-200",
    },
    colors: {
      primary: "#3B82F6",
      secondary: "#6B7280",
      accent: "#60A5FA",
      background: "#111827",
      text: "#F9FAFB",
      border: "#374151",
      error: "#F87171",
      success: "#34D399",
    },
  },
  custom: undefined
};

// Field-specific presets
const FIELD_PRESETS = {
  label: [
    { name: "Default", value: "block text-sm font-medium text-gray-700 mb-2" },
    { name: "Bold", value: "block text-base font-semibold text-gray-900 mb-3" },
    { name: "Uppercase", value: "block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2" },
    { name: "Minimal", value: "block text-sm font-normal text-gray-600 mb-1" },
  ],
  input: [
    { name: "Default", value: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" },
    { name: "Modern", value: "w-full rounded-xl border-gray-200 bg-muted/50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors" },
    { name: "Minimal", value: "w-full border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-2" },
    { name: "Floating", value: "w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none" },
  ],
  select: [
    { name: "Default", value: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" },
    { name: "Modern", value: "w-full rounded-xl border-gray-200 bg-muted/50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors" },
    { name: "Minimal", value: "w-full border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-2" },
    { name: "Floating", value: "w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none appearance-none" },
  ],
  checkbox: [
    { name: "Default", value: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" },
    { name: "Large", value: "focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded-md" },
    { name: "Square", value: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded-none" },
    { name: "Minimal", value: "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-400 rounded" },
  ],
  radio: [
    { name: "Default", value: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" },
    { name: "Large", value: "focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300" },
    { name: "Colorful", value: "focus:ring-purple-500 h-5 w-5 text-purple-600 border-purple-300" },
    { name: "Minimal", value: "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-400" },
  ],
  textarea: [
    { name: "Default", value: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" },
    { name: "Modern", value: "w-full rounded-xl border-gray-200 bg-muted/50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors" },
    { name: "Minimal", value: "w-full border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 px-0 py-2 resize-none" },
    { name: "Large", value: "w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none min-h-[120px]" },
  ],
  button: [
    { name: "Default", value: "inline-flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" },
    { name: "Pill", value: "inline-flex justify-center py-3 px-8 text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700" },
    { name: "Gradient", value: "inline-flex justify-center py-3 px-6 text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" },
    { name: "Outline", value: "inline-flex justify-center py-2 px-4 text-sm font-medium rounded-md border-2 border-blue-600 text-blue-600 hover:bg-blue-50" },
  ],
  card: [
    { name: "Default", value: "bg-white shadow-sm rounded-lg p-6 mb-6" },
    { name: "Bordered", value: "bg-white border-2 border-gray-200 rounded-xl p-8 mb-6" },
    { name: "Floating", value: "bg-white shadow-lg rounded-2xl p-8 mb-8 hover:shadow-xl transition-shadow" },
    { name: "Minimal", value: "bg-transparent border-b border-gray-200 pb-6 mb-6" },
  ],
  selectableBox: [
    { name: "Default", value: "p-4 transition-all duration-200 hover:shadow-sm cursor-pointer border border-gray-300 bg-white rounded-md" },
    { name: "Modern", value: "p-6 transition-all duration-300 cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm hover:scale-[1.02]" },
    { name: "Minimal", value: "p-6 transition-all duration-200 cursor-pointer border-b border-gray-100 bg-white hover:bg-muted/50" },
    { name: "Card Style", value: "p-6 transition-all duration-300 cursor-pointer rounded-2xl border-2 border-purple-200 bg-white shadow-sm hover:scale-105" },
    { name: "Corporate", value: "p-5 transition-all duration-200 cursor-pointer rounded-lg border border-slate-300 bg-white shadow-sm" },
    { name: "Dark", value: "p-5 transition-all duration-200 cursor-pointer rounded-lg border border-gray-600 bg-gray-800" },
  ],
};

// Resize Handle Component for the main layout
const ResizeHandle: React.FC = () => {
  const [isResizing, setIsResizing] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const containerWidth = window.innerWidth - 48; // Account for padding
      const leftWidth = Math.max(384, Math.min(containerWidth - 320, e.clientX - 24)); // Min 384px, max container - 320px
      const rightWidth = containerWidth - leftWidth;
      
      // Update CSS custom properties to control the flex layout
      document.documentElement.style.setProperty('--left-panel-width', `${leftWidth}px`);
      document.documentElement.style.setProperty('--right-panel-width', `${rightWidth}px`);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div
      className={`hidden lg:flex items-center justify-center w-6 cursor-col-resize bg-background hover:bg-blue-100 transition-colors relative group ${
        isResizing ? 'bg-blue-200 shadow-md' : ''
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator */}
      <div className={`w-1 h-8 rounded-full transition-colors ${
        isResizing ? 'bg-blue-600' : 'bg-gray-400 group-hover:bg-blue-500'
      }`}>
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 -mt-8">
        Drag to resize panels
      </div>
    </div>
  );
};

// Preview Component with Resizable functionality
const ThemePreview: React.FC<{ theme: ThemeDefinition; state: SurveyBuilderState }> = ({ theme, state }) => {
  const [previewWidth, setPreviewWidth] = useState(400);
  const [previewScale, setPreviewScale] = useState(1);

  // Predefined viewport sizes
  const viewportPresets = [
    { name: "Mobile", width: 375, icon: "📱" },
    { name: "Tablet", width: 768, icon: "📱" },
    { name: "Desktop", width: 1024, icon: "💻" },
    { name: "Large", width: 1440, icon: "🖥️" },
  ];

  const handlePresetSelect = (width: number) => {
    setPreviewWidth(width);
  };

  const handleScaleChange = (newScale: number[]) => {
    setPreviewScale(newScale[0]);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </div>
        </div>        
      </CardHeader>

      <CardContent className="p-0 relative">
      {state.rootNode ? (
              <SurveyForm
                survey={state}
                layout="fullpage"
                enableDebug={false}
                progressBar={{
                  type: 'percentage',
                  showPercentage: true,
                  showStepInfo: true,
                  position: 'top',
                }}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Add some blocks to see survey in action</p>
              </div>
            )}

      </CardContent>
    </Card>
  );
};

// Define the props
interface ThemeBuilderProps {
  onDataChange?: (data: { rootNode: NodeData | null; localizations: LocalizationMap }) => void;
}

export const ThemeBuilder: React.FC<ThemeBuilderProps> = ({onDataChange}) => {
  const { state, updateTheme, exportSurvey } = useSurveyBuilder();
  const [currentTheme, setCurrentTheme] = useState<ThemeDefinition>(state.theme);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SurveyTheme>(state.theme.name);
  const [showPreview, setShowPreview] = useState(true);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');

  // Initialize default layout widths
  useEffect(() => {
    const handleResize = () => {
      // Use requestAnimationFrame to ensure resize happens after layout
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined') {
          const containerWidth = window.innerWidth - 48;
          
          if (window.innerWidth < 1024) {
            document.documentElement.style.setProperty('--left-panel-width', `${containerWidth}px`);
            document.documentElement.style.setProperty('--right-panel-width', '0px');
          } else {
            const defaultLeftWidth = Math.max(384, containerWidth * 0.6);
            const defaultRightWidth = containerWidth - defaultLeftWidth;
            document.documentElement.style.setProperty('--left-panel-width', `${defaultLeftWidth}px`);
            document.documentElement.style.setProperty('--right-panel-width', `${defaultRightWidth}px`);
          }
        }
      });
    };
  
    // Debounce function
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
  
    // Set initial values
    handleResize();
  
    // Add multiple event listeners for better coverage
    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);
  
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Update local state when global theme changes
  useEffect(() => {
    setCurrentTheme(state.theme);
    setSelectedPreset(state.theme.name);
  }, [state.theme]);

  React.useEffect(() => {
    onDataChange?.(exportSurvey());
  }, [state.rootNode, state.localizations, onDataChange, currentTheme]);

  // Apply theme changes
  const handleThemeUpdate = (updatedTheme: Partial<ThemeDefinition>) => {
    const newTheme = { ...currentTheme, ...updatedTheme };
    setCurrentTheme(newTheme);
    updateTheme(newTheme);
  };

  // Apply a preset theme
  const handlePresetChange = (presetName: SurveyTheme) => {
    const preset = themePresets[presetName];
    if (preset) {
      setSelectedPreset(presetName);
      setCurrentTheme(preset);
      updateTheme(preset);
    }
  };

  // Update nested properties
  const updateNestedProperty = (section: keyof ThemeDefinition, key: string, value: string) => {
    if (section === 'colors' || section === 'field' || section === 'container' || section === 'progress' || section === 'button') {
      const updatedSection = {
        ...currentTheme[section],
        [key]: value,
      };
      handleThemeUpdate({ [section]: updatedSection });
    } else {
      handleThemeUpdate({ [section]: value });
    }
  };

  // Copy theme to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(currentTheme, null, 2));
    setCopySuccess("Theme copied to clipboard!");
    setTimeout(() => setCopySuccess(null), 3000);
  };

  // Export theme as JSON file
  const handleExportTheme = () => {
    const dataStr = JSON.stringify(currentTheme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTheme.name}-theme.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import theme from JSON file
  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTheme = JSON.parse(e.target?.result as string);
          setCurrentTheme(importedTheme);
          updateTheme(importedTheme);
          setSelectedPreset(importedTheme.name || "custom");
        } catch (error) {
          console.error('Error parsing theme file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset to preset
  const handleResetToPreset = () => {
    if (selectedPreset !== "custom") {
      handlePresetChange(selectedPreset);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Main Layout - Resizable Two Column Layout on Desktop, Single Column on Mobile */}
      <div className="flex flex-col lg:flex-row lg:h-screen min-h-full">
        
        {/* Theme Builder Column - Flexible width */}
        <div 
          className="flex-1 lg:min-w-96 space-y-6 p-4 lg:p-2 rounded-md lg:pr-3 overflow-y-auto"
          style={{
            width: 'var(--left-panel-width, auto)',
            maxWidth: 'var(--left-panel-width, none)',
            flexShrink: 0
          }}
        >
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToPreset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportTheme}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <label className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2"
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTheme}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup 
                type="single" 
                value={editMode} 
                onValueChange={(val) => val && setEditMode(val as 'visual' | 'code')}
              >
                <ToggleGroupItem value="visual" className="data-[state=on]:bg-blue-100 dark:bg-blue-800">
                  <Palette className="w-4 h-4 mr-1" />
                  Visual
                </ToggleGroupItem>
                <ToggleGroupItem value="code" className="data-[state=on]:bg-blue-100 data-[state=on]:dark:bg-blue-800">
                  <Type className="w-4 h-4 mr-1" />
                  Code
                </ToggleGroupItem>
              </ToggleGroup>
              {/* Preview toggle - only show on mobile */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex lg:hidden items-center gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Preview
              </Button>
            </div>
          </div>

          {copySuccess && (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
              <AlertDescription>{copySuccess}</AlertDescription>
            </Alert>
          )}

          {/* Theme Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Theme Presets
              </CardTitle>
              <CardDescription>
                Choose a preset theme or create your own custom design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(themePresets)
                  .filter(([_, preset]) => preset !== undefined)
                  .map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key as SurveyTheme)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedPreset === key 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'border-border hover:border-muted-foreground'                        
                      }`}
                    >
                      <div className="text-sm font-medium text-start capitalize text-foreground">{preset.name}</div>
                      <div className="mt-2 flex gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: preset.colors.secondary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Editor */}
          {editMode === 'visual' ? (
            <Tabs defaultValue="colors" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="colors" className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center gap-1">
                  <Layout className="w-4 h-4" />
                  <span className="hidden sm:inline">Layout</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Typography</span>
                </TabsTrigger>
                <TabsTrigger value="fields" className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Fields</span>
                </TabsTrigger>
                <TabsTrigger value="buttons" className="flex items-center gap-1">
                  <MousePointer className="w-4 h-4" />
                  <span className="hidden sm:inline">Buttons</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Palette</CardTitle>
                    <CardDescription>
                      Click on any color to customize it with the visual picker
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.entries(currentTheme.colors).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="capitalize flex items-center gap-2">
                            {key}
                            <Popover>
                              <PopoverTrigger>
                                <Info className="w-3 h-3 text-gray-400" />
                              </PopoverTrigger>
                              <PopoverContent className="text-sm">
                                {key === 'primary' && "Main brand color used for primary actions"}
                                {key === 'secondary' && "Supporting color for secondary elements"}
                                {key === 'accent' && "Highlight color for special elements"}
                                {key === 'background' && "Main background color"}
                                {key === 'text' && "Primary text color"}
                                {key === 'border' && "Default border color"}
                                {key === 'error' && "Color for error messages"}
                                {key === 'success' && "Color for success messages"}
                              </PopoverContent>
                            </Popover>
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-12 justify-between"
                              >
                                <span className="text-sm font-mono">{value}</span>
                                <div 
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: value }}
                                />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-4">
                                <div>
                                  <Label>Quick Colors</Label>
                                  <div className="grid grid-cols-6 gap-2 mt-2">
                                    {COLOR_PRESETS.map(preset => (
                                      <button
                                        key={preset.value}
                                        className="w-10 h-10 rounded border-2 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: preset.value }}
                                        onClick={() => updateNestedProperty('colors', key, preset.value)}
                                        title={preset.name}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Label>Custom Color</Label>
                                  <div className="flex gap-2 mt-2">
                                    <input
                                      type="color"
                                      value={value}
                                      onChange={(e) => updateNestedProperty('colors', key, e.target.value)}
                                      className="w-20 h-10 rounded cursor-pointer"
                                    />
                                    <Input
                                      value={value}
                                      onChange={(e) => updateNestedProperty('colors', key, e.target.value)}
                                      placeholder="#000000"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Container & Layout</CardTitle>
                    <CardDescription>
                      Configure the overall structure and spacing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Grid3X3 className="w-4 h-4" />
                          Container Width
                        </Label>
                        <Select 
                          value={currentTheme.containerLayout.match(/max-w-\w+/)?.[0] || 'max-w-2xl'}
                          onValueChange={(val) => {
                            const newLayout = currentTheme.containerLayout.replace(/max-w-\w+/, val);
                            handleThemeUpdate({ containerLayout: newLayout });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRESET_OPTIONS.containerWidth.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Background Style</Label>
                        <VisualStyleBuilder
                          value={currentTheme.background}
                          onChange={(val) => handleThemeUpdate({ background: val })}
                          presetType="card"
                        />
                      </div>

                      <div>
                        <Label>Card Style</Label>
                        <VisualStyleBuilder
                          value={currentTheme.card}
                          onChange={(val) => handleThemeUpdate({ card: val })}
                          presetType="card"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography Settings</CardTitle>
                    <CardDescription>
                      Customize text styles for headers and descriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-2">Title Style</Label>
                      <VisualStyleBuilder
                        value={currentTheme.title}
                        onChange={(val) => handleThemeUpdate({ title: val })}
                        presetType="label"
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-2">Description Style</Label>
                      <VisualStyleBuilder
                        value={currentTheme.description}
                        onChange={(val) => handleThemeUpdate({ description: val })}
                        presetType="label"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fields" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Field Styles</CardTitle>
                    <CardDescription>
                      Customize each form element type with visual tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="label" className="space-y-4">
                      <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-1">
                        <TabsTrigger value="label">Label</TabsTrigger>
                        <TabsTrigger value="input">Input</TabsTrigger>
                        <TabsTrigger value="select">Select</TabsTrigger>
                        <TabsTrigger value="checkbox">Checkbox</TabsTrigger>
                        <TabsTrigger value="radio">Radio</TabsTrigger>
                        <TabsTrigger value="textarea">Textarea</TabsTrigger>
                        <TabsTrigger value="selectableBox" className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          <span className="hidden lg:inline">Box</span>
                        </TabsTrigger>
                      </TabsList>

                      {Object.entries({
                        label: 'label',
                        input: 'input',
                        select: 'select',
                        checkbox: 'checkbox',
                        radio: 'radio',
                        textarea: 'textarea',
                        selectableBox: 'selectableBox'
                      }).map(([key, presetKey]) => (
                        <TabsContent key={key} value={key}>
                          {key === 'selectableBox' ? (
                            <div className="space-y-6">
                              <Alert>
                                <CheckSquare className="w-4 h-4" />
                                <AlertDescription>
                                  Customize the appearance of selectable box questions. These settings affect the overall container, selected state, hover effects, and more.
                                </AlertDescription>
                              </Alert>
                              
                              <div className="grid grid-cols-1 gap-6">
                                <div>
                                  <Label className="text-base font-semibold mb-3 block">Base Box Style</Label>
                                  <VisualStyleBuilder
                                    value={currentTheme.field.selectableBox || ""}
                                    onChange={(val) => updateNestedProperty('field', 'selectableBox', val)}
                                    presetType="selectableBox"
                                  />
                                </div>
                                
                                <Separator />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Default State</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxDefault || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxDefault', val)}
                                      presetType="selectableBox"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Selected State</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxSelected || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxSelected', val)}
                                      presetType="selectableBox"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Hover Style</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxHover || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxHover', val)}
                                      presetType="selectableBox"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Focus Style</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxFocus || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxFocus', val)}
                                      presetType="selectableBox"
                                    />
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Text Style</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxText || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxText', val)}
                                      presetType="label"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Selected Text Style</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxTextSelected || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxTextSelected', val)}
                                      presetType="label"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Selection Indicator</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxIndicator || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxIndicator', val)}
                                      presetType="button"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label className="text-sm font-medium mb-2 block">Indicator Icon</Label>
                                    <VisualStyleBuilder
                                      value={currentTheme.field.selectableBoxIndicatorIcon || ""}
                                      onChange={(val) => updateNestedProperty('field', 'selectableBoxIndicatorIcon', val)}
                                      presetType="label"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <VisualStyleBuilder
                              value={currentTheme.field[key as keyof typeof currentTheme.field]}
                              onChange={(val) => updateNestedProperty('field', key, val)}
                              presetType={presetKey as keyof typeof FIELD_PRESETS}
                            />
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="buttons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Button Styles</CardTitle>
                    <CardDescription>
                      Design your buttons with visual customization tools
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="primary" className="space-y-4">
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="primary">Primary</TabsTrigger>
                        <TabsTrigger value="secondary">Secondary</TabsTrigger>
                        <TabsTrigger value="text">Text</TabsTrigger>
                        <TabsTrigger value="navigation">Navigation</TabsTrigger>
                      </TabsList>

                      {Object.entries(currentTheme.button).map(([key]) => (
                        <TabsContent key={key} value={key}>
                          <VisualStyleBuilder
                            value={currentTheme.button[key as keyof typeof currentTheme.button]}
                            onChange={(val) => updateNestedProperty('button', key, val)}
                            presetType="button"
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Indicators</CardTitle>
                    <CardDescription>
                      Style progress bars and navigation elements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-6">
                      {Object.entries(currentTheme.progress).map(([key, value]) => (
                        <div key={key}>
                          <Label className="capitalize mb-2">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                          <VisualStyleBuilder
                            value={value}
                            onChange={(val) => updateNestedProperty('progress', key, val)}
                            presetType="label"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Advanced Code Editor</CardTitle>
                <CardDescription>
                  Edit the theme JSON directly for full control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      Changes made here will be applied immediately. Make sure your JSON is valid!
                    </AlertDescription>
                  </Alert>
                  <Textarea
                    value={JSON.stringify(currentTheme, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setCurrentTheme(parsed);
                        updateTheme(parsed);
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="font-mono text-sm min-h-[400px]"
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-2"
                    >
                      <ClipboardCopy className="w-4 h-4" />
                      Copy JSON
                    </Button>
                    <div className="text-sm text-gray-500">
                      {Object.keys(currentTheme).length} properties
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Preview */}
          {showPreview && (
            <div className="lg:hidden rounded-xl">
              <ThemePreview theme={currentTheme} state={state} />
            </div>
          )}
        </div>

        {/* Resize Handle - Only visible on desktop */}
        <ResizeHandle />

        {/* Preview Column - Resizable width on desktop */}
        <div 
          className="hidden lg:block lg:min-w-80 lg:max-w-2xl overflow-hidden rounded-xl"
          style={{
            width: 'var(--right-panel-width, auto)',
            maxWidth: 'var(--right-panel-width, none)',
            flexShrink: 0
          }}
        >
          <ThemePreview theme={currentTheme} state={state}/>
        </div>
      </div>
    </div>
  );
};