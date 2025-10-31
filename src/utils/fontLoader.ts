import { useEffect } from 'react';
import type { ThemeDefinition } from '../types';

/**
 * Load custom fonts from CDN URLs
 * @param urls - Array of font CDN URLs (e.g., Google Fonts, Adobe Fonts)
 */
export const loadFonts = (urls: string[]): void => {
  urls.forEach((url) => {
    // Check if the font link is already added to the document
    const existingLink = document.querySelector(`link[href="${url}"]`);

    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
};

/**
 * Remove custom fonts from the document
 * @param urls - Array of font CDN URLs to remove
 */
export const unloadFonts = (urls: string[]): void => {
  urls.forEach((url) => {
    const link = document.querySelector(`link[href="${url}"]`);
    if (link) {
      document.head.removeChild(link);
    }
  });
};

/**
 * Hook to load and unload custom fonts
 * @param theme - Theme definition containing font configuration
 */
export const useFontLoader = (theme?: ThemeDefinition): void => {
  useEffect(() => {
    if (!theme?.fonts?.urls || theme.fonts.urls.length === 0) {
      return;
    }

    loadFonts(theme.fonts.urls);

    // Cleanup: remove fonts when component unmounts or theme changes
    return () => {
      // Note: We keep fonts loaded for performance reasons
      // Multiple surveys on the same page can share fonts
      // Uncomment the line below if you want to remove fonts on unmount
      // unloadFonts(theme.fonts.urls!);
    };
  }, [theme?.fonts?.urls]);
};

/**
 * Normalize font family string for CSS
 * Properly formats font families with quotes for names containing spaces
 * @param fontFamily - Font family string (may include quotes)
 * @returns Normalized font family string ready for CSS
 */
export const normalizeFontFamily = (fontFamily: string): string => {
  if (!fontFamily) return fontFamily;

  // Trim whitespace
  let normalized = fontFamily.trim();

  // Remove outer quotes if the entire string is quoted
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1).trim();
  }

  // Split by comma to process each font family
  const fonts = normalized.split(',').map(font => font.trim());

  // Process each font family
  const processedFonts = fonts.map(font => {
    // Remove existing quotes
    let cleanFont = font;
    if ((cleanFont.startsWith('"') && cleanFont.endsWith('"')) ||
        (cleanFont.startsWith("'") && cleanFont.endsWith("'"))) {
      cleanFont = cleanFont.slice(1, -1).trim();
    }

    // Generic font families that should not be quoted
    const genericFamilies = [
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
      'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded'
    ];

    // Check if it's a generic family (case-insensitive)
    if (genericFamilies.includes(cleanFont.toLowerCase())) {
      return cleanFont;
    }

    // If font name contains spaces or special characters, quote it
    if (/[\s,]/.test(cleanFont)) {
      return `"${cleanFont}"`;
    }

    // Return as-is if no spaces
    return cleanFont;
  });

  return processedFonts.join(', ');
};

/**
 * Generate CSS custom properties for font configuration
 * @param theme - Theme definition containing font configuration
 * @returns Object with CSS custom properties for fonts
 */
export const getFontCSSProperties = (theme?: ThemeDefinition): Record<string, string> => {
  if (!theme?.fonts) {
    return {};
  }

  const properties: Record<string, string> = {};

  // Font families - normalize to remove outer quotes
  if (theme.fonts.primary) {
    properties['--survey-font-primary'] = normalizeFontFamily(theme.fonts.primary);
  }
  if (theme.fonts.secondary) {
    properties['--survey-font-secondary'] = normalizeFontFamily(theme.fonts.secondary);
  }
  if (theme.fonts.heading) {
    properties['--survey-font-heading'] = normalizeFontFamily(theme.fonts.heading);
  }
  if (theme.fonts.body) {
    properties['--survey-font-body'] = normalizeFontFamily(theme.fonts.body);
  }
  if (theme.fonts.monospace) {
    properties['--survey-font-monospace'] = normalizeFontFamily(theme.fonts.monospace);
  }

  // Font weights
  if (theme.fonts.weights?.normal) {
    properties['--survey-font-weight-normal'] = String(theme.fonts.weights.normal);
  }
  if (theme.fonts.weights?.medium) {
    properties['--survey-font-weight-medium'] = String(theme.fonts.weights.medium);
  }
  if (theme.fonts.weights?.semibold) {
    properties['--survey-font-weight-semibold'] = String(theme.fonts.weights.semibold);
  }
  if (theme.fonts.weights?.bold) {
    properties['--survey-font-weight-bold'] = String(theme.fonts.weights.bold);
  }

  return properties;
};

/**
 * Get the font family fallback chain for a specific font type
 * @param fontFamily - Font family string
 * @returns Font family with fallbacks
 */
export const getFontFamilyWithFallback = (fontFamily?: string): string => {
  if (!fontFamily) {
    return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }

  // Check if font family already includes fallbacks
  if (fontFamily.includes(',')) {
    return fontFamily;
  }

  // Add appropriate fallbacks based on font type
  const hasSerif = fontFamily.toLowerCase().includes('serif') && !fontFamily.toLowerCase().includes('sans-serif');
  const hasMono = fontFamily.toLowerCase().includes('mono') || fontFamily.toLowerCase().includes('code');

  if (hasMono) {
    return `${fontFamily}, ui-monospace, Menlo, Monaco, "Cascadia Code", "Courier New", monospace`;
  }

  if (hasSerif) {
    return `${fontFamily}, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;
  }

  return `${fontFamily}, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
};
