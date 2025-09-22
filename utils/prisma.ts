// Use web-compatible database layer instead of native Prisma client
import { 
  webDatabase as prismaClient,
  User,
  Profile,
  Chat,
  Message,
  UserSession,
  ChatParticipant,
  MessageType,
  ChatParticipantRole,
  MessageWithSender
} from './webDatabase';

export type {
  User,
  Profile,
  Chat,
  Message,
  UserSession,
  ChatParticipant,
  MessageType,
  MessageWithSender
};

// Export the web-compatible database instance
export const prisma = prismaClient;

// Export types for use in components
export type {
  User,
  Profile,
  Chat,
  ChatParticipant,
  Message,
  UserSession,
  ChatParticipantRole,
  MessageType,
};

// Enhanced types with relations
export type UserWithProfile = User & {
  profile: Profile | null;
};

export type ChatWithParticipants = Chat & {
  participants: (ChatParticipant & {
    user: UserWithProfile;
  })[];
};

export type MessageWithSender = Message & {
  sender: User & {
    profile: Profile | null;
  };
  replyTo?: Message | null;
};

export type ChatWithLastMessage = Chat & {
  messages: MessageWithSender[];
  participants: (ChatParticipant & {
    user: UserWithProfile;
  })[];
};

// Database operations class
export class PrismaDatabase {
  // User operations
  static async createUser(
    email: string,
    passwordHash: string,
    username: string,
    fullName?: string
  ): Promise<UserWithProfile> {
    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            username,
            fullName,
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }

  static async getUserByEmail(email: string): Promise<UserWithProfile | null> {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  static async getUserById(id: string): Promise<UserWithProfile | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async verifyEmail(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });
  }

  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    return await prisma.profile.findUnique({
      where: { id: userId },
    });
  }

  static async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    return await prisma.profile.update({
      where: { id: userId },
      data,
    });
  }

  static async getAllProfiles(excludeUserId?: string): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
      orderBy: { username: 'asc' },
    });
  }

  static async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<Profile> {
    return await prisma.profile.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: isOnline ? undefined : new Date(),
      },
    });
  }

  // Chat operations
  static async createChat(isGroup: boolean, name?: string): Promise<Chat> {
    return await prisma.chat.create({
      data: {
        isGroup,
        name,
      },
    });
  }

  static async getUserChats(userId: string): Promise<ChatWithLastMessage[]> {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          lastMessageAt: {
            sort: 'desc',
            nulls: 'last',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return chats;
  }

  static async addChatParticipant(
    chatId: string,
    userId: string,
    role: ChatParticipantRole = 'MEMBER'
  ): Promise<ChatParticipant> {
    return await prisma.chatParticipant.create({
      data: {
        chatId,
        userId,
        role,
      },
    });
  }

  static async findDirectChat(userId1: string, userId2: string): Promise<Chat | null> {
    const chat = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
        AND: [
          {
            participants: {
              some: {
                userId: userId1,
              },
            },
          },
          {
            participants: {
              some: {
                userId: userId2,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
    });

    // Ensure it's exactly a 2-person chat
    if (chat && chat.participants.length === 2) {
      return chat;
    }

    return null;
  }

  // Message operations
  static async getChatMessages(chatId: string, limit: number = 50): Promise<MessageWithSender[]> {
    return await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
        replyTo: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  static async createMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType: MessageType = 'TEXT'
  ): Promise<MessageWithSender> {
    // Create message and update chat's last message in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId,
          senderId,
          content,
          messageType,
        },
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Update chat's last message
      await tx.chat.update({
        where: { id: chatId },
        data: {
          lastMessage: content,
          lastMessageAt: message.createdAt,
        },
      });

      return message;
    });

    return result;
  }

  static async updateMessage(
    messageId: string,
    content: string
  ): Promise<MessageWithSender> {
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  static async deleteMessage(messageId: string): Promise<Message> {
    return await prisma.message.delete({
      where: { id: messageId },
    });
  }

  // Session operations
  static async createSession(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<UserSession> {
    return await prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  static async getValidSession(tokenHash: string): Promise<UserSession | null> {
    return await prisma.userSession.findFirst({
      where: {
        tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  static async updateSessionLastUsed(tokenHash: string): Promise<UserSession> {
    return await prisma.userSession.update({
      where: { tokenHash },
      data: {
        lastUsed: new Date(),
      },
    });
  }

  static async deleteSession(tokenHash: string): Promise<UserSession> {
    return await prisma.userSession.delete({
      where: { tokenHash },
    });
  }

  static async deleteUserSessions(userId: string): Promise<{ count: number }> {
    return await prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  static async cleanupExpiredSessions(): Promise<{ count: number }> {
    return await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Utility operations
  static async getUserStats(userId: string) {
    const [chatCount, messageCount] = await Promise.all([
      prisma.chatParticipant.count({
        where: { userId },
      }),
      prisma.message.count({
        where: { senderId: userId },
      }),
    ]);

    return {
      chatCount,
      messageCount,
    };
  }

  static async getChatStats(chatId: string) {
    const [participantCount, messageCount] = await Promise.all([
      prisma.chatParticipant.count({
        where: { chatId },
      }),
      prisma.message.count({
        where: { chatId },
      }),
    ]);

    return {
      participantCount,
      messageCount,
    };
  }

  // Search operations
  static async searchUsers(query: string, excludeUserId?: string): Promise<Profile[]> {
    return await prisma.profile.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                username: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                fullName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
          excludeUserId ? { id: { not: excludeUserId } } : {},
        ],
      },
      orderBy: {
        username: 'asc',
      },
      take: 20,
    });
  }

  static async searchMessages(chatId: string, query: string): Promise<MessageWithSender[]> {
    return await prisma.message.findMany({
      where: {
        chatId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }
}

// Configuration for backward compatibility
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
};

// Export the database instance
export const db = PrismaDatabase;

// Cleanup function for graceful shutdown
export async function disconnectPrisma() {
  await prisma.$disconnect();
}