import { useState, useEffect } from 'react';
import { db, Chat, Profile } from '../utils/database';
import { useAuth } from './useAuth';

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch user's chats
    const fetchChats = async () => {
      try {
        const chatList = await db.getUserChats(user.id);
        setChats(chatList);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();

    // Set up polling for real-time updates (replace with WebSocket in production)
    const interval = setInterval(fetchChats, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const createChat = async (participantIds: string[], isGroup: boolean = false, name?: string) => {
    if (!user) return null;

    try {
      // Create the chat
      const chat = await db.createChat(isGroup, name);

      // Add participants (including current user)
      const allParticipants = [user.id, ...participantIds];
      
      for (const userId of allParticipants) {
        const role = userId === user.id ? 'admin' : 'member';
        await db.addChatParticipant(chat.id, userId, role);
      }

      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const findOrCreateDirectChat = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if a direct chat already exists between these users
      const existingChat = await db.findDirectChat(user.id, otherUserId);

      if (existingChat) {
        return existingChat;
      }

      // Create new direct chat
      return await createChat([otherUserId], false);
    } catch (error) {
      console.error('Error finding or creating direct chat:', error);
      throw error;
    }
  };

  return {
    chats,
    loading,
    createChat,
    findOrCreateDirectChat,
  };
};