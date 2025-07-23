import ApiService from './ApiService';
import { ApiResponse } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await ApiService.post<AuthResponse>('/auth/token', formData);
    
    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthUser>> {
    const response = await ApiService.post<AuthUser>('/auth/register', userData);
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([this.TOKEN_KEY, this.USER_KEY]);
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.access_token],
        [this.USER_KEY, JSON.stringify(authData.user)]
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    // Implement token refresh logic if needed
    const response = await ApiService.post<AuthResponse>('/auth/refresh');
    
    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }
    
    return response;
  }
}

export default new AuthService();
