import { useState, useEffect } from 'react';
import { supabase, Chat, Profile } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch user's chats
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats:chat_id (
            id,
            name,
            is_group,
            created_at,
            updated_at,
            last_message,
            last_message_at
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching chats:', error);
      } else {
        const chatList = data?.map(item => item.chats).filter(Boolean) || [];
        setChats(chatList);
      }
      setLoading(false);
    };

    fetchChats();

    // Subscribe to chat updates
    const subscription = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          fetchChats(); // Refetch chats on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createChat = async (participantIds: string[], isGroup: boolean = false, name?: string) => {
    if (!user) return null;

    // Create the chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        name,
        is_group: isGroup,
      })
      .select()
      .single();

    if (chatError) {
      console.error('Error creating chat:', chatError);
      throw chatError;
    }

    // Add participants (including current user)
    const allParticipants = [user.id, ...participantIds];
    const participants = allParticipants.map(userId => ({
      chat_id: chat.id,
      user_id: userId,
      role: userId === user.id ? 'admin' : 'member',
    }));

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      throw participantsError;
    }

    return chat;
  };

  const findOrCreateDirectChat = async (otherUserId: string) => {
    if (!user) return null;

    // Check if a direct chat already exists between these users
    const { data: existingChats } = await supabase
      .from('chat_participants')
      .select(`
        chat_id,
        chats:chat_id (
          id,
          is_group,
          chat_participants (user_id)
        )
      `)
      .eq('user_id', user.id);

    // Find a direct chat (not group) that has exactly 2 participants: current user and other user
    const directChat = existingChats?.find(item => {
      const chat = item.chats;
      if (!chat || chat.is_group) return false;
      
      const participantIds = chat.chat_participants.map(p => p.user_id);
      return participantIds.length === 2 && 
             participantIds.includes(user.id) && 
             participantIds.includes(otherUserId);
    });

    if (directChat) {
      return directChat.chats;
    }

    // Create new direct chat
    return await createChat([otherUserId], false);
  };

  return {
    chats,
    loading,
    createChat,
    findOrCreateDirectChat,
  };
};