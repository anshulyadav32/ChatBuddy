import { config } from './prisma';

// JWT utilities for client-side token handling
// Note: In a real app, JWT signing/verification should be done server-side

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class JWTUtils {
  // Simple base64 encoding/decoding for development
  // In production, use proper JWT library on server-side
  
  static encode(payload: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${encodedHeader}.${encodedPayload}.${config.jwtSecret}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static decode(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static isExpired(token: string): boolean {
    try {
      const payload = this.decode(token);
      return payload.exp && Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  static createToken(userId: string, email: string, expiresInHours: number = 24): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      userId,
      email,
      iat: now,
      exp: now + (expiresInHours * 60 * 60),
    };

    return this.encode(payload);
  }

  static refreshToken(token: string, expiresInHours: number = 24): string {
    const payload = this.decode(token);
    return this.createToken(payload.userId, payload.email, expiresInHours);
  }
}

// Password hashing utilities (for development)
// In production, use proper bcrypt on server-side
export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    // Simple hash for development - use bcrypt in production
    const encoder = new TextEncoder();
    const data = encoder.encode(password + config.jwtSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hash(password);
    return hashedPassword === hash;
  }
}

// Email validation
export class EmailUtils {
  static generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  static generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Mock email sending for development
  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    console.log(`[MOCK EMAIL] Verification email sent to ${email}`);
    console.log(`[MOCK EMAIL] Verification link: https://your-app.com/verify?token=${token}`);
    
    // In production, integrate with email service like SendGrid, AWS SES, etc.
    return Promise.resolve();
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    console.log(`[MOCK EMAIL] Password reset email sent to ${email}`);
    console.log(`[MOCK EMAIL] Reset link: https://your-app.com/reset?token=${token}`);
    
    // In production, integrate with email service
    return Promise.resolve();
  }
}

// Session management
export class SessionManager {
  private static readonly SESSION_KEY = 'auth_session';
  private static readonly REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour in ms

  static async storeSession(token: string): Promise<void> {
    try {
      const sessionData = {
        token,
        timestamp: Date.now(),
      };
      
      // In React Native, we'll use AsyncStorage
      // This is just for type safety
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  static async getSession(): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const sessionStr = localStorage.getItem(this.SESSION_KEY);
        if (sessionStr) {
          const sessionData = JSON.parse(sessionStr);
          return sessionData.token;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.SESSION_KEY);
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  static shouldRefreshToken(token: string): boolean {
    try {
      const payload = JWTUtils.decode(token);
      const timeUntilExpiry = (payload.exp * 1000) - Date.now();
      return timeUntilExpiry < this.REFRESH_THRESHOLD;
    } catch {
      return true;
    }
  }
}

// Error handling
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;