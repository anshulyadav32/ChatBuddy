import { neon } from '@neondatabase/serverless';
import Constants from 'expo-constants';

// Get database URL from environment variables
const databaseUrl = Constants.expoConfig?.extra?.databaseUrl || process.env.EXPO_PUBLIC_DATABASE_URL;
const jwtSecret = Constants.expoConfig?.extra?.jwtSecret || process.env.EXPO_PUBLIC_JWT_SECRET;
const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

if (!databaseUrl) {
  console.warn('Database URL not found. Using mock data for development.');
}

// Create Neon database client (only if URL is available)
export const sql = databaseUrl ? neon(databaseUrl) : null;

// Configuration
export const config = {
  databaseUrl,
  jwtSecret: jwtSecret || 'default-jwt-secret-change-in-production',
  apiBaseUrl: apiBaseUrl || 'http://localhost:3001/api',
};

// Database types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  last_seen?: string;
  is_online?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  name?: string;
  is_group: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
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
  is_edited?: boolean;
  reply_to_id?: string;
  created_at: string;
  updated_at: string;
  sender?: Profile;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_used: string;
}

// Database helper functions
export class DatabaseAPI {
  // User operations
  static async createUser(email: string, passwordHash: string, username: string, fullName: string): Promise<User> {
    if (!sql) throw new Error('Database not configured');
    
    const [user] = await sql`
      INSERT INTO users (email, password_hash, email_verified)
      VALUES (${email}, ${passwordHash}, false)
      RETURNING *
    `;

    // Create profile
    await sql`
      INSERT INTO profiles (id, username, full_name)
      VALUES (${user.id}, ${username}, ${fullName})
    `;

    return user;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    if (!sql) return null;
    
    const [user] = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    
    return user || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    if (!sql) return null;
    
    const [user] = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    return user || null;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!sql) throw new Error('Database not configured');
    
    const setClause = Object.keys(updates)
      .map(key => `${key} = $${key}`)
      .join(', ');
    
    const [user] = await sql`
      UPDATE users 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return user;
  }

  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    if (!sql) return null;
    
    const [profile] = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;
    
    return profile || null;
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (!sql) throw new Error('Database not configured');
    
    const [profile] = await sql`
      UPDATE profiles 
      SET ${sql(updates)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `;
    
    return profile;
  }

  static async getAllProfiles(excludeUserId?: string): Promise<Profile[]> {
    if (!sql) return [];
    
    if (excludeUserId) {
      return await sql`
        SELECT * FROM profiles 
        WHERE id != ${excludeUserId}
        ORDER BY username
      `;
    }
    
    return await sql`
      SELECT * FROM profiles 
      ORDER BY username
    `;
  }

  // Chat operations
  static async createChat(isGroup: boolean, name?: string): Promise<Chat> {
    if (!sql) throw new Error('Database not configured');
    
    const [chat] = await sql`
      INSERT INTO chats (is_group, name)
      VALUES (${isGroup}, ${name || null})
      RETURNING *
    `;
    
    return chat;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    if (!sql) return [];
    
    return await sql`
      SELECT c.* FROM chats c
      JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE cp.user_id = ${userId}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `;
  }

  static async addChatParticipant(chatId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<ChatParticipant> {
    if (!sql) throw new Error('Database not configured');
    
    const [participant] = await sql`
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES (${chatId}, ${userId}, ${role})
      RETURNING *
    `;
    
    return participant;
  }

  static async findDirectChat(userId1: string, userId2: string): Promise<Chat | null> {
    if (!sql) return null;
    
    const [chat] = await sql`
      SELECT c.* FROM chats c
      WHERE c.is_group = false
      AND EXISTS (
        SELECT 1 FROM chat_participants cp1 
        WHERE cp1.chat_id = c.id AND cp1.user_id = ${userId1}
      )
      AND EXISTS (
        SELECT 1 FROM chat_participants cp2 
        WHERE cp2.chat_id = c.id AND cp2.user_id = ${userId2}
      )
      AND (
        SELECT COUNT(*) FROM chat_participants cp 
        WHERE cp.chat_id = c.id
      ) = 2
    `;
    
    return chat || null;
  }

  // Message operations
  static async getChatMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    if (!sql) return [];
    
    return await sql`
      SELECT 
        m.*,
        json_build_object(
          'id', p.id,
          'username', p.username,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url
        ) as sender
      FROM messages m
      JOIN profiles p ON m.sender_id = p.id
      WHERE m.chat_id = ${chatId}
      ORDER BY m.created_at ASC
      LIMIT ${limit}
    `;
  }

  static async createMessage(chatId: string, senderId: string, content: string, messageType: string = 'text'): Promise<Message> {
    if (!sql) throw new Error('Database not configured');
    
    const [message] = await sql`
      INSERT INTO messages (chat_id, sender_id, content, message_type)
      VALUES (${chatId}, ${senderId}, ${content}, ${messageType})
      RETURNING *
    `;
    
    return message;
  }

  // Session operations
  static async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<UserSession> {
    if (!sql) throw new Error('Database not configured');
    
    const [session] = await sql`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
      RETURNING *
    `;
    
    return session;
  }

  static async getValidSession(tokenHash: string): Promise<UserSession | null> {
    if (!sql) return null;
    
    const [session] = await sql`
      SELECT * FROM user_sessions 
      WHERE token_hash = ${tokenHash} 
      AND expires_at > NOW()
    `;
    
    return session || null;
  }

  static async deleteSession(tokenHash: string): Promise<void> {
    if (!sql) return;
    
    await sql`
      DELETE FROM user_sessions 
      WHERE token_hash = ${tokenHash}
    `;
  }

  static async cleanupExpiredSessions(): Promise<void> {
    if (!sql) return;
    
    await sql`
      DELETE FROM user_sessions 
      WHERE expires_at < NOW()
    `;
  }

  // Utility functions
  static async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    if (!sql) return;
    
    await sql`
      SELECT update_user_online_status(${userId}::uuid, ${isOnline})
    `;
  }
}

// Mock database for development
export class MockDatabase {
  private static users: Map<string, User> = new Map();
  private static profiles: Map<string, Profile> = new Map();
  private static chats: Map<string, Chat> = new Map();
  private static messages: Map<string, Message[]> = new Map();
  private static participants: Map<string, ChatParticipant[]> = new Map();

  static async createUser(email: string, passwordHash: string, username: string, fullName: string): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const user: User = {
      id,
      email,
      password_hash: passwordHash,
      email_verified: false,
      created_at: now,
      updated_at: now,
    };

    const profile: Profile = {
      id,
      username,
      full_name: fullName,
      created_at: now,
      updated_at: now,
    };

    this.users.set(email, user);
    this.profiles.set(id, profile);

    return user;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return this.users.get(email) || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  static async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) || null;
  }

  static async getAllProfiles(excludeUserId?: string): Promise<Profile[]> {
    const profiles = Array.from(this.profiles.values());
    return excludeUserId ? profiles.filter(p => p.id !== excludeUserId) : profiles;
  }

  static async getUserChats(userId: string): Promise<Chat[]> {
    const userChats: Chat[] = [];
    
    for (const [chatId, participants] of this.participants.entries()) {
      if (participants.some(p => p.user_id === userId)) {
        const chat = this.chats.get(chatId);
        if (chat) userChats.push(chat);
      }
    }
    
    return userChats.sort((a, b) => 
      new Date(b.last_message_at || b.created_at).getTime() - 
      new Date(a.last_message_at || a.created_at).getTime()
    );
  }

  static async createChat(isGroup: boolean, name?: string): Promise<Chat> {
    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const chat: Chat = {
      id,
      name,
      is_group: isGroup,
      created_at: now,
      updated_at: now,
    };

    this.chats.set(id, chat);
    this.participants.set(id, []);
    this.messages.set(id, []);

    return chat;
  }

  static async addChatParticipant(chatId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<ChatParticipant> {
    const participant: ChatParticipant = {
      id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chat_id: chatId,
      user_id: userId,
      joined_at: new Date().toISOString(),
      role,
    };

    const participants = this.participants.get(chatId) || [];
    participants.push(participant);
    this.participants.set(chatId, participants);

    return participant;
  }

  static async findDirectChat(userId1: string, userId2: string): Promise<Chat | null> {
    for (const [chatId, participants] of this.participants.entries()) {
      const chat = this.chats.get(chatId);
      if (chat && !chat.is_group && participants.length === 2) {
        const userIds = participants.map(p => p.user_id);
        if (userIds.includes(userId1) && userIds.includes(userId2)) {
          return chat;
        }
      }
    }
    return null;
  }

  static async getChatMessages(chatId: string): Promise<Message[]> {
    return this.messages.get(chatId) || [];
  }

  static async createMessage(chatId: string, senderId: string, content: string, messageType: string = 'text'): Promise<Message> {
    const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const message: Message = {
      id,
      chat_id: chatId,
      sender_id: senderId,
      content,
      message_type: messageType as any,
      created_at: now,
      updated_at: now,
    };

    // Add sender profile
    const profile = this.profiles.get(senderId);
    if (profile) {
      message.sender = profile;
    }

    const messages = this.messages.get(chatId) || [];
    messages.push(message);
    this.messages.set(chatId, messages);

    // Update chat last message
    const chat = this.chats.get(chatId);
    if (chat) {
      chat.last_message = content;
      chat.last_message_at = now;
      this.chats.set(chatId, chat);
    }

    return message;
  }
}

// Use appropriate database based on configuration
export const db = sql ? DatabaseAPI : MockDatabase;