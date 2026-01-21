import type { BlockData, LayoutProps, BlockDefinition, ChatRendererProps } from "../../../types";

// Re-export ChatRendererProps for convenience
export type { ChatRendererProps };

/**
 * Represents a single message in the chat conversation
 */
export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  blockId?: string;
  blockType?: string;
  timestamp: Date;
  isLoading?: boolean;
  originalQuestion?: string;
  userResponse?: {
    value: any;
    displayValue: string;
  };
}

/**
 * Schema property definition for inputSchema/outputSchema
 */
export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  optional?: boolean;
  description?: string;
}

/**
 * Input/Output schema structure
 */
export interface BlockSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, SchemaProperty>;
  items?: { type: string };
}

/**
 * Block function definition
 */
export interface BlockFunction {
  name: string;
  parameters: Record<string, SchemaProperty>;
  callfunction: (...args: any[]) => any;
}

/**
 * Extended block data with schema support
 */
export interface ExtendedBlockData extends BlockData {
  inputSchema?: BlockSchema;
  outputSchema?: BlockSchema;
  blockFunctions?: BlockFunction[];
}

/**
 * Context passed to the AI handler for generating conversational questions
 */
export interface AIHandlerContext {
  block: BlockData;
  previousResponses: Record<string, any>;
  conversationHistory: ChatMessage[];
  surveyTitle?: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  // Multi-field support
  inputSchema?: BlockSchema;
  currentField?: string;
  collectedFields?: Record<string, any>;
  remainingFields?: string[];
}

/**
 * Response from the AI handler
 */
export interface AIHandlerResponse {
  conversationalQuestion: string;
  additionalContext?: string;
  /**
   * Optional TTS audio data (base64 encoded).
   * If provided, VoiceLayout will use this directly instead of making a separate TTS call.
   */
  audio?: string;
  /**
   * Audio format (required if audio is provided)
   */
  audioFormat?: 'mp3' | 'pcm' | 'ogg' | 'wav';
  /**
   * Audio sample rate in Hz (for PCM format)
   */
  audioSampleRate?: number;
}

/**
 * AI Handler function signature
 * Passed via customData from the main app
 */
export type AIHandler = (
  context: AIHandlerContext
) => Promise<AIHandlerResponse>;

/**
 * Extended props for the Chat Layout
 */
export interface ChatLayoutProps extends LayoutProps {
  /**
   * Initial greeting message from the assistant
   * @default "Hi! I'm here to help you complete this survey. Let's get started!"
   */
  welcomeMessage?: string;

  /**
   * Typing indicator delay in milliseconds
   * @default 500
   */
  typingDelay?: number;

  /**
   * Whether to show timestamps on messages
   * @default false
   */
  showTimestamps?: boolean;

  /**
   * Custom placeholder for text input
   * @default "Type your answer..."
   */
  inputPlaceholder?: string;

  /**
   * Whether to auto-scroll to new messages
   * @default true
   */
  autoScrollToBottom?: boolean;

  /**
   * Custom class for chat container
   */
  chatContainerClassName?: string;

  /**
   * Custom class for message bubbles
   */
  messageBubbleClassName?: string;
}

/**
 * Chat customData structure expected from the main app
 */
export interface ChatCustomData {
  aiHandler?: AIHandler;
  welcomeMessage?: string;
  typingDelay?: number;
  showTimestamps?: boolean;
  inputPlaceholder?: string;
}
