import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authSlice from './slices/authSlice';
import childrenSlice from './slices/childrenSlice';
import logsSlice from './slices/logsSlice';
import photosSlice from './slices/photosSlice';
import environmentSlice from './slices/environmentSlice';
import researchSlice from './slices/researchSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    children: childrenSlice,
    logs: logsSlice,
    photos: photosSlice,
    environment: environmentSlice,
    research: researchSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
