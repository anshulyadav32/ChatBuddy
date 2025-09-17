import { useState, useEffect } from 'react';
import { db, Message } from '../utils/database';
import { useAuth } from './useAuth';

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!chatId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const messageList = await db.getChatMessages(chatId);
        setMessages(messageList);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up polling for real-time updates (replace with WebSocket in production)
    const interval = setInterval(async () => {
      try {
        const messageList = await db.getChatMessages(chatId);
        setMessages(messageList);
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [chatId]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' | 'audio' = 'text') => {
    if (!user || !content.trim()) return;

    try {
      const message = await db.createMessage(chatId, user.id, content.trim(), messageType);
      
      // Optimistically add the message to the local state
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
  };
};