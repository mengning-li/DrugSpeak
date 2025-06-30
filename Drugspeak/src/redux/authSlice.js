import { createSlice } from '@reduxjs/toolkit';
import { clearAllScores } from './drugScoreSlice';
import { clearUserData } from './learningSlice';

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
    },
    signupStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signupSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    signupFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserSuccess: (state, action) => {
      state.user = action.payload.user;
    },
    // Add this to handle authentication state restoration
    setAuthState: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  signupStart,
  signupSuccess,
  signupFailure,
  clearError,
  updateUserSuccess,
  setAuthState,
} = authSlice.actions;

// Thunk to clear all user data on logout
export const logoutAndClearData = () => async (dispatch, getState) => {
  try {
    // Try to sync data before logging out
    const state = getState();
    const user = state.auth.user;
    const token = state.auth.token;
    
    if (user && user.id && token) {
      try {
        console.log('Syncing data before logout');
        // Import dynamically to avoid circular dependencies
        const { syncStudyRecord, calculateStudyData } = require('../Component/studyRecordSync');
        
        // Calculate study data
        const learningList = state.learning.learningList;
        const finishedList = state.learning.finishedList;
        const drugScores = state.drugScore.scores;
        
        const studyData = calculateStudyData(
          drugScores,
          learningList,
          finishedList
        );
        
        // Final sync before logout
        await syncStudyRecord(user.id, token, studyData);
        console.log('Pre-logout sync complete');
      } catch (syncError) {
        console.error('Failed to sync before logout:', syncError);
      }
    }
  } catch (error) {
    console.error('Error during pre-logout sync:', error);
  } finally {
    // Always dispatch logout actions
    dispatch(logout());
    dispatch(clearAllScores());
    dispatch(clearUserData());
  }
};

// Selectors
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;

export const loginUser = (user, token) => async (dispatch) => {
  dispatch({
    type: 'auth/loginSuccess',
    payload: { user, token }
  });
  
  // Immediately fetch learning data after login
  try {
    const response = await fetch('http://localhost:3000/study-record', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      dispatch({ type: 'learning/setLearningList', payload: data });
    }
  } catch (error) {
    console.error('Error fetching learning data:', error);
  }
};