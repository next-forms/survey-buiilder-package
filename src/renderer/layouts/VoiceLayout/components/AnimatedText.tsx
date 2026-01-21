import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils';
import type { AnimatedTextProps } from '../types';

/**
 * AnimatedText Component
 *
 * Displays text with a typewriter-style animation, revealing
 * characters one by one for an engaging voice assistant experience.
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  speed = 30,
  onComplete,
  highlightKeywords = false,
  className,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);

  // Reset animation when text changes
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    currentIndexRef.current = 0;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [text]);

  // Animate text character by character
  useEffect(() => {
    if (currentIndexRef.current >= text.length) {
      if (!isComplete) {
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    timeoutRef.current = setTimeout(() => {
      currentIndexRef.current += 1;
      setDisplayedText(text.slice(0, currentIndexRef.current));
    }, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [displayedText, text, speed, onComplete, isComplete]);

  // Optional: highlight question words
  const processedText = useMemo(() => {
    if (!highlightKeywords || !displayedText) return displayedText;

    // Highlight question words and important terms
    const keywords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'would', 'could', 'should', 'please', 'name', 'email', 'phone'];
    let result = displayedText;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      result = result.replace(regex, `<mark class="bg-transparent text-blue-400 font-medium">$1</mark>`);
    });

    return result;
  }, [displayedText, highlightKeywords]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'text-xl md:text-2xl font-light leading-relaxed',
        'text-gray-800',
        className
      )}
    >
      {highlightKeywords ? (
        <span dangerouslySetInnerHTML={{ __html: processedText }} />
      ) : (
        displayedText
      )}

      {/* Blinking cursor while typing */}
      {!isComplete && (
        <motion.span
          className="inline-block w-0.5 h-6 bg-gray-600 ml-1 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </motion.div>
  );
};

/**
 * FadeInText Component
 *
 * Alternative animation that fades in text word by word
 * for a smoother, less distracting effect.
 */
export const FadeInText: React.FC<AnimatedTextProps> = ({
  text,
  speed = 100,
  onComplete,
  className,
}) => {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [text]);

  useEffect(() => {
    if (visibleCount >= words.length) {
      onComplete?.();
      return;
    }

    const timeout = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [visibleCount, words.length, speed, onComplete]);

  return (
    <div
      className={cn(
        'text-xl md:text-2xl font-light leading-relaxed',
        'text-gray-800',
        className
      )}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{
            opacity: index < visibleCount ? 1 : 0,
            y: index < visibleCount ? 0 : 5,
          }}
          transition={{ duration: 0.2 }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

AnimatedText.displayName = 'AnimatedText';
FadeInText.displayName = 'FadeInText';
