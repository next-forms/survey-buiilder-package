// Mobile navigation utilities and hooks
import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { MobileNavigationHints, useIsMobile } from '../hooks/useMobileNavigation';
import { MobileNavigationConfig } from '../types';

// Enhanced mobile navigation context
export interface MobileNavigationContextType {
  isMobile: boolean;
  enableMobileGestures: boolean;
  gestureConfig: MobileNavigationConfig;
  updateGestureConfig: (config: Partial<MobileNavigationConfig>) => void;
}

export const MobileNavigationContext = React.createContext<MobileNavigationContextType>({
  isMobile: false,
  enableMobileGestures: false,
  gestureConfig: {},
  updateGestureConfig: () => {},
});

export function MobileNavigationProvider({ 
  children, 
  defaultConfig = {} 
}: {
  children: React.ReactNode;
  defaultConfig?: MobileNavigationConfig;
}) {
  const isMobile = useIsMobile();
  const [gestureConfig, setGestureConfig] = useState<MobileNavigationConfig>(defaultConfig);
  const [enableMobileGestures, setEnableMobileGestures] = useState(true);

  const updateGestureConfig = useCallback((config: Partial<MobileNavigationConfig>) => {
    setGestureConfig(prev => ({ ...prev, ...config }));
  }, []);

  return (
    <MobileNavigationContext.Provider value={{
      isMobile,
      enableMobileGestures,
      gestureConfig,
      updateGestureConfig,
    }}>
      {children}
    </MobileNavigationContext.Provider>
  );
}