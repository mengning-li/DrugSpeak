// Updated learningSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARNING_LIST_KEY = 'user_learning_list';
const FINISHED_LIST_KEY = 'user_finished_list';

// Helper function to sync study data to backend
const syncToBackend = async (userId, token, state, updatedLearningList, updatedFinishedList) => {
  if (!token || !userId) {
    console.log('⚠️ Cannot sync to backend: no token or userId');
    return true; // Return true to indicate "no error" when not authenticated
  }
  
  try {
    // Import dynamically to avoid circular dependencies
    const { syncStudyRecord, calculateStudyData } = require('../Component/studyRecordSync');
    
    // Calculate study data with the updated lists
    const drugScores = state.drugScore?.scores || {};
    const studyData = calculateStudyData(
      drugScores,
      updatedLearningList,
      updatedFinishedList
    );
    
    // Sync to backend
    const success = await syncStudyRecord(userId, token, studyData);
    console.log('Backend sync result:', success ? 'success' : 'failed');
    return success;
  } catch (syncError) {
    console.error('Error syncing to backend:', syncError);
    return false;
  }
};

export const fetchLearningLists = createAsyncThunk(
  'learning/fetchLearningLists',
  async (userId, { rejectWithValue, getState, dispatch }) => {
    try {
      if (!userId) {
        console.log("No userId provided for fetchLearningLists");
        return { learningList: [], finishedList: [] };
      }
      
      // Use user-specific keys
      const userLearningKey = `${LEARNING_LIST_KEY}_${userId}`;
      const userFinishedKey = `${FINISHED_LIST_KEY}_${userId}`;
      
      const learningListJSON = await AsyncStorage.getItem(userLearningKey);
      const finishedListJSON = await AsyncStorage.getItem(userFinishedKey);
      
      console.log(`Fetched learning lists for user ${userId}`);
      
      const learningList = learningListJSON ? JSON.parse(learningListJSON) : [];
      const finishedList = finishedListJSON ? JSON.parse(finishedListJSON) : [];
      
      // Sync with backend after fetching local data
      const state = getState();
      const token = state.auth?.token;
      if (token && userId) {
        try {
          console.log('Syncing initial data to backend after app load');
          await syncToBackend(userId, token, state, learningList, finishedList);
        } catch (syncError) {
          console.error('Failed to sync initial learning data to backend:', syncError);
          // Continue even if initial sync fails
        }
      }
      
      return { learningList, finishedList };
    } catch (error) {
      console.error("Error fetching learning lists:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const addToLearningList = createAsyncThunk(
  'learning/addToLearningList',
  async (params, { rejectWithValue, getState }) => {
    try {
      const { drugId, userId } = typeof params === 'object' ? params : { drugId: params, userId: null };
      
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      const actualUserId = userId || (user ? user.id : null);
      
      if (!actualUserId) {
        console.error("No user ID found for addToLearningList");
        return getState().learning.learningList || [];
      }
      
      const userLearningKey = `${LEARNING_LIST_KEY}_${actualUserId}`;
      
      const currentList = state.learning?.learningList || [];
      if (currentList.includes(drugId)) return currentList;
      
      const updatedList = [...currentList, drugId];
      await AsyncStorage.setItem(userLearningKey, JSON.stringify(updatedList));
      
      // Sync to backend after updating local storage
      if (token) {
        await syncToBackend(actualUserId, token, state, updatedList, state.learning?.finishedList || []);
      }
      
      console.log(`Added drug ${drugId} to user ${actualUserId}'s learning list`);
      return updatedList;
    } catch (error) {
      console.error("Failed to add to learning list:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const markAsFinished = createAsyncThunk(
  'learning/markAsFinished',
  async (params, { rejectWithValue, getState, dispatch }) => {
    const { drugId, userId } = typeof params === 'object' ? params : { drugId: params, userId: null };
    
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      const actualUserId = userId || (user ? user.id : null);
      
      if (!actualUserId) {
        console.error("No user ID available for markAsFinished");
        return { 
          learningList: state.learning?.learningList || [],
          finishedList: state.learning?.finishedList || []
        };
      }
      
      const userLearningKey = `${LEARNING_LIST_KEY}_${actualUserId}`;
      const userFinishedKey = `${FINISHED_LIST_KEY}_${actualUserId}`;
      
      // Remove from learning list
      const currentLearningList = state.learning?.learningList || [];
      const updatedLearningList = currentLearningList.filter(id => id !== drugId);
      await AsyncStorage.setItem(userLearningKey, JSON.stringify(updatedLearningList));
      
      // Add to finished list
      const currentFinishedList = state.learning?.finishedList || [];
      if (currentFinishedList.includes(drugId)) {
        return {
          learningList: updatedLearningList,
          finishedList: currentFinishedList
        };
      }
      
      const updatedFinishedList = [...currentFinishedList, drugId];
      await AsyncStorage.setItem(userFinishedKey, JSON.stringify(updatedFinishedList));
      
      // Immediately sync to backend after updating lists
      if (token) {
        await syncToBackend(actualUserId, token, state, updatedLearningList, updatedFinishedList);
      }
      
      return {
        learningList: updatedLearningList,
        finishedList: updatedFinishedList
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const moveBackToLearning = createAsyncThunk(
  'learning/moveBackToLearning',
  async (params, { rejectWithValue, getState, dispatch }) => {
    const { drugId, userId } = typeof params === 'object' ? params : { drugId: params, userId: null };
    
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      const actualUserId = userId || (user ? user.id : null);
      
      if (!actualUserId) {
        console.error("No user ID available for moveBackToLearning");
        return { 
          learningList: state.learning?.learningList || [],
          finishedList: state.learning?.finishedList || []
        };
      }
      
      const userLearningKey = `${LEARNING_LIST_KEY}_${actualUserId}`;
      const userFinishedKey = `${FINISHED_LIST_KEY}_${actualUserId}`;
      
      // Remove from finished list
      const currentFinishedList = state.learning?.finishedList || [];
      const updatedFinishedList = currentFinishedList.filter(id => id !== drugId);
      await AsyncStorage.setItem(userFinishedKey, JSON.stringify(updatedFinishedList));
      
      // Add to learning list
      const currentLearningList = state.learning?.learningList || [];
      if (currentLearningList.includes(drugId)) {
        return {
          learningList: currentLearningList,
          finishedList: updatedFinishedList
        };
      }
      
      const updatedLearningList = [...currentLearningList, drugId];
      await AsyncStorage.setItem(userLearningKey, JSON.stringify(updatedLearningList));
      
      // Immediately sync to backend after updating lists
      if (token) {
        await syncToBackend(actualUserId, token, state, updatedLearningList, updatedFinishedList);
      }
      
      return {
        learningList: updatedLearningList,
        finishedList: updatedFinishedList
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeDrug = createAsyncThunk(
  'learning/removeDrug',
  async (params, { rejectWithValue, getState, dispatch }) => {
    const { drugId, fromFinished, userId } = params;
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      const actualUserId = userId || (user ? user.id : null);
      
      if (!actualUserId) {
        console.error("No user ID available for removeDrug");
        return { 
          learningList: state.learning?.learningList || [],
          finishedList: state.learning?.finishedList || []
        };
      }
      
      const userLearningKey = `${LEARNING_LIST_KEY}_${actualUserId}`;
      const userFinishedKey = `${FINISHED_LIST_KEY}_${actualUserId}`;
      
      // Clear drug data (scores and recordings) when removing from list
      dispatch({ 
        type: 'drugScore/clearDrugData', 
        payload: { drugId, userId: actualUserId } 
      });
      
      let updatedLearningList = [...(state.learning?.learningList || [])];
      let updatedFinishedList = [...(state.learning?.finishedList || [])];
      
      if (fromFinished) {
        // Remove from finished list
        updatedFinishedList = (state.learning?.finishedList || []).filter(id => id !== drugId);
        await AsyncStorage.setItem(userFinishedKey, JSON.stringify(updatedFinishedList));
      } else {
        // Remove from learning list
        updatedLearningList = (state.learning?.learningList || []).filter(id => id !== drugId);
        await AsyncStorage.setItem(userLearningKey, JSON.stringify(updatedLearningList));
      }
      
      // Immediately sync to backend after updating lists
      if (token) {
        try {
          // First update drugScores (it might have changed due to clearDrugData)
          const updatedState = getState(); // Get fresh state after dispatch
          await syncToBackend(actualUserId, token, updatedState, updatedLearningList, updatedFinishedList);
        } catch (syncError) {
          console.error('Error syncing to backend:', syncError);
          // Continue even if sync fails - don't reject the whole action
        }
      }
      
      return {
        learningList: updatedLearningList,
        finishedList: updatedFinishedList
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const forceSyncToBackend = createAsyncThunk(
  'learning/forceSyncToBackend',
  async (_, { getState }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      
      if (!user || !user.id || !token) {
        console.log('⚠️ Cannot force sync: no user or token (user not logged in)');
        return true; // Return true instead of throwing error - this is not an error condition
      }
      
      console.log('Force syncing learning data to backend...');
      const success = await syncToBackend(
        user.id, 
        token, 
        state, 
        state.learning?.learningList || [], 
        state.learning?.finishedList || []
      );
      
      console.log('Force sync result:', success ? 'success' : 'failed');
      return success;
    } catch (error) {
      console.error('Force sync error:', error);
      return false; // Return false on actual errors, but don't throw
    }
  }
);

const initialState = {
  learningList: [],
  finishedList: [],
  status: 'idle',
  error: null,
};

export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    clearUserData: (state) => {
      state.learningList = [];
      state.finishedList = [];
      state.error = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearningLists.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLearningLists.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.learningList = action.payload.learningList;
        state.finishedList = action.payload.finishedList;
      })
      .addCase(fetchLearningLists.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addToLearningList.fulfilled, (state, action) => {
        state.learningList = action.payload;
      })
      .addCase(markAsFinished.fulfilled, (state, action) => {
        state.learningList = action.payload.learningList;
        state.finishedList = action.payload.finishedList;
      })
      .addCase(moveBackToLearning.fulfilled, (state, action) => {
        state.learningList = action.payload.learningList;
        state.finishedList = action.payload.finishedList;
      })
      .addCase(removeDrug.fulfilled, (state, action) => {
        state.learningList = action.payload.learningList;
        state.finishedList = action.payload.finishedList;
      })
      // Handle forceSyncToBackend cases gracefully
      .addCase(forceSyncToBackend.fulfilled, (state, action) => {
        // Sync completed successfully or was skipped due to no auth
        console.log('Force sync completed:', action.payload);
      })
      .addCase(forceSyncToBackend.rejected, (state, action) => {
        // Don't update error state for sync failures
        console.log('Force sync rejected but continuing:', action.error);
      });
  },
});

export const { clearUserData } = learningSlice.actions;

// Selectors
export const selectLearningList = (state) => state.learning?.learningList || [];
export const selectFinishedList = (state) => state.learning?.finishedList || [];
export const selectLearningStatus = (state) => state.learning?.status || 'idle';
export const selectIsInLearningList = (state, drugId) => 
  state.learning?.learningList && state.learning.learningList.includes(drugId);
export const selectIsInFinishedList = (state, drugId) =>
  state.learning?.finishedList && state.learning.finishedList.includes(drugId);

export const selectLearningCount = (state) => {
  if (!state || !state.learning || !state.learning.learningList) {
    return 0;
  }
  return state.learning.learningList.length;
};

export default learningSlice.reducer;