import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../models';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    // In real app, call auth service
    // For now, return mock data
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: 'Parent User',
      children: [],
      preferences: {
        notifications: true,
        reminderTime: '19:00',
        defaultLocation: 'New York, NY',
      },
    };
    
    return {
      user: mockUser,
      token: 'mock-jwt-token',
    };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  // Clear token from secure storage
  return null;
});

export const refreshToken = createAsyncThunk('auth/refresh', async () => {
  // Refresh JWT token
  return 'new-jwt-token';
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
