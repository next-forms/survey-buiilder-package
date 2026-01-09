import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className }) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -4 },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md w-fit',
        className
      )}
    >
      <motion.div
        className="flex items-center gap-1"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
            variants={dotVariants}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: i * 0.15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};
