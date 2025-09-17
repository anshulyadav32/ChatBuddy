import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, AuthSession, User, Profile } from '../utils/auth';
import { JWTUtils } from '../utils/jwt';

export const useAuth = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get stored session
      const storedSession = await authAPI.getStoredSession();
      
      if (storedSession && storedSession.token) {
        // Check if token is still valid
        if (!JWTUtils.isExpired(storedSession.token)) {
          setSession(storedSession);
          setUser(storedSession.user);
          setProfile(storedSession.profile);
        } else {
          // Try to refresh token
          const refreshResult = await authAPI.refreshToken();
          if (refreshResult.success && refreshResult.data) {
            setSession(refreshResult.data);
            setUser(refreshResult.data.user);
            setProfile(refreshResult.data.profile);
          } else {
            // Clear invalid session
            await authAPI.clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await authAPI.clearSession();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const result = await authAPI.signUp(email, password, username, fullName);
    
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
      setProfile(result.data.profile);
    }

    return result;
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const result = await authAPI.signIn(email, password, rememberMe);
    
    if (result.success && result.data) {
      setSession(result.data);
      setUser(result.data.user);
      setProfile(result.data.profile);
    }

    return result;
  };

  const signOut = async () => {
    await authAPI.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    return await authAPI.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    return await authAPI.updatePassword(newPassword);
  };

  const getStoredEmail = async () => {
    return await authAPI.getStoredEmail();
  };

  const isRememberMeEnabled = async () => {
    return await authAPI.isRememberMeEnabled();
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
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signInWithApple,
    getStoredEmail,
    isRememberMeEnabled,
  };
};