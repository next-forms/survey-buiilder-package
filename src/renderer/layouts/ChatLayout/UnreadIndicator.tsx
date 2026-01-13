import type { ThemeDefinition } from '../../../types';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface UnreadIndicatorProps {
  count: number;
  onClick: () => void;
  className?: string;
  theme?: ThemeDefinition;
  inputHeight?: number;
}

export const UnreadIndicator: React.FC<UnreadIndicatorProps> = ({
  count,
  onClick,
  className,
  theme,
  inputHeight = 80,
}) => {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute left-4 z-30"
          style={{ bottom: inputHeight + 16 }}
        >
          <button
            onClick={onClick}
            className={cn(
              'flex items-center gap-2 px-1 py-1',
              'hover:brightness-120 text-white',
              'rounded-full shadow-lg hover:shadow-xl',
              'transition-all duration-200',
              'cursor-pointer',
              'text-sm font-medium',
              className
            )}
            style={{
              backgroundColor:
                theme?.colors?.primary || 'oklch(62.3% 0.214 259.815)',
            }}
            aria-label={`${count} unread message${count > 1 ? 's' : ''}`}
          >
            {/* Badge with count */}
            <span className="min-w-[20px] h-5 flex items-center justify-center bg-white text-black rounded-full text-xs font-bold">
              {count > 99 ? '99+' : count}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

UnreadIndicator.displayName = 'UnreadIndicator';
