import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PhotoEntry } from '../../models';

interface PhotosState {
  photos: PhotoEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PhotosState = {
  photos: [],
  isLoading: false,
  error: null,
};

export const fetchPhotos = createAsyncThunk(
  'photos/fetchPhotos',
  async (childId: string) => {
    // Mock data for now
    return [];
  }
);

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhotos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPhotos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.photos = action.payload;
      })
      .addCase(fetchPhotos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch photos';
      });
  },
});

export const { clearError } = photosSlice.actions;
export default photosSlice.reducer;
