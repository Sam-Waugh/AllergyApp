import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DailyLog, DailyLogForm, PaginatedResponse } from '../../models';
import LogService from '../../services/LogService';

interface LogsState {
  logs: DailyLog[];
  currentLog: DailyLog | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  trends: Record<string, number[]>;
  triggerAnalysis: Record<string, number>;
}

const initialState: LogsState = {
  logs: [],
  currentLog: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
  },
  trends: {},
  triggerAnalysis: {},
};

// Async thunks
export const fetchLogs = createAsyncThunk(
  'logs/fetchLogs',
  async ({
    childId,
    page = 1,
    limit = 20,
    startDate,
    endDate,
  }: {
    childId: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await LogService.getChildLogs(childId, page, limit, startDate, endDate);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch logs');
  }
);

export const createLog = createAsyncThunk(
  'logs/create',
  async ({ childId, logData }: { childId: string; logData: DailyLogForm }) => {
    const response = await LogService.createLog(childId, logData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create log');
  }
);

export const updateLog = createAsyncThunk(
  'logs/update',
  async ({ logId, updates }: { logId: string; updates: Partial<DailyLogForm> }) => {
    const response = await LogService.updateLog(logId, updates);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update log');
  }
);

export const fetchSymptomTrends = createAsyncThunk(
  'logs/fetchTrends',
  async ({
    childId,
    startDate,
    endDate,
  }: {
    childId: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await LogService.getSymptomTrends(childId, startDate, endDate);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch trends');
  }
);

export const fetchTriggerAnalysis = createAsyncThunk(
  'logs/fetchTriggerAnalysis',
  async ({
    childId,
    startDate,
    endDate,
  }: {
    childId: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await LogService.getTriggerAnalysis(childId, startDate, endDate);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch trigger analysis');
  }
);

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setCurrentLog: (state, action: PayloadAction<DailyLog | null>) => {
      state.currentLog = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearLogs: (state) => {
      state.logs = [];
      state.pagination = initialState.pagination;
    },
    // Add dummy data for UI prototyping
    loadDummyLogs: (state) => {
      const today = new Date();
      const dummyLogs: DailyLog[] = [];
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        dummyLogs.push({
          id: `log-${i}`,
          childId: '1',
          date: date.toISOString().split('T')[0],
          symptoms: {
            rash: Math.floor(Math.random() * 11),
            cough: Math.floor(Math.random() * 11),
            runnyNose: Math.floor(Math.random() * 11),
            itching: Math.floor(Math.random() * 11),
            wheezing: Math.floor(Math.random() * 11),
          },
          mood: Math.floor(Math.random() * 5) + 1,
          triggers: ['Pollen', 'Dust', 'Pet dander'].slice(0, Math.floor(Math.random() * 3) + 1),          notes: `Daily log entry for ${date.toDateString()}`,
          weather: {
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40,
            pollenCount: `${Math.floor(Math.random() * 100)}`,
            airQuality: Math.floor(Math.random() * 200),
            uvIndex: Math.floor(Math.random() * 11),
            description: 'Partly cloudy',
            location: 'Sample Location',
            latitude: 40.7128,
            longitude: -74.0060,
          },
          createdAt: date.toISOString(),
        });
      }
      
      state.logs = dummyLogs;
      state.pagination.total = dummyLogs.length;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch logs
      .addCase(fetchLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.items;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasNext: action.payload.hasNext,
        };
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch logs';
      })
      // Create log
      .addCase(createLog.fulfilled, (state, action) => {
        state.logs.unshift(action.payload);
        state.currentLog = action.payload;
        state.pagination.total += 1;
      })
      // Update log
      .addCase(updateLog.fulfilled, (state, action) => {
        const index = state.logs.findIndex(log => log.id === action.payload.id);
        if (index !== -1) {
          state.logs[index] = action.payload;
        }
        if (state.currentLog?.id === action.payload.id) {
          state.currentLog = action.payload;
        }
      })
      // Fetch trends
      .addCase(fetchSymptomTrends.fulfilled, (state, action) => {
        state.trends = action.payload;
      })
      // Fetch trigger analysis
      .addCase(fetchTriggerAnalysis.fulfilled, (state, action) => {
        state.triggerAnalysis = action.payload;
      });
  },
});

export const { setCurrentLog, clearError, clearLogs, loadDummyLogs } = logsSlice.actions;
export default logsSlice.reducer;
