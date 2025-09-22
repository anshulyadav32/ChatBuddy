import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { EmailVerificationScreen } from '../screens/EmailVerificationScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { NewChatScreen } from '../screens/NewChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export type RootStackParamList = {
  ChatList: undefined;
  Chat: {
    chatId: string;
    chatName?: string;
  };
  NewChat: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailVerification: {
    email: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStackNavigator = createStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
    <AuthStackNavigator.Screen name="SignUp" component={SignUpScreen} />
    <AuthStackNavigator.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStackNavigator.Screen name="EmailVerification" component={EmailVerificationScreen} />
  </AuthStackNavigator.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ChatList" 
      component={ChatListScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        headerStyle: {
          backgroundColor: '#202C33',
        },
        headerTintColor: '#E9EDEF',
        headerTitleStyle: {
          fontWeight: '500',
        },
      }}
    />
    <Stack.Screen 
      name="NewChat" 
      component={NewChatScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
});