import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '../../../lib/utils';
import type { ChatMessage as ChatMessageType } from './types';
import type { ThemeDefinition } from '../../../types';
import { TypingIndicator } from './TypingIndicator';
import { FileMessageDisplay } from './FileMessageDisplay';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
  theme?: ThemeDefinition;
  className?: string;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  showTimestamp = false,
  theme,
  className,
}) => {
  const isAssistant = message.role === 'assistant';

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Animation variants
  const messageVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1], // easeOut cubic bezier
      },
    },
  };

  if (message.isLoading) {
    return (
      <motion.div
        className={cn(
          'flex',
          isAssistant ? 'justify-start' : 'justify-end',
          className
        )}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
      >
        <TypingIndicator />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex flex-col gap-1',
        isAssistant ? 'items-start' : 'items-end',
        className
      )}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-3 rounded-2xl',
          isAssistant
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
            : 'text-white rounded-br-md',
          !isAssistant &&
            (theme?.colors?.primary
              ? `bg-[${theme.colors.primary}]`
              : 'bg-blue-600')
        )}
        style={
          !isAssistant && theme?.colors?.primary
            ? { backgroundColor: theme.colors.primary }
            : undefined
        }
      >
        {message.blockType === 'fileupload' && message.userResponse?.value ? (
          <FileMessageDisplay files={message.userResponse.value} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}
      </div>

      {showTimestamp && (
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
          {formatTime(message.timestamp)}
        </span>
      )}
    </motion.div>
  );
};

export { ChatMessageComponent as ChatMessage };
