import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';
import { generateMessageId } from '../utils/defaultAIHandler';

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  getMessagesByBlockId: (blockId: string) => ChatMessage[];
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useChatMessages(initialMessages: ChatMessage[] = []): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
    const id = generateMessageId();
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const getMessagesByBlockId = useCallback(
    (blockId: string): ChatMessage[] => {
      return messages.filter((msg) => msg.blockId === blockId);
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    updateMessage,
    getMessagesByBlockId,
    clearMessages,
    setMessages,
  };
}
