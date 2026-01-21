'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { useSurveyForm } from '../../../context/SurveyFormContext';
import { getSurveyPages, detectSurveyMode } from '../../../utils/surveyUtils';
import type { BlockData } from '../../../types';
import type {
  VoiceLayoutProps,
  VoiceCustomData,
  VoiceCommand,
  InputMode,
  VoiceLayoutMode,
} from './types';
import { classifyQuestion, matchVoiceToOption, hasBlockOptions } from './QuestionClassifier';
import { useVoiceValidation } from './hooks/useVoiceValidation';
import { useVoiceSession } from './hooks/useVoiceSession';
import { VoiceOrb } from './components/VoiceOrb';
import { OrbScreen } from './components/OrbScreen';
import { InputScreen } from './components/InputScreen';
import type { AIHandler, AIHandlerContext, AIHandlerResponse } from '../ChatLayout/types';

// Read-only block types (content only, no input required)
const READ_ONLY_BLOCK_TYPES = [
  'markdown',
  'html',
  'heading',
  'divider',
  'spacer',
  'image',
];

// Helper to check if a block is read-only
const isReadOnlyBlock = (block: BlockData): boolean => {
  return (
    READ_ONLY_BLOCK_TYPES.includes(block.type) ||
    (!block.fieldName && !block.name)
  );
};

// Helper to get display content from read-only blocks
const getReadOnlyContent = (block: BlockData): string => {
  if (block.type === 'markdown') {
    return block.text || block.content || '';
  }
  if (block.type === 'html') {
    const htmlContent = block.html || block.content || '';
    const textContent = htmlContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textContent || '[HTML Content]';
  }
  if (block.type === 'heading') {
    return block.text || block.label || '';
  }
  if (block.type === 'image') {
    return block.alt || block.label || '[Image]';
  }
  return block.label || block.text || '[Content Block]';
};

/**
 * Default AI handler that uses the chat-survey API
 */
const defaultAIHandler: AIHandler = async (context: AIHandlerContext): Promise<AIHandlerResponse> => {
  try {
    const response = await fetch('/api/chat-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalQuestion: context.block.label || context.block.name,
        blockType: context.block.type,
        options: getBlockOptions(context.block),
        questionNumber: context.currentQuestionIndex + 1,
        totalQuestions: context.totalQuestions,
        previousResponses: context.previousResponses,
        conversationHistory: context.conversationHistory
          .filter((m) => !m.isLoading)
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    return {
      conversationalQuestion: data.question || context.block.label || 'Please answer this question',
    };
  } catch (error) {
    console.error('AI handler error:', error);
    return {
      conversationalQuestion: context.block.label || context.block.name || 'Please answer this question',
    };
  }
};

/**
 * Helper to extract options from block
 */
function getBlockOptions(block: BlockData): Array<{ label: string; value: any }> {
  if (block.options && Array.isArray(block.options)) {
    return block.options.map((opt: any) => ({
      label: opt.label || String(opt.value || opt),
      value: opt.value ?? opt,
    }));
  }
  if (block.items && Array.isArray(block.items)) {
    return (block.items as any[]).map((item) => ({
      label: item.label || String(item.value || item),
      value: item.value ?? item,
    }));
  }
  if (block.labels && Array.isArray(block.labels)) {
    const values = block.values || block.labels;
    return block.labels.map((label, i) => ({
      label: String(label),
      value: values?.[i] ?? label,
    }));
  }
  return [];
}

/**
 * VoiceLayout Component
 *
 * A full-screen immersive voice survey experience with two distinct modes:
 * - AI Speaking Mode (OrbScreen): Full-screen orb with animated text
 * - User Input Mode (InputScreen): Block renderer for user responses
 */
export const VoiceLayout: React.FC<VoiceLayoutProps> = ({
  welcomeMessage: propWelcomeMessage,
  completionMessage: propCompletionMessage,
  autoListen: propAutoListen,
  containerClassName,
  orbStyle: propOrbStyle,
}) => {
  const {
    currentPage,
    currentBlockIndex,
    values,
    setValue,
    errors,
    goToNextBlock,
    goToPreviousBlock,
    isSubmitting,
    theme,
    surveyData,
    customData,
    getVisibleBlocks,
    getTotalVisibleSteps,
    getCurrentStepPosition,
  } = useSurveyForm();

  // Voice configuration from customData
  const voiceCustomData = customData as (VoiceCustomData & {
    orbStyle?: 'pulse' | 'wave' | 'glow' | 'minimal' | 'breathe';
    aiHandler?: AIHandler;
    typingDelay?: number;
  }) | undefined;

  // Resolve props with customData fallbacks
  const welcomeMessage =
    propWelcomeMessage ||
    voiceCustomData?.welcomeMessage ||
    "Hi! I'm here to help you complete this survey. Let's get started.";
  const completionMessage =
    propCompletionMessage ||
    voiceCustomData?.completionMessage ||
    'Thank you for completing the survey!';
  const autoListen = propAutoListen ?? voiceCustomData?.autoListen ?? true;
  // Note: silenceTimeout and maxListenTime are passed through customData to useVoiceSession
  const orbStyle = propOrbStyle ?? voiceCustomData?.orbStyle ?? 'breathe';
  const aiHandler = voiceCustomData?.aiHandler || defaultAIHandler;
  const typingDelay = voiceCustomData?.typingDelay ?? 300;

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<VoiceLayoutMode>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentInputMode, setCurrentInputMode] = useState<InputMode>('hybrid');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<{
    values: string[];
    labels: string[];
  } | null>(null);

  // Refs
  const askedBlocksRef = useRef<Set<string>>(new Set());
  const lastQuestionRef = useRef<string>('');
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Refs for voice session functions (to break circular dependency)
  const speakRef = useRef<(text: string) => Promise<void>>(() => Promise.resolve());
  const stopListeningRef = useRef<() => void>(() => {});
  const switchToVisualRef = useRef<() => void>(() => {});

  // Voice validation hook for AI-powered answer matching
  const { validateAnswer, resetMultiSelectState } = useVoiceValidation();

  // Get current block info
  const surveyMode = detectSurveyMode(surveyData.rootNode);
  const pages = getSurveyPages(surveyData.rootNode, surveyMode);
  const currentPageBlocks = currentPage < pages.length ? pages[currentPage] : [];
  const visibleBlocks = getVisibleBlocks(currentPageBlocks);
  const currentBlock = visibleBlocks[currentBlockIndex] as BlockData | undefined;

  // Progress
  const totalQuestions = getTotalVisibleSteps?.() ?? pages.reduce(
    (acc, page) => acc + getVisibleBlocks(page).length,
    0
  );
  const currentQuestionIndex = getCurrentStepPosition?.() ?? 0;

  /**
   * Handle voice command
   */
  const handleVoiceCommand = useCallback(
    (command: VoiceCommand) => {
      switch (command.type) {
        case 'navigate':
          if (command.payload?.direction === 'back') {
            goToPreviousBlock();
            setLayoutMode('ai_speaking');
          }
          break;
        case 'repeat':
          if (lastQuestionRef.current) {
            speakRef.current(lastQuestionRef.current);
            setLayoutMode('ai_speaking');
          }
          break;
        case 'skip':
          if (currentBlock && !currentBlock.required) {
            goToNextBlock();
            setLayoutMode('ai_speaking');
          }
          break;
        case 'stop':
          switchToVisualRef.current();
          setLayoutMode('user_input');
          break;
        default:
          break;
      }

      if (voiceCustomData?.onVoiceCommand) {
        voiceCustomData.onVoiceCommand(command);
      }
    },
    [currentBlock, goToPreviousBlock, goToNextBlock, voiceCustomData]
  );

  /**
   * Handle transcript from voice input
   */
  const handleTranscript = useCallback(
    async (transcript: string, isFinal: boolean) => {
      if (!currentBlock || !isFinal) {
        if (voiceCustomData?.onTranscript) {
          voiceCustomData.onTranscript(transcript, isFinal);
        }
        return;
      }

      const fieldName = currentBlock.fieldName || currentBlock.name || '';
      const blockType = currentBlock.type.toLowerCase();

      // Check if this is an option-based block that needs AI validation
      const optionBasedBlocks = ['radio', 'select', 'checkbox', 'selectablebox', 'multiselect', 'dropdown'];
      const isOptionBlock = optionBasedBlocks.includes(blockType) && hasBlockOptions(currentBlock);

      if (isOptionBlock) {
        // Stop listening while we validate
        stopListeningRef.current();
        setLayoutMode('processing');

        try {
          // Use AI to validate the answer
          const result = await validateAnswer(
            transcript,
            currentBlock,
            awaitingConfirmation,
            pendingValidation?.values || []
          );

          if (result.suggestedAction === 'submit' && result.isValid) {
            // Valid answer - submit it
            const isMulti = currentBlock.multiSelect === true || blockType === 'checkbox';
            const finalValue = isMulti ? result.matchedValues : result.matchedValues[0];

            // Build a confirmation message
            const selectedLabels = result.matchedOptions.map(o => o.label).join(', ');
            conversationHistoryRef.current.push({ role: 'user', content: selectedLabels });

            setValue(fieldName, finalValue);
            setAwaitingConfirmation(false);
            setPendingValidation(null);
            resetMultiSelectState();

            setTimeout(() => {
              goToNextBlock({ [fieldName]: finalValue });
              setLayoutMode('ai_speaking');
            }, 300);
            return;
          }

          if (result.suggestedAction === 'confirm' && result.needsConfirmation) {
            // Need confirmation - speak the confirmation message
            // Merge with existing pending values, using Set to avoid duplicates
            const newPendingValues = {
              values: [...new Set([...(pendingValidation?.values || []), ...result.matchedValues])],
              labels: [...new Set([...(pendingValidation?.labels || []), ...result.matchedOptions.map(o => o.label)])],
            };
            setPendingValidation(newPendingValues);
            setAwaitingConfirmation(true);

            // Update the form value so block renderer shows selections
            const isMulti = currentBlock.multiSelect === true || blockType === 'checkbox';
            if (isMulti) {
              setValue(fieldName, newPendingValues.values);
            }

            // Show what was just added, not all selections
            const justAdded = result.matchedOptions.map(o => o.label).join(', ');
            const confirmMessage = result.confirmationMessage ||
              (newPendingValues.values.length > result.matchedValues.length
                ? `Added ${justAdded}. You now have ${newPendingValues.labels.join(', ')} selected. Would you like to add more, or say "done" to continue?`
                : `You selected ${justAdded}. Would you like to add more, or say "done" to continue?`);
            setCurrentQuestion(confirmMessage);
            conversationHistoryRef.current.push({ role: 'assistant', content: confirmMessage });
            setLayoutMode('ai_speaking');
            await speakRef.current(confirmMessage);
            return;
          }

          if (result.suggestedAction === 'add_more') {
            // User wants to add more to multi-select
            // Keep the existing pending values (result.matchedValues contains the previous selections)
            const newPendingValues = {
              values: [...new Set([...result.matchedValues])],
              labels: [...new Set([...result.matchedOptions.map(o => o.label)])],
            };
            setPendingValidation(newPendingValues);
            // Set to false so next voice input is treated as new option selection, not confirmation
            setAwaitingConfirmation(false);

            // Update the form value so block renderer shows already selected options
            setValue(fieldName, newPendingValues.values);

            const addMoreMessage = result.confirmationMessage ||
              `Which additional option would you like to add? Or say "done" to continue.`;
            setCurrentQuestion(addMoreMessage);
            conversationHistoryRef.current.push({ role: 'assistant', content: addMoreMessage });
            setLayoutMode('ai_speaking');
            await speakRef.current(addMoreMessage);
            return;
          }

          // Handle "done" / "finished" / "that's all" when user has pending selections
          if (result.suggestedAction === 'finish_multiselect' && pendingValidation && pendingValidation.values.length > 0) {
            // User is done selecting - submit the pending values
            const isMulti = currentBlock.multiSelect === true || blockType === 'checkbox';
            const finalValue = isMulti ? pendingValidation.values : pendingValidation.values[0];

            conversationHistoryRef.current.push({ role: 'user', content: pendingValidation.labels.join(', ') });
            setValue(fieldName, finalValue);
            setAwaitingConfirmation(false);
            setPendingValidation(null);
            resetMultiSelectState();

            setTimeout(() => {
              goToNextBlock({ [fieldName]: finalValue });
              setLayoutMode('ai_speaking');
            }, 300);
            return;
          }

          if (result.suggestedAction === 'reask' || !result.isValid) {
            // Invalid answer - reask
            const reaskMessage = result.invalidReason ||
              "I couldn't match your answer to any option. Please try again or select an option from the list.";
            setCurrentQuestion(reaskMessage);
            conversationHistoryRef.current.push({ role: 'assistant', content: reaskMessage });
            setLayoutMode('ai_speaking');
            await speakRef.current(reaskMessage);
            return;
          }
        } catch (error) {
          console.error('Voice validation error:', error);
          // Fallback to basic matching
          const match = matchVoiceToOption(transcript, currentBlock);
          if (match.matched) {
            conversationHistoryRef.current.push({ role: 'user', content: transcript });
            setValue(fieldName, match.value);
            setTimeout(() => {
              goToNextBlock({ [fieldName]: match.value });
              setLayoutMode('ai_speaking');
            }, 300);
            return;
          }
          // If fallback also fails, show error
          const errorMessage = "I'm having trouble understanding. Please try again or select an option directly.";
          setCurrentQuestion(errorMessage);
          setLayoutMode('ai_speaking');
          await speakRef.current(errorMessage);
          return;
        }
      }

      // Use transcript as value for text blocks
      conversationHistoryRef.current.push({ role: 'user', content: transcript });
      setValue(fieldName, transcript);
      stopListeningRef.current();

      setTimeout(() => {
        goToNextBlock({ [fieldName]: transcript });
        setLayoutMode('ai_speaking');
      }, 300);
    },
    [currentBlock, setValue, goToNextBlock, voiceCustomData, validateAnswer, awaitingConfirmation, pendingValidation, resetMultiSelectState]
  );

  // Voice session hook
  const {
    voiceState,
    sessionState,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    initSession,
    endSession,
    switchToVisual,
    switchToVoice,
    isListening,
    isSpeaking,
    volume,
  } = useVoiceSession(
    voiceCustomData?.sessionConfig || {},
    handleTranscript,
    handleVoiceCommand,
    voiceCustomData?.onStateChange
  );

  // Update refs with voice session functions
  useEffect(() => {
    speakRef.current = speak;
    stopListeningRef.current = stopListening;
    switchToVisualRef.current = switchToVisual;
  }, [speak, stopListening, switchToVisual]);

  /**
   * Ask the current question with AI rephrasing
   */
  const askQuestion = useCallback(
    async (block: BlockData) => {
      const blockId = block.uuid || block.fieldName || `block-${Date.now()}`;

      // Skip if already asked
      if (askedBlocksRef.current.has(blockId)) {
        return;
      }
      askedBlocksRef.current.add(blockId);

      // Handle read-only blocks
      if (isReadOnlyBlock(block)) {
        const content = getReadOnlyContent(block);
        if (content && content !== '[Content Block]') {
          setCurrentQuestion(content);
          await speak(content);
        }

        setTimeout(() => {
          goToNextBlock();
        }, 500);
        return;
      }

      // Classify the question
      const classification = classifyQuestion(block);
      setCurrentInputMode(classification.inputMode);

      // Show loading state
      setCurrentQuestion('');
      setLayoutMode('ai_speaking');

      try {
        // Wait briefly for typing effect
        await new Promise((resolve) => setTimeout(resolve, typingDelay));

        // Get AI rephrased question
        const chatMessages = conversationHistoryRef.current.map((m) => ({
          id: `msg-${Math.random()}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(),
        }));

        const response = await aiHandler({
          block,
          previousResponses: values,
          conversationHistory: chatMessages,
          currentQuestionIndex,
          totalQuestions,
        });

        const questionText = response.conversationalQuestion;
        lastQuestionRef.current = questionText;
        setCurrentQuestion(questionText);

        // Add to conversation history
        conversationHistoryRef.current.push({ role: 'assistant', content: questionText });

        // Speak the question
        await speak(questionText);

        // Transition to input mode after speaking completes
        // The speaking state change will trigger this
      } catch (error) {
        console.error('Error generating question:', error);
        const fallbackQuestion = block.label || block.name || 'Please answer this question';
        lastQuestionRef.current = fallbackQuestion;
        setCurrentQuestion(fallbackQuestion);
      }
    },
    [
      aiHandler,
      speak,
      values,
      currentQuestionIndex,
      totalQuestions,
      typingDelay,
      goToNextBlock,
    ]
  );

  /**
   * Handle visual input submit
   */
  const handleVisualSubmit = useCallback(
    (value: unknown) => {
      if (!currentBlock) return;

      const fieldName = currentBlock.fieldName || currentBlock.name || '';

      // Format display value for conversation history
      let displayValue = String(value);
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      }

      conversationHistoryRef.current.push({ role: 'user', content: displayValue });

      setValue(fieldName, value);
      setLayoutMode('ai_speaking');
      goToNextBlock({ [fieldName]: value });
    },
    [currentBlock, setValue, goToNextBlock]
  );

  /**
   * Handle visual input change
   */
  const handleVisualChange = useCallback(
    (value: unknown) => {
      if (!currentBlock) return;
      const fieldName = currentBlock.fieldName || currentBlock.name || '';
      setValue(fieldName, value);
    },
    [currentBlock, setValue]
  );

  /**
   * Handle voice input toggle from InputScreen
   */
  const handleVoiceInputToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      switchToVoice();
      startListening();
    }
  }, [isListening, stopListening, switchToVoice, startListening]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    goToPreviousBlock();
    askedBlocksRef.current.clear();
    setLayoutMode('ai_speaking');
  }, [goToPreviousBlock]);

  /**
   * Start the survey (user interaction required for TTS)
   */
  const handleStart = useCallback(async () => {
    await initSession(voiceCustomData?.sessionConfig);

    // Speak welcome message
    setCurrentQuestion(welcomeMessage);
    setLayoutMode('ai_speaking');
    conversationHistoryRef.current.push({ role: 'assistant', content: welcomeMessage });

    await speak(welcomeMessage);

    // Ask first question
    if (currentBlock) {
      askedBlocksRef.current.clear();
      askQuestion(currentBlock);
    }
  }, [initSession, voiceCustomData?.sessionConfig, welcomeMessage, speak, currentBlock, askQuestion]);

  /**
   * Handle skip speaking
   */
  const handleSkipSpeaking = useCallback(() => {
    stopSpeaking();
    setLayoutMode('user_input');
  }, [stopSpeaking]);

  // Initialize session on mount (but don't speak yet)
  useEffect(() => {
    initSession(voiceCustomData?.sessionConfig);

    return () => {
      endSession();
    };
  }, []);

  // Track speaking state for transitions
  const hasStartedSpeakingRef = useRef(false);
  const hasTransitionedRef = useRef(false);

  // Track when speaking starts
  useEffect(() => {
    if (isSpeaking && layoutMode === 'ai_speaking') {
      hasStartedSpeakingRef.current = true;
    }
  }, [isSpeaking, layoutMode]);

  // Reset transition flags when question changes
  useEffect(() => {
    hasTransitionedRef.current = false;
    hasStartedSpeakingRef.current = false;
  }, [currentQuestion]);

  // Transition to input mode when speaking finishes
  useEffect(() => {
    // Only transition if:
    // 1. We're in AI speaking mode
    // 2. Speaking has started AND now finished (isSpeaking went from true to false)
    // 3. We have a question and block
    // 4. We haven't already transitioned for this question
    if (
      layoutMode === 'ai_speaking' &&
      !isSpeaking &&
      hasStartedSpeakingRef.current &&
      currentQuestion &&
      currentBlock &&
      !hasTransitionedRef.current
    ) {
      hasTransitionedRef.current = true;

      // Small delay to allow animation to complete
      const timeout = setTimeout(() => {
        setLayoutMode('user_input');

        // Auto-start listening for voice-friendly questions (with additional guard)
        if (autoListen && currentInputMode !== 'visual' && !isListening) {
          // Longer delay to ensure UI is ready
          setTimeout(() => {
            // Double-check we're still in input mode before starting
            startListening();
          }, 500);
        }
      }, 600);

      return () => clearTimeout(timeout);
    }
  }, [isSpeaking, layoutMode, currentQuestion, currentBlock, autoListen, currentInputMode, isListening]);

  // Ask question when block changes
  useEffect(() => {
    if (currentBlock && layoutMode !== 'welcome' && layoutMode !== 'complete' && sessionState.isInitialized) {
      setLayoutMode('ai_speaking');
      askQuestion(currentBlock);
    }
  }, [currentBlock?.uuid, currentBlock?.fieldName, sessionState.isInitialized]);

  // Handle completion
  useEffect(() => {
    if (isSubmitting && layoutMode !== 'complete') {
      setLayoutMode('complete');
      setCurrentQuestion(completionMessage);
      conversationHistoryRef.current.push({ role: 'assistant', content: completionMessage });
      speak(completionMessage);
      endSession();
    }
  }, [isSubmitting, layoutMode, completionMessage, speak, endSession]);

  // Welcome Screen
  if (layoutMode === 'welcome') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center',
          'bg-gradient-to-b from-white via-gray-50 to-gray-100',
          containerClassName
        )}
      >
        {/* Subtle animated background */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl"
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-100/20 blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center px-6"
        >
          <VoiceOrb
            state="idle"
            theme={theme}
            style={orbStyle}
            size="xl"
            onClick={handleStart}
            className="mx-auto mb-8 cursor-pointer"
          />

          <h1 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
            Voice Survey
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-md">
            {welcomeMessage}
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className={cn(
              'px-8 py-4 rounded-full font-medium text-lg',
              'bg-blue-500 text-white hover:bg-blue-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'transition-colors duration-200'
            )}
          >
            Start Survey
          </motion.button>

          <p className="mt-6 text-sm text-gray-400">
            Tap the orb or button to begin
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // Completion Screen
  if (layoutMode === 'complete') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center',
          'bg-gradient-to-b from-white via-gray-50 to-gray-100',
          containerClassName
        )}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-light text-gray-800 mb-4">
            Survey Complete
          </h1>

          <p className="text-lg text-gray-600 max-w-md">
            {completionMessage}
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // Main survey flow
  return (
    <div className={cn('fixed inset-0', containerClassName)}>
      <AnimatePresence mode="wait">
        {layoutMode === 'ai_speaking' && (
          <OrbScreen
            key="orb-screen"
            questionText={currentQuestion}
            isSpeaking={isSpeaking}
            voiceState={voiceState.state}
            onSkip={handleSkipSpeaking}
            currentStep={currentQuestionIndex}
            totalSteps={totalQuestions}
            theme={theme}
            orbStyle={orbStyle}
            volume={volume}
          />
        )}

        {layoutMode === 'user_input' && currentBlock && (
          <InputScreen
            key="input-screen"
            block={currentBlock}
            questionText={currentQuestion}
            value={values[currentBlock.fieldName || currentBlock.name || '']}
            onChange={handleVisualChange}
            onSubmit={handleVisualSubmit}
            onVoiceInput={handleVoiceInputToggle}
            onBack={currentQuestionIndex > 0 ? handleBack : undefined}
            currentStep={currentQuestionIndex}
            totalSteps={totalQuestions}
            theme={theme}
            disabled={isSubmitting}
            error={errors[currentBlock.fieldName || currentBlock.name || '']}
            isListening={isListening}
            interimTranscript={sessionState.lastInterimTranscript}
          />
        )}

        {layoutMode === 'processing' && (
          <motion.div
            key="processing-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-gray-100"
          >
            <VoiceOrb
              state="processing"
              theme={theme}
              style={orbStyle}
              size="xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

VoiceLayout.displayName = 'VoiceLayout';
