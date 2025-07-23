import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Child, ProfileForm } from '../../models';
import ProfileService from '../../services/ProfileService';

interface ChildrenState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChildrenState = {
  children: [],
  selectedChild: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchChildren = createAsyncThunk('children/fetchAll', async () => {
  const response = await ProfileService.getChildren();
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch children');
  }
  return response.data || [];
});

export const createChild = createAsyncThunk(
  'children/create',
  async (profileData: ProfileForm) => {
    const response = await ProfileService.createChildProfile(profileData);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create child');
    }
    return response.data!;
  }
);

export const updateChild = createAsyncThunk(
  'children/update',
  async ({ childId, updates }: { childId: string; updates: Partial<ProfileForm> }) => {
    const response = await ProfileService.updateChildProfile(childId, updates);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update child');
    }
    return response.data!;
  }
);

export const deleteChild = createAsyncThunk(
  'children/delete',
  async (childId: string) => {
    const response = await ProfileService.deleteChildProfile(childId);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete child');
    }
    return childId;
  }
);

const childrenSlice = createSlice({
  name: 'children',
  initialState,
  reducers: {
    setSelectedChild: (state, action: PayloadAction<Child | null>) => {
      state.selectedChild = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add dummy data for UI prototyping
    loadDummyData: (state) => {
      state.children = [
        {
          id: '1',
          name: 'Emma Johnson',
          dateOfBirth: '2018-05-15',
          allergies: ['Peanuts', 'Tree nuts', 'Eggs'],
          medications: ['EpiPen', 'Benadryl'],
          conditions: ['Food allergies', 'Eczema'],
          photoUrl: 'https://via.placeholder.com/150',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Lucas Johnson',
          dateOfBirth: '2020-09-22',
          allergies: ['Dust mites', 'Pet dander'],
          medications: ['Albuterol inhaler'],
          conditions: ['Asthma', 'Environmental allergies'],
          photoUrl: 'https://via.placeholder.com/150',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];
      state.selectedChild = state.children[0];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch children
      .addCase(fetchChildren.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.isLoading = false;
        state.children = action.payload;
        if (action.payload.length > 0 && !state.selectedChild) {
          state.selectedChild = action.payload[0];
        }
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch children';
      })
      // Create child
      .addCase(createChild.fulfilled, (state, action) => {
        state.children.push(action.payload);
        state.selectedChild = action.payload;
      })
      // Update child
      .addCase(updateChild.fulfilled, (state, action) => {
        const index = state.children.findIndex(child => child.id === action.payload.id);
        if (index !== -1) {
          state.children[index] = action.payload;
          if (state.selectedChild?.id === action.payload.id) {
            state.selectedChild = action.payload;
          }
        }
      })
      // Delete child
      .addCase(deleteChild.fulfilled, (state, action) => {
        state.children = state.children.filter(child => child.id !== action.payload);
        if (state.selectedChild?.id === action.payload) {
          state.selectedChild = state.children.length > 0 ? state.children[0] : null;
        }
      });
  },
});

export const { setSelectedChild, clearError, loadDummyData } = childrenSlice.actions;
export default childrenSlice.reducer;
