import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthSession, AuthUser, SignUpData } from '../utils/authService';

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REMEMBER_EMAIL: 'remember_email',
  REMEMBER_ME: 'remember_me',
};

export const useAuth = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get stored token
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (storedToken) {
        // Verify token and get user data
        const userData = await AuthService.verifyToken(storedToken);
        
        if (userData) {
          const sessionData: AuthSession = {
            user: userData,
            token: storedToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          };
          
          setSession(sessionData);
          setUser(userData);
          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        } else {
          // Clear invalid session
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    setSession(null);
    setUser(null);
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const signUpData: SignUpData = { email, password, username, fullName };
    const result = await AuthService.signUp(signUpData);
    
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
      
      // Store token and user data
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.data.user));
    }

    return result;
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const result = await AuthService.signIn(email, password);
    
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
      
      // Store token and user data
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.data.user));
      
      // Store email and remember me preference
      if (rememberMe) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'false');
      }
    }

    return result;
  };

  const signOut = async () => {
    if (session?.token) {
      await AuthService.signOut(session.token);
    }
    await clearSession();
  };

  const resetPassword = async (email: string) => {
    return await AuthService.resetPassword(email);
  };

  const getStoredEmail = async () => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
    } catch (error) {
      console.error('Error getting stored email:', error);
      return null;
    }
  };

  const isRememberMeEnabled = async () => {
    try {
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return rememberMe === 'true';
    } catch (error) {
      console.error('Error checking remember me:', error);
      return false;
    }
  };

  // Social login placeholders (can be implemented with OAuth providers)
  const signInWithGoogle = async () => {
    // TODO: Implement Google OAuth
    return { success: false, error: 'Google sign-in not implemented yet' };
  };

  const signInWithApple = async () => {
    // TODO: Implement Apple OAuth
    return { success: false, error: 'Apple sign-in not implemented yet' };
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    getStoredEmail,
    isRememberMeEnabled,
    signInWithGoogle,
    signInWithApple,
  };
};