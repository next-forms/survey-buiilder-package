import { useEffect, useSyncExternalStore } from "react";

// Singleton dark mode store - shared across all components
// This avoids creating multiple MutationObservers for each edge/node
let isDark = typeof document !== 'undefined'
  ? document.documentElement.classList.contains('dark')
  : false;

const listeners = new Set<() => void>();

// Subscribe to the store
const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// Get current snapshot
const getSnapshot = () => isDark;

// Server snapshot for SSR
const getServerSnapshot = () => false;

// Notify all listeners when dark mode changes
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Initialize the MutationObserver once
let observerInitialized = false;

const initializeObserver = () => {
  if (observerInitialized || typeof document === 'undefined') return;
  observerInitialized = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'class') {
        const newIsDark = document.documentElement.classList.contains('dark');
        if (newIsDark !== isDark) {
          isDark = newIsDark;
          notifyListeners();
        }
        break;
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
};

/**
 * Shared dark mode hook using useSyncExternalStore
 * This ensures only ONE MutationObserver is created for the entire application
 * instead of one per edge/node component
 */
export const useDarkMode = (): boolean => {
  // Initialize observer on first hook call
  useEffect(() => {
    initializeObserver();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
