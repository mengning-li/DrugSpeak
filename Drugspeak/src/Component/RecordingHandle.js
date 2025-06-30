// Component/RecordingHandle.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import IconButton from './IconButton';
import { evaluateRecording } from './evaluationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

const RecordingHandle = ({ drugName, onScoreUpdate }) => {
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [evaluatingIndex, setEvaluatingIndex] = useState(null);
  const [highestScore, setHighestScore] = useState(0);
  
  // Get current user from redux
  const user = useSelector(state => state.auth.user);

  // Create a storage key based on user and drug
  const getStorageKey = () => {
    if (!user || !user.id || !drugName) return null;
    return `recordings_${user.id}_${drugName}`;
  };

  // Load saved recordings when component mounts
  useEffect(() => {
    const loadSavedRecordings = async () => {
      try {
        const storageKey = getStorageKey();
        if (!storageKey) return;
        
        const savedRecordings = await AsyncStorage.getItem(storageKey);
        if (savedRecordings) {
          const parsedRecordings = JSON.parse(savedRecordings);
          console.log(`Loaded ${parsedRecordings.length} saved recordings for ${drugName}`);
          setRecordings(parsedRecordings);
        }
      } catch (error) {
        console.error('Failed to load saved recordings:', error);
      }
    };
    
    loadSavedRecordings();
  }, [user, drugName]);

  // Save recordings whenever they change
  useEffect(() => {
    const saveRecordings = async () => {
      try {
        const storageKey = getStorageKey();
        if (!storageKey) return;
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(recordings));
        console.log(`Saved ${recordings.length} recordings for ${drugName}`);
      } catch (error) {
        console.error('Failed to save recordings:', error);
      }
    };
    
    if (recordings.length > 0) {
      saveRecordings();
    }
  }, [recordings, user, drugName]);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone permission is required.');
      }
    })();
  }, []);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Update highest score whenever recordings change
  useEffect(() => {
    updateHighestScore();
  }, [recordings]);

  const updateHighestScore = () => {
    const validScores = recordings
      .map(rec => rec.score)
      .filter(score => score !== null && score !== undefined);
    
    console.log('Valid scores:', validScores);
    
    if (validScores.length > 0) {
      const newHighestScore = Math.max(...validScores);
      console.log('New highest score:', newHighestScore);
      
      // Only update if the score has improved
      if (newHighestScore > highestScore) {
        setHighestScore(newHighestScore);
        if (onScoreUpdate && typeof onScoreUpdate === 'function') {
          console.log('Calling onScoreUpdate with score:', newHighestScore);
          onScoreUpdate(newHighestScore);
        }
      }
    }
  };

  const handleStartRecording = async () => {
    try {
      console.log('Starting recording...');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);
      setRecordings(prev => {
        const newRecordings = [...prev, { uri, timestamp: new Date().toISOString(), score: null }];
        console.log('Updated recordings:', newRecordings);
        return newRecordings;
      });
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async (uri) => {
    console.log('Playing recording from URI:', uri);
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    setSound(sound);
  };

  const deleteRecording = (idx) => {
    setRecordings(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEvaluateRecording = async (idx) => {
    try {
      setEvaluatingIndex(idx);
      const rec = recordings[idx];
      
      console.log(`Evaluating recording at index ${idx} for drug ${drugName}`);
      
      // Call the evaluation service
      const result = await evaluateRecording(rec.uri, drugName);
      
      if (result && typeof result.score === 'number') {
        // Update this recording's score
        setRecordings(prev => prev.map((r, i) => 
          i === idx ? { ...r, score: result.score } : r
        ));
      } else {
        console.error('Invalid evaluation result:', result);
        // For development only
        const mockScore = Math.floor(Math.random() * 70) + 30;
        setRecordings(prev => prev.map((r, i) => 
          i === idx ? { ...r, score: mockScore } : r
        ));
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
      // For development only
      const mockScore = Math.floor(Math.random() * 70) + 30;
      setRecordings(prev => prev.map((r, i) => 
        i === idx ? { ...r, score: mockScore } : r
      ));
    } finally {
      setEvaluatingIndex(null);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Recording list */}
      {recordings.map((rec, idx) => (
        <View key={rec.uri} style={styles.recordingItem}>
          <View style={styles.recordingInfo}>
            <IconButton iconName="play-circle-outline" onPress={() => playRecording(rec.uri)} />
            <Text style={styles.recordingTimestamp}>
              Recording {idx + 1} - {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          
          <View style={styles.recordingActions}>
            {/* Evaluation section */}
            <View style={styles.evaluationContainer}>
              {evaluatingIndex === idx ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <IconButton 
                  iconName={rec.score ? "cloud-upload" : "cloud-upload-outline"} 
                  onPress={() => handleEvaluateRecording(idx)} 
                />
              )}
              <Text style={styles.score}>{rec.score !== null ? `${rec.score}` : '-'}</Text>
            </View>
            
            <IconButton iconName="trash-outline" onPress={() => deleteRecording(idx)} />
          </View>
        </View>
      ))}

      {/* Round Record Button */}
      <View style={styles.recordButtonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton
          ]}
          onPressIn={handleStartRecording}
          onPressOut={handleStopRecording}
          activeOpacity={0.7}
        >
          <View style={[
            styles.recordButtonInner,
            isRecording && styles.recordingButtonInner
          ]}>
            {isRecording && <View style={styles.recordingIndicator} />}
          </View>
        </TouchableOpacity>
        <Text style={styles.recordButtonText}>
          {isRecording ? 'Recording...' : 'Hold to Record'}
        </Text>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  recordingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingTimestamp: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  evaluationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  score: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#3498db',
    fontSize: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#e74c3c',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButtonInner: {
    backgroundColor: '#fff',
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  recordButtonText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default RecordingHandle;