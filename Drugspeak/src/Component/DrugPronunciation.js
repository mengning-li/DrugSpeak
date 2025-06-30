import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import IconButton from './IconButton';
import { SoundMap } from './SoundMap';
import SpeedHandle from './SpeedHandle';

const DrugPronunciation = ({ drugName, initialSpeed = 1.0 }) => {
  const validDrugName = drugName || '';
  
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingGender, setCurrentPlayingGender] = useState(null);
  const [audioModeConfigured, setAudioModeConfigured] = useState(false);
  const [hasSoundMap, setHasSoundMap] = useState(false);
  const [availableGenders, setAvailableGenders] = useState([]);

  // Helper function to find available genders with audio
  const getAvailableGenders = (drugName) => {
    if (!drugName || !SoundMap || !SoundMap[drugName] || !SoundMap[drugName].audio) {
      return [];
    }
    
    const drugAudio = SoundMap[drugName]?.audio || {};
    return Object.entries(drugAudio)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([gender]) => gender);
  };

  // Set up audio mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log("Setting up audio mode...");
        
        // Unload any existing sounds first
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }
        
        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        
        setAudioModeConfigured(true);
        console.log("Audio mode configured successfully");
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        if (sound) {
          console.log('Cleaning up sound on unmount');
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (e) {
            console.error("Error cleaning up sound:", e);
          }
        }
      };
      
      cleanup();
    };
  }, []);

  // Update when drug name changes
  useEffect(() => {
    // Check if drug has a SoundMap entry
    const drugHasSoundMap = !!(validDrugName && SoundMap && SoundMap[validDrugName]);
    setHasSoundMap(drugHasSoundMap);
    
    // Find available genders
    const genders = getAvailableGenders(validDrugName);
    setAvailableGenders(genders);
    
    console.log(`DrugPronunciation mounted for drug: ${validDrugName}`);
    console.log('Available audio:', SoundMap?.[validDrugName]?.audio);
    console.log('Available genders:', genders);
    
    // Clean up previous sounds when drug changes
    return () => {
      if (sound) {
        const cleanup = async () => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
          } catch (e) {
            console.error("Error cleaning up sound when drug changes:", e);
          }
        };
        cleanup();
      }
    };
  }, [validDrugName]);

  // Handle playing sound (used by both normal and debug buttons)
  const handlePlaySound = async (gender) => {
    console.log(`handlePlaySound called for ${gender}`);
    
    if (!validDrugName || !SoundMap || !SoundMap[validDrugName]) {
      Alert.alert("Error", "No valid drug name or sound map available");
      return;
    }
    
    try {
      const moduleId = SoundMap[validDrugName]?.audio[gender];
      
      if (!moduleId) {
        Alert.alert("Error", `No audio module found for ${gender}`);
        return;
      }
      
      console.log(`Playing ${gender} audio for ${validDrugName}`);
      
      // Make sure audio mode is configured
      if (!audioModeConfigured) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        setAudioModeConfigured(true);
      }
      
      // Clean up any existing sound
      if (sound) {
        try {
          console.log("Stopping previous sound");
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          
          // If the same gender was playing, just stop and return
          if (currentPlayingGender === gender && isPlaying) {
            setIsPlaying(false);
            setCurrentPlayingGender(null);
            return;
          }
        } catch (err) {
          console.error("Error stopping previous sound:", err);
        }
      }
      
      // Create and play sound
      const soundObject = new Audio.Sound();
      
      try {
        await soundObject.loadAsync(moduleId);
        await soundObject.setVolumeAsync(1.0);
        await soundObject.setRateAsync(playbackSpeed, true);
        await soundObject.playAsync();
        
        // Update state
        setSound(soundObject);
        setIsPlaying(true);
        setCurrentPlayingGender(gender);
        
        // Set up completion handler
        soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log("Playback finished");
            setIsPlaying(false);
            setCurrentPlayingGender(null);
            soundObject.unloadAsync();
            setSound(null);
          }
        });
      } catch (err) {
        console.error("Error playing sound:", err);
        Alert.alert("Playback Error", `Error playing sound: ${err.message}`);
      }
    } catch (error) {
      console.error("General error:", error);
      Alert.alert("Error", `General error: ${error.message}`);
    }
  };
  
  // Try a remote sound test
  const testRemoteAudio = async () => {
    try {
      console.log("Testing with remote audio file");
      
      // Clean up any existing sound
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        } catch (err) {
          console.error("Error cleaning up previous sound:", err);
        }
      }
      
      // Create and play remote sound
      const { sound: remoteSound } = await Audio.Sound.createAsync(
        { uri: 'https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3' },
        { shouldPlay: true, volume: 1.0 }
      );
      
      console.log("Remote sound created, should be playing");
      setSound(remoteSound);
      
      // Set up completion handler
      remoteSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log("Remote playback finished");
          remoteSound.unloadAsync();
          setSound(null);
        }
      });
      
      Alert.alert("Remote Audio", "Remote audio should be playing now. Do you hear anything?");
    } catch (error) {
      console.error("Remote audio error:", error);
      Alert.alert("Remote Audio Error", `Error: ${error.message}`);
    }
  };

  // Handle speed change
  const handleChangeSpeed = async (speed) => {
    console.log(`Changing speed to ${speed}`);
    setPlaybackSpeed(speed);
    if (sound && isPlaying) {
      try {
        await sound.setRateAsync(speed, true);
        console.log('Speed changed successfully');
      } catch (error) {
        console.error('Error changing speed:', error);
      }
    }
  };

  // Keep some debug capabilities but make them less prominent
  const shouldShowDebug = true; // Set to false to hide debug buttons in production

  // Show message if no valid drug or no sound map data
  if (!validDrugName || !hasSoundMap) {
    return (
      <View style={styles.noPronunciationContainer}>
        <Text style={styles.noPronunciationText}>
          No pronunciation available for this drug.
        </Text>
        {shouldShowDebug && (
          <TouchableOpacity 
            style={styles.smallDebugButton}
            onPress={testRemoteAudio}
          >
            <Text style={styles.smallDebugButtonText}>Test Audio System</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pronunciationContainer}>
        {availableGenders.length === 0 ? (
          <View style={styles.noPronunciationContainer}>
            <Text style={styles.noPronunciationText}>
              No pronunciation available for this drug.
            </Text>
          </View>
        ) : (
          availableGenders.map((gender) => (
            <View key={gender} style={styles.pronunciationRow}>
              {/* Normal TouchableOpacity wrapping IconButton - make it bigger for easier touch */}
              <IconButton
                iconName={
                  currentPlayingGender === gender && isPlaying
                    ? "pause-outline"
                    : "volume-high-outline"
                }
                iconSize={24}
                iconColor="black"
                title=""
                style={styles.playButton}
                onPress={() => handlePlaySound(gender)}
              />

              <Text style={styles.pronunciationText}>{validDrugName}</Text>

              <IconButton
                iconName={gender === "female" ? "female-outline" : "male-outline"}
                iconSize={24}
                iconColor={gender === "female" ? "#e91e63" : "#2196f3"}
                title=""
                style={[styles.genderIcon, { backgroundColor: "transparent" }]}
              />

              <SpeedHandle
                currentSpeed={playbackSpeed}
                onSpeedChange={handleChangeSpeed}
              />
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  pronunciationContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pronunciationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  genderIcon: {
    marginRight: 15,
  },
  noPronunciationContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  noPronunciationText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 15,
  },
  playButton: {
    marginRight: 15,
    padding: 10,
    marginLeft: -5,
    backgroundColor: "transparent",
  },
});

export default DrugPronunciation;