// Web-compatible database abstraction layer
// This replaces direct Prisma usage for browser compatibility

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  lastSeen?: Date;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  content: string;
  messageType: MessageType;
  chatId: string;
  senderId: string;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  isDeleted: boolean;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  joinedAt: Date;
  role: string;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

// Mock data storage for web environment
class WebDatabaseStorage {
  private users: Map<string, User> = new Map();
  private profiles: Map<string, Profile> = new Map();
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private participants: Map<string, ChatParticipant> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create some mock users and profiles for demo
    const mockUser: User = {
      id: 'user-1',
      email: 'demo@example.com',
      passwordHash: '$2b$10$mockhashedpassword',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockProfile: Profile = {
      id: 'user-1',
      username: 'demo_user',
      fullName: 'Demo User',
      isOnline: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(mockUser.id, mockUser);
    this.profiles.set(mockProfile.id, mockProfile);
  }

  // User operations
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Profile operations
  async findProfileById(id: string): Promise<Profile | null> {
    return this.profiles.get(id) || null;
  }

  async findProfileByUsername(username: string): Promise<Profile | null> {
    for (const profile of this.profiles.values()) {
      if (profile.username === username) return profile;
    }
    return null;
  }

  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile | null> {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    
    const updatedProfile = { ...profile, ...data, updatedAt: new Date() };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async findManyProfiles(options?: { where?: any; take?: number }): Promise<Profile[]> {
    const profiles = Array.from(this.profiles.values());
    return options?.take ? profiles.slice(0, options.take) : profiles;
  }

  // Chat operations
  async createChat(data: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> {
    const chat: Chat = {
      ...data,
      id: `chat-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chats.set(chat.id, chat);
    return chat;
  }

  async findManyChats(options?: { where?: any; include?: any }): Promise<Chat[]> {
    return Array.from(this.chats.values());
  }

  // Message operations
  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const message: Message = {
      ...data,
      id: `msg-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };
    this.messages.set(message.id, message);
    return message;
  }

  async findManyMessages(options?: { where?: any; include?: any; orderBy?: any }): Promise<MessageWithSender[]> {
    const messages = Array.from(this.messages.values());
    return messages.map(msg => ({
      ...msg,
      sender: this.profiles.get(msg.senderId) || {
        id: msg.senderId,
        username: 'Unknown',
        isOnline: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
  }

  // Session operations
  async createSession(data: Omit<UserSession, 'id' | 'createdAt'>): Promise<UserSession> {
    const session: UserSession = {
      ...data,
      id: `session-${Date.now()}`,
      createdAt: new Date()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionByToken(token: string): Promise<UserSession | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async deleteManySessions(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
  }
}

// Create singleton instance
const webDb = new WebDatabaseStorage();

// Export database interface that matches Prisma's API
export const webDatabase = {
  user: {
    create: (data: { data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => 
      webDb.createUser(data.data),
    findUnique: (options: { where: { email?: string; id?: string } }) => {
      if (options.where.email) return webDb.findUserByEmail(options.where.email);
      if (options.where.id) return webDb.findUserById(options.where.id);
      return Promise.resolve(null);
    },
    update: (options: { where: { id: string }; data: Partial<User> }) =>
      webDb.updateUser(options.where.id, options.data)
  },
  
  profile: {
    findUnique: (options: { where: { id?: string; username?: string } }) => {
      if (options.where.id) return webDb.findProfileById(options.where.id);
      if (options.where.username) return webDb.findProfileByUsername(options.where.username);
      return Promise.resolve(null);
    },
    update: (options: { where: { id: string }; data: Partial<Profile> }) =>
      webDb.updateProfile(options.where.id, options.data),
    upsert: async (options: { where: { id: string }; create: any; update: any }) => {
      const existing = await webDb.findProfileById(options.where.id);
      if (existing) {
        return webDb.updateProfile(options.where.id, options.update);
      } else {
        const profile: Profile = {
          ...options.create,
          id: options.where.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        webDb.profiles.set(profile.id, profile);
        return profile;
      }
    },
    findMany: (options?: any) => webDb.findManyProfiles(options)
  },

  chat: {
    create: (data: { data: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'> }) =>
      webDb.createChat(data.data),
    findMany: (options?: any) => webDb.findManyChats(options),
    findFirst: async (options?: any) => {
      const chats = await webDb.findManyChats(options);
      return chats[0] || null;
    }
  },

  message: {
    create: (data: { data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> }) =>
      webDb.createMessage(data.data),
    findMany: (options?: any) => webDb.findManyMessages(options),
    update: async (options: { where: { id: string }; data: Partial<Message> }) => {
      const message = webDb.messages.get(options.where.id);
      if (!message) return null;
      const updated = { ...message, ...options.data, updatedAt: new Date() };
      webDb.messages.set(options.where.id, updated);
      return updated;
    },
    delete: async (options: { where: { id: string } }) => {
      const message = webDb.messages.get(options.where.id);
      if (message) {
        webDb.messages.delete(options.where.id);
        return message;
      }
      return null;
    }
  },

  userSession: {
    create: (data: { data: Omit<UserSession, 'id' | 'createdAt'> }) =>
      webDb.createSession(data.data),
    findFirst: (options: { where: { token?: string; userId?: string } }) => {
      if (options.where.token) return webDb.findSessionByToken(options.where.token);
      return Promise.resolve(null);
    },
    update: async (options: { where: { id: string }; data: Partial<UserSession> }) => {
      const session = webDb.sessions.get(options.where.id);
      if (!session) return null;
      const updated = { ...session, ...options.data };
      webDb.sessions.set(options.where.id, updated);
      return updated;
    },
    delete: (options: { where: { id: string } }) => {
      webDb.deleteSession(options.where.id);
      return Promise.resolve();
    },
    deleteMany: (options: { where: { userId: string } }) => {
      webDb.deleteManySessions(options.where.userId);
      return Promise.resolve();
    }
  },

  chatParticipant: {
    create: async (data: any) => {
      // Mock implementation
      return Promise.resolve({} as ChatParticipant);
    },
    count: async () => Promise.resolve(0)
  },

  $transaction: async (callback: any) => {
    // Simple mock transaction - just execute the callback
    return callback(webDatabase);
  },

  $disconnect: async () => {
    // No-op for web environment
    return Promise.resolve();
  }
};

// Export types and database instance
export { webDatabase as prisma };
export const db = webDatabase;