import { useState, useEffect } from 'react';
import { prisma, MessageWithSender, MessageType } from '../utils/prisma';
import { useAuth } from './useAuth';

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!chatId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const messageList = await prisma.message.findMany({
          where: { chatId },
          include: {
            sender: true
          },
          orderBy: { createdAt: 'asc' }
        });
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
        const messageList = await prisma.message.findMany({
          where: { chatId },
          include: {
            sender: true
          },
          orderBy: { createdAt: 'asc' }
        });
        setMessages(messageList);
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [chatId]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' | 'audio' = 'text'): Promise<void> => {
    if (!user || !content.trim()) return;

    try {
      const message = await prisma.message.create({
        data: {
          chatId,
          senderId: user.id,
          content: content.trim(),
          messageType: messageType.toUpperCase() as MessageType
        },
        include: {
          sender: true
        }
      });
      
      // Optimistically add the message to the local state
      setMessages((prev: MessageWithSender[]) => [...prev, message]);
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