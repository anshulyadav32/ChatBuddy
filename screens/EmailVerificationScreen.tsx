import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

interface EmailVerificationScreenProps {
  navigation: any;
  route: {
    params: {
      email: string;
    };
  };
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { email } = route.params;
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { signUp } = useAuth();

  const handleResendVerification = async () => {
    setResendLoading(true);
    
    // Resend verification by attempting signup again (Supabase will send verification email)
    const { error } = await signUp(email, 'temp_password', 'temp_username', 'temp_name');
    
    setResendLoading(false);

    if (error && !error.message.includes('already registered')) {
      Alert.alert('Error', 'Failed to resend verification email');
    } else {
      Alert.alert('Success', 'Verification email sent! Check your inbox.');
    }
  };

  const handleContinue = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={80} color="#007AFF" />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        
        <Text style={styles.message}>
          We've sent a verification link to:
        </Text>
        
        <Text style={styles.email}>{email}</Text>
        
        <Text style={styles.instructions}>
          Click the link in the email to verify your account and complete the registration process.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>Continue to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, resendLoading && styles.buttonDisabled]}
            onPress={handleResendVerification}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={16} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Resend Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Didn't receive the email?</Text>
          <Text style={styles.helpText}>
            • Check your spam/junk folder{'\n'}
            • Make sure the email address is correct{'\n'}
            • Try resending the verification email
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>
            ← Back to Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 40,
  },
  actions: {
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});