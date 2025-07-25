import type { SurveyTheme } from "../types";

export interface ThemeDefinition {
  name: SurveyTheme;
  containerLayout: string;
  header: string;
  title: string;
  description: string;
  background: string;
  card: string;
  field: {
    label: string;
    input: string;
    description: string;
    error: string;
    radio: string;
    checkbox: string;
    select: string;
    textarea: string;
    file: string;
    matrix: string;
    range: string;
    text: string;
    activeText: string;
    placeholder: string;
    boxBorder?: string;

    // Comprehensive SelectableBox styling properties
    selectableBox?: string;                    // Base container styling for the box
    selectableBoxDefault?: string;             // Default/unselected state styling
    selectableBoxSelected?: string;            // Selected state styling
    selectableBoxHover?: string;               // Hover state styling
    selectableBoxFocus?: string;               // Focus state styling
    selectableBoxDisabled?: string;            // Disabled state styling
    selectableBoxContainer?: string;           // Inner container styling
    selectableBoxText?: string;                // Text styling inside the box
    selectableBoxTextSelected?: string;        // Text styling when selected
    selectableBoxIndicator?: string;           // Selection indicator (checkmark) styling
    selectableBoxIndicatorIcon?: string;       // Icon styling within the indicator
  };
  container: {
    card: string;
    border: string;
    activeBorder: string;
    activeBg: string;
    header: string;
  };
  progress: {
    bar: string;
    dots: string;
    numbers: string;
    percentage: string;
    label: string;
  };
  button: {
    primary: string;
    secondary: string;
    text: string;
    navigation: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
    error: string;
    success: string;
  };
}

// Default theme - clean and simple
export const defaultTheme: ThemeDefinition = {
  name: "default",
  containerLayout: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-3xl font-bold text-gray-900 mb-2",
  description: "text-lg text-gray-600",
  background: "bg-white",
  card: "bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6",
  field: {
    label: "block text-sm font-medium text-gray-900 mb-1",
    input: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    description: "mt-1 text-sm text-gray-500",
    error: "mt-1 text-sm text-red-600",
    radio: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300",
    checkbox: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded",
    select: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    textarea: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    file: "w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50",
    matrix: "border-collapse w-full text-sm",
    range: "accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
    text: "text-gray-700",
    activeText: "text-blue-600",
    placeholder: "text-gray-400",
  },
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    header: "bg-gray-50"
  },
  progress: {
    bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
    dots: "flex space-x-2",
    numbers: "flex space-x-2",
    percentage: "text-right text-sm text-gray-500 mb-1",
    label: "text-sm text-gray-500 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    text: "text-sm font-medium text-blue-600 hover:text-blue-500",
    navigation: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
  },
  colors: {
    primary: "#3B82F6", // blue-500
    secondary: "#6B7280", // gray-500
    accent: "#F59E0B", // amber-500
    background: "#FFFFFF", // white
    text: "#111827", // gray-900
    border: "#D1D5DB", // gray-300
    error: "#EF4444", // red-500
    success: "#10B981", // emerald-500
  },
};

// Minimal theme - clean and unobtrusive
export const minimalTheme: ThemeDefinition = {
  name: "minimal",
  containerLayout: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
  header: "mb-6",
  title: "text-2xl font-medium text-gray-900 mb-2",
  description: "text-base text-gray-600",
  background: "bg-card",
  card: "bg-white p-6 mb-6",
  field: {
    label: "block text-sm font-normal text-gray-700 mb-1",
    input: "w-full border-0 border-b border-gray-200 py-2 focus:border-gray-900 focus:ring-0",
    description: "mt-1 text-xs text-gray-500",
    error: "mt-1 text-xs text-red-500",
    radio: "focus:ring-0 h-4 w-4 text-gray-900 border-gray-300",
    checkbox: "focus:ring-0 h-4 w-4 text-gray-900 border-gray-300 rounded",
    select: "w-full border-0 border-b border-gray-200 py-2 focus:border-gray-900 focus:ring-0",
    textarea: "w-full border border-gray-200 py-2 focus:border-gray-900 focus:ring-0",
    file: "w-full text-sm text-gray-700 border border-gray-200 cursor-pointer bg-transparent",
    matrix: "border-collapse w-full text-sm border-transparent",
    range: "accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
    text: "text-gray-700",
    activeText: "text-blue-600",
    placeholder: "text-gray-400",
  },
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    header: "bg-gray-50",
  },
  progress: {
    bar: "h-1 bg-gray-100 overflow-hidden",
    dots: "flex space-x-1",
    numbers: "flex space-x-1",
    percentage: "text-right text-xs text-gray-400 mb-1",
    label: "text-xs text-gray-400 mb-1",
  },
  button: {
    primary: "py-2 px-4 text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none",
    secondary: "py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none",
    text: "text-sm font-medium text-gray-700 hover:text-gray-900",
    navigation: "flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none",
  },
  colors: {
    primary: "#111827", // gray-900
    secondary: "#6B7280", // gray-500
    accent: "#111827", // gray-900
    background: "#F9FAFB", // gray-50
    text: "#111827", // gray-900
    border: "#E5E7EB", // gray-200
    error: "#EF4444", // red-500
    success: "#10B981", // emerald-500
  },
};

// Colorful theme - vibrant and engaging
export const colorfulTheme: ThemeDefinition = {
  name: "colorful",
  containerLayout: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-3xl font-bold text-purple-900 mb-3",
  description: "text-lg text-purple-700",
  background: "bg-card",
  card: "bg-white shadow-lg border border-purple-100 rounded-xl p-6 mb-6",
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    header: "bg-gray-50",
  },
  field: {
    label: "block text-sm font-semibold text-purple-800 mb-1",
    input: "w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50",
    description: "mt-1 text-sm text-purple-600",
    error: "mt-1 text-sm text-pink-600 font-medium",
    radio: "focus:ring-purple-500 h-4 w-4 text-purple-600 border-purple-300",
    checkbox: "focus:ring-purple-500 h-4 w-4 text-purple-600 border-purple-300 rounded",
    select: "w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50",
    textarea: "w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50",
    file: "w-full text-sm text-purple-900 border border-purple-200 rounded-lg cursor-pointer bg-purple-50",
    matrix: "border-collapse w-full text-sm rounded-lg overflow-hidden",
    range: "accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
    text: "text-gray-700",
    activeText: "text-blue-600",
    placeholder: "text-gray-400",
  },
  progress: {
    bar: "h-2 bg-purple-100 rounded-full overflow-hidden",
    dots: "flex space-x-2",
    numbers: "flex space-x-2",
    percentage: "text-right text-sm text-purple-600 font-medium mb-1",
    label: "text-sm text-purple-600 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-6 shadow-md text-sm font-medium rounded-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
    secondary: "inline-flex justify-center py-2 px-6 border border-purple-200 shadow-md text-sm font-medium rounded-full text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
    text: "text-sm font-medium text-purple-600 hover:text-purple-800",
    navigation: "inline-flex items-center px-6 py-2 shadow-md text-sm font-medium rounded-full text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
  },
  colors: {
    primary: "#8B5CF6", // purple-500
    secondary: "#EC4899", // pink-500
    accent: "#F59E0B", // amber-500
    background: "#F5F3FF", // purple-50
    text: "#6D28D9", // purple-700
    border: "#DDD6FE", // purple-200
    error: "#DB2777", // pink-600
    success: "#10B981", // emerald-500
  },
};

// Modern theme - sleek and contemporary
// Modern theme - sleek and contemporary with large crisp fonts and Hims-style design
export const modernTheme: ThemeDefinition = {
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
    file: "w-full text-base text-gray-900 border border-gray-200 rounded-xl cursor-pointer bg-gray-50 py-4 px-4",
    matrix: "border-collapse w-full text-base rounded-lg overflow-hidden",
    range: "accent-[#E67E4D] focus:outline-none focus:ring-2 focus:ring-[#E67E4D]",
    text: "text-gray-900 text-sm",
    activeText: "text-[#E67E4D]",
    placeholder: "text-gray-400",
    boxBorder: "border-[#C48A66]"
  },
  progress: {
    bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
    dots: "flex space-x-2 justify-center",
    numbers: "flex space-x-2 justify-center",
    percentage: "text-right text-base text-gray-900 font-medium mb-1",
    label: "text-base text-gray-600 mb-1 text-start",
  },
  button: {
    primary: "inline-flex justify-center py-4 px-16 text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-w-32 sm:min-w-[200px]",
    secondary: "inline-flex justify-center py-3 px-8 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E4D]",
    text: "text-base font-medium text-[#E67E4D] hover:text-[#D86B3C]",
    navigation: "inline-flex items-center px-8 py-4 text-base font-medium rounded-full text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200",
  },
  colors: {
    primary: "#E67E4D", // coral orange
    secondary: "#6B7280", // gray-500
    accent: "#D86B3C", // darker coral
    background: "#FFFFFF", // white
    text: "#111827", // gray-900
    border: "#E5E7EB", // gray-200
    error: "#EF4444", // red-500
    success: "#10B981", // emerald-500
  },
};

// Corporate theme - professional and serious
export const corporateTheme: ThemeDefinition = {
  name: "corporate",
  containerLayout: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-2xl font-bold text-gray-800 mb-2",
  description: "text-base text-gray-600",
  background: "bg-gray-50",
  card: "bg-white shadow border-t-4 border-blue-700 p-6 mb-6",
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    header: "bg-gray-50",
  },
  field: {
    label: "block text-sm font-semibold text-gray-700 mb-1",
    input: "w-full rounded-sm border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700",
    description: "mt-1 text-sm text-gray-500",
    error: "mt-1 text-sm text-red-700",
    radio: "focus:ring-blue-700 h-4 w-4 text-blue-700 border-gray-300",
    checkbox: "focus:ring-blue-700 h-4 w-4 text-blue-700 border-gray-300 rounded",
    select: "w-full rounded-sm border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700",
    textarea: "w-full rounded-sm border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700",
    file: "w-full text-sm text-gray-700 border border-gray-300 rounded-sm cursor-pointer bg-gray-50",
    matrix: "border-collapse w-full text-sm border-gray-200",
    range: "accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500",
    text: "text-gray-700",
    activeText: "text-blue-600",
    placeholder: "text-gray-400",
  },
  progress: {
    bar: "h-2 bg-gray-200 overflow-hidden",
    dots: "flex space-x-1",
    numbers: "flex space-x-1",
    percentage: "text-right text-sm text-gray-600 mb-1",
    label: "text-sm text-gray-600 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-4 text-sm font-medium rounded-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
    text: "text-sm font-medium text-blue-700 hover:text-blue-800",
    navigation: "inline-flex items-center px-4 py-2 text-sm font-medium rounded-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
  },
  colors: {
    primary: "#1D4ED8", // blue-700
    secondary: "#4B5563", // gray-600
    accent: "#0369A1", // sky-700
    background: "#F9FAFB", // gray-50
    text: "#1F2937", // gray-800
    border: "#D1D5DB", // gray-300
    error: "#B91C1C", // red-700
    success: "#047857", // emerald-700
  },
};

// Dark theme - updated for shadcn/ui compatibility
export const darkTheme: ThemeDefinition = {
  name: "dark",
  containerLayout: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
  header: "mb-6",
  title: "text-2xl font-bold text-white mb-2",
  description: "text-base text-gray-400",
  background: "bg-gray-900 dark",
  card: "bg-card text-card-foreground shadow-sm border border-border rounded-lg p-6 mb-6 dark",
  field: {
    label: "block text-sm font-medium text-foreground mb-1.5",
    input: "bg-input text-foreground",
    description: "mt-1 text-sm text-muted-foreground",
    error: "mt-1 text-sm text-destructive",
    radio: "text-primary border-input",
    checkbox: "text-primary border-input",
    select: "bg-input text-foreground",
    textarea: "bg-input text-foreground",
    file: "border border-input bg-background text-foreground",
    matrix: "border-border",
    range: "bg-background",
    text: "text-foreground",
    activeText: "text-primary",
    placeholder: "text-muted-foreground",
  },
  container: {
    card: "bg-card text-card-foreground border-border",
    border: "border-border",
    activeBorder: "border-primary",
    activeBg: "bg-primary/10",
    header: "bg-muted",
  },
  progress: {
    bar: "h-2 bg-secondary/20 rounded-full overflow-hidden",
    dots: "flex space-x-2",
    numbers: "flex space-x-2",
    percentage: "text-right text-sm text-muted-foreground mb-1",
    label: "text-sm text-muted-foreground mb-1",
  },
  button: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    text: "text-sm font-medium text-primary hover:text-primary/80",
    navigation: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  colors: {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
    background: "hsl(var(--background))",
    text: "hsl(var(--foreground))",
    border: "hsl(var(--border))",
    error: "hsl(var(--destructive))",
    success: "hsl(var(--success))",
  },
};

export const himsTheme: ThemeDefinition = {
  "name": "hims",
  "containerLayout": "max-w-2xl mx-auto py-8 px-4 sm:px-6",
  "header": "mb-8",
  "title": "text-3xl font-semibold text-gray-900 mb-4 text-left",
  "description": "text-lg text-gray-600 mb-6 text-left",
  "background": "bg-white",
  "card": "bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200",
  "container": {
    "card": "bg-white border border-gray-200 rounded-lg shadow-sm",
    "border": "border-gray-200",
    "activeBorder": "border-gray-400",
    "activeBg": "bg-gray-50",
    "header": "bg-gray-100"
  },
  "field": {
    "label": "block text-base font-medium text-gray-900 mb-4",
    "input": "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    "description": "mt-2 text-sm text-gray-600",
    "error": "mt-2 text-sm text-red-600 font-medium",
    "radio": "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300",
    "checkbox": "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded",
    "select": "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    "textarea": "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    "file": "w-full text-base text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 py-3 px-4",
    "matrix": "border-collapse w-full text-base rounded-lg overflow-hidden",
    "range": "accent-gray-600",
    "text": "text-gray-900",
    "activeText": "text-gray-900",
    "placeholder": "text-gray-500",
    "boxBorder": "border-gray-300",
    "selectableBox": "p-5 transition-all duration-200 cursor-pointer rounded-lg",
    "selectableBoxDefault": "border border-gray-300 bg-white hover:bg-gray-50",
    "selectableBoxSelected": "border border-gray-400 bg-gray-50",
    "selectableBoxHover": "hover:border-gray-400",
    "selectableBoxFocus": "focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2",
    "selectableBoxDisabled": "opacity-50 cursor-not-allowed",
    "selectableBoxContainer": "space-y-3",
    "selectableBoxText": "text-gray-900 text-base font-normal",
    "selectableBoxTextSelected": "text-gray-900 font-normal",
    "selectableBoxIndicator": "bg-gray-600 text-white",
    "selectableBoxIndicatorIcon": "text-white"
  },
  "progress": {
    "bar": "h-2 bg-gray-600 rounded-full overflow-hidden",
    "dots": "flex space-x-2 justify-center",
    "numbers": "flex space-x-2 justify-center",
    "percentage": "text-right text-base text-gray-600 font-medium mb-2",
    "label": "text-base text-gray-700 mb-2 font-medium"
  },
  "button": {
    "primary": "inline-flex justify-center py-3 px-6 text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200",
    "secondary": "inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500",
    "text": "text-base font-medium text-gray-600 hover:text-gray-800",
    "navigation": "inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
  },
  "colors": {
    "primary": "#111827",
    "secondary": "#6B7280",
    "accent": "#374151",
    "background": "#FFFFFF",
    "text": "#111827",
    "border": "#D1D5DB",
    "error": "#EF4444",
    "success": "#10B981"
  }
}

// Map of all themes
export const themes: Record<SurveyTheme, ThemeDefinition> = {
  default: defaultTheme,
  minimal: minimalTheme,
  colorful: colorfulTheme,
  modern: modernTheme,
  corporate: corporateTheme,
  dark: darkTheme,
  hims: himsTheme,
  custom: undefined
};
