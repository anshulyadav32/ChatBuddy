import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './navigation/AppNavigator';
import { supabase } from './utils/supabase';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error && error.message.includes('relation "profiles" does not exist')) {
        setError('Database not set up. Please run the SQL schema first.');
      } else if (error && error.message.includes('Invalid API key')) {
        setError('Invalid Supabase credentials. Please check your .env.local file.');
      } else if (error) {
        console.warn('Supabase connection warning:', error.message);
      }

      // Initialize any other app services here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      setIsReady(true);
    } catch (err) {
      console.error('App initialization error:', err);
      setError('Failed to initialize app. Please check your configuration.');
      setIsReady(true); // Still show the app even if there are issues
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing Chat App...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Configuration Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorInstructions}>
            Please check the README.md for setup instructions.
          </Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  errorInstructions: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
