import AsyncStorage from '@react-native-async-storage/async-storage';
import { sql, config } from './database';

// Types
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
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

export interface AuthSession {
  user: User;
  profile: Profile;
  token: string;
  expires_at: string;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthSession;
  error?: string;
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  PROFILE: 'auth_profile',
  REMEMBER_EMAIL: 'remember_email',
  REMEMBER_ME: 'remember_me',
};

// Auth API class
export class AuthAPI {
  private static baseUrl = config.apiBaseUrl;

  // Helper method to make API calls
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Authentication methods
  static async signUp(email: string, password: string, username: string, fullName: string): Promise<AuthResponse> {
    try {
      const data = await this.apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, username, full_name: fullName }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async signIn(email: string, password: string, rememberMe: boolean = true): Promise<AuthResponse> {
    try {
      const data = await this.apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.token) {
        await this.storeSession(data, rememberMe, email);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async signOut(): Promise<void> {
    try {
      await this.apiCall('/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      await this.clearSession();
    }
  }

  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      await this.apiCall('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      await this.apiCall('/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const data = await this.apiCall('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const data = await this.apiCall('/auth/refresh', { method: 'POST' });
      
      if (data.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Session management
  static async storeSession(session: AuthSession, rememberMe: boolean, email: string): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, session.token],
      [STORAGE_KEYS.USER, JSON.stringify(session.user)],
      [STORAGE_KEYS.PROFILE, JSON.stringify(session.profile)],
    ]);

    if (rememberMe) {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.REMEMBER_ME, 'true'],
        [STORAGE_KEYS.REMEMBER_EMAIL, email],
      ]);
    }
  }

  static async getStoredSession(): Promise<AuthSession | null> {
    try {
      const [token, userStr, profileStr] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PROFILE,
      ]);

      if (token[1] && userStr[1] && profileStr[1]) {
        return {
          token: token[1],
          user: JSON.parse(userStr[1]),
          profile: JSON.parse(profileStr[1]),
          expires_at: '', // Will be validated by server
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  static async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.REMEMBER_ME,
      STORAGE_KEYS.REMEMBER_EMAIL,
    ]);
  }

  static async getStoredEmail(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
  }

  static async isRememberMeEnabled(): Promise<boolean> {
    const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    return rememberMe === 'true';
  }

  // Validation helpers
  static validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  }

  static validatePassword(password: string): string {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }

  static validateUsername(username: string): string {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return '';
  }
}

// Mock API endpoints for development (replace with actual backend)
export class MockAuthAPI {
  private static users: Map<string, any> = new Map();
  private static sessions: Map<string, any> = new Map();

  static async signUp(email: string, password: string, username: string, fullName: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.users.has(email)) {
      return { success: false, error: 'User already exists' };
    }

    const user = {
      id: `user_${Date.now()}`,
      email,
      email_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const profile = {
      id: user.id,
      username,
      full_name: fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.set(email, { user, profile, password });

    const token = `token_${Date.now()}`;
    const session = {
      user,
      profile,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    this.sessions.set(token, session);

    return { success: true, data: session };
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const userData = this.users.get(email);
    if (!userData || userData.password !== password) {
      return { success: false, error: 'Invalid email or password' };
    }

    const token = `token_${Date.now()}`;
    const session = {
      user: userData.user,
      profile: userData.profile,
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    this.sessions.set(token, session);

    return { success: true, data: session };
  }

  static async signOut(): Promise<void> {
    // In a real implementation, invalidate the token on the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  static async resetPassword(email: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!this.users.has(email)) {
      return { success: false, error: 'User not found' };
    }

    // In a real implementation, send reset email
    return { success: true };
  }
}

// Use MockAuthAPI for development, replace with AuthAPI for production
export const authAPI = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development' ? MockAuthAPI : AuthAPI;