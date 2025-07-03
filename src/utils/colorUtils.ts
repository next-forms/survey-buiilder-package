export function hexToRgba(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const VARIANT_PSEUDOS: Record<string, string> = {
  hover: ':hover',
  focus: ':focus',
  active: ':active',
  disabled: ':disabled',
  'focus-visible': ':focus-visible',
  checked: ':checked',
};

// Properly escape CSS class name special characters
function escapeCSSSelector(className: string): string {
  return className
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/#/g, '\\#')
    .replace(/\//g, '\\/');
}

export function applyDynamicColors(theme: any) {
  if (typeof document === 'undefined' || !theme) return;

  const styleId = 'dynamic-color-styles';
  let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }

  const sheet = styleTag.sheet as CSSStyleSheet;
  const existing = new Set<string>();

  for (let i = 0; i < sheet.cssRules.length; i++) {
    existing.add(sheet.cssRules[i].cssText);
  }

  const addRule = (selector: string, rule: string) => {
    const text = `${selector}{${rule}}`;
    if (!existing.has(text)) {
      try {
        sheet.insertRule(text, sheet.cssRules.length);
        existing.add(text);
      } catch (error) {
        console.warn(`Failed to insert CSS rule: ${text}`, error);
      }
    }
  };

  const parseClasses = (classes: string) => {
    classes.split(/\s+/).forEach((cls) => {
      const match = cls.match(/^(?:([a-zA-Z-]+):)?(text|bg|border|ring|accent)-\[(#[0-9a-fA-F]{6})\](?:\/(\d{1,3}))?$/);
      if (match) {
        const variant = match[1];
        const type = match[2];
        const color = match[3];
        const alpha = match[4] ? parseInt(match[4], 10) / 100 : 1;
        const rgba = hexToRgba(color, alpha);

        let selector = `.${escapeCSSSelector(cls)}`;
        if (variant && VARIANT_PSEUDOS[variant]) {
          selector += VARIANT_PSEUDOS[variant];
        }

        const prop =
          type === 'text'
            ? `color: ${rgba}`
            : type === 'bg'
            ? `background-color: ${rgba}`
            : type === 'border'
            ? `border-color: ${rgba}`
            : type === 'ring'
            ? `--tw-ring-color: ${rgba}`
            : `accent-color: ${rgba}`;

        addRule(selector, prop);
      }
    });
  };

  const traverse = (obj: any) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      parseClasses(obj);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(traverse);
    }
  };

  traverse(theme);
}