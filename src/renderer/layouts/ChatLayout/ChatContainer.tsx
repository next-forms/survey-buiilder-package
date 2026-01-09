import React, { forwardRef } from 'react';
import { cn } from '../../../lib/utils';
import type { ThemeDefinition } from '../../../types';

interface ChatContainerProps {
  children: React.ReactNode;
  theme?: ThemeDefinition;
  className?: string;
}

export const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ children, theme, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full overflow-y-auto',
          'px-4 py-6 space-y-4',
          'scroll-smooth',
          theme?.background,
          className
        )}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
        }}
      >
        {children}
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
