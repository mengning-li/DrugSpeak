import { Platform } from 'react-native';
import { API_URL } from '../constant/apiConfig';

// Local backup in case import fails
const LOCAL_API_URL = Platform.OS === 'ios' 
  ? 'http://localhost:3000'
  : 'http://10.0.2.2:3000'; 

export const syncStudyRecord = async (userId, token, studyData) => {
  try {
    console.log('=== Syncing Study Record ===');
    console.log('User ID:', userId);
    console.log('Study data to sync:', JSON.stringify(studyData, null, 2));
    
    if (!userId || !token) {
      console.log('⚠️ Skipping sync - user not authenticated');
      return true; // Return true to prevent error propagation
    }
    
    // Add timestamp to URL to prevent caching
    const url = `${API_URL}/study-record?_=${new Date().getTime()}`;
    
    const payload = {
      userId: userId,
      currentLearning: studyData.currentLearning || 0,
      finishedLearning: studyData.finishedLearning || 0,
      totalScore: studyData.totalScore || 0,
    };
    
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('API Response status:', response.status);
    console.log('API Response body:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Failed to sync study record, status:', response.status);
      console.error('Error details:', result);
      return false;
    }
    
    console.log('✅ Study record synced successfully');
    console.log('=== End Sync ===');
    return true;
  } catch (error) {
    console.error('❌ Error syncing study record:', error);
    return false;
  }
};

export const calculateStudyData = (drugScores, learningList, finishedList) => {
  console.log('=== Calculate Study Data Debug ===');
  console.log('Input drugScores:', drugScores);
  console.log('Input learningList:', learningList);
  console.log('Input finishedList:', finishedList);
  
  // More robust score calculation
  let totalScore = 0;
  
  if (drugScores) {
    if (typeof drugScores === 'object' && !Array.isArray(drugScores)) {
      // drugScores is object format: { drugId1: score1, drugId2: score2 }
      const scores = Object.values(drugScores);
      totalScore = scores.reduce((sum, score) => {
        const numScore = typeof score === 'number' ? score : 0;
        return sum + numScore;
      }, 0);
      console.log('Object format - Individual scores:', scores);
    } else if (Array.isArray(drugScores)) {
      // drugScores is array format
      totalScore = drugScores.reduce((sum, item) => {
        const score = typeof item === 'number' ? item : (item.score || 0);
        return sum + score;
      }, 0);
      console.log('Array format - drugScores:', drugScores);
    } else if (typeof drugScores === 'number') {
      // drugScores is single number
      totalScore = drugScores;
      console.log('Number format - totalScore:', totalScore);
    }
  }
  
  // Ensure learningList and finishedList are arrays
  const safelearningList = Array.isArray(learningList) ? learningList : [];
  const safeFinishedList = Array.isArray(finishedList) ? finishedList : [];
  
  const currentLearning = safelearningList.length;
  const finishedLearning = safeFinishedList.length;
  
  const result = {
    totalScore,
    currentLearning,
    finishedLearning,
  };
  
  console.log('Final calculated values:', result);
  console.log('=== End Calculate Debug ===');
  
  return result;
};

export const createInitialStudyRecord = async (userId, token) => {
  try {
    console.log('Creating initial study record for user:', userId);
    
    if (!userId || !token) {
      console.error('Missing userId or token for initial record creation');
      return false;
    }
    
    const payload = {
      userId: userId,
      currentLearning: 0,
      finishedLearning: 0,
      totalScore: 0,
    };
    
    const response = await fetch(`${API_URL}/study-record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Failed to create initial study record, status:', response.status);
      console.log('Error details:', errorData);
      return false;
    } else {
      const result = await response.json();
      console.log('✅ Initial study record created successfully:', result);
      return true;
    }
  } catch (error) {
    console.log('❌ Error creating initial study record:', error);
    return false;
  }
};

// New function to sync immediately when learning lists change
export const syncStudyRecordImmediate = async (userId, token, drugScores, learningList, finishedList) => {
  if (!userId || !token) {
    console.log('Cannot sync - user not logged in');
    return true; // Return true to prevent error propagation when not logged in
  }
  
  console.log('Immediate sync triggered');
  const studyData = calculateStudyData(drugScores, learningList, finishedList);
  return await syncStudyRecord(userId, token, studyData);
};

// Debounced sync function to prevent too many API calls
let syncTimeout;
export const syncStudyRecordDebounced = (userId, token, drugScores, learningList, finishedList, delay = 2000) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    await syncStudyRecordImmediate(userId, token, drugScores, learningList, finishedList);
  }, delay);
};

// Safe sync function that can be called from Redux actions
export const safeSyncStudyRecord = async (getState) => {
  try {
    const state = getState();
    const user = state.auth?.user;
    const token = state.auth?.token;
    const drugScores = state.drugScore?.scores || {};
    const learningList = state.learning?.learningList || [];
    const finishedList = state.learning?.finishedList || [];
    
    if (!user?.id || !token) {
      console.log('⚠️ Safe sync skipped - user not authenticated');
      return true; // Return true to indicate "success" (no error)
    }
    
    return await syncStudyRecordImmediate(user.id, token, drugScores, learningList, finishedList);
  } catch (error) {
    console.error('❌ Error in safe sync:', error);
    return false;
  }
};