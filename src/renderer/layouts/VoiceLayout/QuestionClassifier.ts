import type { BlockData } from '../../../types';
import type { InputMode, QuestionClassification } from './types';

/**
 * Question Classifier
 *
 * Automatically determines the best input mode for each survey block.
 *
 * Classification rules:
 *
 * | Block Type           | Input Mode | Reason                              |
 * |---------------------|------------|-------------------------------------|
 * | textfield, textarea | Voice      | Free text works with STT            |
 * | radio (≤4 options)  | Voice      | "Option one" / "Yes"                |
 * | radio (>4 options)  | Hybrid     | Show visually, accept voice         |
 * | checkbox            | Hybrid     | Visual confirmation helps           |
 * | select, selectablebox | Hybrid   | Many options need visual            |
 * | matrix              | Visual     | Grid requires visual                |
 * | datepicker          | Visual     | Calendar interaction                |
 * | range/slider        | Visual     | Spatial feedback needed             |
 * | fileupload          | Visual     | File browser required               |
 * | signature           | Visual     | Drawing canvas                      |
 * | sensitive: true     | Visual     | Privacy mode (explicit flag)        |
 */

// Block types that always require visual input
const VISUAL_ONLY_BLOCKS = new Set([
  'matrix',
  'matrixgrid',
  'datepicker',
  'date',
  'datetime',
  'daterange',
  'timepicker',
  'fileupload',
  'file',
  'signature',
  'drawing',
  'imagepicker',
  'rating', // Dragging/clicking stars
  'colorpicker',
  'location',
  'map',
]);

// Block types that work well with voice
const VOICE_FRIENDLY_BLOCKS = new Set([
  'textfield',
  'textarea',
  'text',
  'email', // Can be spelled out
  'phone', // Numbers work well
  'number',
]);

// Block types that can be hybrid
const HYBRID_BLOCKS = new Set([
  'radio',
  'checkbox',
  'select',
  'dropdown',
  'selectablebox',
  'multiselect',
  'autocomplete',
  'range',
  'slider',
]);

/**
 * Classify a block to determine the best input mode
 */
export function classifyQuestion(block: BlockData): QuestionClassification {
  const blockType = block.type.toLowerCase();

  // Check for explicit sensitive flag
  if (block.sensitive === true) {
    return {
      inputMode: 'visual',
      reason: 'Privacy mode - sensitive information',
    };
  }

  // Visual-only blocks
  if (VISUAL_ONLY_BLOCKS.has(blockType)) {
    return {
      inputMode: 'visual',
      reason: `Block type '${blockType}' requires visual interaction`,
    };
  }

  // Voice-friendly blocks
  if (VOICE_FRIENDLY_BLOCKS.has(blockType)) {
    return {
      inputMode: 'voice',
      reason: `Block type '${blockType}' works well with voice input`,
    };
  }

  // Radio with few options - voice friendly
  if (blockType === 'radio') {
    const optionCount = getOptionCount(block);
    if (optionCount <= 4) {
      const hints = getVoiceHints(block);
      return {
        inputMode: 'voice',
        reason: `Radio with ${optionCount} options - voice friendly`,
        voiceHints: hints,
      };
    }
    return {
      inputMode: 'hybrid',
      reason: `Radio with ${optionCount} options - show visually, accept voice`,
      voiceHints: getVoiceHints(block),
    };
  }

  // Checkbox - usually better with visual confirmation
  if (blockType === 'checkbox') {
    const optionCount = getOptionCount(block);
    return {
      inputMode: 'hybrid',
      reason: `Checkbox with ${optionCount} options - visual confirmation helps`,
      voiceHints: getVoiceHints(block),
    };
  }

  // Select/dropdown - hybrid for many options
  if (blockType === 'select' || blockType === 'dropdown') {
    const optionCount = getOptionCount(block);
    if (optionCount <= 3) {
      return {
        inputMode: 'voice',
        reason: `Select with ${optionCount} options - voice friendly`,
        voiceHints: getVoiceHints(block),
      };
    }
    return {
      inputMode: 'hybrid',
      reason: `Select with ${optionCount} options - show visually, accept voice`,
      voiceHints: getVoiceHints(block),
    };
  }

  // Range/slider - visual for spatial feedback
  if (blockType === 'range' || blockType === 'slider') {
    return {
      inputMode: 'hybrid',
      reason: 'Range/slider - accepts voice numbers but visual helps',
    };
  }

  // Selectable box - hybrid
  if (blockType === 'selectablebox') {
    return {
      inputMode: 'hybrid',
      reason: 'Selectable boxes work better with visual',
      voiceHints: getVoiceHints(block),
    };
  }

  // Hybrid blocks
  if (HYBRID_BLOCKS.has(blockType)) {
    return {
      inputMode: 'hybrid',
      reason: `Block type '${blockType}' benefits from both voice and visual`,
      voiceHints: getVoiceHints(block),
    };
  }

  // Default to hybrid for unknown types
  return {
    inputMode: 'hybrid',
    reason: `Unknown block type '${blockType}' - defaulting to hybrid`,
  };
}

/**
 * Get the number of options in a block
 */
function getOptionCount(block: BlockData): number {
  // Check various option formats
  if (block.options && Array.isArray(block.options)) {
    return block.options.length;
  }
  if (block.items && Array.isArray(block.items)) {
    return block.items.length;
  }
  if (block.labels && Array.isArray(block.labels)) {
    return block.labels.length;
  }
  if (block.values && Array.isArray(block.values)) {
    return block.values.length;
  }
  return 0;
}

/**
 * Get voice hints (option labels) for voice matching
 */
function getVoiceHints(block: BlockData): string[] {
  const hints: string[] = [];

  // Options array format
  if (block.options && Array.isArray(block.options)) {
    for (const opt of block.options) {
      if (typeof opt === 'object' && opt.label) {
        hints.push(opt.label.toLowerCase());
      } else if (typeof opt === 'string') {
        hints.push(opt.toLowerCase());
      }
    }
    return hints;
  }

  // Items array format
  if (block.items && Array.isArray(block.items)) {
    for (const item of block.items as any[]) {
      if (typeof item === 'object' && item !== null && item.label) {
        hints.push(String(item.label).toLowerCase());
      } else if (typeof item === 'string') {
        hints.push(item.toLowerCase());
      }
    }
    return hints;
  }

  // Labels array format
  if (block.labels && Array.isArray(block.labels)) {
    for (const label of block.labels) {
      if (typeof label === 'string') {
        hints.push(label.toLowerCase());
      }
    }
    return hints;
  }

  return hints;
}

/**
 * Match voice input to an option
 */
export function matchVoiceToOption(
  transcript: string,
  block: BlockData
): { matched: boolean; value: unknown; label: string | null } {
  const normalized = transcript.toLowerCase().trim();
  const hints = getVoiceHints(block);

  // Direct match
  for (let i = 0; i < hints.length; i++) {
    if (normalized === hints[i] || normalized.includes(hints[i])) {
      return {
        matched: true,
        value: getValueAtIndex(block, i),
        label: hints[i],
      };
    }
  }

  // Number-based selection ("option one", "first", "1")
  const numberMatch = parseNumberReference(normalized);
  if (numberMatch !== null && numberMatch >= 1 && numberMatch <= hints.length) {
    const index = numberMatch - 1;
    return {
      matched: true,
      value: getValueAtIndex(block, index),
      label: hints[index],
    };
  }

  // Yes/No for boolean-like options
  if (hints.length === 2) {
    const yesWords = ['yes', 'yeah', 'yep', 'sure', 'correct', 'right', 'affirmative', 'true'];
    const noWords = ['no', 'nope', 'nah', 'negative', 'wrong', 'false'];

    if (yesWords.some((w) => normalized.includes(w))) {
      // Assume first option is "yes"
      return {
        matched: true,
        value: getValueAtIndex(block, 0),
        label: hints[0],
      };
    }
    if (noWords.some((w) => normalized.includes(w))) {
      // Assume second option is "no"
      return {
        matched: true,
        value: getValueAtIndex(block, 1),
        label: hints[1],
      };
    }
  }

  return { matched: false, value: null, label: null };
}

/**
 * Get value at a specific index in block options
 */
function getValueAtIndex(block: BlockData, index: number): unknown {
  // Options array format
  if (block.options && Array.isArray(block.options) && block.options[index]) {
    const opt = block.options[index];
    return typeof opt === 'object' ? opt.value : opt;
  }

  // Items array format
  if (block.items && Array.isArray(block.items) && block.items[index]) {
    const item = block.items[index];
    return typeof item === 'object' ? item.value : item;
  }

  // Values array format
  if (block.values && Array.isArray(block.values) && block.values[index]) {
    return block.values[index];
  }

  // Labels array format (use label as value)
  if (block.labels && Array.isArray(block.labels) && block.labels[index]) {
    return block.labels[index];
  }

  return null;
}

/**
 * Parse number references from speech
 */
function parseNumberReference(text: string): number | null {
  const numberWords: Record<string, number> = {
    one: 1,
    first: 1,
    two: 2,
    second: 2,
    three: 3,
    third: 3,
    four: 4,
    fourth: 4,
    five: 5,
    fifth: 5,
    six: 6,
    sixth: 6,
    seven: 7,
    seventh: 7,
    eight: 8,
    eighth: 8,
    nine: 9,
    ninth: 9,
    ten: 10,
    tenth: 10,
  };

  // Check for word numbers
  for (const [word, num] of Object.entries(numberWords)) {
    if (text.includes(word)) {
      return num;
    }
  }

  // Check for digit numbers
  const digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) {
    return parseInt(digitMatch[1], 10);
  }

  // Check for "option X" pattern
  const optionMatch = text.match(/option\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  if (optionMatch) {
    const optionNum = optionMatch[1].toLowerCase();
    return numberWords[optionNum] || parseInt(optionNum, 10);
  }

  return null;
}

/**
 * Check if block should use privacy mode
 */
export function isPrivacyBlock(block: BlockData): boolean {
  // Explicit sensitive flag
  if (block.sensitive === true) {
    return true;
  }

  // Check field name for common sensitive patterns
  const fieldName = (block.fieldName || block.name || '').toLowerCase();
  const sensitivePatterns = [
    'password',
    'ssn',
    'social_security',
    'credit_card',
    'card_number',
    'cvv',
    'pin',
    'secret',
    'private',
  ];

  return sensitivePatterns.some((pattern) => fieldName.includes(pattern));
}
