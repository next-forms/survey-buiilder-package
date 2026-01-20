import { useRef, useCallback, useEffect, useState } from 'react';

export interface UseAutoScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: (smooth?: boolean) => void;
  isAtBottom: boolean;
  inputHeight: number;
  unreadCount: number;
  clearUnread: () => void;
  onUserMessage: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isLoading?: boolean;
  [key: string]: any;
}

export function useAutoScroll(
  enabled: boolean = true,
  messages: Message[] = []
): UseAutoScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [inputHeight, setInputHeight] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const isAtBottomRef = useRef(true);
  // Track which message IDs have been "seen" (user was at bottom when they completed loading)
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  // Delay initialization to avoid showing indicator during initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mark all existing messages as seen before we start tracking
      messages.forEach((msg) => {
        if (msg.role === 'assistant' && !msg.isLoading && msg.content) {
          seenMessageIdsRef.current.add(msg.id);
        }
      });
      setIsInitialized(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  const scrollToBottom = useCallback(
    (smooth: boolean = true) => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // Simple scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });

      // Clear unread when scrolling to bottom
      setUnreadCount(0);

      // Mark all current messages as seen
      messages.forEach((msg) => {
        if (msg.role === 'assistant' && !msg.isLoading && msg.content) {
          seenMessageIdsRef.current.add(msg.id);
        }
      });
    },
    [messages]
  );

  // Clear unread messages (called when user clicks the indicator)
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
    scrollToBottom(true);
  }, [scrollToBottom]);

  // Called when user sends a message - always scroll to bottom
  const onUserMessage = useCallback(() => {
    setUnreadCount(0);
    // Mark all messages as seen since user is actively engaged
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && !msg.isLoading && msg.content) {
        seenMessageIdsRef.current.add(msg.id);
      }
    });
    // Delay to let content render
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);
  }, [scrollToBottom, messages]);

  // Check if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const threshold = 100;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsAtBottom(atBottom);
    isAtBottomRef.current = atBottom;

    // Clear unread and mark as seen when user scrolls to bottom
    if (atBottom) {
      setUnreadCount(0);
      messages.forEach((msg) => {
        if (msg.role === 'assistant' && !msg.isLoading && msg.content) {
          seenMessageIdsRef.current.add(msg.id);
        }
      });
    }
  }, [messages]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Watch for new completed AI messages and increment unread count if not at bottom
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    // Find assistant messages that are complete (not loading) and haven't been seen
    const completedUnseenMessages = messages.filter(
      (msg) =>
        msg.role === 'assistant' &&
        !msg.isLoading &&
        msg.content &&
        !seenMessageIdsRef.current.has(msg.id)
    );

    if (isAtBottomRef.current) {
      // User is at bottom - mark all as seen
      completedUnseenMessages.forEach((msg) => {
        seenMessageIdsRef.current.add(msg.id);
      });
    } else if (completedUnseenMessages.length > 0) {
      // User is not at bottom - update unread count
      setUnreadCount(completedUnseenMessages.length);
    }
  }, [enabled, isInitialized, messages]);

  // Watch input area for size changes and track height (but don't auto-scroll)
  useEffect(() => {
    if (!enabled) return;
    const input = inputRef.current;
    if (!input) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        setInputHeight(height);
        // Only scroll if at bottom
        if (isAtBottomRef.current) {
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    });

    resizeObserver.observe(input);

    return () => resizeObserver.disconnect();
  }, [enabled, scrollToBottom]);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    inputRef: inputRef as React.RefObject<HTMLDivElement>,
    scrollToBottom,
    isAtBottom,
    inputHeight,
    unreadCount,
    clearUnread,
    onUserMessage,
  };
}
