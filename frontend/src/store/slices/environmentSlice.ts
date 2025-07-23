import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WeatherData } from '../../models';
import { environmentService } from '../../services';

interface EnvironmentState {
  currentWeather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EnvironmentState = {
  currentWeather: null,
  isLoading: false,
  error: null,
};

export const fetchCurrentWeather = createAsyncThunk(
  'environment/fetchWeather',
  async (location: string) => {
    try {
      const response = await environmentService.getEnvironmentData(location);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  }
);

export const fetchCurrentWeatherByCoords = createAsyncThunk(
  'environment/fetchWeatherByCoords',
  async ({ lat, lon }: { lat: number; lon: number }) => {
    try {
      const response = await environmentService.getCurrentEnvironmentData(lat, lon);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  }
);

export const fetchCurrentLocationWeather = createAsyncThunk(
  'environment/fetchCurrentLocationWeather',
  async () => {
    try {
      // Get user's current location
      const location = await environmentService.getCurrentLocation();
      
      // Fetch weather data for current location
      const response = await environmentService.getCurrentEnvironmentData(location.lat, location.lon);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  }
);

export const fetchCurrentLocationWeatherPublic = createAsyncThunk(
  'environment/fetchCurrentLocationWeatherPublic',
  async () => {
    try {
      // Get user's current location
      const location = await environmentService.getCurrentLocation();
      
      // Fetch weather data for current location using public endpoint
      const response = await environmentService.getCurrentEnvironmentDataPublic(location.lat, location.lon);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  }
);

const environmentSlice = createSlice({
  name: 'environment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },  extraReducers: (builder) => {
    builder
      // fetchCurrentWeather
      .addCase(fetchCurrentWeather.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentWeather.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWeather = action.payload;
      })
      .addCase(fetchCurrentWeather.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch weather';
      })
      // fetchCurrentWeatherByCoords
      .addCase(fetchCurrentWeatherByCoords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentWeatherByCoords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWeather = action.payload;
      })
      .addCase(fetchCurrentWeatherByCoords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch weather';
      })
      // fetchCurrentLocationWeather
      .addCase(fetchCurrentLocationWeather.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentLocationWeather.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWeather = action.payload;
      })
      .addCase(fetchCurrentLocationWeather.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch weather';
      })
      // fetchCurrentLocationWeatherPublic
      .addCase(fetchCurrentLocationWeatherPublic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentLocationWeatherPublic.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWeather = action.payload;
      })
      .addCase(fetchCurrentLocationWeatherPublic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch weather';
      });
  },
});

export const { clearError } = environmentSlice.actions;
export default environmentSlice.reducer;
