import { useRef, useCallback, useEffect, useState } from 'react';

export interface UseAutoScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: (smooth?: boolean) => void;
  isAtBottom: boolean;
}

export function useAutoScroll(enabled: boolean = true): UseAutoScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Check if user is at bottom of scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const threshold = 50; // pixels from bottom to consider "at bottom"
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Auto-scroll when enabled and at bottom
  useEffect(() => {
    if (enabled && isAtBottom) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [enabled, isAtBottom, scrollToBottom]);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    scrollToBottom,
    isAtBottom,
  };
}
