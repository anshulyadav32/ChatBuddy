import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  loading?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGooglePress,
  onApplePress,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={onGooglePress}
        disabled={loading}
      >
        <Ionicons name="logo-google" size={20} color="#4285F4" />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={styles.appleButton}
          onPress={onApplePress}
          disabled={loading}
        >
          <Ionicons name="logo-apple" size={20} color="white" />
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});