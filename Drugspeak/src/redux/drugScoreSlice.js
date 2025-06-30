import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const drugScoreSlice = createSlice({
  name: 'drugScore',
  initialState: {
    scores: {},
    recordings: {}
  },
  reducers: {
    updateScoreSuccess: (state, action) => {
      const { drugId, score } = action.payload;
      
      console.log('=== REDUX drugScore/updateScoreSuccess ===');
      console.log('DrugId:', drugId);
      console.log('New score:', score);
      console.log('Current score for this drug:', state.scores[drugId]);
      console.log('Should update?', !state.scores[drugId] || score > state.scores[drugId]);
      
      if (!state.scores[drugId] || score > state.scores[drugId]) {
        console.log('✅ Updating score in Redux:', state.scores[drugId], '→', score);
        state.scores[drugId] = score;
        console.log('Updated scores object:', state.scores);
      } else {
        console.log('⚠️ Score not updated - not higher than existing');
      }
      console.log('=== END REDUX UPDATE ===');
    },
    clearAllScores: () => {
      console.log('Clearing all scores and recordings');
      return {
        scores: {},
        recordings: {}
      };
    },
    saveRecording: (state, action) => {
      const { drugId, recording } = action.payload;
      if (!state.recordings[drugId]) {
        state.recordings[drugId] = [];
      }
      state.recordings[drugId].push(recording);
      console.log(`Saved recording for drug ${drugId}`);
    },
    // New: Clear data for a specific drug when removed from learning list
    clearDrugData: (state, action) => {
      const { drugId, userId } = action.payload;
      
      console.log(`Clearing data for drug ${drugId}, user ${userId}`);
      
      // Remove the score for this drug
      if (state.scores[drugId]) {
        delete state.scores[drugId];
        console.log(`Cleared score for drug ${drugId}`);
      }
      
      // Remove recordings for this drug
      if (state.recordings[drugId]) {
        delete state.recordings[drugId];
        console.log(`Cleared recordings for drug ${drugId}`);
      }
      
      // Also clear the recordings from AsyncStorage
      const clearStoredRecordings = async () => {
        try {
          const storageKey = `recordings_${userId}_${drugId}`;
          await AsyncStorage.removeItem(storageKey);
          console.log(`Cleared recordings for drug ${drugId} user ${userId}`);
        } catch (error) {
          console.error('Failed to clear stored recordings:', error);
        }
      };
      
      clearStoredRecordings();
    }
  },
});

export const { updateScoreSuccess, clearAllScores, saveRecording, clearDrugData } = drugScoreSlice.actions;
export default drugScoreSlice.reducer;