import type { AIHandler, AIHandlerResponse, AIHandlerContext } from '../types';

/**
 * Default AI handler that simply returns the original question text.
 * This is used when no AI handler is provided via customData.
 */
export const defaultAIHandler: AIHandler = async (
  context: AIHandlerContext,
): Promise<AIHandlerResponse> => {
  const { block } = context;

  // Use the block's label, name, or a generic fallback
  const questionText =
    block.label || block.name || 'Please answer this question:';

  return {
    conversationalQuestion: questionText,
    additionalContext: block.description,
  };
};

/**
 * Helper to get options from a block (handles multiple formats)
 */
function getBlockOptions(block: {
  options?: any[];
  items?: any[];
  labels?: string[];
  values?: any[];
}): Array<{ label: string; value: any }> {
  // Handle options array (preferred format)
  if (block.options && Array.isArray(block.options)) {
    return block.options.map((opt: any) => ({
      label: opt.label || String(opt.value),
      value: opt.value,
    }));
  }
  // Handle items array
  if (block.items && Array.isArray(block.items)) {
    return block.items.map((item: any) => ({
      label: item.label || String(item.value),
      value: item.value,
    }));
  }
  // Handle labels/values arrays (legacy format)
  if (block.labels && Array.isArray(block.labels)) {
    const values = block.values || block.labels;
    return block.labels.map((label: string, i: number) => ({
      label,
      value: values[i],
    }));
  }
  return [];
}

/**
 * Helper to format a user's response for display in chat
 */
export function formatResponseForDisplay(
  value: any,
  block: {
    type: string;
    options?: any[];
    labels?: string[];
    values?: any[];
    items?: any[];
  },
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const blockType = block.type;
  const options = getBlockOptions(block);

  // Handle radio/select - single value
  if (
    blockType === 'radio' ||
    blockType === 'select' ||
    blockType === 'selectablebox'
  ) {
    const option = options.find((opt) => opt.value === value);
    if (option) {
      return option.label;
    }
    return String(value);
  }

  // Handle checkbox - array of values
  if (blockType === 'checkbox') {
    if (Array.isArray(value)) {
      const displayValues = value.map((v) => {
        const option = options.find((opt) => opt.value === v);
        return option ? option.label : String(v);
      });
      return displayValues.join(', ');
    }
    return String(value);
  }

  // Handle date
  if (blockType === 'datepicker' || blockType === 'date') {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    return String(value);
  }

  // Handle file upload
  if (blockType === 'fileupload' || blockType === 'file') {
    if (value?.name) {
      return `Uploaded: ${value.name}`;
    }
    if (Array.isArray(value)) {
      return value.map((f: any) => f.name || 'File').join(', ');
    }
    return 'File uploaded';
  }

  // Handle range/slider
  if (blockType === 'range' || blockType === 'slider') {
    return String(value);
  }

  // Handle conditional blocks (acknowledgment blocks)
  // These often submit 'true' to indicate acknowledgment
  if (blockType === 'conditional') {
    if (value === true) {
      return 'Understood!';
    }
    if (value === false) {
      return 'Declined';
    }
    // For conditional blocks with actual input values, fall through to default
    /* TODO: This displays "Got it!" for file uploads too. Message is good, but we can add attached files below it. Noted for future updates.  */
    if (typeof value === 'string' && value) {
      return value;
    }
    return 'Got it!';
  }

  // Handle boolean values in a human-friendly way
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Default: convert to string
  return String(value);
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
