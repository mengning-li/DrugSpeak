import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { selectUser, logout, updateUserSuccess } from '../redux/authSlice';
import { clearUserData } from '../redux/learningSlice';
import { clearAllScores } from '../redux/drugScoreSlice';

const API_URL = 'http://localhost:3000';

const MyProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(state => state.auth.token);
  
  // State for backend data
  const [backendStats, setBackendStats] = useState({
    currentLearning: 0,
    finishedLearning: 0,
    totalScore: 0
  });
  const [loading, setLoading] = useState(false);

  // Fetch user's current data from backend
  const fetchUserStats = async () => {
    if (!user?.id || !token) return;
    
    setLoading(true);
    try {
      console.log('Fetching user stats from backend...');
      
      // Fetch user's study record from backend
      const response = await fetch(`${API_URL}/study-record/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Backend study data:', data);
        
        // Update user info from study record (includes updated username)
        updateUserFromStudyRecord(data);
        
        setBackendStats({
          currentLearning: data.currentLearning || 0,
          finishedLearning: data.finishedLearning || 0,
          totalScore: data.totalScore || 0
        });
      } else if (response.status === 404) {
        // User doesn't have study record yet
        console.log('No study record found for user');
        setBackendStats({
          currentLearning: 0,
          finishedLearning: 0,
          totalScore: 0
        });
      } else {
        console.error('Failed to fetch study record');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user data from study record response (it includes user info)
  const updateUserFromStudyRecord = (studyData) => {
    if (studyData.user) {
      console.log('Updating user from study record:', studyData.user);
      
      // Update Redux with fresh user data from study record
      dispatch(updateUserSuccess({ user: studyData.user }));
      
      // Also update AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(studyData.user))
        .catch(error => console.error('Error saving user to storage:', error));
    }
  };

  // Fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('MyProfile focused - fetching fresh data');
      fetchUserStats();
    }, [user?.id, token])
  );

  const handleSignOut = async () => {
    try {
      // Clear stored token and user data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_learning_list');
      await AsyncStorage.removeItem('user_finished_list');
      
      // Clear Redux state
      dispatch(clearAllScores());
      dispatch(clearUserData());
      dispatch(logout());
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdate = () => {
    navigation.navigate('EditProfile');
  };

  // Use the actual user data, with fallbacks
  const userName = user?.username || user?.name || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userGender = user?.gender ? 
    user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 
    'Not specified';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Gender:</Text>
          <Text style={styles.value}>{userGender}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Statistics</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="book-outline" size={24} color="#3498db" />
              <Text style={styles.statNumber}>{backendStats.currentLearning}</Text>
              <Text style={styles.statLabel}>Current Learning</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#27ae60" />
              <Text style={styles.statNumber}>{backendStats.finishedLearning}</Text>
              <Text style={styles.statLabel}>Finished</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={24} color="#f39c12" />
              <Text style={styles.statNumber}>{backendStats.totalScore}</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  updateButton: {
    flex: 0.48,
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
  },
  signOutButton: {
    flex: 0.48,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MyProfile;