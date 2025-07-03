// Mobile navigation utilities and hooks
import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { MobileNavigationConfig } from '../types';

// Hook to detect mobile devices
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for mobile-specific navigation features
export function useMobileNavigation(
  config: MobileNavigationConfig = {},
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onDoubleTap?: () => void
) {
  const {
    enableSwipeNavigation = true,
    enableDoubleTapToGoBack = true,
    showMobileBackButton = true,
    preventBrowserBack = true,
    swipeThreshold = 50
  } = config;

  const isMobile = useIsMobile();
  const [lastTap, setLastTap] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Detect swipe gestures
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableSwipeNavigation || !isMobile) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  }, [enableSwipeNavigation, isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enableSwipeNavigation || !isMobile) return;
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, [enableSwipeNavigation, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!enableSwipeNavigation || !isMobile || !touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Only trigger if horizontal swipe is dominant and exceeds threshold
    if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
      if (deltaX > 0) {
        // Swiped left (next)
        onSwipeLeft?.();
      } else {
        // Swiped right (previous)
        onSwipeRight?.();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [enableSwipeNavigation, isMobile, touchStart, touchEnd, swipeThreshold, onSwipeLeft, onSwipeRight]);

  // Handle double tap
  const handleDoubleTap = useCallback((e: TouchEvent) => {
    if (!enableDoubleTapToGoBack || !isMobile) return;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      onDoubleTap?.();
    }

    setLastTap(currentTime);
  }, [enableDoubleTapToGoBack, isMobile, lastTap, onDoubleTap]);

  // Handle browser back button on mobile
  useEffect(() => {
    if (!isMobile || !preventBrowserBack) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Custom logic can be handled by the parent component
      // This just prevents the default browser back behavior
    };

    // Add a dummy state to capture back button presses
    window.history.pushState({ preventBack: true }, '');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMobile, preventBrowserBack]);

  // Add touch event listeners
  useEffect(() => {
    if (!isMobile) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    if (enableDoubleTapToGoBack) {
      document.addEventListener('touchend', handleDoubleTap, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (enableDoubleTapToGoBack) {
        document.removeEventListener('touchend', handleDoubleTap);
      }
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, handleDoubleTap, enableDoubleTapToGoBack]);

  return {
    isMobile,
    showMobileBackButton: isMobile && showMobileBackButton,
    supportedGestures: {
      swipe: enableSwipeNavigation && isMobile,
      doubleTap: enableDoubleTapToGoBack && isMobile,
    }
  };
}

// Component for mobile-specific navigation hints
export function MobileNavigationHints({ 
  showSwipeHint = true, 
  showDoubleTapHint = true,
  className = "" 
}: {
  showSwipeHint?: boolean;
  showDoubleTapHint?: boolean;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const [showHints, setShowHints] = useState(true);

  useEffect(() => {
    // Auto-hide hints after 5 seconds
    const timer = setTimeout(() => setShowHints(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isMobile || !showHints) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 bg-black/80 text-white text-sm p-3 rounded-lg z-50 ${className}`}>
      <div className="flex flex-col space-y-1">
        {showSwipeHint && (
          <div className="flex items-center">
            <span className="mr-2">👆</span>
            Swipe left/right to navigate
          </div>
        )}
        {showDoubleTapHint && (
          <div className="flex items-center">
            <span className="mr-2">👆👆</span>
            Double tap to go back
          </div>
        )}
      </div>
      <button 
        onClick={() => setShowHints(false)}
        className="absolute top-1 right-2 text-white/70 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
