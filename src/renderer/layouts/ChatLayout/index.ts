// Main layout component
export { ChatLayout } from './ChatLayout';

// Types
export type {
  ChatMessage,
  AIHandler,
  AIHandlerContext,
  AIHandlerResponse,
  ChatLayoutProps,
  ChatCustomData,
} from './types';

// Components (for custom layouts)
export { ChatContainer } from './ChatContainer';
export { ChatMessageComponent } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { ChatMultiFieldInput } from './ChatMultiFieldInput';
export { ChatOptionButtons } from './ChatOptionButtons';
export { TypingIndicator } from './TypingIndicator';

// Hooks (for custom implementations)
export { useChatMessages } from './hooks/useChatMessages';
export { useAutoScroll } from './hooks/useAutoScroll';

// Utilities
export { defaultAIHandler, formatResponseForDisplay, generateMessageId } from './utils/defaultAIHandler';
