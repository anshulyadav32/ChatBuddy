import { useState, useEffect } from 'react';
import { supabase, Message } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!chatId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, username, full_name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(id, username, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    if (!user || !content.trim()) return;

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
      message_type: messageType,
    });

    if (error) {
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