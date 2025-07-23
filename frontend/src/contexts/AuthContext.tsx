/**
 * Authentication Context for managing user state
 * Provides mock authentication for development mode
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseService } from '../services/firebaseService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check for existing user session
      const storedUser = await AsyncStorage.getItem('auth_user');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (storedUser && userId) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        await firebaseService.setUserId(userId);
        console.log('User session restored:', parsedUser.email);
      } else {
        // Auto-login for development mode
        if (process.env.EXPO_PUBLIC_ENV === 'development') {
          await autoLoginForDevelopment();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoLoginForDevelopment = async () => {
    try {
      console.log('Auto-login for development mode');
      
      // Create a test user for development
      const testUser: User = {
        id: 'test_user_123',
        email: 'test@example.com',
        name: 'Test User'
      };

      // Store user data
      await AsyncStorage.setItem('auth_user', JSON.stringify(testUser));
      await AsyncStorage.setItem('user_id', testUser.id);
      
      // Set user in firebase service
      await firebaseService.setUserId(testUser.id);
      
      setUser(testUser);
      console.log('Development user auto-logged in:', testUser.email);
      
    } catch (error) {
      console.error('Failed to auto-login for development:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // For development, accept any credentials
      if (process.env.EXPO_PUBLIC_ENV === 'development') {
        const user: User = {
          id: 'test_user_123',
          email: email,
          name: email.split('@')[0] // Use part before @ as name
        };

        await AsyncStorage.setItem('auth_user', JSON.stringify(user));
        await AsyncStorage.setItem('user_id', user.id);
        await firebaseService.setUserId(user.id);
        
        setUser(user);
        console.log('Development login successful:', email);
        return;
      }

      // TODO: Implement real authentication for production
      throw new Error('Production authentication not implemented yet');
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear stored data
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('user_id');
      
      // Clear firebase service user
      await firebaseService.setUserId('');
      
      setUser(null);
      console.log('User logged out');
      
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: user !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
