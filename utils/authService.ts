import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import type { User, Profile, UserSession } from './prisma';

// Types
export interface AuthUser extends User {
  profile: Profile | null;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthSession;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName?: string;
}

export class AuthService {
  private static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'your-jwt-secret-key';
  private static readonly JWT_EXPIRES_IN: string = '7d';

  // Sign up new user
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, username, fullName } = data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Check if username is taken
      const existingProfile = await prisma.profile.findUnique({
        where: { username },
      });

      if (existingProfile) {
        return {
          success: false,
          error: 'Username is already taken',
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user and profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            emailVerified: false,
          },
        });

        // Create profile
        const profile = await tx.profile.create({
          data: {
            id: user.id,
            username,
            fullName,
            isOnline: true,
          },
        });

        return { user, profile };
      });

      // Generate JWT token
      const token = this.generateToken(result.user.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store session
      await prisma.userSession.create({
        data: {
          userId: result.user.id,
          tokenHash: await bcrypt.hash(token, 10),
          expiresAt,
        },
      });

      return {
        success: true,
        data: {
          user: { ...result.user, profile: result.profile },
          token,
          expiresAt,
        },
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'Failed to create account',
      };
    }
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user with profile
      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Generate JWT token
      const token = this.generateToken(user.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store session
      await prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: await bcrypt.hash(token, 10),
          expiresAt,
        },
      });

      // Update user's online status
      if (user.profile) {
        await prisma.profile.update({
          where: { id: user.id },
          data: { 
            isOnline: true,
            lastSeen: new Date(),
          },
        });
      }

      return {
        success: true,
        data: {
          user,
          token,
          expiresAt,
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'Failed to sign in',
      };
    }
  }

  // Verify JWT token
  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { profile: true },
      });

      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Sign out user
  static async signOut(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      // Remove all sessions for this user
      await prisma.userSession.deleteMany({
        where: { userId: decoded.userId },
      });

      // Update user's online status
      await prisma.profile.update({
        where: { id: decoded.userId },
        data: { 
          isOnline: false,
          lastSeen: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  }

  // Generate JWT token
  private static generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET as string,
      { expiresIn: this.JWT_EXPIRES_IN as string } as jwt.SignOptions
    );
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Clean expired sessions error:', error);
    }
  }

  // Send verification email (placeholder)
  static async sendVerificationEmail(email: string): Promise<boolean> {
    try {
      // TODO: Implement email verification
      console.log(`Verification email would be sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('Send verification email error:', error);
      return false;
    }
  }

  // Verify email with token (placeholder)
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      // TODO: Implement email verification
      console.log(`Email verification with token: ${token}`);
      return true;
    } catch (error) {
      console.error('Verify email error:', error);
      return false;
    }
  }

  // Reset password (placeholder)
  static async resetPassword(email: string): Promise<boolean> {
    try {
      // TODO: Implement password reset
      console.log(`Password reset would be sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }
}