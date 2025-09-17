import { neon } from '@neondatabase/serverless';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get database URL from environment variables
const databaseUrl = Constants.expoConfig?.extra?.databaseUrl || process.env.EXPO_PUBLIC_DATABASE_URL;
const jwtSecret = Constants.expoConfig?.extra?.jwtSecret || process.env.EXPO_PUBLIC_JWT_SECRET;
const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Missing database URL. Please check your .env.local file and ensure EXPO_PUBLIC_DATABASE_URL is set.'
  );
}

if (!jwtSecret) {
  throw new Error(
    'Missing JWT secret. Please check your .env.local file and ensure EXPO_PUBLIC_JWT_SECRET is set.'
  );
}

// Create Neon database client
export const sql = neon(databaseUrl);

// Configuration
export const config = {
  databaseUrl,
  jwtSecret,
  apiBaseUrl: apiBaseUrl || 'http://localhost:3001/api',
};

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      chats: {
        Row: Chat;
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Chat, 'id' | 'created_at'>>;
      };
      chat_participants: {
        Row: ChatParticipant;
        Insert: Omit<ChatParticipant, 'id' | 'joined_at'>;
        Update: Partial<Omit<ChatParticipant, 'id' | 'chat_id' | 'user_id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Message, 'id' | 'chat_id' | 'sender_id' | 'created_at'>>;
      };
    };
  };
}

// Entity interfaces
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_seen?: string;
  is_online?: boolean;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  avatar_url?: string;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
  role: 'admin' | 'member';
  is_muted?: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  created_at: string;
  updated_at: string;
  is_edited?: boolean;
  reply_to_id?: string;
  sender?: Profile;
}

// Auth helper functions
export const authHelpers = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return supabase.auth.getUser().then(({ data: { user } }) => !!user);
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  // Sign out and clear session
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Refresh session
  refreshSession: () => {
    return supabase.auth.refreshSession();
  },
};

// Database helper functions
export const dbHelpers = {
  // Get user profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's chats
  getUserChats: async (userId: string) => {
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
          last_message_at,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('chats(last_message_at)', { ascending: false });

    if (error) throw error;
    return data?.map(item => item.chats).filter(Boolean) || [];
  },

  // Get chat messages
  getChatMessages: async (chatId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(id, username, full_name, avatar_url)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  },

  // Send message
  sendMessage: async (chatId: string, senderId: string, content: string, messageType: string = 'text') => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content.trim(),
        message_type: messageType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Real-time subscription helpers
export const realtimeHelpers = {
  // Subscribe to chat messages
  subscribeToMessages: (chatId: string, callback: (message: Message) => void) => {
    return supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
  },

  // Subscribe to chat updates
  subscribeToChats: (userId: string, callback: (chat: Chat) => void) => {
    return supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload) => callback(payload.new as Chat)
      )
      .subscribe();
  },

  // Subscribe to user presence
  subscribeToPresence: (chatId: string, userId: string) => {
    return supabase.channel(`presence:${chatId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });
  },
};

export default supabase;