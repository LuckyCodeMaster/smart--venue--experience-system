import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, ApiError } from '../../types';
import api from '../../services/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@sves:access_token',
  REFRESH_TOKEN: '@sves:refresh_token',
  USER: '@sves:user',
} as const;

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (!accessToken || !refreshToken || !userJson) {
        return null;
      }

      const user: User = JSON.parse(userJson);
      const tokens: AuthTokens = {
        accessToken,
        refreshToken,
        expiresAt: 0,
      };

      // Verify token is still valid by fetching current user
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      const response = await api.get<{ data: User }>('/auth/me');

      return { user: response.data.data, tokens };
    } catch {
      // Clear stale tokens on failure
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
      ]);
      return rejectWithValue('Session expired. Please log in again.');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: { user: User; tokens: AuthTokens } }>(
        '/auth/login',
        credentials
      );
      const { user, tokens } = response.data.data;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      return { user, tokens };
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Login failed. Please try again.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
  } finally {
    delete api.defaults.headers.common['Authorization'];
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
  }
});

export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken });
      const tokens = response.data.data;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      ]);

      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      return tokens;
    } catch (error: unknown) {
      const apiError = (error as { response?: { data: ApiError } }).response?.data;
      return rejectWithValue(apiError?.message ?? 'Token refresh failed.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // initializeAuth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.tokens = action.payload.tokens;
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = null;
      });

    // login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    // refreshTokens
    builder
      .addCase(refreshTokens.fulfilled, (state, action) => {
        state.tokens = action.payload;
      })
      .addCase(refreshTokens.rejected, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
