import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ResearchArticle } from '../../models';

interface ResearchState {
  articles: ResearchArticle[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ResearchState = {
  articles: [],
  isLoading: false,
  error: null,
};

export const fetchResearchFeed = createAsyncThunk(
  'research/fetchFeed',
  async () => {
    // Mock data for now
    return [
      {
        id: '1',
        title: 'New Study on Childhood Food Allergies',
        summary: 'Recent research shows promising results for early intervention...',
        source: 'Journal of Allergy Medicine',
        url: 'https://example.com/article1',
        relevantConditions: ['Food allergies'],
        publishedAt: '2024-01-15',
        aiSummary: 'Key findings suggest that early exposure protocols may reduce severity of food allergic reactions in children under 5.',
      },
    ];
  }
);

const researchSlice = createSlice({
  name: 'research',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResearchFeed.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchResearchFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        state.articles = action.payload;
      })
      .addCase(fetchResearchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch research';
      });
  },
});

export const { clearError } = researchSlice.actions;
export default researchSlice.reducer;
