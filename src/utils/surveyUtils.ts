import type { NodeData, BlockData } from "../types";

/**
 * Extracts all pages/sections from a survey
 * @param rootNode The survey root node
 * @returns Array of page blocks
 */
export function getSurveyPages(rootNode: NodeData): Array<BlockData[]> {
  const pages: Array<BlockData[]> = [];

  // If there are no nodes or items, return empty array
  if (!rootNode.nodes && !rootNode.items) {
    return pages;
  }

  // Process items at the root level
  if (rootNode.items && rootNode.items.length > 0) {
    // Check for 'set' blocks at the root level which should be treated as pages
    const setBlocks = rootNode.items.filter(item => item.type === 'set');

    if (setBlocks.length > 0) {
      // Each 'set' block becomes a separate page
      setBlocks.forEach(setBlock => {
        if (setBlock.items && setBlock.items.length > 0) {
          pages.push(setBlock.items);
        }
      });
    } else {
      // If no 'set' blocks, treat all items as a single page
      pages.push(rootNode.items);
    }
  }

  // Process child nodes (sections)
  if (rootNode.nodes && rootNode.nodes.length > 0) {
    rootNode.nodes.forEach(nodeRef => {
      // Handle both node reference and inline node
      const node = typeof nodeRef === 'string' ? { type: 'section', uuid: nodeRef } : nodeRef;

      // Skip if not a section
      if (node.type !== 'section') {
        return;
      }

      // Check for 'set' blocks in the section
      if (node.items && node.items.length > 0) {
        const setBlocks = node.items.filter(item => item.type === 'set');

        if (setBlocks.length > 0) {
          // Each 'set' block becomes a separate page
          setBlocks.forEach(setBlock => {
            if (setBlock.items && setBlock.items.length > 0) {
              pages.push(setBlock.items);
            }
          });
        } else {
          // If no 'set' blocks, treat all section items as a single page
          pages.push(node.items);
        }
      }

      // Recursively process child nodes
      if (node.nodes && node.nodes.length > 0) {
        const childPages = getSurveyPages(node);
        pages.push(...childPages);
      }
    });
  }

  // Ensure we always have at least one page to avoid NaN calculations
  if (pages.length === 0) {
    pages.push([]);
  }

  return pages;
}

/**
 * Returns an array of page UUIDs in the same order as getSurveyPages
 */
export function getSurveyPageIds(rootNode: NodeData): string[] {
  const ids: string[] = [];

  const processNode = (node: NodeData) => {
    if (node.items && node.items.length > 0) {
      const setBlocks = node.items.filter(item => item.type === 'set');

      if (setBlocks.length > 0) {
        setBlocks.forEach(setBlock => {
          ids.push(setBlock.uuid || '');
        });
      } else {
        ids.push(node.uuid || '');
      }
    }

    if (node.nodes && node.nodes.length > 0) {
      node.nodes.forEach(n => {
        const child = typeof n === 'string' ? { type: 'section', uuid: n } : n;
        if (child.type === 'section') {
          processNode(child);
        }
      });
    }
  };

  processNode(rootNode);

  if (ids.length === 0) {
    ids.push(rootNode.uuid || '');
  }

  return ids;
}

/**
 * Safely evaluate logic script in a survey
 *
 * @param script The logic script to evaluate
 * @param context The context object with form data and helper functions
 */
export function evaluateLogic(script: string, context: {
  fieldValues: Record<string, any>;
  setValue?: (field: string, value: any) => void;
  setError?: (field: string, error: string | null) => void;
  currentPage?: number;
  getFieldValue?: (fieldName: string) => any;
  showAlert?: (message: string) => void;
}) {
  try {
    // Basic sanitization - remove potentially harmful parts of script
    const sanitizedScript = script
      .replace(/import\s*\{/g, "")
      .replace(/require\s*\(/g, "")
      .replace(/process/g, "")
      .replace(/global/g, "")
      .replace(/window/g, "")
      .replace(/document/g, "")
      .replace(/eval\s*\(/g, "");

    // Create a function from the script
    const fn = new Function('context', `
      "use strict";
      // Extract context values
      const fieldValues = context.fieldValues || {};
      const setValue = context.setValue;
      const setError = context.setError;
      const currentPage = context.currentPage;
      const getFieldValue = context.getFieldValue || ((fieldName) => fieldValues[fieldName]);
      const showAlert = context.showAlert || ((message) => console.log(message));

      try {
        ${sanitizedScript}
        return { isValid: true };
      } catch (error) {
        return { isValid: false, errorMessage: error.message };
      }
    `);

    // Execute the function with the provided context
    return fn(context);
  } catch (error) {
    console.error("Error executing logic script:", error);
    return { isValid: false, errorMessage: "Error in logic script" };
  }
}

/**
 * Gets a localized label for a block
 */
export function getLocalized(
  block: BlockData,
  field: string,
  language: string,
  localizations?: Record<string, Record<string, string>>
) {
  if (!localizations || !language || language === 'en') {
    return block[field];
  }

  const langMap = localizations[language];
  if (!langMap) {
    return block[field];
  }

  const blockId = block.uuid;
  if (!blockId) {
    return block[field];
  }

  const key = `${blockId}.${field}`;
  return langMap[key] || block[field];
}

/**
 * Generate a className based on theme and customization options
 */
export function getThemeClass(theme: string, baseClass: string, customClass?: string): string {
  const themeClass = `theme-${theme}`;
  return `${baseClass} ${themeClass} ${customClass || ''}`.trim();
}

/**
 * Formats a field name into a human-readable label
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // insert a space before all capital letters
    .replace(/([0-9]+)/g, ' $1 ') // space before and after numbers
    .replace(/^./, char => char.toUpperCase()) // uppercase the first character
    .replace(/_/g, ' ') // replace underscores with spaces
    .replace(/\s+/g, ' ') // remove multiple spaces
    .trim();
}
