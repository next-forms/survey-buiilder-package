import type { SurveyTheme, ThemeDefinition } from "../types";

// Re-export ThemeDefinition type so it can be imported from themes
export type { ThemeDefinition } from "../types";

// Default theme - clean and simple
export const defaultTheme: ThemeDefinition = {
  name: "default",
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
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
    boxBorder: "border-gray-300",
    selectableBox: "p-4 transition-all duration-200 cursor-pointer rounded-md",
    selectableBoxDefault: "border border-gray-300 bg-white hover:bg-gray-50",
    selectableBoxSelected: "border-2 border-blue-500 bg-blue-50",
    selectableBoxHover: "hover:border-gray-400",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed",
    selectableBoxContainer: "space-y-3",
    selectableBoxText: "text-gray-700 text-sm",
    selectableBoxTextSelected: "text-blue-900 font-medium",
    selectableBoxIndicator: "bg-blue-600 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-5 space-y-4",
    agreementPanel: "rounded-md border p-3 text-sm whitespace-pre-wrap bg-muted/30 dark:bg-muted/20",
    signatureCanvas: "w-full h-40 border rounded-md overflow-hidden bg-background",
    signatureColor: "#111827", // gray-900
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
    primary: "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-[#FFFFFF] bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    text: "text-sm font-medium text-blue-600 hover:text-blue-500",
    navigation: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[#FFFFFF] bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
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
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
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
    range: "accent-gray-900 focus:outline-none",
    text: "text-gray-700",
    activeText: "text-gray-900",
    placeholder: "text-gray-400",
    boxBorder: "border-gray-200",
    selectableBox: "p-4 transition-all duration-150 cursor-pointer",
    selectableBoxDefault: "border-b border-gray-200 bg-white hover:bg-gray-50",
    selectableBoxSelected: "border-b-2 border-gray-900 bg-gray-50",
    selectableBoxHover: "hover:border-gray-300",
    selectableBoxFocus: "focus-within:border-gray-900",
    selectableBoxDisabled: "opacity-40 cursor-not-allowed",
    selectableBoxContainer: "space-y-0",
    selectableBoxText: "text-gray-700 text-sm font-light",
    selectableBoxTextSelected: "text-gray-900 font-normal",
    selectableBoxIndicator: "bg-gray-900 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-4 space-y-3",
    agreementPanel: "border-b pb-3 text-sm whitespace-pre-wrap",
    signatureCanvas: "w-full h-36 border-b-2 bg-transparent",
    signatureColor: "#111827", // gray-900
  },
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-gray-900",
    activeBg: "bg-gray-50",
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
    primary: "py-2 px-4 text-sm font-medium text-[#FFFFFF] bg-gray-900 hover:bg-black focus:outline-none",
    secondary: "py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none",
    text: "text-sm font-medium text-gray-700 hover:text-gray-900",
    navigation: "flex items-center px-4 py-2 text-sm font-medium text-[#FFFFFF] bg-gray-900 hover:bg-black focus:outline-none",
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
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-3xl font-bold text-purple-900 mb-3",
  description: "text-lg text-purple-700",
  background: "bg-card",
  card: "bg-white shadow-lg border border-purple-100 rounded-xl p-6 mb-6",
  container: {
    card: "bg-white border border-purple-200 rounded-xl",
    border: "border-purple-200",
    activeBorder: "border-purple-500",
    activeBg: "bg-purple-50",
    header: "bg-purple-50",
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
    range: "accent-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500",
    text: "text-purple-700",
    activeText: "text-purple-600",
    placeholder: "text-purple-400",
    boxBorder: "border-purple-300",
    selectableBox: "p-5 transition-all duration-300 cursor-pointer rounded-xl transform hover:scale-[1.02]",
    selectableBoxDefault: "border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-pink-50",
    selectableBoxSelected: "border-2 border-purple-500 bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg",
    selectableBoxHover: "hover:border-purple-400 hover:shadow-md",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-purple-400 focus-within:ring-offset-2",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed transform-none",
    selectableBoxContainer: "space-y-4",
    selectableBoxText: "text-purple-700 text-sm font-medium",
    selectableBoxTextSelected: "text-purple-900 font-semibold",
    selectableBoxIndicator: "bg-gradient-to-r from-purple-600 to-pink-600 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-6 space-y-5",
    agreementPanel: "rounded-xl border-2 border-purple-200 p-4 text-sm whitespace-pre-wrap bg-gradient-to-br from-purple-50 to-pink-50",
    signatureCanvas: "w-full h-44 border-2 border-purple-200 rounded-lg overflow-hidden bg-white shadow-inner",
    signatureColor: "#8B5CF6", // purple-500
  },
  progress: {
    bar: "h-2 bg-purple-100 rounded-full overflow-hidden",
    dots: "flex space-x-2",
    numbers: "flex space-x-2",
    percentage: "text-right text-sm text-purple-600 font-medium mb-1",
    label: "text-sm text-purple-600 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-6 shadow-md text-sm font-medium rounded-full text-[#FFFFFF] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
    secondary: "inline-flex justify-center py-2 px-6 border border-purple-200 shadow-md text-sm font-medium rounded-full text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
    text: "text-sm font-medium text-purple-600 hover:text-purple-800",
    navigation: "inline-flex items-center px-6 py-2 shadow-md text-sm font-medium rounded-full text-[#FFFFFF] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500",
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

// Modern theme - sleek and contemporary with large crisp fonts and Hims-style design
export const modernTheme: ThemeDefinition = {
  name: "modern",
  containerLayout: "max-w-full mx-auto py-4 px-4 sm:px-6",
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
    boxBorder: "border-[#C48A66]",
    selectableBox: "p-6 transition-all duration-200 cursor-pointer rounded-xl",
    selectableBoxDefault: "border border-gray-200 bg-white hover:bg-[#E67E4D]/5",
    selectableBoxSelected: "border-2 border-[#E67E4D] bg-[#E67E4D]/10",
    selectableBoxHover: "hover:border-[#E67E4D]/50 hover:shadow-sm",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-[#E67E4D] focus-within:ring-offset-2",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed",
    selectableBoxContainer: "space-y-4",
    selectableBoxText: "text-gray-900 text-base",
    selectableBoxTextSelected: "text-[#E67E4D] font-medium",
    selectableBoxIndicator: "bg-[#E67E4D] text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-6 space-y-5",
    agreementPanel: "rounded-xl p-4 text-base whitespace-pre-wrap bg-[#E67E4D]/5 border border-[#E67E4D]/20",
    signatureCanvas: "w-full h-44 border rounded-xl overflow-hidden bg-white",
    signatureColor: "#E67E4D", // coral orange
  },
  progress: {
    bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
    dots: "flex space-x-2 justify-center",
    numbers: "flex space-x-2 justify-center",
    percentage: "text-right text-base text-gray-900 font-medium mb-1",
    label: "text-base text-gray-600 mb-1 text-start",
  },
  button: {
    primary: "inline-flex justify-center py-4 px-16 text-base font-medium rounded-full text-[#FFFFFF] bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-w-32 sm:min-w-[200px]",
    secondary: "inline-flex justify-center py-3 px-8 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E67E4D]",
    text: "text-base font-medium text-[#E67E4D] hover:text-[#D86B3C]",
    navigation: "inline-flex items-center px-8 py-4 text-base font-medium rounded-full text-[#FFFFFF] bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200",
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
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-2xl font-bold text-gray-800 mb-2",
  description: "text-base text-gray-600",
  background: "bg-gray-50",
  card: "bg-white shadow border-t-4 border-blue-700 p-6 mb-6",
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-700",
    activeBg: "bg-blue-50",
    header: "bg-gray-100",
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
    range: "accent-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700",
    text: "text-gray-700",
    activeText: "text-blue-700",
    placeholder: "text-gray-400",
    boxBorder: "border-blue-700",
    selectableBox: "p-4 transition-all duration-150 cursor-pointer rounded-sm",
    selectableBoxDefault: "border border-gray-300 bg-white hover:bg-gray-50",
    selectableBoxSelected: "border-2 border-blue-700 bg-blue-50",
    selectableBoxHover: "hover:border-gray-400",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-blue-700 focus-within:ring-offset-1",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed",
    selectableBoxContainer: "space-y-2",
    selectableBoxText: "text-gray-700 text-sm",
    selectableBoxTextSelected: "text-blue-900 font-semibold",
    selectableBoxIndicator: "bg-blue-700 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-5 space-y-4",
    agreementPanel: "rounded-sm border border-gray-300 p-3 text-sm whitespace-pre-wrap bg-gray-50",
    signatureCanvas: "w-full h-40 border border-gray-300 rounded-sm overflow-hidden bg-white",
    signatureColor: "#1D4ED8", // blue-700
  },
  progress: {
    bar: "h-2 bg-gray-200 overflow-hidden",
    dots: "flex space-x-1",
    numbers: "flex space-x-1",
    percentage: "text-right text-sm text-gray-600 mb-1",
    label: "text-sm text-gray-600 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-4 text-sm font-medium rounded-sm text-[#FFFFFF] bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
    text: "text-sm font-medium text-blue-700 hover:text-blue-800",
    navigation: "inline-flex items-center px-4 py-2 text-sm font-medium rounded-sm text-[#FFFFFF] bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700",
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

// Dark theme - with proper light text colors
export const darkTheme: ThemeDefinition = {
  name: "dark",
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
  header: "mb-6",
  title: "text-3xl font-bold text-gray-100 mb-2",
  description: "text-base text-gray-300",
  background: "bg-gray-900",
  card: "bg-gray-800 shadow-xl border border-gray-700 rounded-lg p-6 mb-6",
  field: {
    label: "block text-sm font-medium text-gray-200 mb-1.5",
    input: "w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500",
    description: "mt-1 text-sm text-gray-400",
    error: "mt-1 text-sm text-red-400",
    radio: "focus:ring-blue-500 h-4 w-4 text-blue-500 bg-gray-700 border-gray-600",
    checkbox: "focus:ring-blue-500 h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded",
    select: "w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500",
    textarea: "w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500",
    file: "w-full text-sm text-gray-200 border border-gray-600 rounded-lg cursor-pointer bg-gray-700",
    matrix: "border-collapse w-full text-sm border-gray-600",
    range: "accent-blue-500 bg-gray-700",
    text: "text-gray-200",
    activeText: "text-blue-400",
    placeholder: "text-gray-500",
    boxBorder: "border-gray-600",
    selectableBox: "p-4 transition-all duration-200 cursor-pointer rounded-lg",
    selectableBoxDefault: "border border-gray-600 bg-gray-800 hover:bg-gray-700",
    selectableBoxSelected: "border-2 border-blue-500 bg-gray-700",
    selectableBoxHover: "hover:border-gray-500",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed",
    selectableBoxContainer: "space-y-3",
    selectableBoxText: "text-gray-200 text-sm",
    selectableBoxTextSelected: "text-blue-400 font-medium",
    selectableBoxIndicator: "bg-blue-500 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-5 space-y-4",
    agreementPanel: "rounded-md border border-gray-600 p-3 text-sm whitespace-pre-wrap bg-gray-700 text-gray-100",
    signatureCanvas: "w-full h-40 border border-gray-600 rounded-md overflow-hidden bg-gray-800",
    signatureColor: "#60A5FA", // blue-400 (lighter for visibility on dark background)
  },
  container: {
    card: "bg-gray-800 text-gray-100 border-gray-700",
    border: "border-gray-700",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-500/10",
    header: "bg-gray-700",
  },
  progress: {
    bar: "h-2 bg-gray-700 rounded-full overflow-hidden",
    dots: "flex space-x-2",
    numbers: "flex space-x-2",
    percentage: "text-right text-sm text-gray-400 mb-1",
    label: "text-sm text-gray-400 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-[#FFFFFF] bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500",
    text: "text-sm font-medium text-blue-400 hover:text-blue-300",
    navigation: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[#FFFFFF] bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500",
  },
  colors: {
    primary: "#3B82F6", // blue-500
    secondary: "#6B7280", // gray-500
    accent: "#60A5FA", // blue-400
    background: "#111827", // gray-900
    text: "#F3F4F6", // gray-100
    border: "#374151", // gray-700
    error: "#F87171", // red-400
    success: "#34D399", // emerald-400
  },
};

// Hims theme - already complete with all keys
export const himsTheme: ThemeDefinition = {
  name: "hims",
  containerLayout: "max-w-full mx-auto py-8 px-4 sm:px-6",
  header: "mb-8",
  title: "text-3xl font-semibold text-gray-900 mb-4 text-left",
  description: "text-lg text-gray-600 mb-6 text-left",
  background: "bg-white",
  card: "bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200",
  container: {
    card: "bg-white border border-gray-200 rounded-lg shadow-sm",
    border: "border-gray-200",
    activeBorder: "border-gray-400",
    activeBg: "bg-gray-50",
    header: "bg-gray-100"
  },
  field: {
    label: "block text-base font-medium text-gray-900 mb-4",
    input: "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    description: "mt-2 text-sm text-gray-600",
    error: "mt-2 text-sm text-red-600 font-medium",
    radio: "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300",
    checkbox: "focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded",
    select: "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    textarea: "w-full rounded-lg border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-base py-3 px-4",
    file: "w-full text-base text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 py-3 px-4",
    matrix: "border-collapse w-full text-base rounded-lg overflow-hidden",
    range: "accent-gray-600",
    text: "text-gray-900",
    activeText: "text-gray-900",
    placeholder: "text-gray-500",
    boxBorder: "border-gray-300",
    selectableBox: "p-5 transition-all duration-200 cursor-pointer rounded-lg",
    selectableBoxDefault: "border border-gray-300 bg-white hover:bg-gray-50",
    selectableBoxSelected: "border-1 border-gray-400 bg-gray-50",
    selectableBoxHover: "hover:border-gray-400",
    selectableBoxFocus: "focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2",
    selectableBoxDisabled: "opacity-50 cursor-not-allowed",
    selectableBoxContainer: "space-y-3",
    selectableBoxText: "text-gray-900 text-base font-normal",
    selectableBoxTextSelected: "text-gray-900 font-normal",
    selectableBoxIndicator: "bg-gray-600 text-[#FFFFFF]",
    selectableBoxIndicatorIcon: "text-[#FFFFFF]",
    agreementContainer: "p-5 space-y-4",
    agreementPanel: "rounded-lg border border-gray-300 p-4 text-base whitespace-pre-wrap bg-gray-50",
    signatureCanvas: "w-full h-40 border border-gray-300 rounded-lg overflow-hidden bg-white",
    signatureColor: "#111827", // gray-900
  },
  progress: {
    bar: "h-2 bg-gray-600 rounded-full overflow-hidden",
    dots: "flex space-x-2 justify-center",
    numbers: "flex space-x-2 justify-center",
    percentage: "text-right text-base text-gray-600 font-medium mb-2",
    label: "text-base text-gray-700 mb-2 font-medium"
  },
  button: {
    primary: "inline-flex justify-center py-3 px-6 text-base font-medium rounded-lg text-[#FFFFFF] bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200",
    secondary: "inline-flex justify-center py-3 px-6 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500",
    text: "text-base font-medium text-gray-600 hover:text-gray-800",
    navigation: "inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-[#FFFFFF] bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
  },
  colors: {
    primary: "#111827",
    secondary: "#6B7280",
    accent: "#374151",
    background: "#FFFFFF",
    text: "#111827",
    border: "#D1D5DB",
    error: "#EF4444",
    success: "#10B981"
  }
};

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