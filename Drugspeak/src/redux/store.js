import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

import authReducer from './authSlice';
import drugScoreReducer from './drugScoreSlice';
import learningReducer from './learningSlice';
import drugReducer from './drugSlice';

// Configure persistence
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'drugScore', 'learning'], // Persist these reducers
  blacklist: ['drugs'] // Don't persist these reducers (optional)
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  drugScore: drugScoreReducer,
  learning: learningReducer,
  drugs: drugReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Debug logging for store state changes in development
if (__DEV__) {
  store.subscribe(() => {
    const state = store.getState();
    console.log('Store updated - drugScore.scores:', state.drugScore?.scores);
  });
}

export default store;