import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8090/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // For development: try to get stored token first
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        return storedToken;
      }
      
      // Development fallback: create a test token
      console.log('No stored token found, attempting to get test token...');
      const testToken = await this.getTestToken();
      if (testToken) {
        await AsyncStorage.setItem('auth_token', testToken);
        return testToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async getTestToken(): Promise<string | null> {
    try {
      // First, try to create/login test user
      const loginData = {
        username: 'test@allergyapp.com',
        password: 'testpassword123'
      };
      
      const response = await fetch(`${this.api.defaults.baseURL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(loginData).toString()
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        console.log('✅ Test token obtained');
        return tokenData.access_token;
      } else if (response.status === 401) {
        // User doesn't exist, try to create
        console.log('User not found, creating test user...');
        const createResponse = await fetch(`${this.api.defaults.baseURL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@allergyapp.com',
            password: 'testpassword123',
            full_name: 'Test User'
          })
        });
        
        if (createResponse.ok || createResponse.status === 400) {
          // User created or already exists, try login again
          const retryResponse = await fetch(`${this.api.defaults.baseURL}/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(loginData).toString()
          });
          
          if (retryResponse.ok) {
            const tokenData = await retryResponse.json();
            console.log('✅ Test token obtained after user creation');
            return tokenData.access_token;
          }
        }
      }
      
      console.log('❌ Failed to get test token');
      return null;
    } catch (error) {
      console.error('Error getting test token:', error);
      return null;
    }
  }

  private async handleUnauthorized(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      // Navigate to login screen or emit event for app-wide logout
      console.log('Unauthorized access - cleared auth data');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Generic request methods - Fixed for FastAPI direct responses
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, { params });
      // FastAPI returns data directly, wrap in ApiResponse format
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    console.error('API Error:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'Server error occurred',
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }
}

export default new ApiService();
