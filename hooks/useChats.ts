import { useState, useEffect } from 'react';
import { prisma, Chat, Profile } from '../utils/prisma';
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
        const chatList = await prisma.chat.findMany({
          where: {
            participants: {
              some: {
                userId: user.id
              }
            }
          },
          include: {
            participants: {
              include: {
                user: true
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        });
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
      // Create the chat with participants
      const allParticipants = [user.id, ...participantIds];
      
      const chat = await prisma.chat.create({
        data: {
          isGroup,
          name,
          participants: {
            create: allParticipants.map((userId: string) => ({
              userId,
              role: userId === user.id ? 'ADMIN' as const : 'MEMBER' as const
            }))
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

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
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: [user.id, otherUserId]
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

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