// Component/evaluationService.js
const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual API server URL

export const evaluateRecording = async (audioUri, drugName, gender = null) => {
  try {
    console.log('Evaluating recording with URI:', audioUri);
    console.log('Drug name for evaluation:', drugName);
    
    // For development/testing, we'll use mock data
    // Simulate server processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a score between 30-95
    const baseScore = drugName ? 75 : 60;
    const variability = 20;
    const randomFactor = Math.random() * variability * 2 - variability;
    const mockScore = Math.min(95, Math.max(30, Math.round(baseScore + randomFactor)));
    
    console.log(`Generated mock score: ${mockScore} for drug: ${drugName}`);
    return { score: mockScore };
    
  } catch (error) {
    console.error('Evaluation service error:', error);
    return { score: Math.floor(Math.random() * 70) + 30 };
  }
};

// New function to save study record
export const saveStudyRecord = async (userId, drugId, score) => {
  try {
    const response = await fetch(`${API_BASE_URL}/study-record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        drugId,
        score,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Study record saved:', result);
    return result;
  } catch (error) {
    console.error('Failed to save study record:', error);
    // Return a mock success response for development
    return { success: true, message: 'Mock study record saved' };
  }
};

// New function to get user's study records
export const getUserStudyRecords = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/study-record/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('User study records retrieved:', result);
    return result;
  } catch (error) {
    console.error('Failed to get user study records:', error);
    // Return mock data for development
    return [
      { drugId: 'drug1', score: 85, timestamp: new Date().toISOString() },
      { drugId: 'drug2', score: 72, timestamp: new Date(Date.now() - 86400000).toISOString() },
    ];
  }
};